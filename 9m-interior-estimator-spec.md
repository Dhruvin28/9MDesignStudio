# 9M Design Studio — Interior Cost Estimator

**Status:** Implementation-ready functional and technical specification (v1.0)  
**Target:** https://9mdesignstudio.com/  
**Reference:** Livspace multi-step interior-price-calculator quiz  
**Important:** The reference site's complete interactive flow, APIs, exact pricing formula, and screen order have **not** been independently verified. The implementation below is an original, configurable equivalent—not a claim of an exact clone. All monetary values are placeholders until approved by 9M Design Studio.

## 1. Objective

Build a mobile-first, multi-step home-interior estimate wizard that qualifies prospects, provides a transparent **indicative** price range, and creates an actionable lead for 9M Design Studio. Support campaign attribution from Meta/Google ads, optional WhatsApp follow-up, and conversion analytics. Do not copy Livspace branding, text, or proprietary designs.

### Success metrics
- Wizard start → completion rate
- Step-by-step abandonment
- Qualified leads per channel and cost per qualified lead
- Estimate → consultation-booked conversion
- Estimate error against finalized quotes, tracked by pricing version

## 2. Customer journey

1. **Entry / campaign landing** — `Get an Estimate` CTA opens `/interior-cost-calculator`; capture UTM parameters and click IDs once.
2. **Property type** — Apartment / villa / independent house / other; 1, 2, 3, 4, or 5+ BHK.
3. **Location and size** — City, property area in sq ft, optional carpet/built-up area classification; prevent mixing area definitions in calculations.
4. **Rooms and scope** — Kitchen, living, bedrooms (count), bathrooms, wardrobes, foyer, pooja, balcony, other. Ask whether each room needs full interiors or selected work. Do not allow room count to exceed plausible BHK constraints without explanation.
5. **Package / quality** — Essential / Premium / Luxury; show *illustrative* inclusions and exclusions for each, maintained in CMS/config.
6. **Extras and timeline** — Civil work, false ceiling, lighting, painting, electrical, furniture, appliances, desired start date; new home vs renovation.
7. **Estimate preview** — Itemized low–high price range with assumptions, inclusions, exclusions, city and package. Optional PDF/email summary later.
8. **Lead capture** — Name, mobile, optional email, city and consent. Ask for contact details **after** showing indicative value where feasible. Phone OTP is optional and should be added only if spam/fraud warrants the conversion cost.
9. **Confirmation** — Lead ID, consultation CTA, WhatsApp deep link, next steps; submit events once.

### Navigation behavior
- Progress indicator, back/next buttons, validation per step, and edit-summary screen.
- Persist non-sensitive draft locally with expiration; server-side session when needed. Resume without losing selections.
- Keyboard accessible, screen-reader labeled, responsive for 320px+ screens.
- No forced login to estimate.
- Clearly distinguish a preliminary estimate from a binding quotation.

## 3. Example screens and validation

| Step | Fields | Validation / behavior |
|---|---|---|
| Property | propertyType, bhk | Required; BHK enum 1,2,3,4,5plus |
| Size | city, areaSqFt, areaType | City required; numeric area within configurable reasonable limits; show area-type definition |
| Rooms | selected rooms, counts, work scope | At least one selection; count positive; dependent questions appear only when relevant |
| Package | packageId | Required; show inclusions and material-grade notes |
| Extras | extras[], startWindow | Optional; clear price impacts |
| Estimate | low/high breakdown, caveats | Recomputed on server; never accept a client-supplied price |
| Contact | name, phone, email, consent | Normalize Indian phone numbers to E.164; optional email validated; explicit contact consent |

## 4. Pricing engine

**Do not use the simplistic `area × flat rate × room weights` prototype as the final commercial formula.** It can double-count room area and cannot represent actual cabinetry, carpentry, labor, material, and civil-work quantities. Instead use versioned line-item rules.

### Suggested formula

For each scope line item `i`:

`line_cost_i = quantity_i × unit_rate_i × material_multiplier_i × complexity_multiplier_i`

`subtotal = sum(line_cost_i) + selected_extra_costs + logistics + site_allowances`

`estimate_low = round(subtotal × low_uncertainty_factor)`

`estimate_high = round(subtotal × high_uncertainty_factor)`

Taxes and discounts should be explicitly shown and applied according to the approved business policy; never silently add them. City multipliers should be applied only to affected costs (e.g. labor/logistics), not indiscriminately to all materials.

### Pricing configuration example (ILLUSTRATIVE ONLY)

```json
{
  "pricingVersion": "2026-10-v1",
  "currency": "INR",
  "packages": {
    "essential": {"materialMultiplier": 1.0},
    "premium": {"materialMultiplier": 1.35},
    "luxury": {"materialMultiplier": 1.8}
  },
  "lineItems": {
    "kitchenCabinetry": {"unit": "running_ft", "baseRate": 12000},
    "wardrobe": {"unit": "sq_ft", "baseRate": 1800},
    "falseCeiling": {"unit": "sq_ft", "baseRate": 180},
    "painting": {"unit": "sq_ft", "baseRate": 40}
  },
  "uncertainty": {"low": 0.9, "high": 1.2}
}
```

**Critical:** These sample rates are arbitrary engineering fixtures, not market quotes or 9M pricing. Source actual rates from approved BOQs and vendor costs. Never infer cabinetry quantities directly from BHK alone without assumptions; either request approximate dimensions or show assumptions with a range.

### Pricing requirements
- Effective-dated, immutable pricing versions and audit trail.
- Support cities, packages, materials, quantities, extras, taxes, discounts and minimum project values.
- Price engine returns breakdown + assumptions + rule version; consistent results for identical inputs/version.
- Unit tests for each line-item rule and boundary case; regression fixtures from signed-off historical projects.
- Keep quote revision separate from the original estimate; store both.

## 5. Recommended architecture

**Pragmatic default:** Next.js + TypeScript + Tailwind for UI and API routes; PostgreSQL + Drizzle ORM; Zod validation; React Hook Form for steps. Deploy to existing infrastructure if suitable. If the current 9M site is static, deploy the calculator as an isolated Next.js app at a subdomain or reverse-proxy path rather than rebuilding the whole website.

```text
Visitor / Meta Ads
  -> 9mdesignstudio.com/interior-cost-calculator
  -> Next.js wizard (React Hook Form + Zod)
  -> POST /api/estimates/preview
  -> server-side pricing service (versioned rules)
  -> PostgreSQL (drafts, estimates, leads, attribution)
  -> POST /api/leads (idempotent)
  -> CRM / email / WhatsApp notification (async queue)
  -> GA4 + Meta Pixel / Conversions API (deduplicated)
```

For an existing Node/Fastify backend, keep the wizard in the frontend and implement the API routes in Fastify instead of adding a second backend. A queue is optional at low volume; start with a durable outbox and worker if delivery reliability matters.

### Suggested project structure

```text
src/
  app/interior-cost-calculator/page.tsx
  app/api/estimates/preview/route.ts
  app/api/leads/route.ts
  components/estimator/{Wizard,Progress,StepProperty,StepSize,StepRooms,StepPackage,StepExtras,EstimateSummary,LeadForm}.tsx
  features/estimator/{schema,types,steps,defaults,analytics}.ts
  server/pricing/{calculate,rule-repository,rounding}.ts
  server/leads/{service,notifications}.ts
  server/db/{schema,client}.ts
  lib/{attribution,consent,rate-limit}.ts
  tests/{pricing,api,e2e}/
```

## 6. API contract

### `POST /api/estimates/preview`
Request:
```json
{
  "propertyType": "apartment",
  "bhk": "2",
  "city": "Ahmedabad",
  "areaSqFt": 1000,
  "areaType": "carpet",
  "rooms": [{"type": "kitchen", "count": 1, "scope": "full"}, {"type": "bedroom", "count": 2, "scope": "wardrobe_only"}],
  "packageId": "premium",
  "extras": ["false_ceiling"],
  "projectType": "new_home"
}
```
Response:
```json
{
  "estimateId": "est_01EXAMPLE",
  "pricingVersion": "2026-10-v1",
  "currency": "INR",
  "low": 450000,
  "high": 620000,
  "breakdown": [{"label": "Kitchen", "low": 180000, "high": 230000}],
  "assumptions": ["Indicative cabinetry dimensions; subject to site measurement"],
  "exclusions": ["Appliances", "Unselected civil work"],
  "validUntil": "2026-11-15T00:00:00Z"
}
```
Numbers are response-shape examples, not computed from the sample request.

### `POST /api/leads`
Request:
```json
{
  "estimateId": "est_01EXAMPLE",
  "name": "Example Customer",
  "phone": "+919999999999",
  "email": null,
  "consent": {"contact": true, "marketing": false, "policyVersion": "v1"},
  "attribution": {"utm_source": "facebook_aiquire", "utm_medium": "aiquire_conversion", "utm_campaign": "campaign-id", "fbclid": "click-id"},
  "idempotencyKey": "random-uuid"
}
```
Response: `201 Created` with `{ "leadId": "lead_...", "status": "received" }`. Repeat requests with the same idempotency key return the same result, not duplicate leads.

### Additional endpoints
- `GET /api/estimates/:id` — signed/session-authorized access only; avoid exposing customer data via guessable IDs.
- `POST /api/consultations` — optional scheduling.
- `GET /api/estimator/config` — safe public options only; no private pricing margins or admin credentials.

## 7. Data model

| Table | Main fields |
|---|---|
| `estimator_sessions` | id, anonymous_token_hash, state_json, created_at, expires_at |
| `pricing_versions` | id, version, rules_json, effective_from, published_at, immutable_hash |
| `estimates` | id, session_id, pricing_version_id, input_json, breakdown_json, low_amount, high_amount, created_at |
| `leads` | id, estimate_id, name, phone_e164, email, status, created_at |
| `lead_consents` | id, lead_id, contact_opt_in, marketing_opt_in, policy_version, recorded_at |
| `lead_attribution` | lead_id, first_touch_json, last_touch_json, landing_url, created_at |
| `lead_events` | id, lead_id, event_type, metadata_json, created_at |
| `outbox_events` | id, event_type, payload_json, status, retry_count, created_at |

Use unique constraints on `estimateId + lead identity` where appropriate, and on idempotency keys. Encrypt or appropriately protect PII at rest, apply retention/deletion rules, and restrict CRM access by role.

## 8. Attribution and analytics

Capture first-touch and last-touch UTM fields, `fbclid`, `_fbc`, `_fbp` where legally permitted and available, plus landing URL/referrer. Do not blindly trust or replay user-supplied tracking values. Avoid putting PII in query strings, analytics events or logs.

Events:
- `estimator_view`
- `estimator_start`
- `estimator_step_completed` (`step_id`, `step_index`)
- `estimate_generated` (`estimate_id`, `pricing_version`, `value_range_bucket`)
- `lead_submitted` (`lead_id`)
- `consultation_requested`

Use a shared `event_id` to deduplicate Meta Pixel and server-side Conversions API events. Send only consent-appropriate data; define retention and consent rules for advertising cookies. Never fire a purchase event for a mere estimate.

## 9. Security, reliability and UX

- Validate all inputs server-side with Zod; allowlist enum values and extras.
- Add IP/session rate limits, bot mitigation and replay/idempotency protection.
- Keep admin pricing controls behind RBAC and audit logging.
- Do not expose vendor costs or internal margins in public API responses.
- Debounce recalculation and cache safe configuration by pricing version.
- Accessibility: focus management on step changes, visible error summaries, semantic fieldsets and full keyboard operation.
- Performance goals: good Core Web Vitals on mobile; lazy-load images; keep calculator JavaScript lean.
- Reliability: queue notifications, retries with backoff, alert on delivery failures.
- Observability: correlation IDs, structured logs with PII redaction, funnel dashboards, API error-rate monitoring.

## 10. Acceptance criteria

- [ ] CTA opens the wizard with campaign attribution preserved.
- [ ] Wizard supports mobile and desktop, back navigation and draft restoration.
- [ ] Invalid/missing inputs show actionable inline errors.
- [ ] User can select BHK, area, rooms, package and optional extras.
- [ ] Server returns reproducible low/high estimate with itemization and assumptions.
- [ ] Estimate is clearly labeled indicative, with inclusions/exclusions.
- [ ] User can request consultation without a forced account registration.
- [ ] Lead submission is idempotent and persists consent separately.
- [ ] CRM/notification failure does not lose a successfully created lead.
- [ ] Analytics records step drop-offs and deduplicated conversions.
- [ ] Unit tests cover price rules; E2E tests cover happy path, back/edit, invalid input, refresh/resume and API failure.
- [ ] Legal/privacy review approves data handling, cookies and contact consent.

## 11. Delivery plan

**Phase 1 — MVP:** Approved pricing inputs and rules, 5–7 step wizard, estimate range, contact form, basic analytics, lead email/CRM delivery.

**Phase 2 — Conversion optimization:** WhatsApp follow-up, consultation scheduling, saved estimates, experiments, detailed price breakdown and dynamic room questions.

**Phase 3 — Operational tooling:** Pricing-rule admin panel, city/vendor rate management, CRM pipeline, actual-vs-estimated variance dashboard, PDF estimate export.

## 12. Decisions required before development

1. Which cities and project types does 9M serve?
2. Are rates based on room packages, actual BOQ quantities, or a hybrid?
3. What are the approved package inclusions, minimum order values and price ranges?
4. Should the price appear before collecting the phone number?
5. Which CRM and WhatsApp provider (if any) will receive leads?
6. Is the current site static, React, WordPress, or another framework?
7. Which services and exclusions should be displayed explicitly?

## 13. Reference links

- [Livspace landing page](https://www.livspace.com/landing-page/home-interiors/ms-b_est_cd)
- [Livspace calculator entry](https://stage2.livspace.com/in/home-interior-price-calculator-quiz?welcome_page=false&auth=false)
- [9M Design Studio](https://9mdesignstudio.com/)

**Implementation note:** Use a real browser walkthrough or HAR capture to verify the competitor's exact question order and conditional transitions before attempting a pixel-perfect recreation. This specification intentionally focuses on matching the *business capability*, not undocumented proprietary implementation details.

/* ----------------------------------------------------------------------------------------
* 9M Design Studio - Interior Cost Estimator
* Plain JavaScript, no framework. Runs fully in the browser (static site).
*
* HOW TO UPDATE PRICES: edit the PRICING object below. Every rate is INR and is an
* INDICATIVE placeholder until approved by 9M Design Studio. Bump `version` when you change it.
* ---------------------------------------------------------------------------------------- */
(function () {
	'use strict';

	/* ============================================================
	   1. CONFIGURATION
	   ============================================================ */

	var BUSINESS = {
		whatsappNumber: '918200954409',          // country code + number, digits only
		email: 'miluvshah@gmail.com',
		phoneDisplay: '+91 8200954409'
	};

	var PRICING = {
		version: '2026-10-v1',
		currency: 'INR',
		uncertainty: { low: 0.9, high: 1.2 },
		minimumProjectValue: 250000,

		/* multipliers applied to carpentry / modular items */
		packages: {
			essential: { label: 'Essential', material: 1.0,  finish: 1.0 },
			premium:   { label: 'Premium',   material: 1.35, finish: 1.15 },
			luxury:    { label: 'Luxury',    material: 1.8,  finish: 1.3 }
		},

		/* city multipliers apply ONLY to labour / logistics share, not to materials */
		cities: {
			ahmedabad:  { label: 'Ahmedabad',          labour: 1.0,  logistics: 15000 },
			gandhinagar:{ label: 'Gandhinagar',        labour: 1.02, logistics: 18000 },
			vadodara:   { label: 'Vadodara',           labour: 1.03, logistics: 25000 },
			surat:      { label: 'Surat',              labour: 1.03, logistics: 30000 },
			rajkot:     { label: 'Rajkot',             labour: 1.05, logistics: 32000 },
			gujarat:    { label: 'Other city in Gujarat', labour: 1.06, logistics: 35000 },
			india:      { label: 'Outside Gujarat',    labour: 1.12, logistics: 60000 }
		},

		/* share of a carpentry line that is labour (used for city multiplier) */
		labourShare: 0.3,

		/* renovation adds dismantling / making-good complexity */
		projectType: {
			new_home:   { label: 'New home',   complexity: 1.0 },
			renovation: { label: 'Renovation', complexity: 1.08 }
		},

		/* converts the entered area to usable carpet area */
		areaType: {
			carpet:      { label: 'Carpet area',       factor: 1.0 },
			built_up:    { label: 'Built-up area',     factor: 0.85 },
			super_built: { label: 'Super built-up area', factor: 0.72 }
		},

		/* assumed cabinetry quantities by BHK (so we never price BHK alone) */
		kitchenRunningFt:  { '1': 14, '2': 18, '3': 22, '4': 26, '5plus': 30 },
		wardrobeSqFtEach:  { '1': 42, '2': 49, '3': 56, '4': 63, '5plus': 70 },

		/* room line items: base rates in INR */
		rooms: {
			kitchen:  { label: 'Modular Kitchen',  icon: 'fa-kitchen-set', countable: false,
				full:    { desc: 'Cabinets, countertop, backsplash, tall unit, accessories', runningFtRate: 9500, fixed: 60000 },
				partial: { desc: 'Base and wall cabinets only',                               runningFtRate: 9500, fixed: 0 } },
			living:   { label: 'Living / Dining',  icon: 'fa-couch', countable: false,
				full:    { desc: 'TV unit, wall panelling, crockery unit, partition', fixed: 165000 },
				partial: { desc: 'TV unit and panel only',                           fixed: 70000 } },
			bedroom:  { label: 'Bedrooms',         icon: 'fa-bed', countable: true, max: 'bhk',
				full:    { desc: 'Wardrobe, bed back panel, side tables, study/dresser', wardrobeRate: 1500, fixed: 55000 },
				partial: { desc: 'Wardrobe only',                                         wardrobeRate: 1500, fixed: 0 } },
			bathroom: { label: 'Bathrooms',        icon: 'fa-bath', countable: true, max: 'bhkPlusOne',
				full:    { desc: 'Vanity, mirror unit, storage, fittings', fixed: 48000 },
				partial: { desc: 'Vanity and mirror only',                 fixed: 26000 } },
			foyer:    { label: 'Foyer / Entrance', icon: 'fa-door-open', countable: false,
				full:    { desc: 'Shoe cabinet, console, wall feature', fixed: 45000 },
				partial: { desc: 'Shoe cabinet only',                   fixed: 22000 } },
			pooja:    { label: 'Pooja Unit',       icon: 'fa-hands-praying', countable: false,
				full:    { desc: 'Pooja unit with storage and backlit panel', fixed: 55000 },
				partial: { desc: 'Wall-mounted pooja unit',                   fixed: 28000 } },
			balcony:  { label: 'Balcony / Utility',icon: 'fa-seedling', countable: false,
				full:    { desc: 'Seating, planters, utility storage', fixed: 35000 },
				partial: { desc: 'Utility storage only',              fixed: 18000 } },
			other:    { label: 'Study / Other Room', icon: 'fa-chair', countable: true, max: 3,
				full:    { desc: 'Study table, storage, display unit', fixed: 60000 },
				partial: { desc: 'Study table only',                   fixed: 28000 } }
		},

		/* extras: area based (per sq ft of carpet area x coverage) or fixed */
		extras: {
			false_ceiling: { label: 'False Ceiling',      icon: 'fa-layer-group', perSqFt: 140, coverage: 0.6,  usesFinish: true,  desc: 'Gypsum ceiling with cove in living and bedrooms' },
			painting:      { label: 'Painting',           icon: 'fa-paint-roller', perSqFt: 32, coverage: 3.2,  usesFinish: true,  desc: 'Premium emulsion on all walls and ceilings' },
			electrical:    { label: 'Electrical Work',    icon: 'fa-bolt',         perSqFt: 90, coverage: 1.0,  usesFinish: false, desc: 'New points, wiring, switches and boards' },
			lighting:      { label: 'Decorative Lighting',icon: 'fa-lightbulb',    perSqFt: 55, coverage: 1.0,  usesFinish: true,  desc: 'Profile lights, pendants and accent lights' },
			civil:         { label: 'Civil Work',         icon: 'fa-trowel-bricks',perSqFt: 260, coverage: 0.25, usesFinish: false, desc: 'Flooring changes, wall alterations, plumbing' },
			furniture:     { label: 'Loose Furniture',    icon: 'fa-couch',        perSqFt: 120, coverage: 1.0,  usesFinish: true,  desc: 'Sofa, dining set, beds, chairs' },
			appliances:    { label: 'Kitchen Appliances', icon: 'fa-fire-burner',  fixed: 110000, usesFinish: true, desc: 'Hob, chimney, built-in oven, microwave' }
		},

		siteAllowanceShare: 0.03, // of carpentry subtotal

		inclusions: [
			'Design consultation and 3D visualisation',
			'Site measurement and detailed drawings',
			'Modular carpentry with branded hardware',
			'Project management and supervision',
			'Installation and handover cleaning'
		],
		exclusionsAlways: [
			'GST (18%) shown separately in the final quotation',
			'Unselected civil, electrical or painting work',
			'Soft furnishings, curtains and décor accessories',
			'Society deposits and approvals'
		]
	};

	var AREA_LIMITS = { min: 300, max: 12000 };

	var STEPS = [
		{ id: 'property', label: 'Property' },
		{ id: 'size',     label: 'Size' },
		{ id: 'rooms',    label: 'Rooms' },
		{ id: 'package',  label: 'Package' },
		{ id: 'extras',   label: 'Extras' },
		{ id: 'estimate', label: 'Estimate' },
		{ id: 'contact',  label: 'Contact' }
	];

	var STORAGE_KEY = 'nm_estimator_draft_v1';
	var ATTRIB_KEY  = 'nm_estimator_attribution';
	var DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

	/* ============================================================
	   2. STATE
	   ============================================================ */

	var defaultState = function () {
		return {
			step: 0,
			propertyType: '',
			bhk: '',
			city: '',
			areaSqFt: '',
			areaType: 'carpet',
			projectType: '',
			rooms: {},          // { kitchen: {count:1, scope:'full'} }
			packageId: '',
			extras: [],
			startWindow: '',
			name: '',
			phone: '',
			email: '',
			consent: false
		};
	};

	var state = defaultState();
	var estimate = null;
	var restored = false;

	/* ============================================================
	   3. HELPERS
	   ============================================================ */

	function $(sel, ctx) { return (ctx || document).querySelector(sel); }
	function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

	function formatINR(n) {
		return '₹' + Math.round(n).toLocaleString('en-IN');
	}

	function formatLakh(n) {
		var l = n / 100000;
		return (l >= 100 ? (l / 100).toFixed(2) + ' Cr' : l.toFixed(l < 10 ? 2 : 1) + ' L');
	}

	function roundTo(n, step) {
		return Math.round(n / step) * step;
	}

	function bhkNumber() {
		return state.bhk === '5plus' ? 5 : (parseInt(state.bhk, 10) || 0);
	}

	function roomMax(key) {
		var def = PRICING.rooms[key];
		if (!def.countable) return 1;
		if (def.max === 'bhk') return Math.max(1, bhkNumber() + (state.bhk === '5plus' ? 2 : 0));
		if (def.max === 'bhkPlusOne') return Math.max(1, bhkNumber() + 1 + (state.bhk === '5plus' ? 2 : 0));
		return def.max;
	}

	function saveDraft() {
		try {
			var copy = {};
			for (var k in state) if (state.hasOwnProperty(k)) copy[k] = state[k];
			// Never persist contact details locally
			copy.name = ''; copy.phone = ''; copy.email = ''; copy.consent = false;
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ expires: Date.now() + DRAFT_TTL_MS, state: copy }));
		} catch (e) { /* storage unavailable */ }
	}

	function loadDraft() {
		try {
			var raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			var parsed = JSON.parse(raw);
			if (!parsed || !parsed.expires || parsed.expires < Date.now()) { localStorage.removeItem(STORAGE_KEY); return null; }
			return parsed.state;
		} catch (e) { return null; }
	}

	function clearDraft() {
		try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
	}

	function captureAttribution() {
		try {
			var params = new URLSearchParams(window.location.search);
			var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
			var found = {};
			var any = false;
			keys.forEach(function (k) {
				var v = params.get(k);
				if (v) { found[k] = String(v).slice(0, 120); any = true; }
			});
			var existing = JSON.parse(sessionStorage.getItem(ATTRIB_KEY) || 'null');
			if (any) {
				var merged = existing || { first: found, landing: location.pathname, referrer: document.referrer || '' };
				merged.last = found;
				sessionStorage.setItem(ATTRIB_KEY, JSON.stringify(merged));
				return merged;
			}
			return existing;
		} catch (e) { return null; }
	}

	function track(eventName, params) {
		var payload = Object.assign({ event: eventName }, params || {});
		try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(payload); } catch (e) {}
		try { if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {}); } catch (e) {}
		try { if (typeof window.fbq === 'function' && eventName === 'lead_submitted') window.fbq('track', 'Lead', {}, { eventID: params.lead_id }); } catch (e) {}
	}

	function uid(prefix) {
		var s = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
		return prefix + '_' + s.toUpperCase();
	}

	function normalisePhone(raw) {
		var digits = String(raw || '').replace(/\D/g, '');
		if (digits.length === 10 && /^[6-9]/.test(digits)) return '+91' + digits;
		if (digits.length === 12 && digits.indexOf('91') === 0 && /^[6-9]/.test(digits.slice(2))) return '+' + digits;
		if (digits.length === 11 && digits.indexOf('0') === 0 && /^[6-9]/.test(digits.slice(1))) return '+91' + digits.slice(1);
		return null;
	}

	/* ============================================================
	   4. PRICING ENGINE
	   ============================================================ */

	function calculateEstimate(s) {
		var pkg = PRICING.packages[s.packageId] || PRICING.packages.essential;
		var city = PRICING.cities[s.city] || PRICING.cities.ahmedabad;
		var project = PRICING.projectType[s.projectType] || PRICING.projectType.new_home;
		var areaFactor = (PRICING.areaType[s.areaType] || PRICING.areaType.carpet).factor;
		var carpetArea = Math.round((parseFloat(s.areaSqFt) || 0) * areaFactor);

		var lines = [];
		var assumptions = [];
		var carpentrySubtotal = 0;

		function carpentryLine(label, detail, base) {
			var material = base * (1 - PRICING.labourShare) * pkg.material;
			var labour   = base * PRICING.labourShare * city.labour;
			var cost = (material + labour) * project.complexity;
			carpentrySubtotal += cost;
			lines.push({ label: label, detail: detail, amount: cost, group: 'carpentry' });
		}

		Object.keys(PRICING.rooms).forEach(function (key) {
			var sel = s.rooms[key];
			if (!sel) return;
			var def = PRICING.rooms[key];
			var rule = def[sel.scope] || def.full;
			var count = def.countable ? (sel.count || 1) : 1;
			var base = 0;
			var detail = rule.desc;

			if (key === 'kitchen') {
				var rft = PRICING.kitchenRunningFt[s.bhk] || 18;
				base = rft * rule.runningFtRate + rule.fixed;
				assumptions.push('Kitchen cabinetry assumed at about ' + rft + ' running ft for a ' + bhkLabel(s.bhk) + '.');
			} else if (key === 'bedroom') {
				var wsq = PRICING.wardrobeSqFtEach[s.bhk] || 49;
				base = (wsq * rule.wardrobeRate + rule.fixed) * count;
				assumptions.push('Wardrobes assumed at about ' + wsq + ' sq ft per bedroom (' + count + ' bedroom' + (count > 1 ? 's' : '') + ').');
			} else {
				base = rule.fixed * count;
			}
			carpentryLine(def.label + (count > 1 ? ' × ' + count : ''), detail + (sel.scope === 'partial' ? ' (selected work)' : ''), base);
		});

		var extrasSubtotal = 0;
		(s.extras || []).forEach(function (key) {
			var ex = PRICING.extras[key];
			if (!ex) return;
			var base = ex.fixed ? ex.fixed : carpetArea * ex.perSqFt * ex.coverage;
			var cost = base * (ex.usesFinish ? pkg.finish : 1);
			if (key === 'civil' || key === 'electrical' || key === 'painting') cost *= city.labour; // labour-heavy
			if (key === 'civil' && s.projectType === 'renovation') cost *= 1.15;
			extrasSubtotal += cost;
			lines.push({ label: ex.label, detail: ex.desc + (ex.fixed ? '' : ' (based on ' + carpetArea.toLocaleString('en-IN') + ' sq ft)'), amount: cost, group: 'extras' });
		});

		var siteAllowance = carpentrySubtotal * PRICING.siteAllowanceShare;
		var logistics = city.logistics;
		lines.push({ label: 'Logistics & site allowances', detail: 'Transport, protection, scaffolding and incidentals', amount: siteAllowance + logistics, group: 'other' });

		var subtotal = carpentrySubtotal + extrasSubtotal + siteAllowance + logistics;
		var belowMinimum = false;
		if (subtotal < PRICING.minimumProjectValue) {
			belowMinimum = true;
			subtotal = PRICING.minimumProjectValue;
		}

		var low = roundTo(subtotal * PRICING.uncertainty.low, 5000);
		var high = roundTo(subtotal * PRICING.uncertainty.high, 5000);

		if (areaFactor !== 1) assumptions.push('Entered ' + PRICING.areaType[s.areaType].label.toLowerCase() + ' converted to about ' + carpetArea.toLocaleString('en-IN') + ' sq ft carpet area for area-based items.');
		assumptions.push(pkg.label + ' package materials and finishes; final brand selection may change the price.');
		if (s.projectType === 'renovation') assumptions.push('Renovation allowance included for dismantling and making good.');
		if (city.labour !== 1) assumptions.push('Labour and logistics adjusted for ' + city.label + '.');
		if (belowMinimum) assumptions.push('Estimate raised to our minimum project value of ' + formatINR(PRICING.minimumProjectValue) + '.');
		assumptions.push('All quantities are indicative and subject to site measurement.');

		var exclusions = PRICING.exclusionsAlways.slice();
		Object.keys(PRICING.extras).forEach(function (key) {
			if (s.extras.indexOf(key) === -1) exclusions.push(PRICING.extras[key].label);
		});

		return {
			estimateId: uid('EST'),
			pricingVersion: PRICING.version,
			currency: PRICING.currency,
			carpetArea: carpetArea,
			low: low,
			high: high,
			lines: lines.map(function (l) {
				return { label: l.label, detail: l.detail, low: roundTo(l.amount * PRICING.uncertainty.low, 1000), high: roundTo(l.amount * PRICING.uncertainty.high, 1000) };
			}),
			assumptions: assumptions,
			inclusions: PRICING.inclusions,
			exclusions: exclusions,
			generatedAt: new Date().toISOString()
		};
	}

	function bhkLabel(bhk) {
		return bhk === '5plus' ? '5+ BHK' : bhk + ' BHK';
	}

	/* ============================================================
	   5. RENDERING
	   ============================================================ */

	var els = {};

	function cacheEls() {
		els.form = $('#estimatorForm');
		els.steps = $$('.est-step');
		els.progressBar = $('#estProgressBar');
		els.progressStep = $('#estProgressStep');
		els.progressLabel = $('#estProgressLabel');
		els.stepsList = $$('#estStepsList li');
		els.back = $('#estBack');
		els.next = $('#estNext');
		els.nav = $('#estNav');
		els.error = $('#estError');
		els.resume = $('#estResume');
		els.card = $('#estCard');
	}

	function buildRoomsUI() {
		var wrap = $('#estRooms');
		wrap.innerHTML = '';
		Object.keys(PRICING.rooms).forEach(function (key) {
			var def = PRICING.rooms[key];
			var row = document.createElement('div');
			row.className = 'est-room';
			row.setAttribute('data-room', key);
			row.innerHTML =
				'<label class="est-room-check">' +
					'<input type="checkbox" name="room_' + key + '" value="' + key + '">' +
					'<span><strong><i class="fa-solid ' + def.icon + '" aria-hidden="true"></i>&nbsp; ' + def.label + '</strong>' +
					'<small>' + def.full.desc + '</small></span>' +
				'</label>' +
				'<div class="est-room-controls">' +
					'<div class="est-counter" ' + (def.countable ? '' : 'style="visibility:hidden"') + ' aria-label="' + def.label + ' count">' +
						'<button type="button" class="est-dec" aria-label="Decrease ' + def.label + '">&minus;</button>' +
						'<output>1</output>' +
						'<button type="button" class="est-inc" aria-label="Increase ' + def.label + '">+</button>' +
					'</div>' +
					'<div class="est-scope" role="radiogroup" aria-label="' + def.label + ' scope">' +
						'<label><input type="radio" name="scope_' + key + '" value="full" checked><span>Full interiors</span></label>' +
						'<label><input type="radio" name="scope_' + key + '" value="partial"><span>Selected work</span></label>' +
					'</div>' +
				'</div>';
			wrap.appendChild(row);
		});
	}

	function buildExtrasUI() {
		var wrap = $('#estExtras');
		wrap.innerHTML = '';
		Object.keys(PRICING.extras).forEach(function (key) {
			var ex = PRICING.extras[key];
			var label = document.createElement('label');
			label.className = 'est-option';
			label.innerHTML =
				'<input type="checkbox" name="extras" value="' + key + '">' +
				'<span class="est-option-box"><i class="fa-solid ' + ex.icon + '" aria-hidden="true"></i><strong>' + ex.label + '</strong><small>' + ex.desc + '</small></span>';
			wrap.appendChild(label);
		});
	}

	function buildCityUI() {
		var sel = $('#estCity');
		sel.innerHTML = '<option value="">Select your city</option>';
		Object.keys(PRICING.cities).forEach(function (key) {
			var o = document.createElement('option');
			o.value = key; o.textContent = PRICING.cities[key].label;
			sel.appendChild(o);
		});
	}

	function syncFormFromState() {
		$$('input[name="propertyType"]').forEach(function (i) { i.checked = i.value === state.propertyType; });
		$$('input[name="bhk"]').forEach(function (i) { i.checked = i.value === state.bhk; });
		$('#estCity').value = state.city;
		$('#estArea').value = state.areaSqFt;
		$$('input[name="areaType"]').forEach(function (i) { i.checked = i.value === state.areaType; });
		$$('input[name="projectType"]').forEach(function (i) { i.checked = i.value === state.projectType; });
		$$('input[name="packageId"]').forEach(function (i) { i.checked = i.value === state.packageId; });
		$$('input[name="extras"]').forEach(function (i) { i.checked = state.extras.indexOf(i.value) !== -1; });
		$('#estStart').value = state.startWindow;
		$('#estName').value = state.name;
		$('#estPhone').value = state.phone;
		$('#estEmail').value = state.email;
		$('#estConsent').checked = !!state.consent;

		$$('.est-room').forEach(function (row) {
			var key = row.getAttribute('data-room');
			var sel = state.rooms[key];
			row.querySelector('input[type="checkbox"]').checked = !!sel;
			row.classList.toggle('is-on', !!sel);
			row.querySelector('output').value = sel ? sel.count : 1;
			var scope = sel ? sel.scope : 'full';
			$$('input[name="scope_' + key + '"]', row).forEach(function (r) { r.checked = r.value === scope; });
			updateCounterButtons(row, key);
		});
	}

	function updateCounterButtons(row, key) {
		var out = row.querySelector('output');
		var val = parseInt(out.value, 10) || 1;
		var max = roomMax(key);
		if (val > max) { val = max; out.value = val; if (state.rooms[key]) state.rooms[key].count = val; }
		row.querySelector('.est-dec').disabled = val <= 1;
		row.querySelector('.est-inc').disabled = val >= max;
	}

	function showStep(index, focusHeading) {
		state.step = index;
		var step = STEPS[index];
		els.steps.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-step') === step.id); });
		els.stepsList.forEach(function (li, i) {
			li.classList.toggle('is-active', i === index);
			li.classList.toggle('is-done', i < index);
		});
		els.progressBar.style.width = Math.round(((index + 1) / STEPS.length) * 100) + '%';
		els.progressStep.textContent = 'Step ' + (index + 1) + ' of ' + STEPS.length;
		els.progressLabel.textContent = step.label;
		els.back.hidden = index === 0;
		els.next.textContent = step.id === 'estimate' ? 'get my estimate & consultation' : (step.id === 'contact' ? 'send my estimate' : 'continue');
		hideError();

		if (step.id === 'estimate') renderEstimate();
		if (step.id === 'contact') renderMiniEstimate();

		if (focusHeading) {
			var heading = $('.est-step.is-active legend, .est-step.is-active .est-label, .est-step.is-active h2');
			if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
			var top = els.card.getBoundingClientRect().top + window.pageYOffset - 120;
			window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
		}
		saveDraft();
	}

	function renderEstimate() {
		estimate = calculateEstimate(state);
		$('#estRange').innerHTML = formatINR(estimate.low) + ' <span>–</span> ' + formatINR(estimate.high);
		$('#estRangeLakh').textContent = '₹' + formatLakh(estimate.low) + ' to ₹' + formatLakh(estimate.high) + ' · excluding GST';

		var chips = [
			bhkLabel(state.bhk) + ' ' + labelFor('propertyType', state.propertyType),
			PRICING.cities[state.city].label,
			parseInt(state.areaSqFt, 10).toLocaleString('en-IN') + ' sq ft ' + PRICING.areaType[state.areaType].label.replace(' area', ''),
			PRICING.packages[state.packageId].label + ' package',
			PRICING.projectType[state.projectType].label
		];
		$('#estChips').innerHTML = chips.map(function (c) { return '<span>' + c + '</span>'; }).join('');

		var tbody = $('#estBreakdown tbody');
		tbody.innerHTML = estimate.lines.map(function (l) {
			return '<tr><td>' + l.label + '<small>' + l.detail + '</small></td><td>' + formatINR(l.low) + ' – ' + formatINR(l.high) + '</td></tr>';
		}).join('');
		$('#estBreakdown tfoot td:last-child').textContent = formatINR(estimate.low) + ' – ' + formatINR(estimate.high);

		$('#estInclusions').innerHTML = estimate.inclusions.map(function (x) { return '<li>' + x + '</li>'; }).join('');
		$('#estExclusions').innerHTML = estimate.exclusions.map(function (x) { return '<li>' + x + '</li>'; }).join('');
		$('#estAssumptions').innerHTML = estimate.assumptions.map(function (x) { return '<li>' + x + '</li>'; }).join('');
		$('#estVersion').textContent = 'Estimate ' + estimate.estimateId + ' · pricing version ' + estimate.pricingVersion;

		track('estimate_generated', { estimate_id: estimate.estimateId, pricing_version: estimate.pricingVersion, value_range_bucket: bucket(estimate.high) });
	}

	function bucket(n) {
		if (n < 500000) return 'under_5L';
		if (n < 1000000) return '5L_10L';
		if (n < 2000000) return '10L_20L';
		if (n < 4000000) return '20L_40L';
		return 'above_40L';
	}

	function renderMiniEstimate() {
		if (!estimate) estimate = calculateEstimate(state);
		$('#estMiniRange').textContent = formatINR(estimate.low) + ' – ' + formatINR(estimate.high);
	}

	function labelFor(name, value) {
		var input = $('input[name="' + name + '"][value="' + value + '"]');
		if (!input) return value;
		var strong = input.parentNode.querySelector('strong');
		return strong ? strong.textContent : value;
	}

	function showError(messages) {
		els.error.innerHTML = '<ul>' + messages.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>';
		els.error.classList.add('is-visible');
		els.error.focus();
	}

	function hideError() {
		els.error.classList.remove('is-visible');
		els.error.innerHTML = '';
		$$('.is-invalid', els.form).forEach(function (i) { i.classList.remove('is-invalid'); });
		$$('.est-field-error.is-visible', els.form).forEach(function (i) { i.classList.remove('is-visible'); });
	}

	function fieldError(inputId, msg) {
		var input = $('#' + inputId);
		if (!input) return;
		input.classList.add('is-invalid');
		var err = $('#' + inputId + 'Error');
		if (err) { err.textContent = msg; err.classList.add('is-visible'); }
	}

	/* ============================================================
	   6. VALIDATION (per step)
	   ============================================================ */

	function readStep(stepId) {
		switch (stepId) {
			case 'property':
				state.propertyType = (($('input[name="propertyType"]:checked') || {}).value) || '';
				state.bhk = (($('input[name="bhk"]:checked') || {}).value) || '';
				break;
			case 'size':
				state.city = $('#estCity').value;
				state.areaSqFt = $('#estArea').value.trim();
				state.areaType = (($('input[name="areaType"]:checked') || {}).value) || 'carpet';
				state.projectType = (($('input[name="projectType"]:checked') || {}).value) || '';
				break;
			case 'rooms':
				var rooms = {};
				$$('.est-room').forEach(function (row) {
					var key = row.getAttribute('data-room');
					if (row.querySelector('input[type="checkbox"]').checked) {
						rooms[key] = {
							count: parseInt(row.querySelector('output').value, 10) || 1,
							scope: (($('input[name="scope_' + key + '"]:checked', row) || {}).value) || 'full'
						};
					}
				});
				state.rooms = rooms;
				break;
			case 'package':
				state.packageId = (($('input[name="packageId"]:checked') || {}).value) || '';
				break;
			case 'extras':
				state.extras = $$('input[name="extras"]:checked').map(function (i) { return i.value; });
				state.startWindow = $('#estStart').value;
				break;
			case 'contact':
				state.name = $('#estName').value.trim();
				state.phone = $('#estPhone').value.trim();
				state.email = $('#estEmail').value.trim();
				state.consent = $('#estConsent').checked;
				break;
		}
	}

	function validateStep(stepId) {
		var errors = [];
		switch (stepId) {
			case 'property':
				if (!state.propertyType) errors.push('Please choose your property type.');
				if (!state.bhk) errors.push('Please choose the number of bedrooms (BHK).');
				break;
			case 'size':
				if (!state.city) { errors.push('Please select your city.'); fieldError('estCity', 'Required'); }
				var area = parseFloat(state.areaSqFt);
				if (!state.areaSqFt || isNaN(area)) { errors.push('Please enter the area of your home in sq ft.'); fieldError('estArea', 'Enter a number'); }
				else if (area < AREA_LIMITS.min || area > AREA_LIMITS.max) { errors.push('Area should be between ' + AREA_LIMITS.min + ' and ' + AREA_LIMITS.max.toLocaleString('en-IN') + ' sq ft.'); fieldError('estArea', 'Between ' + AREA_LIMITS.min + ' and ' + AREA_LIMITS.max.toLocaleString('en-IN')); }
				if (!state.projectType) errors.push('Please tell us whether this is a new home or a renovation.');
				break;
			case 'rooms':
				if (Object.keys(state.rooms).length === 0) errors.push('Please select at least one room or area to design.');
				Object.keys(state.rooms).forEach(function (key) {
					var max = roomMax(key);
					if (state.rooms[key].count > max) errors.push(PRICING.rooms[key].label + ' count cannot exceed ' + max + ' for a ' + bhkLabel(state.bhk) + '.');
				});
				break;
			case 'package':
				if (!state.packageId) errors.push('Please choose a package.');
				break;
			case 'contact':
				if (!state.name || state.name.length < 2) { errors.push('Please enter your name.'); fieldError('estName', 'Required'); }
				if (!normalisePhone(state.phone)) { errors.push('Please enter a valid 10-digit Indian mobile number.'); fieldError('estPhone', 'Valid mobile number required'); }
				if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email)) { errors.push('Please enter a valid email address or leave it blank.'); fieldError('estEmail', 'Invalid email'); }
				if (!state.consent) errors.push('Please allow us to contact you about this estimate.');
				break;
		}
		return errors;
	}

	/* ============================================================
	   7. LEAD SUBMISSION (WhatsApp + email deep links)
	   ============================================================ */

	function buildLeadMessage(leadId, attribution) {
		var roomsText = Object.keys(state.rooms).map(function (k) {
			var r = state.rooms[k];
			return PRICING.rooms[k].label + (PRICING.rooms[k].countable ? ' x' + r.count : '') + (r.scope === 'partial' ? ' (selected work)' : '');
		}).join(', ');
		var extrasText = state.extras.map(function (k) { return PRICING.extras[k].label; }).join(', ') || 'None';

		var lines = [
			'Hello 9M Design Studio, I would like a consultation for my home interiors.',
			'',
			'Lead ID: ' + leadId,
			'Estimate: ' + formatINR(estimate.low) + ' – ' + formatINR(estimate.high) + ' (' + estimate.pricingVersion + ')',
			'',
			'Name: ' + state.name,
			'Mobile: ' + normalisePhone(state.phone),
			state.email ? 'Email: ' + state.email : null,
			'',
			'Property: ' + bhkLabel(state.bhk) + ' ' + labelFor('propertyType', state.propertyType) + ', ' + PRICING.cities[state.city].label,
			'Area: ' + state.areaSqFt + ' sq ft (' + PRICING.areaType[state.areaType].label + ')',
			'Project: ' + PRICING.projectType[state.projectType].label,
			'Rooms: ' + roomsText,
			'Package: ' + PRICING.packages[state.packageId].label,
			'Extras: ' + extrasText,
			state.startWindow ? 'Start: ' + state.startWindow : null
		];
		if (attribution && attribution.last && attribution.last.utm_source) lines.push('Source: ' + attribution.last.utm_source + (attribution.last.utm_campaign ? ' / ' + attribution.last.utm_campaign : ''));
		return lines.filter(function (l) { return l !== null; }).join('\n');
	}

	function submitLead() {
		var leadId = uid('LEAD');
		var attribution = captureAttribution();
		var message = buildLeadMessage(leadId, attribution);

		var waUrl = 'https://wa.me/' + BUSINESS.whatsappNumber + '?text=' + encodeURIComponent(message);
		var mailUrl = 'mailto:' + BUSINESS.email + '?subject=' + encodeURIComponent('Interior estimate request ' + leadId + ' - ' + state.name) + '&body=' + encodeURIComponent(message);

		$('#estDoneLeadId').textContent = 'Reference: ' + leadId;
		$('#estDoneName').textContent = state.name.split(' ')[0];
		$('#estDoneRange').textContent = formatINR(estimate.low) + ' – ' + formatINR(estimate.high);
		$('#estWhatsApp').setAttribute('href', waUrl);
		$('#estMail').setAttribute('href', mailUrl);

		track('lead_submitted', { lead_id: leadId, estimate_id: estimate.estimateId });

		$('#estWizard').hidden = true;
		els.resume.hidden = true;
		$('#estDoneScreen').hidden = false;
		els.nav.hidden = true;
		els.progressBar.style.width = '100%';
		els.progressStep.textContent = 'Done';
		els.progressLabel.textContent = 'Thank you';
		els.stepsList.forEach(function (li) { li.classList.add('is-done'); li.classList.remove('is-active'); });
		clearDraft();

		var h2 = $('#estDoneScreen h2');
		if (h2) { h2.setAttribute('tabindex', '-1'); h2.focus({ preventScroll: true }); }
		var top = els.card.getBoundingClientRect().top + window.pageYOffset - 120;
		window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

		// Open WhatsApp automatically on mobile for the fastest hand-off
		if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
			setTimeout(function () { window.open(waUrl, '_blank'); }, 400);
		}
	}

	/* ============================================================
	   8. EVENTS
	   ============================================================ */

	function bindEvents() {
		els.form.addEventListener('submit', function (e) { e.preventDefault(); goNext(); });
		els.next.addEventListener('click', function (e) { e.preventDefault(); goNext(); });
		els.back.addEventListener('click', function (e) { e.preventDefault(); if (state.step > 0) showStep(state.step - 1, true); });

		// Enter key inside text inputs advances the step
		els.form.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); goNext(); }
		});

		// Rooms interactions
		$('#estRooms').addEventListener('change', function (e) {
			var row = e.target.closest('.est-room');
			if (!row) return;
			var key = row.getAttribute('data-room');
			if (e.target.type === 'checkbox') {
				row.classList.toggle('is-on', e.target.checked);
				if (e.target.checked && !state.rooms[key]) state.rooms[key] = { count: 1, scope: 'full' };
				if (!e.target.checked) delete state.rooms[key];
				updateCounterButtons(row, key);
			}
			if (e.target.type === 'radio' && state.rooms[key]) state.rooms[key].scope = e.target.value;
			saveDraft();
		});
		$('#estRooms').addEventListener('click', function (e) {
			var btn = e.target.closest('.est-inc, .est-dec');
			if (!btn) return;
			var row = btn.closest('.est-room');
			var key = row.getAttribute('data-room');
			var out = row.querySelector('output');
			var val = parseInt(out.value, 10) || 1;
			val += btn.classList.contains('est-inc') ? 1 : -1;
			val = Math.min(Math.max(1, val), roomMax(key));
			out.value = val;
			if (state.rooms[key]) state.rooms[key].count = val;
			updateCounterButtons(row, key);
			saveDraft();
		});

		// Edit links on the estimate screen
		$$('[data-goto]').forEach(function (a) {
			a.addEventListener('click', function (e) {
				e.preventDefault();
				var idx = STEPS.findIndex(function (s) { return s.id === a.getAttribute('data-goto'); });
				if (idx >= 0) showStep(idx, true);
			});
		});

		// Draft restore / start over
		$('#estStartOver').addEventListener('click', function (e) {
			e.preventDefault();
			clearDraft();
			state = defaultState();
			estimate = null;
			syncFormFromState();
			els.resume.hidden = true;
			showStep(0, true);
		});

		// Persist as the user types / clicks
		els.form.addEventListener('change', function () { readStep(STEPS[state.step].id); saveDraft(); });

		// Phone: digits only helper
		$('#estPhone').addEventListener('input', function () { this.value = this.value.replace(/[^\d+\s-]/g, ''); });

		// Area: digits only
		$('#estArea').addEventListener('input', function () { this.value = this.value.replace(/[^\d]/g, ''); });

		// When BHK changes, re-check room count limits
		$$('input[name="bhk"]').forEach(function (i) {
			i.addEventListener('change', function () {
				state.bhk = i.value;
				$$('.est-room').forEach(function (row) { updateCounterButtons(row, row.getAttribute('data-room')); });
			});
		});
	}

	var started = false;

	function goNext() {
		var step = STEPS[state.step];
		hideError();
		readStep(step.id);
		var errors = validateStep(step.id);
		if (errors.length) { showError(errors); return; }

		if (!started) { started = true; track('estimator_start', {}); }
		track('estimator_step_completed', { step_id: step.id, step_index: state.step });

		if (step.id === 'contact') { submitLead(); return; }
		showStep(state.step + 1, true);
	}

	/* ============================================================
	   9. INIT
	   ============================================================ */

	function init() {
		if (!$('#estimatorForm')) return;
		cacheEls();
		buildRoomsUI();
		buildExtrasUI();
		buildCityUI();
		captureAttribution();

		var draft = loadDraft();
		if (draft && (draft.propertyType || draft.city || Object.keys(draft.rooms || {}).length)) {
			state = Object.assign(defaultState(), draft);
			restored = true;
		}
		syncFormFromState();
		if (restored) els.resume.hidden = false;
		bindEvents();
		showStep(Math.min(state.step, STEPS.length - 1), false);
		track('estimator_view', {});
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();

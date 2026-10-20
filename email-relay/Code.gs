/* ----------------------------------------------------------------------------------------
* 9M Design Studio - Email relay (Google Apps Script)
*
* Receives contact-form and estimator submissions from 9mdesignstudio.com and sends:
*   1. an inquiry email to the studio (STUDIO_EMAIL)
*   2. a designed email to the visitor (their estimate, or a thank-you)
* from the Google account that deploys this script. No passwords are stored anywhere.
*
* Emails are built HERE from plain form data, never from HTML sent by the browser, and the
* visitor email only ever goes to the address typed in the form. Together with the rate
* limits below this stops the URL being abused to send spam from the studio's Gmail.
*
* DEPLOY (signed in as miloni9mdesignstudio@gmail.com):
*   1. script.google.com > New project > replace Code.gs with this file > Save
*   2. Run > select "testSetup" > Run > approve the permission prompt
*      (sends one test email to STUDIO_EMAIL)
*   3. Deploy > New deployment > type "Web app"
*        Execute as: Me      Who has access: Anyone
*   4. Copy the Web app URL (ends in /exec) into js/email-config.js (endpoint)
*
* After editing this file: Deploy > Manage deployments > Edit (pencil) > Version: New version
* > Deploy. The URL stays the same.
* ---------------------------------------------------------------------------------------- */

const STUDIO_EMAIL = 'miloni9mdesignstudio@gmail.com';
const SITE_URL = 'https://9mdesignstudio.com';
const PHONE_DISPLAY = '+91 8200954409';
const PHONE_TEL = '+918200954409';
const WHATSAPP_NUMBER = '918200954409';

const LIMITS = {
	perAddressPerHour: 3,   // submissions to the same visitor address
	perDay: 45,             // submissions per day (each sends 2 emails; consumer Gmail allows ~100/day)
	maxLines: 30,
	maxListItems: 30,
	maxText: 300,
	maxMessage: 3000
};

/* ============================================================
   ENTRY POINTS
   ============================================================ */

function doPost(e) {
	try {
		const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

		// Honeypot: real visitors never fill this hidden field
		if (data.hp) return json({ ok: true, studio: true, client: true });

		const built = data.type === 'estimate' ? buildEstimate(data)
			: data.type === 'contact' ? buildContact(data)
			: null;
		if (!built) return json({ ok: false, error: 'Unknown request.' });
		if (built.error) return json({ ok: false, error: built.error });

		const limit = checkLimits(built.clientEmail);
		if (limit) return json({ ok: false, error: limit });

		const result = { ok: true, studio: false, client: false };
		try {
			MailApp.sendEmail({ to: STUDIO_EMAIL, subject: built.studio.subject, htmlBody: built.studio.html, name: '9M Website', replyTo: built.clientEmail });
			result.studio = true;
		} catch (err) { console.error('Studio email failed', err); }
		try {
			MailApp.sendEmail({ to: built.clientEmail, subject: built.client.subject, htmlBody: built.client.html, name: '9M Design Studio', replyTo: STUDIO_EMAIL });
			result.client = true;
		} catch (err) { console.error('Client email failed', err); }

		if (!result.studio && !result.client) return json({ ok: false, error: 'Email could not be sent.' });
		return json(result);
	} catch (err) {
		console.error(err);
		return json({ ok: false, error: 'Server error.' });
	}
}

function doGet() {
	return json({ ok: true, service: '9M Design Studio email relay' });
}

/* Run once from the editor to grant permission and check delivery */
function testSetup() {
	MailApp.sendEmail({
		to: STUDIO_EMAIL,
		subject: '9M email relay is working',
		htmlBody: layout('Setup test', para('<strong>The 9M Design Studio email relay is set up correctly.</strong>') + para('Remaining daily email quota: ' + MailApp.getRemainingDailyQuota()))
	});
}

function json(obj) {
	return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   VALIDATION + LIMITS
   ============================================================ */

function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max || LIMITS.maxText); }
function num(v) { const n = Number(v); return isFinite(n) && n >= 0 && n < 1e10 ? n : 0; }
function strList(v, maxItems) { return (Array.isArray(v) ? v : []).slice(0, maxItems || LIMITS.maxListItems).map(x => str(x)).filter(Boolean); }

function validEmail(e) { return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(e) && e.length <= 120; }

function normalisePhone(raw) {
	const d = String(raw || '').replace(/\D/g, '').replace(/^(91|0)(?=[6-9]\d{9}$)/, '');
	return /^[6-9]\d{9}$/.test(d) ? '+91 ' + d : null;
}

function checkLimits(address) {
	const cache = CacheService.getScriptCache();
	const key = 'addr:' + address.toLowerCase();
	const sent = Number(cache.get(key) || 0);
	if (sent >= LIMITS.perAddressPerHour) return 'Too many requests. Please try again later.';

	const lock = LockService.getScriptLock();
	lock.waitLock(10000);
	try {
		const props = PropertiesService.getScriptProperties();
		const dayKey = 'day:' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
		const today = Number(props.getProperty(dayKey) || 0);
		if (today >= LIMITS.perDay || MailApp.getRemainingDailyQuota() < 2) return 'Daily limit reached. Please call us on ' + PHONE_DISPLAY + '.';
		props.setProperty(dayKey, String(today + 1));
	} finally {
		lock.releaseLock();
	}
	cache.put(key, String(sent + 1), 3600);
	return null;
}

/* ============================================================
   EMAIL BUILDERS
   ============================================================ */

function buildContact(d) {
	const name = str(d.name, 80);
	const email = str(d.email, 120);
	const phone = normalisePhone(d.phone);
	const message = str(d.message, LIMITS.maxMessage);
	if (name.length < 2) return { error: 'Please enter your name.' };
	if (!validEmail(email)) return { error: 'Please enter a valid email address.' };
	if (!phone) return { error: 'Please enter a valid 10-digit mobile number.' };

	const first = name.split(' ')[0];
	const messageBlock = message ? quote(nl2br(message)) : para('<em>No message provided.</em>');
	const details = keyValue([
		['Name', esc(name)],
		['Mobile', link('tel:' + phone.replace(/\s/g, ''), phone)],
		['Email', link('mailto:' + email, email)]
	]);

	return {
		clientEmail: email,
		studio: {
			subject: 'New inquiry from ' + name,
			html: layout('New website inquiry from ' + name,
				title('New contact inquiry') +
				para('Submitted from the contact form on ' + esc(nowIST()) + '. Reply to this email to respond directly.') +
				heading('Contact details') + details +
				heading('Message') + messageBlock)
		},
		client: {
			subject: 'We received your message - 9M Design Studio',
			html: layout('Thanks for reaching out - we will get back to you within one working day.',
				title('Thank you, ' + esc(first) + '!') +
				para('We have received your message and a 9M designer will get back to you within one working day. Here is a copy of what you sent us:') +
				messageBlock +
				heading('Your details') + details +
				para('If anything here is incorrect, simply reply to this email.', 'font-size:13px;color:' + C.muted + ';margin-top:10px;') +
				heading('While you wait') +
				para('Get an indicative budget for your home in two minutes with our interior cost calculator, or browse our recent work.') +
				'<div style="margin-top:6px;">' + button(SITE_URL + '/get-estimate.html', 'Get your estimate', true) + button(SITE_URL + '/projects.html', 'View projects') + '</div>',
				'You are receiving this because you contacted us through 9mdesignstudio.com.')
		}
	};
}

function buildEstimate(d) {
	const lead = d.lead || {};
	const est = d.estimate || {};
	const name = str(lead.name, 80);
	const email = str(lead.email, 120);
	const phone = normalisePhone(lead.phone);
	const leadId = str(lead.id, 40).replace(/[^\w-]/g, '');
	if (name.length < 2) return { error: 'Please enter your name.' };
	if (!validEmail(email)) return { error: 'Please enter a valid email address.' };
	if (!phone) return { error: 'Please enter a valid 10-digit mobile number.' };

	const e = {
		id: str(est.id, 40).replace(/[^\w-]/g, ''),
		pricingVersion: str(est.pricingVersion, 40),
		low: num(est.low),
		high: num(est.high),
		lines: (Array.isArray(est.lines) ? est.lines : []).slice(0, LIMITS.maxLines).map(l => ({ label: str(l.label), detail: str(l.detail), low: num(l.low), high: num(l.high) })),
		inclusions: strList(est.inclusions),
		exclusions: strList(est.exclusions),
		assumptions: strList(est.assumptions)
	};
	const project = (Array.isArray(d.project) ? d.project : []).slice(0, 12).map(r => [str(r && r[0], 40), str(r && r[1])]).filter(r => r[0] && r[1]);
	const projectValue = label => (project.find(r => r[0] === label) || [])[1] || '';

	const waText = [
		'Hello 9M Design Studio, I just requested an interior estimate on your website and would like to book a free consultation.',
		'',
		'Reference: ' + leadId,
		'Name: ' + name,
		'Property: ' + [projectValue('Property'), projectValue('City')].filter(Boolean).join(', ')
	].join('\n');
	const waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(waText);
	const range = inr(e.low) + ' – ' + inr(e.high);
	const sections = estimateSections(e, project);
	const small = 'font-size:12px;color:' + C.muted + ';';

	return {
		clientEmail: email,
		studio: {
			subject: 'New estimate lead ' + leadId + ' - ' + name + ' - ' + inr(e.low) + ' to ' + inr(e.high),
			html: layout('New estimate lead: ' + name + ', ' + range,
				title('New estimate lead') +
				para('Submitted on ' + esc(nowIST()) + '. The client has been emailed the estimate below. Reply to this email to respond to them directly.') +
				heading('Contact details') +
				keyValue([
					['Reference', esc(leadId)],
					['Name', esc(name)],
					['Mobile', link('tel:' + phone.replace(/\s/g, ''), phone)],
					['WhatsApp', link('https://wa.me/' + phone.replace(/\D/g, ''), 'Open chat')],
					['Email', link('mailto:' + email, email)],
					['Consent', 'Yes - phone, WhatsApp, email'],
					['Source', esc(str(lead.source, 200) || 'Direct')]
				]) +
				sections +
				para('Estimate ' + esc(e.id) + ' &middot; Pricing ' + esc(e.pricingVersion), small + 'margin-top:20px;'))
		},
		client: {
			subject: 'Your interior estimate from 9M Design Studio (' + leadId + ')',
			html: layout('Your indicative interior estimate: ' + range + '. Reference ' + leadId + '.',
				title('Hi ' + esc(name.split(' ')[0]) + ', here is your interior estimate') +
				para('Thank you for using the 9M Design Studio interior cost calculator. Based on your answers, here is an indicative budget for your home along with a detailed breakdown. A 9M designer will call you within one working day to walk you through it.') +
				heading('Your details') +
				keyValue([['Name', esc(name)], ['Mobile', esc(phone)], ['Email', esc(email)]]) +
				para('If anything here is incorrect, simply reply to this email.', 'font-size:13px;color:' + C.muted + ';margin-top:10px;') +
				sections +
				heading('What happens next') +
				list([
					'Our designer reviews your requirement and calls you to understand your taste and priorities.',
					'We schedule a free consultation and site visit for measurements.',
					'You receive a detailed, itemised quotation with 3D visuals.'
				], '&rarr;') +
				'<div style="margin:24px 0 8px;">' + button(waUrl, 'Book free consultation', true) + button('tel:' + PHONE_TEL, 'Call ' + PHONE_DISPLAY) + '</div>' +
				para('This is a preliminary estimate generated from your answers, not a binding quotation. The final price depends on site measurement, material selection and detailed drawings.', small + 'margin-top:20px;') +
				para('Reference ' + esc(leadId) + ' &middot; Estimate ' + esc(e.id) + ' &middot; Pricing ' + esc(e.pricingVersion), small),
				'You are receiving this because you requested an estimate on 9mdesignstudio.com. Simply reply to this email with any questions.')
		}
	};
}

function estimateSections(e, project) {
	const hero =
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0 6px;">' +
			'<tr><td align="center" style="padding:30px 20px;background:' + C.primary + ';">' +
				'<div style="font-family:' + FONT + ';font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#C9D0CB;">Indicative estimate</div>' +
				'<div style="margin-top:10px;font-family:' + FONT + ';font-size:30px;line-height:1.25;font-weight:700;color:' + C.white + ';">' + inr(e.low) + ' &ndash; ' + inr(e.high) + '</div>' +
				'<div style="margin-top:8px;font-family:' + FONT + ';font-size:14px;color:#C9D0CB;">&#8377;' + lakh(e.low) + ' to &#8377;' + lakh(e.high) + ' &middot; excluding GST</div>' +
			'</td></tr>' +
		'</table>';

	const cell = 'font-family:' + FONT + ';font-size:14px;border-bottom:1px solid ' + C.divider + ';vertical-align:top;';
	const breakdown =
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
			'<tr>' +
				'<td style="' + cell + 'padding:10px 12px;background:' + C.soft + ';font-weight:700;color:' + C.primary + ';">Scope of work</td>' +
				'<td align="right" style="' + cell + 'padding:10px 12px;background:' + C.soft + ';font-weight:700;color:' + C.primary + ';white-space:nowrap;">Range</td>' +
			'</tr>' +
			e.lines.map(l =>
				'<tr>' +
					'<td style="' + cell + 'padding:12px;color:' + C.primary + ';font-weight:600;">' + esc(l.label) +
						'<div style="margin-top:3px;font-size:12px;font-weight:400;line-height:1.5;color:' + C.muted + ';">' + esc(l.detail) + '</div></td>' +
					'<td align="right" style="' + cell + 'padding:12px;color:' + C.text + ';white-space:nowrap;">' + inr(l.low) + ' &ndash; ' + inr(l.high) + '</td>' +
				'</tr>').join('') +
			'<tr>' +
				'<td style="padding:14px 12px;background:' + C.accent + ';font-family:' + FONT + ';font-size:15px;font-weight:700;color:' + C.white + ';">Total (excluding GST)</td>' +
				'<td align="right" style="padding:14px 12px;background:' + C.accent + ';font-family:' + FONT + ';font-size:15px;font-weight:700;color:' + C.white + ';white-space:nowrap;">' + inr(e.low) + ' &ndash; ' + inr(e.high) + '</td>' +
			'</tr>' +
		'</table>';

	return hero +
		heading('Your project') + keyValue(project.map(r => [r[0], esc(r[1])])) +
		heading('Cost breakdown') + breakdown +
		(e.inclusions.length ? heading('What is included') + list(e.inclusions) : '') +
		(e.exclusions.length ? heading('Not included') + list(e.exclusions, '&ndash;') : '') +
		(e.assumptions.length ? heading('Assumptions') + list(e.assumptions, '&bull;') : '');
}

/* ============================================================
   HTML HELPERS (email-safe: tables + inline styles)
   ============================================================ */

const C = { primary: '#192324', text: '#283132', muted: '#6B7570', accent: '#7C877F', soft: '#F8F8F8', divider: '#EAF0EC', white: '#FFFFFF' };
const FONT = "'Hanken Grotesk', Arial, Helvetica, sans-serif";

function esc(s) {
	return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function nl2br(s) { return esc(s).replace(/\r?\n/g, '<br>'); }
function link(href, text) { return '<a href="' + esc(href) + '" style="color:' + C.primary + ';">' + esc(text) + '</a>'; }

/* Indian digit grouping: 1234567 -> ₹12,34,567 */
function inr(n) {
	const s = String(Math.round(num(n)));
	const last3 = s.slice(-3);
	const rest = s.slice(0, -3);
	return '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3;
}
function lakh(n) {
	const l = num(n) / 100000;
	return l >= 100 ? (l / 100).toFixed(2) + ' Cr' : l.toFixed(l < 10 ? 2 : 1) + ' L';
}
function nowIST() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'd MMM yyyy, h:mm a') + ' IST'; }

function title(html) { return para('<strong style="font-size:22px;color:' + C.primary + ';">' + html + '</strong>'); }
function heading(text) {
	return '<h2 style="margin:32px 0 14px;font-family:' + FONT + ';font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:' + C.accent + ';">' + esc(text) + '</h2>';
}
function para(html, style) {
	return '<p style="margin:0 0 14px;font-family:' + FONT + ';font-size:15px;line-height:1.65;color:' + C.text + ';' + (style || '') + '">' + html + '</p>';
}
function button(href, label, dark) {
	return '<a href="' + esc(href) + '" style="display:inline-block;margin:0 8px 10px 0;padding:13px 26px;background:' + (dark ? C.primary : C.accent) + ';color:' + C.white + ';font-family:' + FONT + ';font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">' + esc(label) + '</a>';
}
/* rows: [[label, valueHtml]] - value must already be escaped */
function keyValue(rows) {
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
		rows.filter(r => r && r[1]).map(r =>
			'<tr>' +
				'<td style="padding:10px 12px 10px 0;border-bottom:1px solid ' + C.divider + ';font-family:' + FONT + ';font-size:14px;color:' + C.muted + ';width:38%;vertical-align:top;">' + esc(r[0]) + '</td>' +
				'<td style="padding:10px 0;border-bottom:1px solid ' + C.divider + ';font-family:' + FONT + ';font-size:14px;color:' + C.primary + ';font-weight:600;vertical-align:top;">' + r[1] + '</td>' +
			'</tr>').join('') +
	'</table>';
}
function list(items, marker) {
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
		items.map(x =>
			'<tr>' +
				'<td style="width:22px;padding:5px 0;vertical-align:top;font-family:' + FONT + ';font-size:14px;color:' + C.accent + ';font-weight:700;">' + (marker || '&#10003;') + '</td>' +
				'<td style="padding:5px 0;font-family:' + FONT + ';font-size:14px;line-height:1.55;color:' + C.text + ';">' + esc(x) + '</td>' +
			'</tr>').join('') +
	'</table>';
}
function quote(html) {
	return '<div style="margin:0 0 14px;padding:16px 18px;background:' + C.soft + ';border-left:3px solid ' + C.accent + ';font-family:' + FONT + ';font-size:15px;line-height:1.6;color:' + C.text + ';">' + html + '</div>';
}

function layout(preheader, bodyHtml, footerNote) {
	return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>9M Design Studio</title></head>' +
	'<body style="margin:0;padding:0;background:' + C.soft + ';">' +
	'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + esc(preheader) + '</div>' +
	'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.soft + ';">' +
	'<tr><td align="center" style="padding:28px 12px;">' +
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:' + C.white + ';border-collapse:collapse;">' +
			'<tr><td style="padding:14px 32px 10px;background:' + C.white + ';border-bottom:3px solid ' + C.accent + ';" align="center">' +
				'<a href="' + SITE_URL + '" style="text-decoration:none;"><img src="' + SITE_URL + '/images/logo.png" alt="9M Design Studio" height="96" style="display:block;height:96px;border:0;"></a>' +
			'</td></tr>' +
			'<tr><td style="padding:34px 32px 30px;">' + bodyHtml + '</td></tr>' +
			'<tr><td style="padding:24px 32px;background:' + C.primary + ';font-family:' + FONT + ';font-size:13px;line-height:1.7;color:#C9D0CB;">' +
				(footerNote ? '<p style="margin:0 0 12px;">' + footerNote + '</p>' : '') +
				'<strong style="color:' + C.white + ';">9M Design Studio</strong> &middot; Interior design, Ahmedabad<br>' +
				'<a href="tel:' + PHONE_TEL + '" style="color:#C9D0CB;text-decoration:none;">' + PHONE_DISPLAY + '</a> &middot; ' +
				'<a href="mailto:' + STUDIO_EMAIL + '" style="color:#C9D0CB;text-decoration:none;">' + STUDIO_EMAIL + '</a> &middot; ' +
				'<a href="https://www.instagram.com/9mdesignstudio/" style="color:#C9D0CB;text-decoration:none;">Instagram</a><br>' +
				'<a href="' + SITE_URL + '" style="color:#C9D0CB;">9mdesignstudio.com</a>' +
			'</td></tr>' +
		'</table>' +
	'</td></tr></table></body></html>';
}

/* ----------------------------------------------------------------------------------------
* 9M Design Studio - Mailer
* Thin wrapper over the EmailJS browser SDK plus email-safe HTML building blocks
* (tables + inline styles) shared by the contact form and the estimator.
* Requires: EmailJS SDK and js/email-config.js loaded first.
* ---------------------------------------------------------------------------------------- */
(function () {
	'use strict';

	var CFG = window.NM_EMAIL_CONFIG || {};

	var C = {
		primary: '#192324',
		text: '#283132',
		muted: '#6B7570',
		accent: '#7C877F',
		soft: '#F8F8F8',
		divider: '#EAF0EC',
		white: '#FFFFFF'
	};
	var FONT = "'Hanken Grotesk', Arial, Helvetica, sans-serif";

	var initialised = false;

	function isConfigured() {
		return !!(window.emailjs && CFG.publicKey && CFG.serviceId && CFG.templates &&
			CFG.publicKey.indexOf('YOUR_') !== 0 && CFG.serviceId.indexOf('YOUR_') !== 0 &&
			CFG.templates.client.indexOf('YOUR_') !== 0 && CFG.templates.studio.indexOf('YOUR_') !== 0);
	}

	/* kind: 'client' | 'studio' */
	function send(kind, params) {
		if (!isConfigured()) return Promise.reject(new Error('EmailJS is not configured (js/email-config.js).'));
		if (!initialised) { window.emailjs.init({ publicKey: CFG.publicKey }); initialised = true; }
		return window.emailjs.send(CFG.serviceId, CFG.templates[kind], params);
	}

	/* ---------- HTML helpers ---------- */

	function esc(s) {
		return String(s == null ? '' : s)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	function nl2br(s) { return esc(s).replace(/\r?\n/g, '<br>'); }

	function heading(text) {
		return '<h2 style="margin:32px 0 14px;font-family:' + FONT + ';font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:' + C.accent + ';">' + esc(text) + '</h2>';
	}

	function para(html, style) {
		return '<p style="margin:0 0 14px;font-family:' + FONT + ';font-size:15px;line-height:1.65;color:' + C.text + ';' + (style || '') + '">' + html + '</p>';
	}

	function button(href, label, dark) {
		var bg = dark ? C.primary : C.accent;
		return '<a href="' + esc(href) + '" style="display:inline-block;margin:0 8px 10px 0;padding:13px 26px;background:' + bg + ';color:' + C.white + ';font-family:' + FONT + ';font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">' + esc(label) + '</a>';
	}

	/* rows: [[label, valueHtml], ...] - value is trusted HTML (escape before passing) */
	function keyValue(rows) {
		return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
			rows.filter(function (r) { return r && r[1] !== '' && r[1] != null; }).map(function (r) {
				return '<tr>' +
					'<td style="padding:10px 12px 10px 0;border-bottom:1px solid ' + C.divider + ';font-family:' + FONT + ';font-size:14px;color:' + C.muted + ';width:38%;vertical-align:top;">' + esc(r[0]) + '</td>' +
					'<td style="padding:10px 0;border-bottom:1px solid ' + C.divider + ';font-family:' + FONT + ';font-size:14px;color:' + C.primary + ';font-weight:600;vertical-align:top;">' + r[1] + '</td>' +
				'</tr>';
			}).join('') +
		'</table>';
	}

	function list(items, marker) {
		return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
			items.map(function (x) {
				return '<tr>' +
					'<td style="width:22px;padding:5px 0;vertical-align:top;font-family:' + FONT + ';font-size:14px;color:' + C.accent + ';font-weight:700;">' + (marker || '&#10003;') + '</td>' +
					'<td style="padding:5px 0;font-family:' + FONT + ';font-size:14px;line-height:1.55;color:' + C.text + ';">' + esc(x) + '</td>' +
				'</tr>';
			}).join('') +
		'</table>';
	}

	function quote(html) {
		return '<div style="margin:0 0 14px;padding:16px 18px;background:' + C.soft + ';border-left:3px solid ' + C.accent + ';font-family:' + FONT + ';font-size:15px;line-height:1.6;color:' + C.text + ';">' + html + '</div>';
	}

	/* Full branded email document. opts: { preheader, bodyHtml, footerNote } */
	function layout(opts) {
		var site = CFG.siteUrl || 'https://9mdesignstudio.com';
		return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>9M Design Studio</title></head>' +
		'<body style="margin:0;padding:0;background:' + C.soft + ';">' +
		'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + esc(opts.preheader || '') + '</div>' +
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.soft + ';">' +
		'<tr><td align="center" style="padding:28px 12px;">' +
			'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:' + C.white + ';border-collapse:collapse;">' +
				'<tr><td style="padding:14px 32px 10px;background:' + C.white + ';border-bottom:3px solid ' + C.accent + ';" align="center">' +
					'<a href="' + site + '" style="text-decoration:none;"><img src="' + site + '/images/logo.png" alt="9M Design Studio" height="96" style="display:block;height:96px;border:0;"></a>' +
				'</td></tr>' +
				'<tr><td style="padding:34px 32px 30px;">' + opts.bodyHtml + '</td></tr>' +
				'<tr><td style="padding:24px 32px;background:' + C.primary + ';font-family:' + FONT + ';font-size:13px;line-height:1.7;color:#C9D0CB;">' +
					(opts.footerNote ? '<p style="margin:0 0 12px;">' + opts.footerNote + '</p>' : '') +
					'<strong style="color:' + C.white + ';">9M Design Studio</strong> &middot; Interior design, Ahmedabad<br>' +
					'<a href="tel:+918200954409" style="color:#C9D0CB;text-decoration:none;">+91 8200954409</a> &middot; ' +
					'<a href="mailto:' + esc(CFG.studioEmail) + '" style="color:#C9D0CB;text-decoration:none;">' + esc(CFG.studioEmail) + '</a> &middot; ' +
					'<a href="https://www.instagram.com/9mdesignstudio/" style="color:#C9D0CB;text-decoration:none;">Instagram</a><br>' +
					'<a href="' + site + '" style="color:#C9D0CB;">' + site.replace(/^https?:\/\//, '') + '</a>' +
				'</td></tr>' +
			'</table>' +
		'</td></tr></table></body></html>';
	}

	window.NMMailer = {
		config: CFG,
		colors: C,
		font: FONT,
		isConfigured: isConfigured,
		send: send,
		esc: esc,
		nl2br: nl2br,
		heading: heading,
		para: para,
		button: button,
		keyValue: keyValue,
		list: list,
		quote: quote,
		layout: layout
	};
})();

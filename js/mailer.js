/* ----------------------------------------------------------------------------------------
* 9M Design Studio - Mailer
* Posts form data to the Google Apps Script email relay (email-relay/Code.gs), which
* builds and sends the emails. Requires js/email-config.js loaded first.
* ---------------------------------------------------------------------------------------- */
(function () {
	'use strict';

	var CFG = window.NM_EMAIL_CONFIG || {};

	function isConfigured() {
		return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(CFG.endpoint || '');
	}

	/* Resolves with { ok, studio, client } or rejects with an Error carrying a user-facing message.
	   Sent as text/plain so the browser makes a simple request (no CORS preflight). */
	function submit(payload) {
		if (!isConfigured()) return Promise.reject(new Error('Email endpoint is not configured (js/email-config.js).'));
		return fetch(CFG.endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain;charset=utf-8' },
			body: JSON.stringify(payload)
		}).then(function (res) {
			if (!res.ok) throw new Error('Email service returned ' + res.status);
			return res.json();
		}).then(function (data) {
			if (!data || !data.ok) {
				var err = new Error((data && data.error) || 'Email could not be sent.');
				err.userMessage = data && data.error;
				throw err;
			}
			return data;
		});
	}

	/* Hidden anti-spam field value (bots fill it, people never see it) */
	function honeypot(form) {
		var hp = form && form.querySelector('input[name="website"]');
		return hp ? hp.value : '';
	}

	window.NMMailer = {
		config: CFG,
		isConfigured: isConfigured,
		submit: submit,
		honeypot: honeypot
	};
})();

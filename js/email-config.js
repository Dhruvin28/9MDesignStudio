/* ----------------------------------------------------------------------------------------
* 9M Design Studio - EmailJS configuration
*
* These values are PUBLIC by design (EmailJS runs in the browser). Never put a mailbox
* password or app password here - that belongs only in the EmailJS dashboard
* (Email Services > your Gmail / SMTP service).
*
* Setup: see the "EmailJS setup" notes at the bottom of this file.
* ---------------------------------------------------------------------------------------- */
window.NM_EMAIL_CONFIG = {
	publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',     // Account > General > Public Key
	serviceId: 'YOUR_EMAILJS_SERVICE_ID',     // Email Services > service ID
	templates: {
		client: 'YOUR_CLIENT_TEMPLATE_ID',      // mail sent TO the visitor (estimate / thank-you)
		studio: 'YOUR_STUDIO_TEMPLATE_ID'       // inquiry mail sent TO the studio
	},
	studioEmail: 'miloni9mdesignstudio@gmail.com',
	siteUrl: 'https://9mdesignstudio.com'
};

/*
EmailJS setup
-------------
1. Email Services > Add service > Gmail (sign in as miloni9mdesignstudio@gmail.com)
   or "SMTP server": host smtp.gmail.com, port 587 (TLS), user miloni9mdesignstudio@gmail.com,
   password = the Google app password. Copy the Service ID into serviceId above.

2. Email Templates > create TWO templates. Both use the same content:
     Subject:   {{subject}}
     Content:   switch the editor to "Code" and paste exactly:  {{{html_content}}}
   (triple braces so the HTML is not escaped)

   Template "client"  - To Email: {{to_email}}            From Name: 9M Design Studio
                        Reply To: miloni9mdesignstudio@gmail.com
   Template "studio"  - To Email: miloni9mdesignstudio@gmail.com  From Name: 9M Website
                        Reply To: {{reply_to}}

3. Account > Security: add 9mdesignstudio.com to allowed origins so the keys
   cannot be used from other websites.
*/

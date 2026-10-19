(function ($) {
    "use strict";
	
	var $window = $(window); 
	var $body = $('body'); 

	/* Preloader Effect */
	$window.on('load', function(){
		$(".preloader").fadeOut(600);
	});

	/* Sticky Header */	
	if($('.active-sticky-header').length){
		$window.on('resize', function(){
			setHeaderHeight();
		});

		function setHeaderHeight(){
	 		$("header.main-header").css("height", $('header .header-sticky').outerHeight());
		}	
	
		$window.on("scroll", function() {
			var fromTop = $(window).scrollTop();
			setHeaderHeight();
			var headerHeight = $('header .header-sticky').outerHeight()
			$("header .header-sticky").toggleClass("hide", (fromTop > headerHeight + 100));
			$("header .header-sticky").toggleClass("active", (fromTop > 600));
		});
	}	
	
	/* Slick Menu JS */
	$('#menu').slicknav({
		label : '',
		prependTo : '.responsive-menu'
	});

	if($("a[href='#top']").length){
		$(document).on("click", "a[href='#top']", function() {
			$("html, body").animate({ scrollTop: 0 }, "slow");
			return false;
		});
	}

	/* Hero Slider Layout JS */
	const hero_slider_layout = new Swiper('.hero-slider-layout .swiper', {
		slidesPerView : 1,
		speed: 1000,
		spaceBetween: 0,
		loop: true,
		autoplay: {
			delay: 4000,
		},
		pagination: {
			el: '.hero-pagination',
			clickable: true,
		},
	});

	/* How We Work Client Logo Slider JS */ 
	if ($('.how-work-company-slider').length) {
		const how_work_company_slider = new Swiper('.how-work-company-slider .swiper', {
			slidesPerView : 2,
			speed: 2000,
			spaceBetween: 30,
			loop: true,
			autoplay: {
				delay: 3000,
			},
			breakpoints: {
				768:{
				  	slidesPerView: 4,
				},
				991:{
				  	slidesPerView: 5,
				}
			}
		});
	}

	/* testimonial Slider JS */
	if ($('.testimonial-slider').length) {
		const testimonial_slider = new Swiper('.testimonial-slider .swiper', {
			slidesPerView : 1,
			speed: 1000,
			spaceBetween: 60,
			loop: true,
			autoplay: {
				delay: 5000,
			},
			breakpoints: {
				768:{
				  	slidesPerView: 1,
				},
				991:{
				  	slidesPerView: 1,
				}
			}
		});
	}

	/* testimonial Slider JS */
	if ($('.our-client-slider').length) {
		const testimonial_slider = new Swiper('.our-client-slider .swiper', {
			slidesPerView : 2,
			speed: 1000,
			spaceBetween: 60,
			loop: true,
			autoplay: {
				delay: 5000,
			},
			breakpoints: {
				768:{
						slidesPerView: 4,
				},
				991:{
						slidesPerView: 4,
				}
			}
		});
	}

	/* Skill Bar */
	if ($('.skills-progress-bar').length) {
		$('.skills-progress-bar').waypoint(function() {
			$('.skillbar').each(function() {
				$(this).find('.count-bar').animate({
				width:$(this).attr('data-percent')
				},2000);
			});
		},{
			offset: '50%'
		});
	}

	/* Youtube Background Video JS */
	if ($('#herovideo').length) {
		var myPlayer = $("#herovideo").YTPlayer();
	}

	/* Init Counter */
	if ($('.counter').length) {
		$('.counter').counterUp({ delay: 5, time: 2000 });
	}

	/* Image Reveal Animation */
	if ($('.reveal').length) {
        gsap.registerPlugin(ScrollTrigger);
        let revealContainers = document.querySelectorAll(".reveal");
        revealContainers.forEach((container) => {
            let image = container.querySelector("img");
            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    toggleActions: "play none none none"
                }
            });
            tl.set(container, {
                autoAlpha: 1
            });
            tl.from(container, 1, {
                xPercent: -100,
                ease: Power2.out
            });
            tl.from(image, 1, {
                xPercent: 100,
                scale: 1,
                delay: -1,
                ease: Power2.out
            });
        });
    }

	/* Text Effect Animation */
	if ($('.text-anime-style-1').length) {
		let staggerAmount 	= 0.05,
			translateXValue = 0,
			delayValue 		= 0.5,
		   animatedTextElements = document.querySelectorAll('.text-anime-style-1');
		
		animatedTextElements.forEach((element) => {
			let animationSplitText = new SplitText(element, { type: "chars, words" });
				gsap.from(animationSplitText.words, {
				duration: 1,
				delay: delayValue,
				x: 20,
				autoAlpha: 0,
				stagger: staggerAmount,
				scrollTrigger: { trigger: element, start: "top 85%" },
				});
		});		
	}
	
	if ($('.text-anime-style-2').length) {				
		let	 staggerAmount 		= 0.03,
			 translateXValue	= 20,
			 delayValue 		= 0.1,
			 easeType 			= "power2.out",
			 animatedTextElements = document.querySelectorAll('.text-anime-style-2');
		
		animatedTextElements.forEach((element) => {
			let animationSplitText = new SplitText(element, { type: "chars, words" });
				gsap.from(animationSplitText.chars, {
					duration: 1,
					delay: delayValue,
					x: translateXValue,
					autoAlpha: 0,
					stagger: staggerAmount,
					ease: easeType,
					scrollTrigger: { trigger: element, start: "top 85%"},
				});
		});		
	}
	
	if ($('.text-anime-style-3').length) {		
		let	animatedTextElements = document.querySelectorAll('.text-anime-style-3');
		
		 animatedTextElements.forEach((element) => {
			//Reset if needed
			if (element.animation) {
				element.animation.progress(1).kill();
				element.split.revert();
			}

			element.split = new SplitText(element, {
				type: "lines,words,chars",
				linesClass: "split-line",
			});
			gsap.set(element, { perspective: 400 });

			gsap.set(element.split.chars, {
				opacity: 0,
				x: "50",
			});

			element.animation = gsap.to(element.split.chars, {
				scrollTrigger: { trigger: element,	start: "top 90%" },
				x: "0",
				y: "0",
				rotateX: "0",
				opacity: 1,
				duration: 1,
				ease: Back.easeOut,
				stagger: 0.02,
			});
		});		
	}

	/* Parallaxie js */
	var $parallaxie = $('.parallaxie');
	if($parallaxie.length && ($window.width() > 991))
	{
		if ($window.width() > 768) {
			$parallaxie.parallaxie({
				speed: 0.55,
				offset: 0,
			});
		}
	}

	/* Zoom Gallery screenshot */
	$('.gallery-items').magnificPopup({
		delegate: 'a',
		type: 'image',
		closeOnContentClick: false,
		closeBtnInside: false,
		mainClass: 'mfp-with-zoom',
		image: {
			verticalFit: true,
		},
		gallery: {
			enabled: true
		},
		zoom: {
			enabled: true,
			duration: 300, // don't foget to change the duration also in CSS
			opener: function(element) {
			  return element.find('img');
			}
		}
	});

	/* Contact form validation */
	var $contactform = $("#contactForm");
	$contactform.validator({focus: false}).on("submit", function (event) {
		if (!event.isDefaultPrevented()) {
			event.preventDefault();
			submitForm();
		}
	});

	function submitForm(){
		/* Send via EmailJS: inquiry to the studio + acknowledgement to the visitor */
		var M = window.NMMailer;
		if (!M || !M.isConfigured()) {
			submitMSG(false, "Sorry, the form is unavailable right now. Please call +91 8200954409.");
			return;
		}

		var data = {
			name: $.trim($("#name").val()),
			email: $.trim($("#email").val()),
			phone: $.trim($("#phone").val()),
			message: $.trim($("#message").val())
		};
		var digits = data.phone.replace(/\D/g, "").replace(/^(91|0)(?=[6-9]\d{9}$)/, "");
		if (!/^[6-9]\d{9}$/.test(digits)) {
			submitMSG(false, "Please enter a valid 10-digit mobile number.");
			return;
		}
		data.phone = "+91 " + digits;
		var firstName = data.name.split(" ")[0];
		var details = M.keyValue([
			["Name", M.esc(data.name)],
			["Email", '<a href="mailto:' + M.esc(data.email) + '" style="color:' + M.colors.primary + ';">' + M.esc(data.email) + '</a>'],
			["Phone", '<a href="tel:' + M.esc(data.phone) + '" style="color:' + M.colors.primary + ';">' + M.esc(data.phone) + '</a>']
		]);
		var messageBlock = data.message ? M.quote(M.nl2br(data.message)) : M.para("<em>No message provided.</em>");

		var studioHtml = M.layout({
			preheader: "New website inquiry from " + data.name,
			bodyHtml:
				M.para("<strong style=\"font-size:22px;color:" + M.colors.primary + ";\">New contact inquiry</strong>") +
				M.para("Submitted from the contact form on " + new Date().toLocaleString("en-IN") + ". Reply to this email to respond directly.") +
				M.heading("Contact details") + details +
				M.heading("Message") + messageBlock
		});

		var clientHtml = M.layout({
			preheader: "Thanks for reaching out - we will get back to you within one working day.",
			bodyHtml:
				M.para("<strong style=\"font-size:22px;color:" + M.colors.primary + ";\">Thank you, " + M.esc(firstName) + "!</strong>") +
				M.para("We have received your message and a 9M designer will get back to you within one working day. Here is a copy of what you sent us:") +
				messageBlock +
				M.heading("Your details") +
				M.keyValue([
					["Name", M.esc(data.name)],
					["Mobile", M.esc(data.phone)],
					["Email", M.esc(data.email)]
				]) +
				M.para("If anything here is incorrect, simply reply to this email.", "font-size:13px;color:" + M.colors.muted + ";margin-top:10px;") +
				M.heading("While you wait") +
				M.para("Get an indicative budget for your home in two minutes with our interior cost calculator, or browse our recent work.") +
				'<div style="margin-top:6px;">' +
					M.button(M.config.siteUrl + "/get-estimate.html", "Get your estimate", true) +
					M.button(M.config.siteUrl + "/projects.html", "View projects") +
				'</div>',
			footerNote: "You are receiving this because you contacted us through 9mdesignstudio.com."
		});

		var $btn = $contactform.find("button[type=submit]");
		$btn.prop("disabled", true).data("label", $btn.text()).text("sending...");
		submitMSG(true, "");

		M.send("studio", {
			subject: "New inquiry from " + data.name,
			reply_to: data.email,
			html_content: studioHtml
		}).then(function () {
			// Acknowledgement is best-effort: the inquiry already reached the studio
			return M.send("client", {
				to_email: data.email,
				to_name: data.name,
				subject: "We received your message - 9M Design Studio",
				html_content: clientHtml
			}).catch(function (err) { if (window.console) console.warn("Acknowledgement email failed", err); });
		}).then(function () {
			formSuccess();
		}, function (err) {
			if (window.console) console.error("Contact form email failed", err);
			submitMSG(false, "Sorry, your message could not be sent. Please try again or call +91 8200954409.");
		}).then(function () {
			$btn.prop("disabled", false).text($btn.data("label"));
		});
	}

	function formSuccess(){
		$contactform[0].reset();
		submitMSG(true, "Thank you! Your message has been sent. Please check your inbox for a confirmation.")
	}

	function submitMSG(valid, msg){
		if(valid){
			var msgClasses = "h4 text-success";
		} else {
			var msgClasses = "h4 text-danger";
		}
		$("#msgSubmit").removeClass().addClass(msgClasses).text(msg);
	}
	/* Contact form validation end */

	/* Our Project (filtering) Start */
	$window.on( "load", function(){
		if( $(".project-item-boxes").length ) {
				
			/* Init Isotope */
			var $menuitem = $(".project-item-boxes").isotope({
				itemSelector: ".project-item-box",
				layoutMode: "masonry",
				masonry: {
					// use outer width of grid-sizer for columnWidth
					columnWidth: 1,
				}
			});
				
			/* Filter items on click */
			var $menudisesnav = $(".our-Project-nav li a");
				$menudisesnav.on('click', function (e) { 
			
				var filterValue = $(this).attr('data-filter');
				$menuitem.isotope({
					filter: filterValue
				}); 
				
				$menudisesnav.removeClass("active-btn"); 
				$(this).addClass("active-btn");
				e.preventDefault();
			});		
			$menuitem.isotope({ filter: "*" });
		}			
	});
	/* Our Project (filtering) End */

	/* Animated Wow Js */	
	new WOW().init();

	/* Popup Video */
	if ($('.popup-video').length) {
		$('.popup-video').magnificPopup({
			type: 'iframe',
			mainClass: 'mfp-fade',
			removalDelay: 160,
			preloader: false,
			fixedContentPos: true
		});
	}
	
})(jQuery);
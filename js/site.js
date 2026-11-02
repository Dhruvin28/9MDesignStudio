/* Shared header / back-to-top behaviour for inner pages */
(function () {
	var header = document.getElementById('siteHeader'), progress = document.getElementById('progress'), toTop = document.getElementById('toTop');
	function onScroll() {
		var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
		header.classList.toggle('scrolled', y > 60);
		progress.style.width = (max > 0 ? y / max * 100 : 0) + '%';
		toTop.classList.toggle('show', y > 900);
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();
	toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
	var burger = document.getElementById('burger');
	function setNav(open) {
		document.body.classList.toggle('nav-open', open);
		document.body.style.overflow = open ? 'hidden' : '';
		burger.setAttribute('aria-expanded', open);
	}
	burger.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
	[].forEach.call(document.querySelectorAll('#nav a'), function (a) { a.addEventListener('click', function () { setNav(false); }); });
})();

/* scroll reveal */
(function () {
	var els = [].slice.call(document.querySelectorAll('.rv'));
	if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
	var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12 });
	els.forEach(function (e) { io.observe(e); });
})();

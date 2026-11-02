/* 9M Design Studio — home page interactions
   CAD-style drawn floor plan, isometric model, scroll reveals. */
(function () {
	'use strict';

	var NS = 'http://www.w3.org/2000/svg';
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var $ = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

	function el(tag, attrs, parent) {
		var n = document.createElementNS(NS, tag);
		for (var k in attrs) n.setAttribute(k, attrs[k]);
		if (parent) parent.appendChild(n);
		return n;
	}

	if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

	/* ---------------- Loader ---------------- */
	var loader = $('#loader'), loaderCount = $('#loaderCount');
	var pageLoaded = document.readyState === 'complete', minDone = false, started = false;
	window.addEventListener('load', function () { pageLoaded = true; });

	function startSite() {
		if (started) return;
		started = true;
		loader.classList.add('done');
		document.body.classList.add('is-ready');
		setTimeout(function () { loader.style.display = 'none'; }, 1300);
		$$('.hero .mask').forEach(function (m, i) { setTimeout(function () { m.classList.add('in'); }, 350 + i * 140); });
		
		$$('.hero [data-count]').forEach(function (n) { countUp(n, 2000); });
	}

	var t0 = performance.now();
	(function tick() {
		var p = Math.min(1, (performance.now() - t0) / (reduce ? 1 : 1500));
		loaderCount.textContent = Math.round(p * 100) + '%';
		if (p >= 1) minDone = true;
		if (minDone && pageLoaded) startSite();
		else requestAnimationFrame(tick);
	})();
	setTimeout(startSite, 6000); // safety net

	function countUp(node, dur) {
		var target = parseFloat(node.getAttribute('data-count')), suffix = node.getAttribute('data-suffix') || '';
		if (reduce) { node.textContent = target + suffix; return; }
		var o = { v: 0 };
		gsap.to(o, { v: target, duration: dur / 1000, ease: 'power2.out', onUpdate: function () { node.textContent = Math.round(o.v) + suffix; } });
	}

	/* ---------------- Header, progress, back-to-top ---------------- */
	var header = $('#siteHeader'), progress = $('#progress'), toTop = $('#toTop');
	function onScroll() {
		var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
		header.classList.toggle('scrolled', y > 60);
		progress.style.width = (max > 0 ? y / max * 100 : 0) + '%';
		toTop.classList.toggle('show', y > 900);
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();
	toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

	var burger = $('#burger');
	function setNav(open) {
		document.body.classList.toggle('nav-open', open);
		document.body.style.overflow = open ? 'hidden' : '';
		burger.setAttribute('aria-expanded', open);
	}
	burger.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
	$$('#nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });

	/* ---------------- Marquee ---------------- */
	(function () {
		var words = ['Residential interiors', 'Commercial spaces', '2D CAD drawings', 'Turnkey execution', '3D visualisation', 'Space planning', 'Lighting design', 'Bespoke furniture'];
		var star = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 2 L12 22 M2 12 H22 M5 5 L19 19 M19 5 L5 19"/></svg>';
		var html = '';
		for (var r = 0; r < 2; r++) words.forEach(function (w) { html += '<div class="marquee-item"><span>' + w + '</span>' + star + '</div>'; });
		$('#marqueeTrack').innerHTML = html;
	})();

	/* ---------------- Hero floor plan (drawn line by line) ---------------- */
	(function () {
		var svg = $('#heroPlan'), delay = 0;
		if (!svg) return;
		function d(path, cls, dl, t) {
			el('path', { d: path, pathLength: 1, class: 'd ' + cls, style: '--dl:' + dl + 's;--t:' + (t || 2) + 's' }, svg);
		}
		function txt(s, x, y, rot, tx) {
			var t = el('text', { x: x, y: y, style: '--tx:' + tx + 's' }, svg);
			if (rot) t.setAttribute('transform', 'rotate(' + rot + ' ' + x + ' ' + y + ')');
			t.textContent = s;
		}
		// shell
		d('M60 140 H1380 V820 H60 Z', 'wall', 0, 2.6);
		d('M72 152 H1368 V808 H72 Z', 'wall', .3, 2.6);
		// partitions
		d('M560 152 V470', 'wall', 1.0); d('M72 470 H330 M410 470 H560', 'wall', 1.1);
		d('M560 470 H820 M900 470 H1368', 'wall', 1.2); d('M900 152 V470', 'wall', 1.3);
		d('M1160 470 V808', 'wall', 1.4); d('M560 470 V620 M560 700 V808', 'wall', 1.5);
		// doors
		d('M330 470 V550 M410 470 A80 80 0 0 1 330 550', 'fine', 1.9, 1.4);
		d('M820 470 V550 M900 470 A80 80 0 0 1 820 550', 'fine', 2.0, 1.4);
		d('M560 620 H640 M560 700 A80 80 0 0 0 640 620', 'fine', 2.1, 1.4);
		d('M1000 808 V718 M1090 808 A90 90 0 0 0 1000 718', 'fine', 2.2, 1.4);
		// windows
		d('M150 140 H330 M150 146 H330 M150 152 H330', 'fine', 2.1, 1.2);
		d('M1000 140 H1200 M1000 146 H1200 M1000 152 H1200', 'fine', 2.2, 1.2);
		d('M1380 560 V740 M1374 560 V740 M1368 560 V740', 'fine', 2.3, 1.2);
		// furniture — bedroom
		d('M150 200 H330 V360 H150 Z M162 210 H232 V240 H162 Z M248 210 H318 V240 H248 Z M108 200 H140 V232 H108 Z M340 200 H372 V232 H340 Z', 'furn', 2.4, 2);
		d('M400 160 H550 V204 H400 Z M400 182 H550', 'furn', 2.6, 1.6);
		// living
		d('M600 380 H820 V450 H600 Z M600 400 H820', 'furn', 2.6, 1.8);
		d('M650 290 H770 V350 H650 Z', 'furn', 2.8, 1.6);
		d('M600 230 H660 V290 H600 Z', 'furn', 2.9, 1.4);
		d('M700 160 H840 V190 H700 Z', 'furn', 3.0, 1.4);
		d('M588 220 H860 V440 H588 Z', 'fine', 2.7, 2);
		// bedroom 2
		d('M1060 200 H1230 V350 H1060 Z M1072 210 H1140 V240 H1072 Z M1152 210 H1218 V240 H1152 Z', 'furn', 2.8, 2);
		d('M920 160 H1020 V196 H920 Z M970 215 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', 'furn', 3.0, 1.4);
		d('M1260 160 H1360 V204 H1260 Z', 'furn', 3.1, 1.4);
		// kitchen
		d('M80 500 H130 V780 H80 Z M130 748 H510 V800 H130 Z', 'furn', 2.7, 2);
		d('M220 600 H380 V670 H220 Z M105 650 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M105 690 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0', 'furn', 3.0, 1.6);
		// dining
		d('M740 600 H980 V700 H740 Z M760 574 H800 V594 H760 Z M840 574 H880 V594 H840 Z M920 574 H960 V594 H920 Z M760 706 H800 V726 H760 Z M840 706 H880 V726 H840 Z M920 706 H960 V726 H920 Z', 'furn', 3.0, 2);
		// bath
		d('M1176 490 H1360 V560 H1176 Z M1200 700 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M1300 740 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M1288 756 H1312 V796 H1288 Z', 'furn', 3.1, 1.8);
		// dimension lines
		d('M60 862 H1380 M60 850 V874 M1380 850 V874', 'dimln', 3.2, 1.8);
		d('M26 140 V820 M14 140 H38 M14 820 H38', 'dimln', 3.3, 1.8);
		d('M60 108 H560 M60 96 V120 M560 96 V120 M560 108 H900 M900 96 V120 M900 108 H1380 M1380 96 V120', 'dimln', 3.4, 1.8);
		txt('13 200', 690, 852, 0, 4.2); txt('6 800', 20, 490, -90, 4.2);
		txt('5 000', 280, 98, 0, 4.4); txt('3 400', 690, 98, 0, 4.4); txt('4 800', 1120, 98, 0, 4.4);
		txt('BEDROOM', 92, 180, 0, 4); txt('LIVING', 580, 180, 0, 4.1); txt('BED 02', 920, 232, 0, 4.2);
		txt('KITCHEN', 92, 496, 0, 4.2); txt('DINING', 580, 496, 0, 4.3); txt('BATH', 1176, 600, 0, 4.4);
	})();

	/* hero image slider */
	(function () {
		var box = $('#heroSlider'), card = $('#heroCard'), dots = $$('#heroDots button');
		if (!box) return;
		var slides = $$('#heroSlider .slide'), cur = 0, timer;
		function show(i) {
			cur = (i + slides.length) % slides.length;
			slides.forEach(function (s, k) { s.classList.toggle('active', k === cur); });
			dots.forEach(function (d, k) { d.classList.toggle('on', k === cur); });
			var d = dots[cur];
			card.href = d.dataset.href;
			card.querySelector('small').textContent = d.dataset.small;
			card.querySelector('strong').textContent = d.dataset.title;
		}
		function start() { if (!reduce) timer = setInterval(function () { show(cur + 1); }, 5000); }
		dots.forEach(function (d, k) { d.addEventListener('click', function () { clearInterval(timer); show(k); start(); }); });
		start();
	})();

	/* crosshair readout */
	(function () {
		var hero = $('#hero'), h = $('#crossH'), v = $('#crossV'), tag = $('#crossTag'), hud = $('#hudCoord');
		if (!h) return;
		if (!window.matchMedia('(hover: hover) and (min-width: 992px)').matches) return;
		hero.addEventListener('mousemove', function (e) {
			var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
			h.style.transform = 'translateY(' + y + 'px)';
			v.style.transform = 'translateX(' + x + 'px)';
			var label = 'X ' + String(Math.round(x * 10)).padStart(4, '0') + ' · Y ' + String(Math.round(y * 10)).padStart(4, '0');
			tag.style.transform = 'translate(' + (x + 14) + 'px,' + (y + 14) + 'px)';
			tag.textContent = label; hud.textContent = label;
			hero.classList.add('hovering');
		});
		hero.addEventListener('mouseleave', function () { hero.classList.remove('hovering'); });
	})();

	/* ---------------- Studio viewer: 2D plan <-> isometric 3D ---------------- */
	(function () {
		var viewer = $('#viewer');
		var planL = $('#planLayer'), isoL = $('#isoLayer'), cap = $('#viewerCap');
		var ROOM = { w: 6, d: 4.8, h: 2.8 };
		var ITEMS = [
			{ n: 'RUG', x: 1.3, y: 1.1, w: 3.2, d: 2.4, h: 0.02, c: 'rgba(124,135,127,.35)' },
			{ n: 'SOFA', x: 1.4, y: 0.12, w: 2.8, d: 0.95, h: 0.85, c: 'rgba(185,149,90,.45)' },
			{ n: 'TABLE', x: 2.3, y: 1.75, w: 1.2, d: 0.7, h: 0.4, c: 'rgba(244,240,231,.25)' },
			{ n: 'CHAIR', x: 4.5, y: 1.5, w: 0.9, d: 0.9, h: 0.8, c: 'rgba(185,149,90,.35)' },
			{ n: '', x: 4.7, y: 2.8, w: 0.5, d: 0.5, h: 0.45, c: 'rgba(244,240,231,.25)' },
			{ n: 'CONSOLE', x: 0.1, y: 1.5, w: 0.45, d: 2.2, h: 0.7, c: 'rgba(244,240,231,.2)' },
			{ n: '', x: 0.12, y: 0.12, w: 0.45, d: 0.9, h: 2.0, c: 'rgba(244,240,231,.14)' },
			{ n: '', x: 5.1, y: 0.15, w: 0.5, d: 0.5, h: 1.4, c: 'rgba(124,135,127,.55)' }
		];

		function tag(parent, x, y, s, extra) {
			var t = el('text', { x: x, y: y }, parent); t.textContent = s;
			if (extra) for (var k in extra) t.setAttribute(k, extra[k]);
			return t;
		}
		function dr(parent, d, stroke, dl, fill, t) {
			var p = el('path', { d: d, pathLength: 1, class: 'v-draw' + (fill ? ' f' : ''), stroke: stroke || '#f4f0e7', 'stroke-width': 1.4 }, parent);
			p.style.setProperty('--dl', dl + 's');
			if (t) p.style.setProperty('--t', t + 's');
			if (fill) p.style.setProperty('--f', fill);
			return p;
		}

		/* ---- plan (top view) ---- */
		(function () {
			var S = 78, ox = 66, oy = 128, X = function (m) { return ox + m * S; }, Y = function (m) { return oy + m * S; };
			var W = ROOM.w, D = ROOM.d;
			dr(planL, 'M' + (X(0) - 9) + ' ' + (Y(0) - 9) + ' H' + (X(W) + 9) + ' V' + (Y(D) + 9) + ' H' + (X(0) - 9) + ' Z', '#f4f0e7', 0, null, 2);
			dr(planL, 'M' + X(0) + ' ' + Y(0) + ' H' + X(W) + ' V' + Y(D) + ' H' + X(0) + ' Z', '#f4f0e7', .2, null, 2);
			// window on back wall
			[-9, -4.5, 0].forEach(function (o, i) { dr(planL, 'M' + X(1.5) + ' ' + (Y(0) + o) + ' H' + X(4.5), '#7c877f', .6 + i * .1); });
			// door on front wall
			dr(planL, 'M' + X(4.6) + ' ' + Y(D) + ' V' + (Y(D) - 0.9 * S) + ' M' + X(5.5) + ' ' + Y(D) + ' A' + (0.9 * S) + ' ' + (0.9 * S) + ' 0 0 0 ' + X(4.6) + ' ' + (Y(D) - 0.9 * S), '#7c877f', .9);
			ITEMS.forEach(function (it, i) {
				var p = dr(planL, 'M' + X(it.x) + ' ' + Y(it.y) + ' h' + it.w * S + ' v' + it.d * S + ' h' + (-it.w * S) + ' Z', i < 1 ? '#7c877f' : '#b9955a', 1 + i * .2, null, 1.4);
				if (it.n) tag(planL, X(it.x) + 6, Y(it.y) + it.d * S / 2 + 3, it.n);
			});
			// sofa cushions
			dr(planL, 'M' + X(1.4) + ' ' + Y(0.12) + ' m' + (2.8 * S / 2) + ' 0 v' + (0.95 * S), '#b9955a', 2.4);
			// dimensions
			dr(planL, 'M' + X(0) + ' ' + (Y(D) + 38) + ' H' + X(W) + ' M' + X(0) + ' ' + (Y(D) + 28) + ' v20 M' + X(W) + ' ' + (Y(D) + 28) + ' v20', '#b9955a', 2.6);
			dr(planL, 'M' + (X(0) - 36) + ' ' + Y(0) + ' V' + Y(D) + ' M' + (X(0) - 46) + ' ' + Y(0) + ' h20 M' + (X(0) - 46) + ' ' + Y(D) + ' h20', '#b9955a', 2.7);
			tag(planL, X(W / 2) - 16, Y(D) + 32, '6000');
			tag(planL, X(0) - 42, Y(D / 2), '4800', { transform: 'rotate(-90 ' + (X(0) - 42) + ' ' + Y(D / 2) + ')' });
			// north arrow + section mark
			dr(planL, 'M' + (X(W) - 20) + ' 80 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M' + (X(W) - 20) + ' 62 L' + (X(W) - 12) + ' 92 L' + (X(W) - 20) + ' 86 L' + (X(W) - 28) + ' 92 Z', '#b9955a', 2.8);
			tag(planL, X(W) - 24, 112, 'N');
		})();

		/* ---- isometric ---- */
		(function () {
			var S = 52, cx = 298, cy = 262, c30 = Math.cos(Math.PI / 6);
			function P(x, y, z) { return [cx + (x - y) * c30 * S, cy + (x + y) * 0.5 * S - z * S]; }
			function poly(pts) { return pts.map(function (p, i) { var q = P(p[0], p[1], p[2]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ') + ' Z'; }
			var W = ROOM.w, D = ROOM.d, H = ROOM.h;
			var g = el('g', {}, isoL);
			// floor + walls
			dr(g, poly([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]]), '#f4f0e7', 0, 'rgba(244,240,231,.07)', 1.6);
			dr(g, poly([[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]]), '#f4f0e7', .3, 'rgba(244,240,231,.05)', 1.6);
			dr(g, poly([[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]]), '#f4f0e7', .45, 'rgba(244,240,231,.1)', 1.6);
			// floor tiles
			var tiles = '';
			for (var i = 1; i < W; i++) tiles += poly([[i, 0, 0], [i, D, 0], [i, D, 0], [i, 0, 0]]).replace(' Z', '');
			for (var j = 1; j < D; j++) tiles += poly([[0, j, 0], [W, j, 0], [W, j, 0], [0, j, 0]]).replace(' Z', '');
			var tp = dr(g, tiles, '#7c877f', .9, null, 1.8); tp.setAttribute('stroke-width', .7);
			// window
			dr(g, poly([[1.5, 0, .9], [4.5, 0, .9], [4.5, 0, 2.3], [1.5, 0, 2.3]]), '#b9955a', .9, 'rgba(185,149,90,.12)', 1.4);
			var mm = '', a = P(3, 0, .9), b = P(3, 0, 2.3), c1 = P(2.5, 0, .9), c2 = P(2.5, 0, 2.3), d1 = P(3.5, 0, .9), d2 = P(3.5, 0, 2.3);
			dr(g, 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1], '#b9955a', 1.2); dr(g, 'M' + c1[0] + ' ' + c1[1] + ' L' + c2[0] + ' ' + c2[1], '#b9955a', 1.2); dr(g, 'M' + d1[0] + ' ' + d1[1] + ' L' + d2[0] + ' ' + d2[1], '#b9955a', 1.2);
			// furniture boxes, back to front
			var items = ITEMS.slice().sort(function (p, q) { return (p.x + p.w / 2 + p.y + p.d / 2) - (q.x + q.w / 2 + q.y + q.d / 2); });
			items.forEach(function (it, i) {
				var ig = el('g', { class: 'iso-item', style: '--dl:' + (1.2 + i * .22) + 's' }, g);
				var x = it.x, y = it.y, w = it.w, d = it.d, h = it.h, dl = 1.2 + i * .22;
				dr(ig, poly([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]]), '#f4f0e7', dl, it.c, 1.2);
				dr(ig, poly([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]]), '#f4f0e7', dl, it.c.replace(/[\d.]+\)$/, function (m) { return (parseFloat(m) * .6).toFixed(2) + ')'; }), 1.2);
				dr(ig, poly([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]]), '#d4b987', dl, it.c.replace(/[\d.]+\)$/, function (m) { return Math.min(1, parseFloat(m) * 1.6).toFixed(2) + ')'; }), 1.2);
			});
			// pendant light
			var l1 = P(3, 2.4, H), l2 = P(3, 2.4, 2.1), l3 = P(3, 2.4, 1.9);
			dr(g, 'M' + l1[0] + ' ' + l1[1] + ' L' + l2[0] + ' ' + l2[1], '#b9955a', 2.8);
			dr(g, 'M' + l2[0] + ' ' + l2[1] + ' l-16 14 h32 Z', '#b9955a', 3, 'rgba(185,149,90,.5)');
			// axes
			var o = P(0, D + .6, 0), ax = P(1.2, D + .6, 0), ay = P(0, D + 1.8, 0), az = P(0, D + .6, 1.2);
			dr(g, 'M' + o[0] + ' ' + o[1] + ' L' + ax[0] + ' ' + ax[1], '#e5675b', 3.2);
			dr(g, 'M' + o[0] + ' ' + o[1] + ' L' + ay[0] + ' ' + ay[1], '#6fbf7a', 3.3);
			dr(g, 'M' + o[0] + ' ' + o[1] + ' L' + az[0] + ' ' + az[1], '#6aa0e5', 3.4);
			tag(isoL, 390, 520, 'ISOMETRIC · 30°');
		})();

		/* ---- view switching ---- */
		var cur = 'plan', timer, interacted = false, active = false;
		function run(layer) { layer.classList.remove('run'); void layer.getBoundingClientRect(); layer.classList.add('run'); }
		function show(v) {
			cur = v;
			planL.classList.toggle('off', v !== 'plan'); isoL.classList.toggle('off', v !== 'iso');
			$$('.viewer-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === v); });
			cap.textContent = v === 'plan' ? 'PLAN VIEW · 1:50' : 'MODEL VIEW · ISOMETRIC';
			run(v === 'plan' ? planL : isoL);
		}
		$$('.viewer-tabs button').forEach(function (b) {
			b.addEventListener('click', function () { interacted = true; clearInterval(timer); show(b.dataset.view); });
		});
		new IntersectionObserver(function (es) {
			es.forEach(function (e) {
				if (e.isIntersecting && !active) {
					active = true; show('plan');
					if (!reduce) timer = setInterval(function () { if (!interacted) show(cur === 'plan' ? 'iso' : 'plan'); }, 9000);
				}
			});
		}, { threshold: 0.35 }).observe(viewer);
	})();

	/* ---------------- Services: cursor-following preview ---------------- */
	(function () {
		var list = $('#svcList'), pv = $('#svcPreview');
		if (!window.matchMedia('(hover: hover) and (min-width: 992px)').matches) return;
		var imgs = $$('img', pv), tx = 0, ty = 0, x = 0, y = 0, raf = null, on = false;
		function loop() {
			x += (tx - x) * .14; y += (ty - y) * .14;
			pv.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + ((tx - x) * .05) + 'deg)';
			raf = requestAnimationFrame(loop);
		}
		$$('.svc-row', list).forEach(function (row) {
			row.addEventListener('mouseenter', function (e) {
				imgs.forEach(function (im, i) { im.classList.toggle('on', i === +row.dataset.img); });
				if (!on) { x = tx = e.clientX + 40; y = ty = e.clientY - 200; }
				on = true; pv.classList.add('on'); if (!raf) loop();
			});
			row.addEventListener('mousemove', function (e) { tx = e.clientX + 40; ty = e.clientY - 210; });
		});
		list.addEventListener('mouseleave', function () { on = false; pv.classList.remove('on'); cancelAnimationFrame(raf); raf = null; });
	})();

	/* ---------------- Compare slider ---------------- */
	(function () {
		var box = $('#cmp'), range = $('#cmpRange'), dragging = false, state = { v: 50 };
		function set(v) { v = Math.max(0, Math.min(100, v)); state.v = v; range.value = v; box.style.setProperty('--pos', v + '%'); }
		function fromEvent(e) { var r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
		box.addEventListener('pointerdown', function (e) { dragging = true; box.setPointerCapture(e.pointerId); fromEvent(e); gsap.killTweensOf(state); });
		box.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
		box.addEventListener('pointerup', function () { dragging = false; });
		box.addEventListener('pointercancel', function () { dragging = false; });
		range.addEventListener('input', function () { set(+range.value); });
		box.tabIndex = 0;
		box.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') set(state.v - 4); if (e.key === 'ArrowRight') set(state.v + 4); });
		if (!reduce) {
			var demoed = false;
			new IntersectionObserver(function (es) {
				if (es[0].isIntersecting && !demoed) {
					demoed = true; state.v = 50;
					gsap.timeline({ delay: .6 })
						.to(state, { v: 88, duration: 1.3, ease: 'power2.inOut', onUpdate: function () { set(state.v); } })
						.to(state, { v: 18, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { set(state.v); } })
						.to(state, { v: 52, duration: 1.2, ease: 'power2.inOut', onUpdate: function () { set(state.v); } });
				}
			}, { threshold: .5 }).observe(box);
		}
	})();

	/* ---------------- Scroll reveals ---------------- */
	(function () {
		var targets = $$('.rv, .pj, .proc');
		$$('.pj').forEach(function (p, i) { p.style.transitionDelay = (i % 2) * .15 + 's'; });
		$$('.proc').forEach(function (p, i) { p.style.setProperty('--dl', '0s'); });
		if (reduce || !('IntersectionObserver' in window)) { targets.forEach(function (t) { t.classList.add('in'); }); }
		else {
			var io = new IntersectionObserver(function (es) {
				es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
			}, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
			targets.forEach(function (t) { io.observe(t); });
		}
		// stat counters
		var cio = new IntersectionObserver(function (es) {
			es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target, 2200); cio.unobserve(e.target); } });
		}, { threshold: .6 });
		$$('.stat [data-count]').forEach(function (n) { cio.observe(n); });
	})();

	/* ---------------- Parallax ---------------- */
	if (!reduce && window.gsap && window.ScrollTrigger) {
		gsap.to('.hero-photo', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
		gsap.to('.hero-copy', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
	}

	/* ---------------- Active-section nav highlight ---------------- */
	$$('.nav-link').forEach(function (a) {
		if (a.getAttribute('href') !== 'index.html') a.classList.remove('active');
	});
})();

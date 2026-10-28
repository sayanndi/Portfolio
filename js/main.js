/* Shared behaviour for all pages */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- page transition ---------- */
  const curtain = $('#curtain');
  if (curtain) {
    curtain.classList.add('uncover');
    $$('a[href$=".html"]').forEach(a => {
      a.addEventListener('click', e => {
        if (a.target === '_blank' || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        curtain.classList.remove('uncover');
        void curtain.offsetWidth;
        curtain.classList.add('cover');
        setTimeout(() => (location.href = href), 450);
      });
    });
    window.addEventListener('pageshow', e => {
      if (e.persisted) { curtain.className = ''; curtain.classList.add('uncover'); }
    });
  }

  /* ---------- active nav + mobile menu ---------- */
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
  const burger = $('.burger'), links = $('.links');
  if (burger) burger.addEventListener('click', () => links.classList.toggle('open'));

  /* ---------- scroll progress ---------- */
  const bar = $('.progress');
  addEventListener('scroll', () => {
    const h = document.documentElement;
    if (bar) bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + '%';
  }, { passive: true });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- cursor glow + card spotlight / tilt ---------- */
  const glow = $('.glow');
  addEventListener('pointermove', e => {
    if (glow) { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }
  });
  $$('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px');
      c.style.setProperty('--my', y + 'px');
      if (c.dataset.tilt !== undefined) {
        const rx = ((y / r.height) - .5) * -8, ry = ((x / r.width) - .5) * 8;
        c.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    c.addEventListener('pointerleave', () => (c.style.transform = ''));
  });

  /* ---------- particle network background ---------- */
  const cv = $('#bg');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, pts = [];
    const mouse = { x: -999, y: -999 };
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    const init = () => {
      W = cv.width = innerWidth; H = cv.height = innerHeight;
      const n = Math.min(90, Math.floor(W * H / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35
      }));
    };
    init(); addEventListener('resize', init);
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7);
        ctx.fillStyle = 'rgba(148,163,255,.7)'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(99,102,241,${.28 * (1 - d / 130)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const m = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
        if (m < 160) {
          ctx.strokeStyle = `rgba(34,211,238,${.5 * (1 - m / 160)})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- typing effect ---------- */
  const t = $('#typed');
  if (t) {
    const words = JSON.parse(t.dataset.words);
    let w = 0, c = 0, del = false;
    const tick = () => {
      const word = words[w];
      t.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; }
      c += del ? -1 : 1;
      setTimeout(tick, del ? 40 : 85);
    };
    tick();
  }

  /* ---------- count-up numbers ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = parseFloat(el.dataset.count), dec = el.dataset.dec ? 1 : 0;
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now();
    const step = now => {
      const k = Math.min((now - t0) / 1600, 1), v = end * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    cio.unobserve(el);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- project filter ---------- */
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const f = b.dataset.f;
    $$('.proj').forEach(p => {
      p.classList.toggle('hide', f !== 'all' && !p.dataset.cat.split(' ').includes(f));
    });
  }));

  /* ---------- contact form -> opens mail client ---------- */
  const form = $('#contactForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = encodeURIComponent(`${d.get('message')}\n\n— ${d.get('name')} (${d.get('email')})`);
    location.href = `mailto:sayan.2022.nandi@gmail.com?subject=${encodeURIComponent('Portfolio enquiry from ' + d.get('name'))}&body=${body}`;
  });

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();

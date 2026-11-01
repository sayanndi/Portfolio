/* Sayan's Terminal: the creative feature.
 *
 * Drop-in: add  <script src="js/terminal.js"></script>  after main.js on every page.
 * It injects its own CSS, a labelled "Try my terminal" button, and the terminal dialog.
 * Visitors explore the portfolio by typing commands (try: help). Edit the DATA block to change content.
 */
(() => {
  'use strict';
  if (window.__snTerminal) return;
  window.__snTerminal = true;

  const SCRIPT = document.currentScript;
  const BASE = SCRIPT && SCRIPT.src ? new URL('../', SCRIPT.src) : new URL('./', location.href);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= DATA (edit freely) ================= */
  const DATA = {
    about: [
      "Hi, I'm Sayan Nandi, a B.Tech CSE student at JIS University, Kolkata.",
      'I build multi-agent research tools, speech-to-insight pipelines and ML-powered web apps.',
      'Recently: research intern at Jalpaiguri Govt. Engineering College (image segmentation),',
      'published at RAISR-2026, and a GSSoC 2026 contributor.'
    ],
    skills: [
      ['Languages & core', 'Python · C++ · Java · SQL · NumPy · Pandas · Machine Learning · Deep Learning'],
      ['Web', 'HTML5 · CSS3 · JavaScript · React · Node · Bootstrap · Tailwind'],
      ['Tools', 'VS Code · PyCharm']
    ],
    projects: [
      { key: 'researchmind', match: 'researchmind', name: 'ResearchMind: AI Research Assistant',
        stack: 'Python · LangChain · Groq · Tavily · Streamlit',
        blurb: 'Multi-agent pipeline that turns any topic into a sourced, scored research report.' },
      { key: 'videoagent', match: 'video agent', name: 'AI Video Agent',
        stack: 'Python · LangChain · Groq · Whisper · ChromaDB · Streamlit',
        blurb: 'Turns YouTube links and audio/video (English + Hinglish) into summaries, action items and RAG chat.' },
      { key: 'airbnb', match: 'airbnb', name: 'NYC Airbnb Room Type Predictor',
        stack: 'Random Forest · FastAPI · Pydantic · HTML/CSS/JS · Render',
        blurb: 'Predicts the room type you are likely to get from location, price, reviews, host and availability.' }
    ],
    education: [
      ['2023 - 2027', 'B.Tech, Computer Science & Engineering, JIS University (CGPA 9.4)'],
      ['2023', 'Higher Secondary, Arambagh High School (85%)'],
      ['Jun - Jul 2026', 'Research Intern, Jalpaiguri Govt. Engineering College']
    ],
    achievements: [
      'Publication: "An AI Based Decision Support Ecosystem for Urban Air Quality Management" (RAISR-2026)',
      'TCS CodeVita Season XIII: global rank 6369',
      '57 DSA problems solved on LeetCode',
      'GSSoC 2026 contributor',
      'NPTEL: Programming in Java (78%) and Cloud Computing (81%)'
    ],
    fortunes: [
      'It works on my machine. Ship the machine.',
      'A bug fixed at 2am is a feature at 3am.',
      'There are two hard problems: naming things, cache invalidation, and off-by-one errors.',
      'First make it work, then make it right, then make it fast.',
      'The best agent is the one that knows when to ask for help.',
      'Rate limits are just the universe telling you to take a break.'
    ]
  };

  /* Simulated pipelines for the `run` command: [delay ms, css class, text] */
  const TRACES = {
    researchmind: [
      [200, 'tm-dim', '$ streamlit run app.py   # topic: "your topic here"'],
      [450, 'tm-ok', '[search agent]  querying Tavily for sources...'],
      [550, '', '[search agent]  candidate sources collected'],
      [550, '', '[reader agent]   scraping pages with BeautifulSoup (output capped)'],
      [600, 'tm-warn', '[groq]           rate limit hit -> retry with backoff'],
      [600, '', '[reader agent]   retry ok, notes extracted'],
      [500, '', '[writer chain]   drafting structured report with sources'],
      [550, '', '[critic chain]   reviewing draft and scoring quality'],
      [400, 'tm-ok', 'done: a sourced, structured report with a quality score.'],
      [100, 'tm-dim', '(simulated trace of the real pipeline, not a live run)']
    ],
    videoagent: [
      [200, 'tm-dim', '$ streamlit run app.py   # input: YouTube link'],
      [450, 'tm-ok', '[yt-dlp]      fetching media from the link'],
      [500, '', '[ffmpeg]      extracting the audio track'],
      [650, '', '[whisper]     transcribing locally (English / Hinglish)'],
      [550, '', '[langchain]   map-reduce summarisation over transcript chunks'],
      [550, '', '[chains]      pulling out action items, key decisions, open questions'],
      [500, '', '[chromadb]    embedding transcript (Hugging Face) for RAG chat'],
      [400, 'tm-ok', 'done: summary, action items, downloadable report, and chat over the transcript.'],
      [100, 'tm-dim', '(simulated trace of the real pipeline, not a live run)']
    ],
    airbnb: [
      [200, 'tm-dim', '$ open the web form   # location, price, stay, reviews, host, availability'],
      [450, 'tm-ok', '[browser]   JavaScript sends POST /predict'],
      [500, '', '[fastapi]   Pydantic validates the input'],
      [550, '', '[model]     Random Forest predicts the room type'],
      [450, '', '[render]    response returned from the deployed API'],
      [400, 'tm-ok', 'prediction: Private room   (demo value)'],
      [100, 'tm-dim', '(simulated trace of the real pipeline, not a live run)']
    ]
  };

  const THEMES = {
    default: ['#6366f1', '#22d3ee', '#f472b6'],
    neon:    ['#ff2bd6', '#00f0ff', '#faff00'],
    matrix:  ['#00c853', '#00ff7f', '#b2ff59'],
    amber:   ['#ff9800', '#ffc107', '#ff5722'],
    sunset:  ['#ff7a59', '#ffb347', '#c471ed']
  };

  const PAGES = { home: 'index.html', about: 'about.html', projects: 'projects.html', skills: 'skills.html', contact: 'contact.html' };

  /* ================= small helpers ================= */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  function applyTheme(name) {
    const root = document.documentElement.style;
    if (name === 'default') { ['--a1', '--a2', '--a3'].forEach(p => root.removeProperty(p)); return; }
    const t = THEMES[name];
    root.setProperty('--a1', t[0]); root.setProperty('--a2', t[1]); root.setProperty('--a3', t[2]);
  }
  const savedTheme = store.get('sn-theme');
  if (savedTheme && THEMES[savedTheme]) applyTheme(savedTheme);

  /* inject stylesheet next to this script */
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('css/terminal.css', BASE).href;
  document.head.appendChild(css);

  /* ================= UI ================= */
  let dock, fab, tip, overlay, win, out, input, chipsBox;
  let busy = false, cancel = false, booted = false, isOpen = false, lastFocus = null, prevOverflow = '';
  const history = []; let hIdx = 0;

  function build() {
    dock = document.createElement('div');
    dock.className = 'tm-dock';
    dock.innerHTML =
      '<button class="tm-tip" type="button" hidden>Psst! Type <code>help</code> in my terminal. A few commands are hidden.</button>' +
      '<button class="tm-fab" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Open Sayan\'s interactive terminal">' +
      '<span class="tm-fab-icon" aria-hidden="true">&gt;_</span><span class="tm-fab-text">Try my terminal</span></button>';
    document.body.appendChild(dock);
    fab = dock.querySelector('.tm-fab');
    tip = dock.querySelector('.tm-tip');

    overlay = document.createElement('div');
    overlay.className = 'tm-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="tm-win" role="dialog" aria-modal="true" aria-label="Interactive terminal">' +
      '<div class="tm-bar"><span class="tm-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="tm-title">sayan@portfolio: ~</span>' +
      '<button class="tm-x" type="button" aria-label="Close terminal (Esc)">&#10005;</button></div>' +
      '<div class="tm-out" role="log" aria-live="polite" tabindex="-1"></div>' +
      '<div class="tm-chips" aria-label="Quick commands"></div>' +
      '<form class="tm-form" autocomplete="off"><span class="tm-ps" aria-hidden="true">$</span>' +
      '<input class="tm-in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ' +
      'aria-label="Type a command" placeholder="type a command, e.g. help"></form></div>';
    document.body.appendChild(overlay);
    win = overlay.querySelector('.tm-win');
    out = overlay.querySelector('.tm-out');
    input = overlay.querySelector('.tm-in');
    chipsBox = overlay.querySelector('.tm-chips');

    ['help', 'about', 'skills', 'projects', 'run researchmind', 'neofetch', 'contact', 'theme neon'].forEach(c => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tm-chip'; b.textContent = c;
      b.addEventListener('click', () => exec(c, true));
      chipsBox.appendChild(b);
    });

    fab.addEventListener('click', open);
    tip.addEventListener('click', open);
    overlay.querySelector('.tm-x').addEventListener('click', close);
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    out.addEventListener('click', () => { if (!String(getSelection())) input.focus(); });

    overlay.querySelector('.tm-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value; input.value = '';
      exec(v);
    });
    input.addEventListener('keydown', onInputKey);
    document.addEventListener('keydown', onGlobalKey);

    /* first-visit speech bubble (once per session) */
    if (!session.get('sn-tip')) {
      setTimeout(() => {
        if (isOpen) return;
        tip.hidden = false;
        requestAnimationFrame(() => tip.classList.add('show'));
        session.set('sn-tip', '1');
        setTimeout(hideTip, 11000);
      }, 1500);
    }
  }

  function hideTip() {
    if (!tip || tip.hidden) return;
    tip.classList.remove('show');
    setTimeout(() => { tip.hidden = true; }, 400);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('on'));
    fab.setAttribute('aria-expanded', 'true');
    hideTip();
    if (!booted) { booted = true; boot(); }
    input.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    cancel = true;
    overlay.classList.remove('on');
    setTimeout(() => { if (!isOpen) overlay.hidden = true; }, reduced ? 0 : 200);
    document.body.style.overflow = prevOverflow;
    fab.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onGlobalKey(e) {
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (!isOpen) {
      if ((e.key === '`' || e.key === '~') && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {            /* keep focus inside the dialog */
      const f = [...win.querySelectorAll('button, input')].filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function onInputKey(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } else { hIdx = history.length; input.value = ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault(); complete();
    } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      if (busy) cancel = true; else { line('$ ' + input.value + '^C', 'tm-dim'); input.value = ''; }
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault(); out.textContent = '';
    }
  }

  /* ================= printing ================= */
  const sleep = ms => (reduced ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  const scrollDown = () => { out.scrollTop = out.scrollHeight; };

  function line(text = '', cls = '') {
    const d = document.createElement('div');
    d.className = 'tm-l' + (cls ? ' ' + cls : '');
    d.textContent = text;
    out.appendChild(d); scrollDown();
    return d;
  }
  function row(key, desc, width = 14) {
    const d = document.createElement('div'); d.className = 'tm-l';
    const k = document.createElement('span'); k.className = 'tm-cmd'; k.textContent = key.padEnd(width);
    const v = document.createElement('span'); v.textContent = desc;
    d.append(k, v); out.appendChild(d); scrollDown();
  }
  function linkLine(label, href) {
    const d = document.createElement('div'); d.className = 'tm-l';
    const k = document.createElement('span'); k.className = 'tm-dim'; k.textContent = label.padEnd(12);
    const a = document.createElement('a'); a.className = 'tm-a'; a.href = href;
    a.textContent = href.replace(/^mailto:|^tel:|^https?:\/\//, '').replace(/\/$/, '');
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    d.append(k, a); out.appendChild(d); scrollDown();
  }
  async function steps(list) {
    for (const [ms, cls, text] of list) {
      if (cancel) { line('^C', 'tm-err'); return false; }
      await sleep(ms);
      line(text, cls);
    }
    return true;
  }

  function boot() {
    line("Welcome to Sayan's terminal.", 'tm-h');
    line('Type help to see what you can do, or tap a shortcut below.');
    line('Tip: a few commands are hidden. Try ls.', 'tm-dim');
    line('');
  }

  /* ================= live links (read from the site's own pages) ================= */
  let linkCache = null;
  async function getLinks() {
    if (linkCache) return linkCache;
    const res = { resume: null, email: null, phone: null, profiles: [], projects: [] };
    const safe = href => {
      if (!href || href === '#') return null;
      try {
        const u = new URL(href, BASE);
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : null;
      } catch (e) { return null; }
    };
    const pull = async (file, fn) => {
      try {
        const r = await fetch(new URL(file, BASE).href);
        if (!r.ok) return;
        fn(new DOMParser().parseFromString(await r.text(), 'text/html'));
      } catch (e) { /* offline or file:// */ }
    };
    await Promise.all([
      pull('contact.html', doc => {
        doc.querySelectorAll('.contact-list a').forEach(a => {
          const href = safe(a.getAttribute('href'));
          if (!href) return;
          const label = a.textContent.replace(/[^\w .+@-]/g, ' ').replace(/\s+/g, ' ').trim();
          if (href.startsWith('mailto:')) res.email = href;
          else if (href.startsWith('tel:')) res.phone = href;
          else res.profiles.push([label, href]);
        });
      }),
      pull('index.html', doc => {
        const a = [...doc.querySelectorAll('a')].find(x => /resume/i.test(x.textContent));
        if (a) res.resume = safe(a.getAttribute('href'));
      }),
      pull('projects.html', doc => {
        doc.querySelectorAll('.proj').forEach(p => {
          const title = (p.querySelector('h3') || {}).textContent || '';
          const a = [...p.querySelectorAll('a')].find(x => /code/i.test(x.textContent));
          const href = a ? safe(a.getAttribute('href')) : null;
          if (href) res.projects.push([title.toLowerCase(), href]);
        });
      })
    ]);
    linkCache = res;
    return res;
  }

  /* ================= commands ================= */
  const COMMANDS = {
    help() {
      line('Commands', 'tm-h');
      row('about', 'who I am');
      row('skills', 'my toolbox');
      row('projects', 'things I have built');
      row('run <name>', 'watch a pipeline run: researchmind | videoagent | airbnb');
      row('education', 'studies and experience');
      row('achievements', 'publication, ranks, open source');
      row('contact', 'email and profiles');
      row('resume', 'link to my CV');
      row('goto <page>', 'home | about | projects | skills | contact');
      row('theme <name>', 'reskin the whole site: ' + Object.keys(THEMES).join(' | '));
      row('neofetch', 'quick system card');
      row('clear / exit', 'tidy up or close');
      line('');
      line('Tab completes, arrow keys browse history, Ctrl+C stops a run.', 'tm-dim');
    },

    about() { DATA.about.forEach(t => line(t)); line(''); line('Next: skills, projects, or run researchmind.', 'tm-dim'); },

    whoami() { line('sayan: AI agent builder, ML enthusiast, always learning.'); },

    skills() {
      DATA.skills.forEach(([h, v]) => { line(h, 'tm-h'); line('  ' + v); });
    },

    async projects() {
      const links = await getLinks();
      DATA.projects.forEach((p, i) => {
        line(`${i + 1}. ${p.name}`, 'tm-h');
        line('   ' + p.blurb);
        line('   ' + p.stack, 'tm-dim');
        const hit = links.projects.find(([t]) => t.includes(p.match));
        if (hit) linkLine('   code', hit[1]);
        line('   try: run ' + p.key, 'tm-dim');
      });
      line('');
      line('Plus a publication at RAISR-2026 (type achievements).', 'tm-dim');
    },

    async run(arg) {
      if (!arg) {
        line('usage: run <name>', 'tm-warn');
        DATA.projects.forEach(p => row(p.key, p.name, 16));
        return;
      }
      const key = Object.keys(TRACES).find(k => k.startsWith(arg) || arg.startsWith(k) || k.includes(arg.replace(/\s/g, '')));
      if (!key) { line(`run: no project called "${arg}". Try: ${Object.keys(TRACES).join(', ')}`, 'tm-err'); return; }
      await steps(TRACES[key]);
    },

    education() { DATA.education.forEach(([d, t]) => row(d, t, 16)); },
    experience() { COMMANDS.education(); },
    achievements() { DATA.achievements.forEach(t => line('* ' + t)); },

    async contact() {
      const l = await getLinks();
      if (!l.email && !l.phone && !l.profiles.length) {
        line('Open the Contact page to reach me:', 'tm-dim');
        line('type: goto contact');
        return;
      }
      if (l.email) linkLine('email', l.email);
      if (l.phone) linkLine('phone', l.phone);
      l.profiles.forEach(([name, href]) => linkLine(name.toLowerCase().slice(0, 11) || 'link', href));
    },

    async resume() {
      const l = await getLinks();
      if (l.resume) { linkLine('resume', l.resume); line('Click the link to open it.', 'tm-dim'); }
      else line('The resume button is on the Home page.', 'tm-dim');
    },

    async goto(arg) {
      const key = arg.replace(/\.html$/, '') || '';
      if (!PAGES[key]) { line('usage: goto <home | about | projects | skills | contact>', 'tm-warn'); return; }
      line('Navigating to ' + key + '...', 'tm-ok');
      await sleep(350);
      location.href = new URL(PAGES[key], BASE).href;
    },

    theme(arg) {
      if (!arg) {
        line('Pick a theme:', 'tm-h');
        Object.keys(THEMES).forEach(n => row(n, ''));
        line('usage: theme <name>', 'tm-dim');
        return;
      }
      if (!THEMES[arg]) { line(`theme: "${arg}" not found. Options: ${Object.keys(THEMES).join(', ')}`, 'tm-err'); return; }
      applyTheme(arg); store.set('sn-theme', arg);
      line(`Theme set to ${arg}. It stays on every page.`, 'tm-ok');
      if (arg !== 'default') line('Back to normal any time: theme default', 'tm-dim');
    },

    neofetch() {
      const art = [' ____  _   _ ', '/ ___|| \\ | |', '\\___ \\|  \\| |', ' ___) | |\\  |', '|____/|_| \\_|', '             '];
      const info = [
        'sayan@portfolio',
        '---------------',
        'Role    : AI agent builder',
        'Study   : B.Tech CSE, JIS University',
        'CGPA    : 9.4',
        'Focus   : agents, RAG, speech, vision',
        'Hosted  : AWS Amplify Hosting'
      ];
      info.forEach((txt, i) => {
        const d = document.createElement('div'); d.className = 'tm-l';
        const a = document.createElement('span'); a.className = 'tm-art'; a.textContent = (art[i] || '             ').padEnd(16);
        const b = document.createElement('span'); b.textContent = txt;
        if (i === 0) b.className = 'tm-h';
        d.append(a, b); out.appendChild(d);
      });
      scrollDown();
    },

    ls() {
      line('about.txt   skills.txt   projects/   resume.pdf   secrets/', 'tm-cmd');
    },

    cat(arg) {
      if (arg === 'about.txt' || arg === 'about') return COMMANDS.about();
      if (arg === 'skills.txt' || arg === 'skills') return COMMANDS.skills();
      if (arg === 'projects' || arg === 'projects/') return COMMANDS.projects();
      if (arg === 'resume.pdf' || arg === 'resume') return COMMANDS.resume();
      if (arg === 'secrets' || arg === 'secrets/') { line('cat: secrets: Is a directory', 'tm-err'); line('hint: some doors need sudo', 'tm-dim'); return; }
      line(arg ? `cat: ${arg}: No such file` : 'usage: cat <file>', 'tm-err');
    },

    fortune() { line(DATA.fortunes[Math.floor(Math.random() * DATA.fortunes.length)], 'tm-ok'); },
    coffee() { line('Brewing...', 'tm-dim'); line('   ( (\n    ) )\n  .______.\n  |      |]\n  \\      /\n   `----\'', 'tm-art'); line('Fuel acquired. Back to building.'); },
    date() { line(new Date().toString()); },
    echo(arg) { line(arg); },
    history() { history.forEach((h, i) => line(String(i + 1).padStart(3) + '  ' + h, 'tm-dim')); },
    clear() { out.textContent = ''; },
    exit() { close(); },

    sudo() { line('sayan is not in the sudoers file. This incident will be reported.', 'tm-err'); line('...unless you are a recruiter. Try: sudo hire sayan', 'tm-dim'); }
  };
  COMMANDS.cls = COMMANDS.clear; COMMANDS.quit = COMMANDS.exit; COMMANDS.dir = COMMANDS.ls; COMMANDS['?'] = COMMANDS.help;

  async function hire() {
    await steps([
      [200, 'tm-dim', '[sudo] password for recruiter: ********'],
      [600, 'tm-ok', 'Verifying skills .......... ok'],
      [450, 'tm-ok', 'Checking projects ......... ok'],
      [450, 'tm-ok', 'Reading CGPA .............. 9.4'],
      [450, 'tm-ok', 'Access granted.'],
      [600, '', 'Drafting offer letter...'],
      [700, 'tm-warn', 'Just kidding. But let us talk! Type contact.']
    ]);
  }

  const NAMES = Object.keys(COMMANDS).filter(n => !['cls', 'quit', 'dir', '?', 'experience'].includes(n));
  const ARGS = { run: Object.keys(TRACES), theme: Object.keys(THEMES), goto: Object.keys(PAGES) };

  function complete() {
    const v = input.value.toLowerCase();
    const parts = v.split(' ');
    const pool = parts.length === 1 ? NAMES : (ARGS[parts[0]] || []);
    const stem = parts[parts.length - 1];
    const hits = pool.filter(n => n.startsWith(stem));
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      input.value = parts.join(' ') + ' ';
    } else if (hits.length > 1) {
      line('$ ' + input.value, 'tm-dim');
      line(hits.join('   '), 'tm-cmd');
    }
  }

  async function exec(raw, fromChip) {
    const text = String(raw).trim();
    const echo = document.createElement('div'); echo.className = 'tm-l';
    const ps = document.createElement('span'); ps.className = 'tm-ps'; ps.textContent = '$ ';
    const cmdText = document.createElement('span'); cmdText.textContent = text;
    echo.append(ps, cmdText); out.appendChild(echo); scrollDown();
    if (!text) return;

    history.push(text); hIdx = history.length;
    if (busy) { line('Still running. Press Ctrl+C to stop it.', 'tm-warn'); return; }
    busy = true; cancel = false;
    try {
      const norm = text.toLowerCase().replace(/\s+/g, ' ');
      if (/^sudo hire( sayan)?$/.test(norm)) {
        await hire();
      } else {
        const sp = norm.indexOf(' ');
        const cmd = sp < 0 ? norm : norm.slice(0, sp);
        const arg = sp < 0 ? '' : norm.slice(sp + 1);
        const fn = Object.prototype.hasOwnProperty.call(COMMANDS, cmd) ? COMMANDS[cmd] : null;
        if (fn) await fn(arg);
        else {
          line(`command not found: ${cmd}`, 'tm-err');
          const near = NAMES.find(n => n.startsWith(cmd.slice(0, 2)));
          line(near ? `Did you mean "${near}"? Or type help.` : 'Type help to see what works.', 'tm-dim');
        }
      }
    } catch (e) {
      line('error: ' + (e && e.message ? e.message : e), 'tm-err');
    }
    busy = false;
    if (!fromChip) input.focus();
  }

  /* ================= start ================= */
  const start = () => build();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

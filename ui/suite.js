/* ── Clinical Supplement Suite: session interface ───────────────────────────────
   A UI layer added by build.py on top of the assessment app's engine. It never
   re-implements anything clinical. Everything it shows comes from the app:

     REGISTRY, FAMILIES, AGE_BOUNDS    which tests exist, their versions and ages
     App.keyToVal, App._isSkipped,     how a key maps to an answer, skip rules
       App._applySkips
     Scoring.run(test, answers)        the score
     App.resultBody, App.clinicianNotesPanel, App.referencesBlock,
       App.reportFooterNote            the full results and report text

   The app's own runner is still used for the two tests with bespoke formats
   (RMET photos and timing, ASSIST branching); their results join the session.

   Flow: choose tests (library as a list or a carousel, filtered by area and
   age), set up (client details once, version, how it is completed), administer
   (a paper form by default, or one question at a time; switchable), results,
   report. The whole interface fits the window; long content moves inside its
   own panel.

   Shared screens: Client view opens a second window that shows the client only
   the current question and its answers (for a second monitor, or a window shared
   on a video call). The client can answer there; this window stays the clinician
   view, with a note box for every question. Client mode is the one-screen
   alternative: the same window, with scores, notes and controls hidden.
──────────────────────────────────────────────────────────────────────────────── */
const Suite = (() => {
  'use strict';

  /* ---------- small helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const isoOf = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const TODAY = isoOf(new Date());
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtDate = iso => { if (!iso) return ''; try { return App.fmtDate(iso); } catch (_) { return iso; } };
  // The app's prose occasionally carries a long dash; show it as a comma here.
  const LONG = new RegExp('\\s*' + String.fromCharCode(8212) + '\\s*', 'g');
  const clean = s => String(s == null ? '' : s).replace(LONG, ', ');

  // ?tool=<id> deep link: read now, because the app's start-up clears it from the URL
  let DEEP = null; try { DEEP = new URLSearchParams(location.search).get('tool'); } catch (_) {}

  /* Tests that keep the app's own runner (bespoke formats). */
  const HANDOFF = t => t.format === 'image' || t.format === 'assist';

  /* ---------- catalogue (from the app's registry and family list) ---------- */
  const CAT_LABEL = { autism:'Autism', adhd:'ADHD', mood:'Mood and anxiety', trauma:'Trauma', ocd:'OCD', behaviour:'Behaviour',
    social:'Social', sensory:'Sensory', sleep:'Sleep', substance:'Substance use' };
  const CAT_ORDER = ['autism', 'adhd', 'mood', 'trauma', 'ocd', 'behaviour', 'social', 'sensory', 'sleep', 'substance'];
  const RESP_SHORT = { self:'Self', parent:'Parent', teacher:'Teacher', clinician:'Clinician', informant:'Informant', direct:'Direct' };

  function respKind(id){
    const r = String((REGISTRY[id] || {}).respondent || '').toLowerCase();
    if (/teacher|staff/.test(r)) return 'teacher';
    if (/parent|carer/.test(r)) return 'parent';
    if (/clinician/.test(r)) return 'clinician';
    if (/informant|observer|other/.test(r)) return 'informant';
    if (/performance|direct/.test(r)) return 'direct';
    return 'self';
  }
  function ageFits(id, age){
    if (age == null || age === '') return true;
    const b = (typeof AGE_BOUNDS !== 'undefined') && AGE_BOUNDS[id];
    if (!b || b.min == null) return true;
    return age >= b.min && (b.max == null || age <= b.max);
  }
  const ageLabel = id => { const b = AGE_BOUNDS[id]; return b ? b.label : (REGISTRY[id].ageRange || ''); };
  function versionLabel(id){
    const t = REGISTRY[id];
    if (t.formLabel) return clean(t.formLabel);
    const m = /\(([^)]+)\)\s*$/.exec(t.name || '');
    if (m) return clean(m[1]);
    return RESP_SHORT[respKind(id)];
  }

  function rowLabels(row){
    const labs = row.ids.map(versionLabel);
    const dup = labs.some((l, i) => labs.indexOf(l) !== i);
    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    return row.ids.map((id, i) => cap(dup ? clean(REGISTRY[id].name) : labs[i]));
  }
  let ROWS = [];
  function buildCatalogue(){
    const inFam = new Set();
    const rows = [];
    (typeof FAMILIES !== 'undefined' ? FAMILIES : []).forEach(f => {
      const ids = f.ids.filter(i => REGISTRY[i] && REGISTRY[i].status === 'live');
      ids.forEach(i => inFam.add(i));
      if (ids.length) rows.push({ key:'f:' + f.key, name:f.name, full:clean(f.fullName), desc:clean(f.desc), cat:f.category || REGISTRY[ids[0]].category, ids });
    });
    Object.keys(REGISTRY).forEach(id => {
      const t = REGISTRY[id];
      if (inFam.has(id) || t.status !== 'live') return;
      rows.push({ key:'t:' + id, name:t.name, full:clean(t.fullName), desc:clean(t.description), cat:t.category, ids:[id] });
    });
    rows.forEach(r => {
      r.labels = rowLabels(r);
      r.hay = [r.name, r.full, r.desc].concat(r.ids.map(i => REGISTRY[i].name + ' ' + (REGISTRY[i].fullName || ''))).join(' ').toLowerCase();
      r.verified = r.ids.some(i => REGISTRY[i].verified);
    });
    ROWS = rows.sort((a, b) => a.name.localeCompare(b.name));
  }
  // the first version that fits the age, in the app's own family order
  // (parent before teacher, self-report before observer)
  function bestVersion(row, age){ return row.ids.find(id => ageFits(id, age)) || row.ids[0]; }

  /* ---------- state ---------- */
  const blankClient = () => ({ name:'', dob:'', age:null, sex:'', gender:'', clinician:'', date:TODAY, ref:'' });
  const S = {
    stage:'library',
    filters:{ cats:new Set(), q:'', showAll:false, view:'list' },
    carIdx:0,            // the centred card in the carousel view
    showName:false,      // the name field stays hidden until asked for
    client:blankClient(),
    session:[], cur:-1,
    clientMode:false,
    sheet:null,          // {rowKey, id, mode} while the set-up panel is open
    resSel:0,
    handoff:null,        // {uid} while the app's own runner has the screen
    notesInReport:true,
  };
  let UID = 1;
  const newMeasure = (id, mode) => ({ uid:'m' + (UID++), id, mode:mode || 'paper', answers:{}, notes:{}, qIndex:0, seen:{}, result:null, done:false });
  const cur = () => S.session[S.cur] || null;
  const T = m => REGISTRY[m.id];

  /* client age: from DOB if given, otherwise the age entered */
  const clientAge = () => {
    if (S.client.dob){ const a = App.calcAge(S.client.dob, S.client.date || TODAY); if (a != null) return a; }
    return S.client.age;
  };
  /* The app's results read State.client (age-banded norms use dob). If only an
     age was entered, give the engine a date of birth that yields that age; it is
     never shown or printed (the report prints the age, and a DOB only if typed). */
  function stateClient(){
    const c = S.client;
    let dob = c.dob;
    if (!dob && c.age != null){
      const d = new Date((c.date || TODAY) + 'T12:00:00');
      d.setFullYear(d.getFullYear() - c.age); d.setDate(d.getDate() - 182);
      dob = isoOf(d);
    }
    return { name:c.name, dob, sex:c.sex, gender:c.gender, clinician:c.clinician, date:c.date || TODAY, ref:c.ref };
  }

  /* ---------- answers: items, options, completion ---------- */
  function optionsFor(t, item){
    if (item.optionSet && t.scoring.optionSets) return t.scoring.optionSets[item.optionSet].map(o => ({ label:o.label, v:o.v }));
    if (t.scoring.type === 'mean'){ const o = []; for (let v = 1; v <= t.scoring.points; v++) o.push({ label:String(v), v }); return o; }
    return (t.scoring.options || []).map((o, i) => ({ label:o.label, v:i }));
  }
  const itemsOf = m => T(m).items || [];   // ASSIST builds its items as it runs
  const answeredCount = m => itemsOf(m).filter(it => m.answers[it.n] != null).length;
  const firstBlank = m => { const its = T(m).items; for (let i = 0; i < its.length; i++) if (m.answers[its[i].n] == null) return i; return its.length; };
  const isComplete = m => firstBlank(m) >= T(m).items.length;
  function bindState(m){
    // the app's skip helpers read State.answers, so point it at this measure
    State.currentTest = T(m); State.answers = m.answers; State.itemNotes = m.notes;
  }
  function stepIdx(m, i, dir){ bindState(m); return App._stepIdx(T(m), i, dir); }
  function setAnswer(m, item, val){
    bindState(m);
    const prev = m.answers[item.n];
    m.answers[item.n] = val;
    App._applySkips(T(m), item.n, val, prev);
  }
  function score(m){
    // as App.finish() / completeAssessment(): required items, then the engine scores
    const t = T(m);
    const r = Scoring.run(t, m.answers);
    r.missing = 0;
    r.answers = Object.assign({}, m.answers);
    const notes = {}; for (const k in m.notes){ const v = (m.notes[k] || '').trim(); if (v) notes[k] = v; }
    if (Object.keys(notes).length) r.itemNotes = notes;
    if (r.flag && r.flag.positive) r.needsReview = true;
    m.result = r; m.done = true;
  }

  /* ---------- rendering scaffold ---------- */
  const ICON = {
    mark:'<svg viewBox="0 0 28 38" fill="none" aria-hidden="true"><circle cx="14" cy="13" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="13" r="5.5" stroke="currentColor" stroke-width="1"/><rect x="13.1" y="22" width="1.8" height="16" fill="currentColor"/><path d="M15 27h8.5l2.5 2.2-2.5 2.2H15z" stroke="currentColor" stroke-width="1.3"/></svg>',
    one:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 9h8M8 13h5"/></svg>',
    paper:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l4 4v14H6z"/><circle cx="9.5" cy="10" r="1"/><circle cx="9.5" cy="14" r="1"/><circle cx="9.5" cy="18" r="1"/><path d="M12 10h4M12 14h4M12 18h4"/></svg>',
    person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    tick:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>',
    screen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    deck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="6" y="7" width="12" height="10" rx="2"/><path d="M8 4h8M8 20h8"/></svg>',
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
  };
  const STAGES = [['library', 'Choose tests'], ['run', 'Administer'], ['results', 'Results'], ['report', 'Report']];

  function shell(){
    const root = document.createElement('div');
    root.id = 'suite';
    root.innerHTML = `
      <header class="su-top">
        <button class="su-brand" data-act="stage" data-stage="library" aria-label="Choose tests">${ICON.mark}<span>Clinical Supplement Suite</span></button>
        <nav class="su-steps" id="suSteps" aria-label="Stages"></nav>
        <div class="su-top-r">
          <button class="su-link" data-act="norms">Norms reference</button>
          <label class="su-switch" title="Hides scores and clinical labels while the client uses the screen"><input type="checkbox" id="suClientMode"><span></span>Client mode</label>
        </div>
        <div class="su-cm-bar"><span>Client mode</span><button class="su-exitcm" data-act="exit-client">Return to clinician view</button></div>
      </header>
      <main class="su-main" id="suMain"></main>
      <footer class="su-dock" id="suDock"></footer>
      <div id="suLayer"></div>
      <div class="su-handoff-bar" id="suHandoffBar"><button class="su-btn su-line" data-act="handoff-back">← Back to the session</button><span id="suHandoffLbl"></span></div>
      <div class="su-toast" id="suToast" role="status" aria-live="polite"></div>`;
    document.body.appendChild(root);
    const pr = document.createElement('div');
    pr.id = 'suitePrint';
    document.body.appendChild(pr);
  }

  function render(){
    document.body.classList.toggle('su-client', S.clientMode);
    $('#suClientMode').checked = S.clientMode;
    renderSteps(); renderDock();
    const main = $('#suMain');
    main.dataset.stage = S.stage;
    ({ library:renderLibrary, run:renderRun, results:renderResults, report:renderReport })[S.stage](main);
    renderSheet();
    cvSync();
  }
  function go(stage){
    if (stage === S.stage) return;
    if (stage === 'run' && !S.session.length) return;
    if ((stage === 'results' || stage === 'report') && !S.session.some(m => m.done)) return;
    if (S.clientMode && stage !== 'run') stage = 'run';
    transition(() => { S.stage = stage; if (stage === 'run' && S.cur < 0) S.cur = firstUndone(); render(); });
  }
  function transition(fn){
    if (document.startViewTransition && !reduced()){
      try {
        // a transition cut short by the next one rejects these promises; the change itself still happens
        const vt = document.startViewTransition(fn);
        // (real errors from fn are re-thrown, so they still show)
        const quiet = e => { if (!e || (e.name !== 'AbortError' && e.name !== 'InvalidStateError')) setTimeout(() => { throw e; }); };
        vt.ready.catch(quiet); vt.finished.catch(() => {}); vt.updateCallbackDone.catch(() => {});
        return;
      } catch (_) {}
    }
    fn();
  }
  const firstUndone = () => { const i = S.session.findIndex(m => !m.done); return i < 0 ? 0 : i; };
  function toast(msg){ const t = $('#suToast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600); }

  function renderSteps(){
    const done = S.session.some(m => m.done);
    const avail = { library:true, run:S.session.length > 0, results:done, report:done };
    $('#suSteps').innerHTML = STAGES.map(([k, l]) =>
      `<button class="${S.stage === k ? 'on' : ''}" data-act="stage" data-stage="${k}" ${avail[k] ? '' : 'disabled'}>${l}</button>`).join('');
  }

  /* ---------- session dock ---------- */
  function clientLine(){
    const a = clientAge();
    const who = S.client.name ? esc(S.client.name) : 'Client';
    return { title: who + (a != null ? ', ' + a + (a === 1 ? ' year' : ' years') : ''),
      sub: (S.client.name ? 'Details used for every test' : 'No name entered') + (S.client.clinician ? ' · ' + esc(S.client.clinician) : '') };
  }
  function renderDock(){
    const d = $('#suDock');
    if (S.clientMode){ d.innerHTML = ''; return; }
    const cl = clientLine();
    const initials = S.client.name ? esc(S.client.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()) : '';
    const chips = S.session.map((m, i) => {
      const t = T(m), n = itemsOf(m).length, a = m.done ? n : answeredCount(m);
      const pct = m.done ? 100 : n ? Math.round(a / n * 100) : 0;
      const inner = m.done ? ICON.tick : HANDOFF(t) ? '·' : (n - a);
      return `<button class="su-chip ${i === S.cur && S.stage === 'run' ? 'cur' : ''} ${m.done ? 'done' : ''}" data-act="chip" data-i="${i}" title="${esc(t.fullName)}">
        <span class="su-ring" style="--p:${pct}%"><i>${inner}</i></span><b>${esc(shortName(m.id))}</b><small>${esc(versionLabel(m.id))}</small></button>`;
    }).join('');
    let cta = '';
    if (S.stage === 'library') cta = `<button class="su-btn su-primary" data-act="begin" ${S.session.length ? '' : 'disabled'}>${S.session.some(m => m.done || answeredCount(m)) ? 'Carry on' : 'Begin'}${S.session.length ? ' · ' + S.session.length + (S.session.length === 1 ? ' test' : ' tests') : ''} <kbd>↵</kbd></button>`;
    else if (S.stage === 'results') cta = `<button class="su-btn su-primary" data-act="stage" data-stage="report">Report →</button>`;
    else if (S.stage === 'run') cta = `<button class="su-btn su-line" data-act="stage" data-stage="library">Add or change tests</button>`;
    d.innerHTML = `<button class="su-who" data-act="client" title="Edit client details"><span class="su-av ${initials ? 'named' : ''}">${initials || ICON.person}</span><span><b>${cl.title}</b><small>${cl.sub}</small></span></button>
      <div class="su-chips">${chips || '<span class="su-empty-chips">Tests you add will gather here</span>'}</div>${cta}`;
  }
  const shortName = id => { const t = REGISTRY[id]; return clean(String(t.name).replace(/\s*\([^)]*\)\s*$/, '')); };

  /* ---------- 1. library ---------- */
  function rowVisible(r, age){
    const f = S.filters;
    if (f.cats.size && !f.cats.has(r.cat)) return 'no';
    if (f.q && !f.q.split(/\s+/).every(w => r.hay.includes(w))) return 'no';
    const fit = r.ids.some(i => ageFits(i, age));
    return fit ? 'fit' : 'unfit';
  }
  function renderLibrary(main){
    const f = S.filters, age = clientAge();
    const counts = {}; ROWS.forEach(r => { counts[r.cat] = (counts[r.cat] || 0) + 1; });
    const vis = ROWS.map(r => ({ r, v:rowVisible(r, age) })).filter(x => x.v !== 'no');
    const fit = vis.filter(x => x.v === 'fit'), unfit = vis.filter(x => x.v === 'unfit');
    const shown = f.showAll ? fit.concat(unfit) : fit;
    const inSession = new Set(S.session.map(m => m.id));
    const catNames = [...f.cats].map(c => CAT_LABEL[c] || c);
    const title = (catNames.length ? catNames.join(' and ') + ' tests' : 'All tests') + (age != null ? ` <em>for ${age === 1 ? 'a 1-year-old' : 'a ' + age + '-year-old'}</em>` : '');
    const info = r => {
      const best = bestVersion(r, age);
      const ages = r.ids.map(i => AGE_BOUNDS[i]).filter(Boolean);
      let ageTxt = '';
      if (ages.length){ const lo = Math.min(...ages.map(a => a.min == null ? 0 : a.min)), open = ages.some(a => a.max == null), hi = Math.max(...ages.map(a => a.max || 0)); ageTxt = open ? lo + ' years to adult' : lo + '–' + hi + ' years'; }
      return { added:r.ids.some(i => inSession.has(i)), ageTxt,
        resps:[...new Set(r.ids.map(i => RESP_SHORT[respKind(i)]))].join(', '),
        mins:clean(REGISTRY[best].estMinutes || ''),
        vers:r.ids.map((i, k) => `<span class="su-v ${age != null && ageFits(i, age) ? 'fit' : ''}">${esc(r.labels[k])}</span>`).join(''),
        ver:r.verified ? '<span class="su-ver" title="Items, scoring and norms checked against the source">✓ Verified</span>' : '' };
    };
    const more = unfit.length ? `<button class="su-more" data-act="show-all">${f.showAll ? 'Hide the ' + unfit.length + ' for other ages' : unfit.length + ' more ' + (unfit.length === 1 ? 'test is' : 'tests are') + ' for other ages · Show them'}</button>` : '';
    const none = '<div class="su-none">No tests match. Try clearing a filter.</div>';
    let listHtml;
    if (f.view === 'carousel'){
      S.carIdx = Math.max(0, Math.min(S.carIdx, shown.length - 1));
      const cards = shown.map(({ r, v }, k) => {
        const x = info(r);
        return `<div class="su-cc ${v === 'unfit' ? 'unfit' : ''} ${x.added ? 'added' : ''}" data-act="car-card" data-k="${k}" data-row="${r.key}" role="button" aria-label="${esc(r.name)}">
          <div class="su-cc-top"><span class="su-eyebrow">${esc(CAT_LABEL[r.cat] || '')}</span>${x.ver}</div>
          <div class="su-cc-name"><b>${esc(r.name)}</b><small>${esc(r.full)}</small></div>
          <p class="su-cc-desc">${esc(r.desc)}</p>
          <div class="su-vers">${x.vers}</div>
          <div class="su-cc-foot"><div class="su-cc-meta"><span>${esc(x.resps)}</span>${x.ageTxt ? `<span>${esc(x.ageTxt)}</span>` : ''}${x.mins ? `<span>${esc(x.mins)}</span>` : ''}</div>
            <div class="su-cc-acts"><button class="su-btn su-line" data-act="quick-add" data-row="${r.key}">${x.added ? ICON.tick + ' In the session' : '+ Add'}</button><button class="su-btn su-primary" data-act="open" data-row="${r.key}">Set up</button></div></div>
        </div>`;
      }).join('');
      listHtml = `<div class="su-car">
          <div class="su-carstage" id="suCarStage">${cards || none}</div>
          <div class="su-carbar"><button class="su-carnav" data-act="car-step" data-d="-1" aria-label="Previous test">${ICON.up}</button><span id="suCarCount"></span><button class="su-carnav" data-act="car-step" data-d="1" aria-label="Next test">${ICON.down}</button></div>
          ${more ? `<div class="su-carmore">${more}</div>` : ''}
        </div>`;
    } else {
      const rowsHtml = shown.map(({ r, v }) => {
        const x = info(r);
        return `<div class="su-row ${v === 'unfit' ? 'unfit' : ''} ${x.added ? 'added' : ''}" data-act="open" data-row="${r.key}" role="button" tabindex="0">
          <div class="su-nm"><b>${esc(r.name)}</b>${x.ver}<small>${esc(r.full)}</small></div>
          <div class="su-vers">${x.vers}</div>
          <div class="su-cell">${esc(x.resps)}</div>
          <div class="su-cell">${esc(x.ageTxt)}<small>${esc(CAT_LABEL[r.cat] || '')}</small></div>
          <div class="su-cell">${esc(x.mins)}</div>
          <button class="su-add ${x.added ? 'in' : ''}" data-act="quick-add" data-row="${r.key}" aria-label="${x.added ? 'In the session' : 'Add ' + esc(r.name) + ' to the session'}">${x.added ? ICON.tick : '+'}</button>
        </div>`;
      }).join('');
      listHtml = `<div class="su-table">
          <div class="su-row su-hd"><div>Test</div><div>Versions${age != null ? ' (green fits the age)' : ''}</div><div>Completed by</div><div>Ages</div><div>Time</div><div></div></div>
          <div class="su-rows" id="suRows">${rowsHtml || none}${more}</div>
        </div>`;
    }
    main.innerHTML = `<div class="su-lib">
      <aside class="su-filters">
        <div class="su-fg"><h4>What are you measuring?</h4><div class="su-flist">
          <button class="${f.cats.size ? '' : 'on'}" data-act="cat" data-cat="">All tests <span>${ROWS.length}</span></button>
          ${CAT_ORDER.filter(c => counts[c]).map(c => `<button class="${f.cats.has(c) ? 'on' : ''}" data-act="cat" data-cat="${c}">${CAT_LABEL[c]} <span>${counts[c]}</span></button>`).join('')}
        </div></div>
        <div class="su-fg"><h4>Client's age</h4><div class="su-agebox">
          <div class="su-agehead"><button class="su-step" data-act="age-step" data-d="-1" aria-label="Younger">−</button>
            <div class="su-agebig">${age != null ? age + '<small> years</small>' : '<span class="su-any">Any age</span>'}</div>
            <button class="su-step" data-act="age-step" data-d="1" aria-label="Older">+</button></div>
          <input type="range" min="2" max="80" step="1" value="${age != null ? Math.min(80, Math.max(2, age)) : 2}" id="suAgeRange" aria-label="Client's age" class="${age != null ? '' : 'unset'}">
          <div class="su-ticks"><span>2</span><span>18</span><span>40</span><span>80</span></div>
          ${age != null ? `<button class="su-mini" data-act="age-clear">${S.client.dob ? 'From date of birth' : 'Clear age'}</button>` : ''}
        </div></div>
      </aside>
      <section class="su-libmain">
        <div class="su-libhead"><div><div class="su-eyebrow">Choose tests</div><h1>${title}</h1></div>
          <div class="su-libtools"><div class="su-toggle su-viewtog" role="group" aria-label="Layout"><button class="${f.view === 'list' ? 'on' : ''}" data-act="lib-view" data-view="list" aria-label="List view" title="List view">${ICON.list}List</button><button class="${f.view === 'carousel' ? 'on' : ''}" data-act="lib-view" data-view="carousel" aria-label="Carousel view" title="Carousel view">${ICON.deck}Carousel</button></div>
          <label class="su-search">${ICON.search}<input id="suSearch" type="search" placeholder="Search all tests" value="${esc(f.q)}" autocomplete="off" spellcheck="false"><kbd>/</kbd></label></div></div>
        ${listHtml}
        <p class="su-foot">Screening supplements, not diagnostic instruments. Nothing you enter is uploaded or saved; refreshing the page clears it.</p>
      </section></div>`;
    if (f.view === 'carousel') carLayout();
  }

  /* carousel: the same tests as the list, as a vertical wheel of cards (the app's
     carousel, in this interface's style). The centred card opens on click; a card
     above or below comes to the centre. */
  function carLayout(){
    const stage = $('#suCarStage'); if (!stage) return;
    const cards = $$('.su-cc', stage), n = cards.length;
    const H = stage.clientHeight, ch = cards[0] ? cards[0].offsetHeight : 260;
    const step = Math.max(90, Math.min(ch * 0.62, (H - ch) / 2 + 18));
    cards.forEach((el, i) => {
      const o = i - S.carIdx, ab = Math.abs(o);
      const rot = o === 0 ? 0 : (o < 0 ? 1 : -1) * Math.min(22, 10 + (ab - 1) * 6);
      const sc = o === 0 ? 1 : Math.max(.7, .88 - (ab - 1) * .08);
      el.style.transform = `translate(-50%, -50%) translateY(${o * step}px) translateZ(${-ab * 80}px) rotateX(${rot}deg) scale(${sc})`;
      el.style.zIndex = String(100 - ab);
      el.style.opacity = ab > 2 ? '0' : ab === 2 ? '.35' : '1';
      el.style.pointerEvents = ab > 2 ? 'none' : 'auto';
      el.tabIndex = o === 0 ? 0 : -1;
      el.classList.toggle('on', o === 0);
    });
    const c = $('#suCarCount'); if (c) c.textContent = n ? (S.carIdx + 1) + ' of ' + n : '';
    const nav = $$('.su-carnav'); if (nav.length === 2){ nav[0].disabled = S.carIdx <= 0; nav[1].disabled = S.carIdx >= n - 1; }
    if (!stage._wheel){
      stage._wheel = true;
      let acc = 0, lock = 0, y0 = null;
      stage.addEventListener('wheel', e => { e.preventDefault(); if (Date.now() < lock) return; acc += e.deltaY; if (Math.abs(acc) >= 40){ carStep(acc > 0 ? 1 : -1); acc = 0; lock = Date.now() + 160; } }, { passive:false });
      stage.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive:true });
      stage.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (Math.abs(dy) > 50){ carStep(dy < 0 ? 1 : -1); y0 = e.touches[0].clientY; } e.preventDefault(); }, { passive:false });
      stage.addEventListener('touchend', () => { y0 = null; });
    }
  }
  function carStep(d, focus){
    const n = $$('#suCarStage .su-cc').length;
    const k = Math.max(0, Math.min(n - 1, S.carIdx + d));
    if (k === S.carIdx) return;
    S.carIdx = k; carLayout();
    if (focus){ const c = $('#suCarStage .su-cc.on'); if (c) try { c.focus({ preventScroll:true }); } catch (_) {} }
  }

  /* ---------- 2. set-up panel ---------- */
  function openSheet(rowKey, id){
    const row = ROWS.find(r => r.key === rowKey) || ROWS.find(r => r.ids.includes(id));
    if (!row) return;
    const existing = S.session.find(m => row.ids.includes(m.id));
    S.sheet = { rowKey:row.key, id: id || (existing ? existing.id : bestVersion(row, clientAge())), mode: existing ? existing.mode : 'paper', existing: existing ? existing.uid : null };
    syncToolUrl(S.sheet.id);
    renderSheet(true);
  }
  function openClientSheet(){ S.sheet = { clientOnly:true }; renderSheet(true); }
  function closeSheet(){ S.sheet = null; syncToolUrl(null); renderSheet(); }
  function syncToolUrl(id){
    try { const u = new URL(location.href); if (id) u.searchParams.set('tool', id); else u.searchParams.delete('tool'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (_) {}
  }
  function clientFieldsHtml(needsGender){
    const c = S.client, a = clientAge();
    // The name is hidden unless asked for (or already given): it is best left
    // blank, and the report stays neutral when it is.
    const named = S.showName || !!c.name;
    return `${named ? `<div class="su-namehint">You don't need to enter a name, and it is best not to. If you leave it blank, the report will not name anyone.</div>` : ''}
      <div class="su-fields">
        ${named ? `<label class="su-fld"><span>Name or initials</span><input data-f="name" value="${esc(c.name)}" placeholder="Optional" autocomplete="off" spellcheck="false"></label>` : ''}
        <label class="su-fld"><span>Age in years</span><input data-f="age" type="number" min="0" max="110" value="${a != null ? a : ''}" placeholder="Age" ${c.dob ? 'readonly title="Worked out from the date of birth"' : ''}></label>
        <label class="su-fld"><span>or date of birth</span><input data-f="dob" type="date" value="${esc(c.dob)}" max="${TODAY}"></label>
        <label class="su-fld"><span>Sex (used for norms where available)</span><select data-f="sex"><option value="">Not given</option>${['male', 'female', 'intersex'].map(v => `<option value="${v}" ${c.sex === v ? 'selected' : ''}>${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}</select></label>
        ${needsGender ? `<label class="su-fld"><span>Gender (matches CATI and CAT-Q norms)</span><select data-f="gender">${[['', 'Prefer not to say'], ['man', 'Man'], ['woman', 'Woman'], ['non-binary', 'Non-binary'], ['other', 'Other or self-describe']].map(([v, l]) => `<option value="${v}" ${c.gender === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        <label class="su-fld"><span>Clinician</span><input data-f="clinician" value="${esc(c.clinician)}" placeholder="Optional" autocomplete="off"></label>
        <label class="su-fld"><span>Assessment date</span><input data-f="date" type="date" value="${esc(c.date || TODAY)}"></label>
        <label class="su-fld"><span>Reference</span><input data-f="ref" value="${esc(c.ref)}" placeholder="Optional" autocomplete="off"></label>
      </div>
      ${named ? '' : `<button class="su-mini su-addname" data-act="show-name">+ Add a name or initials</button>`}`;
  }
  function renderSheet(fresh){
    const layer = $('#suLayer');
    if (!S.sheet){ layer.innerHTML = ''; layer.className = ''; return; }
    if (!fresh && layer.firstChild) { refreshSheetFits(); return; }
    layer.className = 'open';
    if (S.sheet.clientOnly){
      const g = S.session.some(m => m.id === 'cati' || m.id === 'catq');
      layer.innerHTML = `<div class="su-scrim" data-act="sheet-close"></div><aside class="su-sheet" role="dialog" aria-label="Client details">
        <button class="su-x" data-act="sheet-close" aria-label="Close">${ICON.x}</button>
        <div><div class="su-eyebrow">Client</div><h2>Client details</h2><p class="su-sub">Entered once and used for every test in this session. Nothing is uploaded.</p></div>
        ${clientFieldsHtml(g)}
        <div class="su-acts"><button class="su-btn su-line" data-act="new-client">New client</button><button class="su-btn su-primary" data-act="sheet-close">Done</button></div></aside>`;
      return;
    }
    const row = ROWS.find(r => r.key === S.sheet.rowKey);
    const id = S.sheet.id, t = REGISTRY[id];
    const needsGender = row.ids.some(i => i === 'cati' || i === 'catq') || S.session.some(m => m.id === 'cati' || m.id === 'catq');
    const handoff = HANDOFF(t);
    layer.innerHTML = `<div class="su-scrim" data-act="sheet-close"></div><aside class="su-sheet" role="dialog" aria-label="Set up ${esc(row.name)}">
      <button class="su-x" data-act="sheet-close" aria-label="Close">${ICON.x}</button>
      <div><div class="su-eyebrow">Set up</div><h2>${esc(row.name)} <em>${esc(row.full)}</em></h2></div>
      <div class="su-sec"><h4>Client <span>Entered once, used for every test this session. Nothing is uploaded.</span></h4>${clientFieldsHtml(needsGender)}</div>
      <div class="su-sec"><h4>Version <span id="suFitNote"></span></h4><div class="su-vcards" id="suVcards"></div></div>
      <div class="su-sec" id="suModeSec"></div>
      <div class="su-acts">${S.sheet.existing ? `<button class="su-btn su-ghost" data-act="remove-test">Remove from session</button>` : ''}
        <button class="su-btn su-line" data-act="add-test">${S.sheet.existing ? 'Save' : 'Add to session'}</button>
        <button class="su-btn su-primary" data-act="start-test">${S.sheet.existing && (cur() || {}).uid === S.sheet.existing ? 'Carry on' : 'Start now'} <kbd>↵</kbd></button></div>
    </aside>`;
    refreshSheetFits();
    void handoff;
  }
  function refreshSheetFits(){
    if (!S.sheet || S.sheet.clientOnly) return;
    const row = ROWS.find(r => r.key === S.sheet.rowKey), age = clientAge();
    const v = $('#suVcards'); if (!v) return;
    v.innerHTML = row.ids.map(i => {
      const t = REGISTRY[i], fit = ageFits(i, age);
      const fitTxt = age == null ? '' : fit ? 'Fits age ' + age : 'Outside age range';
      return `<button class="su-vc ${i === S.sheet.id ? 'on' : ''}" data-act="pick-version" data-id="${i}"><span class="su-dot"></span>
        <span><b>${esc(clean(t.name))}</b><small>${esc(t.respondent)} · ${esc(ageLabel(i))} · ${t.items ? t.items.length + ' items' : 'Items depend on answers'}${t.estMinutes ? ' · ' + esc(clean(t.estMinutes)) : ''}</small></span>
        <span class="su-fitw ${fit ? '' : 'out'}">${fitTxt}</span></button>`;
    }).join('');
    $('#suFitNote').textContent = row.ids.length > 1 ? (age != null ? 'Picked for age ' + age + '; change it if you need to' : 'Enter an age to see which version fits') : '';
    const t = REGISTRY[S.sheet.id];
    $('#suModeSec').innerHTML = HANDOFF(t)
      ? `<h4>How will it be completed?</h4><p class="su-sub">${t.format === 'image' ? 'The RMET runs in its own format (photographs, with a practice item and timing).' : 'The ASSIST runs in its own format (a substance grid first, then questions for each substance used).'} The result joins this session.</p>`
      : `<h4>How will it be completed?</h4><div class="su-modes">
        <button class="su-mode ${S.sheet.mode === 'paper' ? 'on' : ''}" data-act="pick-mode" data-mode="paper">${ICON.paper}<span><b>Paper form</b><small>The whole form as a sheet. Fastest for scoring a paper copy.</small></span></button>
        <button class="su-mode ${S.sheet.mode === 'one' ? 'on' : ''}" data-act="pick-mode" data-mode="one">${ICON.one}<span><b>One at a time</b><small>Large questions on screen. For the client, or for reading aloud.</small></span></button></div>
        <p class="su-hint">You can switch at any point during the test.</p>`;
  }
  function readClientField(el){
    const k = el.dataset.f, c = S.client;
    if (k === 'age'){ const n = el.value === '' ? null : Math.max(0, Math.min(110, parseInt(el.value, 10))); c.age = isNaN(n) ? null : n; if (c.dob && c.age !== clientAge()) c.dob = ''; }
    else if (k === 'dob'){ c.dob = el.value; const a = clientAge(); c.age = a; const ageEl = $('[data-f="age"]', $('#suLayer')); if (ageEl){ ageEl.value = a != null ? a : ''; ageEl.readOnly = !!c.dob; } }
    else if (k === 'name') c.name = el.value.trim();
    else c[k] = el.value;
    if (k === 'age' || k === 'dob' || k === 'date'){ refreshSheetFits(); if (S.stage === 'library') renderLibrary($('#suMain')); }
    renderDock();
  }
  function addFromSheet(start){
    const sh = S.sheet;
    let m = sh.existing ? S.session.find(x => x.uid === sh.existing) : null;
    if (m && m.id !== sh.id){
      if ((answeredCount(m) || m.done) && !confirm('Switching version clears the answers already given for this test. Switch?')) return;
      const i = S.session.indexOf(m); m = S.session[i] = newMeasure(sh.id, sh.mode);
    } else if (m) m.mode = sh.mode;
    else { m = newMeasure(sh.id, sh.mode); S.session.push(m); }
    const idx = S.session.indexOf(m);
    closeSheet();
    if (start){ S.cur = idx; startMeasure(m); }
    else { render(); toast(shortName(m.id) + ' added to the session'); }
  }
  function quickAdd(rowKey){
    const row = ROWS.find(r => r.key === rowKey);
    const existing = S.session.find(m => row.ids.includes(m.id));
    if (existing){ openSheet(rowKey, existing.id); return; }
    const id = bestVersion(row, clientAge());
    S.session.push(newMeasure(id));
    render(); toast(clean(REGISTRY[id].name) + ' added to the session');
  }

  /* ---------- 3. administer ---------- */
  let advanceTimer = null, advanceFn = null;
  function flushAdvance(){ if (advanceTimer){ clearTimeout(advanceTimer); advanceTimer = null; const f = advanceFn; advanceFn = null; if (f) f(); } }
  function startMeasure(m){
    const t = T(m);
    if (HANDOFF(t) && !m.done){ startHandoff(m); return; }
    S.stage = m.done ? 'results' : 'run';
    if (m.done) S.resSel = S.session.filter(x => x.done).indexOf(m);
    transition(render);
  }
  function renderRun(main){
    const m = cur();
    if (!m){ main.innerHTML = '<div class="su-empty">No tests in this session yet.</div>'; return; }
    const t = T(m);
    if (m.done){ main.innerHTML = runDoneHtml(m); return; }
    if (HANDOFF(t)){ main.innerHTML = `<div class="su-empty"><h2>${esc(clean(t.fullName))}</h2><p>This test runs in its own format.</p><button class="su-btn su-primary" data-act="handoff-start">Start ${esc(shortName(m.id))}</button></div>`; return; }
    const mode = S.clientMode ? 'one' : m.mode;
    const n = t.items.length, a = answeredCount(m);
    const head = `<div class="su-runhead"><div class="su-rt"><b>${esc(clean(t.name))}</b><span>${S.clientMode ? '' : esc(t.respondent) + ' · '}<span id="suRunCount">${a} of ${n} answered</span></span></div>
      ${S.clientMode ? '' : `<div class="su-runtools">${cvButtonHtml()}<div class="su-toggle" role="group" aria-label="How it is completed"><button class="${mode === 'paper' ? 'on' : ''}" data-act="mode" data-mode="paper">${ICON.paper}Paper form</button><button class="${mode === 'one' ? 'on' : ''}" data-act="mode" data-mode="one">${ICON.one}One at a time</button></div></div>`}</div>
      <div class="su-prog"><i style="width:${n ? a / n * 100 : 0}%"></i></div>`;
    main.innerHTML = head + (mode === 'one' ? oneHtml(m) : paperHtml(m));
    if (mode === 'paper') afterPaper(m);
    else fitQuestion();
  }
  function runDoneHtml(m){
    const next = S.session.findIndex(x => !x.done);
    if (S.clientMode) return `<div class="su-thanks"><h1>All done, thank you.</h1><p>Please hand the screen back to your clinician.</p></div>`;
    return `<div class="su-empty"><div class="su-eyebrow">Finished</div><h2>${esc(clean(T(m).name))} is scored</h2>
      <div class="su-row-acts">${next >= 0 ? `<button class="su-btn su-primary" data-act="chip" data-i="${next}">Next: ${esc(shortName(S.session[next].id))} <kbd>↵</kbd></button>` : `<button class="su-btn su-primary" data-act="stage" data-stage="results">See results <kbd>↵</kbd></button>`}
      <button class="su-btn su-line" data-act="stage" data-stage="results">Results so far</button></div></div>`;
  }

  /* one question at a time */
  function sectionIntroPending(m){
    const it = T(m).items[m.qIndex];
    if (!it || !it.sectionIntro) return null;
    const key = it.sectionKey || ('i' + m.qIndex);
    return m.seen[key] ? null : key;
  }
  /* win: the client window's copy of the question. It follows whichever item is
     current in the clinician's mode, and has no notes, item numbers, subscale
     names or Back/Next (the clinician keeps those). */
  function oneHtml(m, win){
    const t = T(m), client = S.clientMode || !!win;
    const i = win ? curItem(m) : m.qIndex, item = t.items[i];
    const introKey = (!win || m.mode === 'one') ? sectionIntroPending(m) : null;
    if (introKey){
      const si = item.sectionIntro;
      return `<div class="su-one su-intro">${si.tag ? `<div class="su-eyebrow">${esc(si.tag)}</div>` : ''}<h2>${esc(si.title || '')}</h2><p>${esc(si.blurb || '')}</p>
        ${!client && t.adminGuide ? `<div class="su-guide"><b>Administration guidance (rater)</b><ul>${t.adminGuide.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>` : ''}
        <div><button class="su-btn su-primary su-big" data-act="intro-ok" data-key="${esc(introKey)}">Continue <kbd>↵</kbd></button></div></div>`;
    }
    const opts = optionsFor(t, item), val = m.answers[item.n];
    const sub = (!client && t.subscales && item.subscale && t.subscales[item.subscale]) ? t.subscales[item.subscale].name : '';
    const stem = item.prompt || t.prompt || '';
    const complete = isComplete(m);
    const anchorsW = t.scoring.type === 'mean' ? `<div class="su-anchors"><span>${esc(t.scoring.anchorLow)}</span><span>${esc(t.scoring.anchorHigh)}</span></div>` : '';
    if (win) return `<div class="su-one">
      <div class="su-meta">Question ${i + 1} of ${t.items.length}${item.timeframe ? ' · ' + esc(item.timeframe) : ''}</div>
      ${stem ? `<div class="su-stem">${stem}</div>` : ''}
      <div class="su-q" id="suQ">${item.text}</div>
      ${item.help ? `<details class="su-help" open><summary>What counts here?</summary><div>${esc(item.help)}</div></details>` : ''}
      ${anchorsW}<div class="su-opts" style="--n:${opts.length}">${opts.map((o, oi) => `<button class="su-opt ${val === o.v ? 'on' : ''}" data-act="ans" data-v="${o.v}"><kbd>${oi + 1}</kbd><span>${o.label}</span></button>`).join('')}</div>
      <div class="su-runfoot su-cvfoot"><span class="su-hintline">${complete ? 'That is every question. Thank you.' : 'Choose the answer that fits best.'}</span></div>
    </div>`;
    // with the client view open, this window is the clinician's own, so the note
    // box for each question is always out
    const showNote = !S.clientMode && (t.itemNotes || m.notes[item.n] || m.noteOpen === item.n || cvIsOpen());
    const anchors = t.scoring.type === 'mean' ? `<div class="su-anchors"><span>${esc(t.scoring.anchorLow)}</span><span>${esc(t.scoring.anchorHigh)}</span></div>` : '';
    return `<div class="su-one">
      <div class="su-meta">${S.clientMode ? 'Question ' + (i + 1) + ' of ' + t.items.length : 'Item ' + item.n + (sub ? ' · ' + esc(sub) : '')}${item.timeframe ? ' · ' + esc(item.timeframe) : ''}</div>
      ${stem ? `<div class="su-stem">${stem}</div>` : ''}
      <div class="su-q" id="suQ">${item.text}</div>
      ${item.help ? `<details class="su-help" open><summary>What counts here?</summary><div>${esc(item.help)}</div></details>` : ''}
      ${anchors}<div class="su-opts" style="--n:${opts.length}">${opts.map((o, oi) => `<button class="su-opt ${val === o.v ? 'on' : ''}" data-act="ans" data-v="${o.v}"><kbd>${oi + 1}</kbd><span>${o.label}</span></button>`).join('')}</div>
      ${!S.clientMode ? (showNote ? `<label class="su-note"><span>Clinician note (optional)</span><textarea data-note="${esc(item.n)}" rows="2" placeholder="${esc(item.note || 'Context, how this presents, alternative explanations')}">${esc(m.notes[item.n] || '')}</textarea></label>` : `<button class="su-mini" data-act="note-open">+ Add clinician note</button>`) : ''}
      <div class="su-runfoot"><button class="su-btn su-ghost" data-act="prev" ${stepIdx(m, i, -1) < 0 ? 'disabled' : ''}>← Back</button>
        <span class="su-hintline" id="suHint">${complete ? 'All questions answered.' : S.clientMode ? '' : 'Type 1 to ' + Math.min(opts.length, 9) + ' to answer.'}</span>
        ${complete ? `<button class="su-btn su-primary" data-act="finish">${S.clientMode ? 'Finish' : 'Finish and score'} <kbd>↵</kbd></button>` : `<button class="su-btn su-ghost" data-act="next">Next →</button>`}</div>
    </div>`;
  }
  function fitQuestion(q){
    q = q || $('#suQ'); if (!q) return;
    const len = q.textContent.length;
    q.style.fontSize = len > 180 ? 'clamp(22px,2.4vw,30px)' : len > 110 ? 'clamp(26px,3vw,38px)' : len > 60 ? 'clamp(30px,3.6vw,48px)' : 'clamp(34px,4.4vw,58px)';
  }
  /* is the clinician typing in a note box right now? */
  const noting = () => { const a = document.activeElement; return !!(a && a.dataset && a.dataset.note != null); };
  function answerOne(m, v){
    const t = T(m), item = t.items[m.qIndex];
    setAnswer(m, item, v);
    $$('#suMain .su-opt').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === v));
    const b = $$('#suMain .su-opt').find(x => Number(x.dataset.v) === v); if (b && !reduced()) b.animate([{ transform:'scale(.97)' }, { transform:'scale(1)' }], { duration:220 });
    const ni = stepIdx(m, m.qIndex, 1);
    renderDock();
    cvSync();
    if (noting()){
      // an answer from the client window while the clinician is writing a note:
      // keep the question (and the note) in place until the clinician moves on
      const h = $('#suHint'); if (h){ h.textContent = 'Answer recorded. Press Next when your note is done.'; h.classList.remove('warn'); }
      return;
    }
    if (ni < t.items.length){
      // answers are stored at once; the move to the next item waits a beat so the
      // choice can be seen, and any key pressed meanwhile completes it first
      advanceFn = () => { m.qIndex = ni; renderRunSoft(); };
      advanceTimer = setTimeout(flushAdvance, reduced() ? 0 : 230);
    } else renderRunSoft();
  }
  function renderRunSoftFull(){ renderRun($('#suMain')); renderDock(); cvSync(); }
  function renderRunSoft(){ const m = cur(); if (m && !m.done && !S.clientMode && m.mode === 'paper' && $('#suStack')) paperUpdate(m); else renderRunSoftFull(); }
  function moveOne(m, dir){
    flushAdvance();
    const t = T(m);
    if (dir > 0 && m.answers[t.items[m.qIndex].n] == null){ const h = $('#suHint'); if (h){ h.textContent = 'Please answer this one first.'; h.classList.add('warn'); } return; }
    const j = stepIdx(m, m.qIndex, dir);
    if (j >= 0 && j < t.items.length){ m.qIndex = j; renderRunSoft(); }
  }
  function finishMeasure(m){
    flushAdvance();
    const fb = firstBlank(m);
    if (fb < T(m).items.length){
      m.qIndex = fb; m.paperCursor = fb; m._nudge = 0; renderRunSoft();
      const h = $('#suHint') || $('#suPaperHint'); if (h){ h.textContent = (T(m).items.length - answeredCount(m)) + ' still to answer. Taken to the first one.'; h.classList.add('warn'); }
      return;
    }
    score(m);
    const next = S.session.findIndex(x => !x.done);
    if (S.clientMode){ renderRunSoft(); return; }
    if (next >= 0){ S.cur = next; toast(shortName(m.id) + ' scored. Next: ' + shortName(S.session[next].id)); transition(render); }
    else { S.resSel = S.session.filter(x => x.done).indexOf(m); toast('All tests scored'); go('results'); }
  }

  /* ---------- A4 pages (the paper form and the report share these) ----------
     Pages are laid out at true A4 size (794 by 1123 CSS pixels at 96 dpi),
     measured off screen, then shown as a stack of sheets that moves inside its
     frame. The window itself never scrolls. */
  const A4 = { W:794, H:1123, top:60, bottom:58, side:64, gap:28 };
  const A4_CW = A4.W - 2 * A4.side, A4_CH = A4.H - A4.top - A4.bottom;
  function measure(htmls, cls, style){
    const box = document.createElement('div');
    box.className = 'su-measure ' + (cls || '');
    box.style.cssText = 'width:' + A4_CW + 'px;' + (style || '');
    box.innerHTML = htmls.map(h => `<div class="su-mb">${h}</div>`).join('');
    document.body.appendChild(box);
    setFills(box);
    const els = Array.from(box.children);
    return { hs:els.map(e => e.getBoundingClientRect().height), els, box };
  }
  function setFills(scope){
    $$('[data-fill]', scope).forEach(el => { el.style.transition = 'none'; el.style.width = el.getAttribute('data-fill') + '%'; });
    $$('[data-ring-target]', scope).forEach(c => { c.style.transition = 'none'; c.style.strokeDashoffset = c.getAttribute('data-ring-target'); });
  }
  const pageHtml = (inner, i, n, left, cls) => `<div class="su-a4 ${cls || ''}" data-p="${i}" style="top:${i * (A4.H + A4.gap)}px"><div class="su-a4-in">${inner}</div>
    <div class="su-a4-foot"><span>${left}</span><span>Page ${i + 1} of ${n}</span></div></div>`;
  /* place the sheet stack so that design point y sits at the reading line */
  function placeStack(pv, st, y, line, nudge, nPages){
    const W = pv.clientWidth, H = pv.clientHeight;
    const s = Math.min(1, (W - 40) / A4.W);
    const x = (W - A4.W * s) / 2;
    const stackH = nPages * (A4.H + A4.gap) - A4.gap;
    const maxY = 20, minY = Math.min(20, H - stackH * s - 20);
    const base = H * line - y * s;
    const ty = Math.max(minY, Math.min(maxY, base + (nudge || 0)));
    st.style.transform = `translate(${x}px, ${ty}px) scale(${s})`;
    return { s, base, minY, maxY };
  }
  function bindWheel(pv, onDelta){
    if (pv._wheel) return; pv._wheel = true;
    pv.addEventListener('wheel', e => { e.preventDefault(); onDelta(-e.deltaY); }, { passive:false });
    let y0 = null;
    pv.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive:true });
    pv.addEventListener('touchmove', e => { if (y0 == null) return; const y = e.touches[0].clientY; onDelta(y - y0); y0 = y; e.preventDefault(); }, { passive:false });
    pv.addEventListener('touchend', () => { y0 = null; });
  }

  /* paper form */
  function paperRows(m){
    // flatten into section titles, option header rows and item rows
    const t = T(m), out = [];
    let lastSet = null;
    t.items.forEach((it, i) => {
      if (it.sectionIntro && it.sectionIntro.title) out.push({ kind:'sec', text:it.sectionIntro.title });
      const setKey = it.optionSet || '_';
      if (setKey !== lastSet){ out.push({ kind:'head', opts:optionsFor(t, it) }); lastSet = setKey; }
      out.push({ kind:'item', i, item:it });
    });
    return out;
  }
  function paperRowHtml(m, r, cols){
    const t = T(m);
    if (r.kind === 'sec') return `<div class="su-prow sec">${esc(r.text)}</div>`;
    if (r.kind === 'head') return `<div class="su-prow head"><span></span><span>Item</span>${r.opts.map(o => `<span>${o.label}</span>`).join('')}${'<span></span>'.repeat(cols - r.opts.length)}</div>`;
    const it = r.item, opts = optionsFor(t, it), v = m.answers[it.n];
    bindState(m);
    const skipped = App._isSkipped(it);
    return `<div class="su-prow item ${r.i === m.paperCursor ? 'cur' : ''} ${(m.notes[it.n] || '').trim() ? 'noted' : ''}" data-i="${r.i}"><span class="n">${it.n}</span>
      <span class="tx" data-act="pjump" data-i="${r.i}">${it.text}</span>${opts.map((o, oi) => `<span class="b"><button class="su-bub ${v === o.v ? 'on' : ''}" data-act="pans" data-i="${r.i}" data-v="${o.v}" ${skipped ? 'disabled' : ''} aria-label="Item ${it.n}: ${esc(String(o.label).replace(/<[^>]+>/g, ''))}">${oi + 1}</button></span>`).join('')}${'<span></span>'.repeat(cols - opts.length)}</div>`;
  }
  function paperTitleHtml(m){
    const t = T(m), name = S.client.name ? ' · ' + esc(S.client.name) : '';
    return `<div class="su-ptop"><span>Screening supplements${name}</span><span>${esc(fmtDate(S.client.date || TODAY))}</span></div>
      <div class="su-ptitle"><b>${esc(clean(t.fullName || t.name))}</b><i>${esc(t.respondent || '')}</i></div>
      ${t.prompt ? `<div class="su-pinst">${t.prompt}</div>` : ''}`;
  }
  function paperLayout(m){
    if (m._lay) return m._lay;
    const t = T(m), rows = paperRows(m);
    const cols = Math.max(...t.items.map(it => optionsFor(t, it).length));
    const mz = measure([paperTitleHtml(m)].concat(rows.map(r => paperRowHtml(m, r, cols))), 'su-paperdoc', '--cols:' + cols + ';');
    const titleH = mz.hs[0];
    rows.forEach((r, k) => { r.h = mz.hs[k + 1]; });
    mz.box.remove();
    const pages = []; let cur = [], used = titleH, lastHead = null;
    rows.forEach((r, k) => {
      if (r.kind === 'head') lastHead = r;
      // a section title or option header always stays with the item after it
      let need = r.h;
      if (r.kind !== 'item'){ let j = k + 1; while (j < rows.length && rows[j].kind !== 'item'){ need += rows[j].h; j++; } if (j < rows.length) need += rows[j].h; }
      if (used + need > A4_CH && cur.length){ pages.push(cur); cur = []; used = 0; if (r.kind === 'item' && lastHead){ cur.push(lastHead); used += lastHead.h; } }
      cur.push(r); used += r.h;
    });
    if (cur.length) pages.push(cur);
    m._lay = { pages, cols };
    return m._lay;
  }
  /* The side panel is updated in parts, so a note being typed is never rebuilt
     under the clinician's cursor (answers can arrive from the client window). */
  function paperTypedHtml(m){
    const t = T(m), typed = (m.typed || []).slice(-10).join(' ');
    return `<h5>Typed so far</h5><div class="su-typed">${typed ? esc(typed) : '<span>Start typing</span>'}<i>_</i></div><div class="su-cardsub">${answeredCount(m)} of ${t.items.length} answered</div>`;
  }
  function paperMapHtml(m){
    const t = T(m);
    return `<h5>Whole form</h5><div class="su-mini-map">${t.items.map((it, i) => `<button class="${m.answers[it.n] != null ? 'f' : ''} ${i === m.paperCursor ? 'c' : ''} ${(m.notes[it.n] || '').trim() ? 'n' : ''}" data-act="pjump" data-i="${i}" aria-label="Item ${it.n}"></button>`).join('')}</div>`;
  }
  function paperNoteHtml(m){
    const it = T(m).items[m.paperCursor || 0];
    if (!it) return '';
    return `<label class="su-note su-pnote"><span>Note on item ${esc(it.n)} <i>(optional)</i></span><textarea data-note="${esc(it.n)}" rows="3" placeholder="${esc(it.note || 'Context, how this presents, alternative explanations')}">${esc(m.notes[it.n] || '')}</textarea></label>`;
  }
  function paperFinishHtml(m){
    const t = T(m), complete = isComplete(m);
    return `<button class="su-btn su-primary su-wide" data-act="finish" ${complete ? '' : 'aria-disabled="true"'}>${complete ? 'Finish and score <kbd>↵</kbd>' : (t.items.length - answeredCount(m)) + ' still to answer'}</button>`;
  }
  function paperSideHtml(m){
    const cols = m._lay ? m._lay.cols : 4;
    return `<div class="su-card" id="suTypedCard">${paperTypedHtml(m)}</div>
      <div class="su-card" id="suNoteCard">${paperNoteHtml(m)}</div>
      <div class="su-card" id="suMapCard">${paperMapHtml(m)}</div>
      <p class="su-hintline" id="suPaperHint"></p>
      <div id="suFinishSlot">${paperFinishHtml(m)}</div>
      <div class="su-card su-keys"><h5>Keys</h5><div><span><kbd>1</kbd>–<kbd>${Math.min(cols, 9)}</kbd></span><span>answer and move on</span><span><kbd>⌫</kbd></span><span>step back and clear</span><span><kbd>.</kbd></span><span>leave blank for now</span><span><kbd>↑</kbd> <kbd>↓</kbd></span><span>move between items</span><span><kbd>N</kbd></span><span>write a note on this item</span><span><kbd>Esc</kbd></span><span>leave the note</span></div></div>`;
  }
  /* refresh the note box for the current item, unless a note is being typed */
  function paperNoteSync(m){
    const box = $('#suNoteCard'); if (!box || box.contains(document.activeElement)) return;
    const ta = $('textarea', box), it = T(m).items[m.paperCursor || 0];
    if (!ta || !it || ta.dataset.note !== String(it.n)) box.innerHTML = paperNoteHtml(m);
  }
  function paperHtml(m){
    const t = T(m);
    if (m.paperCursor == null) m.paperCursor = firstBlank(m) < t.items.length ? firstBlank(m) : 0;
    return `<div class="su-desk"><div class="su-paperview" id="suPV"><div class="su-stack" id="suStack" data-uid="${m.uid}"></div>
        <div class="su-pvbar"><button class="su-mini" data-act="ppage" data-d="-1" aria-label="Previous page">↑</button><span id="suPvPage"></span><button class="su-mini" data-act="ppage" data-d="1" aria-label="Next page">↓</button></div></div>
      <aside class="su-side" id="suSide">${paperSideHtml(m)}</aside></div>`;
  }
  function afterPaper(m){
    const st = $('#suStack'); if (!st) return;
    const lay = paperLayout(m), n = lay.pages.length, t = T(m);
    st.style.setProperty('--cols', lay.cols);
    st.style.height = (n * (A4.H + A4.gap) - A4.gap) + 'px';
    st.innerHTML = lay.pages.map((rows, i) => pageHtml((i === 0 ? paperTitleHtml(m) : '') + rows.map(r => paperRowHtml(m, r, lay.cols)).join(''), i, n, esc(clean(t.name)), 'su-paperdoc')).join('');
    $('#suSide').innerHTML = paperSideHtml(m);
    bindWheel($('#suPV'), d => { const mm = cur(); if (!mm || !mm._place) return; mm._nudge = Math.max(mm._place.minY - mm._place.base, Math.min(mm._place.maxY - mm._place.base, (mm._nudge || 0) + d)); paperPosition(mm); });
    paperPosition(m);
  }
  function paperPosition(m){
    const pv = $('#suPV'), st = $('#suStack'); if (!pv || !st || !m._lay) return;
    const row = st.querySelector(`.su-prow.item[data-i="${m.paperCursor}"]`); if (!row) return;
    const page = row.closest('.su-a4');
    const y = page.offsetTop + A4.top + row.offsetTop + row.offsetHeight / 2;
    m._place = placeStack(pv, st, y, 0.42, m._nudge, m._lay.pages.length);
    const lbl = $('#suPvPage'); if (lbl) lbl.textContent = 'Page ' + (+page.dataset.p + 1) + ' of ' + m._lay.pages.length;
  }
  function paperUpdate(m){
    // update the sheets in place, so typing never rebuilds the page
    const st = $('#suStack');
    if (!st || st.dataset.uid !== m.uid){ renderRunSoftFull(); return; }
    const t = T(m);
    $$('.su-prow.item', st).forEach(row => {
      const i = +row.dataset.i, it = t.items[i], v = m.answers[it.n];
      row.classList.toggle('cur', i === m.paperCursor);
      row.classList.toggle('noted', !!(m.notes[it.n] || '').trim());
      $$('.su-bub', row).forEach(b => b.classList.toggle('on', Number(b.dataset.v) === v));
    });
    const tc = $('#suTypedCard'), mc = $('#suMapCard'), fs = $('#suFinishSlot');
    if (tc) tc.innerHTML = paperTypedHtml(m);
    if (mc) mc.innerHTML = paperMapHtml(m);
    if (fs) fs.innerHTML = paperFinishHtml(m);
    paperNoteSync(m);
    const n = t.items.length, a = answeredCount(m);
    const cnt = $('#suRunCount'); if (cnt) cnt.textContent = a + ' of ' + n + ' answered';
    const pg = $('#suMain .su-prog i'); if (pg) pg.style.width = (n ? a / n * 100 : 0) + '%';
    m._nudge = 0;
    paperPosition(m);
    renderDock();
    cvSync();
  }
  function paperAnswer(m, i, v, fromKey){
    const t = T(m), item = t.items[i];
    setAnswer(m, item, v);
    if (fromKey){ m.typed = (m.typed || []).concat(String(optionsFor(t, item).findIndex(o => o.v === v) + 1)); }
    let j = stepIdx(m, i, 1);
    if (j >= t.items.length) j = i;
    m.paperCursor = j;
    paperUpdate(m);
  }
  function paperKey(m, k){
    const t = T(m);
    let i = m.paperCursor || 0;
    if (k === 'ArrowDown'){ const j = stepIdx(m, i, 1); if (j < t.items.length){ m.paperCursor = j; paperUpdate(m); } return true; }
    if (k === 'ArrowUp'){ const j = stepIdx(m, i, -1); if (j >= 0){ m.paperCursor = j; paperUpdate(m); } return true; }
    if (k === '.'){ const j = stepIdx(m, i, 1); if (j < t.items.length){ m.paperCursor = j; m.typed = (m.typed || []).concat('·'); paperUpdate(m); } return true; }
    if (k === 'Backspace'){
      const item = t.items[i];
      if (m.answers[item.n] == null){ const j = stepIdx(m, i, -1); if (j < 0) return true; i = j; }
      delete m.answers[t.items[i].n]; m.paperCursor = i; m.typed = (m.typed || []).slice(0, -1); paperUpdate(m); return true;
    }
    const item = t.items[i];
    const v = App.keyToVal(t, k, item);
    if (v != null){ paperAnswer(m, i, v, true); return true; }
    return false;
  }
  function paperPage(m, d){
    const lay = paperLayout(m);
    const row = $(`.su-prow.item[data-i="${m.paperCursor}"]`);
    const p = row ? +row.closest('.su-a4').dataset.p : 0;
    const q = Math.max(0, Math.min(lay.pages.length - 1, p + d));
    const first = lay.pages[q].find(r => r.kind === 'item');
    if (first){ m.paperCursor = first.i; paperUpdate(m); }
  }

  /* ---------- client view: a second window for a shared screen ----------
     As in the app: a clean window with only the current question, its answers
     and progress, for a second monitor or a window shared on a video call. No
     scores, notes, item numbers or controls ever reach it; between tests and at
     the end it shows a neutral holding card. The client can answer there (click
     or keys); answers land in the same session as if typed here. This window
     scripts the other one directly through its handle, which also works from a
     file:// copy. */
  const CV = { w:null };
  const cvIsOpen = () => !!(CV.w && !CV.w.closed);
  /* the item the client should see: the current one in the clinician's mode */
  const curItem = m => (!S.clientMode && m.mode === 'paper') ? (m.paperCursor != null ? m.paperCursor : firstBlank(m) % Math.max(1, T(m).items.length)) : m.qIndex;
  const cvButtonHtml = () => `<button class="su-btn su-line su-cvbtn ${cvIsOpen() ? 'on' : ''}" data-act="cv-toggle" title="Opens a second window with just the question and answers, for a shared screen, a second monitor or a window shared on a video call. Your notes stay on this window.">${ICON.screen}${cvIsOpen() ? 'Close client view' : 'Client view'}</button>`;
  function cvToggle(){
    if (cvIsOpen()){ cvClose(); return; }
    const w = window.open('', 'su_client_view', 'width=1100,height=780,popup=yes');
    if (!w){ toast('The browser blocked the window. Allow pop-ups for this page and try again.'); return; }
    CV.w = w;
    const d = w.document;
    d.open();
    d.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Questionnaire</title></head><body class="su-on su-client su-cvw"><div id="suite"><header class="su-top"><span class="su-brand">' + ICON.mark + '</span></header><main class="su-main" id="suMain" data-stage="run"></main></div></body></html>');
    d.close();
    // the same styles as this window (inline <style> blocks in the built file)
    $$('style').forEach(el => { const st = d.createElement('style'); st.textContent = el.textContent; d.head.appendChild(st); });
    d.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && !a.disabled) cvAct(a.dataset.act, a); });
    d.addEventListener('keydown', cvKey);
    w.addEventListener('pagehide', () => setTimeout(cvPaintButton, 150));
    cvSync(); cvPaintButton();
    toast('Client view open. Move that window to the client\'s screen.');
  }
  function cvClose(){ if (cvIsOpen()){ try { CV.w.close(); } catch (_) {} } CV.w = null; cvPaintButton(); }
  function cvPaintButton(){
    if (CV.w && CV.w.closed) CV.w = null;
    const b = $('[data-act="cv-toggle"]'); if (b) b.outerHTML = cvButtonHtml();
    // notes are always out while the client view is open; refresh the question
    // view so that shows (unless a note is being typed)
    if (S.stage === 'run' && !noting()){ const m = cur(); if (m && !m.done && m.mode === 'one' && !S.clientMode) renderRun($('#suMain')); }
  }
  const cvHold = (title, line) => `<div class="su-thanks"><h1>${title}</h1><p>${line}</p></div>`;
  function cvBody(){
    const m = cur();
    if (S.handoff || !m || S.stage !== 'run') {
      const all = S.session.length && S.session.every(x => x.done);
      return all ? cvHold('All done, thank you.', 'Your answers have been recorded.') : cvHold('Thank you.', 'Your clinician will be with you in a moment.');
    }
    const t = T(m);
    if (m.done){
      const more = S.session.some(x => !x.done);
      return more ? cvHold('Thank you.', 'That one is finished. The next one will appear here shortly.') : cvHold('All done, thank you.', 'Your answers have been recorded.');
    }
    if (HANDOFF(t)) return cvHold('Thank you.', 'Your clinician will be with you in a moment.');
    const n = t.items.length, a = answeredCount(m);
    return `<div class="su-runhead"><div class="su-rt"><b>${esc(clean(t.name))}</b><span>${a} of ${n} answered</span></div></div>
      <div class="su-prog"><i style="width:${n ? a / n * 100 : 0}%"></i></div>` + oneHtml(m, true);
  }
  function cvSync(){
    if (!cvIsOpen()) return;
    let d, main;
    try { d = CV.w.document; main = d.getElementById('suMain'); } catch (_) { return; }
    if (!main) return;
    const html = cvBody();
    if (main._last === html) return;              // nothing changed for the client
    main._last = html;
    main.innerHTML = html;
    const q = d.getElementById('suQ'); if (q) fitQuestion(q);
  }
  function cvAct(act, el){
    const m = cur();
    if (!m || m.done || S.stage !== 'run' || S.handoff || HANDOFF(T(m))) return;
    if (act === 'ans'){
      const v = Number(el.dataset.v);
      if (!S.clientMode && m.mode === 'paper') paperAnswer(m, curItem(m), v, false);
      else { flushAdvance(); answerOne(m, v); }
    } else if (act === 'intro-ok' && m.mode === 'one'){ m.seen[el.dataset.key] = true; renderRunSoft(); }
  }
  function cvKey(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const m = cur();
    if (!m || m.done || S.stage !== 'run' || S.handoff || HANDOFF(T(m))) return;
    if (e.key === 'Enter'){ const b = CV.w.document.querySelector('[data-act="intro-ok"]'); if (b){ e.preventDefault(); cvAct('intro-ok', b); } return; }
    const item = T(m).items[curItem(m)];
    const v = item ? App.keyToVal(T(m), e.key, item) : null;
    if (v != null){ e.preventDefault(); cvAct('ans', { dataset:{ v } }); }
  }

  /* ---------- app runner hand-off (RMET, ASSIST) ---------- */
  function startHandoff(m){
    S.handoff = { uid:m.uid };
    State.client = Object.assign({}, stateClient(), { name:S.client.name || '' });
    App.openTest(m.id);          // renders the app's intake with these details filled in
    App.startRunner();           // reads them back and starts the app's own runner
    document.body.classList.add('su-handoff');
    $('#suHandoffLbl').textContent = clean(T(m).fullName);
    cvSync();
  }
  function endHandoff(result){
    const h = S.handoff; S.handoff = null;
    document.body.classList.remove('su-handoff');
    try { App._backExit = null; App.stopRmetTimer && App.stopRmetTimer(); } catch (_) {}
    App.go('home'); $('#view-home').innerHTML = '';
    syncToolUrl(null);
    const m = h && S.session.find(x => x.uid === h.uid);
    if (m && result){ m.result = result; m.done = true; m.answers = Object.assign({}, result.answers || {}); }
    const next = S.session.findIndex(x => !x.done);
    if (m && result){
      if (next >= 0){ S.cur = next; S.stage = 'run'; toast(shortName(m.id) + ' scored. Next: ' + shortName(S.session[next].id)); }
      else { S.stage = 'results'; S.resSel = S.session.filter(x => x.done).indexOf(m); }
    }
    render();
  }
  function hookApp(){
    // completion inside the app's runner returns here instead of to its results page
    const origComplete = App.completeAssessment.bind(App);
    App.completeAssessment = function(){
      if (!S.handoff) return origComplete();
      const r = State.result;
      if (r && State.answers) r.answers = Object.assign({}, State.answers);
      if (r && State.itemNotes){ const n = {}; for (const k in State.itemNotes){ const v = (State.itemNotes[k] || '').trim(); if (v) n[k] = v; } if (Object.keys(n).length) r.itemNotes = n; }
      if (r && r.flag && r.flag.positive) r.needsReview = true;
      endHandoff(r);
    };
    // leaving the app's runner (its Exit, confirmed) also comes back to the session
    const origFinishSession = App.finishSession.bind(App);
    App.finishSession = function(){ if (S.handoff || S.norms){ S.norms = false; endHandoff(null); return; } return origFinishSession(); };
  }
  function openNorms(){
    S.norms = true; S.handoff = { uid:null };
    App.openNorms();
    document.body.classList.add('su-handoff');
    $('#suHandoffLbl').textContent = 'Norms reference: every embedded cut-off, mean and percentile, for checking against source';
  }

  /* ---------- 4. results ---------- */
  function resultInner(m, forPrint){
    const t = T(m), r = m.result;
    State.currentTest = t; State.result = r; State.client = stateClient();
    let body;
    try { body = App.resultBody(t, r); } catch (e){ body = `<p class="su-err">The results for this test could not be shown (${esc(e.message)}).</p>`; }
    const notes = (!forPrint || S.notesInReport) ? App.clinicianNotesPanel(t, r) : '';
    return body + notes + App.referencesBlock(t);
  }
  const resultHtml = (m, forPrint) => `<div class="results su-results">${resultInner(m, forPrint)}</div>`;
  function headline(m){
    const r = m.result || {};
    const parts = [];
    if (r.total != null && r.totalMax != null) parts.push(`${r.total} / ${r.totalMax}`);
    if (r.severity && r.severity.label) parts.push(clean(r.severity.label));
    return parts.join(' · ') || 'Complete';
  }
  /* Position of the total against the published reference points: the registry's
     own severity bands and cut-offs only. No track when a test has neither. */
  function trackHtml(m){
    const t = T(m), r = m.result;
    if (!r || typeof r.total !== 'number' || typeof r.totalMax !== 'number' || !(r.totalMax > 0)) return '';
    const sev = (t.scoring && t.scoring.severity) || [];
    const cuts = new Set();
    if (typeof r.cutoff === 'number') cuts.add(r.cutoff);
    (Array.isArray(t.cutoffs) ? t.cutoffs : []).forEach(c => { if (c && typeof c.score === 'number') cuts.add(c.score); });
    if (!sev.length && !cuts.size) return '';
    const max = r.totalMax, span = max + 1;
    const pct = v => Math.max(0, Math.min(100, v / span * 100));
    let zones = '', lo = 0;
    sev.forEach(b => {
      const hi = b.max == null ? max : Math.min(max, b.max);
      if (hi < lo) return;
      zones += `<span class="su-tz ${esc(b.cls || '')}" style="left:${pct(lo)}%;width:${pct(hi + 1) - pct(lo)}%"><em>${esc(clean(b.label))}</em></span>`;
      lo = hi + 1;
    });
    const rec = (Array.isArray(t.cutoffs) ? t.cutoffs : []).find(c => c && c.recommended);
    const notches = [...cuts].sort((a, b) => a - b).map(c => `<span class="su-tn ${(rec && rec.score === c) || c === r.cutoff ? 'key' : ''}" style="left:${pct(c)}%"><b>${c}</b></span>`).join('');
    return `<div class="su-track ${sev.length ? 'zoned' : ''}"><div class="su-tbar">${zones}${notches}<span class="su-tm" style="left:${pct(r.total + 0.5)}%"><b>${r.total}</b></span></div>
      <div class="su-tends"><span>0</span><span>${t.higherMeans ? 'Higher scores: ' + esc(clean(t.higherMeans)) : ''}</span><span>${max}</span></div></div>`;
  }
  function animateFills(scope){
    requestAnimationFrame(() => {
      $$('[data-fill]', scope).forEach(el => { el.style.width = el.getAttribute('data-fill') + '%'; });
      $$('[data-ring-target]', scope).forEach(c => { c.style.strokeDashoffset = c.getAttribute('data-ring-target'); });
    });
  }
  function renderResults(main){
    if (S.clientMode){ main.innerHTML = `<div class="su-thanks"><h1>All done, thank you.</h1><p>Please hand the screen back to your clinician.</p></div>`; return; }
    const done = S.session.filter(m => m.done), todo = S.session.filter(m => !m.done);
    if (!done.length){ main.innerHTML = '<div class="su-empty">No results yet.</div>'; return; }
    S.resSel = Math.min(Math.max(0, S.resSel), done.length - 1);
    const sel = done[S.resSel];
    main.innerHTML = `<div class="su-res">
      <aside class="su-reslist">
        <div class="su-eyebrow">Results</div>
        ${done.map((m, i) => `<button class="su-rescard ${i === S.resSel ? 'on' : ''}" data-act="res-sel" data-i="${i}"><b>${esc(clean(T(m).name))}</b><small>${esc(T(m).respondent)}</small><span>${esc(headline(m))}</span>${m.result && m.result.needsReview ? '<em>Review flagged item</em>' : ''}</button>`).join('')}
        ${todo.map(m => `<button class="su-rescard todo" data-act="chip" data-i="${S.session.indexOf(m)}"><b>${esc(clean(T(m).name))}</b><small>Not finished${itemsOf(m).length ? ' · ' + answeredCount(m) + ' of ' + itemsOf(m).length + ' answered' : ''}</small><span>Carry on →</span></button>`).join('')}
      </aside>
      <section class="su-respanel"><div class="su-reshead"><div class="su-reshead-t"><div><h2>${esc(clean(T(sel).fullName))}</h2><p class="su-sub">${esc(T(sel).respondent)} · ${esc(fmtDate(S.client.date || TODAY))}</p></div>
        <button class="su-btn su-line" data-act="redo" data-uid="${sel.uid}">Change answers</button></div>${trackHtml(sel)}</div>
        <div class="su-resbody" id="suResBody">${resultHtml(sel)}</div></section></div>`;
    animateFills($('#suResBody'));
  }

  /* ---------- 5. report and print: real A4 pages ---------- */
  const REP = { sig:'', pages:[], nudge:0, place:null };
  function docHeadHtml(){
    const c = S.client, a = clientAge(), done = S.session.filter(m => m.done);
    const meta = [
      a != null ? ['Age', a + (a === 1 ? ' year' : ' years')] : null,
      c.dob ? ['Date of birth', fmtDate(c.dob)] : null,
      c.sex ? ['Sex', c.sex[0].toUpperCase() + c.sex.slice(1)] : null,
      c.gender ? ['Gender', App.genderLabel ? App.genderLabel(c.gender) : c.gender] : null,
      c.clinician ? ['Clinician', c.clinician] : null,
      ['Assessment date', fmtDate(c.date || TODAY)],
      c.ref ? ['Reference', c.ref] : null,
    ].filter(Boolean);
    return `<div class="su-doc-head"><div class="su-doc-k"><span>Screening supplements</span><span>${esc(fmtDate(c.date || TODAY))}</span></div>
      <h1>${c.name ? esc(c.name) : 'Screening summary'}</h1>
      <div class="su-doc-meta">${meta.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <table class="su-sumtbl"><thead><tr><th>Test</th><th>Completed by</th><th>Result</th></tr></thead><tbody>${done.map(m => `<tr><td><b>${esc(clean(T(m).name))}</b></td><td>${esc(T(m).respondent)}</td><td>${esc(headline(m))}${m.result && m.result.needsReview ? ' · flagged item to review' : ''}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const secHeadHtml = m => `<div class="su-doc-sec"><h2>${esc(clean(T(m).fullName))}</h2><p class="su-doc-by">${esc(T(m).respondent)}</p>${trackHtml(m)}</div>`;
  function resultBlocks(m){
    const d = document.createElement('div');
    d.innerHTML = resultInner(m, true);
    return Array.from(d.children).map(c => c.outerHTML);
  }
  /* the y of a good place to cut a block taller than a page: the lowest row
     boundary that fits, so table rows and paragraphs are never cut in half */
  function findCut(el, from, to){
    const top = el.getBoundingClientRect().top;
    let best = 0;
    el.querySelectorAll('tr, li, p, h3, h4, .panel-head, .score-hero, svg, [class*="-row"], [class*="row-"]').forEach(x => {
      const b = x.getBoundingClientRect().bottom - top;
      if (b > from + 60 && b <= to && b > best) best = b;
    });
    return best || to;
  }
  function buildReport(){
    const done = S.session.filter(m => m.done);
    const sig = JSON.stringify([done.map(m => m.uid + ':' + (m.result && m.result.total)), S.client, S.notesInReport]);
    if (sig === REP.sig && REP.pages.length) return REP.pages;
    const footer = (typeof CONFIG !== 'undefined' && CONFIG.reportFooter) || 'These tools are screening supplements, not diagnostic instruments. Interpret every result within a comprehensive clinical assessment.';
    const blocks = [{ html:docHeadHtml() }];
    done.forEach(m => { blocks.push({ html:secHeadHtml(m), newPage:true }); resultBlocks(m).forEach(h => blocks.push({ html:h })); });
    blocks.push({ html:`<p class="su-doc-foot">${esc(footer)}</p>` });
    const wrap = h => `<div class="results su-results su-doc">${h}</div>`;
    const mz = measure(blocks.map(b => wrap(b.html)), 'su-docmeasure');
    const pages = []; let cur = [], used = 0;
    const push = () => { pages.push(cur.join('')); cur = []; used = 0; };
    blocks.forEach((b, k) => {
      const h = mz.hs[k];
      if (b.newPage && cur.length) push();
      if (h <= A4_CH - used){ cur.push(wrap(b.html)); used += h; return; }
      if (h <= A4_CH){ push(); cur.push(wrap(b.html)); used = h; return; }
      // taller than a page: show it in slices cut at row boundaries
      let off = 0, guard = 0;
      while (off < h - 1 && guard++ < 40){
        let room = A4_CH - used;
        if (room < 140 && cur.length){ push(); room = A4_CH; }
        const cut = Math.min(h, Math.max(off + 40, findCut(mz.els[k], off, off + room)));
        cur.push(`<div class="su-slice" style="height:${Math.ceil(cut - off)}px"><div style="transform:translateY(${-off}px)">${wrap(b.html)}</div></div>`);
        used += cut - off; off = cut;
        if (off < h - 1) push();
      }
    });
    if (cur.length) push();
    mz.box.remove();
    const left = 'Screening supplements' + (S.client.name ? ' · ' + esc(S.client.name) : '');
    REP.pages = pages.map((inner, i) => pageHtml(inner, i, pages.length, left, 'su-docpage'));
    REP.sig = sig; REP.nudge = 0;
    return REP.pages;
  }
  function renderReport(main){
    if (S.clientMode){ renderResults(main); return; }
    const done = S.session.filter(m => m.done), todo = S.session.length - done.length;
    main.innerHTML = `<div class="su-rep">
      <div class="su-paperview su-repview" id="suPV"><div class="su-stack" id="suStack"></div>
        <div class="su-pvbar"><button class="su-mini" data-act="ppage" data-d="-1" aria-label="Previous page">↑</button><span id="suPvPage"></span><button class="su-mini" data-act="ppage" data-d="1" aria-label="Next page">↓</button></div></div>
      <aside class="su-side">
        <div class="su-card"><h5>Report</h5><p>A summary of ${done.length === 1 ? 'the test' : 'all ' + done.length + ' tests'}, then each test on its own pages with its full results, item responses and references.${todo ? ` ${todo} unfinished ${todo === 1 ? 'test is' : 'tests are'} left out.` : ''}</p>
          ${S.client.name ? '' : '<p class="su-cardsub">No name was entered, so the report does not name anyone.</p>'}<p class="su-cardsub">The pages print exactly as shown.</p></div>
        <div class="su-card"><h5>Include</h5><label class="su-check"><input type="checkbox" id="suNotesTog" ${S.notesInReport ? 'checked' : ''}> Clinician item notes</label></div>
        <button class="su-btn su-primary su-wide" data-act="print">${ICON.print} Print or save as PDF</button>
        <button class="su-btn su-line su-wide" data-act="new-client">New client</button>
      </aside></div>`;
    const pages = buildReport(), st = $('#suStack');
    st.style.height = (pages.length * (A4.H + A4.gap) - A4.gap) + 'px';
    st.innerHTML = pages.join('');
    setFills(st);
    bindWheel($('#suPV'), d => { if (!REP.place) return; REP.nudge = Math.max(REP.place.minY - REP.place.base, Math.min(REP.place.maxY - REP.place.base, REP.nudge + d)); reportPosition(); });
    reportPosition();
  }
  function reportPosition(){
    const pv = $('#suPV'), st = $('#suStack'); if (!pv || !st || !REP.pages.length) return;
    REP.place = placeStack(pv, st, 0, 0, REP.nudge + 20, REP.pages.length);
    const ty = REP.place.base + REP.nudge + 20, s = REP.place.s;
    const atMid = (pv.clientHeight / 2 - Math.min(REP.place.maxY, Math.max(REP.place.minY, ty))) / s;
    const p = Math.max(0, Math.min(REP.pages.length - 1, Math.floor(atMid / (A4.H + A4.gap))));
    REP.cur = p;
    const lbl = $('#suPvPage'); if (lbl) lbl.textContent = 'Page ' + (p + 1) + ' of ' + REP.pages.length;
  }
  function reportPage(d){
    if (!REP.place) return;
    const p = Math.max(0, Math.min(REP.pages.length - 1, (REP.cur || 0) + d));
    // put the top of page p at the top of the frame
    REP.nudge = -p * (A4.H + A4.gap) * REP.place.s;
    reportPosition();
  }
  function doPrint(){
    const p = $('#suitePrint');
    p.innerHTML = buildReport().join('');
    setFills(p);
    setTimeout(() => window.print(), 60);
  }

  /* ---------- events ---------- */
  const ACT = {
    'stage': el => go(el.dataset.stage),
    'begin': () => { if (!S.session.length) return; S.cur = firstUndone(); startMeasure(S.session[S.cur]); },
    'chip': el => { flushAdvance(); S.cur = +el.dataset.i; startMeasure(S.session[S.cur]); },
    'client': () => openClientSheet(),
    'cat': el => { S.carIdx = 0; const c = el.dataset.cat; if (!c) S.filters.cats.clear(); else if (S.filters.cats.has(c)) S.filters.cats.delete(c); else S.filters.cats.add(c); renderLibrary($('#suMain')); },
    'age-step': el => { const a = clientAge(); S.client.dob = ''; S.client.age = Math.max(0, Math.min(110, (a == null ? 18 : a + (+el.dataset.d)))); renderLibrary($('#suMain')); renderDock(); },
    'age-clear': () => { S.client.dob = ''; S.client.age = null; renderLibrary($('#suMain')); renderDock(); },
    'show-all': () => { S.filters.showAll = !S.filters.showAll; renderLibrary($('#suMain')); },
    'lib-view': el => { if (S.filters.view === el.dataset.view) return; S.filters.view = el.dataset.view; transition(() => renderLibrary($('#suMain'))); },
    'car-step': el => carStep(+el.dataset.d),
    'car-card': el => { const k = +el.dataset.k; if (k !== S.carIdx){ S.carIdx = k; carLayout(); return; } openSheet(el.dataset.row); },
    'open': el => openSheet(el.dataset.row),
    'quick-add': (el, e) => { e.stopPropagation(); quickAdd(el.dataset.row); },
    'sheet-close': () => closeSheet(),
    'pick-version': el => { S.sheet.id = el.dataset.id; syncToolUrl(S.sheet.id); refreshSheetFits(); },
    'pick-mode': el => { S.sheet.mode = el.dataset.mode; refreshSheetFits(); },
    'add-test': () => addFromSheet(false),
    'start-test': () => addFromSheet(true),
    'remove-test': () => {
      const i = S.session.findIndex(m => m.uid === S.sheet.existing);
      if (i >= 0 && (answeredCount(S.session[i]) || S.session[i].done) && !confirm('Remove this test and its answers from the session?')) return;
      if (i >= 0){ S.session.splice(i, 1); if (S.cur >= S.session.length) S.cur = S.session.length - 1; }
      closeSheet(); if (!S.session.length) S.stage = 'library'; render();
    },
    'new-client': () => {
      if (S.session.some(m => m.done || answeredCount(m)) && !confirm('Start a new client? This clears the details, answers and results on screen.')) return;
      S.client = blankClient(); S.session = []; S.cur = -1; S.sheet = null; S.stage = 'library'; S.resSel = 0; S.showName = false;
      $('#suitePrint').innerHTML = ''; transition(render);
    },
    'mode': el => { const m = cur(); if (!m) return; flushAdvance(); m.mode = el.dataset.mode; if (m.mode === 'paper'){ m.paperCursor = m.qIndex; m._nudge = 0; } else m.qIndex = m.paperCursor == null ? m.qIndex : m.paperCursor; renderRunSoftFull(); },
    'ans': el => { const m = cur(); flushAdvance(); answerOne(m, Number(el.dataset.v)); },
    'prev': () => moveOne(cur(), -1),
    'next': () => moveOne(cur(), 1),
    'finish': el => { if (el.getAttribute('aria-disabled') === 'true'){ finishMeasure(cur()); return; } finishMeasure(cur()); },
    'intro-ok': el => { const m = cur(); m.seen[el.dataset.key] = true; renderRunSoft(); },
    'note-open': () => { const m = cur(); m.noteOpen = T(m).items[m.qIndex].n; flushAdvance(); renderRunSoft(); const ta = $('[data-note]'); if (ta) ta.focus(); },
    'pans': el => paperAnswer(cur(), +el.dataset.i, Number(el.dataset.v), false),
    'pjump': el => { const m = cur(); m.paperCursor = +el.dataset.i; m._nudge = 0; renderRunSoft(); },
    'ppage': el => { if (S.stage === 'report'){ reportPage(+el.dataset.d); return; } paperPage(cur(), +el.dataset.d); },
    'res-sel': el => { S.resSel = +el.dataset.i; renderResults($('#suMain')); },
    'redo': el => { const i = S.session.findIndex(m => m.uid === el.dataset.uid); const m = S.session[i]; if (HANDOFF(T(m))){ if (!confirm('This test runs in its own format, so changing answers means doing it again. Start it again?')) return; S.session[i] = newMeasure(m.id); S.cur = i; startMeasure(S.session[i]); return; } m.done = false; m.result = null; m.qIndex = 0; m.paperCursor = 0; S.cur = i; S.stage = 'run'; transition(render); },
    'print': () => doPrint(),
    'handoff-start': () => startHandoff(cur()),
    'handoff-back': () => { if (S.norms){ S.norms = false; endHandoff(null); return; } if (confirm('Leave this test? Its answers so far will not be kept.')) endHandoff(null); },
    'norms': () => openNorms(),
    'exit-client': () => setClientMode(false),
    'cv-toggle': () => cvToggle(),
    'show-name': () => { S.showName = true; renderSheet(true); const n = $('[data-f="name"]', $('#suLayer')); if (n) n.focus(); },
  };
  function onClick(e){
    const a = e.target.closest('[data-act]');
    if (!a || !e.target.closest('#suite')) return;
    if (a.disabled) return;
    const fn = ACT[a.dataset.act];
    if (fn) fn(a, e);
  }
  function onInput(e){
    const el = e.target;
    if (el.id === 'suSearch'){ S.filters.q = el.value.trim().toLowerCase(); S.carIdx = 0; const pos = el.selectionStart; renderLibrary($('#suMain')); const s = $('#suSearch'); s.focus(); try { s.setSelectionRange(pos, pos); } catch (_) {} return; }
    if (el.id === 'suAgeRange'){ S.client.dob = ''; S.client.age = +el.value; renderLibrary($('#suMain')); renderDock(); const r = $('#suAgeRange'); if (r) r.focus(); return; }
    if (el.dataset && el.dataset.f){ readClientField(el); return; }
    if (el.dataset && el.dataset.note != null){
      const m = cur(); if (!m) return;
      m.notes[el.dataset.note] = el.value;
      const i = T(m).items.findIndex(it => String(it.n) === el.dataset.note), has = !!el.value.trim();
      const row = $(`.su-prow.item[data-i="${i}"]`); if (row) row.classList.toggle('noted', has);
      const dot = $$('#suMapCard .su-mini-map button')[i]; if (dot) dot.classList.toggle('n', has);
      return;
    }
    if (el.id === 'suNotesTog'){ S.notesInReport = el.checked; REP.sig = ''; renderReport($('#suMain')); return; }
    if (el.id === 'suClientMode'){ setClientMode(el.checked); }
  }
  function setClientMode(on){
    flushAdvance();
    S.clientMode = on;
    if (on){ closeSheet(); if (!S.session.length){ S.clientMode = false; toast('Add a test first'); render(); return; } S.stage = 'run'; if (S.cur < 0) S.cur = firstUndone(); }
    transition(render);
  }
  function onKey(e){
    if (S.handoff) return;                                 // the app's runner has the keyboard
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    const k = e.key;
    if (k === 'Escape'){
      if (S.clientMode) return;                          // only the button leaves client mode
      if (S.sheet){ closeSheet(); return; }
      if (typing) e.target.blur();
      return;
    }
    if (typing){
      if (k === 'Enter' && S.sheet && !S.sheet.clientOnly && tag !== 'textarea'){ e.preventDefault(); addFromSheet(true); }
      return;
    }
    if (S.sheet){ if (k === 'Enter'){ e.preventDefault(); S.sheet.clientOnly ? closeSheet() : addFromSheet(true); } return; }
    if (S.stage === 'library'){
      if (k === '/'){ e.preventDefault(); const s = $('#suSearch'); if (s) s.focus(); return; }
      if (S.filters.view === 'carousel' && (k === 'ArrowDown' || k === 'ArrowUp')){ e.preventDefault(); carStep(k === 'ArrowDown' ? 1 : -1, true); return; }
      if (k === 'Enter'){ const r = e.target.closest && e.target.closest('.su-row[data-row], .su-cc[data-row]'); if (r){ openSheet(r.dataset.row); return; } if (S.session.length) ACT.begin(); }
      return;
    }
    if (S.stage === 'results' && k === 'Enter'){ go('report'); return; }
    if (S.stage !== 'run') return;
    const m = cur(); if (!m) return;
    if (m.done){ if (k === 'Enter'){ const next = S.session.findIndex(x => !x.done); if (next >= 0) ACT.chip({ dataset:{ i:next } }); else go('results'); } return; }
    if (HANDOFF(T(m))) return;
    const mode = S.clientMode ? 'one' : m.mode;
    if (mode === 'one'){
      const introKey = sectionIntroPending(m);
      if (introKey){ if (k === 'Enter' || k === 'ArrowRight'){ e.preventDefault(); m.seen[introKey] = true; renderRunSoft(); } return; }
      if (k === 'ArrowRight'){ e.preventDefault(); moveOne(m, 1); return; }
      if (k === 'ArrowLeft'){ e.preventDefault(); moveOne(m, -1); return; }
      if (k === 'Enter'){ if (isComplete(m)){ e.preventDefault(); finishMeasure(m); } return; }
      if ((k === 'n' || k === 'N') && !S.clientMode){ e.preventDefault(); ACT['note-open'](); return; }
      flushAdvance();
      const item = T(m).items[m.qIndex];
      const v = App.keyToVal(T(m), k, item);
      if (v != null){ e.preventDefault(); answerOne(m, v); }
      return;
    }
    if (k === 'Enter'){ e.preventDefault(); finishMeasure(m); return; }
    if (k === 'n' || k === 'N'){ const ta = $('#suNoteCard textarea'); if (ta){ e.preventDefault(); ta.focus(); } return; }
    if (paperKey(m, k)) e.preventDefault();
  }

  /* ---------- boot ---------- */
  function boot(){
    buildCatalogue();
    hookApp();
    shell();
    document.body.classList.add('su-on');
    const home = $('#view-home'); if (home) home.innerHTML = '';   // the app's carousel is not used here
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', e => { if (e.target.dataset && (e.target.dataset.f === 'dob' || e.target.dataset.f === 'date')) readClientField(e.target); });
    document.addEventListener('keydown', onKey);
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (S.handoff) return; if (S.stage === 'run'){ const m = cur(); if (m && m.mode === 'paper' && $('#suStack')) paperPosition(m); else renderRunSoftFull(); } else if (S.stage === 'report') reportPosition(); else if (S.stage === 'library') carLayout(); }, 120); });
    window.addEventListener('afterprint', () => { $('#suitePrint').innerHTML = ''; });
    document.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('#suNoteCard')) setTimeout(() => { const m = cur(); if (m && S.stage === 'run' && $('#suNoteCard')) paperNoteSync(m); }, 0); });
    window.addEventListener('beforeunload', cvClose);
    render();
    if (DEEP && REGISTRY[DEEP]) openSheet(null, DEEP);
  }

  return { boot, _S:S, _ACT:ACT };
})();

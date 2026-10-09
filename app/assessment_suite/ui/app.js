/* ── App Controller: Home, Intake, Runner ───────────────────────────────────────
   All views except results. Calls Scoring.run() on finish.
─────────────────────────────────────────────────────────────────────────────── */

/* Multi-version instruments collapse into one dashboard tile + a version chooser. */
const FAMILIES = [
  {key:'aq', name:'AQ', fullName:'Autism-Spectrum Quotient', category:'autism',
   desc:'Five-domain autistic-trait questionnaire. Pick the version matched to the client’s age and who is reporting.',
   foot:'Parent & self-report', sub:'Child · Adolescent · Adult', ages:'4 years to adult',
   ids:['aq_child','aq_adolescent','aq_adult']},
  {key:'vand', name:'Vanderbilt', fullName:'NICHQ Vanderbilt (ADHD)', category:'adhd',
   desc:'ADHD screen with oppositional, conduct, and anxiety/depression screens. Choose the informant.',
   foot:'Parent & teacher', sub:'Parent · Teacher', ages:'6–12 years',
   ids:['vand_parent','vand_teacher']},
  {key:'snap', name:'SNAP-IV', fullName:'Swanson, Nolan & Pelham (ADHD/ODD)', category:'adhd',
   desc:'ADHD screen (inattention and hyperactivity/impulsivity) with an oppositional-defiant subset. Choose the informant.',
   foot:'Parent & teacher', sub:'Parent · Teacher', ages:'6–18 years',
   ids:['snap_parent','snap_teacher']},
  {key:'wfirs', name:'WFIRS', fullName:'Weiss Functional Impairment Rating Scale', category:'adhd',
   desc:'Functional impairment across everyday life domains, distinct from ADHD symptoms. Choose self-report or parent.',
   foot:'Self & parent', sub:'Self · Parent', ages:'6 years to adult',
   ids:['wfirs_s','wfirs_p']},
  {key:'sdq', name:'SDQ', fullName:'Strengths & Difficulties Questionnaire', category:'behaviour',
   desc:'Brief emotional & behavioural screen across five scales. Choose the informant.',
   foot:'Parent & self-report', sub:'Parent · Child self-report', ages:'4–17 years',
   ids:['sdq_parent','sdq_self']},
  {key:'baars', name:'BAARS-IV', fullName:'Barkley Adult ADHD Rating Scale-IV', category:'adhd',
   desc:'Adult ADHD symptoms (current + childhood) by DSM symptom count, plus a Sluggish Cognitive Tempo scale. Choose the informant.',
   foot:'Self & informant', sub:'Self · Informant', ages:'18+ years',
   ids:['baars_self','baars_informant']},
  {key:'gsq', name:'GSQ', fullName:'Glasgow Sensory Questionnaire', category:'sensory',
   desc:'Frequency of atypical sensory responses (hyper- and hypo-) across seven senses. Pick the adult self-report or a parent-completed child version (full or brief).',
   foot:'Self & parent', sub:'Adult self · Parent (child) · Parent brief', ages:'6 years to adult',
   ids:['gsq_p','rgsq_p','gsq']},
  {key:'ybocs', name:'Y-BOCS', fullName:'Yale-Brown Obsessive-Compulsive Scale', category:'ocd',
   desc:'Severity of obsessions and compulsions across time, interference, distress, resistance, and control (0–40). Choose the adult clinician-rated or self-report form, or the children’s CY-BOCS. The optional symptom checklists, adult and child, identify which symptoms to rate and carry no severity score of their own.',
   foot:'Adult & children', sub:'Clinician-rated · Self-report · CY-BOCS · Checklists', ages:'Children to adults',
   ids:['ybocs_clin','ybocs_sr','ybocs_child','ybocs_check','ybocs_child_check']},
  {key:'asrs', name:'ASRS', fullName:'Adult ADHD Self-Report Scale (ASRS v1.1)', category:'adhd',
   desc:'WHO/DSM-5 ADHD symptom scale. Pick the adult self-report, the adolescent screener, or the observer-rated form.',
   foot:'Self & observer', sub:'Adolescent · Adult · Observer', ages:'11 years to adult',
   ids:['asrs_adolescent','asrs','asrs_observer']},
  {key:'wurs', name:'WURS-25', fullName:'Wender Utah Rating Scale (25-item)', category:'adhd',
   desc:'Retrospective childhood-ADHD symptoms rated in adulthood. Choose the self-report or an observer report.',
   foot:'Self & observer', sub:'Self · Observer', ages:'18+ years',
   ids:['wurs_self','wurs_observer']},
  /* No ADI-R family here on purpose: the adir/adirw engines are online-only
     (never bundled into dist), so an ADI-R tile in the offline/supplement
     library would open to "not available in this build". The console's
     Online.LIB_FAMILIES does carry the pair. */
  {key:'diva', name:'DIVA-5', fullName:'Diagnostic Interview for ADHD', category:'adhd',
   desc:'Semi-structured clinician interview mapping DSM-5 ADHD criteria with real-life examples. Choose the adult or the young-person interview.',
   foot:'Clinician-administered', sub:'Adult · Young (5–17)', ages:'5 years to adult',
   ids:['diva','young_diva']},
  {key:'lsas', name:'LSAS', fullName:'Liebowitz Social Anxiety Scale', category:'mood',
   desc:'Fear and avoidance across social and performance situations. Choose the adult scale or the child/adolescent severity measure.',
   foot:'Self-report', sub:'Child (11–17) · Adult', ages:'11 years to adult',
   ids:['sad_child','lsas']},
  {key:'rcads', name:'RCADS', fullName:'Revised Child Anxiety and Depression Scale', category:'mood',
   desc:'Anxiety and low-mood screen for young people. Choose the full 47-item or the brief 25-item form, self- or parent-reported.',
   foot:'Self & parent', sub:'Full 47 · Short 25', ages:'8–18 years',
   ids:['rcads_self','rcads_parent','rcads25_self','rcads25_parent']},
  {key:'spq', name:'SPQ', fullName:'Sensory Perception Quotient', category:'sensory',
   desc:'Basic sensory sensitivity across the seven senses. Pick the full 92-item or the brief 35-item short form.',
   foot:'Self-report', sub:'Full (92) · Short (35)', ages:'18+ years',
   ids:['spq','spq35']},
  /* The two OCI forms are the same measure for different ages, but they are NOT
     parallel: adult rates DISTRESS 0-4 over six subscales, child rates FREQUENCY
     0-2 over five (hoarding dropped, following DSM-5). Keep the sub-line honest
     about that. Mirrored in Online.LIB_FAMILIES — the two lists are hand-synced. */
  {key:'oci', name:'OCI', fullName:'Obsessive-Compulsive Inventory', category:'ocd',
   desc:'Self-report screen for obsessive-compulsive symptoms, with published cut-offs. Choose the adult OCI-R (18 items, distress over six dimensions) or the child OCI-CV-R (18 items, frequency over five, hoarding excluded).',
   foot:'Child & adult', sub:'Child (6–17) · Adult', ages:'6 years to adult',
   ids:['oci_cv_r','ocir']},
  {key:'rbq3', name:'RBQ-3', fullName:'Repetitive Behaviours Questionnaire-3', category:'autism',
   desc:'Restricted and repetitive behaviours across the lifespan. Choose self-report or an informant/other-report.',
   foot:'Self & informant', sub:'Self · Other-report', ages:'13 years to adult',
   ids:['rbq3_self','rbq3_other']}
];

const App = {
  go(view){
    // leaving a Test library practice run (any runner's Exit) returns to the library, not the patient home
    if(view==='home' && typeof Online!=='undefined' && Online.sandbox && Online.exitSandbox){ Online.exitSandbox(); return; }
    // leaving the runner always halts a running RMET stopwatch + any queued auto-advance
    if(view!=='runner'){ this.stopRmetTimer(); clearTimeout(State.advanceTimer); State.advanceTimer = null; this._backExit = null; }
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+view).classList.add('active');
    // the runner is built before its view is shown, when nothing can be measured
    if(view==='runner') this._lockCardHeight();
    // The local instrument library fills the viewport exactly and never scrolls the
    // page (the deck scrolls internally instead). Detected from the markup that is
    // actually mounted, so the online console's own home is left alone.
    const shell = document.querySelector('.app');
    if(shell) shell.classList.toggle('home-fit', view==='home' && !!document.querySelector('#view-home .home-shell'));
    window.scrollTo({top:0,behavior:'instant'});
    this.updateTopMeta();
    if(view==='home') this._syncToolUrl(null);   // clean home = no ?tool deep-link
  },

  /* Deep-linking for the hosted supplement tools: reflect the open instrument in
     the URL as ?tool=<id> so a specific tool can be bookmarked or shared (read
     back on boot below). Local / offline mode only; the online console owns its
     own URL (?informant=, auth redirects), so this is a no-op there. Only the
     `tool` param is touched, everything else on the URL is preserved. */
  _syncToolUrl(id){
    try{
      if(typeof CONFIG!=='undefined' && CONFIG.resolvedMode==='online') return;
      const u = new URL(window.location.href);
      if(id) u.searchParams.set('tool', id); else u.searchParams.delete('tool');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }catch(_){}
  },

  updateTopMeta(){
    const el = document.getElementById('topbarMeta');
    if(State.client.name && State.currentTest){
      el.textContent = `${State.client.name} · ${State.currentTest.name}`;
    } else if(State.client.name){
      el.textContent = State.client.name;
    } else { el.textContent=''; }
    // the meta text takes header room: refit the console tabs so none is cut off ("Financ")
    if(typeof Online!=='undefined' && Online._fitTopNav) Online._fitTopNav();
  },

  /* ---------- HOME ---------- */
  renderHome(){
    const tests = Object.values(REGISTRY);
    const tagClass = {autism:'tag-autism',adhd:'tag-adhd',mood:'tag-mood',sensory:'tag-sensory',social:'tag-social',behaviour:'tag-behaviour',substance:'tag-substance',sleep:'tag-sleep',trauma:'tag-trauma',ocd:'tag-ocd'};
    const tagLabel = {autism:'Autism',adhd:'ADHD',mood:'Mood',sensory:'Sensory',social:'Social',behaviour:'Behaviour',substance:'Substance use',sleep:'Sleep',trauma:'Trauma',ocd:'OCD'};

    const personIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const clockIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const listIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    const ic = this._ic = {personIcon, listIcon, clockIcon, checkIcon, tagClass, tagLabel};

    // One deck holds every tile; multi-version instruments collapse into one family
    // entry each (AQ, Vanderbilt, SDQ, BAARS-IV). The home is a two-pane shell:
    // a control panel (title, search, categories, settings) beside the deck,
    // stacking to a compact header on narrow screens.
    const catOrder = ['autism','adhd','mood','trauma','ocd','behaviour','social','sensory','sleep','substance'];
    const familyIds = new Set(FAMILIES.flatMap(f=>f.ids));
    const singles = tests.filter(t=>!familyIds.has(t.id));
    const deck = [];
    for(const f of FAMILIES){
      const members = f.ids.map(id=>REGISTRY[id]).filter(Boolean);
      if(members.length) deck.push({cat:f.category, kind:'family', key:f.key, f, members});
    }
    for(const t of singles) deck.push({cat:t.category, kind:'test', id:t.id, t});
    const deckName = d => (d.kind==='family' ? d.f.name : d.t.name);
    deck.sort((a,b)=>deckName(a).toLowerCase().localeCompare(deckName(b).toLowerCase()));
    this._deck = deck;
    const hs = this._home = this._home || {cat:'all', view:'carousel', idx:0, q:''};
    hs.q = hs.q || '';
    if(hs.cat!=='all' && !deck.some(d=>d.cat===hs.cat)) hs.cat = 'all';

    const presentCats = catOrder.filter(c=>deck.some(d=>d.cat===c));
    const catRows = [{key:'all', label:'All instruments', n:deck.length}]
      .concat(presentCats.map(c=>({key:c, label:tagLabel[c], n:deck.filter(d=>d.cat===c).length})));
    const catBtns = catRows.map(c=>`<button class="hs-cat${hs.cat===c.key?' on':''}" data-cat="${c.key}" onclick="App.homeCat('${c.key}')"><span>${c.label}</span><span class="hs-cat-n">${c.n}</span></button>`).join('');
    const searchIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const warnIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    const carIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="8" height="16" rx="1.5"/><path d="M4 7v10"/><path d="M20 7v10"/></svg>`;
    const gridIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;

    document.getElementById('view-home').innerHTML = `
      <div class="home-shell">
        <aside class="home-side">
          <label class="hs-search">
            ${searchIcon}
            <input id="homeSearch" type="search" placeholder="Search instruments…" value="${this.esc(hs.q)}" oninput="App.homeSearch(this.value)" autocomplete="off" aria-label="Search instruments">
          </label>
          <nav class="hs-cats" id="hsCats" aria-label="Categories">${catBtns}</nav>
          <div class="hs-tools">
            <div class="cf-viewtog" role="group" aria-label="Layout">
              <button class="cf-tog${hs.view==='carousel'?' on':''}" id="hsTogCar" onclick="App.homeView('carousel')" title="Carousel view" aria-label="Carousel view">${carIcon}</button>
              <button class="cf-tog${hs.view==='grid'?' on':''}" id="hsTogGrid" onclick="App.homeView('grid')" title="Grid view" aria-label="Grid view">${gridIcon}</button>
            </div>
            <span class="hs-total" id="hsTotal"></span>
          </div>
          <details class="hs-note">
            <summary>${warnIcon}<span>Screening supplements, not diagnostic instruments</span></summary>
            <p>Scores indicate the presence of traits and must always be interpreted by a qualified clinician within a full assessment. No single score confirms or excludes a diagnosis.</p>
          </details>
        </aside>
        <section class="home-main" id="homeDeck"></section>
      </div>
      <footer class="home-foot">
        <button class="norms-link" onclick="App.openNorms()">
          ${listIcon}<b>Norms reference</b>
          <small>every embedded cut-off, mean and percentile, for checking against source</small>
        </button>
      </footer>`;
    // The app's name lives in the topbar's centred title slot rather than in a
    // page heading, so the shell keeps that vertical space for the library. The
    // online console owns this same element for its section titles, so only set
    // it when this local home is the one being mounted. results.js also mounts
    // this home on every page load, online included, so without the mode check
    // the hosted app showed this name in its topbar while it loaded.
    const at = document.getElementById('cc-apptitle');
    if(at && (typeof CONFIG === 'undefined' || CONFIG.resolvedMode !== 'online')) at.textContent = 'Clinical Supplement Suite';
    this.renderDeck(true);
  },

  /* Play a one-shot entrance class, then strip it once the stagger window has
     passed. The entrance animations use fill-mode `both`, which holds an element
     at opacity 0 until its delay elapses, so removing the class afterwards makes
     the motion purely additive: if an animation is ever throttled or never runs
     (background tab, reduced-motion, an old engine), the content is still there
     at its natural, visible state rather than stuck invisible. */
  _playIn(el, cls, ms){
    if(!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el._playInT);
    el._playInT = setTimeout(()=>el.classList.remove(cls), ms);
  },

  /* ---------- home deck (right pane: carousel or grid) ---------- */
  /* Repaints only the deck pane so typing in the search box never rebuilds
     (and therefore never blurs) the input itself.
     `anim` plays the entrance: passed for the deliberate moves (opening the
     library, picking a category, switching layout) but NOT for search typing,
     where re-animating on every keystroke would strobe. */
  renderDeck(anim){
    const hs = this._home, ic = this._ic;
    const box = document.getElementById('homeDeck'); if(!box) return;
    if(anim) this._playIn(box, 'deck-in', 950);
    const q = (hs.q||'').trim().toLowerCase();
    const match = d => {
      if(hs.cat!=='all' && d.cat!==hs.cat) return false;
      if(!q) return true;
      const hay = d.kind==='family'
        ? [d.f.name, d.f.fullName, d.f.desc].concat(d.members.map(m=>m.name+' '+m.fullName)).join(' ')
        : [d.t.name, d.t.fullName, d.t.description].join(' ');
      return hay.toLowerCase().includes(q);
    };
    const shown = this._shown = this._deck.filter(match);
    if(hs.idx >= shown.length) hs.idx = 0;
    if(hs.sel){ this._captureInlineClient(); hs.sel = null; }   // repaint drops the inline panel

    const tot = document.getElementById('hsTotal');
    if(tot) tot.textContent = q ? `${shown.length} ${shown.length===1?'match':'matches'}` : `${shown.length} instruments`;
    document.querySelectorAll('.hs-cat').forEach(b=>b.classList.toggle('on', b.dataset.cat===hs.cat));
    const tc = document.getElementById('hsTogCar'), tg = document.getElementById('hsTogGrid');
    if(tc) tc.classList.toggle('on', hs.view==='carousel');
    if(tg) tg.classList.toggle('on', hs.view==='grid');

    if(!shown.length){
      box.innerHTML = `<div class="hs-empty"><p>No instruments match “${this.esc(hs.q)}”.</p><button class="cf-chip" onclick="App.homeSearchClear()">Clear search</button></div>`;
      return;
    }
    if(hs.view==='grid'){
      box.innerHTML = `<div class="grid">${shown.map(d=>d.kind==='family'?this.familyCardHtml(d.f,d.members,ic):this.testCardHtml(d.t,ic)).join('')}</div>`;
      // stagger index for the tile entrance; capped so a long library doesn't
      // leave the last tiles waiting
      box.querySelectorAll('.grid>*').forEach((el,i)=>el.style.setProperty('--i', Math.min(i,14)));
      return;
    }
    const chevU = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
    const chevD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    box.innerHTML = `<div class="cf-split" id="cfSplit">
      <div class="cf-deckcol">
        <div class="cf-vwrap">
          <button class="cf-nav cf-nav-up" onclick="App.cfGo(-1)" aria-label="Previous instrument">${chevU}</button>
          <div class="cf-stage" id="cfStage">
            <div class="cf-track">${shown.map((d,i)=>this.cfCardHtml(d,i,ic)).join('')}</div>
          </div>
          <button class="cf-nav cf-nav-down" onclick="App.cfGo(1)" aria-label="Next instrument">${chevD}</button>
        </div>
        <p class="cf-count" id="cfCount"></p>
      </div>
      <aside class="cf-intake" id="cfIntake" hidden></aside>
    </div>`;
    this.cfLayout();
    this._cfBind();
  },
  homeCat(c){ const hs=this._home; hs.cat=c; hs.idx=0; this.renderDeck(true); },
  homeView(v){ if(this._home.view!==v){ this._home.view=v; this.renderDeck(true); } },
  homeSearch(v){ const hs=this._home; hs.q=v; hs.idx=0; this.renderDeck(); },
  homeSearchClear(){ this._home.q=''; const i=document.getElementById('homeSearch'); if(i){ i.value=''; i.focus(); } this.renderDeck(); },

  /* one carousel card; same content as the grid tile, sized for the deck */
  cfCardHtml(d, i, ic){
    const layersIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
    if(d.kind==='family'){
      const f = d.f;
      return `<button class="cfc cf-cat-${f.category}" id="cfc-${i}" onclick="App.cfClick(${i})">
        <span class="cfc-bar"></span>
        <span class="cfc-in">
          <span class="cfc-head"><span class="card-tag ${ic.tagClass[f.category]}">${ic.tagLabel[f.category]}</span><span class="cfc-head-r">${App.familyVerifiedBadge(d.members)}<span class="card-versions">${d.members.length} versions</span></span></span>
          <span class="cfc-name">${f.name}</span>
          <span class="cfc-full">${f.fullName}</span>
          <span class="cfc-desc">${f.desc}</span>
          <span class="cfc-meta"><span>${ic.personIcon}${f.foot}</span><span>${layersIcon}${f.sub}</span></span>
          ${App.familyAgePill(f)}
          <span class="cfc-cta">Choose a version</span>
        </span>
      </button>`;
    }
    const t = d.t, disabled = t.status!=='live', itemCount = t.items ? t.items.length : '—';
    return `<button class="cfc cf-cat-${t.category}${disabled?' is-soon':''}" id="cfc-${i}" onclick="App.cfClick(${i})" ${disabled?'aria-disabled="true"':''}>
      <span class="cfc-bar"></span>
      <span class="cfc-in">
        <span class="cfc-head"><span class="card-tag ${ic.tagClass[t.category]}">${ic.tagLabel[t.category]}</span>${disabled?'<span class="card-soon">Coming soon</span>':App.verifiedBadge(t)+App.unverifiedBadge(t)}</span>
        <span class="cfc-name">${t.name}</span>
        <span class="cfc-full">${t.fullName}</span>
        <span class="cfc-desc">${t.description}</span>
        <span class="cfc-meta"><span>${ic.personIcon}${t.respondent}</span>${t.items?`<span>${ic.listIcon}${itemCount} items</span>`:""}<span>${ic.clockIcon}${t.estMinutes}</span></span>
        ${App.cardAgePill(t)}
        <span class="cfc-cta">${disabled?'Coming soon':'Open instrument'}</span>
      </span>
    </button>`;
  },

  /* Position every card relative to the focused index as a vertical 3D wheel.
     Offsets wrap around the ring (shortest signed distance) so advancing past
     the last item flows straight into the first with no jump-back; a card that
     the deck runs top-to-bottom and stops at each end (no wrap-around). */
  cfLayout(){
    const hs = this._home, items = this._shown||[];
    const stage = document.getElementById('cfStage'); if(!stage || !items.length) return;
    const n = items.length;
    const mobile = window.innerWidth < 640;
    const step = mobile ? 112 : (window.innerWidth >= 980 ? 150 : 128);
    const win = mobile ? 2 : 3;
    items.forEach((d,i)=>{
      const el = document.getElementById('cfc-'+i); if(!el) return;
      const o = i - hs.idx, ab = Math.abs(o);
      const rot = o===0 ? 0 : (o<0?1:-1)*Math.min(20, 9+(ab-1)*5);
      const sc  = o===0 ? 1 : Math.max(.62, .86-(ab-1)*.09);
      el.style.transform = `translateY(${o*step}px) translateZ(${-ab*70}px) rotateX(${rot}deg) scale(${sc})`;
      el.style.zIndex = String(100-ab);
      el.style.opacity = ab>win ? '0' : (ab===win ? '.4' : '1');
      el.style.pointerEvents = ab>win ? 'none' : 'auto';
      el.tabIndex = o===0 ? 0 : -1;
      el.classList.toggle('on', o===0);
    });
    const c = document.getElementById('cfCount');
    if(c) c.textContent = `${hs.idx+1} of ${n}`;
    // at the ends there's nowhere further to go: dim + disable the spent arrow
    const up = document.querySelector('.cf-nav-up'), dn = document.querySelector('.cf-nav-down');
    if(up) up.classList.toggle('is-end', hs.idx===0);
    if(dn) dn.classList.toggle('is-end', hs.idx===n-1);
  },
  cfGo(dir){ const n=(this._shown||[]).length; if(!n) return; const hs=this._home; const nx=Math.max(0,Math.min(n-1,hs.idx+dir)); if(nx===hs.idx) return; hs.idx=nx; this.cfLayout(); this._cfSyncIntake(); },
  cfTo(i){ this._home.idx = i; this.cfLayout(); this._cfSyncIntake(); },
  cfClick(i){
    const hs = this._home;
    if(i!==hs.idx){ hs.idx = i; this.cfLayout(); this._cfSyncIntake(); return; }   // side card: bring to centre
    const d = (this._shown||[])[i]; if(!d) return;
    if(d.kind==='family') this.openFamilyChooser(d.key);
    else if(d.t.status==='live'){ this._cfInlineOk() ? this.openTestInline(d.id) : this.openTest(d.id); }
  },

  /* ---------- inline intake (client details beside the carousel) ----------
     On a wide screen, picking a card shifts the wheel left and slides the
     client-details form in on the right; Begin then starts the runner as
     usual. Narrow screens keep the full-page intake. */
  _cfInlineOk(){
    const pane = document.getElementById('homeDeck');
    return !!(this._home && this._home.view==='carousel' && document.getElementById('cfSplit') && pane && pane.clientWidth>=880);
  },
  openTestInline(id){
    const t = REGISTRY[id];
    const box = document.getElementById('cfIntake'), split = document.getElementById('cfSplit');
    if(!t || !box || !split) return this.openTest(id);
    this._captureInlineClient();                     // keep anything already typed
    State.currentTest = t;
    State.answers = {}; State.qIndex = 0; State.result = null;
    this.stopRmetTimer();
    State.rmet = {phase:null, startMs:null, itemShownMs:null, itemTimes:{}, elapsedMs:0, timer:null};
    document.getElementById('view-intake').innerHTML = '';   // f-* ids must exist once only
    box.hidden = false;
    box.innerHTML = `<div class="cf-intake-card">
      <div class="cfi-head">
        <div>
          <div class="cfi-eyebrow">${this.esc(t.fullName)}</div>
          <h2 class="cfi-title">Client details</h2>
        </div>
        <button class="cfi-x" aria-label="Close" onclick="App.closeInlineIntake()">&times;</button>
      </div>
      <p class="cfi-sub">These appear on the report header. All fields are optional and stay in your browser for this session only.</p>
      ${this.intakeFieldsHtml(t, 'inline')}
    </div>`;
    split.classList.add('has-intake');
    this._home.sel = id;
    if(State.client.dob) this.updateIntakeAgeWarn(State.client.dob);
    this._syncToolUrl(id);   // reflect the open tool in the URL (bookmark / share)
  },
  /* fold typed values back into State.client before the panel is replaced */
  _captureInlineClient(){
    const box = document.getElementById('cfIntake');
    const g = i => document.getElementById(i);
    if(!box || box.hidden || !g('f-name') || !box.contains(g('f-name'))) return;
    const c = State.client;
    c.name = g('f-name').value.trim();
    c.dob = g('f-dob').value;
    c.sex = g('f-sex').value;
    const ge = g('f-gender'); if(ge) c.gender = ge.value;
    c.clinician = g('f-clinician').value.trim();
    c.date = g('f-date').value;
    c.ref = g('f-ref').value.trim();
  },
  closeInlineIntake(skipCapture){
    if(!skipCapture) this._captureInlineClient();
    const split = document.getElementById('cfSplit'), box = document.getElementById('cfIntake');
    if(split) split.classList.remove('has-intake');
    if(box){ box.hidden = true; box.innerHTML = ''; }
    if(this._home) this._home.sel = null;
    this._syncToolUrl(null);   // panel closed / deselected: drop the ?tool deep-link
  },
  /* the open panel follows the focused card as the wheel turns */
  _cfSyncIntake(){
    const hs = this._home;
    if(!hs || !hs.sel) return;
    const d = (this._shown||[])[hs.idx];
    if(d && d.kind==='test' && d.t.status==='live'){
      if(d.id!==hs.sel) this.openTestInline(d.id);
    } else if(d && d.kind==='family'){
      // the pane follows the wheel onto a family card too: swap to its versions
      if(hs.sel !== 'fam:'+d.key) this.openFamilyChooser(d.key);
    } else {
      this.closeInlineIntake();
    }
  },
  /* Per-render: mouse wheel + vertical swipe drive the wheel (the stage is rebuilt
     each renderHome). Global once: arrow keys + relayout on resize. */
  _cfBind(){
    const stage = document.getElementById('cfStage'); if(!stage) return;

    // mouse wheel over the stage advances the deck; small deltas accumulate so a
    // single notch = one step, with a short lock so a fast spin doesn't fly.
    let wAcc = 0, wLock = 0;
    stage.addEventListener('wheel', e=>{
      e.preventDefault();
      wAcc += e.deltaY;
      const t = performance.now();
      if(t - wLock < 80) return;
      if(Math.abs(wAcc) < 22) return;
      wLock = t; const dir = wAcc>0 ? 1 : -1; wAcc = 0;
      this.cfGo(dir);
    }, {passive:false});

    let y0 = null;
    stage.addEventListener('touchstart', e=>{ y0 = e.touches[0].clientY; }, {passive:true});
    stage.addEventListener('touchmove', e=>{ if(y0!=null) e.preventDefault(); }, {passive:false});
    stage.addEventListener('touchend', e=>{
      if(y0==null) return;
      const dy = e.changedTouches[0].clientY - y0; y0 = null;
      if(Math.abs(dy)>36) this.cfGo(dy<0?1:-1);
    }, {passive:true});

    if(this._cfGlobalsOn) return; this._cfGlobalsOn = true;
    document.addEventListener('keydown', e=>{
      const k = e.key;
      if(k!=='ArrowUp' && k!=='ArrowDown' && k!=='ArrowLeft' && k!=='ArrowRight' && k!=='Escape') return;
      const home = document.getElementById('view-home');
      if(!home || !home.classList.contains('active') || !document.getElementById('cfStage')) return;
      const m = document.getElementById('modalRoot');
      if(m && m.classList.contains('show')) return;
      if(k==='Escape'){ if(this._home && this._home.sel) this.closeInlineIntake(); return; }
      const tg = (e.target.tagName||'').toLowerCase();
      if(tg==='input' || tg==='textarea' || tg==='select') return;
      e.preventDefault();
      this.cfGo((k==='ArrowUp'||k==='ArrowLeft') ? -1 : 1);
    });
    window.addEventListener('resize', ()=>{ if(document.getElementById('cfStage')) this.cfLayout(); });
  },

  /* "Verified against source" badge — shown when an instrument's data has been
     checked against its authoritative publication (registry `verified` field). */
  verifiedBadge(t){
    if(!t || !t.verified) return '';
    const note = (typeof t.verified==='object' && t.verified.note)
      ? t.verified.note
      : 'Instrument data checked against the source publication';
    return `<span class="card-verified" title="${this.esc(note)}">${this._ic.checkIcon}Verified</span>`;
  },
  /* Family tile badge: shown only when EVERY version in the family is verified. */
  familyVerifiedBadge(members){
    if(!members || !members.length || !members.every(m=>m && m.verified)) return '';
    return `<span class="card-verified" title="All versions verified against source">${this._ic.checkIcon}Verified</span>`;
  },
  /* "Unverified" caution flag — opt-in via the registry `unverified` field, for
     instruments with provisional/inferred data not yet confirmed against a source. */
  unverifiedBadge(t){
    if(!t || !t.unverified) return '';
    const note = (typeof t.unverified==='object' && t.unverified.note)
      ? t.unverified.note
      : 'Contains provisional data not yet confirmed against an authoritative source';
    const warn = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    return `<span class="card-unverified" title="${this.esc(note)}">${warn}Unverified</span>`;
  },

  /* a single test card */
  testCardHtml(t, ic){
    const disabled = t.status!=='live';
    const itemCount = t.items ? t.items.length : '—';
    return `
      <button class="card" ${disabled?'disabled aria-disabled="true"':`onclick="App.openTest('${t.id}')"`}>
        <div class="card-top">
          <span class="card-tag ${ic.tagClass[t.category]}">${ic.tagLabel[t.category]}</span>
          ${disabled?'<span class="card-soon">Coming soon</span>':App.verifiedBadge(t)+App.unverifiedBadge(t)}
        </div>
        <h3>${t.name}</h3>
        <div class="card-full">${t.fullName}</div>
        <div class="card-desc">${t.description}</div>
        <div class="card-foot">
          <span>${ic.personIcon}${t.respondent}</span>
          ${t.items?`<span>${ic.listIcon}${itemCount} items</span>`:""}
          <span>${ic.clockIcon}${t.estMinutes}</span>
        </div>
        ${App.cardAgePill(t)}
      </button>`;
  },

  /* one tile representing a family (AQ / Vanderbilt / SDQ); click opens a version chooser */
  familyCardHtml(f, members, ic){
    const layersIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
    const arrowIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    return `
      <button class="card card-family" onclick="App.openFamilyChooser('${f.key}')">
        <div class="card-top">
          <span class="card-tag ${ic.tagClass[f.category]}">${ic.tagLabel[f.category]}</span>
          <span class="cfc-head-r">${App.familyVerifiedBadge(members)}<span class="card-versions">${members.length} versions</span></span>
        </div>
        <h3>${f.name}</h3>
        <div class="card-full">${f.fullName}</div>
        <div class="card-desc">${f.desc}</div>
        <div class="card-foot">
          <span>${ic.personIcon}${f.foot}</span>
          <span>${layersIcon}${f.sub}</span>
        </div>
        ${App.familyAgePill(f)}
        <div class="card-cta">Choose a version ${arrowIcon}</div>
      </button>`;
  },

  /* ---------- version chooser (modal) ---------- */
  openFamilyChooser(key){
    const fam = FAMILIES.find(f=>f.key===key);
    if(!fam) return;
    const ids = fam.ids.filter(id=>REGISTRY[id]);
    const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    const rows = ids.map((id,ri)=>{
      const t = REGISTRY[id];
      // prefer an explicit short form label (e.g. "Adult (self-report)"); else
      // strip the family name off the instrument name ("ASRS v1.1" → "v1.1")
      const label = t.formLabel || t.name.replace(fam.name+', ','').replace(fam.name+' ','');
      const nItems = (t.items&&t.items.length) ? ` · ${t.items.length} items` : '';
      return `<button class="chooser-row" style="--i:${ri}" onclick="App.chooseVersion('${id}')">
        <span class="chooser-main"><span class="chooser-name">${label}${App.verifiedBadge(t)}${App.unverifiedBadge(t)}</span><span class="chooser-sub">${t.fullName}</span><span class="chooser-sub">${t.respondent} · ${t.ageRange}${nItems}</span></span>
        ${arrow}
      </button>`;
    }).join('');
    // Wide carousel: show the versions in the right-hand pane, the same place the
    // client details land, so picking a version is one continuous move in one spot
    // rather than a modal that covers the deck. Narrow screens / grid view keep
    // the modal (there is no pane to put it in).
    const box = document.getElementById('cfIntake'), split = document.getElementById('cfSplit');
    if(this._cfInlineOk() && box && split){
      this._captureInlineClient();     // keep anything already typed in a form we're replacing
      document.getElementById('view-intake').innerHTML = '';
      box.hidden = false;
      box.innerHTML = `<div class="cf-intake-card">
        <div class="cfi-head">
          <div>
            <div class="cfi-eyebrow">${this.esc(fam.fullName)}</div>
            <h2 class="cfi-title">Choose a version</h2>
          </div>
          <button class="cfi-x" aria-label="Close" onclick="App.closeInlineIntake()">&times;</button>
        </div>
        <p class="cfi-sub">Each version is matched to a different respondent and age range.</p>
        <div class="chooser-list">${rows}</div>
      </div>`;
      split.classList.add('has-intake');
      this._playIn(box.querySelector('.chooser-list'), 'rows-in', 700);
      this._home.sel = 'fam:'+key;      // the pane is showing this family, not a test
      this._syncToolUrl(null);          // no single instrument is open yet
      return;
    }
    this.showModal(`
      <button class="modal-close" aria-label="Close" onclick="App.closeModal()">&times;</button>
      <div class="modal-eyebrow">${fam.fullName}</div>
      <h2 class="modal-title">Choose a version</h2>
      <p class="modal-sub">Each version is matched to a different respondent and age range.</p>
      <div class="chooser-list">${rows}</div>`);
    this._playIn(document.querySelector('#modalRoot .chooser-list'), 'rows-in', 700);
  },
  chooseVersion(id){ this.closeModal(); if(this._cfInlineOk()) this.openTestInline(id); else this.openTest(id); },

  /* ---------- lightweight modal ---------- */
  showModal(html){
    let m = document.getElementById('modalRoot');
    if(!m){ m = document.createElement('div'); m.id = 'modalRoot'; document.body.appendChild(m); }
    m.innerHTML = `<div class="modal-backdrop" onclick="App.closeModal()"></div><div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    m.classList.add('show');
    document.addEventListener('keydown', this._modalEsc);
  },
  closeModal(){
    const m = document.getElementById('modalRoot');
    if(m){ m.classList.remove('show'); m.innerHTML = ''; }
    document.removeEventListener('keydown', this._modalEsc);
  },
  _modalEsc(e){ if(e.key==='Escape') App.closeModal(); },

  /* ---------- OPEN TEST -> INTAKE ---------- */
  openTest(id){
    if(!REGISTRY[id]) return this.go('home');   // guard a bad/removed/filtered id (e.g. a stale ?tool= deep link)
    State.currentTest = REGISTRY[id];
    State.answers = {};
    State.qIndex = 0;
    State.result = null;
    this.stopRmetTimer();
    State.rmet = {phase:null, startMs:null, itemShownMs:null, itemTimes:{}, elapsedMs:0, timer:null};
    this.renderIntake();
    this.go('intake');
    this._syncToolUrl(id);   // reflect the open tool in the URL (bookmark / share)
  },

  /* The client-details fields, shared by the full intake page and the inline
     panel beside the carousel so the two can never drift apart. startRunner()
     reads these inputs by id, so only one copy may exist in the DOM at a time. */
  intakeFieldsHtml(t, mode){
    const c = State.client;
    const today = new Date().toISOString().slice(0,10);
    const needsSex = (t.norms && t.norms.some && t.norms.some(n=>n.sex)) || t.id==='aq_child' || t.id==='aq_adolescent' || t.id==='aq_adult' || (t.scoring && t.scoring.type==='sdq' && t.norms) || (t.scoring && (t.scoring.type==='rcads' || t.scoring.type==='rcads25'));
    const needsGender = t.id==='cati' || t.id==='catq';   // CATI and CAT-Q norms are matched by gender identity
    const gSel = (v) => `<option value="${v}"${c.gender===v?' selected':''}>`;
    const cancel = mode==='inline' ? "App.closeInlineIntake()" : "App.go('home')";
    return `
      <div id="intakeAgeWarn"></div>

      <div class="field">
        <label for="f-name">Client name or identifier <span class="opt">(optional)</span></label>
        <input id="f-name" type="text" value="${this.esc(c.name)}" placeholder="e.g. J.D. or initials" autocomplete="off">
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-dob">Date of birth <span class="opt">(optional)</span></label>
          <input id="f-dob" type="date" value="${c.dob}" oninput="App.updateIntakeAgeWarn(this.value)">
        </div>
        <div class="field">
          <label for="f-sex">Sex ${needsSex?'<span class="opt">(used for norms)</span>':'<span class="opt">(optional)</span>'}</label>
          <select id="f-sex">
            <option value="">Not specified</option>
            <option value="male" ${c.sex==='male'?'selected':''}>Male</option>
            <option value="female" ${c.sex==='female'?'selected':''}>Female</option>
            <option value="intersex" ${c.sex==='intersex'?'selected':''}>Intersex</option>
          </select>
        </div>
      </div>

      ${needsGender?`<div class="field">
        <label for="f-gender">Gender <span class="opt">(used to match ${t.id==='catq'?'CAT-Q':'CATI'} norms)</span></label>
        <select id="f-gender">
          ${gSel('')}Prefer not to say</option>
          ${gSel('man')}Man</option>
          ${gSel('woman')}Woman</option>
          ${gSel('non-binary')}Non-binary</option>
          ${gSel('other')}Other / self-describe</option>
        </select>
      </div>`:''}

      <div class="field-row">
        <div class="field">
          <label for="f-clinician">Clinician <span class="opt">(optional)</span></label>
          <input id="f-clinician" type="text" value="${this.esc(c.clinician)}" placeholder="Your name" autocomplete="off">
        </div>
        <div class="field">
          <label for="f-date">Assessment date</label>
          <input id="f-date" type="date" value="${c.date||today}">
        </div>
      </div>

      <div class="field">
        <label for="f-ref">Reference / case number <span class="opt">(optional)</span></label>
        <input id="f-ref" type="text" value="${this.esc(c.ref)}" placeholder="e.g. case ID" autocomplete="off">
      </div>

      <div class="intake-actions">
        <button class="btn btn-primary btn-lg" onclick="App.startRunner()">
          Begin ${t.name}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
        <button class="btn btn-ghost btn-lg" onclick="${cancel}">Cancel</button>
      </div>`;
  },

  renderIntake(){
    const t = State.currentTest;
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    const backIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
    this.closeInlineIntake(true);   // the f-* ids must exist once only

    document.getElementById('view-intake').innerHTML = `
      <button class="back-link" onclick="App.go('home')">${backIcon} All instruments</button>
      <div class="intake-wrap">
        <div class="intake-layout">
          <div class="intake-intro">
            <div class="eyebrow">${t.fullName}</div>
            <h1 class="page-title">Client details</h1>
            <p class="lede">These appear on the report header. All fields are optional.</p>
            <div class="intake-note">
              ${infoIcon}
              <span>Entered details stay in your browser for this session only. Nothing is uploaded or saved anywhere. Refreshing the page clears them.</span>
            </div>
          </div>

          <div class="intake-card">
            ${this.intakeFieldsHtml(t, 'page')}
          </div>
        </div>
      </div>`;
  },

  /* small age SVGs, shared by the test + family pills */
  _ageIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  _ageWarnIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  _agePill(label, cls, warn){
    if(!label) return '';
    return '<div class="card-age ' + (cls||'card-age-plain') + '">' + (warn?this._ageWarnIcon:this._ageIcon) + ' Age ' + label + '</div>';
  },
  /* Age pill for a single instrument card. Uses the numeric AGE_BOUNDS when we
     have them (so the pill can flag an out-of-range client), and otherwise falls
     back to the registry ageRange string so EVERY card shows an age. */
  cardAgePill(t){
    const b = AGE_BOUNDS[t.id];
    const label = b ? b.label : (t.ageRange || '');
    if(!label) return '';
    const clientAge = (State.client.dob && State.client.date) ? this.calcAge(State.client.dob, State.client.date) : null;
    let cls = 'card-age-plain', warn = false;
    if(b && clientAge != null){
      const inRange = clientAge >= b.min && (b.max == null || clientAge <= b.max);
      cls = inRange ? 'card-age-ok' : 'card-age-warn';
      warn = !inRange;
    }
    return this._agePill(label, cls, warn);
  },
  /* Age span for a family tile (its versions cover a range); label lives on the
     FAMILIES entry so it stays concise and correct. */
  familyAgePill(f){ return this._agePill(f && f.ages, 'card-age-plain', false); },

    updateIntakeAgeWarn(dob){
    const el = document.getElementById('intakeAgeWarn');
    if(!el) return;
    const t = State.currentTest;
    const b = AGE_BOUNDS[t.id];
    if(!b || !dob){ el.innerHTML=''; return; }
    const today = new Date().toISOString().slice(0,10);
    const age = this.calcAge(dob, today);
    if(age==null){ el.innerHTML=''; return; }
    const inRange = age>=b.min && (b.max==null||age<=b.max);
    const warnSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    const okSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    if(inRange){
      el.innerHTML = '<div class="age-warning" style="background:var(--green-wash);border-color:#c3dfc6">'
        + '<span style="color:var(--green);flex-shrink:0;margin-top:1px;width:18px;height:18px">' + okSvg + '</span>'
        + '<span><b style="color:var(--green);display:block;margin-bottom:3px">Age in validated range</b>'
        + 'Age ' + age + ' is within the validated range for this instrument (' + b.label + ').</span></div>';
    } else {
      el.innerHTML = '<div class="age-warning">'
        + '<span style="flex-shrink:0;margin-top:1px;width:18px;height:18px;color:var(--amber)">' + warnSvg + '</span>'
        + '<span><b>Age outside validated range</b>'
        + 'Age ' + age + ' is outside the validated range for this instrument (' + b.label + '). '
        + b.note + '. You may still proceed, but interpret results with additional caution.</span></div>';
    }
  },

  /* ---------- ASSIST (branching substance screen) ----------------------------
     Phase 1 is a lifetime-use grid (Q1) that gates everything. On Continue we
     generate a plain linear item list (Q2–Q7 for each substance ticked, with a
     per-substance transition card) and hand it to the ordinary questionnaire
     runner — so progress, auto-advance, back/next and scoring all work unchanged.
  --------------------------------------------------------------------------- */
  startAssist(){
    const t = REGISTRY.assist;
    State.assistLifetime = {};
    for(const s of t.substances) State.assistLifetime[s.key] = false;
    State.answers = {};
    this.renderAssistGrid();
    this.go('runner');
    this.updateTopMeta();
  },
  renderAssistGrid(){
    const t = REGISTRY.assist;
    const backIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
    const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    const chips = t.substances.map(s=>{
      const on = !!State.assistLifetime[s.key];
      return `<button type="button" class="asst-chip ${on?'on':''}" data-k="${s.key}" onclick="App.assistToggle('${s.key}')">
        <span class="asst-chip-check" aria-hidden="true"></span>
        <span class="asst-chip-body"><span class="asst-chip-name">${this.esc(s.label)}</span><span class="asst-chip-eg">${this.esc(s.examples)}</span></span>
      </button>`;
    }).join('');
    document.getElementById('view-runner').innerHTML = `
      <div class="runner">
        <div class="runner-head">${this._runnerTop(t)}</div>
        <div class="asst-q1">
          <h1 class="asst-q1-title">${this.esc(t.lifetimePrompt)}</h1>
          <p class="asst-q1-reassure">${this.esc(t.lifetimeReassure)}</p>
          <div class="asst-chips">${chips}</div>
        </div>
        <div class="runner-nav asst-nav">
          <div></div><div></div>
          <button class="btn btn-primary" id="asstContinue" onclick="App.assistContinue()">Continue ${arrow}</button>
        </div>
      </div>`;
    this._assistUpdateContinue();
  },
  assistToggle(k){
    State.assistLifetime[k] = !State.assistLifetime[k];
    const btn = document.querySelector('.asst-chip[data-k="'+k+'"]');
    if(btn) btn.classList.toggle('on', State.assistLifetime[k]);
    this._assistUpdateContinue();
  },
  _assistUpdateContinue(){
    const any = Object.values(State.assistLifetime||{}).some(Boolean);
    const b = document.getElementById('asstContinue');
    if(!b) return;
    const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    b.innerHTML = (any ? 'Continue' : 'I haven’t used any of these') + ' ' + arrow;
  },
  /* build the linear Q2–Q7 item list for the substances ticked at Q1 */
  _assistBuildItems(used){
    const t = REGISTRY.assist;
    const items = [];
    used.forEach((s, idx)=>{
      const low = s.label.toLowerCase();
      const qs = t.questions.filter(q => !((s.skip||[]).includes(q.key)));   // tobacco skips Q5
      qs.forEach((q, qi)=>{
        const item = { n:s.key+'_'+q.key, optionSet:q.set, sectionKey:s.key,
          text:q.text.replace('{S}', low) };
        // WHO ASSIST v3.0 / NIDA-Modified ASSIST: Q3-Q5 are asked only for a
        // substance used in the past 3 months, so they are skipped (scored 0)
        // when Q2 for that substance is "Never".
        if(q.key==='q3' || q.key==='q4' || q.key==='q5') item.skipIfNever = s.key+'_q2';
        if(qi===0){
          item.sectionIntro = {
            tag:`Substance ${idx+1} of ${used.length}`,
            title:`About your ${low} use`,
            blurb:`The next ${qs.length} questions are only about ${low} (${s.examples}). Please answer for ${low} specifically.`
          };
        }
        items.push(item);
      });
    });
    return items;
  },
  assistContinue(){
    const t = REGISTRY.assist;
    const lifetime = Object.assign({}, State.assistLifetime);
    const used = t.substances.filter(s=>lifetime[s.key]);
    const run = Object.assign({}, t, { items:this._assistBuildItems(used), _lifetime:lifetime });
    State.currentTest = run;
    State.answers = { _lifetime: lifetime };
    State.qIndex = 0;
    State.sectionsSeen = {}; State.sectionIntroShown = false;
    if(!used.length){
      // nothing ever used → score straight to a "no use reported" result
      State.result = Scoring.run(run, State.answers);
      State.result.missing = 0;
      return this.completeAssessment();
    }
    this.renderRunner('none');
    this.updateTopMeta();
  },

  startRunner(){
    const c = State.client;
    // intake form is only present in the clinician flow; the patient flow pre-fills
    // State.client from their saved profile and skips it
    if(document.getElementById('f-name')){
      c.name = document.getElementById('f-name').value.trim();
      c.dob = document.getElementById('f-dob').value;
      c.sex = document.getElementById('f-sex').value;
      { const gEl = document.getElementById('f-gender'); if(gEl) c.gender = gEl.value; }
      c.clinician = document.getElementById('f-clinician').value.trim();
      c.date = document.getElementById('f-date').value;
      c.ref = document.getElementById('f-ref').value.trim();
    }
    if(!c.name){ c.name = 'Unnamed client'; }
    State.answers = {};
    State.itemNotes = {};
    State.qIndex = 0;
    State.sectionsSeen = {}; State.sectionIntroShown = false;
    clearTimeout(State.advanceTimer); State.advanceTimer = null;
    // bespoke clinician modules run their own UIs, not the questionnaire runner
    // (same routing as startPatientTest)
    const tid = State.currentTest.id;
    if(tid==='referral'){ if(typeof Referral!=='undefined'){ return Referral.start(); } alert('The referral form isn’t available in this build.'); return; }
    if(tid==='diva' || tid==='young_diva'){ if(typeof Diva!=='undefined'){ return Diva.start(tid); } alert('The DIVA interview isn’t available in this build.'); return; }
    if(tid==='dasi'){ if(typeof Dasi!=='undefined'){ return Dasi.start(); } alert('The DASI-2 isn’t available in this build.'); return; }
    if(tid==='adir'){ if(typeof Adir!=='undefined'){ return Adir.start(); } alert('The ADI-R scoring isn’t available in this build.'); return; }
    if(tid==='adirw'){ if(typeof Adirw!=='undefined'){ return Adirw.start(); } alert('The ADI-R workspace isn’t available in this build.'); return; }
    if(tid==='ados_m4'){ if(typeof Ados!=='undefined'){ return Ados.start(); } alert('The ADOS-2 scoring isn’t available in this build.'); return; }
    if(State.currentTest.format==='assist'){ return this.startAssist(); }
    if(State.currentTest.format==='image'){
      // RMET begins on the practice item; the stopwatch starts at the first real item
      State.rmet = {phase:'practice', startMs:null, itemShownMs:null, itemTimes:{}, elapsedMs:0, timer:null};
      this.renderRmetRunner('none');
    } else {
      this.renderRunner('none');
    }
    this.go('runner');
    this.updateTopMeta();
    this._armBackGuard();
  },
  /* Guard the browser Back button during an assessment so a patient can't leave
     the site (and lose progress) by accident. We push a history sentinel; on Back,
     we re-push it (staying put) and route through the normal exit confirm instead
     of navigating away. */
  _armBackGuard(exitFn){
    // _backExit = the exit-confirm to run on Back (questionnaire runner → confirmExit;
    // intake form → Referral.exit). Cleared when we leave the runner view.
    this._backExit = exitFn || (()=>this.confirmExit());
    if(!this._navBound){
      this._navBound = true;
      window.addEventListener('popstate', ()=>{
        if(this._backExit){ try{ history.pushState({r:1}, ''); }catch(_){} this._backExit(); }
      });
    }
    try{ history.pushState({r:1}, ''); }catch(_){}
  },

  /* ---------- RUNNER ----------------------------------------------------------
     The runner shell (header, progress, question stage, nav) is mounted ONCE by
     renderRunner(). Moving between questions calls showQuestion(), which swaps
     only the inner question card + chrome in place — the page height stays fixed
     and scroll position never moves, so there is no reload/jump-to-top. Answering
     a question auto-advances after a brief highlight beat.
  --------------------------------------------------------------------------- */
  renderRunner(anim){
    const t = State.currentTest;
    if(t.format==='image') return this.renderRmetRunner(anim);
    if(this._sectionIntroPending(t)) return this._renderSectionIntro(t);
    const i = State.qIndex;
    const animClass = anim==='next'?'q-anim-next':anim==='prev'?'q-anim-prev':'';
    const backIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
    // an informant working through a multi-questionnaire link gets a position
    // marker so the sequence never feels endless (advanceInformant flips
    // completed before the next runner mounts, so the count stays accurate)
    let infCtx = '';
    if(typeof Online !== 'undefined' && Online.informantFor && Online.informantFor.v2){
      const seq = (Online.informantFor.tests||[]).filter(x=>REGISTRY[x.test_id]);
      if(seq.length>1) infCtx = `<div class="runner-ctx">Questionnaire ${seq.filter(x=>x.completed).length+1} of ${seq.length}</div>`;
    }

    document.getElementById('view-runner').innerHTML = `
      <div class="runner">
        <div class="runner-head">
          ${infCtx}${this._runnerTop(t)}
          <div class="progress-track"><div class="progress-fill"></div></div>
          <div class="progress-label"></div>
        </div>

        <div class="q-stage">
          <div class="q-card ${animClass}" id="qCard">${this.qCardInner(t, i)}</div>
        </div>

        <div class="unanswered-hint" id="unansweredHint">Please choose a response to continue.</div>

        <div class="runner-nav" id="runnerNav">${this.navInner(t, i)}</div>
      </div>`;
    this.paintProgress(t);
    this._lockCardHeight();
    this._cvDone = false;
    this.syncClientView();
  },

  /* Questions differ in length (a third wrapped line, a stem on some items), and
     Back/Next sit under the card, so each swap shoved the buttons up or down while
     the new card was still fading in. Measure every item once at this width and
     reserve the tallest, so the card box and the buttons stay put. Each item is
     measured plain and with its answers in the bold "selected" style, since a
     chosen answer can wrap onto an extra line. Re-measured when the runner view is
     shown (it is built while hidden, when every height reads 0), on resize, and
     whenever a web font finishes loading (the patient fonts load on demand, and a
     late font changes the wrapping). */
  _lockCardHeight(){
    const card = document.getElementById('qCard'), t = State.currentTest;
    if(!card || !t || t.format==='image' || !t.items) return;
    if(!card.getClientRects().length) return;   // view hidden; go('runner') measures on show
    const probe = document.createElement('div');
    probe.className = 'q-card';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:0;right:0;top:0;visibility:hidden;pointer-events:none;animation:none';
    card.parentNode.appendChild(probe);
    let max = 0;
    for(let i=0; i<t.items.length; i++){
      probe.innerHTML = this.qCardInner(t, i);
      max = Math.max(max, probe.getBoundingClientRect().height);
      probe.querySelectorAll('.opt-btn').forEach(b=>b.classList.add('selected'));
      max = Math.max(max, probe.getBoundingClientRect().height);
    }
    probe.remove();
    if(max) card.style.minHeight = Math.ceil(max)+'px';
    if(!this._cardLockBound){
      this._cardLockBound = true;
      let rt = null;
      const again = ()=>{ clearTimeout(rt); rt = setTimeout(()=>this._lockCardHeight(), 120); };
      window.addEventListener('resize', again);
      if(document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', again);
    }
  },

  /* Do this test's answers run long? The Y-BOCS anchors reach 170 to 190 characters
     (every other questionnaire stays under 80), so on a phone a Y-BOCS item cannot fit
     one screen at the standard option size. Flagged per test, not per item, so every
     item of the test keeps the same option style. The CSS acts on it only on a phone. */
  _longOptions(t){
    const sets = t.scoring.optionSets ? Object.values(t.scoring.optionSets) : [t.scoring.options || []];
    return sets.some(s=>s.some(o=>String(o.label||'').length > 100));
  },
  /* inner HTML of the question card (number + text + answer options) */
  qCardInner(t, i, forClient){
    const item = t.items[i];
    const total = t.items.length;
    const keys = ['1','2','3','4','5','6','7'];   // numeric labels — match the keyboard shortcuts
    // item.n is numeric for most tests but a string id for ASSIST (e.g. "cannabis_freq").
    // Quote string ids so the inline onclick is valid JS — a bare id would throw and the
    // click would do nothing (keyboard shortcuts call answer() directly, so they still work).
    const nArg = (typeof item.n === 'number') ? item.n : `'${item.n}'`;
    let optsHtml = '';
    if(item.optionSet && t.scoring.optionSets){
      // per-item response set (e.g. Vanderbilt symptom 0–3 vs performance 1–5); store the VALUE
      const opts = t.scoring.optionSets[item.optionSet];
      let btns = '';
      opts.forEach((o,oi)=>{
        const sel = State.answers[item.n]===o.v ? 'selected':'';
        btns += `<button class="opt-btn likert-btn ${sel}" data-val="${o.v}" onclick="App.answer(${nArg},${o.v})"><span class="opt-key">${keys[oi]}</span><span class="opt-label">${o.label}</span></button>`;
      });
      optsHtml = `<div class="opt-row${this._longOptions(t)?' opt-long':''}" style="--n:${opts.length}">${btns}</div>`;
    } else if(t.scoring.type==='mean'){
      // 1..N horizontal scale with end anchors
      const pts = t.scoring.points;
      let btns = '';
      for(let v=1; v<=pts; v++){
        const sel = State.answers[item.n]===v ? 'selected':'';
        btns += `<button class="opt-btn scale-btn ${sel}" data-val="${v}" onclick="App.answer(${nArg},${v})"><span class="opt-num">${v}</span></button>`;
      }
      optsHtml = `<div class="scale-anchors"><span>${t.scoring.anchorLow}</span><span>${t.scoring.anchorHigh}</span></div>
        <div class="opt-row" style="--n:${pts}">${btns}</div>`;
    } else {
      // horizontal Likert row (one column per response)
      let btns = '';
      t.scoring.options.forEach((o,oi)=>{
        const sel = State.answers[item.n]===oi ? 'selected':'';
        btns += `<button class="opt-btn likert-btn ${sel}" data-val="${oi}" onclick="App.answer(${nArg},${oi})"><span class="opt-key">${keys[oi]}</span><span class="opt-label">${o.label}</span></button>`;
      });
      optsHtml = `<div class="opt-row${this._longOptions(t)?' opt-long':''}" style="--n:${t.scoring.options.length}">${btns}</div>`;
    }
    // the subscale name ("Social Skill", "Inattention") is for the clinician only: the
    // published forms don't show it to respondents, and naming the construct beside
    // each item can colour the answer. Never on the client-view screen either.
    const subName = (this.clinicianRunner() && !forClient && t.subscales && item.subscale) ? (t.subscales[item.subscale]?.name || '') : '';
    const stem = item.prompt || t.prompt || '';
    const frame = item.timeframe ? `<div class="q-frame q-frame-${item.sectionKey||'x'}">${this.esc(item.timeframe)}</div>` : '';
    // Clinician notes: available on every instrument whenever a clinician is
    // driving the runner (see clinicianRunner), never for a patient or informant
    // working through their own link. Collapsed behind a small toggle unless the
    // instrument opts into always-open notes (itemNotes:true, e.g. Coventry) or a
    // note already exists for this item. Opening or focusing the note holds the
    // pending auto-advance (see noteHold), so the flow is: type the note, then
    // click the answer to move on.
    let noteHtml = '';
    if(t.itemNotes || this.clinicianRunner()){
      const nv = (State.itemNotes && State.itemNotes[item.n]) || '';
      const open = !!(t.itemNotes || nv);
      noteHtml = `<div class="q-note${open?'':' q-note-collapsed'}" id="qNote">
        <button type="button" class="q-note-toggle" onclick="App.openNote()">+ Add clinician note</button>
        <div class="q-note-body">
          <label for="q-note-${item.n}">Clinician notes (optional)</label>
          <textarea id="q-note-${item.n}" rows="2" placeholder="${item.note?this.esc(item.note):'e.g. context, how this presents, alternative explanations…'}" onfocus="App.noteHold()" oninput="App.noteFor(${nArg}, this.value)">${this.esc(nv)}</textarea>
        </div>
      </div>`;
    }
    const helpHtml = item.help ? `<details class="q-help" open><summary><span class="q-help-i">ⓘ</span> What counts here?</summary><div class="q-help-body">${this.esc(item.help)}</div></details>` : '';
    return `<div class="q-number">Question ${i+1} of ${total}${subName?` · ${subName}`:''}</div>
            ${frame}
            ${stem ? `<div class="q-stem">${stem}</div>` : ''}
            <div class="q-text">${item.text}</div>
            ${helpHtml}
            ${optsHtml}
            ${noteHtml}`;
  },
  /* Is a CLINICIAN driving this runner (rather than a patient or informant
     working through their own link)? Gates the per-item notes and the client
     view. True for the offline/supplement builds (mode 'local'), and in the
     online console for an administered run (Online.adminFor) or a Test library
     practice run (Online.sandbox). Deliberately FALSE for "Preview as patient
     (demo)", whose whole job is to mirror what the patient actually sees. */
  clinicianRunner(){
    if(typeof Online !== 'undefined'){
      if(Online.demoMode) return false;
      if(Online.adminFor || Online.sandbox) return true;
    }
    return (typeof CONFIG === 'undefined' || CONFIG.resolvedMode !== 'online');
  },
  /* the runner's top line: the questionnaire's name with a small exit link on the same
     row (it used to be a full-width sticky bar above the card, which left a gap on
     phones). Patients and informants see the short name (e.g. "ASRS v1.1"); a
     clinician sees the full one. With save & resume on, leaving loses nothing, so
     the link says so and asks nothing (see confirmExit). */
  _runnerTop(t){
    const nm = this.clinicianRunner() ? t.fullName : (t.name || t.fullName);
    const practice = (typeof Online!=='undefined' && Online.sandbox) ? '<span class="runner-practice" title="Test library practice run: nothing is saved">Practice, not saved</span>' : '';
    return `<div class="runner-top"><div class="test-name">${nm}</div>${practice}${this._cvBtnHtml()}<button type="button" class="runner-exit" onclick="App.confirmExit()">${this.resumeKey()?'Save and exit':'Exit'}</button></div>`;
  },
  noteFor(n, val){ State.itemNotes = State.itemNotes || {}; State.itemNotes[n] = val; },
  /* cancel a pending auto-advance so the clinician can finish a note; the next
     click on an answer (even the same one) moves on */
  noteHold(){ if(State.advanceTimer){ clearTimeout(State.advanceTimer); State.advanceTimer = null; } },
  openNote(){
    this.noteHold();
    const w = document.getElementById('qNote'); if(!w) return;
    w.classList.remove('q-note-collapsed');
    const ta = w.querySelector('textarea'); if(ta) ta.focus();
  },

  /* ---------- CLIENT VIEW (presenter mode) -----------------------------------
     A second, clean window showing only the current question, options and
     progress — no clinician notes, no exit control, and on finish a neutral
     "all done" card instead of the scores. The clinician drags it to a second
     monitor / client-facing screen, or shares just that window on a video call,
     and keeps notes on the main window. The parent scripts the child window
     directly through its handle (works from file:// where BroadcastChannel is
     unreliable); option clicks in the child feed the same App.answer() session.
     Clinician-run (local mode) only. */
  _cvBtnHtml(){
    if(!this.clinicianRunner()) return '';
    const open = this._cw && !this._cw.closed;
    return `<button id="cvBtn" type="button" class="cv-btn no-print" onclick="App.toggleClientView()" title="Opens a second window with just the question and answers, for a shared screen, second monitor or window-share on a video call. Your notes stay on this window only.">${open?'Close client view':'Client view'}</button>`;
  },
  toggleClientView(){
    if(this._cw && !this._cw.closed){ this.closeClientView(); return; }
    const w = window.open('', 'ns_client_view', 'width=980,height=760,popup=yes');
    if(!w){ alert('The browser blocked the client view window. Allow pop-ups for this page and try again.'); return; }
    this._cw = w;
    const doc = w.document;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Assessment</title></head><body><div class="runner cv-runner" id="cvRoot"></div></body></html>');
    doc.close();
    // follow this window's Appearance setting (NMTheme keeps it in step if changed)
    if(document.documentElement.dataset.theme) doc.documentElement.dataset.theme = document.documentElement.dataset.theme;
    // carry the app styles across (inline <style> in the single-file build,
    // <link> stylesheets in the dev build — el.href is already absolute)
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el=>{
      if(el.tagName==='STYLE'){ const s=doc.createElement('style'); s.textContent=el.textContent; doc.head.appendChild(s); }
      else { const l=doc.createElement('link'); l.rel='stylesheet'; l.href=el.href; doc.head.appendChild(l); }
    });
    // answer clicks in the client window drive the same session
    w.App = { answer:(n,v)=>this.answer(n,v) };
    w.addEventListener('unload', ()=>setTimeout(()=>this._paintCvBtn(), 150));
    if(!this._cvCleanupBound){
      this._cvCleanupBound = true;
      window.addEventListener('beforeunload', ()=>this.closeClientView());
    }
    this.syncClientView();
    this._paintCvBtn();
  },
  closeClientView(){
    if(this._cw && !this._cw.closed){ try{ this._cw.close(); }catch(_){} }
    this._cw = null;
    this._paintCvBtn();
  },
  _paintCvBtn(){
    const b = document.getElementById('cvBtn');
    if(b) b.textContent = (this._cw && !this._cw.closed) ? 'Close client view' : 'Client view';
  },
  /* re-render the client window to mirror the current runner state */
  syncClientView(){
    const w = this._cw; if(!w || w.closed) return;
    let doc, root;
    try{ doc = w.document; root = doc.getElementById('cvRoot'); }catch(_){ return; }
    if(!root) return;
    const t = State.currentTest;
    if(!t || t.format==='image'){ root.innerHTML=''; return; }
    const total = t.items.length;
    const answered = Object.keys(State.answers||{}).filter(k=>k[0]!=='_').length;
    const pct = Math.round((answered/total)*100);
    const head = `<div class="runner-head">
      <div class="test-name">${this.esc(t.fullName)}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="progress-label"><span>${answered} of ${total} answered</span><span>${pct}%</span></div>
    </div>`;
    let body;
    if(this._cvDone){
      body = `<div class="section-intro"><h1 class="section-intro-title">All done, thank you</h1><p class="section-intro-blurb">Your responses have been recorded.</p></div>`;
    } else if(State.sectionIntroShown){
      const si = (t.items[State.qIndex] && t.items[State.qIndex].sectionIntro) || {};
      body = `<div class="section-intro">
        ${si.tag?`<div class="section-intro-tag">${this.esc(si.tag)}</div>`:''}
        <h1 class="section-intro-title">${this.esc(si.title||'Next section')}</h1>
        <p class="section-intro-blurb">${this.esc(si.blurb||'')}</p>
      </div>`;
    } else {
      body = `<div class="q-stage"><div class="q-card">${this.qCardInner(t, State.qIndex, true)}</div></div>`;
    }
    root.innerHTML = head + body;
    // never show the clinician note field on the client screen
    const n = doc.getElementById('qNote'); if(n) n.remove();
  },

  /* inner HTML of the nav row (Back · dots · Next/Finish) */
  navInner(t, i){
    const total = t.items.length;
    const isLast = i===total-1;
    const frontier = this.firstUnanswered(t);   // items beyond this are locked until answered in order
    let dots = '';
    for(let d=0; d<total; d++){
      let cls = 'nav-dot';
      if(d===i) cls+=' current';
      else if(State.answers[t.items[d].n]!=null) cls+=' done';
      const locked = d>frontier;
      if(locked) cls+=' locked';
      dots += `<button class="${cls}" ${locked?'disabled':''} onclick="App.jumpTo(${d})" aria-label="Question ${d+1}"></button>`;
    }
    return `
      <button class="btn btn-ghost" onclick="App.prevQ()" ${i===0?'disabled':''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </button>
      <div class="nav-dots">${dots}</div>
      ${isLast
        ? `<button class="btn btn-primary" onclick="App.finish()">${(typeof CONFIG!=='undefined'&&CONFIG.resolvedMode==='online')?'Finish &amp; send':'Finish &amp; score'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>`
        : `<button class="btn btn-primary" onclick="App.nextQ()">Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>`
      }`;
  },

  /* update the progress bar + label in place */
  paintProgress(t){
    // ignore internal book-keeping keys (e.g. ASSIST's _lifetime grid)
    const answered = Object.keys(State.answers).filter(k=>k[0]!=='_').length;
    const total = t.items.length;
    const pct = Math.round((answered/total)*100);
    const fill = document.querySelector('.progress-fill');
    if(fill) fill.style.width = pct+'%';
    const label = document.querySelector('.progress-label');
    if(label) label.innerHTML = `<span>${answered} of ${total} answered</span><span>${pct}%</span>`;
  },

  /* swapping a question replaces the focused option or button, which drops keyboard
     focus to the top of the page (the next Tab then landed on "Save and exit"). If
     focus was in the question or the Back/Next row, park it on the question card
     instead, so the next Tab goes to the first answer. */
  _keepRunnerFocus(card, swap){
    const nav = document.getElementById('runnerNav'), ae = document.activeElement;
    const had = !!ae && ae!==document.body && (card.contains(ae) || (nav && nav.contains(ae)));
    swap();
    if(had){ card.tabIndex = -1; try{ card.focus({preventScroll:true}); }catch(_){} }
  },
  /* swap to a question WITHOUT rebuilding the shell — no scroll jump */
  showQuestion(anim){
    const t = State.currentTest;
    if(this._sectionIntroPending(t)) return this._renderSectionIntro(t);
    const card = document.getElementById('qCard');
    if(!card) return this.renderRunner(anim);   // shell missing — full render
    // restart the slide animation
    card.classList.remove('q-anim-next','q-anim-prev');
    void card.offsetWidth;
    if(anim==='next') card.classList.add('q-anim-next');
    else if(anim==='prev') card.classList.add('q-anim-prev');
    this._keepRunnerFocus(card, ()=>{
      card.innerHTML = this.qCardInner(t, State.qIndex);
      document.getElementById('runnerNav').innerHTML = this.navInner(t, State.qIndex);
    });
    this.paintProgress(t);
    const hint = document.getElementById('unansweredHint');
    if(hint) hint.classList.remove('show');
    this.syncClientView();
  },

  answer(n, val){
    // one advance in flight at a time — ignore rapid extra input so a fast double-press
    // can't re-answer this item and queue a second advance (which would skip the next item)
    if(State.advanceTimer) return;
    const prev = State.answers[n];
    State.answers[n] = val;
    const t = State.currentTest;
    this._applySkips(t, n, val, prev);
    this.saveProgress();
    // highlight the chosen option (by value, so mouse and keyboard share one path)
    document.querySelectorAll('#qCard .opt-btn').forEach(b=>{
      const on = Number(b.dataset.val)===val;
      b.classList.toggle('selected', on);
      // transient commit pulse on the chosen option (restart it if the same
      // option is clicked again, e.g. after a note held the advance)
      if(on){ b.classList.remove('opt-commit'); void b.offsetWidth; b.classList.add('opt-commit'); }
    });
    this.paintProgress(t);
    const hint = document.getElementById('unansweredHint');
    if(hint) hint.classList.remove('show');
    this.syncClientView();   // mirror the selection highlight during the advance beat
    // auto-advance to the next question after a brief beat so the choice registers.
    // (If the clinician opens/focuses the note field during the beat, noteHold()
    // cancels this timer; re-clicking an answer then advances.)
    const ni = this._stepIdx(t, State.qIndex, 1);
    if(ni < t.items.length){
      State.advanceTimer = setTimeout(()=>{ State.advanceTimer = null; State.qIndex = ni; this.showQuestion('next'); }, 300);
    } else {
      // last item: just refresh nav so the final dot shows as done (stay for review)
      document.getElementById('runnerNav').innerHTML = this.navInner(t, State.qIndex);
    }
  },

  /* RMET keeps its own in-place dot refresh */
  refreshDots(){
    const t = State.currentTest;
    document.querySelectorAll('.nav-dot').forEach((dot,d)=>{
      dot.className = 'nav-dot';
      if(d===State.qIndex) dot.classList.add('current');
      else if(State.answers[t.items[d].n]!=null) dot.classList.add('done');
    });
  },

  /* both questionnaires and RMET swap the item in place (shell stays mounted) */
  _advance(anim){
    if(State.currentTest.format==='image') this.showRmetItem(anim);
    else this.showQuestion(anim);
  },

  /* ---------- section transition card (e.g. BAARS current → childhood) --------
     When the current item begins a new, not-yet-seen section, show a full-screen
     transition card before it — so near-identical question blocks don't read as
     "didn't I just answer this?". Generic: any item with a `sectionIntro`. */
  _sectionIntroPending(t){
    if(!t || !t.items) return false;
    const item = t.items[State.qIndex];
    if(!item || !item.sectionIntro) return false;
    State.sectionsSeen = State.sectionsSeen || {};
    return !State.sectionsSeen[item.sectionKey || ('i'+State.qIndex)];
  },
  _renderSectionIntro(t){
    State.sectionIntroShown = true;
    const item = t.items[State.qIndex];
    const si = item.sectionIntro || {};
    const total = t.items.length, done = State.qIndex, pct = Math.round((done/total)*100);
    const backIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
    document.getElementById('view-runner').innerHTML = `
      <div class="runner">
        <div class="runner-head">
          ${this._runnerTop(t)}
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="progress-label"><span>${done} of ${total} answered</span><span>${pct}%</span></div>
        </div>
        <div class="section-intro">
          ${si.tag?`<div class="section-intro-tag">${this.esc(si.tag)}</div>`:''}
          <h1 class="section-intro-title">${this.esc(si.title||'Next section')}</h1>
          <p class="section-intro-blurb">${this.esc(si.blurb||'')}</p>
          ${si.eventField ? `<label class="section-intro-field"><span>The event, in a few words</span><input id="siEvent" type="text" maxlength="200" autocomplete="off" value="${this.esc((State.answers && State.answers._event) || '')}" placeholder="e.g. car accident in March"></label>` : ''}
          ${((typeof Online !== 'undefined' && Online.adminFor) && t.adminGuide && t.adminGuide.length)
            ? `<div class="rater-guide"><div class="rater-guide-h">Administration guidance (rater)</div><ul>${t.adminGuide.map(g=>`<li>${this.esc(g)}</li>`).join('')}</ul></div>`
            : ''}
          <button class="btn btn-primary btn-lg btn-go" onclick="App.dismissSectionIntro()">Continue</button>
        </div>
      </div>`;
    this.go('runner');
    this.syncClientView();
  },
  dismissSectionIntro(){
    const t = State.currentTest;
    const item = t.items[State.qIndex];
    const ev = document.getElementById('siEvent');   // IES-R index event (optional)
    if(ev){ const v = ev.value.trim(); if(v) State.answers._event = v; else delete State.answers._event; this.saveProgress(); }
    State.sectionsSeen = State.sectionsSeen || {};
    State.sectionsSeen[(item && item.sectionKey) || ('i'+State.qIndex)] = true;
    State.sectionIntroShown = false;
    this.renderRunner('next');
  },
  /* index of the first unanswered item (= items.length when complete) */
  firstUnanswered(t){
    for(let i=0; i<t.items.length; i++){ if(State.answers[t.items[i].n]==null) return i; }
    return t.items.length;
  },
  flashUnanswered(){
    const h = document.getElementById('unansweredHint');
    if(h) h.classList.add('show');
  },
  nextQ(){
    if(State.advanceTimer) return;   // an auto-advance is already in flight
    const t = State.currentTest;
    // every item is required: can't move on until the current one is answered
    if(State.answers[t.items[State.qIndex].n]==null){ this.flashUnanswered(); return; }
    const ni = this._stepIdx(t, State.qIndex, 1);
    if(ni < t.items.length){ State.qIndex = ni; this._advance('next'); }
  },
  prevQ(){
    if(State.advanceTimer) return;
    const pi = this._stepIdx(State.currentTest, State.qIndex, -1);
    if(pi >= 0){ State.qIndex = pi; this._advance('prev'); }
  },
  /* items with skipIfNever are not shown while their gate question is answered
     "Never" (value 0); their answers are held at 0 so the form counts as complete */
  _isSkipped(item){
    return !!(item && item.skipIfNever && State.answers[item.skipIfNever]===0);
  },
  _stepIdx(t, i, dir){
    let j = i + dir;
    while(j >= 0 && j < t.items.length && this._isSkipped(t.items[j])) j += dir;
    return j;
  },
  _applySkips(t, n, val, prev){
    const gated = (t.items||[]).filter(it => it.skipIfNever === n);
    if(!gated.length) return;
    if(val === 0) gated.forEach(it => { State.answers[it.n] = 0; });
    else if(prev === 0) gated.forEach(it => { delete State.answers[it.n]; });   // now asked
  },
  jumpTo(d){
    if(State.advanceTimer) return;
    const t = State.currentTest;
    // can review answered items and the current one, but can't skip ahead past an unanswered item
    if(d > this.firstUnanswered(t)){ this.flashUnanswered(); return; }
    if(this._isSkipped(t.items[d])) return;   // not asked for this substance
    const dir = d>State.qIndex?'next':'prev';
    State.qIndex = d; this._advance(dir);
  },

  confirmExit(){
    const answered = Object.keys(State.answers).length;
    // with save & resume active (online patient, untimed test) nothing is lost on exit
    const kept = !!this.resumeKey();
    const msg = kept
      ? 'Exit this assessment? Your answers so far are saved, so you can pick up where you left off.'
      : 'Exit this assessment? Responses entered so far will be lost.';
    if(answered>0 && !kept && !confirm(msg)) return;
    this.closeClientView();
    // flush the latest answers to the server before leaving (the per-answer save
    // is debounced, so a quick exit could otherwise miss the last response)
    if(!this._informantRun() && typeof Online!=='undefined' && Online.saveRunnerDraft && State.currentTest && this.resumeKey()){
      clearTimeout(this._srvDraftT);
      try{ Online.saveRunnerDraft(State.currentTest.id, {a:State.answers, q:State.qIndex}); }catch(_){}
    }
    // route home properly: for an online patient/admin this re-renders the real
    // home (so the just-exited assessment shows correctly), not just the static view.
    this.finishSession();
  },

  finish(){
    const t = State.currentTest;
    // every item is required — jump to the first blank rather than scoring an incomplete form
    const fu = this.firstUnanswered(t);
    if(fu < t.items.length){
      State.qIndex = fu;
      this.showQuestion('none');
      this.flashUnanswered();
      return;
    }
    State.result = Scoring.run(t, State.answers);
    State.result.missing = 0;
    this.completeAssessment();
  },

  /* ---------- completion: local mode shows results; online mode submits ----------
     In 'local' mode (clinician tool / offline build) the scored results render on
     screen exactly as before. In 'online' mode the answers are submitted to the clinic
     and the patient sees only a confirmation — never the scores. A high-risk indicator
     (currently the PHQ-9 self-harm item) marks the record for urgent clinician review
     and shows the patient crisis resources. */
  completeAssessment(){
    this._backExit = null;   // finished → Back no longer needs the exit guard
    // client view: swap to a neutral "all done" card — the scores render only
    // on the clinician's window
    if(this._cw && !this._cw.closed){ this._cvDone = true; this.syncClientView(); }
    // In ONLINE mode the saved draft (localStorage + server mirror) is the
    // patient's only durable copy of these answers until the upload lands, so it
    // is cleared in submitResult()'s success path — NOT here. Clearing it up
    // front made the failure screen's "your responses are safe on this device"
    // untrue: a failed upload left the answers in memory alone, and closing the
    // tab lost the whole questionnaire. Local/offline mode scores on screen with
    // nothing to upload, so it still clears immediately.
    const willUpload = (typeof CONFIG !== 'undefined' && CONFIG.resolvedMode === 'online');
    if(!willUpload) this.clearProgress();
    const r = State.result;
    // keep the raw responses with the result so the clinician can review/amend
    // them item-by-item later and the score re-computes correctly
    if(r && State.answers) r.answers = Object.assign({}, State.answers);
    if(r && State.itemNotes){
      const notes = {};
      for(const k in State.itemNotes){ const v=(State.itemNotes[k]||'').trim(); if(v) notes[k]=v; }
      if(Object.keys(notes).length) r.itemNotes = notes;
    }
    if(r && r.flag && r.flag.positive) r.needsReview = true;
    // clinician sandbox (Test library): score and show on screen, never submit
    if(typeof Online !== 'undefined' && Online.sandbox){
      this.renderResults({ back:"Online.exitSandbox()", backLabel:"Test library" });
      this.go('results');
      this.markSandboxResult();
      return;
    }
    if(typeof CONFIG !== 'undefined' && CONFIG.resolvedMode === 'online'){
      this.submitResult();
    } else {
      this.renderResults();
      this.go('results');
    }
  },

  /* prepend a "nothing saved" banner to a sandbox result */
  markSandboxResult(){
    const root = document.querySelector('#view-results .results');
    if(root) root.insertAdjacentHTML('afterbegin',
      `<div class="sandbox-banner no-print">Practice run: <b>nothing has been saved.</b></div>`);   // the results header already has the "← Test library" link
  },

  /* sandbox referral: the intake form has no score, so show the built record */
  renderSandboxReferral(result){
    const groups = (result && result.groups) || [];
    const body = groups.map(g=>`<div class="panel"><div class="panel-head"><h3>${this.esc(g.title)}</h3></div>${(g.items||[]).map(it=>`<div class="sb-rrow"><span class="sb-rk">${this.esc(it.label)}</span><span class="sb-rv">${this.esc(it.value)}</span></div>`).join('')}</div>`).join('');
    document.getElementById('view-results').innerHTML = `
      <div class="results">
        <div class="sandbox-banner no-print">Practice referral: <b>nothing has been saved.</b> <button class="btn btn-ghost btn-sm" onclick="Online.exitSandbox()">← Test library</button></div>
        <div class="result-banner"><div class="rb-test">Referral / intake · Practice</div></div>
        ${body || '<p class="lede">No entries.</p>'}
      </div>`;
    this.go('results');
  },

  /* patient flow: start a test using the saved profile (no intake form) */
  startPatientTest(id, gated){
    // the referral/intake is a branching free-text form, not a Likert runner
    if(id === 'referral' && typeof Referral !== 'undefined'){ Referral.start(); return; }
    // the DIVA-5 is a clinician-administered semi-structured interview, not a runner
    if(id === 'diva' || id === 'young_diva'){ if(typeof Diva !== 'undefined'){ Diva.start(id); } else { alert('The DIVA interview isn’t available in this build.'); } return; }
    // the DASI-2 is a clinician-administered ASD interview + observational record
    if(id === 'dasi'){ if(typeof Dasi !== 'undefined'){ Dasi.start(); } else { alert('The DASI-2 isn’t available in this build.'); } return; }
    // the ADI-R / ADOS-2 algorithms are clinician-only scoring companions, not runners
    if(id === 'adir'){ if(typeof Adir !== 'undefined'){ Adir.start(); } else { alert('The ADI-R scoring isn’t available in this build.'); } return; }
    // the ADI-R workspace is the clinician's interview record, also not a runner
    if(id === 'adirw'){ if(typeof Adirw !== 'undefined'){ Adirw.start(); } else { alert('The ADI-R workspace isn’t available in this build.'); } return; }
    if(id === 'ados_m4'){ if(typeof Ados !== 'undefined'){ Ados.start(); } else { alert('The ADOS-2 scoring isn’t available in this build.'); } return; }
    // child pathway: confirm WHO is completing this before the runner
    if(!gated && typeof Online !== 'undefined' && Online.needsRespondentGate && Online.needsRespondentGate(id)){
      return Online.renderRespondentGate(id);
    }
    State.currentTest = REGISTRY[id];
    State.answers = {}; State.qIndex = 0; State.result = null;
    this.stopRmetTimer();
    State.rmet = {phase:null, startMs:null, itemShownMs:null, itemTimes:{}, elapsedMs:0, timer:null};
    // when a clinician is administering on a patient's behalf, use the patient's
    // details (so age/sex norms apply) and skip resume (it's a fresh entry)
    const admin = (typeof Online !== 'undefined' && Online.adminFor) ? Online.adminFor : null;
    const p = admin || ((typeof Online !== 'undefined' && Online.profile) ? Online.profile : {});
    const today = new Date().toISOString().slice(0,10);
    State.client = { name:p.username||'Patient', dob:p.dob||'', sex:p.sex||'', date:today, clinician:'', ref:p.username||'' };
    if(admin){ this.startRunner(); return; }
    const saved = this.loadProgress();
    if(saved){ this.renderResumePrompt(saved); return; }
    // no local draft → check the server (resume from another device), then start
    if(typeof Online!=='undefined' && Online.loadRunnerDraft){
      Online.loadRunnerDraft(id).then(srv=>{
        const n = (srv && srv.a) ? Object.keys(srv.a).length : 0;
        if(n>0 && n < (REGISTRY[id].items||[]).length) this.renderResumePrompt(srv);
        else this.startRunner();
      }).catch(()=>this.startRunner());
      return;
    }
    this.startRunner();
  },

  /* ---------- save & resume (online patient flow only) ----------------------
     Answers persist to this device's localStorage after every response, so a
     patient who is interrupted mid-questionnaire can pick up where they left
     off. Keyed by user id + test id; never applies to the local clinician tool
     (a new client must never inherit a previous client's answers) and never to
     the timed RMET, where a pause would invalidate the timing. Cleared the
     moment the assessment is scored. */
  resumeKey(){
    const t = State.currentTest;
    // informants (no login): keyed by their link token, on this device only, so a
    // closed tab or a link that expires mid-form doesn't lose their answers
    const inf = this._informantRun();
    if(inf){
      const tok = inf.token || inf.id;
      if(!tok || !t || t.format==='image' || t.format==='assist' || Online.demoMode) return null;
      return 'as_resume_inf_' + tok + '_' + t.id;
    }
    const uid = (typeof Online!=='undefined' && Online.user) ? Online.user.id : null;
    if(!uid || !t || t.format==='image' || t.format==='assist') return null;
    if(typeof Online !== 'undefined' && Online.sandbox) return null;   // practice runs never resume
    return 'as_resume_' + uid + '_' + t.id;
  },
  /* the informant link being completed right now (not a clinician administering) */
  _informantRun(){
    return (typeof Online!=='undefined' && Online.informantFor && !Online.adminFor) ? Online.informantFor : null;
  },
  saveProgress(){
    const k = this.resumeKey(); if(!k) return;
    try{ localStorage.setItem(k, JSON.stringify({a:State.answers, q:State.qIndex, ts:Date.now()})); }catch(e){}
    // mirror to the server (debounced) so progress survives a device/browser change.
    // Never for an informant: runner_drafts belongs to the signed-in account.
    if(!this._informantRun() && typeof Online!=='undefined' && Online.saveRunnerDraft && State.currentTest){
      clearTimeout(this._srvDraftT);
      const tid=State.currentTest.id, a=Object.assign({}, State.answers), q=State.qIndex;
      this._srvDraftT=setTimeout(()=>{ try{ Online.saveRunnerDraft(tid,{a,q}); }catch(_){} }, 2500);
    }
  },
  loadProgress(){
    const k = this.resumeKey(); if(!k) return null;
    try{
      const s = JSON.parse(localStorage.getItem(k));
      if(!s || !s.a) return null;
      const n = Object.keys(s.a).length;
      const total = State.currentTest.items.length;
      const fresh = s.ts && (Date.now() - s.ts) < 7*24*3600*1000;   // stale after a week
      return (n > 0 && n < total && fresh) ? s : null;
    }catch(e){ return null; }
  },
  clearProgress(){
    clearTimeout(this._srvDraftT);
    if(!this._informantRun() && typeof Online!=='undefined' && Online.deleteRunnerDraft && State.currentTest){ try{ Online.deleteRunnerDraft(State.currentTest.id); }catch(_){} }
    const k = this.resumeKey(); if(!k) return;
    try{ localStorage.removeItem(k); }catch(e){}
  },
  renderResumePrompt(saved){
    const t = State.currentTest;
    const n = Object.keys(saved.a).length, total = t.items.length;
    State._resume = saved;
    document.getElementById('view-runner').innerHTML = `
      <div class="runner"><div class="submitted-card">
        <h1>Pick up where you left off?</h1>
        <p class="submitted-sub">You’ve answered ${n} of ${total} questions on the ${t.name}. You can continue from where you stopped, or start again from the beginning.</p>
        <div class="resume-actions">
          <button class="btn btn-primary btn-lg" onclick="App.resumeSaved()">Continue (question ${Math.min(n+1,total)})</button>
          <button class="btn btn-ghost" onclick="App.discardSaved()">Start again</button>
        </div>
      </div></div>`;
    this.go('runner');
    this.updateTopMeta();
  },
  resumeSaved(){
    const saved = State._resume; State._resume = null;
    this.startRunner();
    if(!saved) return;
    State.answers = saved.a || {};
    const t = State.currentTest;
    State.qIndex = Math.min(this.firstUnanswered(t), t.items.length-1);
    this.showQuestion('none');
    this.paintProgress(t);
  },
  discardSaved(){
    State._resume = null;
    this.clearProgress();
    this.startRunner();
  },

  submitResult(){
    // informant (no-login) submissions route to their own save + thank-you
    if(typeof Online !== 'undefined' && Online.informantFor){ return this.submitInformantResult(); }
    // clinician sandbox (Test library): score on screen, never save. completeAssessment
    // has this guard, but DIVA (and any engine that calls submitResult directly) bypasses
    // it and would otherwise write a real submission during a practice administration.
    if(typeof Online !== 'undefined' && Online.sandbox){
      this.renderResults({ back:"Online.exitSandbox()", backLabel:"Test library" });
      this.go('results');
      this.markSandboxResult();
      return;
    }
    const r = State.result;
    const admin = (typeof Online !== 'undefined' && Online.adminFor) ? true : false;
    // a clinician entering on a patient's behalf never sees the patient's crisis card
    const showCrisis = !admin && !!(r && r.needsReview);
    const finishedTest = State.currentTest;
    this.renderSubmitting();
    this.go('results');
    const done = ok => {
      // Drop the saved draft ONLY once the answers are safely uploaded (ok===true)
      // or there was no backend to upload to (ok===null). On failure it is kept, so
      // "Try again" — and reopening the tab later — still has the answers. Must run
      // before showNextUp(), which moves State.currentTest on to the next test.
      if(ok !== false) this.clearProgress();
      if(ok && !admin && typeof Online !== 'undefined') Online.markDone(finishedTest.id);
      // Patient flow (online, saved, not a flagged self-harm submission): show the
      // guided "saved ✓ · next up" screen instead of the plain confirmation.
      if(ok===true && !admin && !showCrisis && typeof Online !== 'undefined' && (Online.client || Online.demoMode) && finishedTest && finishedTest.id!=='referral'){
        this.showNextUp(finishedTest);
      } else {
        this.renderSubmitted(showCrisis, ok);
      }
    };
    // the demo preview saves in memory (Online.submit branches on demoMode), so it takes
    // the same path as a real patient rather than the "no backend" confirmation
    if(typeof Online !== 'undefined' && (Online.client || (Online.demoMode && !admin))){
      const p = admin ? Online.submitFor(r) : Online.submit();
      p.then(()=>done(true)).catch(()=>done(false));
    } else {
      done(null);   // online mode configured but backend not wired (placeholder) — still confirm
    }
    this.updateTopMeta();
  },

  /* guided sequence: confirm the just-finished assessment saved, then offer the
     next assigned questionnaire (or a "that's everything" close). The full tile
     home is always one tap away via "Back to home". */
  async showNextUp(finishedTest){
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    const root = document.getElementById('view-results');
    // immediate "saved" confirmation while we look up what's next
    root.innerHTML = `
      <div class="results"><div class="submitted-card">
        <div class="submitted-icon">${checkIcon}</div>
        <h1>Thank you, that’s saved</h1>
        <p class="submitted-sub">Your ${this.esc(finishedTest.name)} answers have been shared securely with your clinician.</p>
        <div class="nextup-slot"><div class="spinner spinner-sm"></div></div>
      </div></div>`;
    let s = { done:0, total:0, next:null };
    try{ s = await Online.runSummary(finishedTest.id); }catch(e){}
    const slot = document.querySelector('.nextup-slot');
    if(!slot) return;   // user navigated away
    // counted within the same batch the home page lists ("Your questionnaires: three to
    // do"), not across the intake, screening and informant forms together
    const b = s.batch;
    const progress = (b && b.total>1) ? `<p class="nextup-progress">${b.done} of ${b.total} ${b.screening?'screening questionnaires':'questionnaires'} done</p>` : '';
    if(s.next){
      slot.innerHTML = `${progress}
        <div class="nextup-next">Next: <b>${this.esc(s.next.name)}</b>${s.next.estMinutes?` · ${this.esc(s.next.estMinutes)}`:''}</div>
        <button class="btn btn-primary btn-lg btn-go" onclick="App.startPatientTest('${this.esc(s.next.id)}')">Continue</button>
        <button class="btn btn-ghost nextup-back" onclick="App.finishSession()">Back to home</button>`;
    } else {
      slot.innerHTML = `${progress}
        <p class="nextup-done">${s.heldByDeposit ? 'That’s everything you can do for now, thank you. The rest unlock once your deposit is paid.' : (s.waiting ? 'That’s everything you can do for now, thank you.' : 'That’s everything assigned, thank you.')}</p>
        <button class="btn btn-primary btn-lg" onclick="App.finishSession()">Back to home</button>`;
    }
  },

  /* referral/intake submission — same upload + confirmation flow as a test,
     but routed to a referral row (test_id='referral') */
  submitReferral(result){
    if(typeof Online !== 'undefined' && Online.sandbox){ return this.renderSandboxReferral(result); }
    const admin = (typeof Online !== 'undefined' && Online.adminFor) ? true : false;
    this.renderSubmitting();
    this.go('results');
    const done = ok => {
      if(ok && !admin && typeof Online !== 'undefined') Online.markDone('referral');
      this.renderSubmitted(false, ok);
    };
    if(typeof Online !== 'undefined' && Online.client){
      const p = admin ? Online.submitFor(result) : Online.submitReferral(result);
      p.then(()=>done(true)).catch(()=>done(false));
    } else {
      done(null);
    }
    this.updateTopMeta();
  },

  /* self-referral CAPTURE (short triage form) — Online stores it as pending and
     renders its own "referral received" screen; nothing is scored. */
  saveReferralCapture(result){
    if(typeof Online !== 'undefined' && Online.client && typeof Online.saveReferralCapture === 'function'){
      Online.saveReferralCapture(result);
    } else {
      // Defensive: the backend client isn't available (boot-order bug or bad
      // deploy). Never drop a completed form silently — the localStorage draft
      // still holds their answers, so say so and offer a retry.
      document.getElementById('view-home').innerHTML = `
        <div class="auth-card">
          <h1>Couldn’t save your referral</h1>
          <p class="auth-sub">Something went wrong on our side just now. <b>Your answers are safe</b>. They’re saved on this device, so nothing you wrote has been lost.</p>
          <button class="btn btn-primary btn-lg" onclick="location.reload()">Try again</button>
        </div>`;
      this.go('home');
    }
    this.updateTopMeta();
  },

  /* informant (no-login) submission → save via token RPC → close-this-page thanks */
  submitInformantResult(){
    const r = State.result;
    if(r && State.answers) r.answers = Object.assign({}, State.answers);
    this.renderSubmitting();
    this.go('results');
    const check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    const warn = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    const demo = (typeof Online!=='undefined' && Online.demoMode);
    const demoBack = demo ? `<button class="btn btn-primary btn-lg" onclick="Online.exitDemoInformant()">Back to demo</button>` : '';
    Online.submitInformant(r).then(ok=>{
      const code0 = (typeof Online!=='undefined' && Online.informantLastError) || '';
      // saved (or already saved from another device): the draft on this device is done with
      if(ok || code0==='done') this.clearProgress();
      // mini-battery: if more questionnaires remain for this informant, start the
      // next one instead of showing the final thank-you. "done" means this one was
      // already sent (e.g. from a second device), so move on to what's left too.
      if((ok || code0==='done') && typeof Online.advanceInformant === 'function' && Online.advanceInformant()) return;
      if(ok){
        try{ sessionStorage.removeItem('as_inf_token'); }catch(_){}
        document.getElementById('view-results').innerHTML =
          `<div class="results"><div class="submitted-card"><div class="submitted-icon">${check}</div><h1>Thank you</h1><p class="submitted-sub">Your answers have been sent securely to the clinic. There's nothing more to do, you can close this page.</p>${demoBack}</div></div>`;
        return;
      }
      // specific failure copy per RPC code (F-09): retrying can only help for a
      // transient/network failure — a dead link needs the sender, not a retry.
      const code = (typeof Online!=='undefined' && Online.informantLastError) || 'network';
      let title='We couldn’t send your answers', sub, retry=false;
      if(code==='expired'){ sub='This link expired before your answers could be sent. Your answers are saved on this device. Please ask whoever sent you the link to renew it, then open the same link again on this device to send them.'; }
      else if(code==='revoked'){ sub='This link has been withdrawn, so your answers couldn’t be saved. Please contact whoever sent it to you.'; }
      else if(code==='done'){ title='Already recorded'; sub='This questionnaire has already been completed for this link, so there’s nothing more to do. You can close this page.'; }
      else if(code==='no_consent'){ sub='We can only accept your answers once you have agreed to take part. Please open the link again and choose “I consent”. Your answers are saved on this device.'; }
      else if(code==='bad_result'){ sub='Something went wrong while saving these answers, so they couldn’t be sent. Your answers are saved on this device. Please try again, or contact the clinic if it keeps happening.'; retry=true; }
      else if(code==='network'){ sub='This looks like a connection problem. Your answers are still here. Please check your internet and try again.'; retry=true; }
      else { sub='There’s a problem with this link, so your answers couldn’t be saved. Please contact the clinic or whoever sent you the link.'; }
      document.getElementById('view-results').innerHTML =
        `<div class="results"><div class="submitted-card"><div class="submitted-icon submitted-icon-warn">${warn}</div><h1>${title}</h1><p class="submitted-sub">${sub}</p>${retry?`<button class="btn btn-primary btn-lg" onclick="App.submitInformantResult()">Try again</button>`:''}${demoBack}</div></div>`;
    });
  },

  renderSubmitting(){
    document.getElementById('view-results').innerHTML = `
      <div class="results"><div class="submitted-card">
        <div class="spinner"></div>
        <h1>Sending your answers…</h1>
        <p class="submitted-sub">Just a moment, please don’t close this tab.</p>
      </div></div>`;
  },

  /* uploadOk: true = saved, false = upload failed, null = no backend wired (placeholder) */
  renderSubmitted(showCrisis, uploadOk){
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    const heartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const crisis = (typeof CONFIG!=='undefined' && CONFIG.crisis) ? CONFIG.crisis : null;
    const crisisHtml = (showCrisis && crisis) ? `
      <div class="crisis-card">
        <div class="crisis-head">${heartIcon}<span>You don't have to face this alone</span></div>
        <p class="crisis-intro">${crisis.intro}</p>
        <ul class="crisis-lines">
          ${crisis.lines.map(l=>`<li><div class="cl-top"><span class="cl-name">${l.name}</span><a class="cl-val" href="${l.href}">${l.value}</a></div>${l.desc?`<p class="cl-desc">${l.desc}</p>`:''}</li>`).join('')}
        </ul>
      </div>` : '';

    if(uploadOk === false){
      // Only promise the answers are kept when a resumable draft really exists.
      // The timed RMET and the branching ASSIST are deliberately non-resumable
      // (resumeKey() returns null), so for those the answers live on this page
      // only and closing the tab does lose them — say so rather than reassure.
      const kept = !!this.resumeKey();
      const safety = kept
        ? 'Your answers are saved on this device, so nothing is lost. Please check your connection and try again, or let your clinic know.'
        : 'Please keep this page open and try again, or let your clinic know. Closing the tab will lose these answers.';
      document.getElementById('view-results').innerHTML = `
        <div class="results"><div class="submitted-card">
          <div class="submitted-icon submitted-icon-warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <h1>We couldn’t send your answers</h1>
          <p class="submitted-sub">${safety}</p>
          ${crisisHtml}
          <button class="btn btn-primary btn-lg" onclick="App.submitResult()">Try again</button>
        </div></div>`;
      return;
    }
    document.getElementById('view-results').innerHTML = `
      <div class="results">
        <div class="submitted-card">
          <div class="submitted-icon">${checkIcon}</div>
          <h1>Thank you, your answers have been sent</h1>
          <p class="submitted-sub">Your responses have been shared securely with your clinician. There’s nothing more you need to do right now.</p>
          ${crisisHtml}
          <button class="btn btn-primary btn-lg" onclick="App.finishSession()">Done</button>
        </div>
      </div>`;
  },

  finishSession(){
    this._backExit = null;
    State.answers = {}; State.qIndex = 0; State.result = null;
    // drop the finished test so the header stops reading "Name · GAD-7" on the home screen
    State.currentTest = null; this.updateTopMeta();
    // a Test library practice run goes back to the library
    if(typeof Online !== 'undefined' && Online.sandbox){ Online.exitSandbox(); return; }
    // an informant who exits mid-form: their answers are on this device
    if(typeof Online !== 'undefined' && Online.informantFor && !Online.adminFor && Online.renderInformantPaused){ Online.renderInformantPaused(); return; }
    // returning from an on-behalf entry: clear admin mode, reopen the patient
    if(typeof Online !== 'undefined' && Online.adminFor){
      const email = Online.adminFor.email; Online.adminFor = null;
      Online.afterAdminister(email);
      return;
    }
    if(typeof Online !== 'undefined' && Online.client && Online.profile){
      Online.renderPatientHome();
    } else {
      this.go('home');
    }
  },

  /* ════════════════════════════════════════════════════════════
     RMET RUNNER (image-based test with practice item + stopwatch)
     ════════════════════════════════════════════════════════════ */

  /* resolve an image to an inlined data URI (single-file build) or a path (dev) */
  rmetImg(file){
    if(window.RMET_IMAGES && window.RMET_IMAGES[file]) return window.RMET_IMAGES[file];
    const base = (State.currentTest && State.currentTest.imageBase) || 'assets/rmet-images/';
    return base + file;
  },

  fmtClock(ms){
    const s = Math.max(0, Math.floor(ms/1000));
    const m = Math.floor(s/60);
    const r = s%60;
    return m + ':' + String(r).padStart(2,'0');
  },

  // Total time is captured silently (start at first item, read at finish) — no live display.
  stopRmetTimer(){
    if(State.rmet && State.rmet.timer){ clearInterval(State.rmet.timer); State.rmet.timer = null; }
    if(State.rmet && State.rmet.startMs) State.rmet.elapsedMs = Date.now()-State.rmet.startMs;
  },

  renderRmetRunner(anim){
    const t = State.currentTest;
    const backIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

    if(State.rmet.phase==='practice'){
      const p = t.practice;
      const opts = p.options.map((w,oi)=>
        `<button class="rmet-opt" data-oi="${oi}" onclick="App.rmetPracticeAnswer(${oi})"><span class="opt-key">${oi+1}</span><span>${w}</span></button>`).join('');
      document.getElementById('view-runner').innerHTML = `
        <div class="runner runner-rmet">
          <div class="runner-head">
            ${this._runnerTop(t)}
            <div class="rmet-practice-tag">Practice item, not scored</div>
          </div>
          <div class="rmet-stage">
            <p class="rmet-instruct">For each photo, choose the word that best describes what the person is <b>thinking or feeling</b>. This first one is for practice, look at the eyes, then pick a word. If you are not sure what a word means, open <b>Word meanings</b> below the words.</p>
            <div class="rmet-grid">
              <div class="rmet-photo-wrap"><img class="rmet-photo" src="${this.rmetImg(p.image)}" alt="Practice, eye region"></div>
              <div class="rmet-answer">
                <div class="rmet-options" id="rmetOptions">${opts}</div>
                ${this.rmetWordsHtml(t, p.options)}
                <div class="rmet-feedback" id="rmetFeedback"></div>
              </div>
            </div>
          </div>
          <div class="runner-nav">
            <button class="btn btn-ghost" onclick="App.beginRmetTest()">Skip practice</button>
            <div></div>
            <button class="btn btn-primary" id="rmetBeginBtn" onclick="App.beginRmetTest()" disabled>Begin test
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
          </div>
        </div>`;
      return;
    }

    // ----- test phase: build the shell ONCE; items swap in place via showRmetItem -----
    const i = State.qIndex;
    const animClass = anim==='next'?'q-anim-next':anim==='prev'?'q-anim-prev':'';

    document.getElementById('view-runner').innerHTML = `
      <div class="runner runner-rmet">
        <div class="runner-head">
          ${this._runnerTop(t)}
          <div class="progress-track"><div class="progress-fill"></div></div>
          <div class="progress-label"></div>
        </div>

        <div class="rmet-stage ${animClass}" id="qCard">${this.rmetCardInner(t, i)}</div>

        <div class="unanswered-hint" id="unansweredHint">Please choose a response to continue.</div>

        <div class="runner-nav" id="runnerNav">${this.rmetNavInner(t, i)}</div>
      </div>`;

    this.paintProgress(t);
    // mark when this item became visible (per-item response time, recorded silently)
    State.rmet.itemShownMs = Date.now();
  },

  /* "Word meanings": the ARC definition handout entries for the words on screen
     (official instructions: "If you really don't know what a word means you can
     look it up in the definition handout"). Words the handout omits are left out. */
  rmetWordsHtml(t, words){
    const g = t.glossary || {};
    const rows = words.map(w => String(w)).filter(w => g[w.toLowerCase()]).map(w => {
      const e = g[w.toLowerCase()];
      return `<div class="rmet-word"><dt>${this.esc(w)}</dt><dd>${this.esc(e.d)}<span class="rmet-word-ex">${this.esc(e.e)}</span></dd></div>`;
    }).join('');
    return rows ? `<details class="rmet-words"><summary>Word meanings</summary><dl>${rows}</dl></details>` : '';
  },
  /* inner HTML of an RMET item card (number + photo + prompt + word options) */
  rmetCardInner(t, i){
    const item = t.items[i];
    const opts = item.options.map((w,oi)=>{
      const sel = State.answers[item.n]===oi ? 'selected':'';
      return `<button class="rmet-opt ${sel}" data-oi="${oi}" onclick="App.rmetAnswer(${item.n},${oi})"><span class="opt-key">${oi+1}</span><span>${w}</span></button>`;
    }).join('');
    return `
      <div class="rmet-grid">
        <div class="rmet-photo-wrap"><img class="rmet-photo" src="${this.rmetImg(item.image)}" alt="Eye region, item ${i+1}"></div>
        <div class="rmet-answer">
          <div class="q-number">Item ${i+1} of ${t.items.length}</div>
          <div class="rmet-prompt">Which word best describes what this person is thinking or feeling?</div>
          <div class="rmet-options" id="rmetOptions">${opts}</div>
          ${this.rmetWordsHtml(t, item.options)}
        </div>
      </div>`;
  },

  /* inner HTML of the RMET nav row (Back · dots · Next/Finish) */
  rmetNavInner(t, i){
    const total = t.items.length;
    const isLast = i===total-1;
    const frontier = this.firstUnanswered(t);
    let dots = '';
    for(let d=0; d<total; d++){
      let cls = 'nav-dot';
      if(d===i) cls+=' current';
      else if(State.answers[t.items[d].n]!=null) cls+=' done';
      const locked = d>frontier;
      if(locked) cls+=' locked';
      dots += `<button class="${cls}" ${locked?'disabled':''} onclick="App.jumpTo(${d})" aria-label="Item ${d+1}"></button>`;
    }
    return `
      <button class="btn btn-ghost" onclick="App.prevQ()" ${i===0?'disabled':''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </button>
      <div class="nav-dots">${dots}</div>
      ${isLast
        ? `<button class="btn btn-primary" onclick="App.finishRmet()">${(typeof CONFIG!=='undefined'&&CONFIG.resolvedMode==='online')?'Finish &amp; send':'Finish &amp; score'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>`
        : `<button class="btn btn-primary" onclick="App.nextQ()">Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>`
      }`;
  },

  /* swap an RMET item in place — keeps the shell + stopwatch mounted (no jump) */
  showRmetItem(anim){
    const t = State.currentTest;
    const card = document.getElementById('qCard');
    if(!card) return this.renderRmetRunner(anim);
    card.classList.remove('q-anim-next','q-anim-prev');
    void card.offsetWidth;
    if(anim==='next') card.classList.add('q-anim-next');
    else if(anim==='prev') card.classList.add('q-anim-prev');
    this._keepRunnerFocus(card, ()=>{
      card.innerHTML = this.rmetCardInner(t, State.qIndex);
      document.getElementById('runnerNav').innerHTML = this.rmetNavInner(t, State.qIndex);
    });
    this.paintProgress(t);
    const hint = document.getElementById('unansweredHint');
    if(hint) hint.classList.remove('show');
    State.rmet.itemShownMs = Date.now();   // reset per-item timer for this visit
  },

  rmetPracticeAnswer(oi){
    const p = State.currentTest.practice;
    document.querySelectorAll('#rmetOptions .rmet-opt').forEach(b=>{
      b.classList.remove('selected','correct','incorrect');
      const boi = Number(b.getAttribute('data-oi'));
      if(boi===p.correct) b.classList.add('correct');
      if(boi===oi && oi!==p.correct) b.classList.add('incorrect');
    });
    const fb = document.getElementById('rmetFeedback');
    if(fb){
      const right = oi===p.correct;
      fb.innerHTML = right
        ? `<b style="color:var(--green)">Correct.</b> “${p.options[p.correct]}” best fits this expression. The real items work the same way, there is no feedback during the test.`
        : `The best answer here is <b>“${p.options[p.correct]}”</b>. That’s fine, this was just practice. During the test you simply pick the closest word; there’s no feedback.`;
      fb.classList.add('show');
    }
    const begin = document.getElementById('rmetBeginBtn');
    if(begin) begin.disabled = false;
  },

  beginRmetTest(){
    State.rmet.phase = 'test';
    State.qIndex = 0;
    State.rmet.startMs = Date.now();   // total-time clock starts at the first real item
    State.rmet.itemTimes = {};
    this.renderRmetRunner('none');
  },

  rmetAnswer(n, oi){
    if(State.advanceTimer) return;   // one advance in flight — ignore rapid extra input (no skips)
    State.answers[n] = oi;
    // record response time for this visit to the item (silent — shown only as overall total)
    if(State.rmet.itemShownMs){
      State.rmet.itemTimes[n] = Date.now() - State.rmet.itemShownMs;
    }
    const t = State.currentTest;
    // highlight selection by index (mouse + keyboard share this)
    document.querySelectorAll('#rmetOptions .rmet-opt').forEach(b=>b.classList.toggle('selected', Number(b.dataset.oi)===oi));
    this.paintProgress(t);
    const hint = document.getElementById('unansweredHint'); if(hint) hint.classList.remove('show');
    // auto-advance to the next item after a brief beat so the choice registers
    if(State.qIndex < t.items.length-1){
      State.advanceTimer = setTimeout(()=>{ State.advanceTimer = null; State.qIndex++; this.showRmetItem('next'); }, 180);
    } else {
      document.getElementById('runnerNav').innerHTML = this.rmetNavInner(t, State.qIndex);
    }
  },

  finishRmet(){
    const t = State.currentTest;
    // every item is required — jump to the first blank rather than scoring an incomplete test
    const fu = this.firstUnanswered(t);
    if(fu < t.items.length){
      State.qIndex = fu;
      this.showRmetItem('none');
      this.flashUnanswered();
      return;
    }
    this.stopRmetTimer();
    State.result = Scoring.run(t, State.answers);
    State.result.missing = 0;
    State.result.timing = {
      totalMs: State.rmet.elapsedMs || (State.rmet.startMs ? Date.now()-State.rmet.startMs : 0),
      perItem: Object.assign({}, State.rmet.itemTimes),
      answered: Object.keys(State.answers).length,
    };
    this.completeAssessment();
  },

  /* ---------- keyboard entry (runner only) ----------------------------------
     A–D (or 1–4) answer questionnaire/RMET options; 1–7 answer the HSC scale;
     ← / → move between items; Enter scores on the last item. Speeds up direct
     administration — no visual change, mouse still works exactly as before.
  --------------------------------------------------------------------------- */
  _letterDigitToIndex(key, n){
    const li = 'ABCDEFG'.indexOf((key||'').toUpperCase());
    if(li>=0 && li<n) return li;
    if(/^[1-9]$/.test(key)){ const idx = +key-1; if(idx>=0 && idx<n) return idx; }
    return null;
  },
  keyToVal(t, key, item){
    // per-item response set (Vanderbilt): map key → the option's stored value
    if(item && item.optionSet && t.scoring.optionSets){
      const opts = t.scoring.optionSets[item.optionSet];
      const idx = this._letterDigitToIndex(key, opts.length);
      return idx==null ? null : opts[idx].v;
    }
    if(t.scoring.type==='mean'){
      if(/^[1-9]$/.test(key)){ const v = +key; if(v>=1 && v<=t.scoring.points) return v; }
      return null;
    }
    return this._letterDigitToIndex(key, t.scoring.options.length); // option index
  },
  handleKey(e){
    const runner = document.getElementById('view-runner');
    if(!runner || !runner.classList.contains('active')) return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if(tag==='input' || tag==='select' || tag==='textarea') return;
    const t = State.currentTest;
    if(!t) return;
    const key = e.key;

    // a section transition card is up: only Enter/→ advances past it
    if(State.sectionIntroShown){
      if(key==='Enter' || key==='ArrowRight'){ e.preventDefault(); this.dismissSectionIntro(); }
      return;
    }

    // RMET (image) — practice + test phases
    if(t.format==='image'){
      if(State.rmet.phase==='practice'){
        const idx = this._letterDigitToIndex(key, t.practice.options.length);
        if(idx!=null){ e.preventDefault(); this.rmetPracticeAnswer(idx); return; }
        if(key==='Enter' || key==='ArrowRight'){ e.preventDefault(); this.beginRmetTest(); return; }
        return;
      }
      const item = t.items[State.qIndex];
      const idx = this._letterDigitToIndex(key, item.options.length);
      if(idx!=null){ e.preventDefault(); this.rmetAnswer(item.n, idx); return; } // auto-advances
      if(key==='ArrowRight'){ e.preventDefault(); this.nextQ(); return; }
      if(key==='ArrowLeft'){ e.preventDefault(); this.prevQ(); return; }
      if(key==='Enter' && State.qIndex===t.items.length-1){ e.preventDefault(); this.finishRmet(); return; }
      return;
    }

    // questionnaires — answering auto-advances
    if(key==='ArrowRight'){ e.preventDefault(); this.nextQ(); return; }
    if(key==='ArrowLeft'){ e.preventDefault(); this.prevQ(); return; }
    if(key==='Enter' && State.qIndex===t.items.length-1){ e.preventDefault(); this.finish(); return; }
    const curItem = t.items[State.qIndex];
    const val = this.keyToVal(t, key, curItem);
    if(val!=null){ e.preventDefault(); this.answer(curItem.n, val); return; }
  },

  /* ---------- NORMS REFERENCE (clinician QA) -----------------------------------
     A read-only audit page: every normative value, cut-off and percentile the app
     uses, laid out in plain tables for visual checking against the source papers.
     Not patient-facing — reached via a discreet link on the home screen.
  --------------------------------------------------------------------------- */
  openNorms(id){
    this.renderNorms(); this.go('norms');
    requestAnimationFrame(()=>this._nrOffsets && this._nrOffsets());
    // a timeout rather than a frame, so the jump still happens if the tab is in the background
    if(id) setTimeout(()=>{ this._nrOffsets && this._nrOffsets(); this._nrFocus(id); }, 0);
  },
  // opened from a test: expand that test's card and scroll it clear of the sticky bars
  _nrFocus(id){
    const card = document.getElementById('nr-'+id); if(!card) return;
    card.open = true;
    const bar = document.querySelector('#view-norms .nr-bar');
    const below = bar ? (parseFloat(bar.style.top)||0) + bar.offsetHeight + 8 : 0;
    card.style.scrollMarginTop = below+'px';
    card.scrollIntoView({block:'start'});
  },

  renderNorms(){
    const backIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
    const ms = o => (o && o.mean!=null) ? `${o.mean}${o.sd!=null?` (${o.sd})`:''}` : '—';
    const tbl = (headers, rows) => `<table class="norms-tbl"><thead><tr>${headers.map((h,i)=>`<th${i===0?' class="rh"':''}>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,ci)=>`<td${ci===0?' class="rh"':''}>${c==null||c===''?'—':c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const src = s => s?`<p class="norms-src">${s}</p>`:'';
    const note = s => `<p class="norms-note">${s}</p>`;

    const SUB = ['communication','social','imagination','attention_to_detail','attention_switching'];
    const SUBH = ['Comm','Social','Imag','Detail','Switch'];

    let html = `<button class="back-link" onclick="App.go('home')">${backIcon} All instruments</button>
      <div class="eyebrow">Clinician QA</div>
      <h1 class="page-title">Norms reference</h1>
      <p class="lede">Every normative value, cut-off and percentile embedded in the app, laid out for visual checking against the source papers. This page is for the clinician only and never appears in a client's report. ★ marks a recommended cut-off.</p>
      <div id="nrBody">`;

    // ---- AQ family ----
    for(const id of ['aq_child','aq_adolescent','aq_adult']){
      const t = REGISTRY[id]; if(!t) continue;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}`;
      if(t.cutoffs && t.cutoffs.length){
        html += `<h4>Cut-offs (total score)</h4>` + tbl(['Score','Note'],
          t.cutoffs.map(c=>[`≥ ${c.score}${c.recommended?' ★':''}`, c.label?`${c.label}${c.note?`, ${c.note}`:''}`:(c.note||'')]));
      }
      if(t.adultNorms){
        const a=t.adultNorms;
        html += `<h4>AQ-50 total. Ruzich 2015 meta-analysis</h4>` + tbl(['Group','Male','Female','Overall','Pooled SD'], [
          ['Non-clinical', a.groups.nonclinical.male.mean, a.groups.nonclinical.female.mean, a.groups.nonclinical.overall.mean, a.pooledSD.nonclinical],
          ['Autism (ASC)', a.groups.asc.male.mean, a.groups.asc.female.mean, a.groups.asc.overall.mean, a.pooledSD.asc],
        ]) + src(a.source);
      }
      if(t.norms && t.norms.length){
        html += `<h4>Group means, total &amp; subscales, mean (SD)${id==='aq_adult'?' · subscales Baron-Cohen 2001':''}</h4>` +
          tbl(['Group','Sex','n','Total',...SUBH], t.norms.map(n=>{
            const sc=n.subscales||{};
            return [`${n.group}${n.smallSample?' ⚠':''}`, n.sex, n.n||'—', ms(n.total), ...SUB.map(k=>ms(sc[k]))];
          }));
        if(id==='aq_adult') html += note('⚠ Female-autism cell n=13 (Baron-Cohen 2001), treat as indicative only.');
      }
      html += `</div>`;
    }

    // ---- CATI ----
    if(REGISTRY.cati){ const t=REGISTRY.cati; const gn=t.genderNorms||{};
      const KEYS=['total','SOC','COM','CAM','FLX','REG','SEN'];
      const KH=['Total','SOC','COM','CAM','FLX','REG','SEN'];
      const gLabels={man:'Men',woman:'Women',diverse:'Gender-diverse'};
      const rows=[];
      for(const g of ['man','woman','diverse']){ if(!gn[g]) continue;
        for(const grp of ['non','aut']){ const d=gn[g][grp]||{};
          rows.push([gLabels[g], grp==='non'?'Non-autistic':'Autistic',
            ...KEYS.map(k=> d[k] ? `${d[k].m} (${d[k].sd})` : '—')]);
        }
      }
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`Total 42–${t.scoring.totalMax}; each subscale 7–${t.scoring.subscaleMax}. 5-point Likert (1–5). Reverse-scored items: ${(t.scoring.reversed||[]).join(', ')}. Classification threshold ★ ≥${t.scoring.threshold} (95% CI ${(t.scoring.thresholdCI||[]).join('–')}); ~77% sensitivity, ~87% specificity.`) +
        `<h4>Subscale composition (7 items each)</h4>` +
        tbl(['Subscale','Items'], Object.keys(t.subscales).map(k=>[`${t.subscales[k].name} (${k})`, (t.subscales[k].items||[]).join(', ')])) +
        `<h4>Gender-matched group means, total &amp; subscales, mean (SD)</h4>` +
        tbl(['Gender','Comparison',...KH], rows) +
        src(t.normsSource) + src(t.licence) + `</div>`;
    }

    // ---- CAT-Q ----
    if(REGISTRY.catq){ const t=REGISTRY.catq; const gn=t.genderNorms||{};
      const SK=Object.keys(t.subscales);
      const gLabels={man:'Men',woman:'Women',diverse:'Non-binary'};
      const rows=[];
      for(const g of ['man','woman','diverse']){ if(!gn[g]) continue;
        for(const grp of ['non','aut']){ const d=gn[g][grp]||{};
          rows.push([gLabels[g], grp==='non'?'Non-autistic':'Autistic', d.n||'—',
            ...['total',...SK].map(k=> d[k] ? `${d[k].m} (${d[k].sd})` : '—')]);
        }
      }
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`Total ${t.scoring.totalMin}–${t.scoring.totalMax}. 7-point Likert (1–7). Reverse-scored items: ${(t.scoring.reversed||[]).join(', ')}. <b>No published cut-off</b>; read against the gender-matched group means below.`) +
        `<h4>Subscale composition</h4>` +
        tbl(['Subscale','Items','Range'], SK.map(k=>[t.subscales[k].name, (t.subscales[k].items||[]).join(', '), `${t.subscales[k].min}–${t.subscales[k].max}`])) +
        `<h4>Gender-matched group means, total &amp; subscales, mean (SD)</h4>` +
        tbl(['Gender','Comparison','n','Total',...SK.map(k=>t.subscales[k].name)], rows) +
        note('⚠ The report draws each group’s score distribution, traced from Hull 2020 Figure 1 and Supplementary Figure 1 and matched to the means and SDs above, and reads approximate percentiles from it for women and men. The small non-binary groups (n=27 / n=16, which the authors treat as preliminary) are shown as SD distance.') +
        src(t.normsSource) + src(t.licence) + `</div>`;
    }

    // ---- SQ-A-2 ----
    if(REGISTRY.sqa2){ const t=REGISTRY.sqa2; const nm=t.norms||{};
      const rev = t.items.filter(i=>i.scoredDirection==='disagree').map(i=>i.n).join(', ');
      const strict = t.items.filter(i=>i.strict).map(i=>i.n).join(', ');
      const slight = t.items.filter(i=>!i.strict).map(i=>i.n).join(', ');
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`18-item self-report, total 0–${t.scoring.totalMax}; 4-point scale (Definitely/Slightly · Agree/Disagree), binary scored. <b>No validated cut-off</b>, signposting only, read against the group means below. <b>Reverse-scored</b>: items ${rev}. <b>“Definitely-only”</b> (a “Slightly” answer does not count): items ${strict}. <b>“Slightly-counts”</b>: items ${slight}.`) +
        `<h4>Group means, total 0–${t.scoring.totalMax}, mean (SD)</h4>` +
        tbl(['Group','Mean (SD)','Median','Range'], [
          ['Autistic', ms(nm.autistic), nm.autistic&&nm.autistic.median, nm.autistic&&nm.autistic.range],
          ['Non-autistic', ms(nm.nonAutistic), nm.nonAutistic&&nm.nonAutistic.median, nm.nonAutistic&&nm.nonAutistic.range]
        ]) + src(nm.source) +
        note('⚠ Items 1–14 “Definitely/Slightly” keying confirmed against Jones 2020; items 15–18 inferred to fit the published 10/8 split. Verify against the authors’ scoring syntax if obtained.') +
        `</div>`;
    }

    // ---- RMET ----
    if(REGISTRY.rmet){ const t=REGISTRY.rmet;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`Max ${t.scoring.totalMax} correct; chance = ${t.scoring.chance}. <b>Lower</b> scores are the clinical direction.`) +
        `<h4>Baron-Cohen 2001, group means</h4>` +
        tbl(['Group','Sex','n','Mean','SD'], t.norms.map(n=>[n.group, n.sex, n.n, n.mean, n.sd]));
      const an=t.ageNorms;
      if(an){
        html += `<h4>Kynast 2021, age-group means, mean (SD)</h4>` +
          tbl(['Age band','n','Mean (SD)'], an.bands.map(b=>[b, an.groupMeans[b].n, `${an.groupMeans[b].mean} (${an.groupMeans[b].sd})`])) +
          `<h4>Kynast 2021, percentile ranks by sex × age band</h4>`;
        for(const sex of ['male','female']){
          // union of all raw scores present across this sex's bands, descending
          const allScores=new Set();
          an.bands.forEach(b=>{ const tb=an.pctile[sex][b]; if(tb) Object.keys(tb).forEach(s=>allScores.add(+s)); });
          // open-ended rows print as Table 3 does ("≤12", "≥32")
          const openLbl=s=>{ for(const b of an.bands){ const o=((an.openRows||{})[sex]||{})[b]; if(o&&o.le===s) return '≤'+s; if(o&&o.ge===s) return '≥'+s; } return s; };
          const rows=[...allScores].sort((a,b)=>b-a).map(s=>[openLbl(s), ...an.bands.map(b=>{ const tb=an.pctile[sex][b]; return (tb && tb[s]!=null)?tb[s]:''; })]);
          html += `<details class="norms-details"><summary>${sex==='male'?'Men':'Women'}</summary>${tbl(['Score',...an.bands], rows)}</details>`;
        }
        html += src(an.source) + note('⚠ '+an.caveat);
      }
      html += `</div>`;
    }

    // ---- Vanderbilt ----
    for(const id of ['vand_parent','vand_teacher']){
      const t=REGISTRY[id]; if(!t) continue;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        `<h4>Screens, symptom-count thresholds</h4>` +
        tbl(['Screen','Items','Need ≥','Performance impairment'], t.screens.map(s=>[
          s.name, `${s.items[0]}–${s.items[s.items.length-1]}`, s.need, s.requiresImpairment!==false?'Required':'Not required'])) +
        note(`Symptom items scored 0–3; a symptom “counts” only when rated 2 (Often) or 3 (Very often). Performance items ${t.performanceItems[0]}–${t.performanceItems[t.performanceItems.length-1]} scored 1–5 (4–5 = impairment). ADHD total symptom score uses items ${t.totalSymptomItems[0]}–${t.totalSymptomItems[t.totalSymptomItems.length-1]}.`) +
        `</div>`;
    }

    // ---- SNAP-IV 26 ----
    if(REGISTRY.snap_parent){ const t=REGISTRY.snap_parent; const sc=t.scoring;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>SNAP-IV 26 (parent and teacher)</h2>${src(t.citation)}` +
        `<h4>Subsets, severity bands and suggested target</h4>` +
        tbl(['Subset','Items','Not significant','Mild','Moderate','Severe','Target ≥'], sc.subsets.map(s=>{
          const b=s.bands;
          return [s.name, `${s.items[0]}–${s.items[s.items.length-1]}`,
            `0–${b[0].max}`, `${b[0].max+1}–${b[1].max}`, `${b[1].max+1}–${b[2].max}`, `${b[2].max+1}–${s.max}`, s.target];
        })) +
        note(`Each item scored 0–3 (Not at all / Just a little / Quite a bit / Very much). Subset scores are summed; a subset at or above its target is treated as clinically significant. The ADHD symptom total uses items 1–18 (0–54). The same 26 items are used for the parent and teacher forms. Screening only.`) +
        `</div>`;
    }

    // ---- ASRS ----
    if(REGISTRY.asrs){ const t=REGISTRY.asrs; const sc=t.scoring;
      const lblOf = v => sc.options[v].label;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`Primary interpretation is the <b>Part A</b> 6-item screener cut-off. The 0–18 Symptom-Checklist total has US general-population norms (Adler 2018) for descriptive deviation.`) +
        `<h4>Part A screener, per-item “shaded” threshold</h4>` +
        tbl(['Item','Counts from','Domain'], sc.partA.map(n=>{
          const it=t.items.find(i=>i.n===n);
          return [n, lblOf(sc.partAThresholds[n])+' or higher', t.subscales[it.subscale].name];
        })) +
        note(`Positive screen = <b>${sc.partAPositive} or more</b> of 6 counted items (sensitivity ${(t.screener.sensitivity*100).toFixed(1)}%, specificity ${(t.screener.specificity*100).toFixed(1)}%; ${t.screener.source}).`) +
        `<h4>Domain composition (all 18 items)</h4>` +
        tbl(['Domain','Items','n'], Object.keys(t.subscales).map(k=>[t.subscales[k].name, t.subscales[k].items.join(', '), t.subscales[k].items.length])) +
        note('Items 1, 2, 3, 9, 12, 16 and 18 count as a symptom from <b>Sometimes</b>; the other 11 from <b>Often</b> (Kessler et al. 2005, Table 1). Kessler et al. (2005) also calibrated 18-item cut-points (9 or more symptoms; frequency total 37 or more), but Part A outperformed them, so the frequency total (0–72) is shown descriptively.');
      const an=t.adlerNorms;
      if(an){
        html += `<h4>0–18 Symptom-Checklist total, US general-population norms, mean (SD)</h4>` +
          tbl(['Group','Mean (SD)'], [
            ['General population', `${an.general.mean} (${an.general.sd})`],
            ['Women', `${an.sex.female.mean} (${an.sex.female.sd})`],
            ['Men', `${an.sex.male.mean} (${an.sex.male.sd})`],
            ['Age 18–29', `${an.age['18-29'].mean} (${an.age['18-29'].sd})`],
            ['Age 65+', `${an.age['65+'].mean} (${an.age['65+'].sd})`],
            ['White', `${an.race.White.mean} (${an.race.White.sd})`],
            ['Black', `${an.race.Black.mean} (${an.race.Black.sd})`],
            ['Other race', `${an.race.Other.mean} (${an.race.Other.sd})`],
            ['Hispanic', `${an.hispanic.mean} (${an.hispanic.sd})`]
          ]) +
          note(`Items 1, 2, 3, 9, 12, 16, 18 score a point from “sometimes”; the other 11 from “often”. Subtype symptomatic at ≥${an.subtypeSymptomatic} of 9. Scores bunch near 0 (the floor is less than one SD below the mean), so read as deviation, not a normal-curve percentile.`) +
          src(an.source);
      }
      const inm = t.itemNorms;
      if(inm){
        const g = (grp,n) => inm[grp] && inm[grp][n] ? `${inm[grp][n].m.toFixed(2)} (${inm[grp][n].sd.toFixed(2)})` : '—';
        html += `<h4>Per-item means (SD), on the app's 0–4 answers, by ADHD status (Adler 2018 Table 3, printed means minus 1)</h4>` +
          tbl(['#','Item','ADHD','No ADHD'], t.items.map(it=>[it.n, (inm.labels&&inm.labels[it.n])||('Item '+it.n), g('adhd',it.n), g('noAdhd',it.n)])) +
          note(`Groups: self-reported ADHD n=${inm.groupN.adhd}, no ADHD n=${inm.groupN.noAdhd.toLocaleString()}. Table 3's treated and not-treated columns are not shown: the not-treated column repeats the no-ADHD column (+0.01 to +0.02 on every item), so it is mislabelled. The result report's symptom profile uses the ADHD vs no-ADHD columns; group total/subscale ±1 SD bands are estimated from these item SDs and the Symptom Checklist's internal consistency (Cronbach α≈0.88–0.89), via var(total)=Σσ²ᵢ/(1−α(k−1)/k).`) +
          src(inm.source);
      }
      html += src(t.licence) + `</div>`;
    }

    // ---- BAARS ----
    if(REGISTRY.baars_self){ const t=REGISTRY.baars_self; const sc=t.scoring;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>Barkley Adult ADHD Rating Scale-IV (BAARS-IV)</h2>${src(t.citation)}` +
        note('Proprietary instrument (© Barkley / Guilford Press), embedded for licensed internal clinical use. No norm percentiles are reproduced; scoring is DSM symptom-count only.') +
        `<h4>Scoring rule</h4>` +
        tbl(['Domain','Items','Counts when','Meets at'], [
          ['Inattention (current)', '1–9', 'Often / Very often', `≥${sc.currentThreshold} of 9`],
          ['Hyperactivity–Impulsivity (current)', '10–18', 'Often / Very often', `≥${sc.currentThreshold} of 9`],
          ['Childhood (each domain)', '28–45', 'Often / Very often', `≥${sc.childThreshold} of 9 (onset)`],
          ['Sluggish Cognitive Tempo', '19–27', 'Often / Very often', 'descriptive, no cut-off']
        ]) +
        note(`Current ADHD uses the DSM-5 adult threshold (≥${sc.currentThreshold}); the childhood section uses ≥${sc.childThreshold} to support onset before age 12. SCT is not a DSM diagnosis and does not feed the ADHD count. Pervasiveness (≥2 settings) and impairment are judged clinically. Both self and informant forms use the same rule here.`) +
        src(t.licence) +
        `</div>`;
    }

    // ---- PHQ-9 / GAD-7 ----
    for(const id of ['phq9','gad7']){
      const t=REGISTRY[id]; if(!t) continue;
      const sc=t.scoring;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`Public-domain Pfizer instrument. Items 0–3 summed (0–${sc.totalMax}); conventional severity bands plus German general-population cumulative percentiles. Clinical cut-off ≥${sc.cutoff}.`) +
        `<h4>Severity bands</h4>` +
        tbl(['Range','Band'], sc.severity.map((b,i)=>[t.bandRanges[i], b.label]));
      const N = id==='phq9' ? (typeof PHQ9_NORMS!=='undefined'?PHQ9_NORMS:null) : (typeof GAD7_NORMS!=='undefined'?GAD7_NORMS:null);
      if(N){
        if(id==='phq9'){
          const bands=['14-24','25-34','35-44','45-54','55-64','65-74','75+'];
          const rows=N.total.map((_,s)=>[s, N.total[s], ...bands.map(b=>N.male[b][s]), ...bands.map(b=>N.female[b][s])]);
          html += `<h4>Cumulative percentiles (% at or below score), by sex × age</h4>` +
            `<details class="norms-details"><summary>Score 0–27 · Total, Men (7 bands), Women (7 bands)</summary>` +
            tbl(['Score','Total',...bands.map(b=>'M '+b),...bands.map(b=>'F '+b)], rows) + `</details>`;
        } else {
          const bands=['16-24','25-34','35-44','45-54','55-64','65-74','75+'];
          const rows=N.total.map((_,s)=>[s, N.total[s], ...bands.map(b=>N.age[b][s])]);
          html += `<h4>Cumulative percentiles (% at or below score), by age</h4>` +
            `<details class="norms-details"><summary>Score 0–21 · Total + 7 age bands</summary>` +
            tbl(['Score','Total',...bands], rows) + `</details>`;
        }
        html += note('German general-population norms; cumulative percentile = % scoring at or below each total. A close reference for English-language administration.');
      }
      html += src(t.licence) + `</div>`;
    }

    // ---- SDQ ----
    for(const id of ['sdq_parent','sdq_self']){
      const t=REGISTRY[id]; if(!t) continue;
      const SC=['total','emotional','conduct','hyperactivity','peer','prosocial'];
      const SCH=['Total','Emotional','Conduct','Hyperact.','Peer','Prosocial'];
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}`;
      // four-band cut-offs
      const b=t.scoring.bands;
      const bandRows=Object.keys(b).map(k=>{ const cfg=b[k], c=cfg.cuts;
        if(cfg.dir==='pros') return [`${k} (reversed)`, `${c[0]}–10`, `${c[1]}`, `${c[2]}`, `0–${c[2]-1}`];
        return [k, `0–${c[0]}`, `${c[0]+1}–${c[1]}`, `${c[1]+1}–${c[2]}`, `${c[2]+1}+`];
      });
      html += `<h4>Four-band cut-offs</h4>` + tbl(['Scale','Close to average','Slightly raised','High','Very high'], bandRows) +
        note('Prosocial is reverse-keyed, its four columns read “normal / slightly lowered / low / very low”. Internalising = emotional + peer; externalising = conduct + hyperactivity.');
      // community means
      const mrows=[];
      for(const sex of ['male','female']){ const byAge=t.norms[sex]||{}; for(const ab of Object.keys(byAge)){
        mrows.push([sex==='male'?'Male':'Female', ab, ...SC.map(sc=>ms(byAge[ab][sc]))]); } }
      html += `<h4>Community means, mean (SD)</h4>` + tbl(['Sex','Age band',...SCH], mrows) + src(t.norms.source);
      // percentiles (collapsible)
      if(typeof SDQ_PERCENTILES!=='undefined' && t.percentileKey && SDQ_PERCENTILES[t.percentileKey]){
        const P=SDQ_PERCENTILES[t.percentileKey];
        html += `<h4>Percentiles, cumulative % scoring at or below each raw score</h4>`;
        for(const sexW of Object.keys(P)){ for(const ab of Object.keys(P[sexW])){
          const g=P[sexW][ab];
          const maxLen=Math.max(...SC.map(sc=>g[sc]?g[sc].length:0));
          const prows=[];
          for(let s=0;s<maxLen;s++){ prows.push([s, ...SC.map(sc=> (g[sc] && s<g[sc].length) ? g[sc][s] : '')]); }
          html += `<details class="norms-details"><summary>${sexW} · ${ab}</summary>${tbl(['Score',...SCH], prows)}</details>`;
        }}
      }
      html += `</div>`;
    }

    // ---- LSAS-SR ----
    if(REGISTRY.lsas){ const t=REGISTRY.lsas; const sc=t.scoring;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`24 situations, each rated for Fear (0–3) and Avoidance (0–3) over the past week. Total 0–${sc.totalMax} (Fear 0–72 + Avoidance 0–72). Cut-offs ★ ≥${sc.cutoff} (possible social anxiety disorder) and ≥${sc.cutoff2} (likely generalized).`) +
        `<h4>Severity bands (total score)</h4>` +
        tbl(['Range','Band','Note'], sc.severity.map((b,i)=>[t.bandRanges[i], `${b.label}${(b.label==='Mild')?' ★':''}`, b.note||''])) +
        `<h4>Subscale composition</h4>` +
        tbl(['Subset','Items','Fear range','Avoidance range'], [
          ['Performance', sc.performanceItems.join(', '), '0–39', '0–39'],
          ['Social interaction', sc.socialItems.join(', '), '0–33', '0–33']
        ]) +
        note('Each situation contributes a Fear and an Avoidance point (0–3 each); the app presents these as two consecutive ratings per situation.');
      if(t.safrenFactors){ const sf=t.safrenFactors; const order=sf.order||Object.keys(sf.fear);
        const ms = o => (o && o.norm) ? `${o.norm.mean.toFixed(2)} (${o.norm.sd.toFixed(2)})` : '—';
        html += `<h4>Exploratory four-factor structure (Safren 1999), descriptive only</h4>` +
          tbl(['Factor','Fear items','Avoidance items'], order.map(k=>[sf.fear[k].name, sf.fear[k].items.join(', '), sf.avoid[k].items.join(', ')])) +
          `<h4>Factor scores, unit-weighted item means (Tables 3 &amp; 4)</h4>` +
          tbl(['Factor','Fear M (SD)','Avoid M (SD)','α (F / A)'], order.map(k=>[sf.fear[k].name, ms(sf.fear[k]), ms(sf.avoid[k]), `${sf.fear[k].alpha} / ${sf.avoid[k].alpha}`])) +
          note('Exploratory common factor analysis; fear and avoidance load differently and cross-loading / non-loading items are excluded. Means/SDs are unit-weighted factor scores (item average, 0–3) for the N=382 clinical sample. Not a validated subscale, use the total and the performance/social subscales for interpretation.') +
          src(sf.source);
      }
      html += src(t.licence) + `</div>`;
    }

    // ---- GSQ ----
    if(REGISTRY.gsq){ const t=REGISTRY.gsq; const n=t.norm||{};
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`42 items rated 0–4 (Never…Always) for the last 12 months; total 0–${t.scoring.totalMax}. Higher = more frequent atypical sensory responses (over- and under-responsivity). No clinical cut-off, interpret dimensionally.`) +
        `<h4>Comparison values (total), by group</h4>` +
        tbl(['Group','n','Mean (SD)','Use'], (t.refGroups||[]).map(g=>[g.label, g.n, `${g.mean} (${g.sd})`, g.note||''])) +
        note(`Scoring compares against <b>${n.label||'the non-ASD group'}</b> (n=${n.n}, mean ${n.mean}, SD ${n.sd}). The widely-quoted Robertson &amp; Simmons mean of 56.65 is deliberately <b>not</b> used: that sample was over-recruited for high AQ, so it sits ~14 points (0.6 SD) higher and has no clean interpretation as a comparison group.`) +
        note('A young university convenience sample, not a representative population norm. The self-reported-ASD group (n=23, single unverified item) is recorded for completeness but is deliberately <b>not</b> used as a comparison. Sex-specific values differ by ~0.1 SD, so scoring uses the combined non-ASD figures.') +
        note('<b>Empirical percentiles.</b> The non-ASD group is moderately right-skewed (skewness ≈ +0.67), so it is not normal, but its full score distribution is available (Horder’s N=749 histogram; counts pixel-extracted and cross-checked to reproduce the reported mean 42.77/SD 20.26). The percentile is therefore a guaranteed <b>empirical band</b>: the score’s 10-point bin fixes the bounds directly from that distribution, with no interpolation and no normality assumption. SD distance is shown alongside.') +
        `<h4>Modality &amp; hyper/hypo composition (Robertson &amp; Simmons 2013, Table S3)</h4>` +
        tbl(['Modality','Hyper items','Hypo items'], Object.keys(t.subscales||{}).map(k=>{
          const its=t.subscales[k].items;
          const hy=its.filter(nn=>{const it=t.items.find(x=>x.n===nn);return it&&it.pole==='hyper';});
          const ho=its.filter(nn=>{const it=t.items.find(x=>x.n===nn);return it&&it.pole==='hypo';});
          return [t.subscales[k].name, hy.join(', ')||'—', ho.join(', ')||'—'];
        })) +
        note('GSQ total correlates with the AQ at r≈.78. Item→modality/hyper-hypo from Table S3; Gustatory is 4 hyper / 2 hypo as printed in the source. No clinical cut-off.') +
        src(n.source||'') + src(t.licence) + `</div>`;
    }

    // ---- GSQ-P (parent-completed, child) ----
    if(REGISTRY.gsq_p){ const t=REGISTRY.gsq_p; const cg=t.compareGroups||[];
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`42 items rated 0–4 (Never…Always) by a parent/carer; total 0–${t.scoring.totalMax}, hyper- and hypo-sensitivity 0–84 each. The 24-item rGSQ-P short form (no proprioception; total 0–96) is a separate, briefer administration. Higher = more frequent atypical sensory responses. No published norms or clinical cut-off, so interpret dimensionally.`) +
        `<h4>Published comparison values (total, descriptive only)</h4>` +
        tbl(['Group','n','Mean (SD)'], cg.map(g=>[g.label, g.n||'—', `${g.mean} (${g.sd})`])) +
        note('From James (2025, BYU MSc thesis, all-ages Table 1). Small sample with explicitly non-normal distributions (Mann-Whitney throughout), so no percentiles are derived; the validation paper (Smees et al. 2022, N=601) confirmed SEND > TD on every scale but did not publish group means. The thesis’s age-band tables (its Tables 2–3) are internally inconsistent and are deliberately not used.') +
        `<h4>Modality &amp; hyper/hypo composition (Smees et al. 2022, coding sheet)</h4>` +
        tbl(['Modality','Hyper items','Hypo items'], Object.keys(t.subscales||{}).map(k=>{
          const its=t.subscales[k].items;
          const hy=its.filter(nn=>{const it=t.items.find(x=>x.n===nn);return it&&it.pole==='hyper';});
          const ho=its.filter(nn=>{const it=t.items.find(x=>x.n===nn);return it&&it.pole==='hypo';});
          return [t.subscales[k].name, hy.join(', ')||'—', ho.join(', ')||'—'];
        })) +
        note('Each modality has 6 items (3 hyper / 3 hypo). rGSQ-P items: 2, 6, 8, 9, 10, 12, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 28, 30, 33, 34, 35, 36, 39, 42 (12 hyper / 12 hypo, proprioception excluded).') +
        src((t.norm&&t.norm.source)||'') + src(t.licence) + `</div>`;
    }

    // ---- SPQ (Sensory Perception Quotient) + revised scoring ----
    if(REGISTRY.spq){ const t=REGISTRY.spq; const ON=t.origNorms, RN=t.rsNorms;
      const f=a=>a&&a[0]!=null?`${a[0]} (${a[1]})`:'—';
      const sens=[['Touch','touch'],['Hearing','hearing'],['Vision','vision'],['Smell','smell'],['Taste','taste']];
      const rsRows=[['Hypersensitivity total (0–68)', f(RN.hyper.ascF.total), f(RN.hyper.bap.total), f(RN.hyper.control.total)]]
        .concat(sens.map(([nm,k])=>[`· ${nm} (0–${RN.hyper.sub[k]})`, f(RN.hyper.ascF[k]), f(RN.hyper.bap[k]), f(RN.hyper.control[k])]))
        .concat([['Hyposensitivity total (0–90)', f(RN.hypo.ascF.total), f(RN.hypo.bap.total), f(RN.hypo.control.total)]])
        .concat(sens.map(([nm,k])=>[`· ${nm} (0–${RN.hypo.sub[k]})`, f(RN.hypo.ascF[k]), f(RN.hypo.bap[k]), f(RN.hypo.control[k])]));
      const orow=(label,g)=>[label, f(g.full), f(g.short), f(g.vision), f(g.hearing), f(g.touch), f(g.smell), f(g.taste)];
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>Sensory Perception Quotient (SPQ)</h2>${src(t.citation)}` +
        note(`92 items, 4-point (strongly disagree…strongly agree). <b>Original scoring</b>: item value strongly agree 0 … strongly disagree 3, hyposensitive items reversed; total 0–276, <b>lower = more sensitive</b>; five modality subscales (Vision/Hearing/Touch 0–60, Smell/Taste 0–48). The 35-item short form (0–105) is a subset, same scoring. <b>No population norms and no clinical cut-off</b>. The studies diagnosed via the AQ, not the SPQ.`) +
        note(`Original reverse directions are fully specified: the 13 RS-excluded items are set directly from Tavassoli (2014) Table 4 (italic = reverse-scored), and the 79 RS-scored items are derived from the published revised-scoring key.`) +
        `<h4>Original SPQ: study-sample means, mean (SD) · lower = more sensitive</h4>` +
        tbl(['Group','Full (0–276)','Short (0–105)','Vision','Hearing','Touch','Smell','Taste'], [
          orow('Autistic: both', ON.asc.both), orow('Autistic: male', ON.asc.male), orow('Autistic: female', ON.asc.female),
          orow('Comparison: both', ON.control.both), orow('Comparison: male', ON.control.male), orow('Comparison: female', ON.control.female)
        ]) +
        note('⚠ '+ON.suspect) +
        `<h4>Revised scoring (SPQ-RS): female-only sample, mean (SD) · higher = more atypical</h4>` +
        tbl(['Scale / subdomain','Female ASC','BAP mothers','Comparison mothers'], rsRows) +
        note('Revised scoring: 0 (strongly disagree/disagree) · 1 (agree) · 2 (strongly agree), reverse items flipped; 13 items excluded; two independent scales. ⚠ Reference values are <b>female-only</b> (verbal, clinically-diagnosed ASC), descriptive, not norms, no cut-off.') +
        src(ON.source) + src(RN.source) + src(t.licence) + `</div>`;
    }

    // ---- Coventry Grid ----
    if(REGISTRY.coventry){ const t=REGISTRY.coventry;
      const cats={}; t.items.forEach(it=>{ const c=cats[it.subscale]||(cats[it.subscale]={name:it.category,asd:0,att:0}); if(it.pole==='asd')c.asd++; else c.att++; });
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note('Clinician differential aid, no norms or cut-off. Each behaviour points to one pole; “present” tallies that pole. The two columns below show how many items per domain point each way.') +
        `<h4>Items per pole, by domain</h4>` +
        tbl(['Domain','ASD-consistent','Attachment-consistent'], Object.keys(cats).map(k=>[cats[k].name, cats[k].asd, cats[k].att])) +
        note('Autism and attachment difficulties overlap and can co-occur. A higher count on one side is a prompt for clinical reasoning, never a diagnosis.') +
        src(t.licence) + `</div>`;
    }

    // ---- WFIRS (self + parent) ----
    for(const id of ['wfirs_s','wfirs_p']){ const t=REGISTRY[id]; if(!t) continue;
      const as = t.scoring.adhdScreen;
      const crs = t.scoring.clinicalRefs;
      const pn = t.scoring.popNorms;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note('Items rated 0–3 over the last month (Never … Very often), with N/A excluded from scoring. Interpretation is the per-domain impairment rule below; general-population centile norms (WFIRS-P, ages 6–11) are applied where available.') +
        `<h4>Domains &amp; item counts</h4>` +
        tbl(['Domain','Items'], Object.keys(t.subscales).map(k=>[t.subscales[k].name, t.subscales[k].items.length])) +
        note('A domain is <b>impaired</b> if its mean (excluding N/A) ≥ 1.5, OR ≥ 2 items are rated 2, OR ≥ 1 item is rated 3 (DSM-IV-aligned). Excludes ADHD symptom items so functioning is assessed independently.') +
        (as ? `<h4>ADHD screen (Thompson et al. 2017)</h4>` +
              note(`A separate ADHD-vs-control screen, distinct from the impairment rule above. The overall score is the <b>average of the six domain means</b> (School and learning combined); <b>≥ ${as.cutoff.toFixed(2)} = positive</b> (sensitivity ${(as.sens*100).toFixed(0)}%, specificity ${(as.spec*100).toFixed(0)}%, AUC ${as.auc}). Screening only, not diagnostic; no significant difference by sex or age (5–12 vs 13–19).`) +
              tbl(['Domain (6-domain grouping)','Optimal cut-off ≥ (mean 0–3)','Sensitivity','Specificity'], as.domains.map(d=>[d.name, d.threshold.toFixed(2), d.sens!=null?d.sens.toFixed(2):'—', d.spec!=null?d.spec.toFixed(2):'—']).concat([['Overall', as.cutoff.toFixed(2), as.sens.toFixed(2), as.spec.toFixed(2)]]))
          : '') +
        (crs ? `<h4>Reference samples (severity context)</h4>` +
              note(`Domain mean (SD) per reference group. Severity context only: <b>NOT</b> population norms, <b>NOT</b> cut-offs, and no percentiles (distributions unpublished; scores right-skewed, several non-ADHD SDs exceed their means on a 0-floored scale). The Canu sample scores School over 11 items (this build uses 10) and its ADHD/non-ADHD split used a self-report DSM-5 symptom research cutoff, not clinician diagnosis. Sources: ${crs.map(c=>c.citation).join('; ')}.`) +
              tbl(['Domain'].concat(crs.map(c=>c.short+' M (SD)')),
                  Object.keys(t.subscales).map(k=>[t.subscales[k].name].concat(crs.map(c=>{ const d=c.domains[k]; return d?`${d.mean.toFixed(2)} (${d.sd.toFixed(2)})`:'—'; })))
                    .concat([['Total'].concat(crs.map(c=>`${c.total.mean.toFixed(2)} (${c.total.sd.toFixed(2)})`))]))
          : '') +
        (pn ? `<h4>General-population centile norms (Arildskov et al. 2023)</h4>` +
              note(`Empirical percentiles from ${pn.label} (2,027 children, ages ${pn.ageMin}–${pn.ageMax}). Descriptive general-population comparison, <b>NOT</b> a diagnostic cut-off. The risky-activities domain is not normed and the reference total excludes it. Sex-and-age-stratified norms are applied in-app; the unisex-by-age tables are shown here.`) +
              pn.cells.filter(c=>c.sex===null).map(c=>
                `<p style="margin:10px 0 4px;font-weight:600">Unisex, ages ${c.ageMin}–${c.ageMax} (n=${c.n})</p>` +
                tbl(['Domain','80th','90th','93rd','98th'],
                    pn.normedDomains.map(k=>[ (t.subscales[k]?t.subscales[k].name:k), ...c.domains[k].map(x=>x.toFixed(2)) ])
                      .concat([['Total (excl. risky)', ...c.total.map(x=>x.toFixed(2))]]))
              ).join('')
          : '') +
        src(t.licence) + `</div>`;
    }

    // ---- DSM-5 severity measures (e.g. SAD child) ----
    for(const id of ['sad_child']){
      const t=REGISTRY[id]; if(!t) continue; const sc=t.scoring;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`${t.items.length} items rated 0–${sc.options.length-1} (${sc.options.map(o=>o.label).join(' / ')}) for the past 7 days. Total 0–${sc.totalMax}.`) +
        `<h4>Average Total Score (total ÷ ${t.items.length}), severity anchor</h4>` +
        tbl(['Average','Severity'], sc.anchors.map((a,i)=>[String(i), a])) +
        note('The Average Total Score reduces the total to a 0–4 scale. The APA form gives no rule for a fractional average; the app rounds to the nearest level (x.5 rounds up). Monitoring/severity measure, not diagnostic.') +
        src(t.licence) + `</div>`;
    }

    // ---- WHO ASSIST ----
    if(REGISTRY.assist){ const t=REGISTRY.assist; const sc=t.scoring;
      const bandRow=(name,b)=>[name, `0–${b.mod-1}`, `${b.mod}–${b.high-1}`, `${b.high}+`];
      const fr=sc.optionSets.freq, ur=sc.optionSets.urge, pr=sc.optionSets.problems, fa=sc.optionSets.failrole, co=sc.optionSets.concern;
      html += `<div class="norms-section" data-id="${t.id||''}"><h2>${t.fullName}</h2>${src(t.citation)}` +
        note(`Full WHO ASSIST v3.0 coverage (${(t.substances||[]).length} substance classes including tobacco and alcohol; the injection-risk item Q8 is omitted by clinical decision). Each substance ever used scores 0–${sc.ssiMax}, the Specific Substance Involvement (SSI) score, the sum of six questions; tobacco skips Q5, so its SSI runs 0–31. Screening only: the risk band guides feedback intensity, not diagnosis.`) +
        `<h4>Risk bands, SSI score per substance</h4>` +
        tbl(['Substance','Lower risk','Moderate risk','High risk ★'], [
          bandRow('Alcohol', sc.bands.alcohol),
          bandRow('All other substances', sc.bands.default)
        ]) +
        `<h4>Past-3-month items, points by response</h4>` +
        tbl(['Response','Q2 use','Q3 craving','Q4 problems','Q5 obligations'],
          fr.map((o,i)=>[o.label, fr[i].v, ur[i].v, pr[i].v, fa[i].v])) +
        `<h4>Lifetime items (Q6 concern · Q7 tried to cut down), points by response</h4>` +
        tbl(['Response','Points'], co.map(o=>[o.label, o.v])) +
        src(t.licence) + `</div>`;
    }

    html += `</div>`;
    const root = document.getElementById('view-norms');
    root.innerHTML = html;
    this._normsEnhance(root);
  },

  /* Turns the flat norms page into a browsable one: a card per instrument
     (closed by default) grouped by family, tabs inside each card, a sticky
     search / filter / jump bar, and the master-file sensitivity/specificity
     figures placed in each instrument's Cut-offs tab. Purely presentational:
     every table and note is the same one renderNorms built above. */
  _normsEnhance(root){
    const body = root.querySelector('#nrBody'); if(!body) return;
    const esc = s => this.esc(s);
    const CAT = {autism:'Autism', social:'Social cognition', adhd:'ADHD', mood:'Mood and anxiety', ocd:'OCD',
                 sensory:'Sensory', behaviour:'Behaviour', substance:'Substance use', sleep:'Sleep', trauma:'Trauma', other:'Other'};
    const TABS = [['cut','Cut-offs'],['norm','Group norms'],['pct','Percentiles'],['score','Scoring rules']];
    const classify = h => /percentile|centile/i.test(h) ? 'pct'
      : /mean|norm|comparison|reference|sample/i.test(h) ? 'norm'
      : /cut-?off|threshold|band|screen|risk|target|severity/i.test(h) ? 'cut' : 'score';
    const shortCite = s => {
      const au = (s.match(/^\s*([A-Z][\w'’-]+)/)||[])[1]; const yr = (s.match(/\b(19|20)\d{2}\b/)||[])[0];
      if(!au || !yr) return s;
      const lead = s.slice(0, s.indexOf(yr)).replace(au,'');
      return `${au}${/,|&| and /.test(lead)?' et al.':''} ${yr}`;
    };
    const master = (window.CUTOFFS_MASTER||[]).filter(r=>REGISTRY[r.instrument]);
    const byId = {}; master.forEach(r=>(byId[r.instrument]=byId[r.instrument]||[]).push(r));

    // Instruments with master-file figures but no section of their own get a bare one.
    const secs = [...body.querySelectorAll(':scope > .norms-section')];
    const have = new Set(secs.map(s=>s.dataset.id));
    Object.keys(byId).forEach(id=>{ if(have.has(id)) return; const t=REGISTRY[id];
      const d=document.createElement('div'); d.className='norms-section'; d.dataset.id=id;
      d.innerHTML=`<h2>${t.fullName||t.name}</h2>${t.citation?`<p class="norms-src">${t.citation}</p>`:''}`;
      secs.push(d); });

    const cards = secs.map(sec=>{
      const id = sec.dataset.id, t = REGISTRY[id]||{};
      const h2 = sec.querySelector(':scope > h2'); const name = h2 ? h2.textContent : id;
      const overview = [], groups = {}; let cur = null;
      [...sec.children].forEach(k=>{ if(k===h2) return;
        if(k.tagName==='H4'){ const key=classify(k.textContent); cur=(groups[key]=groups[key]||[]); }
        (cur||overview).push(k); });
      const rows = byId[id]||[];
      if(rows.length || groups.cut){
        const w = document.createElement('div');
        w.innerHTML = rows.length
          ? `<h4>Sensitivity and specificity (master file)</h4><table class="norms-tbl"><thead><tr><th class="rh">Scale</th><th>Cut-off</th><th>Sensitivity</th><th>Specificity</th><th class="rh">Source</th></tr></thead><tbody>${
              rows.map(r=>`<tr><td class="rh">${esc(r.scale)}</td><td>${esc(r.cutoff)}${r.recommended?' ★':''}</td><td>${esc(r.sensitivity)||'—'}</td><td>${esc(r.specificity)||'—'}</td><td class="rh" title="${esc(r.source)}">${esc(shortCite(r.source))}${/^yes$/i.test(r.verified)?' ✓':''}</td></tr>`).join('')
            }</tbody></table><p class="norms-note">From norms/cutoffs.csv at build time. Study-sample figures; they may not carry over to your setting. ✓ checked against the source paper.</p>`
          : `<p class="norms-note nr-gap">No sensitivity or specificity recorded in the master file for this test.</p>`;
        (groups.cut = groups.cut||[]).push(...w.childNodes);
      }
      const tabs = TABS.filter(([k])=>groups[k]);
      const card = document.createElement('details');
      card.className = 'nr-card'; card.id = 'nr-'+id;
      const cat = CAT[t.category] ? t.category : 'other';
      card.dataset.cat = cat;
      card.dataset.tags = [groups.cut&&'cut', groups.pct&&'pct', rows.length&&'sens', !t.verified&&'unv'].filter(Boolean).join(' ');
      const verified = t.verified ? `<span class="nr-badge nr-v">Verified</span>` : `<span class="nr-badge nr-u">Not verified</span>`;
      const summary = tabs.map(([,l])=>l).join(' · ') + (rows.length?' · sens/spec':'');
      card.innerHTML = `<summary class="nr-head"><span class="nr-name">${esc(name)}</span>${verified}<span class="nr-sum">${summary}</span></summary><div class="nr-body"></div>`;
      const cb = card.querySelector('.nr-body');
      overview.forEach(n=>cb.appendChild(n));
      if(tabs.length){
        const bar = document.createElement('div'); bar.className='nr-tabs'; bar.setAttribute('role','tablist');
        tabs.forEach(([k,l],i)=>{ const b=document.createElement('button'); b.type='button'; b.className='nr-tab'+(i?'':' on'); b.dataset.tab=k; b.textContent=l; bar.appendChild(b); });
        cb.appendChild(bar);
        tabs.forEach(([k],i)=>{ const p=document.createElement('div'); p.className='nr-panel'; p.dataset.tab=k; if(i) p.hidden=true; groups[k].forEach(n=>p.appendChild(n)); cb.appendChild(p); });
      }
      card.dataset.search = (name+' '+id+' '+(t.name||'')).toLowerCase();
      return card;
    });

    // Tables: text columns left-aligned and wrapping, numbers right; long tables scroll under a sticky header.
    const isNum = s => /^[\s\d.,%()±≥≤<>=+\-–—−★⚠✓\/]*$/.test(s);
    cards.forEach(c=>c.querySelectorAll('table.norms-tbl').forEach(tb=>{
      const trs=[...tb.querySelectorAll('tbody tr')]; const txtCols=new Set();
      trs.forEach(tr=>[...tr.children].forEach((td,i)=>{ if(i && !isNum(td.textContent)) txtCols.add(i); }));
      tb.querySelectorAll('tr').forEach(tr=>[...tr.children].forEach((c2,i)=>{ if(txtCols.has(i)) c2.classList.add('nr-txt'); }));
      const w=document.createElement('div'); w.className='nr-tw'+(trs.length>14?' nr-tall':'');
      tb.parentNode.insertBefore(w,tb); w.appendChild(tb);
    }));
    // Long citations collapse to one line; click to read in full.
    cards.forEach(c=>c.querySelectorAll('.norms-src').forEach(p=>{ if(p.textContent.length>110){ p.classList.add('nr-clamp'); p.title='Click to show the full reference'; } }));

    // Family groups, in library order.
    const order = Object.keys(CAT).filter(k=>cards.some(c=>c.dataset.cat===k));
    body.innerHTML = '';
    order.forEach(k=>{
      const g=document.createElement('section'); g.className='nr-fam'; g.id='nrf-'+k;
      g.innerHTML=`<h2 class="nr-fam-h">${CAT[k]}</h2>`;
      cards.filter(c=>c.dataset.cat===k).forEach(c=>g.appendChild(c));
      body.appendChild(g);
    });

    // Sticky toolbar: search, filters, family jumps, open/close all.
    const bar = document.createElement('div'); bar.className='nr-bar';
    bar.innerHTML = `<div class="nr-bar-row"><input type="search" class="nr-search" placeholder="Search tests, e.g. OCI or ASRS" aria-label="Search tests" autocomplete="off">
        <span class="nr-count"></span><button type="button" class="nr-btn" data-all="open">Open all</button><button type="button" class="nr-btn" data-all="close">Close all</button></div>
      <div class="nr-bar-row nr-chips">${[['cut','Has cut-offs'],['pct','Has percentiles'],['sens','Has sens/spec'],['unv','Not verified']].map(([k,l])=>`<button type="button" class="nr-chip" data-filter="${k}">${l}</button>`).join('')}
        <span class="nr-sep"></span>${order.map(k=>`<button type="button" class="nr-jump" data-jump="${k}">${CAT[k]}</button>`).join('')}</div>`;
    body.parentNode.insertBefore(bar, body);
    // View switch: the per-test cards, or every sens/spec figure side by side.
    const sw = document.createElement('div'); sw.className='nr-view'; sw.setAttribute('role','tablist');
    sw.innerHTML = `<button type="button" class="nr-view-b on" data-view="tests" role="tab" aria-selected="true">By test</button><button type="button" class="nr-view-b" data-view="compare" role="tab" aria-selected="false">Compare sensitivity and specificity</button>`;
    bar.parentNode.insertBefore(sw, bar);
    const cmp = document.createElement('div'); cmp.className='nr-cmp'; cmp.hidden = true;
    body.parentNode.insertBefore(cmp, body.nextSibling);
    this._nrCompare(cmp, master, shortCite);
    // Stick below the app's sticky top bar and sticky back link. Measured once the
    // view is showing (openNorms calls this after go), since hidden elements measure 0.
    let off = 0;
    this._nrOffsets = () => {
      off = [document.querySelector('.topbar'), root.querySelector('.back-link')]
        .filter(el=>el && getComputedStyle(el).position==='sticky')
        .reduce((m,el)=>Math.max(m, (parseFloat(getComputedStyle(el).top)||0) + el.offsetHeight), 0);
      bar.style.top = off+'px';
    };

    const active = new Set();
    const apply = () => {
      const q = bar.querySelector('.nr-search').value.trim().toLowerCase();
      // Match at the start of a word, so "oci" finds OCI-R but not "social".
      const re = q ? new RegExp('(^|[^a-z0-9])'+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')) : null;
      let n=0;
      cards.forEach(c=>{
        const hit = (!re || re.test(c.dataset.search) || re.test(c.textContent.toLowerCase()))
          && [...active].every(f=>c.dataset.tags.split(' ').includes(f));
        c.hidden = !hit; if(hit) n++;
      });
      body.querySelectorAll('.nr-fam').forEach(g=>{ g.hidden = !g.querySelector('.nr-card:not([hidden])'); });
      bar.querySelector('.nr-count').textContent = `${n} of ${cards.length} tests`;
    };
    root.oninput = e => { if(e.target.classList.contains('nr-search')) apply(); };
    root.onclick = e => {
      const el = e.target.closest('button, .nr-clamp'); if(!el || !root.contains(el)) return;
      if(el.classList.contains('nr-clamp')){ el.classList.toggle('open'); return; }
      if(el.dataset.view){ const c = el.dataset.view==='compare';
        sw.querySelectorAll('.nr-view-b').forEach(b=>{ const on=b===el; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
        bar.hidden = c; body.hidden = c; cmp.hidden = !c; return; }
      if(el.dataset.tab){ const cb=el.closest('.nr-body');
        cb.querySelectorAll('.nr-tab').forEach(b=>b.classList.toggle('on', b===el));
        cb.querySelectorAll('.nr-panel').forEach(p=>{ p.hidden = p.dataset.tab!==el.dataset.tab; }); return; }
      if(el.dataset.filter){ const f=el.dataset.filter; active.has(f)?active.delete(f):active.add(f); el.classList.toggle('on', active.has(f)); apply(); return; }
      if(el.dataset.jump){ const g=document.getElementById('nrf-'+el.dataset.jump); if(g){ g.style.scrollMarginTop = (off + bar.offsetHeight + 8)+'px'; g.scrollIntoView({behavior:'smooth', block:'start'}); } return; }
      if(el.dataset.all){ cards.forEach(c=>{ if(!c.hidden) c.open = el.dataset.all==='open'; }); }
    };
    apply();
  },

  /* Compare view on the Norms reference page: every cut-off with published
     sensitivity/specificity side by side, with the comparison group shown on each
     row (a test looks far better against healthy controls than among referrals),
     likelihood ratios, and PPV/NPV at a base rate the clinician types in. Reads
     window.CUTOFFS_MASTER (norms/cutoffs.csv). */
  _nrCompare(box, master, shortCite){
    const esc = s => this.esc(s);
    const num = v => { const x = parseFloat(String(v==null?'':v).replace(/[~%]/g,'')); return isNaN(x) ? null : (x>1 ? x/100 : x); };
    const condOf = t => { t = String(t||'').toLowerCase();
      if(/autis|asd|asperger/.test(t)) return 'Autism';
      if(/adhd/.test(t)) return 'ADHD';
      if(/odd|conduct|opposit/.test(t)) return 'ODD and conduct';
      if(/ocd|obsess|hoard/.test(t)) return 'OCD';
      if(/ptsd/.test(t)) return 'PTSD';
      if(/insomnia/.test(t)) return 'Insomnia';
      if(/depress/.test(t) && !/anxi/.test(t)) return 'Depression';
      return 'Anxiety'; };
    const ORDER = ['Autism','ADHD','Anxiety','Depression','OCD','ODD and conduct','PTSD','Insomnia'];
    const CLIN = new Set(['clinic referrals','clinical controls']);
    const PILL = {'non-clinical controls':'hc','population sample':'pop','clinic referrals':'clin','clinical controls':'clin','within-disorder':'oth','mixed':'oth'};
    const rows = master.map(r=>({ ...r, se:num(r.sensitivity), sp:num(r.specificity), cond:condOf(r.target),
        test:(REGISTRY[r.instrument]||{}).name||r.instrument, cite:shortCite(r.source||'') }))
      .filter(r=>r.se!=null && r.sp!=null);
    const conds = ORDER.filter(c=>rows.some(r=>r.cond===c));
    const st = { cond:conds[0], clin:false, br:null, sortK:null, sortD:-1, open:null };
    const pct = v => v==null ? '—' : Math.round(v*100)+'%';
    const lr = v => v==null ? '—' : !isFinite(v) ? '∞' : v.toFixed(v<1?2:1);
    box.innerHTML = `<p class="norms-note nr-cmp-lede">Every cut-off with published sensitivity and specificity. Figures from different studies only compare fairly when the comparison group is alike: the same test looks far better against healthy controls than among clinic referrals, so check the <b>Compared with</b> column first. Enter your own referral base rate to see predictive values.</p>
      <div class="nr-bar-row nr-chips" id="nr-cmp-conds"></div>
      <div class="nr-bar-row nr-cmp-ctl">
        <label class="nr-cmp-opt"><input type="checkbox" id="nr-cmp-clin"> Clinical comparisons only (clinic referrals and other diagnoses)</label>
        <label class="nr-cmp-opt nr-cmp-br">Your base rate <input type="number" id="nr-cmp-br" min="1" max="99" step="1" inputmode="numeric" placeholder="%" aria-describedby="nr-cmp-err"> %</label>
      </div>
      <p class="nr-cmp-err" id="nr-cmp-err" role="alert"></p>
      <div class="nr-tw"><table class="norms-tbl nr-cmp-tbl"><thead><tr>${[['test','Test'],['cutoff','Cut-off'],['se','Sens'],['sp','Spec'],['lp','LR+'],['ln','LR−'],['ppv','PPV'],['npv','NPV'],['comparison','Compared with']]
        .map(([k,l],i)=>`<th${i===0?' class="rh"':''}${i===1||i===8?' class="nr-txt"':''} data-sort="${k}" tabindex="0" aria-sort="none">${l}</th>`).join('')}</tr></thead><tbody id="nr-cmp-body"></tbody></table></div>
      <p class="norms-note">Click a row for what the cut-off predicts, the reference standard, the sample and the setting; click a heading to sort. LR+ = sens ÷ (1 − spec); LR− = (1 − sens) ÷ spec. PPV and NPV appear once you enter a base rate. From norms/cutoffs.csv at build time.</p>`;
    const calc = r => { const lp = r.sp>=1 ? Infinity : r.se/(1-r.sp), ln = (1-r.se)/r.sp; let ppv=null, npv=null;
      if(st.br!=null){ const p=st.br/100; ppv = r.se*p/(r.se*p+(1-r.sp)*(1-p)); npv = r.sp*(1-p)/(r.sp*(1-p)+(1-r.se)*p); }
      return { ...r, lp, ln, ppv, npv }; };
    const render = () => {
      box.querySelector('#nr-cmp-conds').innerHTML = conds.map(c=>`<button type="button" class="nr-chip${c===st.cond?' on':''}" data-cond="${esc(c)}" aria-pressed="${c===st.cond}">${esc(c)} <span class="nr-cmp-n">${rows.filter(r=>r.cond===c).length}</span></button>`).join('');
      let shown = rows.filter(r=>r.cond===st.cond && (!st.clin || CLIN.has(r.comparison))).map(calc);
      if(st.sortK) shown.sort((a,b)=>{ const x=a[st.sortK], y=b[st.sortK];
        return (typeof x==='string' || typeof y==='string' ? String(x||'').localeCompare(String(y||'')) : (x??-1)-(y??-1)) * st.sortD; });
      box.querySelectorAll('th[data-sort]').forEach(th=>th.setAttribute('aria-sort', th.dataset.sort===st.sortK ? (st.sortD>0?'ascending':'descending') : 'none'));
      box.querySelector('#nr-cmp-body').innerHTML = shown.length ? shown.map(r=>{
        const key = [r.instrument,r.scale,r.cutoff,r.source,r.reference_standard].join('|');
        const n = r.n_cases ? `${r.n_cases} cases, ${r.n_noncases} non-cases` : 'counts not printed in the paper';
        return `<tr class="nr-cmp-row${st.open===key?' open':''}" data-key="${esc(key)}" tabindex="0" aria-expanded="${st.open===key}">
            <td class="rh">${esc(r.test)}<span class="nr-cmp-sub">${esc(r.scale)} · ${esc(r.cite)}${r.figure_type==='derived'?' · derived':''}${/^yes$/i.test(r.verified)?' ✓':''}</span></td>
            <td class="nr-txt">${esc(r.cutoff)}</td><td>${pct(r.se)}</td><td>${pct(r.sp)}</td><td>${lr(r.lp)}</td><td>${lr(r.ln)}</td><td>${pct(r.ppv)}</td><td>${pct(r.npv)}</td>
            <td class="nr-txt"><span class="nr-cmp-pill nr-cmp-${PILL[r.comparison]||'oth'}">${esc(r.comparison||'not recorded')}</span></td></tr>` +
          (st.open===key ? `<tr class="nr-cmp-det"><td colspan="9"><b>Predicts:</b> ${esc(r.target||'')} · <b>Reference standard:</b> ${esc(r.reference_standard||'')} · <b>Sample:</b> ${esc(n)}<br><b>Setting:</b> ${esc(r.setting||'')}<br><b>Source:</b> ${esc(r.source||'')}</td></tr>` : '');
      }).join('') : `<tr><td colspan="9" class="nr-txt">No figures from clinical samples for this condition yet.</td></tr>`;
    };
    const toggleRow = tr => { const k=tr.dataset.key; st.open = st.open===k ? null : k; render(); };
    const sortBy = th => { const k=th.dataset.sort; st.sortD = st.sortK===k ? -st.sortD : -1; st.sortK = k; render(); };
    box.addEventListener('click', e=>{
      const c=e.target.closest('[data-cond]'); if(c){ st.cond=c.dataset.cond; st.open=null; render(); return; }
      const th=e.target.closest('th[data-sort]'); if(th){ sortBy(th); return; }
      const tr=e.target.closest('tr.nr-cmp-row'); if(tr) toggleRow(tr);
    });
    box.addEventListener('keydown', e=>{ if(e.key!=='Enter' && e.key!==' ') return;
      const th=e.target.closest('th[data-sort]'), tr=e.target.closest('tr.nr-cmp-row');
      if(th||tr){ e.preventDefault(); th ? sortBy(th) : toggleRow(tr); } });
    box.querySelector('#nr-cmp-clin').addEventListener('change', e=>{ st.clin=e.target.checked; render(); });
    box.querySelector('#nr-cmp-br').addEventListener('input', e=>{
      const raw=e.target.value.trim(), err=box.querySelector('#nr-cmp-err'); err.textContent='';
      if(raw===''){ st.br=null; }
      else { const v=+raw; if(v>=1 && v<=99) st.br=v; else { st.br=null; err.textContent='Enter a base rate between 1 and 99%.'; } }
      render(); });
    render();
  },

  /* ---------- utils ---------- */
  esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
};

/* global keyboard entry for the runner */
document.addEventListener('keydown', function(e){ App.handleKey(e); });


/* ════════════════════════════════════════════════════════════
   RESULTS DASHBOARD
   Reads State.result + State.currentTest and renders a full
   clinical results page with normative comparisons.
   ════════════════════════════════════════════════════════════ */

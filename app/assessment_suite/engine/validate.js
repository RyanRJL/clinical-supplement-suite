/* ── Registry / norms integrity validator ────────────────────────────────────────
   Pure, dependency-free. Walks every instrument and checks the data obeys rules
   that must ALWAYS hold, so a typo, swapped value, bad refactor, or truncated
   table can't ship silently. Returns {errors:[], warnings:[]} and NEVER throws.

   Two failure tiers:
     • error   — structurally/numerically invalid; blocks the offline build.
     • warning — suspicious but not provably wrong; surfaced, non-blocking.

   It checks that data is INTERNALLY CONSISTENT and WELL-FORMED. It does NOT check
   that a number is the right number from the source paper — that's the job of the
   CSV oracle (scripts/oracle.cjs), which diffs the registry against the values you
   have personally verified.

   Runs blocking at build time (scripts/validate.cjs, invoked by build.py) and
   console-only / non-blocking at app boot (bottom of this file).
─────────────────────────────────────────────────────────────────────────────── */
function validateRegistry(reg, ctx){
  ctx = ctx || {};
  const errors = [], warnings = [];
  const E = (id, rule, msg) => errors.push({id, rule, msg, severity:'error'});
  const W = (id, rule, msg) => warnings.push({id, rule, msg, severity:'warning'});
  const num = v => typeof v === 'number' && isFinite(v);
  const SCORING_TYPES = ctx.scoringTypes || null;   // null = skip type-name check

  /* recursive numeric sweep: no NaN/Infinity anywhere; sd>0; n>0 */
  const sweep = (id, node, p) => {
    if(node == null || typeof node !== 'object') return;
    if(Array.isArray(node)){ node.forEach((v,i)=>sweep(id, v, p+'['+i+']')); return; }
    for(const k of Object.keys(node)){
      const v = node[k], pp = p ? p+'.'+k : k;
      if(typeof v === 'number'){
        if(!isFinite(v)) E(id, 'value', pp+' is '+v+' (not a finite number)');
        else if(k === 'sd' && v <= 0) E(id, 'value', pp+'='+v+' (sd must be > 0)');
        else if(k === 'n'  && (v <= 0 || v % 1 !== 0)) E(id, 'value', pp+'='+v+' (n must be a positive integer)');
      } else if(v && typeof v === 'object') sweep(id, v, pp);
    }
  };

  /* a cumulative-percentile array: right length, every value 0–100, non-decreasing */
  const checkCum = (id, name, a, expectLen) => {
    if(!Array.isArray(a)) return;
    if(expectLen != null && a.length !== expectLen) E(id, 'pctile', name+' length '+a.length+' != expected '+expectLen);
    let prev = -Infinity;
    a.forEach((v,i)=>{
      if(typeof v !== 'number' || !isFinite(v) || v < 0 || v > 100) E(id, 'pctile', name+'['+i+']='+v+' out of [0,100]');
      else { if(v < prev - 1e-9) E(id, 'pctile', name+' decreases at index '+i+' ('+prev+' → '+v+'); cumulative % must not drop'); prev = v; }
    });
  };

  for(const id of Object.keys(reg)){
    const t = reg[id];
    if(!t || typeof t !== 'object'){ E(id, 'instrument', 'not an object'); continue; }

    sweep(id, t, '');

    // Clinician-administered interview modules (DIVA-5 family) have a bespoke engine,
    // no scored items and no scoring block — skip the scoring/item structural checks.
    if(t.format === 'interview') continue;

    const sc = t.scoring || {};
    const st = sc.type;
    if(!st) E(id, 'scoring', 'missing scoring.type');
    else if(SCORING_TYPES && !SCORING_TYPES.includes(st)) E(id, 'scoring', 'unknown scoring.type "'+st+'"');

    /* items: each item.n a unique positive integer */
    let itemNs = null;
    if(Array.isArray(t.items) && t.items.length){
      itemNs = new Set();
      for(const it of t.items){
        if(!num(it.n) || it.n <= 0 || it.n % 1 !== 0){ E(id, 'items', 'item with invalid n: '+JSON.stringify(it.n)); continue; }
        if(itemNs.has(it.n)) E(id, 'items', 'duplicate item n='+it.n);
        itemNs.add(it.n);
      }
    } else if(!['assist','diva','young_diva','coventry'].includes(st)){
      W(id, 'items', 'no items array');
    }

    /* subscales */
    if(t.subscales && typeof t.subscales === 'object' && itemNs){
      const subKeys = new Set(Object.keys(t.subscales));
      // (a) any subscale that lists items[] must reference real, non-duplicated items
      for(const k of subKeys){
        const sub = t.subscales[k];
        if(sub && Array.isArray(sub.items)){
          const seen = new Set();
          for(const n of sub.items){
            if(!itemNs.has(n)) E(id, 'subscale', 'subscale "'+k+'" references item '+n+' that is not in items[]');
            if(seen.has(n)) W(id, 'subscale', 'subscale "'+k+'" lists item '+n+' twice');
            seen.add(n);
          }
        }
      }
      // (b) any item.subscale tag must name a real subscale
      const fromTags = {};
      for(const it of t.items){
        if(it.subscale != null){
          if(!subKeys.has(it.subscale)) E(id, 'subscale', 'item '+it.n+' tagged unknown subscale "'+it.subscale+'"');
          (fromTags[it.subscale] = fromTags[it.subscale] || new Set()).add(it.n);
        }
      }
      // (c) where BOTH the items[] list AND item.subscale tags exist, they must agree
      for(const k of subKeys){
        const sub = t.subscales[k];
        if(sub && Array.isArray(sub.items) && fromTags[k]){
          const listed = new Set(sub.items), tagged = fromTags[k];
          const onlyListed = [...listed].filter(n=>!tagged.has(n));
          const onlyTagged = [...tagged].filter(n=>!listed.has(n));
          if(onlyListed.length || onlyTagged.length)
            E(id, 'subscale', 'subscale "'+k+'" items[] disagree with item.subscale tags (only in items[]: ['+onlyListed+'], only in tags: ['+onlyTagged+'])');
        }
      }
    }

    /* options needed for index-based scoring */
    if(st === 'binary' || st === 'likert'){
      const o = sc.options;
      if(!Array.isArray(o) || !o.length) E(id, 'options', st+' scoring needs scoring.options');
      else if(st === 'likert' && !o.every(x=>num(x && x.base))) E(id, 'options', 'a likert option is missing a numeric base');
      else if(st === 'binary' && !o.every(x=>typeof (x && x.agree) === 'boolean')) E(id, 'options', 'a binary option is missing a boolean agree');
    }

    /* totalMax sanity + structural cross-checks */
    if(num(sc.totalMax)){
      if(sc.totalMax <= 0) E(id, 'totalMax', 'totalMax '+sc.totalMax+' is not positive');
      if(itemNs){
        if(st === 'rmet' && sc.totalMax !== itemNs.size) E(id, 'totalMax', 'rmet totalMax '+sc.totalMax+' != item count '+itemNs.size);
        if(st === 'cati' && sc.totalMax !== itemNs.size*5) E(id, 'totalMax', 'cati totalMax '+sc.totalMax+' != items×5 ('+itemNs.size*5+')');
        if(st === 'catq' && sc.totalMax !== itemNs.size*7) E(id, 'totalMax', 'catq totalMax '+sc.totalMax+' != items×7 ('+itemNs.size*7+')');
        if(st === 'catq' && sc.totalMin !== itemNs.size) E(id, 'totalMax', 'catq totalMin '+sc.totalMin+' != item count '+itemNs.size);
        if(st === 'binary' && sc.totalMax !== itemNs.size) E(id, 'totalMax', 'binary totalMax '+sc.totalMax+' != item count '+itemNs.size);
        if(st === 'oci'){
          if(!num(sc.itemMax) || sc.itemMax <= 0) E(id, 'totalMax', 'oci scoring needs a positive scoring.itemMax');
          else if(sc.totalMax !== itemNs.size*sc.itemMax) E(id, 'totalMax', 'oci totalMax '+sc.totalMax+' != items×itemMax ('+itemNs.size+'×'+sc.itemMax+'='+(itemNs.size*sc.itemMax)+')');
        }
      }
    }

    /* flagItem (e.g. PHQ-9 item 9, self-harm) must reference a real item — else the
       safety flag reads answers[missing]=null and SILENTLY never fires */
    if(sc.flagItem != null && itemNs && !itemNs.has(sc.flagItem))
      E(id, 'flagItem', 'scoring.flagItem '+sc.flagItem+' is not in items[] (safety flag would never fire)');

    /* explicit reverse-scored item lists must reference real items (a stray index is
       a silent no-op that masks a real keying error) */
    if(Array.isArray(sc.reversed) && itemNs)
      for(const n of sc.reversed) if(!itemNs.has(n)) E(id, 'reversed', 'scoring.reversed lists item '+n+' not in items[]');

    /* index/base scoring: the options must span the whole scored range, i.e.
       items × (per-item max) must equal totalMax. Catches a truncated options array
       (runtime crash reading options[value].label) and a wrong totalMax denominator. */
    if((st === 'screener' || st === 'likert') && itemNs && Array.isArray(sc.options) && sc.options.length && num(sc.totalMax)){
      const perItem = st === 'likert' ? Math.max(...sc.options.map(o=>num(o && o.base) ? o.base : 0)) : sc.options.length - 1;
      // unscored items (e.g. the PHQ-9 closing difficulty question) are not in the total
      const nScored = (t.items||[]).filter(it => !it.unscored).length || itemNs.size;
      if(nScored * perItem !== sc.totalMax)
        E(id, 'totalMax', st+' totalMax '+sc.totalMax+' != scored items×perItemMax ('+nScored+'×'+perItem+'='+(nScored*perItem)+') — check options length / totalMax');
    }

    /* a subscale's declared max must match its membership × per-item max, or every
       percentage computed against it uses the wrong denominator */
    if(t.subscales && itemNs){
      // types whose per-item max is fixed, plus `oci` whose per-item max is declared
      // per form (adult OCI-R rates 0–4, the child forms 0–2 — they are NOT parallel)
      const perItemMax = st === 'oci' ? sc.itemMax : { binary:1, sdq:2, cati:5, catq:7 }[st];
      if(num(perItemMax)) for(const k of Object.keys(t.subscales)){
        const sub = t.subscales[k];
        const cnt = Array.isArray(sub && sub.items) ? sub.items.length : t.items.filter(it=>it.subscale===k).length;
        if(num(sub && sub.max) && cnt && sub.max !== cnt*perItemMax)
          E(id, 'subscale', 'subscale "'+k+'" max '+sub.max+' != members×perItemMax ('+cnt+'×'+perItemMax+'='+(cnt*perItemMax)+')');
      }
    }

    /* ordered severity bands: ascending max, open final band */
    if(Array.isArray(sc.severity)){
      let prev = -Infinity, sawOpen = false;
      sc.severity.forEach((b,i)=>{
        if(b.max == null){ sawOpen = true; if(i !== sc.severity.length-1) E(id, 'severity', 'open band (max=null) is not last'); }
        else if(!num(b.max)) E(id, 'severity', 'band max not numeric');
        else { if(b.max < prev) E(id, 'severity', 'band max '+b.max+' < previous '+prev+' (not ascending)'); prev = b.max; }
      });
      if(!sawOpen) W(id, 'severity', 'no open final band (max=null); top scores may be unbanded');
    }
    if(num(sc.cutoff) && num(sc.totalMax) && (sc.cutoff < 0 || sc.cutoff > sc.totalMax))
      E(id, 'cutoff', 'cutoff '+sc.cutoff+' outside [0,'+sc.totalMax+']');

    /* ASRS Part A screener */
    if(st === 'asrs' && itemNs && Array.isArray(sc.partA)){
      for(const n of sc.partA) if(!itemNs.has(n)) E(id, 'partA', 'partA item '+n+' not in items');
      if(sc.partAThresholds) for(const n of sc.partA) if(!num(sc.partAThresholds[n])) E(id, 'partA', 'partAThresholds missing item '+n);
      if(num(sc.partAPositive) && sc.partAPositive > sc.partA.length) E(id, 'partA', 'partAPositive '+sc.partAPositive+' > partA length '+sc.partA.length);
    }

    /* Vanderbilt item lists */
    if(st === 'vanderbilt' && itemNs){
      for(const key of ['performanceItems','totalSymptomItems'])
        if(Array.isArray(t[key])) for(const n of t[key]) if(!itemNs.has(n)) E(id, 'vanderbilt', key+' item '+n+' not in items');
      if(Array.isArray(t.screens)) t.screens.forEach(s=>{
        if(Array.isArray(s.items)) for(const n of s.items) if(!itemNs.has(n)) E(id, 'vanderbilt', 'screen "'+s.key+'" item '+n+' not in items');
      });
    }
  }

  /* RMET age × sex percentile grid: 0–100 and non-decreasing with score */
  const rm = reg.rmet;
  if(rm && rm.ageNorms && rm.ageNorms.pctile){
    const P = rm.ageNorms.pctile;
    for(const sex of Object.keys(P)) for(const band of Object.keys(P[sex])){
      const grid = P[sex][band], scores = Object.keys(grid).map(Number).sort((a,b)=>a-b);
      let prev = -Infinity;
      for(const s of scores){
        const v = grid[s];
        if(typeof v !== 'number' || !isFinite(v) || v < 0 || v > 100) E('rmet', 'pctile', 'ageNorms.pctile.'+sex+'.'+band+'['+s+']='+v+' out of [0,100]');
        else { if(v < prev - 1e-9) E('rmet', 'pctile', 'ageNorms.pctile.'+sex+'.'+band+' decreases at score '+s+' ('+prev+' → '+v+')'); prev = v; }
      }
    }
  }

  /* global cumulative-% lookup tables (PHQ-9 / GAD-7 / SDQ) */
  const PHQ = ctx.PHQ9_NORMS, GAD = ctx.GAD7_NORMS, SDQ = ctx.SDQ_PERCENTILES;
  if(PHQ){
    const L = num(PHQ.scoreMax) ? PHQ.scoreMax+1 : null;
    checkCum('phq9', 'total', PHQ.total, L);
    for(const g of ['male','female']) if(PHQ[g]) for(const b of Object.keys(PHQ[g])) checkCum('phq9', g+'.'+b, PHQ[g][b], L);
  }
  if(GAD){
    const L = num(GAD.scoreMax) ? GAD.scoreMax+1 : null;
    checkCum('gad7', 'total', GAD.total, L);
    if(GAD.age) for(const b of Object.keys(GAD.age)) checkCum('gad7', 'age.'+b, GAD.age[b], L);
  }
  if(SDQ){
    for(const resp of Object.keys(SDQ)) for(const sex of Object.keys(SDQ[resp])) for(const age of Object.keys(SDQ[resp][sex])) for(const scale of Object.keys(SDQ[resp][sex][age]))
      checkCum('sdq', resp+'.'+sex+'.'+age+'.'+scale, SDQ[resp][sex][age][scale], null);
  }

  return {errors, warnings};
}

/* App boot: run it, console-only, never blocking. Patients never see the console;
   for a clinician/dev it surfaces any problem immediately. */
if(typeof window !== 'undefined' && typeof REGISTRY !== 'undefined'){
  try{
    const r = validateRegistry(REGISTRY, {
      PHQ9_NORMS:      typeof PHQ9_NORMS      !== 'undefined' ? PHQ9_NORMS      : null,
      GAD7_NORMS:      typeof GAD7_NORMS      !== 'undefined' ? GAD7_NORMS      : null,
      SDQ_PERCENTILES: typeof SDQ_PERCENTILES !== 'undefined' ? SDQ_PERCENTILES : null,
      scoringTypes:    typeof Scoring         !== 'undefined' ? Object.keys(Scoring).filter(k=>typeof Scoring[k]==='function' && k!=='run') : null
    });
    if(r.errors.length)   console.error('[validateRegistry] '+r.errors.length+' ERROR(s) — these would block an offline build:', r.errors);
    if(r.warnings.length) console.warn('[validateRegistry] '+r.warnings.length+' warning(s):', r.warnings);
    if(!r.errors.length && !r.warnings.length) console.info('[validateRegistry] OK — all instruments passed integrity checks.');
  }catch(e){ console.warn('[validateRegistry] check skipped:', e && e.message); }
}
if(typeof module !== 'undefined' && module.exports) module.exports = { validateRegistry };

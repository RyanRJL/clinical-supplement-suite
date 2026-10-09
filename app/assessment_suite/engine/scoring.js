/* ── Scoring Engine ─────────────────────────────────────────────────────────────
   Three scoring algorithms (binary, likert, mean) + z→percentile.
─────────────────────────────────────────────────────────────────────────────── */

const Scoring = {
  binary(test, answers){
    let total = 0;
    const subs = {};
    for(const k in test.subscales) subs[k] = {raw:0, max:test.subscales[k].max, name:test.subscales[k].name};
    for(const item of test.items){
      const oi = answers[item.n];
      if(oi==null) continue;
      const opt = test.scoring.options[oi];
      let scored = (item.scoredDirection==='agree' && opt.agree) ||
                   (item.scoredDirection==='disagree' && !opt.agree);
      // 'strict' (Definitely-only) items: a merely "Slightly" answer in the
      // scored direction does NOT count (SQ-A/SQ-A-2 DISCO weighting). Items
      // without a `strict` flag are unaffected.
      if(scored && item.strict && opt.strong===false) scored = false;
      if(scored){ total++; if(item.subscale && subs[item.subscale]) subs[item.subscale].raw++; }
    }
    // uncertainty range for items whose Definitely/Slightly rule is provisional
    // (e.g. SQ-A-2 items 15–18): exactly `provisionalSlightlyCount` of them are
    // truly "Slightly-counts", so the inferred keying can shift the total. Only
    // a "Slightly"-in-direction answer on such an item is affected.
    let range = null;
    const prov = test.items.filter(it=>it.provisional);
    if(prov.length){
      const slightHit = it=>{ const o=answers[it.n]; if(o==null) return false; const opt=test.scoring.options[o];
        const endorses = (it.scoredDirection==='agree'&&opt.agree)||(it.scoredDirection==='disagree'&&!opt.agree);
        return endorses && opt.strong===false; };
      const hits = prov.filter(slightHit);
      const countedNow = prov.filter(it=>!it.strict && slightHit(it)).length;   // currently scored via a "Slightly"
      const k = test.scoring.provisionalSlightlyCount!=null ? test.scoring.provisionalSlightlyCount : prov.length;
      const low = total - countedNow;
      const high = low + Math.min(k, hits.length);
      if(high!==low) range = {low, high};
    }
    return {total, totalMax:test.scoring.totalMax, subscales:subs, range};
  },

  likert(test, answers){
    let total = 0;
    const subs = {};
    for(const k in test.subscales) subs[k] = {raw:0, max:test.subscales[k].max, name:test.subscales[k].name};
    for(const item of test.items){
      const oi = answers[item.n];
      if(oi==null) continue;
      const base = test.scoring.options[oi].base;
      const val = item.reverse ? (3-base) : base;
      total += val; if(subs[item.subscale]) subs[item.subscale].raw += val;
    }
    return {total, totalMax:test.scoring.totalMax, subscales:subs};
  },

  mean(test, answers){
    const subVals = {};
    for(const k in test.subscales) subVals[k] = [];
    const all = [];
    for(const item of test.items){
      const v = answers[item.n];
      if(v==null) continue;
      all.push(v); if(subVals[item.subscale]) subVals[item.subscale].push(v);
    }
    const mean = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const subs = {};
    for(const k in test.subscales){
      subs[k] = {raw:mean(subVals[k]), max:test.scoring.scaleMax, name:test.subscales[k].name};
    }
    return {total:mean(all), totalMax:test.scoring.totalMax, subscales:subs, isMean:true};
  },

  /* SCI-08 (Sleep Condition Indicator): 8 items each scored 0–4 (higher = better
     sleep), summed to a 0–32 total. Items render via optionSets that store the
     VALUE, so answers[n] IS the item score. REVERSE-directioned: a LOW total means
     more difficulty — a total at or below the cut-off (16) screens POSITIVE for
     probable insomnia disorder (Espie et al. 2014). SCI-02 short form = the two
     shortItems (3 + 7), 0–8. No subscales. */
  sci(test, answers){
    const sc = test.scoring;
    let total = 0, answered = 0;
    for(const item of test.items){ const v = answers[item.n]; if(v != null){ total += v; answered++; } }
    const shortItems = sc.shortItems || [];
    const hasShort = shortItems.length>0 && shortItems.every(n => answers[n] != null);
    const short = shortItems.reduce((s,n) => s + (answers[n] || 0), 0);
    return { total, totalMax:sc.totalMax, answered,
             short, shortMax:sc.shortMax, hasShort,
             positive: (sc.cutoff != null && total <= sc.cutoff),   // low = insomnia
             cutoff: sc.cutoff, lowerIsWorse:true, subscales:{}, isSci:true };
  },

  /* RBQ-3 (Repetitive Behaviours Questionnaire-3): 20 items scored 1–4 (item
     20: 1–3) via optionSets storing the VALUE. Reported as MEAN scores
     (1.00–4.00) per the Cardiff manual: Mean Total over all 20 items AND over
     Q1–19 (subscales use Q1–19 only; Q20 is explored separately, so its raw
     answer is carried through). Two-factor subscale means come from
     test.scoring.factors — the version-appropriate published RBQ-2/2A
     solution. Deliberately NO cut-off (quantitative measure, not a screener)
     — positive is always null. */
  rbq3(test, answers){
    const sc = test.scoring;
    const vals = {};
    let answered = 0;
    for(const item of test.items){ const v = answers[item.n]; if(v != null){ vals[item.n] = v; answered++; } }
    const round2 = v => v==null ? null : Math.round(v*100)/100;
    const mean = ns => {
      const a = ns.filter(n => vals[n] != null).map(n => vals[n]);
      return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
    };
    const all = test.items.map(i => i.n);
    const mean20 = round2(mean(all));
    const mean19 = round2(mean(all.filter(n => n !== 20)));
    const subs = {};
    for(const k in (sc.factors || {})){
      const f = sc.factors[k];
      subs[k] = { raw: round2(mean(f.items)), max: sc.scaleMax, name: f.name, nItems: f.items.length, isMean: true };
    }
    return { total: mean20, totalMax: sc.scaleMax, mean20, mean19, answered,
             activity: vals[20] != null ? vals[20] : null,
             subscales: subs, positive: null, isRbq3: true };
  },

  /* SDQ (Strengths & Difficulties Questionnaire): 3-point items (0/1/2) summed
     into five 5-item subscales, with five reverse-scored items. Total Difficulties
     = emotional+conduct+hyperactivity+peer (0–40); prosocial is separate.
     Each scale is banded with the official four-band cut-offs (version-specific). */
  sdq(test, answers){
    const subs = {};
    for(const k in test.subscales) subs[k] = {raw:0, answered:0, max:test.subscales[k].max||10, name:test.subscales[k].name};
    for(const item of test.items){
      const oi = answers[item.n];
      if(oi==null) continue;
      const val = item.reverse ? (2 - oi) : oi;   // option index 0/1/2 == score; reverse inverts
      const s = subs[item.subscale];
      s.raw += val; s.answered++;
    }
    // Missing items (scoring instructions p.1-2): a scale with at least 3 of its
    // items answered is scaled up pro rata (sum x items / answered, rounded to the
    // nearest whole number); with fewer it is missing, and so is any total built
    // on it. With every item answered this is the plain sum.
    const notScoreable = [];
    for(const k in subs){
      const s = subs[k], nIt = test.items.filter(it => it.subscale===k).length;
      s.nItems = nIt;
      if(s.answered < nIt){
        if(s.answered >= 3) s.raw = Math.round(s.raw * nIt / s.answered);
        else { s.raw = null; notScoreable.push(k); }
      }
    }
    const sumOf = keys => keys.some(k => !subs[k] || subs[k].raw==null) ? null : keys.reduce((a,k)=>a+subs[k].raw, 0);
    const total = sumOf(test.scoring.difficultyScales);
    const internalising = sumOf(['emotional','peer']);        // 0–20
    const externalising = sumOf(['conduct','hyperactivity']); // 0–20
    const B = test.scoring.bands;
    const bands = {};
    for(const k in subs) if(B[k] && subs[k].raw!=null) bands[k] = sdqBand(subs[k].raw, B[k]);
    if(total!=null) bands.total = sdqBand(total, B.total);
    if(B.internalising && internalising!=null) bands.internalising = sdqBand(internalising, B.internalising);
    if(B.externalising && externalising!=null) bands.externalising = sdqBand(externalising, B.externalising);
    return {total, totalMax:40, subscales:subs, internalising, externalising, bands, notScoreable, isSdq:true};
  },

  /* RCADS (child self-report + parent version): 0–3 items summed into six
     DSM-linked subscales, plus Total Anxiety (all subscales except MDD, 0–111)
     and Total Internalising (all 47 items, 0–141). Raw→T conversion is by
     gender and grade band, resolved in the results layer from RCADS_TSCORES.

     Missing-data prorating follows the official UCLA manual-scoring rule
     (rcads.ucla.edu/manualscoring): a scale is scoreable only if ≤2 of its
     items are missing (Total Anxiety additionally ≤10 missing, Total
     Internalising ≤12, each with no subscale over 2). The prorated raw =
     round(sum of completed items / number completed × items in the scale). With
     zero missing (the normal, completion-enforced runner path) this reduces to
     a plain sum, so complete administrations are unaffected. An unscoreable
     scale returns raw:null (no T lookup, omitted from the profile).

     Item 37 (thinks about death) is surfaced for safety review (flag →
     needs_review), mirroring the PHQ-9 item-9 pattern. */
  rcads(test, answers){
    const sc = test.scoring, subDef = test.subscales;
    const prorate = (sum, ans, nItems) => Math.round(sum / ans * nItems);   // exact sum when ans===nItems
    // per-subscale: prorated raw, unscoreable when >2 missing
    const subs = {};
    for(const k in subDef){
      const items = subDef[k].items;
      let sum = 0, ans = 0;
      for(const n of items){ const v = answers[n]; if(v != null){ sum += v; ans++; } }
      const missing = items.length - ans;
      const raw = (ans === 0 || missing > 2) ? null : prorate(sum, ans, items.length);
      const exact = raw==null ? null : sum / ans * items.length;   // UCLA looks T up from the unrounded value
      subs[k] = {raw, exact, sum, answered:ans, missing, nItems:items.length, max:subDef[k].max, name:subDef[k].name, scoreable:raw!=null};
    }
    // total scales prorate over their own item sets, with their own missing caps
    const totalScale = (keys, missCap) => {
      let sum = 0, ans = 0, nItems = 0, subOK = true;
      for(const k of keys){ sum += subs[k].sum; ans += subs[k].answered; nItems += subs[k].nItems; if(subs[k].missing > 2) subOK = false; }
      const missing = nItems - ans;
      const raw = (ans === 0 || missing > missCap || !subOK) ? null : prorate(sum, ans, nItems);
      return {raw, exact: raw==null ? null : sum / ans * nItems, sum, answered:ans, missing, nItems, scoreable:raw!=null};
    };
    const anxKeys = Object.keys(subDef).filter(k => k !== 'mdd');   // 5 anxiety subscales, 37 items
    const totAnx = totalScale(anxKeys, 10);
    const totInt = totalScale(Object.keys(subDef), 12);            // all 47 items
    let flag = null;
    if(sc.flagItem){
      const fv = answers[sc.flagItem];
      flag = {n:sc.flagItem, value:(fv==null?null:fv), label:(fv==null?null:sc.options[fv].label), positive:(fv!=null && fv>=1)};
    }
    return {total:totInt.raw, totalMax:sc.totalMax, totalAnxiety:totAnx.raw, totalAnxietyMax:111,
            answered:totInt.answered, missing:totInt.missing, totals:{anxiety:totAnx, internalising:totInt},
            subscales:subs, flag, isRcads:true};
  },

  /* RCADS-25 (25-item short form: youth self-report + caregiver): two broad
     scales — Total Depression (10 items, max 30) and Total Anxiety (15 items,
     max 45) — plus Total Anxiety & Depression (all 25, max 75), the headline.
     Raw→T is by gender and grade band (results layer, RCADS25_TSCORES). Official
     missing-data rule, per UCLA's SPSS batch-scoring syntax (each scale prorated
     independently, treated as its own unit): Total Depression scoreable with ≤2
     of 10 items missing, Total Anxiety with ≤3 of 15, and Total Anxiety &
     Depression with ≤4 of 25 — the combined has its OWN 4-item cap and does NOT
     also require the sub-scales to be within their caps (this differs from the
     47-item form, whose totals require each subscale ≤2). Prorated raw =
     round(sum completed / n completed × items in scale); zero missing = plain
     sum. Item 18 ("thinks about death") feeds the safety flag. */
  rcads25(test, answers){
    const sc = test.scoring;
    const scale = (items, cap, name, max) => {
      let sum = 0, ans = 0;
      for(const n of items){ const v = answers[n]; if(v != null){ sum += v; ans++; } }
      const missing = items.length - ans;
      const ok = ans > 0 && missing <= cap;
      return {raw: ok ? Math.round(sum / ans * items.length) : null, exact: ok ? sum / ans * items.length : null, sum, answered:ans, missing, nItems:items.length, cap, max, name, scoreable:ok};
    };
    const dep = scale(sc.depItems, 2, 'Total Depression', 30);
    const anx = scale(sc.anxItems, 3, 'Total Anxiety', 45);
    const allItems = sc.depItems.concat(sc.anxItems);
    const combRaw = (() => {
      let sum = 0, ans = 0;
      for(const n of allItems){ const v = answers[n]; if(v != null){ sum += v; ans++; } }
      const missing = allItems.length - ans;               // out of 25
      if(ans === 0 || missing > 4) return {raw:null, answered:ans};   // ≤4 missing, per UCLA syntax
      return {raw: Math.round(sum / ans * allItems.length), exact: sum / ans * allItems.length, answered:ans};
    })();
    let flag = null;
    if(sc.flagItem){
      const fv = answers[sc.flagItem];
      flag = {n:sc.flagItem, value:(fv==null?null:fv), label:(fv==null?null:sc.options[fv].label), positive:(fv!=null && fv>=1)};
    }
    return {total: combRaw.raw, totalMax: 75, totalAnxiety: anx.raw, totalDepression: dep.raw,
            answered: combRaw.answered,
            scales: {anxdep:{raw:combRaw.raw, exact:combRaw.exact, max:75, name:'Total Anxiety & Depression'}, anx, dep},
            flag, isRcads25:true};
  },

  /* Vanderbilt (NICHQ): symptom-counting + performance impairment.
     answers[n] = the option VALUE (symptom items 0–3, performance items 1–5).
     A symptom "counts" if rated 2 or 3; performance "impairment" if any 4 or 5.
     Per AAP/NICHQ 2002 scoring instructions. Screening only — never diagnostic. */
  vanderbilt(test, answers){
    const sc = test.scoring;
    const posSet = new Set(sc.symptomPositive);      // e.g. [2,3]
    const impairSet = new Set(sc.performanceImpair);  // e.g. [4,5]
    const v = n => answers[n];

    // performance / impairment
    let perfHits = 0, perfAnswered = 0, perfSum = 0;
    for(const n of test.performanceItems){
      const x = v(n);
      if(x != null){ perfAnswered++; perfSum += x; if(impairSet.has(x)) perfHits++; }
    }
    const impairment = perfHits >= 1;

    // symptom screens
    const screens = test.screens.map(s => {
      let count = 0, answered = 0;
      for(const n of s.items){ const x = v(n); if(x != null){ answered++; if(posSet.has(x)) count++; } }
      const meetsCount = count >= s.need;
      const positive = meetsCount && (s.requiresImpairment === false ? true : impairment);
      return {key:s.key, name:s.name, count, need:s.need, nItems:s.items.length, answered, meetsCount, requiresImpairment:s.requiresImpairment !== false, positive};
    });

    // total symptom score (items 1–18)
    let total = 0;
    for(const n of test.totalSymptomItems){ const x = v(n); if(x != null) total += x; }
    const totalMax = test.totalSymptomItems.length * 3;

    return {total, totalMax, subscales:{}, screens, impairment, perfHits, perfAnswered,
            perfAvg: perfAnswered ? perfSum/perfAnswered : null, isVanderbilt:true};
  },

  /* SNAP-IV 26 (Swanson, Nolan, Pelham): DSM ADHD Inattention (items 1–9),
     Hyperactivity/Impulsivity (10–18) and ODD (19–26). answers[n] = option index
     0–3 = value. Each subset is SUMMED and mapped to a severity band; a subset at
     or above its suggested "target" is flagged (Swanson 1992 scoring guide). The
     headline `total` is the DSM ADHD symptom sum (items 1–18, 0–54), mirroring the
     Vanderbilt sibling. Screening only — never diagnostic. */
  snap(test, answers){
    const sc = test.scoring;
    const subs = {};
    for(const s of sc.subsets){
      let raw = 0, answered = 0;
      for(const n of s.items){ const v = answers[n]; if(v != null){ raw += v; answered++; } }
      let band = null;
      for(const b of s.bands){ if(b.max == null || raw <= b.max){ band = b; break; } }
      subs[s.key] = {raw, max:s.max, answered, nItems:s.items.length, name:s.name,
                     band, target:s.target, positive: raw >= s.target};
    }
    let total = 0;
    for(const n of (sc.adhdItems || [])){ const v = answers[n]; if(v != null) total += v; }
    const adhdPositive = !!(subs.inattention && subs.inattention.positive) ||
                         !!(subs.hyperactive && subs.hyperactive.positive);
    const oddPositive  = !!(subs.odd && subs.odd.positive);
    return {total, totalMax:sc.totalMax, subscales:subs, adhdPositive, oddPositive, isSnap:true};
  },

  /* ASRS v1.1 (WHO Adult ADHD Self-Report Scale): 18 DSM symptoms rated 0–4
     (Never…Very often). answers[n] = chosen option index = frequency value.
     Primary output = the Part A 6-item screener: each item has an item-specific
     "shaded" threshold (items 1–3 count from Sometimes/≥2, items 4–6 from Often/≥3);
     ≥4 shaded marks = positive screen (Kessler et al. 2005). Also reports per-domain
     DSM symptom counts (rated Often/Very often) and a total frequency score (0–72). */
  asrs(test, answers){
    const sc = test.scoring;
    let partACount = 0, partAAnswered = 0;
    for(const n of sc.partA){
      const v = answers[n];
      if(v != null){ partAAnswered++; if(v >= sc.partAThresholds[n]) partACount++; }
    }
    const partAPositive = partACount >= sc.partAPositive;

    const subs = {};
    for(const k in test.subscales){
      const items = test.subscales[k].items;
      let raw = 0, count = 0, answered = 0;
      for(const n of items){
        const v = answers[n];
        if(v != null){ answered++; raw += v; if(v >= sc.symptomThreshold) count++; }
      }
      subs[k] = {raw, count, nItems:items.length, answered, max:items.length*4, name:test.subscales[k].name};
    }

    let total = 0;
    for(const item of test.items){ const v = answers[item.n]; if(v != null) total += v; }

    // Adler 2018 Symptom-Checklist binary total (0–18): items in checklistSometimesItems
    // count from "sometimes" (≥2); all other items count from "often" (≥3). Subtype
    // points (0–9 each) sum within domain; ≥6 in a domain = symptomatic (DSM-IV count).
    const someSet = new Set(sc.checklistSometimesItems || []);
    let checklistTotal = 0;
    const checklistSub = {};
    for(const k in test.subscales) checklistSub[k] = 0;
    for(const item of test.items){
      const v = answers[item.n];
      if(v == null) continue;
      const thr = someSet.has(item.n) ? 2 : 3;
      if(v >= thr){ checklistTotal++; if(checklistSub[item.subscale] != null) checklistSub[item.subscale]++; }
    }

    return {total, totalMax:sc.totalMax, subscales:subs, partACount, partAAnswered, partAPositive,
            checklistTotal, checklistSub, isAsrs:true};
  },

  /* BAARS-IV: 4-point items stored as option index 0–3. A symptom "counts" when
     rated Often/Very often (index ≥ symptomMinIndex). Per-domain count + total.
     Current ADHD meets criteria at ≥currentThreshold of 9; childhood ADHD uses
     ≥childThreshold to support the before-age-12 onset criterion. SCT is descriptive
     only (not a DSM diagnosis, not part of the ADHD count). Screening only. */
  baars(test, answers){
    const sc = test.scoring;
    const minIdx = sc.symptomMinIndex;
    const g = {};
    for(const k in test.subscales){
      const items = test.subscales[k].items;
      let total = 0, count = 0, answered = 0;
      for(const n of items){ const v = answers[n]; if(v != null){ answered++; total += v; if(v >= minIdx) count++; } }
      g[k] = {total, count, nItems:items.length, answered, max:items.length*3, name:test.subscales[k].name};
    }
    const inaMeet = g.current_inattention.count >= sc.currentThreshold;
    const hypMeet = g.current_hyperimpulsive.count >= sc.currentThreshold;
    const childInaOnset = g.child_inattention.count >= sc.childThreshold;
    const childHypOnset = g.child_hyperimpulsive.count >= sc.childThreshold;
    const childOnset = childInaOnset || childHypOnset;
    let presentation;
    if(inaMeet && hypMeet) presentation = 'Combined presentation';
    else if(inaMeet) presentation = 'Predominantly inattentive';
    else if(hypMeet) presentation = 'Predominantly hyperactive-impulsive';
    else presentation = 'Does not meet symptom criteria';
    return {groups:g, inaMeet, hypMeet, meetsAny:inaMeet||hypMeet, childInaOnset, childHypOnset, childOnset,
            presentation, total:g.current_inattention.total + g.current_hyperimpulsive.total, totalMax:sc.totalMax,
            subscales:{}, isBaars:true};
  },

  /* PHQ-9 / GAD-7 style screeners: 0–3 items summed to a total, mapped to an
     ordered severity band. answers[n] = option index 0–3 = value. Optional flagItem
     (e.g. PHQ-9 item 9, self-harm) is surfaced for safety review. No subscales.
     Percentile vs community norms is resolved in the results layer. */
  screener(test, answers){
    const sc = test.scoring;
    let total = 0, answered = 0;
    for(const item of test.items){ if(item.unscored) continue; const v = answers[item.n]; if(v != null){ total += v; answered++; } }
    // severity band: bands = [{max,label,cls}] in ascending order; last has max=null
    let severity = null;
    for(const b of sc.severity){ if(b.max == null || total <= b.max){ severity = b; break; } }
    let flag = null;
    if(sc.flagItem){
      const fv = answers[sc.flagItem];
      flag = {n:sc.flagItem, value:(fv==null?null:fv), label:(fv==null?null:sc.options[fv].label), positive:(fv!=null && fv>=1)};
    }
    return {total, totalMax:sc.totalMax, answered, severity, positive:(sc.cutoff!=null && total>=sc.cutoff),
            cutoff:sc.cutoff, flag, subscales:{}, isScreener:true};
  },

  /* RMET: performance-based. answers[n] = chosen option index; correct if it
     matches item.correct. Blank items count as 0 (no credit). No subscales. */
  rmet(test, answers){
    let total = 0;
    const perItem = {};
    for(const item of test.items){
      const oi = answers[item.n];
      const correct = (oi != null) && (oi === item.correct);
      if(correct) total++;
      perItem[item.n] = {chosen: (oi==null?null:oi), correct, answer: item.correct};
    }
    return {total, totalMax:test.scoring.totalMax, subscales:{}, perItem};
  },

  /* WHO ASSIST (full): branching screen. The lifetime-use grid (Q1) is carried on
     test._lifetime during a live run, or inside answers._lifetime for a re-score
     from a stored submission. For each substance ever used, the Specific Substance
     Involvement (SSI) score = sum(Q2..Q7), except tobacco which omits Q5 per the
     manual (max 31 vs 39). Risk band per WHO ASSIST v3.0: alcohol 11/27, all other
     substances 4/27. Screening only. */
  assist(test, answers){
    answers = answers || {};
    const lifetime = test._lifetime || answers._lifetime || {};
    const bands = test.scoring.bands;
    // highest obtainable value on each option set, for per-substance SSI maxima
    const optMax = {};
    for(const set in test.scoring.optionSets){ optMax[set] = Math.max(...test.scoring.optionSets[set].map(o=>o.v)); }
    const out = [];
    let anyUse = false, total = 0;
    for(const s of test.substances){
      if(!lifetime[s.key]) continue;
      anyUse = true;
      const skip = s.skip || [];
      let score = 0, substMax = 0; const qv = {};
      // Q3-Q5 apply only to use in the past 3 months (WHO 2010 manual, Appendix A;
      // NIDA-Modified ASSIST): with Q2 "Never" they score 0 whatever was recorded,
      // which also corrects results saved before the runner skipped them.
      const notRecent = answers[s.key + '_q2'] === 0;
      for(const q of test.questions){
        if(skip.includes(q.key)) continue;                  // e.g. tobacco skips Q5
        substMax += (optMax[q.set] || 0);
        let v = answers[s.key + '_' + q.key];
        if(notRecent && (q.key==='q3' || q.key==='q4' || q.key==='q5')) v = (v==null ? null : 0);
        qv[q.key] = (v == null ? null : v);
        if(v != null) score += v;
      }
      const band = bands[s.key] || bands.default;
      const risk = score >= band.high ? 'high' : (score >= band.mod ? 'moderate' : 'low');
      out.push({ key:s.key, label:s.label, score, max:substMax, risk, mod:band.mod, high:band.high, qv });
      total += score;
    }
    // sort highest-risk / highest-score first for the report
    const rank = { high:0, moderate:1, low:2 };
    out.sort((a,b)=> (rank[a.risk]-rank[b.risk]) || (b.score-a.score));
    // No cross-substance total: the WHO manual gives one risk score per substance.
    // The headline is the highest-risk substance (sorted first above).
    return { isAssist:true, anyUse, substances:out, lifetime, total:null, totalMax:null, top: out[0] || null, subscales:{} };
  },

  /* CATI (Comprehensive Autistic Trait Inventory): 42 items, 5-point Likert stored
     as option index 0–4 → value 1–5. Five items reverse-scored (6 − value). Six
     subscales (7 items each, 7–35) plus total (42–210). Higher = more autistic
     traits. Gender-matched percentiles + the 147.5 threshold are applied in the
     results layer. Screening only. */
  cati(test, answers){
    const rev = new Set(test.scoring.reversed || []);
    const subs = {};
    for(const k in test.subscales) subs[k] = {raw:0, max:test.subscales[k].max||35, name:test.subscales[k].name, answered:0};
    let total = 0;
    const per = {};
    for(const item of test.items){
      const oi = answers[item.n];
      if(oi == null) continue;
      const raw = oi + 1;                       // index 0–4 → 1–5
      const scored = rev.has(item.n) ? (6 - raw) : raw;
      per[item.n] = {raw, scored, reversed:rev.has(item.n)};
      if(subs[item.subscale]){ subs[item.subscale].raw += scored; subs[item.subscale].answered++; }
      total += scored;
    }
    return {total, totalMax:test.scoring.totalMax, subscales:subs, per,
            threshold:test.scoring.threshold, atThreshold: total >= test.scoring.threshold,
            isCati:true};
  },

  /* CAT-Q (Camouflaging Autistic Traits Questionnaire): 25 items, 7-point
     Likert stored as option index 0–6 → value 1–7. Five items reverse-scored
     (8 − value). Three subscales summed plus total (25–175). Higher = more
     camouflaging. No cut-off: gender-matched group positions are applied in the
     results layer. */
  catq(test, answers){
    const rev = new Set(test.scoring.reversed || []);
    const top = test.scoring.options.length;          // 7
    const subs = {};
    for(const k in test.subscales) subs[k] = {raw:0, min:test.subscales[k].min, max:test.subscales[k].max, name:test.subscales[k].name, answered:0};
    let total = 0, answered = 0;
    const per = {};
    for(const item of test.items){
      const oi = answers[item.n];
      if(oi == null) continue;
      const raw = oi + 1;                             // index 0–6 → 1–7
      const scored = rev.has(item.n) ? (top + 1 - raw) : raw;
      per[item.n] = {raw, scored, reversed:rev.has(item.n)};
      if(subs[item.subscale]){ subs[item.subscale].raw += scored; subs[item.subscale].answered++; }
      total += scored; answered++;
    }
    return {total, totalMin:test.scoring.totalMin, totalMax:test.scoring.totalMax, subscales:subs, per,
            answered, complete: answered === test.items.length, isCatq:true};
  },

  /* LSAS-SR: 24 situations × (Fear 0–3 + Avoidance 0–3) = 48 items. answers[n] =
     the chosen option value. Total 0–144 (Fear 0–72 + Avoidance 0–72), with
     Performance vs Social-interaction breakdowns. Severity band + ≥30 cut-off.
     Screening only. */
  lsas(test, answers){
    const sc = test.scoring;
    let fear=0, avoid=0, perfFear=0, perfAvoid=0, socFear=0, socAvoid=0, answered=0;
    for(const item of test.items){
      const v = answers[item.n];
      if(v == null) continue;
      answered++;
      if(item.dim==='fear'){ fear += v; if(item.group==='performance') perfFear += v; else socFear += v; }
      else { avoid += v; if(item.group==='performance') perfAvoid += v; else socAvoid += v; }
    }
    const total = fear + avoid;
    let severity = null;
    for(const b of sc.severity){ if(b.max == null || total <= b.max){ severity = b; break; } }
    // Colour follows the two PUBLISHED cut-offs, not the six severity-band edges
    // (see the registry comment on scoring.severity: those edges come from an
    // interpretation table with no validation behind it). The band label is still
    // whichever of the six the total falls in; only the pill colour is keyed here.
    const bandCls = total >= sc.cutoff2 ? 'band-high'
                  : (total >= sc.cutoff ? 'band-elevated' : 'band-typical');

    // Safren (1999) exploratory four-factor profile (descriptive). Fear reads
    // answers[n]; avoidance reads answers[n+100]. Excluded items simply aren't summed.
    let factors = null;
    if(test.safrenFactors){
      factors = {};
      for(const dim of ['fear','avoid']){
        const defs = test.safrenFactors[dim]; const out = {};
        for(const key in defs){
          const def = defs[key]; let sum=0, max=0, answered=0;
          for(const it of def.items){ const n = dim==='fear' ? it : it+100; const v = answers[n]; max+=3; if(v!=null){ sum+=v; answered++; } }
          out[key] = {name:def.name, score:sum, max, nItems:def.items.length, answered};
        }
        factors[dim] = out;
      }
    }

    return { total, totalMax:sc.totalMax, fear, avoid, factors,
             perfFear, perfAvoid, socFear, socAvoid,
             perfTotal:perfFear+perfAvoid, socTotal:socFear+socAvoid,
             severity, bandCls, answered, cutoff:sc.cutoff, cutoff2:sc.cutoff2,
             positive: total >= sc.cutoff, generalized: total >= sc.cutoff2,
             subscales:{}, isLsas:true };
  },

  /* DSM-5 emerging severity measures (e.g. Social Anxiety — Child): items rated
     0–N stored as option index. Total = sum; Average Total Score = total ÷ nItems,
     mapped to a 0–4 severity anchor (none/mild/moderate/severe/extreme). Generic
     so other DSM-5 severity measures can reuse it. Screening/monitoring only. */
  dsm5severity(test, answers){
    const sc = test.scoring;
    let total=0, answered=0;
    for(const item of test.items){ const v = answers[item.n]; if(v != null){ total += v; answered++; } }
    const nItems = test.items.length;
    // APA scoring note: with 3 or more items unanswered the total is not
    // calculated; with 1-2 it is prorated (raw sum x items / answered, rounded to
    // the nearest whole number).
    const missing = nItems - answered;
    if(missing >= (sc.unscoreableAt || 3)){
      return { total:null, totalMax:sc.totalMax, answered, nItems, missing, average:null,
               severityIndex:null, severityLabel:'Not scoreable', notScoreable:true, subscales:{}, isDsm5Sev:true };
    }
    if(missing > 0) total = Math.round(total * nItems / answered);
    const average = nItems ? total/nItems : 0;   // DSM-5 Average Total Score = total ÷ all items
    const anchors = sc.anchors || ['None','Mild','Moderate','Severe','Extreme'];
    const idx = Math.max(0, Math.min(anchors.length-1, Math.round(average)));
    return { total, totalMax:sc.totalMax, answered, nItems, missing, prorated: missing > 0, average,
             severityIndex:idx, severityLabel:anchors[idx], subscales:{}, isDsm5Sev:true };
  },

  /* WFIRS-S: functional impairment across 7 domains, items rated 0–3 with an N/A
     option (stored as −1) that is excluded from scoring. Per-domain mean = sum of
     answered (non-N/A) items ÷ their count. A domain is "impaired" if mean ≥1.5,
     OR ≥2 items rated 2, OR ≥1 item rated 3 (DSM-IV-aligned). Screening only. */
  wfirs(test, answers){
    const impMean = test.scoring.impairMean != null ? test.scoring.impairMean : 1.5;
    const subs = {};
    let allSum = 0, allCount = 0;
    for(const k in test.subscales){
      const items = test.subscales[k].items;
      let sum=0, count=0, c2=0, c3=0, na=0;
      for(const nn of items){
        const v = answers[nn];
        if(v == null) continue;
        if(v < 0){ na++; continue; }          // N/A — excluded
        count++; sum += v; if(v===2) c2++; if(v===3) c3++;
      }
      const mean = count ? sum/count : null;
      const assessed = count > 0;
      const impaired = assessed && ((mean >= impMean) || (c2 >= 2) || (c3 >= 1));
      subs[k] = { name:test.subscales[k].name, sum, count, na, nItems:items.length, mean, c2, c3, assessed, impaired };
      allSum += sum; allCount += count;
    }
    const totalMean = allCount ? allSum/allCount : null;
    const impairedDomains = Object.keys(subs).filter(k=>subs[k].impaired).map(k=>subs[k].name);
    const assessedDomains = Object.keys(subs).filter(k=>subs[k].assessed).length;

    // Optional ADHD-discrimination screen (WFIRS-P; Thompson et al. 2017). Computed
    // the paper's way, which differs from the CADDRA per-domain view above: its SIX
    // domains merge Learning + School behaviour into one, and the overall score is
    // the AVERAGE OF THE DOMAIN MEANS (domain-weighted), not the item-weighted total.
    // Screening only — a positive result is not diagnostic.
    let adhd = null;
    const as = test.scoring.adhdScreen;
    if(as){
      const doms = as.domains.map(d=>{
        let sum=0, count=0;
        for(const sk of d.subs){ const s=subs[sk]; if(s){ sum+=s.sum; count+=s.count; } }
        const mean = count ? sum/count : null;
        return { name:d.name, mean:(mean!=null?Math.round(mean*1000)/1000:null),
                 threshold:d.threshold, assessed:count>0, positive:(count>0 && mean>=d.threshold) };
      });
      const seen = doms.filter(d=>d.assessed);
      const overallRaw = seen.length ? seen.reduce((a,d)=>a+d.mean,0)/seen.length : null;
      adhd = { overall:(overallRaw!=null?Math.round(overallRaw*100)/100:null),
               cutoff:as.cutoff, positive:(overallRaw!=null && overallRaw>=as.cutoff),
               domains:doms, sens:as.sens, spec:as.spec, auc:as.auc, citation:as.citation };
    }

    return { subscales:subs, totalSum:allSum, totalCount:allCount, totalMean,
             total:(totalMean!=null?Math.round(totalMean*100)/100:null), totalMax:3,
             impairedDomains, assessedDomains, anyImpaired:impairedDomains.length>0, adhd, isWfirs:true };
  },

  /* Coventry Grid: clinician differential aid. Each item points to one pole
     (asd | att); "Present" (v=1) tallies that pole. Tallies overall and by
     category, plus the lists of endorsed features. No cut-off — descriptive aid. */
  coventry(test, answers){
    let asd=0, att=0, asdMax=0, attMax=0;
    const cats = {};
    const endorsed = { asd:[], att:[] };
    for(const item of test.items){
      const c = cats[item.subscale] || (cats[item.subscale] = {name:item.category, asd:0, att:0, asdN:0, attN:0});
      if(item.pole==='asd'){ asdMax++; c.asdN++; } else { attMax++; c.attN++; }
      if(answers[item.n]===1){
        if(item.pole==='asd'){ asd++; c.asd++; endorsed.asd.push({n:item.n, text:item.text, category:item.category}); }
        else { att++; c.att++; endorsed.att.push({n:item.n, text:item.text, category:item.category}); }
      }
    }
    const lean = asd>att ? 'autism-spectrum-consistent features' : (att>asd ? 'attachment / relational-consistent features' : 'a mixed picture');
    return { asd, att, asdMax, attMax, cats, endorsed, lean,
             total:asd+att, totalMax:asdMax+attMax, subscales:{}, isCoventry:true };
  },

  /* GSQ (Glasgow Sensory Questionnaire): 42 items rated 0–4 (Never…Always),
     summed to a total 0–168. Higher = more frequent atypical sensory responses
     (over- and under-responsivity). Population percentile is applied in the
     results layer. Screening/descriptive only. */
  gsq(test, answers){
    let total = 0, answered = 0, hyper = 0, hypo = 0;
    const subs = {};
    for(const k in (test.subscales||{})){
      const nums = test.subscales[k].items;
      const hyN = nums.filter(nn=>{ const it=test.items.find(x=>x.n===nn); return it && it.pole==='hyper'; }).length;
      subs[k] = {name:test.subscales[k].name, raw:0, max:nums.length*4, answered:0,
                 hyper:0, hypo:0, hyperMax:hyN*4, hypoMax:(nums.length-hyN)*4};
    }
    const endorsed = [];   // items rated Often/Always — surfaced on the results page
    for(const item of test.items){
      const v = answers[item.n];
      if(v == null) continue;
      answered++; total += v;
      if(item.pole==='hyper') hyper += v; else if(item.pole==='hypo') hypo += v;
      if(item.modality && subs[item.modality]){
        const s = subs[item.modality];
        s.raw += v; s.answered++;
        if(item.pole==='hyper') s.hyper += v; else if(item.pole==='hypo') s.hypo += v;
      }
      if(v >= 3) endorsed.push({ n:item.n, text:item.text, modality:item.modality, pole:item.pole, v,
                                 label:(test.scoring.options[v]||{}).label||String(v) });
    }
    return { total, totalMax:test.scoring.totalMax, answered, hyper, hypo, subscales:subs, endorsed, isGsq:true };
  },

  /* SPQ (Sensory Perception Quotient). Options index a: 0 strongly disagree …
     3 strongly agree. ORIGINAL scoring: base value v0 = 3 − a (strongly agree=0 …
     strongly disagree=3); original-reversed items use a instead. Sum → total
     (lower = more sensitive), with per-sense modality subscales. REVISED (RS,
     when scoring.rs): Taylor 2020 codes strongly disagree / disagree 0, agree 1,
     strongly agree 2, i.e. rv = max(0, a−1). A reverse-scored item (Additional
     file 1, italic) is the mirror image, 2 / 1 / 0 / 0, i.e. max(0, (3−a)−1);
     before 2026-10-02 it was 2−rv (2 / 2 / 1 / 0), which inflated reversed items. Summed
     into the Hyper / Hypo scale by item.rs and into per-sense subdomains; the 13
     excluded items don't contribute to RS. Higher RS = more atypical. */
  spq(test, answers){
    const rs = !!test.scoring.rs;
    let total = 0, answered = 0;
    const mod = {};
    for(const k in (test.subscales||{})) mod[k] = {name:test.subscales[k].name, raw:0, max:test.subscales[k].items.length*3};
    const SENSES = ['touch','hearing','vision','smell','taste'];
    const hyper = {total:0, max:(test.rsNorms&&test.rsNorms.hyper.max)||68, sub:{}};
    const hypo  = {total:0, max:(test.rsNorms&&test.rsNorms.hypo.max)||90, sub:{}};
    if(rs) SENSES.forEach(s=>{ hyper.sub[s]={raw:0,max:(test.rsNorms.hyper.sub||{})[s]}; hypo.sub[s]={raw:0,max:(test.rsNorms.hypo.sub||{})[s]}; });
    for(const item of test.items){
      const a = answers[item.n];
      if(a == null) continue;
      answered++;
      const v = item.origRev ? a : (3 - a);
      total += v;
      if(item.sense && mod[item.sense]) mod[item.sense].raw += v;
      if(rs && item.rs && item.rs !== 'x'){
        const rv = item.rsRev ? Math.max(0, (3 - a) - 1) : Math.max(0, a - 1);
        if(item.rs === 'hy'){ hyper.total += rv; if(hyper.sub[item.sense]) hyper.sub[item.sense].raw += rv; }
        else { hypo.total += rv; if(hypo.sub[item.sense]) hypo.sub[item.sense].raw += rv; }
      }
    }
    const res = { total, totalMax:test.scoring.totalMax, answered, subscales:mod, isSpq:true, hasRs:rs };
    if(rs){ res.hyper = hyper; res.hypo = hypo; }
    return res;
  },

  /* OCI family (Obsessive-Compulsive Inventory). One shared response set per
     form, rated 0..scoring.itemMax and stored as the VALUE via optionSets, summed
     to a total and to fixed-membership subscales taken from test.subscales[k].items.
     SUM scores throughout, never means: Foa et al. (2002) equalised the subscales
     at three items each precisely so sums are comparable (some third-party
     handouts print a "mean of 2.5" rule that is not in the paper).
     NO reverse-scored items on any published form of the OCI.

     Deliberately PARAMETERISED rather than hard-coded, because the adult and child
     forms are NOT parallel: the adult OCI-R is 18 items rated 0–4 across six
     subscales, the child forms use a 0–2 response set and a different subscale
     count. Every form-specific number (itemMax, totalMax, cutoff, subscale
     membership) lives in that form's own registry entry, read from its own paper. */
  oci(test, answers){
    const sc = test.scoring;
    const subOf = {};
    const subs = {};
    for(const k in (test.subscales||{})){
      const nums = test.subscales[k].items || [];
      nums.forEach(n => { subOf[n] = k; });
      subs[k] = { name:test.subscales[k].name, raw:0, max:nums.length*sc.itemMax,
                  nItems:nums.length, answered:0 };
    }
    let total = 0, answered = 0;
    const endorsed = [];   // items rated at/above endorseAt, surfaced on the results page
    for(const item of test.items){
      const v = answers[item.n];
      if(v == null) continue;
      answered++; total += v;
      const k = subOf[item.n];
      if(k){ subs[k].raw += v; subs[k].answered++; }
      if(sc.endorseAt != null && v >= sc.endorseAt)
        endorsed.push({ n:item.n, text:item.text, subscale:k, v,
                        label:((sc.optionSets||{})[item.optionSet]||[]).reduce((a,o)=>o.v===v?o.label:a, String(v)) });
    }
    /* Optional published severity band (OCI-R has one, the child forms do not).
       Separate from `positive`: the band says WHERE ON THE SEVERITY CONTINUUM a
       total sits, the cut-off says whether it screens positive. They can and do
       disagree at the low end, and the results layer says so when they do. */
    let severity = null;
    if(Array.isArray(sc.severity))
      for(const b of sc.severity){ if(b.max==null || total<=b.max){ severity=b; break; } }
    /* Optional DSM-5 rescoring (OCI-R only): the same answers summed into the
       two scales a later paper validated separately, because hoarding became its
       own diagnosis. Computed here rather than in the view so the numbers exist
       for the report, the console and any export alike. Each scale reports its
       own answered count, so a partly completed form cannot look like a low
       score on either. */
    let split = null;
    if(test.dsm5Split && Array.isArray(test.dsm5Split.scales)){
      split = test.dsm5Split.scales.map(s => {
        let raw = 0, ans = 0;
        for(const n of s.items){ const v = answers[n]; if(v == null) continue; raw += v; ans++; }
        return { key:s.key, name:s.name, label:s.label, raw, max:s.max, nItems:s.items.length,
                 answered:ans, cutoff:s.cutoff, positive: raw >= s.cutoff };
      });
    }
    return { total, totalMax:sc.totalMax, answered, subscales:subs, endorsed,
             cutoff:sc.cutoff, positive: sc.cutoff!=null ? total >= sc.cutoff : null,
             severity, split, isOci:true };
  },

  /* Y-BOCS (Yale-Brown Obsessive-Compulsive Scale) severity scale. Each item is
     rated 0–4 and stored as the VALUE via optionSet. Obsession subtotal = items
     1–5, compulsion subtotal = items 6–10, total = 0–40. Total maps to the
     conventional severity band. */
  ybocs(test, answers){
    const sc = test.scoring;
    let obs = 0, comp = 0, obsAns = 0, compAns = 0;
    for(const item of test.items){
      const v = answers[item.n];
      if(v == null) continue;
      if(item.subscale === 'obsessions'){ obs += v; obsAns++; }
      else if(item.subscale === 'compulsions'){ comp += v; compAns++; }
    }
    const total = obs + comp;
    let severity = null;
    for(const b of sc.severity){ if(b.max == null || total <= b.max){ severity = b; break; } }
    return { total, totalMax:sc.totalMax, obs, comp, obsMax:20, compMax:20,
             obsAns, compAns, severity, subscales:{}, isYbocs:true };
  },

  /* Symptom-checklist inventory (Y-BOCS Symptom Checklist). Each item stores
     0 never / 1 past only / 2 current only / 3 current and past. There is NO
     severity score here: we count how many symptoms are endorsed as current and
     as ever, overall, per domain and per category. `total` is the CURRENT count
     purely so generic score displays have something sensible to show. */
  checklist(test, answers){
    const cats = test.scoring.cats || {};
    const blank = () => ({current:0, ever:0, n:0, answered:0});
    const domains = { obsessions:blank(), compulsions:blank() };
    const byCat = {};
    for(const key in cats) byCat[key] = Object.assign(blank(), {name:cats[key].name, domain:cats[key].domain});
    let current = 0, ever = 0, answered = 0;
    const currentItems = [];
    for(const item of test.items){
      const cat = byCat[item.subscale], dom = domains[item.domain];
      if(cat) cat.n++;
      if(dom) dom.n++;
      const v = answers[item.n];
      if(v == null) continue;
      answered++;
      if(cat) cat.answered++;
      if(dom) dom.answered++;
      const isCurrent = (v === 2 || v === 3), isEver = (v > 0);
      if(isCurrent){ current++; if(cat) cat.current++; if(dom) dom.current++; currentItems.push(item.n); }
      if(isEver){ ever++; if(cat) cat.ever++; if(dom) dom.ever++; }
    }
    return { total:current, totalMax:test.items.length, current, ever, answered,
             nItems:test.items.length, domains, cats:byCat, currentItems,
             subscales:{}, isChecklist:true };
  },

  run(test, answers){
    return this[test.scoring.type](test, answers);
  }
};

/* SDQ four-band categorisation. cfg = {dir:'diff'|'pros', cuts:[a,b,c]}.
   diff (higher = worse): ≤a close-to-average, ≤b slightly raised, ≤c high, else very high.
   pros (higher = better): ≥a close-to-average, ≥b slightly lowered, ≥c low, else very low. */
function sdqBand(score, cfg){
  const diff = ['Close to average','Slightly raised','High','Very high'];
  const pros = ['Close to average','Slightly lowered','Low','Very low'];
  if(cfg.dir === 'pros'){
    if(score >= cfg.cuts[0]) return {i:0, label:pros[0]};
    if(score >= cfg.cuts[1]) return {i:1, label:pros[1]};
    if(score >= cfg.cuts[2]) return {i:2, label:pros[2]};
    return {i:3, label:pros[3]};
  }
  if(score <= cfg.cuts[0]) return {i:0, label:diff[0]};
  if(score <= cfg.cuts[1]) return {i:1, label:diff[1]};
  if(score <= cfg.cuts[2]) return {i:2, label:diff[2]};
  return {i:3, label:diff[3]};
}

/* normal CDF for z-score -> percentile */
function zToPercentile(z){
  // Abramowitz & Stegun 7.1.26 approximation of erf
  const t = 1/(1+0.2316419*Math.abs(z));
  const d = 0.3989423*Math.exp(-z*z/2);
  let p = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  p = z>0 ? 1-p : p;
  return Math.max(0.1, Math.min(99.9, p*100));
}

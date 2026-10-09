/* ── Results Dashboard ──────────────────────────────────────────────────────────
   Builds results page per test type. Add new result builders here.
─────────────────────────────────────────────────────────────────────────────── */

Object.assign(App, {

  /* dispatch to the per-type psychometric body builder. Reused by the clinician
     summary (which sets State.currentTest/result/client per submission first). */
  resultBody(t, r){
    const body = this._dispatchBody(t, r);
    return body + this._ladderNote(t, body) + this._autoItemResponses(t, r);
  },
  /* The position words (within / mildly / moderately / markedly above) come from
     the app's own reference ladder (refPosition), not from any paper. Say so once
     on every report that uses them. */
  _ladderNote(t, body){
    const LADDER = new Set(['rmet','wurs_self','wurs_observer','rbq3_self','rbq3_other','gsq','wfirs_s','asrs_adolescent']);
    if(!LADDER.has(t.id) || !/(mildly|moderately|markedly) (above|below)|within (this|the|reference)/i.test(body)) return '';
    return `<p class="src-note" style="margin-top:10px">Position words (within, and mildly / moderately / markedly above or below) are this app’s convention, set at about the 84th, 93rd and 98th centile (+1, +1.5 and +2 SD). They are not published cut-offs.</p>`;
  },
  /* instruments whose own result builder does NOT already list the person's
     per-item responses get the shared "Item responses" panel appended (so the
     raw answers behind every score are always visible on the report). Ones that
     already have a bespoke item panel (RMET, ASRS, ASSIST, Vanderbilt, BAARS,
     CATI, the DSM-5 severity measures) are deliberately absent. */
  _autoItemResponses(t, r){
    const GENERIC = new Set(['aq_adult','aq_adolescent','aq_child','phq9','gad7','lsas',
      'gsq','spq','spq35','sci','iesr','sqa2','ocir','wfirs_s','wfirs_p','snap_parent','snap_teacher','sdq_parent','sdq_self',
      'rcads_self','rcads_parent','rcads25_self','rcads25_parent']);
    return GENERIC.has(t.id) ? this.itemResponsesPanel(t, r) : '';
  },
  _dispatchBody(t, r){
    if(t.id.startsWith('aq_')) return this.resultsAQ(t, r);
    if(t.id==='sci' || r.isSci) return this.resultsSCI(t, r);
    if(t.id==='iesr') return this.resultsIESR(t, r);
    if(t.id==='wurs_self' || t.id==='wurs_observer') return this.resultsWURS(t, r);
    if(t.id==='rbq3_self' || t.id==='rbq3_other' || r.isRbq3) return this.resultsRBQ3(t, r);
    if(t.id==='rmet') return this.resultsRMET(t, r);
    if(t.id==='asrs' || t.id==='asrs_observer') return this.resultsASRS(t, r);
    if(t.id==='asrs_adolescent') return this.resultsASRSTeen(t, r);
    if(t.id==='assist') return this.resultsAssist(t, r);
    if(t.id==='cati') return this.resultsCati(t, r);
    if(t.id==='catq' || r.isCatq) return this.resultsCatq(t, r);
    if(t.id==='diva' || r.isDiva) return this.resultsDiva(t, r);
    if(t.id==='dasi' || r.isDasi) return this.resultsDasi(t, r);
    if(t.id==='adirw' || r.isAdirw) return this.resultsAdirw(t, r);
    if(t.id==='adir' || r.isAdir) return this.resultsAdir(t, r);
    if(t.id==='ados_m4' || r.isAdos) return this.resultsAdos(t, r);
    if(t.id==='sqa2') return this.resultsSQA2(t, r);
    if(t.scoring && t.scoring.type==='baars') return this.resultsBAARS(t, r);
    if(t.scoring && t.scoring.type==='oci') return this.resultsOci(t, r);
    if(t.scoring && t.scoring.type==='ybocs') return this.resultsYbocs(t, r);
    if(t.scoring && t.scoring.type==='checklist') return this.resultsChecklist(t, r);
    if(t.scoring && t.scoring.type==='screener') return this.resultsScreener(t, r);
    if(t.scoring && t.scoring.type==='lsas') return this.resultsLSAS(t, r);
    if(t.scoring && t.scoring.type==='dsm5severity') return this.resultsDsm5Sev(t, r);
    if(t.scoring && t.scoring.type==='wfirs') return this.resultsWfirs(t, r);
    if(t.scoring && t.scoring.type==='coventry') return this.resultsCoventry(t, r);
    if(t.scoring && t.scoring.type==='gsq') return this.resultsGsq(t, r);
    if(t.scoring && t.scoring.type==='spq') return this.resultsSPQ(t, r);
    if(t.scoring && t.scoring.type==='vanderbilt') return this.resultsVanderbilt(t, r);
    if(t.scoring && t.scoring.type==='snap') return this.resultsSnap(t, r);
    if(t.scoring && t.scoring.type==='sdq') return this.resultsSDQ(t, r);
    if(t.scoring && t.scoring.type==='rcads') return this.resultsRCADS(t, r);
    if(t.scoring && t.scoring.type==='rcads25') return this.resultsRCADS25(t, r);
    return this.resultsGeneric(t, r);
  },

  /* opts (optional): { target: HTMLElement, back: "<onclick js>" } — render the
     results into a given container (e.g. the clinician console's detail pane)
     with a "Back" control instead of taking over the full-screen results view. */
  /* Raw answers — shown only in demo / sandbox (clinician practice), never to a
     real patient. An expandable item-by-item dump of State.answers for checking. */
  rawAnswersBlock(t){
    const show = (typeof Online!=='undefined' && (Online.demoMode || Online.sandbox));
    if(!show) return '';
    const A = (typeof State!=='undefined' && State.answers) || {};
    const keys = Object.keys(A).filter(k=>k!=='_lifetime');
    if(!keys.length) return '';
    const itemByN = {}; (t.items||[]).forEach(it=>{ itemByN[String(it.n)]=it; });
    const opts = (t.scoring && t.scoring.options) || null;
    const rows = keys.map(k=>{
      const v = A[k], it = itemByN[k];
      const label = it ? (it.text || ('Item '+k)) : k;
      let ans = '';
      if(it && it.options && it.options[v]!=null) ans = it.options[v];
      else if(opts && opts[v] && opts[v].label!=null) ans = opts[v].label;
      return `<tr><td class="ra-n">${this.esc(k)}</td><td class="ra-q">${this.esc(String(label))}</td><td class="ra-a"><b>${this.esc(String(v))}</b>${ans?(' · '+this.esc(String(ans))):''}</td></tr>`;
    }).join('');
    return `<details class="raw-answers"><summary>Raw answers · ${keys.length} item${keys.length>1?'s':''} <span class="ra-demo">(demo / practice only)</span></summary><div class="ra-wrap"><table class="ra-tbl"><thead><tr><th>#</th><th>Item</th><th>Answer (value · label)</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  },
  renderResults(opts){
    const t = State.currentTest;
    const r = State.result;
    const c = State.client;
    const inPane = !!(opts && opts.target);
    const backOnclick = (opts && opts.back) || "App.go('home')";

    // dispatch to a per-type results builder for the score interpretation,
    // but the page chrome is shared.
    const body = this.resultBody(t, r);

    const dlIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const homeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    const retakeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

    const dob = c.dob ? this.fmtDate(c.dob) : '—';
    const aDate = c.date ? this.fmtDate(c.date) : this.fmtDate(new Date().toISOString().slice(0,10));
    const age = c.dob ? this.calcAge(c.dob, c.date) : null;

    const html = `
      <div class="results">
        <button class="back-link no-print" onclick="${backOnclick}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          ${inPane ? 'Back to patient' : ((opts && opts.backLabel) || 'All instruments')}
        </button>

        <div class="result-banner">
          <div class="rb-test">${t.fullName} · Results</div>
          <div class="rb-client">${this.esc(c.name)}</div>
          <div class="rb-meta">
            ${age!=null?`<div><b>Age</b>${age}</div>`:''}
            <div><b>Date of birth</b>${dob}</div>
            <div><b>Assessment date</b>${aDate}</div>
            ${c.sex?`<div><b>Sex</b>${c.sex.charAt(0).toUpperCase()+c.sex.slice(1)}</div>`:''}
            ${c.gender?`<div><b>Gender</b>${this.esc(this.genderLabel(c.gender))}</div>`:''}
            ${c.clinician?`<div><b>Clinician</b>${this.esc(c.clinician)}</div>`:''}
            ${c.respondent?`<div><b>Completed by</b>${this.esc(c.respondent)}</div>`:''}
            ${c.ref?`<div><b>Reference</b>${this.esc(c.ref)}</div>`:''}
          </div>
        </div>

        ${r.missing>0?`<div class="caveat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div class="cv-body"><b>${r.missing} item${r.missing>1?'s':''} left blank.</b> The total has been computed from completed items only. Interpret with appropriate caution.</div></div>`:''}

        ${body}

        ${this.clinicianNotesPanel(t, r)}

        ${this.rawAnswersBlock(t)}

        ${this.referencesBlock(t)}
        ${this.reportFooterNote(t)}

        <div class="results-actions no-print">
          <button class="btn btn-primary btn-lg" onclick="window.print()">${dlIcon} Save / print report (PDF)</button>
          ${inPane
            ? `<button class="btn btn-ghost btn-lg" onclick="${backOnclick}">${homeIcon} Back to patient</button>`
            : ((typeof CONFIG!=='undefined' && CONFIG.resolvedMode==='online')
              ? `<button class="btn btn-ghost btn-lg" onclick="App.go('home')">${homeIcon} Back to console</button>`
              : `<button class="btn btn-ghost btn-lg" onclick="App.openTest('${t.id}')">${retakeIcon} New assessment (same test)</button>
          <button class="btn btn-ghost btn-lg" onclick="App.go('home')">${homeIcon} Home</button>`)}
        </div>
      </div>`;

    const target = (opts && opts.target) || document.getElementById('view-results');
    target.innerHTML = html;
    if(inPane) target.scrollTop = 0;

    // animate bars after paint (scoped to the container we rendered into)
    requestAnimationFrame(()=>{
      target.querySelectorAll('[data-fill]').forEach(el=>{
        el.style.width = el.getAttribute('data-fill')+'%';
      });
    });
  },

  /* ═══════════ shared report scaffolding (config-driven, rendered once) ═══════ */
  reportInfoIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  /* the one instrument-specific interpretive caveat (registry: report.caveat).
     callers place it right AFTER the result hero, so the answer precedes the framing. */
  caveatLine(t){
    const cv = t && t.report && t.report.caveat;
    const main = cv ? `<div class="caveat report-caveat">${this.reportInfoIcon}<div class="cv-body">${this.esc(cv)}</div></div>` : '';
    return main + this.borrowedCutoffLine(t);
  },
  /* interview collateral person ({name, relationship, informant_id?}): the
     relationship as recorded, else the linked registered informant's, plus a
     "registered informant" tag when the interview is linked to that person. */
  interviewInformant(c){
    c = c || {};
    let linked = null;
    if(c.informant_id){
      try{
        if(typeof InterviewInformants!=='undefined') linked = InterviewInformants.find(c.informant_id);
        else if(typeof Online!=='undefined') linked = (Online._allInformants||[]).find(i=>i && i.id===c.informant_id) || null;
      }catch(e){}
    }
    const rel = c.relationship || (linked && linked.relationship) || '';
    return { name:c.name||'', rel, linked:!!c.informant_id, record:linked };
  },
  interviewInformantHtml(c, wrap){
    const x = this.interviewInformant(c), esc = v=>this.esc(v);
    if(!x.name && !x.rel) return '';
    const tag = x.linked ? ' <span class="iinf-tag">registered informant</span>' : '';
    if(wrap==='paren') return `${esc(x.name)}${x.rel?` (${esc(x.rel)})`:''}${tag}`;
    return `${x.name?`<b>${esc(x.name)}</b>`:''}${x.rel?`${x.name?', ':''}${esc(x.rel)}`:''}${tag}`;
  },
  /* informant / observer forms whose cut-off is borrowed from the self-report
     form (registry: borrowedCutoff). One consistent wording for all of them. */
  borrowedCutoffLine(t){
    const txt = (typeof informantCutoffCaveat==='function') ? informantCutoffCaveat(t) : '';
    return txt ? `<div class="caveat report-caveat borrowed-cutoff">${this.reportInfoIcon}<div class="cv-body"><b>Indicative only.</b> ${this.esc(txt)}</div></div>` : '';
  },
  /* one references & norms block, from report.references or, by default, the
     instrument's citation + licence (the same fields the Norms page uses). Gated on
     report.* so not-yet-migrated instruments keep their own inline citation. */
  referencesBlock(t){
    if(!t || !t.report) return '';
    const refs = t.report.references || [t.citation, t.licence].filter(Boolean);
    return refs.length ? `<div class="rep-refs no-break"><h3 class="rep-refs-h">References &amp; norms</h3><ul class="rep-refs-list">${refs.map(x=>`<li>${this.esc(x)}</li>`).join('')}</ul></div>` : '';
  },
  /* the single generic footer disclaimer (shown once a report is migrated to the
     shared scaffolding, so unmigrated reports don't double up their own caveats) */
  reportFooterNote(t){
    if(!t || !t.report) return '';
    const f = (typeof CONFIG!=='undefined' && CONFIG.reportFooter) || '';
    return f ? `<p class="rep-footer no-break">${this.esc(f)}</p>` : '';
  },

  /* ═══════════ AQ RESULTS ═══════════ */
  resultsAQ(t, r){
    const total = r.total;
    const max = r.totalMax;

    // Determine band + cut-off context
    let band='band-neutral', bandLabel='', summary='', cutoffNote='';
    const cuts = t.cutoffs || [];

    if(t.id==='aq_adult'){
      // No single verdict: the AQ has several validated thresholds (26/30/32) with
      // very different sensitivity/specificity trade-offs. The band reflects how many
      // are crossed; the ladder below reports each one's psychometrics + sample.
      if(total>=32){ band='band-high'; bandLabel='At or above all three published thresholds (26 / 30 / 32)'; }
      else if(total>=30){ band='band-high'; bandLabel='At or above the 26 and 30 thresholds'; }
      else if(total>=26){ band='band-elevated'; bandLabel='At or above the 26 threshold only'; }
      else { band='band-typical'; bandLabel='Below all published thresholds (lowest is 26)'; }
      summary = total>=26
        ? `The AQ-50 has several validated thresholds with very different trade-offs: 26 (Woodbury-Smith) is a high-sensitivity referral cut, 32 (Baron-Cohen) a high-specificity one, with 30 (Broadbent) in between. See the ladder below for each one's sensitivity/specificity and the sample it came from. The AQ is a screening aid, not diagnostic; specificity is limited, particularly where anxiety is present.`
        : `This total is below the lowest published AQ-50 threshold (26). The AQ has high false-negative rates in clinical samples, so a low score does not exclude autism.`;
      if(t.adultNorms){
        const sx = (State.client.sex==='male'||State.client.sex==='female') ? State.client.sex : null;
        const nc = t.adultNorms.groups.nonclinical[sx || 'overall'];
        const z = (total - nc.mean) / t.adultNorms.pooledSD.nonclinical;
        const pz = zToPercentile(z);
        summary += ` Relative to the general adult population${sx?` (${sx})`:''}, this total is ${pz>97 ? 'above roughly the 97th percentile' : `around the ${this.pctileShort(z)} percentile`} (normal-curve estimate from Ruzich et al. 2015, N≈6,900; the real upper tail is heavier, so high percentiles overstate rarity).`;
      }
    } else if(t.id==='aq_adolescent'){
      if(total>=30){ band='band-high'; bandLabel='At or above recommended cut-off (30)'; }
      else { band='band-typical'; bandLabel='Below recommended cut-off'; }
      summary = total>=30
        ? `In the validation sample, ~90% of adolescents with a clinical diagnosis scored at or above 30, versus 0% of controls. This is a screening indicator, not a diagnosis.`
        : `This score is below the recommended adolescent cut-off of 30, at which no controls scored in the original study.`;
    } else if(t.id==='aq_child'){
      // child total 0-150. Take the RECOMMENDED cut-off (76: Auyeung et al.
      // 2008, sens .95 / spec .95), not cutoffs[0] — the list is ordered
      // ascending [66, 76, 86], so indexing position 0 silently reported the
      // high-sensitivity 66 as "the" cut-off.
      // Three published cut-offs (Auyeung et al. 2008, Table 4): the verdict
      // names the highest one reached (low 66 / middle 76 / high 86), so the
      // report and the console agree. 76 is the recommended one.
      const cs = (cuts || []).filter(c => typeof c.score==='number').map(c => c.score).sort((a,b)=>a-b);
      const [lo, mid, hi] = cs.length===3 ? cs : [66, 76, 86];
      if(total>=hi){ band='band-high'; bandLabel=`At or above the high cut-off (${hi})`; }
      else if(total>=mid){ band='band-high'; bandLabel=`At or above the middle cut-off (${mid})`; }
      else if(total>=lo){ band='band-elevated'; bandLabel=`At or above the low cut-off (${lo})`; }
      else { band='band-typical'; bandLabel=`Below the low cut-off (${lo})`; }
      summary = total>=mid
        ? `This score is at or above the ${total>=hi?'high':'middle'} AQ-Child cut-off (${total>=hi?hi:mid}; ${mid} is the recommended screening cut-off). Consider alongside developmental history and other measures.`
        : total>=lo
        ? `This score is at or above the low AQ-Child cut-off (${lo}) but below the recommended ${mid}. Consider alongside developmental history and other measures.`
        : `This score falls below all three AQ-Child cut-offs (${lo}, ${mid}, ${hi}).`;
    }

    // ---- AQ-10 derived (adult only) ----
    let aq10Block = '';
    if(t.id==='aq_adult' && t.aq10){
      const a10 = this.computeAQ10(t, r);
      const a10band = a10>=6 ? 'band-elevated':'band-typical';
      aq10Block = `
        <div class="panel">
          <div class="panel-head"><h3>AQ-10 (derived)</h3><span class="card-tag tag-autism">NICE-endorsed brief screen</span></div>
          <p class="panel-sub">The AQ-10 is a 10-item subset of the AQ-50, recommended in UK NICE guidelines for triaging referrals. Calculated automatically from the responses given.</p>
          <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
            <div style="font-family:var(--font-display);font-size:42px;font-weight:700;color:var(--ink)">${a10}<span style="font-size:20px;color:var(--ink-faint)">/10</span></div>
            <div>
              <span class="band-pill ${a10band}">${a10>=6?'At or above referral threshold (6)':'Below referral threshold (6)'}</span>
              <p style="font-size:13.5px;color:var(--ink-soft);margin-top:8px;max-width:42ch">${a10>=6?'A score of 6 or above is the point at which NICE recommends offering a comprehensive autism assessment (NICE CG142, recommendation 1.2.3).':'Below the threshold of 6 at which referral is typically considered.'}</p>
            </div>
          </div>
        </div>`;
    }

    // ---- unified profile table: Total + 5 subscales · score · track (Typical green + Autism red bands) · vs-Typical / vs-Autism percentiles ----
    const sex = State.client.sex || 'all';
    const normKey = k => k==='social_skill' ? 'social' : k;
    const pick = grp => (t.norms && t.norms.length) ? (t.norms.find(n=>n.group===grp && n.sex===sex) || t.norms.find(n=>n.group===grp && n.sex==='all')) : null;
    const control = pick('Control');
    const autism = pick('Autism') || pick('AS/HFA');

    let totC=null, totA=null;
    if(t.id==='aq_adult' && t.adultNorms){
      const sx = (sex==='male'||sex==='female') ? sex : 'overall';
      const an = t.adultNorms;
      totC = {mean:an.groups.nonclinical[sx].mean, sd:an.pooledSD.nonclinical};
      totA = {mean:an.groups.asc[sx].mean, sd:an.pooledSD.asc};
    } else {
      totC = control && control.total ? control.total : null;
      totA = autism && autism.total ? autism.total : null;
    }
    const rowsData = [{name:'Total AQ', raw:total, max:max, c:totC, a:totA, lead:true}];
    for(const key of Object.keys(t.subscales)){
      const s = r.subscales[key]; const nk = normKey(key);
      rowsData.push({name:s.name, raw:s.raw, max:t.scoring.subscaleMax,
        c: control && control.subscales ? control.subscales[nk] : null,
        a: autism && autism.subscales ? autism.subscales[nk] : null, sub:true});
    }
    const zScore = (raw,n)=> (n && n.sd>0) ? (raw-n.mean)/n.sd : null;
    const aqRow = (rw)=>{
      const toPct=v=>Math.max(0,Math.min(100,(v/rw.max)*100));
      const cp=toPct(rw.raw);
      let bh='';
      if(rw.c){const lo=toPct(rw.c.mean-rw.c.sd),hi=toPct(rw.c.mean+rw.c.sd),m=toPct(rw.c.mean);bh+=`<div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:var(--green)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--green)"></div>`;}
      if(rw.a){const lo=toPct(rw.a.mean-rw.a.sd),hi=toPct(rw.a.mean+rw.a.sd),m=toPct(rw.a.mean);bh+=`<div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:var(--rose-fill)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--rose-fill)"></div>`;}
      const zc=zScore(rw.raw,rw.c), za=zScore(rw.raw,rw.a);
      return `<div class="sdq-u-row${rw.lead?' sdq-u-lead':rw.sub?' sdq-u-sub':''}">
        <span class="sdq-name">${rw.name}</span>
        <span class="sdq-score">${rw.raw}<span class="sdq-max">/${rw.max}</span></span>
        <div class="sdq-track"><div class="norm-axis"></div>${bh}<div class="norm-marker" style="left:${cp}%"><div class="norm-marker-dot"></div></div></div>
        <span class="sdq-pct">${zc!=null?this.pctileCell(zc):'<span class="sdq-pct-empty">—</span>'}</span>
        <span class="sdq-pct">${za!=null?this.pctileCell(za):'<span class="sdq-pct-empty">—</span>'}</span>
      </div>`;
    };
    const hasNorm = rowsData.some(rw=>rw.c||rw.a);
    // total: one lanes chart (row per group, ±1 SD bar + mean dot, score line)
    // with every published threshold as a dashed notch; details stay in the
    // Published thresholds panel below
    const zTotC = zScore(total, totC), zTotA = zScore(total, totA);
    const totalLanes = (totC || totA) ? this.groupLanes({
      max, score:total,
      groups:[
        totC ? {label:'Typical', color:'var(--green)', mean:totC.mean, sd:totC.sd, right:zTotC!=null?this.pctileCell(zTotC):null} : null,
        totA ? {label:'Autism',  color:'var(--rose)',  mean:totA.mean, sd:totA.sd, right:zTotA!=null?this.pctileCell(zTotA):null} : null
      ].filter(Boolean),
      cuts:(cuts||[]).map(c=>({score:c.score, label:String(c.score)})),
      dir:['fewer autistic traits','more autistic traits']
    }) : '';
    const profileTable = hasNorm ? `
      <div class="panel">
        <div class="panel-head"><h3>AQ profile vs norms</h3>${(sex==='male'||sex==='female')?`<span class="card-tag tag-autism">${sex.charAt(0).toUpperCase()+sex.slice(1)}</span>`:''}</div>
        <p class="panel-sub">Top: the total, one row per comparison group (bar = ±1 SD around the mean dot, vertical line = this client) with each published threshold as a dashed notch. Below: the five domains, where this client (●) falls relative to typical (green) and autism (red) group means; the two right columns are the client's percentile within each group. Read down all domains: does the pattern track the typical or the autistic range?${t.id==='aq_adult'?' Adult subscale norms come from a small 2001 sample (female-autism cell n=13); treat per-domain percentiles as indicative.':''}</p>
        ${totalLanes}
        <div class="profile-table" style="--cols:minmax(120px,1.2fr) 60px minmax(120px,2.3fr) 54px 54px;margin-top:14px">
          <div class="ph"><span>Domain</span><span class="r">Score</span><span class="col-opt">Typical · Autism</span><span class="r col-opt">vs Typ</span><span class="r col-opt">vs Aut</span></div>
          ${rowsData.filter(rw=>rw.sub).map(aqRow).join('')}
        </div>
        <div class="norm-legend" style="margin-top:12px;padding-top:12px">
          <div class="norm-legend-item"><span class="norm-legend-dot"></span>This client</div>
          <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--green);opacity:.5"></span>Typical ±1 SD</div>
          <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--rose-fill);opacity:.5"></span>Autism ±1 SD</div>
        </div>
      </div>` : `
      <div class="panel">
        <div class="panel-head"><h3>Subscale profile</h3></div>
        <p class="panel-sub">The five AQ trait domains. Higher = more autistic-direction responses in that domain.</p>
        <div class="profile-table" style="--cols:minmax(120px,1.2fr) 60px minmax(120px,2.6fr)">
          <div class="ph"><span>Domain</span><span class="r">Score</span><span class="col-opt">Profile</span></div>
          ${rowsData.filter(rw=>rw.sub).map(rw=>`<div class="sdq-u-row sdq-u-sub"><span class="sdq-name">${rw.name}</span><span class="sdq-score">${rw.raw}<span class="sdq-max">/${rw.max}</span></span><div class="sdq-track"><div class="norm-axis"></div><div class="norm-marker" style="left:${Math.max(0,Math.min(100,(rw.raw/rw.max)*100))}%"><div class="norm-marker-dot"></div></div></div></div>`).join('')}
        </div>
      </div>`;

    // ---- Cut-off reference ----
    let cutTable = '';
    if(cuts && cuts.length){
      cutTable = `<ul class="interp-list">`;
      for(const cut of cuts){
        const score = cut.score;
        const meets = total>=score;
        const icon = meets
          ? `<span class="ic ic-flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></span>`
          : `<span class="ic ic-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;
        const pctf = v => (v==null?'':((v*100).toFixed(1).replace(/\.0$/,''))+'%');
        const src = cut.source ? this.esc(cut.source)+(cut.tier?` (${cut.tier} cut-off${cut.recommended?', recommended':''})`:'') : (cut.label ? cut.label.charAt(0).toUpperCase()+cut.label.slice(1)+' threshold' : '');
        const qual = cut.note ? `: ${this.esc(cut.note)}` : '';
        let detail = '';
        const sens = cut.sens!=null ? cut.sens : cut.sensitivity, spec = cut.spec!=null ? cut.spec : cut.specificity;
        if(sens!=null){
          let p = `Sensitivity ${pctf(sens)} · Specificity ${pctf(spec)}`;
          if(cut.ppv!=null) p += ` · PPV ${cut.ppv} · NPV ${cut.npv}`;
          if(cut.correct!=null) p += ` · ${Math.round(cut.correct*100)}% correctly classified`;
          detail += `<div class="ck-psy">${p}</div>`;
          if(cut.sexSplit) detail += `<div class="ck-psy">By sex: women ${pctf(cut.sexSplit.female.sens)}/${pctf(cut.sexSplit.female.spec)}, men ${pctf(cut.sexSplit.male.sens)}/${pctf(cut.sexSplit.male.spec)} (sens/spec)</div>`;
        }
        if(cut.sample) detail += `<div class="ck-sample">${this.esc(cut.sample)}</div>`;
        cutTable += `<li>${icon}<div><b>${score}+</b> ${src}${qual}. ${meets?'<b style="color:var(--amber)">Score meets this threshold.</b>':'Score is below this threshold.'}${detail}</div></li>`;
      }
      cutTable += `</ul>`;
    }

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">Total AQ score</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill ${band}">${bandLabel}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      ${aq10Block}

      ${profileTable}

      ${cutTable?`<div class="panel"><div class="panel-head"><h3>Published thresholds</h3></div><p class="panel-sub">${t.id==='aq_adult'?'The AQ-50 has several validated cut-offs with very different sensitivity/specificity trade-offs. Each is shown with the study and the sample it was derived from. These are screening indicators, not diagnostic boundaries, and the sensitivity/specificity (and any PPV/NPV) are properties of the specific study sample and base rate, not transferable operating characteristics.':'Published screening thresholds for this version. They indicate where further assessment is often considered, not diagnostic boundaries.'}</p>${cutTable}${t.scoringBasis?`<p class="src-note">${this.esc(t.scoringBasis)}</p>`:''}</div>`:''}
    `;
  },

  /* AQ-10 computation from full responses */
  computeAQ10(t, r){
    const a10 = t.aq10;
    const ans = (r && r.answers) || State.answers || {};   // saved results carry their own answers
    const items = a10.items; // [5,20,27,...]
    const agreeScored = new Set(a10.agree_scored_items);
    let score=0;
    for(const n of items){
      const oi = ans[n];
      if(oi==null) continue;
      const choseAgree = t.scoring.options[oi].agree;
      const scored = (agreeScored.has(n) && choseAgree) || (!agreeScored.has(n) && !choseAgree);
      if(scored) score++;
    }
    return score;
  },

  /* Normative band chart for AQ — uses available group means */
  buildAQNormChart(t, r){
    // ── TOTAL comparison (all versions) ──
    let totalGroups = [];
    if(t.id==='aq_adult' && t.adultNorms){
      // Ruzich et al. 2015 meta-analytic norms: general population vs autism (ASC),
      // sex-matched where sex is known, using pooled SDs for the ±1 SD bands.
      const an = t.adultNorms;
      const sex = (State.client.sex==='male'||State.client.sex==='female') ? State.client.sex : null;
      const cell = (grp) => an.groups[grp][sex || 'overall'];
      const sexLbl = sex ? ` (${sex})` : '';
      const nc = cell('nonclinical'), asc = cell('asc');
      if(nc) totalGroups.push({label:`General population${sexLbl}`, mean:nc.mean, sd:an.pooledSD.nonclinical, color:'var(--green)'});
      if(asc) totalGroups.push({label:`Autism / ASC${sexLbl}`, mean:asc.mean, sd:an.pooledSD.asc, color:'var(--rose)'});
    } else if((t.id==='aq_adolescent'||t.id==='aq_child') && t.norms && t.norms.length){
      const sex = State.client.sex || 'all';
      const pick = (grp) => t.norms.find(n=>n.group===grp && (n.sex===sex)) || t.norms.find(n=>n.group===grp && n.sex==='all');
      const control = pick('Control');
      const autism = pick('Autism') || pick('AS/HFA');
      if(control && control.total) totalGroups.push({label:`Control (${control.sex})`, mean:control.total.mean, sd:control.total.sd, color:'var(--green)'});
      if(autism && autism.total) totalGroups.push({label:`Autism (${autism.sex})`, mean:autism.total.mean, sd:autism.total.sd, color:'var(--rose)'});
    }

    let totalChart = '';
    if(totalGroups.length){
      const maxScale = r.totalMax;
      const toPct = v => Math.max(0,Math.min(100,(v/maxScale)*100));
      let bands='', legend='';
      for(const g of totalGroups){
        const lo=toPct(g.mean-g.sd), hi=toPct(g.mean+g.sd), m=toPct(g.mean);
        bands += `<div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:${g.color}"></div><div class="norm-group-mean" style="left:${m}%;background:${g.color}"></div>`;
        const z = g.sd>0 ? (r.total-g.mean)/g.sd : 0;
        legend += `<div class="norm-legend-item"><span class="norm-legend-swatch" style="background:${g.color}"></span>${g.label}: mean ${g.mean} (SD ${g.sd}), ${this.pctileLabel(z)}</div>`;
      }
      const clientPos = toPct(r.total);
      totalChart = `
        <div class="norm-item">
          <div class="norm-item-head"><span class="nm">Total AQ score</span><span class="nv">0–${maxScale} scale</span></div>
          <div class="norm-scale">
            <div class="norm-axis"></div>${bands}
            <div class="norm-marker" style="left:${clientPos}%"><div class="norm-marker-label">${r.total}</div><div class="norm-marker-dot"></div></div>
          </div>
        </div>
        <div class="norm-legend">
          <div class="norm-legend-item"><span class="norm-legend-dot"></span>This client (${r.total})</div>${legend}
        </div>`;
    }

    // ── SUBSCALE PROFILE vs norms (child, adolescent, and now adult) ──
    let subscaleChart = '';
    const subNormsAvailable = (t.id==='aq_adolescent'||t.id==='aq_child'||t.id==='aq_adult') && t.norms && t.norms.length;
    if(subNormsAvailable){
      const sex = State.client.sex || 'all';
      const pick = (grp) => t.norms.find(n=>n.group===grp && n.sex===sex) || t.norms.find(n=>n.group===grp && n.sex==='all');
      const control = pick('Control');
      const autism = pick('Autism') || pick('AS/HFA');
      // norms label social as 'social'; our subscale key is 'social_skill'
      const normKey = k => k==='social_skill' ? 'social' : k;
      const subMax = t.scoring.subscaleMax;

      let rows = '';
      for(const key of Object.keys(t.subscales)){
        const s = r.subscales[key];
        const nk = normKey(key);
        const cNorm = control && control.subscales ? control.subscales[nk] : null;
        const aNorm = autism && autism.subscales ? autism.subscales[nk] : null;
        if(!cNorm || !aNorm) continue;

        const toPct = v => Math.max(0,Math.min(100,(v/subMax)*100));
        const cl=toPct(cNorm.mean-(cNorm.sd||0)), ch=toPct(cNorm.mean+(cNorm.sd||0)), cm=toPct(cNorm.mean);
        const al=toPct(aNorm.mean-(aNorm.sd||0)), ah=toPct(aNorm.mean+(aNorm.sd||0)), am=toPct(aNorm.mean);
        const clientPos = toPct(s.raw);

        const zc = cNorm.sd>0 ? (s.raw-cNorm.mean)/cNorm.sd : 0;
        const za = aNorm.sd>0 ? (s.raw-aNorm.mean)/aNorm.sd : 0;

        rows += `
          <div class="sub-norm-row">
            <div class="sub-norm-head">
              <span class="sub-norm-name">${s.name}</span>
              <span class="sub-norm-score">${s.raw} / ${subMax}</span>
            </div>
            <div class="sub-norm-scale">
              <div class="norm-axis"></div>
              <div class="norm-group-band" style="left:${cl}%;width:${ch-cl}%;background:var(--green)"></div>
              <div class="norm-group-mean" style="left:${cm}%;background:var(--green)"></div>
              <div class="norm-group-band" style="left:${al}%;width:${ah-al}%;background:var(--rose-fill)"></div>
              <div class="norm-group-mean" style="left:${am}%;background:var(--rose-fill)"></div>
              <div class="norm-marker" style="left:${clientPos}%"><div class="norm-marker-label">${s.raw}</div><div class="norm-marker-dot"></div></div>
            </div>
            <div class="sub-norm-pctiles">
              <span class="pctile-chip pctile-control"><b>vs Control</b> ${this.pctileCell(zc)}</span>
              <span class="pctile-chip pctile-autism"><b>vs Autism</b> ${this.pctileCell(za)}</span>
            </div>
          </div>`;
      }

      if(rows){
        const cLabel = control ? `Control (${control.sex})` : 'Control';
        const aLabel = autism ? `Autism (${autism.sex})` : 'Autism';
        const adultNote = (t.id==='aq_adult' && t.subscaleNormsSource)
          ? `<p class="src-note" style="margin-top:14px">Subscale norms: ${t.subscaleNormsSource} These come from a smaller, older sample than the total-score norms above; interpret the per-domain percentiles as indicative, especially the female autism comparison.</p>`
          : '';
        subscaleChart = `
          <div class="panel">
            <div class="panel-head"><h3>Subscale profile vs norms</h3></div>
            <p class="panel-sub">Each domain showing where this client (●) falls relative to Control (green) and Autism (red) group means (bands span ±1 SD). The percentiles show the client's standing within each group; read across all five to judge whether the overall pattern tracks the typical or the autistic range.</p>
            <div class="norm-chart">${rows}</div>
            <div class="norm-legend">
              <div class="norm-legend-item"><span class="norm-legend-dot"></span>This client</div>
              <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--green)"></span>${cLabel} (±1 SD)</div>
              <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--rose-fill)"></span>${aLabel} (±1 SD)</div>
            </div>
            ${adultNote}
          </div>`;
      }
    }

    if(!totalChart && !subscaleChart) return '';

    const adultNormSrc = (t.id==='aq_adult' && t.adultNorms)
      ? `<p class="src-note" style="margin-top:14px">Norms: ${t.adultNorms.source} Bands use pooled SDs (non-clinical ${t.adultNorms.pooledSD.nonclinical}, ASC ${t.adultNorms.pooledSD.asc}); no sex-specific SDs are published, so percentiles are estimates assuming approximate normality.</p>`
      : '';
    const totalPanel = totalChart ? `
      <div class="panel">
        <div class="panel-head"><h3>Total score vs norms</h3></div>
        <p class="panel-sub">Where this client's total (●) falls relative to published group means. Shaded bands span ±1 standard deviation; the vertical line marks each group mean.</p>
        <div class="norm-chart">${totalChart}</div>
        ${adultNormSrc}
      </div>` : '';

    return subscaleChart + totalPanel;
  },

  /* percentile helpers */
  /* One source note per comparison lane. The chart plots every group in
     compareGroups, so crediting only the scoring reference under-attributes the
     others; each lane's citation is printed against its own label. Falls back to
     the single norm source when the groups carry no citations of their own. */
  gsqSourceNotes(t, nm){
    const cg = (t.compareGroups||[]).filter(g=>g && g.source);
    if(!cg.length) return nm && nm.source ? `<p class="src-note">Comparison values: ${this.esc(nm.source)}</p>` : '';
    return cg.map(g=>`<p class="src-note"><b>${this.esc(g.label)}</b>: ${this.esc(g.source)}</p>`).join('');
  },

  /* Guaranteed (assumption-free) empirical percentile BAND for a score against a
     published frequency histogram. Everyone in lower bins is certainly below the
     score, everyone in higher bins certainly above; the score's own bin is the
     only uncertainty. So the band is [cum-below-bin, cum-including-bin] / N — the
     tightest statement possible WITHOUT interpolating within the bin. No shape
     assumption of any kind (not even uniform-within-bin). Returns {lo,hi} in
     0–100, or null. The band is widest in the dense middle (where precision
     barely matters) and tightest in the tails (where it matters most). */
  gsqEmpBand(score, hist){
    if(!hist || !hist.counts) return null;
    const x0 = hist.x0||0, w = hist.binWidth||10, c = hist.counts;
    const N = c.reduce((a,b)=>a+b,0);
    if(!N) return null;
    let i = Math.floor((score - x0) / w);
    if(i < 0) i = 0; else if(i >= c.length) i = c.length - 1;
    let below = 0;
    for(let k=0;k<i;k++) below += c[k];
    return { lo: 100*below/N, hi: 100*(below+c[i])/N };
  },
  /* integer percentile with an ordinal suffix: 83 -> "83rd" */
  ordinalPct(p){
    p = Math.round(p);
    const v = p % 100, s = ['th','st','nd','rd'];
    return p + (s[(v-20)%10] || s[v] || s[0]);
  },
  /* format a band; full=true -> "80th–90th", compact -> "80–90th". Collapses to a
     single ordinal when both edges round equal (e.g. a tail bin). */
  fmtBand(b, full){
    if(!b) return null;
    const lo = Math.round(b.lo), hi = Math.round(b.hi);
    if(lo === hi) return this.ordinalPct(lo);
    return full ? `${this.ordinalPct(lo)}–${this.ordinalPct(hi)}` : `${lo}–${this.ordinalPct(hi)}`;
  },

  /* Distance from a comparison mean in SD units. Distribution-free: unlike a
     percentile it needs no assumption about the shape of the reference sample,
     so it is the right readout when only mean/SD are published. */
  sdCell(z){
    if(!isFinite(z)) return '—';
    if(Math.abs(z) < 0.05) return 'at mean';
    return (z>0?'+':'−') + Math.abs(z).toFixed(1) + ' SD';
  },
  /* the same figure as a sentence fragment: "1.0 SD above the X mean" */
  sdPhrase(z, name){
    const of = name ? `the ${name} mean` : 'the mean';
    if(!isFinite(z)) return `not comparable with ${of}`;
    if(Math.abs(z) < 0.05) return `at ${of}`;
    return `${Math.abs(z).toFixed(1)} SD ${z>0?'above':'below'} ${of}`;
  },
  pctileShort(z){
    const p = zToPercentile(z);
    if(p>=99) return '≥99th';
    if(p<=1) return '≤1st';
    const r = Math.round(p);
    const suf = (r%10===1&&r%100!==11)?'st':(r%10===2&&r%100!==12)?'nd':(r%10===3&&r%100!==13)?'rd':'th';
    return r+suf;
  },
  pctileLabel(z){
    return 'client at ~'+this.pctileShort(z)+' percentile';
  },
  /* table-cell form of a z-derived percentile: prefix ≈ (it's a normal-curve estimate),
     except for the already-hedged ≥/≤ bounds. Table-lookup percentiles take no ≈. */
  pctileCell(z){
    const s = this.pctileShort(z);
    return (s[0]==='≥' || s[0]==='≤') ? s : '≈'+s;
  },

  /* ── shared reference-position ladder ────────────────────────────────────
     THE suite-wide convention for instruments with NO published cut-off,
     where "where does this person sit against a reference sample" is the only
     interpretation the literature supports. One ladder everywhere, so the same
     words never mean two different distances on two panels of one report.

       < 84th        Within reference range        green   (band-typical)
       84th – 93rd   Mildly above reference        blue    (band-neutral)
       93rd – 98th   Moderately above reference    amber   (band-elevated)
       >= 98th       Markedly above reference      red     (band-high)

     PERCENTILE-primary, not SD. Most of the distributions this is applied to
     are skewed or floor-bound (ASRS community, WFIRS, RBQ-3, GSQ-P), where a
     z is not interpretable but an empirical centile still is; and 93/98 land
     exactly on the boundaries RCADS (T65/T70) and WFIRS-P (Arildskov) already
     use natively, so this ladder is a superset of the native schemes rather
     than a fourth competing one. SD equivalents, for the normal cases only:
     84th ≈ +1.0, 93rd ≈ +1.5, 98th ≈ +2.05.

     FOUR labels but only THREE alarm states: the colour axis stays
     green/amber/red and "Mildly" is informational blue, so the ladder does its
     work as language rather than as alarm. 84th is ~1 in 6 of the reference
     sample; colouring it amber would make these (cut-off-free!) instruments
     more trigger-happy than every native scheme in the suite.

     opts:
       dir  'high' (default) — a high score is the clinical direction
            'low'            — a LOW score is (RMET, SPQ): mirrors to the
                               16th/7th/2nd centiles and "below reference"
       top  cap the ladder where a reference sample is too small to carry the
            top rung — e.g. top:93 stops at "Moderately" when a 98th-centile
            claim would rest on a handful of observations. Default 98, and no
            current caller caps: the GSQ reads an empirical distribution of
            n=749, which supports every rung.
       group  reference-group name, appended as an italic qualifier — REQUIRED
            wherever the reference is not a general population, because
            "markedly above reference" means opposite things against an
            autistic vs a non-autistic comparison group.

     Returns {label, cls, rung, above} or null when pct is unusable.
     Callers that must NOT show a pill (no defensible distribution: see
     refPositionWord) use the word form and drop `cls`. */
  REF_RUNGS: [
    { p:98, word:'Markedly',   cls:'band-high' },
    { p:93, word:'Moderately', cls:'band-elevated' },
    { p:84, word:'Mildly',     cls:'band-neutral' }
  ],
  refPosition(pct, opts){
    if(pct==null || isNaN(pct)) return null;
    const o = opts || {};
    const low = o.dir==='low';
    // mirror for reverse-scored scales: the 16th/7th/2nd are the same distances
    // out, on the other tail
    const outward = low ? (100-pct) : pct;
    const top = o.top!=null ? o.top : 98;
    const rungs = this.REF_RUNGS.filter(r => r.p <= top);
    const hit = rungs.find(r => outward >= r.p);
    const dirWord = low ? 'below' : 'above';
    if(!hit) return { label:'Within reference range', cls:'band-typical', rung:0, above:false };
    return {
      label: `${hit.word} ${dirWord} reference`,
      cls: hit.cls,
      rung: rungs.length - rungs.indexOf(hit),
      above: true
    };
  },
  /* the same ladder as a bare phrase, for instruments that earn a position
     but NOT a colour (reference sample too small, non-normal, or its
     distribution unpublished). Lower-cased for use mid-sentence. */
  refPositionWord(pct, opts){
    const r = this.refPosition(pct, opts);
    return r ? r.label.charAt(0).toLowerCase()+r.label.slice(1) : null;
  },
  /* the pill, with its mandatory reference-group qualifier */
  refPill(pct, opts){
    const r = this.refPosition(pct, opts);
    if(!r) return '';
    const g = (opts && opts.group) ? ` <em style="font-weight:400">vs ${this.esc(String(opts.group).toLowerCase())}</em>` : '';
    return `<span class="band-pill ${r.cls}">${r.label}${g}</span>`;
  },

  /* ── shared per-group lanes chart ────────────────────────────────────────
     Rows of group descriptives (bar = ±1 SD around the mean dot) with one
     client score line crossing all rows, plus optional dashed cut-off notches.
     Inline SVG: one self-contained element, prints reliably (no absolutely-
     positioned divs that detach from their panel during PDF pagination).
     opts: { max, min?, score, scoreLabel?, dir?:[loText,hiText],
             groups:[{label,color,mean,sd,extra?,median?,iqr?,section?}],
             cuts?:[{score,label?}] }
     Per-group extras (opt-in, no effect on callers that omit them):
       median — draws a notch on the lane at the published median, so skew is
         visible as the notch sitting off the mean dot. IQR is legend-text only:
         sources publish IQR WIDTH, not Q1/Q3, and centring a box on the median
         would assume the symmetry skewed data refute.
       section — lanes are grouped under small captions; a caption + extra gap
         is inserted where a group's section differs from the previous one
         (RBQ-3 uses this to keep its referral-context lane from reading as a
         further severity step above the diagnostic-contrast pair). */
  /* One stacked lane per reference sample, each showing that sample's OWN
     distribution, with the client's score as a single line running through all
     of them. Called only from groupLanes, which owns the decision.

     Each lane is scaled to its own peak. A shared vertical scale would flatten
     the wider samples to nothing against a floor spike (on the OCI-CV-R, 31% of
     the non-clinical sample scored zero), and the vertical axis is unlabelled
     precisely because it carries shape, not measurement. The horizontal axis is
     the one that measures, and nothing here moves along it.

     Reads the CUMULATIVE array and differences it, so the right-hand column
     ("% at or below") and the drawn heights can never disagree. */
  groupDistLanes(gs, opts, W){
    const max = opts.max, min = opts.min || 0, score = opts.score;
    const cuts = opts.cuts || [], dir = opts.dir;
    const scoreTxt = opts.scoreLabel != null ? this.esc(String(opts.scoreLabel)) : String(score);
    const LANE = 52, GAP = 16, R = W - 150, top0 = 44;
    const longest = gs.reduce((m, g) => Math.max(m, String(g.label || '').length), 0);
    const LB = Math.max(170, Math.min(300, Math.round(longest * 7.5) + 16));
    const ys = gs.map((g, i) => top0 + i * (LANE + GAP) + LANE);
    const axisY = ys[ys.length - 1] + 16, H = axisY + 36;
    const xO = v => LB + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (R - LB);
    const at = (d, k) => Math.max(0, Math.min(1, d[Math.max(0, Math.min(d.length - 1, k))]));
    let body = `<text x="${W}" y="${top0 - 30}" text-anchor="end" class="spqsvg-colhdr">${this.esc(opts.rightHeader || '% at or below')}</text>`;
    for(const c of cuts){
      const x = xO(c.score).toFixed(1);
      body += `<line x1="${x}" y1="30" x2="${x}" y2="${axisY}" class="spqsvg-cut"/>` +
        (c.label ? `<text x="${x}" y="26" text-anchor="middle" class="spqsvg-cutlbl">${this.esc(c.label)}</text>` : '');
    }
    let legend = '';
    gs.forEach((g, i) => {
      const y = ys[i], d = g.dist;
      const pmf = []; for(let k = 0; k <= max; k++) pmf[k] = Math.max(0, at(d, k) - (k ? at(d, k - 1) : 0));
      const peak = Math.max(...pmf) || 1;
      // the highest score anyone in this sample actually reached: past it the
      // lane is empty, and that emptiness is a finding, so it is labelled
      let top = 0; pmf.forEach((v, k) => { if(v > 0) top = k; });
      const half = (xO(min + 1) - xO(min)) / 2;
      let path = `M ${(xO(min) - half).toFixed(1)} ${y}`;
      for(let k = 0; k <= top; k++){
        const h = (pmf[k] / peak) * LANE;
        path += ` L ${(xO(k) - half).toFixed(1)} ${(y - h).toFixed(1)} L ${(xO(k) + half).toFixed(1)} ${(y - h).toFixed(1)}`;
      }
      path += ` L ${(xO(top) + half).toFixed(1)} ${y} Z`;
      body += `<text x="${LB - 10}" y="${y + 4}" text-anchor="end" class="spqsvg-lbl">${this.esc(g.label)}</text>` +
        `<path d="${path}" style="fill:${g.color};stroke:${g.color}" fill-opacity="0.28" stroke-width="1.4" stroke-linejoin="round"/>` +
        `<line x1="${LB}" y1="${y}" x2="${R}" y2="${y}" style="stroke:${g.color}" stroke-width="1" opacity="0.45"/>`;
      if(g.median != null)
        body += `<line x1="${xO(g.median).toFixed(1)}" y1="${y - 5}" x2="${xO(g.median).toFixed(1)}" y2="${y + 5}" style="stroke:${g.color}" stroke-width="2.5"/>`;
      body += `<text x="${W}" y="${y + 4}" text-anchor="end" class="spqsvg-pct">${Math.round(at(d, score) * 100)}%</text>`;
      if(top < max)
        body += `<text x="${(xO(top) + 8).toFixed(1)}" y="${y - 3}" class="spqsvg-cutlbl">nobody above ${top}</text>`;
      legend += `<span class="it"><span class="spql-sw" style="background:${g.color}"></span>${this.esc(g.label)}: mean ${g.mean}${g.sd != null ? ` (SD ${g.sd})` : ''}${g.median != null ? `, median ${g.median}${g.iqr != null ? ` (IQR ${g.iqr})` : ''}` : ''}${g.extra ? `, ${g.extra}` : ''}</span>`;
    });
    const sx = xO(score).toFixed(1);
    body += `<line x1="${sx}" y1="14" x2="${sx}" y2="${axisY}" style="stroke:var(--accent)" stroke-width="2"/>` +
      `<text x="${sx}" y="11" text-anchor="middle" class="spqsvg-score">${scoreTxt}</text>` +
      `<line x1="${LB}" y1="${axisY}" x2="${R}" y2="${axisY}" class="spqsvg-axis"/>`;
    for(let i = 0; i <= 4; i++){
      const tv = Math.round(min + (max - min) * i / 4), x = xO(tv).toFixed(1);
      body += `<line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 4}" class="spqsvg-axis"/>` +
        `<text x="${x}" y="${axisY + 15}" text-anchor="${i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}" class="spqsvg-tk">${tv}</text>`;
    }
    if(dir) body += `<text x="${LB}" y="${H - 3}" class="spqsvg-dir">${this.esc(dir[0])}</text><text x="${R}" y="${H - 3}" text-anchor="end" class="spqsvg-dir">${this.esc(dir[1])}</text>`;
    const svg = `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img">${body}</svg>`;
    if(opts.legend === false) return svg;
    return `${svg}
      <div class="spql-legend"><span class="it"><span class="spql-sw spql-sw-you"></span>This client (${scoreTxt})</span>${legend}</div>`;
  },

  groupLanes(opts){
    const max = opts.max, min = opts.min || 0, score = opts.score, cuts = opts.cuts || [], dir = opts.dir;
    const gs = (opts.groups || []).filter(g => g && g.mean != null);
    const scoreTxt = opts.scoreLabel != null ? this.esc(String(opts.scoreLabel)) : String(score);
    // 900-unit viewBox: at typical panel widths the 12-13px classes render at
    // roughly table-text size instead of scaling up (the old 600 box made the
    // chart type ~2x the surrounding table)
    const hasRight = gs.some(g => g.right != null);
    const rightHdr = opts.rightHeader || 'client %ile';
    const W = 900;
    /* DISTRIBUTION MODE. Where every lane carries the sample's own cumulative
       distribution (`g.dist`, see the OCI-CV-R registry note), draw the actual
       distribution instead of a mean±SD capsule. The capsule is a summary of
       what the curve shows directly, so the two are alternatives, not layers.
       Stepped, deliberately: the step heights ARE the published percentages,
       and an averaged curve would flatten the floor spike, push mass past the
       highest score anyone reached, and slide mass along the one axis this
       chart actually measures. Everything else - axis, cut-off marks, client
       line, legend - is shared, so the two modes cannot drift apart. */
    if(gs.length && gs.every(g => Array.isArray(g.dist) && g.dist.length))
      return this.groupDistLanes(gs, opts, W);
    // Left gutter sized to the longest group label so long reference-group names
    // (e.g. RBQ-3's) aren't clipped at the viewBox's left edge. Floored at the
    // previous fixed 170 so short-label charts render exactly as before.
    const longestLbl = gs.reduce((m, g) => Math.max(m, String(g.label || '').length), 0);
    const LB = Math.max(170, Math.min(300, Math.round(longestLbl * 7.5) + 16));
    const R = hasRight ? W - 74 : W,
          top0 = cuts.length ? 40 : (hasRight ? 34 : 26), gap = 27;
    const newSection = i => gs[i].section && (i === 0 || gs[i].section !== gs[i - 1].section);
    const ys = []; let yCur = top0;
    gs.forEach((g, i) => { if(newSection(i)) yCur += 17; ys.push(yCur); yCur += gap; });
    const axisY = (ys.length ? ys[ys.length - 1] : top0) + 20, H = axisY + 36;
    const xO = v => LB + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (R - LB);
    let body = '';
    // shared header over the right-edge percentile column (states the unit once,
    // so the bare ordinals below stay clean and align with the table columns)
    if(hasRight) body += `<text x="${W}" y="${top0 - 15}" text-anchor="end" class="spqsvg-colhdr">${this.esc(rightHdr)}</text>`;
    for(const c of cuts){
      const x = xO(c.score).toFixed(1);
      body += `<line x1="${x}" y1="28" x2="${x}" y2="${axisY}" class="spqsvg-cut"/>` +
        (c.label ? `<text x="${x}" y="24" text-anchor="middle" class="spqsvg-cutlbl">${this.esc(c.label)}</text>` : '');
    }
    body += `<line x1="${xO(score).toFixed(1)}" y1="12" x2="${xO(score).toFixed(1)}" y2="${axisY}" style="stroke:var(--accent)" stroke-width="2"/>` +
      `<text x="${xO(score).toFixed(1)}" y="9" text-anchor="middle" class="spqsvg-score">${scoreTxt}</text>`;
    let legend = '';
    gs.forEach((g, i) => {
      const y = ys[i], lo = xO(Math.max(min, g.mean - (g.sd || 0))), hi = xO(g.mean + (g.sd || 0));
      // section caption above the group's first lane; paper-stroke halo keeps it
      // legible where the client's score line crosses it
      if(newSection(i)) body += `<text x="${LB}" y="${y - 16}" class="spqsvg-colhdr" style="paint-order:stroke;stroke:var(--paper);stroke-width:3px">${this.esc(g.section)}</text>`;
      body += `<text x="${LB - 10}" y="${y + 4}" text-anchor="end" class="spqsvg-lbl">${this.esc(g.label)}</text>` +
        `<rect x="${lo.toFixed(1)}" y="${y - 7}" width="${(hi - lo).toFixed(1)}" height="14" rx="7" style="fill:${g.color}" opacity="0.34"/>` +
        `<circle cx="${xO(g.mean).toFixed(1)}" cy="${y}" r="5" style="fill:${g.color};stroke:var(--paper)" stroke-width="1.5"/>`;
      if(g.median != null){
        const mx = xO(g.median).toFixed(1);
        body += `<line x1="${mx}" y1="${y - 7}" x2="${mx}" y2="${y + 7}" style="stroke:${g.color}" stroke-width="2.5"/>`;
      }
      if(g.right != null) body += `<text x="${W}" y="${y + 4}" text-anchor="end" class="spqsvg-pct">${this.esc(String(g.right))}</text>`;
      legend += `<span class="it"><span class="spql-sw" style="background:${g.color}"></span>${this.esc(g.label)}: mean ${g.mean}${g.sd != null ? ` (SD ${g.sd})` : ''}${g.median != null ? `, median ${g.median}${g.iqr != null ? ` (IQR ${g.iqr})` : ''}` : ''}${g.extra ? `, ${g.extra}` : ''}</span>`;
    });
    body += `<line x1="${LB}" y1="${axisY}" x2="${R}" y2="${axisY}" class="spqsvg-axis"/>`;
    for(let i = 0; i <= 4; i++){
      let tv = min + (max - min) * i / 4;
      if((max - min) >= 8) tv = Math.round(tv);  // integer scales: tick at a round value
      const x = xO(tv), anc = i === 0 ? 'start' : i === 4 ? 'end' : 'middle';
      const tl = Number.isInteger(tv) ? tv : (Math.round(tv * 100) % 10 === 0 ? tv.toFixed(1) : tv.toFixed(2));
      body += `<line x1="${x.toFixed(1)}" y1="${axisY}" x2="${x.toFixed(1)}" y2="${axisY + 4}" class="spqsvg-axis"/><text x="${x.toFixed(1)}" y="${axisY + 15}" text-anchor="${anc}" class="spqsvg-tk">${tl}</text>`;
    }
    if(dir) body += `<text x="${LB}" y="${H - 3}" class="spqsvg-dir">${this.esc(dir[0])}</text><text x="${R}" y="${H - 3}" text-anchor="end" class="spqsvg-dir">${this.esc(dir[1])}</text>`;
    const svg = `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img">${body}</svg>`;
    if(opts.legend === false) return svg;   // caller renders its own shared legend
    return `${svg}
      <div class="spql-legend"><span class="it"><span class="spql-sw spql-sw-you"></span>This client (${scoreTxt})</span>${legend}</div>`;
  },

  /* ── shared severity-zone track ──────────────────────────────────────────
     One axis divided into named, tinted severity zones with the boundary
     values in a header row, a marker line + value for the client's score,
     and optional extra reference marks (e.g. a clinical-sample mean).
     Answers "which band, and how far past which threshold" on the chart
     itself; the sibling of groupLanes (which answers "where vs people").
     Inline SVG, same 900-unit viewBox so type renders at table size.
     opts: { max, min?, score, scoreLabel?, dir?:[loText,hiText],
             zones:[{from,to,label,tone?|color?}],
             marks?:[{score,color?,title?}] }
     tone: 0 (good) … 4 (most severe), mapped onto the suite palette. */
  severityTrack(opts){
    const max = opts.max, min = opts.min || 0, score = opts.score;
    const zones = opts.zones || [], marks = opts.marks || [], dir = opts.dir;
    const scoreTxt = opts.scoreLabel != null ? this.esc(String(opts.scoreLabel)) : String(score);
    const TONES = ['var(--green)', 'var(--amber)', 'var(--c-b85c38)', 'var(--rose)', 'var(--c-8f2937)'];
    const W = 900, L = 10, R = 890,
          hdrY = 14, zTop = 22, zH = 18, mkTop = zTop - 10, mkBot = zTop + zH + 8,
          valY = mkBot + 16, H = dir ? valY + 20 : valY + 6;
    const xO = v => L + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (R - L);
    let body = '';
    zones.forEach((z, i) => {
      const x0 = xO(z.from), x1 = xO(z.to), col = z.color || TONES[z.tone != null ? z.tone : Math.round(i * 4 / Math.max(1, zones.length - 1))];
      body += `<rect x="${x0.toFixed(1)}" y="${zTop}" width="${(x1 - x0).toFixed(1)}" height="${zH}" style="fill:${col}" opacity="0.16"/>`;
      // in-zone name, only when it fits (the chips below still name every band)
      if(z.label && (x1 - x0) > z.label.length * 6.4 + 10)
        body += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${zTop + zH / 2 + 4}" text-anchor="middle" class="spqsvg-zlbl" style="fill:${col}">${this.esc(z.label)}</text>`;
      // boundary value in the header row (each zone's start, except the first);
      // blabel overrides the printed value (e.g. a reversed scale's "≤16")
      if(i > 0) body += `<text x="${x0.toFixed(1)}" y="${hdrY}" text-anchor="middle" class="spqsvg-tk">${this.esc(String(z.blabel != null ? z.blabel : z.from))}</text>`;
    });
    body += `<text x="${L}" y="${hdrY}" class="spqsvg-tk">${min}</text><text x="${R}" y="${hdrY}" text-anchor="end" class="spqsvg-tk">${max}</text>`;
    for(const m of marks){
      const x = xO(m.score).toFixed(1);
      body += `<line x1="${x}" y1="${zTop - 4}" x2="${x}" y2="${zTop + zH + 4}" style="stroke:${m.color || 'var(--c-2f6f6f)'}" stroke-width="2">${m.title ? `<title>${this.esc(m.title)}</title>` : ''}</line>`;
    }
    const sx = xO(score).toFixed(1);
    body += `<line x1="${sx}" y1="${mkTop}" x2="${sx}" y2="${mkBot}" style="stroke:var(--ink)" stroke-width="2"/>` +
      `<circle cx="${sx}" cy="${mkBot}" r="5" style="fill:var(--ink);stroke:var(--paper)" stroke-width="2"/>` +
      `<text x="${sx}" y="${valY}" text-anchor="middle" class="spqsvg-score" style="fill:var(--ink)">${scoreTxt}</text>`;
    if(dir) body += `<text x="${L}" y="${H - 4}" class="spqsvg-dir">${this.esc(dir[0])}</text><text x="${R}" y="${H - 4}" text-anchor="end" class="spqsvg-dir">${this.esc(dir[1])}</text>`;
    return `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img">${body}</svg>`;
  },

  /* ── shared discrete symptom-count strip ─────────────────────────────────
     For COUNT-based screens (Vanderbilt, BAARS): n item positions as dots
     (filled = counted symptom), with the screening range (count >= need)
     tinted. A continuous bar would misread as "% severity"; the dots keep
     the discreteness honest. opts: { n, count, need, met? } */
  countStrip(opts){
    const n = opts.n, count = Math.max(0, Math.min(n, opts.count)), need = opts.need;
    const W = 900, L = 10, R = 890, zTop = 14, zH = 18, H = 48;
    const xC = k => L + (k - 0.5) * (R - L) / n;
    const xB = L + (need - 1) * (R - L) / n;   // midway before the need-th dot
    const dotFill = opts.met ? 'var(--rose)' : 'var(--ink-soft)';
    let body =
      `<rect x="${L}" y="${zTop}" width="${(xB - L).toFixed(1)}" height="${zH}" style="fill:var(--ink-faint)" opacity="0.10"/>` +
      `<rect x="${xB.toFixed(1)}" y="${zTop}" width="${(R - xB).toFixed(1)}" height="${zH}" style="fill:var(--rose)" opacity="0.16"/>` +
      `<text x="${xB.toFixed(1)}" y="10" text-anchor="middle" class="spqsvg-tk">≥${need} screen range</text>`;
    for(let k = 1; k <= n; k++){
      const cx = xC(k).toFixed(1), cy = zTop + zH / 2;
      body += k <= count
        ? `<circle cx="${cx}" cy="${cy}" r="6" style="fill:${dotFill};stroke:var(--paper)" stroke-width="1.5"/>`
        : `<circle cx="${cx}" cy="${cy}" r="6" fill="none" style="stroke:var(--ink-faint)" stroke-width="1.5"/>`;
    }
    body += `<text x="${L}" y="${H - 3}" class="spqsvg-tk">0</text><text x="${R}" y="${H - 3}" text-anchor="end" class="spqsvg-tk">${n} symptoms</text>`;
    return `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img">${body}</svg>`;
  },

  /* zones from a screener-style severity array ([{max,label}] ascending, last
     max=null) + bandRanges; boundaries drawn at each band's start (b.max+1) */
  sevZones(severity, totalMax, min){
    let start = min || 0;
    return (severity || []).map(b => {
      const to = b.max != null ? Math.min(b.max + 1, totalMax) : totalMax;
      const z = { from: start, to, label: b.label };
      start = to;
      return z;
    });
  },

  /* map an age to a Kynast age band; null below 20 (out of the study's 20–79 range) */
  rmetAgeBand(age){
    if(age==null || age<20) return null;
    if(age<=29) return '20-29';
    if(age<=39) return '30-39';
    if(age<=49) return '40-49';
    if(age<=59) return '50-59';
    if(age<=79) return '60+';
    return null;   // the norms stop at 79
  },

  /* age- & sex-adjusted percentile (Kynast 2021). Returns {pct,bound,band,sex,gm,
     interp,belowFloor} when computable, or {unavailable:true, reason} otherwise.
     Scores with no published row are linearly interpolated (interp:true). Below a
     cell's lowest row the true rank is only known to be at or below that row's value
     (belowFloor:true, bound '≤'); above the highest row it is flagged '≥'. */
  rmetAgePctile(t, score){
    const an = t.ageNorms; if(!an) return null;
    const c = State.client;
    const age = c.dob ? this.calcAge(c.dob, c.date) : null;
    const band = this.rmetAgeBand(age);
    const sex = c.sex;
    if(!band) return {unavailable:true, reason: age==null ? 'a date of birth' : 'an age from 20 to 79 (the range these norms cover)'};
    if(sex!=='male' && sex!=='female') return {unavailable:true, reason:'the client’s sex'};
    const tbl = an.pctile[sex] && an.pctile[sex][band];
    if(!tbl) return {unavailable:true, reason:'matching normative data'};
    const scores = Object.keys(tbl).map(Number).sort((a,b)=>a-b);
    let pct, bound='', interp=false, belowFloor=false;
    const open = ((an.openRows||{})[sex]||{})[band] || {};
    if(open.le!=null && score <= open.le) pct = tbl[open.le];          // "≤12" row
    else if(open.ge!=null && score >= open.ge) pct = tbl[open.ge];     // "≥32" row
    else if(tbl[score]!=null) pct = tbl[score];
    else if(score < scores[0]){ pct = tbl[scores[0]]; bound='≤'; belowFloor=true; }
    else if(score > scores[scores.length-1]){ pct = tbl[scores[scores.length-1]]; bound='≥'; }
    else {
      let lo=scores[0], hi=scores[scores.length-1];
      for(const s of scores){ if(s<score) lo=s; if(s>score){ hi=s; break; } }
      pct = tbl[lo] + ((score-lo)/(hi-lo))*(tbl[hi]-tbl[lo]);
      interp = true;
    }
    return {pct:Math.round(pct), bound, band, sex, gm:an.groupMeans[band], interp, belowFloor,
            floorScore:scores[0], belowSample: an.sampleMin!=null && score < an.sampleMin};
  },

  /* ═══════════ RMET RESULTS ═══════════ */
  resultsRMET(t, r){
    const score = r.total;
    const max = r.totalMax;            // 36
    const chance = t.scoring.chance;   // 9

    // normative reference groups
    const findNorm = (grp, sex) => t.norms.find(n=>n.group===grp && n.sex===sex);
    const control = findNorm('General population controls','all');
    const controlSex = State.client.sex ? findNorm('General population controls', State.client.sex) : null;
    const autism = findNorm('Autism','all');
    const refCtrl = controlSex || control;

    const zCtrl = refCtrl && refCtrl.sd>0 ? (score-refCtrl.mean)/refCtrl.sd : 0;
    const zAut  = autism && autism.sd>0 ? (score-autism.mean)/autism.sd : 0;

    // Position uses the shared reference ladder, REVERSED (dir:'low' — on this
    // task lower scores are the clinical direction). Where the client falls in
    // the Kynast age×sex tables those are TRUE empirical percentiles, so the
    // full ladder applies; otherwise the position is stated in words off the
    // Baron-Cohen control mean with no pill.
    //
    // The old "at or near chance" red band (score <= chance+3) has been REMOVED:
    // chance (9/36) is published, but the +3 buffer was an app invention, and a
    // red severity pill contradicts this instrument's own caveat (Higgins et al.
    // 2026: not a validated dimensional score) and the panel below, which states
    // there is no diagnostic cut-off. Scoring at or below chance is now reported
    // as the factual performance observation it is.
    const ageNorm = this.rmetAgePctile(t, score);
    // Below a cell's lowest published row the true rank is only known to be at
    // or below that row's value (Kynast p.5: some scores have no rank), so no
    // reference band is given; feeding the floor value to the ladder understated
    // it (e.g. 9/36 read "Mildly below" against a floor of the 15th). A ceiling
    // ">=98th" is the good direction and lands inside the reference range.
    const ageGroup = ageNorm && ageNorm.band ? `${ageNorm.sex==='male'?'men':'women'} aged ${ageNorm.band}` : '';
    const kynastPct = (ageNorm && ageNorm.pct!=null && !ageNorm.belowFloor) ? ageNorm.pct : null;
    const refPill = kynastPct!=null
      ? this.refPill(kynastPct, { dir:'low', group:ageGroup })
      : (ageNorm && ageNorm.belowFloor
          ? `<span class="band-pill band-neutral">${ageNorm.belowSample ? 'Below the whole reference sample' : 'Below the tabulated range'} <em style="font-weight:400">vs ${this.esc(ageGroup)}</em></span>`
          : '');
    const atChance = score <= chance;
    const chanceNote = atChance
      ? `<span class="band-pill band-neutral">At or below chance (${chance}/${max})</span>`
      : '';

    const ctrlName = refCtrl===controlSex ? `controls (${State.client.sex})` : 'general-population controls';
    const posWord = (refCtrl && refCtrl.sd>0) ? this.refPositionWord(zToPercentile(zCtrl), {dir:'low'}) : null;
    const summary = `This client identified ${score} of ${max} expressions correctly, around the ${this.pctileShort(zCtrl)} percentile relative to ${ctrlName} (mean ${refCtrl?refCtrl.mean:'—'})${posWord?`, ${posWord}`:''}. On this task, lower scores are the clinically relevant direction: in the validation study, autistic adults scored lower than controls. Chance performance is ${chance}/${max}${atChance?`, and this total is at or below it, so read the score as uninformative about mental-state recognition and check task engagement, vocabulary and comprehension before interpreting anything else`:''}.`;

    // ---- lanes chart: row per group (±1 SD bar + mean dot), score line, chance notch ----
    const normLanes = this.groupLanes({
      max, score,
      groups:[
        control ? {label:'Controls', color:'var(--green)', mean:control.mean, sd:control.sd, right:this.pctileCell(zCtrl)} : null,
        autism ? {label:'Autism / AS-HFA', color:'var(--rose)', mean:autism.mean, sd:autism.sd, right:this.pctileCell(zAut)} : null
      ].filter(Boolean),
      cuts:[{score:chance, label:`chance ${chance}`}],
      dir:['fewer correct (clinical direction)','more correct']
    });
    const timeTag = (r.timing && r.timing.totalMs>0) ? `<span class="card-tag tag-social">Completed in ${App.fmtClock(r.timing.totalMs)}</span>` : '';

    // ---- age- & sex-adjusted percentile (Kynast 2021, German standardization) ----
    // (ageNorm resolved above, where it also drives the reference-position pill)
    let ageNormBlock = '';
    if(ageNorm && ageNorm.pct!=null){
      const sexW = ageNorm.sex==='male' ? 'men' : 'women';
      const gm = ageNorm.gm;
      const n = ageNorm.pct;
      const suf = (n%10===1&&n%100!==11)?'st':(n%10===2&&n%100!==12)?'nd':(n%10===3&&n%100!==13)?'rd':'th';
      ageNormBlock = `
        <div class="rmet-agenorm">
          <div class="ran-figure"><span class="ran-pct">${ageNorm.bound||''}${n}<small>${suf}</small></span><span class="ran-cap">percentile</span></div>
          <div class="ran-body">
            <div class="ran-head">Age- &amp; sex-adjusted position</div>
            <p>Compared with ${sexW} aged ${ageNorm.band} (expected mean ${gm.mean}, SD ${gm.sd}), ${ageNorm.belowFloor
              ? `this score is below the lowest score in the published table for this group (${ageNorm.floorScore}, the ${n}${suf} percentile), so it is at or below the ${n}${suf} percentile; the table does not show how far below.${ageNorm.belowSample ? ` No one in the whole reference sample (966 adults) scored below ${t.ageNorms.sampleMin}.` : ''}`
              : `this score is around the ${ageNorm.bound||''}${n}${suf} percentile.${ageNorm.interp ? ' The published table has no row for this exact score, so this value is interpolated between the neighbouring rows.' : ''}${ageNorm.belowSample ? ` No one in the whole reference sample (966 adults) scored below ${t.ageNorms.sampleMin}.` : ''}`} Recognition declines with age, so this correction matters most for older adults; the unadjusted comparison above uses a young-adult control mean and can understate an older client's standing.</p>
            <p class="ran-src">German-version standardization (Kynast et al. 2021); a close approximation for English administration, not an exact norm.</p>
          </div>
        </div>`;
    } else if(ageNorm && ageNorm.unavailable){
      ageNormBlock = `<p class="ran-missing">An age- &amp; sex-adjusted percentile (Kynast 2021, ages 20–79) needs ${ageNorm.reason}. Showing the Baron-Cohen comparison only.</p>`;
    }

    // ---- item-by-item breakdown: correct word vs the response given ----
    const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const pi = r.perItem || {};
    const itemRows = t.items.map(item=>{
      const p = pi[item.n] || {};
      const target = (item.options && item.options[item.correct]!=null) ? item.options[item.correct] : '—';
      const chosen = (p.chosen!=null && item.options && item.options[p.chosen]!=null) ? item.options[p.chosen] : (p.chosen==null ? '—' : '?');
      const ok = !!p.correct;
      return `<div class="rmet-r ${ok?'ok':'no'}"><span class="ri-n">${item.n}</span><span class="ri-target">${esc(target)}</span><span class="ri-resp">${esc(chosen)}</span><span class="ri-mark">${ok?'✓':'✗'}</span></div>`;
    }).join('');
    const wrongList = t.items.filter(item=>!(pi[item.n] && pi[item.n].correct)).map(i=>i.n);
    const itemPanel = `
      <div class="panel">
        <div class="panel-head"><h3>Item-by-item responses</h3></div>
        <p class="panel-sub">The target word for each photo and the response given: ${score} correct, ${max-score} incorrect or blank${wrongList.length?` (items ${wrongList.join(', ')})`:''}.</p>
        <div class="rmet-report">
          <div class="rmet-r rmet-h"><span class="ri-n">#</span><span>Correct answer</span><span>Response given</span><span class="ri-mark"></span></div>
          ${itemRows}
        </div>
      </div>`;

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">Eyes Test score</div>
          <h2>${score} out of ${max}</h2>
          <p>${summary}</p>
          ${refPill}${refPill&&chanceNote?' ':''}${chanceNote}
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Score vs norms</h3>${timeTag}</div>
        <p class="panel-sub">Each row is one published group: the bar spans ±1 SD around the mean (dot), the vertical line is this client's score, and the dashed notch marks chance performance (${chance}). The groups overlap heavily; read the position with the percentiles, not as a cut-off. Lower scores are the clinical direction. The RMET is untimed; completion time is descriptive context only.</p>
        ${normLanes}
        ${ageNormBlock}
      </div>

      ${itemPanel}

      <div class="panel">
        <div class="panel-head"><h3>About this result</h3></div>
        <p class="panel-sub" style="margin-bottom:0">The Eyes Test measures recognition of complex mental states from the eye region, a performance measure and screening supplement only. There is no diagnostic cut-off; a low score has many explanations (attention, vocabulary, language, culture, mood) and a typical score does not exclude autism. Recent evidence questions its structural validity, so weight it lightly within a full assessment.</p>
        <p class="src-note">Psychometric critique: Higgins et al. (2026), Assessment.</p>
      </div>
    `;
  },

  /* age band for PHQ-9 / GAD-7 community norms (band sets differ at the youngest edge) */
  screenerAgeBand(age, normSet){
    if(age == null) return null;
    if(normSet === 'gad7'){ if(age < 16) return null; if(age <= 24) return '16-24'; }
    else { if(age <= 24) return '14-24'; }
    if(age <= 34) return '25-34';
    if(age <= 44) return '35-44';
    if(age <= 54) return '45-54';
    if(age <= 64) return '55-64';
    if(age <= 74) return '65-74';
    return '75+';
  },
  /* cumulative percentile (% of community at or below this score) + which reference column was used */
  screenerPercentile(t, total){
    const sc = t.scoring;
    const norms = sc.normSet === 'phq9' ? (typeof PHQ9_NORMS!=='undefined'?PHQ9_NORMS:null)
                                        : (typeof GAD7_NORMS!=='undefined'?GAD7_NORMS:null);
    if(!norms) return null;
    const c = State.client;
    const age = c.dob ? this.calcAge(c.dob, c.date) : null;
    const band = this.screenerAgeBand(age, sc.normSet);
    let arr = null, ref = 'the general population', demo = false;
    if(sc.normBy === 'sexage'){
      const sex = c.sex;
      if((sex==='male'||sex==='female') && band && norms[sex] && norms[sex][band]){ arr = norms[sex][band]; ref = `${sex==='male'?'men':'women'} aged ${band}`; demo = true; }
      else arr = norms.total;
    } else {
      if(band && norms.age && norms.age[band]){ arr = norms.age[band]; ref = `adults aged ${band}`; demo = true; }
      else arr = norms.total;
    }
    if(!arr) return null;
    const idx = Math.max(0, Math.min(arr.length-1, total));
    return {pct: arr[idx], ref, demo};
  },

  /* ═══════════ PHQ-9 / GAD-7 (severity screeners) RESULTS ═══════════ */
  /* ═══════════ OCI family RESULTS ═══════════ */
  /* Obsessive-Compulsive Inventory. Summed total against the form's OWN published
     ROC cut-offs, its own reference groups and its own subscale allocation — every
     number read from t, nothing about the adult form baked in here.

     THE COLOUR COMES FROM THE CUT-OFF, not from a percentile. The OCI-R has
     published ROC cut-scores, so the suite's reference-position ladder (which
     exists for instruments that have none) is deliberately not used. Percentiles
     are shown as supporting context only.

     Subscales carry the paper's own discrimination evidence next to them:
     `subscaleNonDiscriminating` names those that did NOT separate the diagnostic
     groups, so an elevation there is not silently read as evidence of OCD. */
  resultsOci(t, r){
    const sc = t.scoring, max = sc.totalMax, total = r.total;
    const cut = sc.cutoff, cutAc = sc.cutoffAc;
    const S = r.subscales || {};
    const groups = t.compareGroups || [];
    const nonDisc = new Set(t.subscaleNonDiscriminating || []);
    const D = t.subscaleD || {};
    // reference lanes are ordered lowest-scoring first, so the first is always the
    // "least unwell" comparison and the last is always the OCD sample, whatever
    // the form calls them (adult: nonanxious/OCD; child: non-clinical/CC/OCD)
    const nac = groups[0], ocd = groups[groups.length - 1];
    const who = /child|young/i.test(t.respondent || '') ? 'young person' : 'client';
    // the axis words come from the form's own framing: the adult scale rates
    // DISTRESS, the child scale rates FREQUENCY. Do not share one pair.
    const dirWords = /frequen|often/i.test(t.higherMeans || '')
      ? ['no symptoms', 'symptoms always present']
      : ['no distress', 'maximum distress'];
    const subLens = Object.keys(t.subscales || {}).map(k => (t.subscales[k].items || []).length);
    const equalLen = subLens.length > 0 && subLens.every(l => l === subLens[0]);

    // Colour is driven by the RECOMMENDED cut-off (sc.cutoff), with the neutral
    // band covering the zone where the two published cut-offs disagree. Note the
    // two forms order their pair oppositely — the OCI-R's recommended 21 is the
    // HIGHER of its pair, the OCI-CV-R's recommended 6 is the LOWER — so keying
    // off "the recommended one" rather than off lo/hi is what makes this correct
    // for both. On the child form the middle zone is simply unreachable.
    const loC = Math.min(cut, cutAc != null ? cutAc : cut);
    const hiC = Math.max(cut, cutAc != null ? cutAc : cut);
    let bandCls, bandLabel, tagWord;
    if(total >= cut){ bandCls='band-elevated'; bandLabel=`At or above the recommended cut-off (≥${cut})`; tagWord='screen positive'; }
    else if(cutAc != null && total >= cutAc){ bandCls='band-neutral'; bandLabel=`Between the two published cut-offs (${loC}–${hiC-1})`; tagWord='borderline'; }
    // &lt; not a bare "<": browsers happen to render "<18" literally (a digit can't
    // start a tag name) but it is invalid markup and breaks any downstream parse
    else { bandCls='band-typical'; bandLabel=`Below ${cutAc != null && cutAc < cut ? 'both published cut-offs' : 'the recommended cut-off'} (&lt;${loC})`; tagWord='screen negative'; }

    /* Published severity band, where the instrument has one. It answers a DIFFERENT
       question from the cut-off — how severe, not whether present — so it gets its
       own pill rather than overwriting the screening one, and the page flags the
       case where they disagree (a "Mild" band on a score that has not reached the
       screening cut-off means a low score, not mild OCD). */
    const sev = r.severity;
    const sevBands = Array.isArray(sc.severity) ? sc.severity : null;
    const sevRange = b => {
      const i = sevBands.indexOf(b), from = i === 0 ? 0 : sevBands[i-1].max + 1;
      return b.max == null ? `${from}–${max}` : `${from}–${b.max}`;
    };
    const sevPill = sev ? `<span class="band-pill ${sev.cls}">${this.esc(sev.label)} (${sevRange(sev)})</span>` : '';
    const sevDisagrees = !!(sev && total < cut);

    // each cut-off names the contrast IT was derived against, read off the
    // registry, because the two forms' contrasts are not the same populations
    const primary = t.cutoffs && t.cutoffs.find(c => c.recommended);
    const secondary = t.cutoffs && t.cutoffs.find(c => !c.recommended);
    const cPri = (primary && primary.contrast) || 'controls';
    const cSec = (secondary && secondary.contrast) || 'clinical controls';
    // NB the adult and child forms order their two cut-offs oppositely: on the
    // OCI-R the anxious-control cut-off is the LOWER of the pair, on the OCI-CV-R
    // the clinical-control cut-off is the HIGHER. Phrase from lo/hi, not from role.
    const lo = loC, hi = hiC;
    const roleOf = s => s === cut ? cPri : cSec;
    const summary = `${t.name} total <b>${total}</b> of ${max}. ${
      total >= hi
        ? `This is at or above ${hi}, the higher of the two published cut-offs (vs ${this.esc(roleOf(hi))}), so the screen is <b>positive</b> on either.`
        : (total >= lo)
          ? `This falls between the two published cut-offs: at or above ${lo} (vs ${this.esc(roleOf(lo))}) but below ${hi} (vs ${this.esc(roleOf(hi))}). Which one applies depends on the differential you are actually working with.`
          : `This is below ${lo}, the lower of the two published cut-offs, so the screen is <b>negative</b>.`
    } Higher totals mean ${this.esc(t.higherMeans || 'more symptoms')}.`;

    // lanes: one per published reference group, each with this client's standing
    // inside it, medians drawn so skew stays visible.
    //
    // PERCENTILE OR SD? Only when the source itself supports a normal-curve
    // reading. Foa et al. (2002) state their two adult samples were normally
    // distributed, so the OCI-R gets percentiles; the OCI-CV-R paper makes no such
    // claim and its samples are floor-bound, so it sets normsNonNormal and gets SD
    // distance instead. Never infer normality from a mean and an SD alone.
    // SD instead of percentile, for either of two independent reasons:
    //   normsNonNormal — the source's distributions won't carry a normal-curve
    //     percentile at all (OCI-CV-R: floor-bound, no normality claimed)
    //   sdOnly — the distribution would carry one, but the SAMPLE won't carry the
    //     population reading a percentile implies (OCI-R: 477 US undergraduates)
    const noPct = !!(t.normsNonNormal || t.sdOnly);
    const cell = z => noPct ? this.sdCell(z) : this.pctileCell(z);
    const laneGroups = groups.map((g, i) => ({
      label:g.label, color: i === 0 ? 'var(--green)' : (i === groups.length - 1 ? 'var(--rose)' : 'var(--ink-faint)'),
      mean:g.mean, sd:g.sd, median:g.median, iqr:g.iqr,
      extra:`n=${g.n}`,
      dist:g.dist,
      right: g.sd > 0 ? cell((total - g.mean) / g.sd) : null
    }));
    // every lane must carry a distribution or none does: a chart that drew two
    // samples as curves and a third as a capsule would invite the reader to
    // compare them as if they were the same kind of thing
    const hasDist = laneGroups.length > 0 && laneGroups.every(g => Array.isArray(g.dist) && g.dist.length);
    const cuts = [];
    if(cutAc != null) cuts.push({score:cutAc, label:String(cutAc)});
    cuts.push({score:cut, label:String(cut)});

    /* Each row is a compact version of the totals chart above it: one capsule per
       published sample spanning its mean ±1 SD, with the client's line through
       them all.

       WHAT THIS REPLACED, and why. The bar used to be raw/max with an amber fill
       at 50% of maximum. That is the percent-of-max rule BAND_DESCRIPTOR_AUDIT
       §2.8 deleted from scoreRing as a landmine, reinvented here: it coloured on
       a threshold that appears in no paper, on subscales whose own source
       declined to publish one (the OCI-CV-R paper says so outright - the total
       out-performed every subscale), and its bar length invited exactly the
       cross-subscale comparison the paragraph above it forbids. Capsules answer
       the question the panel is actually for - where does this person sit
       against these samples - and show the thing a dot cannot: how heavily the
       groups overlap, which on most of these subscales is almost entirely. */
    const sepBadge = d => {
      // same vocabulary and the same four classes as the SPQ separation badges,
      // so one effect size is never described two ways in one report
      const a = Math.abs(d), r2 = a.toFixed(2);
      const b = a < 0.2 ? {c:'none', x:`Groups overlap almost entirely (d≈${r2})`}
        : a < 0.5 ? {c:'low',  x:`Small separation, large overlap between groups (d≈${r2})`}
        : a < 0.8 ? {c:'mod',  x:`Medium separation (d≈${r2})`}
        : {c:'good', x:`Large separation (d≈${r2})`};
      // a NEGATIVE d is not a weaker positive one: the controls scored higher,
      // so the direction has to be said, not just the size
      return `<span class="spql-badge spql-badge-${b.c}" style="margin:0;white-space:nowrap">${d < 0 ? `Controls scored higher (d≈−${r2})` : b.x}</span>`;
    };
    const subRows = Object.keys(t.subscales || {}).map(k => {
      const s = S[k]; if(!s) return '';
      const d = D[k], ns = nonDisc.has(k);
      const lanes = groups.map((g, i) => ({
        g: g.subs && g.subs[k], label:g.label,
        color: i === groups.length - 1 ? 'var(--rose)' : (i === 0 ? 'var(--green)' : 'var(--ink-faint)')
      })).filter(l => l.g && l.g.sd > 0);
      const cut = ((t.subCutoffs || {})[k] || []).find(c => c.recommended);
      const W = 470, rowGap = 16, H = lanes.length * rowGap + 14, L = 5, Rx = W - 52;
      const x = v => L + (Math.max(0, Math.min(s.max, v)) / s.max) * (Rx - L);
      let body = '';
      lanes.forEach((l, i) => {
        const y = 10 + i * rowGap, lo = x(Math.max(0, l.g.mean - l.g.sd)), hi = x(l.g.mean + l.g.sd);
        const tip = this.esc(`${l.label}: mean ${l.g.mean} (SD ${l.g.sd})${l.g.median != null ? `, median ${l.g.median}` : ''}`);
        body += `<rect x="${lo.toFixed(1)}" y="${y - 5}" width="${Math.max(2, hi - lo).toFixed(1)}" height="10" rx="5" fill="${l.color}" opacity="0.3"><title>${tip}</title></rect>` +
          `<circle cx="${x(l.g.mean).toFixed(1)}" cy="${y}" r="3.4" fill="${l.color}" stroke="var(--paper)" stroke-width="1.2"><title>${tip}</title></circle>` +
          (l.g.median != null ? `<line x1="${x(l.g.median).toFixed(1)}" y1="${y - 5}" x2="${x(l.g.median).toFixed(1)}" y2="${y + 5}" stroke="${l.color}" stroke-width="1.8"/>` : '');
      });
      if(cut) body += `<line x1="${x(cut.score).toFixed(1)}" y1="2" x2="${x(cut.score).toFixed(1)}" y2="${H - 4}" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="3.4 2.6"><title>published cut-off ${cut.score}</title></line>`;
      body += `<line x1="${x(s.raw).toFixed(1)}" y1="2" x2="${x(s.raw).toFixed(1)}" y2="${H - 4}" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"><title>this ${this.esc(who)}: ${s.raw} of ${s.max}</title></line>` +
        `<text x="${Rx + 7}" y="${(H / 2 + 4).toFixed(1)}" font-size="11" fill="var(--ink-faint)" font-family="var(--font-body)">0–${s.max}</text>`;
      return `<div class="sdq-u-row" style="align-items:center">
        <span class="sdq-name">${this.esc(s.name)}<span class="sdq-max"> (${s.nItems} items)</span>${ns ? '<br><span class="sdq-max">does not discriminate</span>' : ''}</span>
        <span class="sdq-score">${s.raw}<span class="sdq-max">/${s.max}</span></span>
        <div class="sdq-track"><svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block" role="img">${body}</svg></div>
        <span class="sdq-pct" style="text-align:right">${d != null ? sepBadge(d) : ''}</span>
      </div>`;
    }).join('');
    /* the legend, and the sentence that makes `d` mean something. A bare "d 0.61"
       is a number the reader has to already know; tied to the picture in front of
       them it is just "how far apart the capsules sit, given how wide they are". */
    const subLegend = `<div class="spql-legend" style="margin:4px 0 2px">
      <span class="it"><span class="spql-sw spql-sw-you"></span>This ${this.esc(who)}</span>
      ${groups.map((g, i) => `<span class="it"><span class="spql-sw" style="background:${i === groups.length - 1 ? 'var(--rose)' : (i === 0 ? 'var(--green)' : 'var(--ink-faint)')}"></span>${this.esc(g.label)}: mean ±1 SD</span>`).join('')}
      <span class="it"><svg width="8" height="12" viewBox="0 0 8 12"><line x1="4" y1="1" x2="4" y2="11" stroke="var(--ink-soft)" stroke-width="2"/></svg>median</span>
    </div>`;

    /* Age-band context, where the source publishes it (OCI-CV-R only). Shown as a
       reference mean for the band the child actually falls in, NEVER as a second
       cut-off: the paper gives one cut-off for all ages. Falls back to naming both
       bands when the age is unknown. */
    const AN = t.ageNorms;
    const age = (typeof State !== 'undefined' && State.client && Number(State.client.age)) || null;
    const ageLine = AN ? (() => {
      const band = age == null ? null : (age < AN.split ? AN.younger : AN.older);
      const other = band === AN.younger ? AN.older : AN.younger;
      const gloss = b => `${this.esc(b.label)} averaged ${b.mean} (SD ${b.sd}, n=${b.n})`;
      return `<div class="panel">
        <div class="panel-head"><h3>Age band</h3><span class="card-tag tag-ocd">context</span></div>
        <p class="panel-sub">${band
          ? `Within the OCD sample, ${gloss(band)}${band.sd > 0 ? `, so this total of ${total} is ${this.esc(this.sdPhrase((total - band.mean) / band.sd, 'age-matched OCD'))}` : ''}. For contrast, ${gloss(other)}. `
          : `Within the OCD sample, ${gloss(AN.younger)} and ${gloss(AN.older)}. No age is recorded for this ${who}, so neither band is applied. `}Older children score higher on the total and on every subscale, which is why this is shown. It is <b>context, not a second cut-off</b>: the published cut-off is the same at every age.</p>
      </div>`;
    })() : '';

    // the Obsessing subscale has its own published cut-off and out-performed the
    // total against non-anxious controls, so it is surfaced rather than buried
    const subCut = (t.subCutoffs || {}).obsessing;
    const obs = S.obsessing;
    const obsPanel = (subCut && obs) ? (() => {
      const oc = subCut.find(c => c.recommended) || subCut[0];
      const hit = obs.raw >= oc.score;
      return `<p class="panel-sub" style="margin-top:12px"><b>Obsessing subscale ${obs.raw}/${obs.max}${hit ? `, at or above its own cut-off of ${oc.score}` : `, below its cut-off of ${oc.score}`}.</b> ${this.esc(oc.note)}</p>`;
    })() : '';

    const nsNames = [...nonDisc].map(k => (t.subscales[k] || {}).name).filter(Boolean);
    const nsLine = nsNames.length ? `<p class="panel-sub"><b>Read ${nsNames.join(' and ')} with care.</b> In the validation sample ${nsNames.length > 1 ? 'these subscales' : 'this subscale'} did not distinguish people with OCD from controls${D.hoarding != null && nonDisc.has('hoarding') ? `, and Hoarding ran the other way entirely: controls scored HIGHER than the OCD patients (d ${D.hoarding})` : ''}. An elevation here is not evidence of OCD. The right-hand column gives each subscale's reference means (controls / OCD) and its effect size.</p>` : '';

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}${sev ? ` On the published severity benchmarks this total falls in the <b>${this.esc(sev.label.toLowerCase())}</b> range.` : ''}</p>
          <span class="band-pill ${bandCls}">${bandLabel}</span>${sevPill}
        </div>
      </div>

      ${this.caveatLine(t)}

      ${sev ? `<div class="panel">
        <div class="panel-head"><h3>Severity benchmark</h3><span class="card-tag tag-ocd">${this.esc(sev.label.toLowerCase())}</span></div>
        <p class="panel-sub">${sevDisagrees
          ? `<b>Read this alongside the screen, not instead of it.</b> This total sits in the <b>${this.esc(sev.label.toLowerCase())}</b> band but has <b>not</b> reached the screening cut-off of ${cut}, so it is <b>not a finding that OCD is present</b> at that level. `
          : `This total sits in the <b>${this.esc(sev.label.toLowerCase())}</b> band and is at or above the screening cut-off of ${cut}, so the two readings agree. `}${this.esc(t.severityCaveat || '')}</p>
        ${this.severityTrack({ max, score:total,
          zones:sevBands.map((b, i) => ({
            from: i === 0 ? 0 : sevBands[i-1].max + 1,
            // a band ending at 15 shades up to where the next starts (16), so the
            // zones meet on the continuous scale, as sevZones does for the Y-BOCS
            to: b.max == null ? max : Math.min(b.max + 1, max),
            label: b.label.toLowerCase(),
            tone: i === 0 ? 0 : (i === sevBands.length - 1 ? 3 : 1)
          })),
          marks:[{score:cut, title:`screening cut-off ${cut}`}],
          dir:dirWords })}
        <p class="panel-sub" style="margin-top:10px">${this.esc(t.severitySource || '')}</p>
      </div>` : ''}

      <div class="panel">
        <div class="panel-head"><h3>Total &amp; published cut-offs</h3><span class="card-tag tag-ocd">${tagWord}</span></div>
        <p class="panel-sub">Both dashed marks are the instrument's own ROC cut-scores, not band boundaries: ${secondary ? `<b>${cut}</b> is the recommended one, derived against ${this.esc(cPri)}; <b>${cutAc}</b> is the alternative, derived against ${this.esc(cSec)}. ` : ''}Neither is a severity threshold, and a score between them is genuinely ambiguous. ${primary ? this.esc(primary.note) : ''}</p>
        ${this.severityTrack({ max, score:total,
          zones:[
            {from:0, to:loC, label:'below', tone:0},
            (loC !== hiC ? {from:loC, to:hiC, label:'between cut-offs', tone:1} : null),
            {from:hiC, to:max, label:'at or above ' + hiC, tone:2}
          ].filter(Boolean),
          dir:dirWords })}
      </div>

      ${laneGroups.length ? `<div class="panel">
        <div class="panel-head"><h3>Total vs the published samples</h3><span class="card-tag tag-ocd">reference</span></div>
        <p class="panel-sub">${hasDist
          ? `Each shape is a published sample's <b>actual distribution</b>: the height at a score is the percentage of that sample who scored exactly there, with the notch at its median. Nothing is modelled and no normal curve is assumed, so the right-hand column can state position directly rather than in standard deviations. The vertical line is this ${who}'s total and the dashed marks are the cut-offs. Two features are worth reading off the chart rather than around: where a sample piles up at the floor, small score changes move a ${who} a long way through it, and where a sample simply stops, it has nothing further to say about higher totals.`
          : `Each bar spans a published sample's mean ±1 SD (dot = mean, notch = median); the vertical line is this ${who}'s total and the dashed marks are the cut-offs. The right-hand column places them inside each sample.`} ${nac && ocd ? `The distributions overlap heavily: the OCD mean (${ocd.mean}) sits only ${(ocd.mean - nac.mean).toFixed(2)} points above the ${nac.label.toLowerCase()} mean (${nac.mean}), which is why even the best cut-off misclassifies a substantial minority of each group. ` : ''}${hasDist ? '' : (noPct
          ? `Distance is given in <b>standard deviations, not percentiles</b>: this instrument's reference samples are floor-bound and right-skewed (note how far each median sits from its mean), and the source makes no claim of normality, so a normal-curve percentile would be a stronger statement than the data support.`
          : `Percentiles are shown because the source states these samples were normally distributed; the medians are drawn so any residual skew stays visible.`)}</p>
        ${this.groupLanes({ max, score:total, groups:laneGroups, cuts,
          rightHeader:hasDist ? '% at or below' : (noPct ? 'vs group mean' : 'client %ile'), dir:dirWords })}
        ${groups.some(g => g.source) ? `<p class="panel-sub" style="margin-top:10px">${groups.filter(g => g.source).map(g => `<b>${this.esc(g.label)}:</b> ${this.esc(g.source)}`).join(' ')}${primary ? ` <b>Note:</b> the ${cut} and ${cutAc} cut-offs were derived on Foa et al.'s own OCD-versus-control comparison, so the dashed marks do not sit on the OCD sample shown here.` : ''}</p>` : ''}
      </div>` : ''}

      ${this.ociSplitPanel(t, r, who, dirWords)}

      ${ageLine}

      <div class="panel">
        <div class="panel-head"><h3>Symptom dimensions</h3><span class="card-tag tag-ocd">${Object.keys(t.subscales || {}).length} subscales</span></div>
        <p class="panel-sub">Each row is the panel above in miniature. Every capsule is one published sample, spanning its <b>mean ±1 SD</b>, with a dot at the mean and a notch at the median; the upright line is this ${this.esc(who)}. Each row is drawn on its own range (shown at its right edge), because ${equalLen
          ? `although every subscale here is ${subLens[0]} items, 0–${subLens[0] * sc.itemMax}, the samples sit differently on each one`
          : `the subscales are <b>different lengths</b> (${subLens.join(', ')} items), so their sums are <b>not</b> comparable with one another`}. Sums, not means.</p>
        <p class="panel-sub"><b>Reading the effect size.</b> How far apart two capsules sit, <i>relative to how wide they are</i>, is what Cohen's <i>d</i> measures: <i>d</i> ≈ 0.6 means the second sample's mean falls about six tenths of a standard deviation above the first. It describes <b>the subscale</b>, not this ${this.esc(who)}. Where the capsules overlap heavily the score cannot tell those groups apart whatever was scored, which is why a wide overlap is worth seeing rather than being told.</p>
        ${nsLine}
        ${t.subscaleNote ? `<p class="panel-sub">${this.esc(t.subscaleNote)}</p>` : ''}
        ${subLegend}
        <div class="profile-table" style="--cols:minmax(180px,1.3fr) 56px minmax(240px,2.8fr) 196px;margin-top:8px">
          <div class="ph"><span>Dimension</span><span class="r">Score</span><span class="col-opt"></span><span class="c">${D && Object.keys(D).length ? 'separation of the two samples' : ''}</span></div>
          ${subRows}
        </div>
        ${obsPanel}
      </div>
    `;
  },

  /* The DSM-5 rescoring panel (OCI-R only). Returns '' for any form without a
     `dsm5Split`, so the child form and every future OCI variant are unaffected.

     Framing matters more than the numbers here. This is a SECOND LENS on the
     same eighteen items, not a second verdict, so the panel says so, keeps the
     screening total's own pill untouched above it, and reports the positive
     predictive value alongside sensitivity and specificity - because a screen
     with .92/.93 against a supernormal control group is not the same thing as a
     screen that will be right nine times in ten in a clinic. */
  ociSplitPanel(t, r, who, dirWords){
    const sp = t.dsm5Split;
    if(!sp || !Array.isArray(r.split) || !r.split.length) return '';
    const defOf = k => sp.scales.find(s => s.key === k);
    const blocks = r.split.map(s => {
      const def = defOf(s.key) || {};
      const groups = (def.groups || []).map((g, i, arr) => ({
        label:g.label, n:g.n, mean:g.mean, sd:g.sd, median:g.median, iqr:g.iqr, dist:g.dist,
        extra:`n=${g.n}`,
        color: i === arr.length - 1 ? 'var(--rose)' : (i === 0 ? 'var(--green)' : 'var(--ink-faint)'),
        right: g.sd > 0 ? this.pctileCell ? null : null : null
      }));
      const hasDist = groups.length > 0 && groups.every(g => Array.isArray(g.dist) && g.dist.length);
      const pill = s.positive
        ? `<span class="band-pill band-elevated">At or above the cut-off (≥${s.cutoff})</span>`
        : `<span class="band-pill band-typical">Below the cut-off (&lt;${s.cutoff})</span>`;
      const miss = s.answered < s.nItems ? ` <b>${s.nItems - s.answered} of its ${s.nItems} items were left blank</b>, so this sub-total is an underestimate.` : '';
      return `<div class="cs-block">
        <div class="cs-head"><span class="cs-name">${this.esc(def.label || s.name)}</span>
          <span class="cs-score">${s.raw} of ${s.max} · ${s.nItems} items</span>${pill}</div>
        <p class="panel-sub" style="margin:6px 0 0">${this.esc(def.note || '')}${miss} Against ${this.esc(def.target || 'the diagnosis')}, the published cut-off of ${s.cutoff} gave sensitivity ${def.sens}% and specificity ${def.spec}%${def.auc != null ? ` (AUC ${String(def.auc).replace(/^0/, '')})` : ''}${def.ppv != null ? `, with a positive predictive value of ${def.ppv}%` : ''}.</p>
        ${groups.length ? this.groupLanes({ max:s.max, score:s.raw, groups,
            cuts:[{score:s.cutoff, label:String(s.cutoff)}],
            rightHeader:hasDist ? '% at or below' : 'group mean', dir:dirWords }) : ''}
        ${groups.some(g => g.dist) ? '' : `<p class="panel-sub" style="margin-top:8px">Shown as group means with ±1 SD rather than as distributions: the source's ROC table for this scale is internally inconsistent with its own published mean and standard deviation, and its tail is visibly corrupt, so a distribution drawn from it would not be trustworthy.</p>`}
        ${(def.groups || []).filter(g => g.source).map(g => `<p class="src-note"><b>${this.esc(g.label)}:</b> ${this.esc(g.source)}</p>`).join('')}
      </div>`;
    }).join('');
    return `<div class="panel">
      <div class="panel-head"><h3>DSM-5 rescoring</h3><span class="card-tag tag-ocd">second lens</span></div>
      <p class="panel-sub">DSM-5 made hoarding a diagnosis in its own right, so three of these eighteen items now measure something different from the other fifteen. Scored apart, they behave as two separate screens. <b>This does not replace the total above</b>, whose cut-offs are the ones the wider literature rests on; it is a second reading of the same answers, and it is the reason an elevated Hoarding subscale is worth attention even though hoarding does not distinguish OCD from controls. ${this.esc(sp.caveat || '')}</p>
      ${blocks}
      <p class="src-note" style="margin-top:14px">${this.esc(sp.source || '')}</p>
    </div>`;
  },

  /* ═══════════ Y-BOCS RESULTS ═══════════ */
  /* Yale-Brown Obsessive-Compulsive Scale. Total 0–40 (obsessions 0–20 +
     compulsions 0–20) mapped to the conventional severity band, with a
     treatment-seeking OCD reference marker on the total bar. */
  resultsYbocs(t, r){
    const sc = t.scoring, max = sc.totalMax, total = r.total, sev = r.severity;
    const toP20 = v => Math.max(0, Math.min(100, (v/20)*100));
    const fillCls = (sev.cls==='band-high') ? 'fill-high' : (sev.cls==='band-elevated' ? 'fill-elevated' : 'fill-typical');

    // clinical-sample standing (Storch 2015 treatment-seeking OCD reference sample),
    // sex-matched where the client's sex is recorded, else the whole-sample figures
    const cnDef = t.clinicalNorm;
    const cSex = (typeof State!=='undefined' && State.client && (State.client.sex==='male'||State.client.sex==='female')) ? State.client.sex : null;
    const cn = cnDef ? Object.assign({}, cnDef, cnDef[cSex || 'all']) : null;
    const cnGroup = cSex ? (cSex==='male' ? 'men' : 'women') + ' with OCD' : 'adults with OCD';
    let normPct = null;
    if(cn) normPct = this.ordinalPct(Math.round(zToPercentile((total - cn.mean) / cn.sd)));
    const subPct = (raw, key) => (cn && cn[key] && cn[key].sd>0) ? this.pctileCell((raw - cn[key].mean) / cn[key].sd) : '';

    const summary = `Y-BOCS total ${total} of ${max} (obsessions ${r.obs}/20, compulsions ${r.comp}/20), in the <b>${sev.label.toLowerCase()}</b> range. Higher totals mean more severe obsessive-compulsive symptoms.`;

    // severity band reference chips
    const bandChips = sc.severity.map((b,i)=>{
      const on = b===sev;
      return `<span class="sev-chip ${on?'sev-chip-on '+b.cls:''}">${t.bandRanges[i]} · ${b.label}</span>`;
    }).join('');

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill ${sev.cls}">${sev.label}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Severity</h3><span class="card-tag tag-ocd">${sev.label}</span></div>
        <p class="panel-sub">The 0–${max} scale divided into the published severity bands (boundary values in the header row); the marker is this client's total${cn?`, and the short teal line is the treatment-seeking OCD-sample mean (${cn.mean.toFixed(1)})`:''}. The obsession and compulsion subtotals (0–20 each) are below.</p>
        ${this.severityTrack({ max, score:total, zones:this.sevZones(sc.severity, max),
          marks: cn ? [{score:cn.mean, title:`OCD-sample mean ${cn.mean.toFixed(1)}`}] : [],
          dir:['less severe','more severe'] })}
        <div class="profile-table" style="--cols:minmax(120px,1fr) 56px minmax(150px,2.6fr) 128px;margin-top:14px">
          <div class="ph"><span>Measure</span><span class="r">Score</span><span class="col-opt">0–20</span><span class="r col-opt">${cn?'%ile · sample':''}</span></div>
          <div class="sdq-u-row">
            <span class="sdq-name">Obsessions (1–5)</span>
            <span class="sdq-score">${r.obs}<span class="sdq-max">/20</span></span>
            <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${fillCls}" style="width:${toP20(r.obs)}%"></span></div></div>
            <span class="sdq-pct">${subPct(r.obs,'obs')}</span>
          </div>
          <div class="sdq-u-row">
            <span class="sdq-name">Compulsions (6–10)</span>
            <span class="sdq-score">${r.comp}<span class="sdq-max">/20</span></span>
            <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${fillCls}" style="width:${toP20(r.comp)}%"></span></div></div>
            <span class="sdq-pct">${subPct(r.comp,'comp')}</span>
          </div>
        </div>
        <div class="sev-chips">${bandChips}</div>
        ${t.bandsSource ? `<p class="src-note" style="margin-top:10px">${this.esc(t.bandsSource)}</p>` : ''}
        ${cn ? `<p class="panel-sub" style="margin:10px 0 0;font-size:12px">Compared with ${cnGroup} in a ${cn.label} (Storch et al. 2015, N=${cn.n}; mean ${cn.mean.toFixed(1)}, SD ${cn.sd.toFixed(1)}, marked on the bar), this total is around the <b>${normPct} percentile</b> of that clinical sample${(cn.lo!=null && total<cn.lo)?`, extrapolated below that sample's lowest observed total of ${cn.lo}`:''}. Everyone in that sample already had OCD, so a middling percentile means average <i>for someone in treatment</i>, not average in general. Weight the severity band and clinical picture above any single percentile.${cn.caveat?` ${this.esc(cn.caveat)}`:''}</p>` : ''}
      </div>
    `;
  },

  /* ═══════════ SYMPTOM-CHECKLIST INVENTORY RESULTS ═══════════ */
  /* Y-BOCS Symptom Checklist. Deliberately NO severity band, NO total-out-of bar
     and no colour: this counts which symptoms are present so they can be named
     as targets, and a longer list is not a worse result. */
  resultsChecklist(t, r){
    const pc = n => r.nItems ? Math.max(0, Math.min(100, (n / r.nItems) * 100)) : 0;
    const dom = (key, label, range) => {
      const d = r.domains[key] || {current:0, ever:0, n:0};
      const w = d.n ? (d.current / d.n) * 100 : 0;
      return `<div class="sdq-u-row">
        <span class="sdq-name">${label}<span class="sdq-note">items ${range}</span></span>
        <span class="sdq-score">${d.current}<span class="sdq-max">/${d.n}</span></span>
        <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-typical" style="width:${w}%"></span></div></div>
        <span class="sdq-pct">${d.ever} ever</span>
      </div>`;
    };
    const order = Object.keys(r.cats);
    const catRow = key => {
      const c = r.cats[key];
      if(!c || !c.n) return '';
      const on = c.current > 0;
      return `<div class="sdq-u-row${on?'':' sdq-u-sub'}">
        <span class="sdq-name">${this.esc(c.name)}</span>
        <span class="sdq-score">${c.current}<span class="sdq-max">/${c.n}</span></span>
        <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${on?'fill-elevated':'fill-typical'}" style="width:${c.n?(c.current/c.n)*100:0}%"></span></div></div>
        <span class="sdq-pct">${c.ever} ever</span>
      </div>`;
    };
    const named = r.currentItems.length
      ? r.currentItems.map(n => { const it = t.items.find(i=>i.n===n); return it ? `<li>${this.esc(it.text)}</li>` : ''; }).join('')
      : '';

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2>${r.current} current</h2>
        <p>${r.current} of ${r.nItems} listed symptoms endorsed as happening now (${r.ever} now or in the past), across ${r.domains.obsessions.current} obsessions and ${r.domains.compulsions.current} compulsions. This is an inventory of which symptoms are present, not a measure of how severe they are.</p>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Obsessions and compulsions</h3><span class="card-tag tag-ocd">${r.answered}/${r.nItems} answered</span></div>
        <p class="panel-sub">Counts of symptoms endorsed as current, with the number endorsed at any point (now or in the past) on the right. There is no total score and no severity band, because the checklist has neither. Rate severity with the Y-BOCS itself.</p>
        <div class="profile-table" style="--cols:minmax(160px,1.6fr) 64px minmax(120px,2.2fr) 76px">
          <div class="ph"><span>Domain</span><span class="r">Now</span><span class="col-opt">Proportion endorsed</span><span class="r col-opt">Ever</span></div>
          ${dom('obsessions','Obsessions','1–37')}
          ${dom('compulsions','Compulsions','38–58')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>By symptom category</h3></div>
        <div class="profile-table" style="--cols:minmax(160px,1.6fr) 64px minmax(120px,2.2fr) 76px">
          <div class="ph"><span>Category</span><span class="r">Now</span><span class="col-opt">Proportion endorsed</span><span class="r col-opt">Ever</span></div>
          ${order.map(catRow).join('')}
        </div>
      </div>

      ${named ? `<div class="panel">
        <div class="panel-head"><h3>Current symptoms, for the target list</h3><span class="card-tag tag-ocd">${r.currentItems.length}</span></div>
        <p class="panel-sub">The form asks the person to circle the most upsetting of these. Carry the principal ones onto the target symptom list, then rate their severity.</p>
        <ul class="interp-list">${named}</ul>
      </div>` : ''}
    `;
  },

  resultsScreener(t, r){
    const sc = t.scoring, max = sc.totalMax, total = r.total, sev = r.severity;
    const np = this.screenerPercentile(t, total);
    const domainWord = t.id==='phq9' ? 'depressive' : 'anxiety';

    const atCut = total >= sc.cutoff;
    // PHQ-9 closing difficulty question: unscored, reported as given (PHQ manual p.2)
    const diffItem = (t.items||[]).find(i => i.unscored && i.optionSet==='difficulty');
    const diffV = diffItem && r.answers ? r.answers[diffItem.n] : null;
    const diffOpt = (diffV!=null && sc.optionSets) ? (sc.optionSets.difficulty||[]).find(o => o.v===diffV) : null;
    const diffLine = diffOpt ? `<p class="panel-sub" style="margin-top:6px"><b>Functional difficulty (unscored):</b> “${this.esc(diffOpt.label)}”, in answer to how difficult these problems have made work, home life or getting along with others.</p>` : '';
    const summary = `Total ${total} of ${max}, ${sev.label.toLowerCase()} ${domainWord} symptoms${atCut ? `, at or above the conventional ≥${sc.cutoff} cut-off that warrants clinical follow-up` : `; below the conventional ≥${sc.cutoff} cut-off`}.${np ? ` This places the client around the ${Math.round(np.pct)}th percentile of ${np.ref} (i.e. higher than about ${Math.round(np.pct)}% of them).` : ''}`;

    // PHQ-9 item 9 self-harm safety surface
    let safety = '';
    if(r.flag && r.flag.positive){
      safety = `<div class="caveat" style="background:var(--rose-wash);border-color:var(--c-eccdd0)">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="cv-body"><b style="color:var(--rose)">Item 9 endorsed. Review for safety.</b> The client answered “${r.flag.label}” to thoughts of being better off dead or of self-harm. This should be followed up directly and a suicide-risk assessment considered, regardless of the total score.</div></div>`;
    }

    // severity band reference chips
    const bandChips = sc.severity.map((b,i)=>{
      const on = b===sev;
      return `<span class="sev-chip ${on?'sev-chip-on '+b.cls:''}">${t.bandRanges[i]} · ${b.label}</span>`;
    }).join('');

    return `
      ${safety}

      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill ${sev.cls}">${sev.label}</span>
          ${diffLine}
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Severity &amp; community standing</h3><span class="card-tag tag-mood">${atCut?'≥ cut-off':'below cut-off'}</span></div>
        <p class="panel-sub">The 0–${max} scale divided into the conventional severity bands (boundary values in the header row); the marker is this client's total.${np?` The client is around the ${Math.round(np.pct)}th percentile of German general-population norms${np.demo?` for ${np.ref}`:''} (the % of the community scoring at or below this total).`:''}</p>
        ${this.severityTrack({ max, score:total, zones:this.sevZones(sc.severity, max),
          dir:[`fewer ${domainWord} symptoms`,`more ${domainWord} symptoms`] })}
        <div class="sev-chips">${bandChips}</div>
        <p class="panel-sub" style="margin:10px 0 0;font-size:12px">German community norms are a close reference for English-language administration; weight the conventional severity band and the clinical picture above any single percentile.</p>
      </div>
    `;
  },

  /* ═══════════ SCI-08 RESULTS ═══════════ */
  /* Sleep Condition Indicator. REVERSE-directioned: a total of 16 or below
     screens positive for probable insomnia (higher = better sleep). Mirrors the
     screener visual style (score-hero + cut-off gauge) but computes the verdict
     from total <= cutoff. */
  resultsSCI(t, r){
    const sc = t.scoring, max = sc.totalMax, total = r.total, cut = sc.cutoff;
    const insomnia = total <= cut;
    const bandCls = insomnia ? 'band-high' : 'band-typical';
    const status = insomnia ? 'Probable insomnia disorder' : 'No insomnia indicated';
    const shortMax = sc.shortMax, short = r.short;   // SCI-02 has no published cut-off, so its bar is neutral
    const summary = `SCI-08 total ${total} of ${max}. ${insomnia
      ? `This is at or below the cut-off of ${cut}, screening <b>positive</b> for probable insomnia disorder`
      : `This is above the cut-off of ${cut}; insomnia disorder is <b>not</b> indicated`}. Higher scores mean better sleep.`;
    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill ${bandCls}">${status}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Score &amp; cut-off</h3><span class="card-tag tag-sleep">${insomnia?'screen positive':'screen negative'}</span></div>
        <p class="panel-sub">The SCI-08 runs 0 (worst sleep) to ${max} (best); a total of ${cut} or below screens positive for probable insomnia disorder, so the clinical zone sits on the LEFT of this reversed scale. The marker is this client's total. The two-item SCI-02 short form (items 3 + 7) is shown for reference.</p>
        ${this.severityTrack({ max, score:total,
          zones:[
            {from:0, to:cut+1, label:'probable insomnia', tone:3},
            {from:cut+1, to:max, blabel:'≤'+cut, label:'no insomnia indicated', tone:0}
          ],
          dir:['worst sleep','best sleep'] })}
        <div class="profile-table" style="--cols:minmax(130px,1fr) 62px minmax(150px,2.6fr) 132px;margin-top:14px">
          <div class="ph"><span>Measure</span><span class="r">Score</span><span class="col-opt">0–${shortMax}</span><span class="c"></span></div>
          <div class="sdq-u-row">
            <span class="sdq-name">SCI-02 short form</span>
            <span class="sdq-score">${r.hasShort?short:'—'}<span class="sdq-max">/${shortMax}</span></span>
            <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-accent" style="width:${Math.max(0,Math.min(100,(short/shortMax)*100))}%"></span></div></div>
            <span class="sdq-pct"></span>
          </div>
        </div>
      </div>
    `;
  },

  /* ═══════════ IES-R RESULTS ═══════════ */
  /* Impact of Event Scale – Revised. Summed 0–88 total (higher = more distress)
     with PTSD bands (≥25 concern, Asukai 2002; ≥33 probable PTSD, Creamer 2003), plus the three
     subscale sums. Scored by the generic `likert` method (total + subscales). */
  resultsIESR(t, r){
    const total = r.total, max = t.scoring.totalMax, S = r.subscales || {};
    const toP = (v,m) => Math.max(0, Math.min(100, (v/m)*100));
    let band, bandLabel, tagWord;
    if(total>=33){ band='band-high'; bandLabel='Probable PTSD (≥33)'; tagWord='probable PTSD'; }
    else if(total>=25){ band='band-elevated'; bandLabel='Clinical concern (≥25)'; tagWord='clinical concern'; }
    else { band='band-typical'; bandLabel='Below clinical concern (<25)'; tagWord='below concern'; }
    const ev = (r.answers && r.answers._event) ? String(r.answers._event) : '';
    const summary = `${ev ? `Index event: “${this.esc(ev)}”. ` : 'No index event was named. '}IES-R total ${total} of ${max}. ${
      total>=33 ? 'This meets the recommended ≥33 cut-off for a probable PTSD diagnosis.' :
      total>=25 ? 'This is at or above 25, where post-traumatic stress is a clinical concern (partial PTSD or some symptoms likely).' :
      'This is below 25, the level at which post-traumatic stress becomes a clinical concern.'} Higher scores mean greater distress; confirm against DSM-5 criteria.`;
    const subDefs = [['intrusion','Intrusion'],['avoidance','Avoidance'],['hyperarousal','Hyperarousal']];
    const subRows = subDefs.map(([k,label])=>{
      const s = S[k]; if(!s) return '';
      const nItems = s.max/4, mean = nItems ? (s.raw/nItems).toFixed(1) : '—';
      return `<div class="sdq-u-row">
        <span class="sdq-name">${label}</span>
        <span class="sdq-score">${s.raw}<span class="sdq-max">/${s.max}</span></span>
        <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-elevated" style="width:${toP(s.raw,s.max)}%"></span></div></div>
        <span class="sdq-pct">mean ${mean}</span>
      </div>`;
    }).join('');
    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill ${band}">${bandLabel}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Total &amp; subscales</h3><span class="card-tag tag-trauma">${tagWord}</span></div>
        <p class="panel-sub">The IES-R total on its 0–${max} scale, divided at the published thresholds (≥25 clinical concern, ≥33 probable PTSD); the marker is this client's total. The three subscales (Intrusion 0–32, Avoidance 0–32, Hyperarousal 0–24) show where the distress sits; the mean is the average item score (0–4).</p>
        ${this.severityTrack({ max, score:total,
          zones:[
            {from:0,  to:25, label:'below concern', tone:0},
            {from:25, to:33, label:'concern', tone:1},
            {from:33, to:max, label:'probable PTSD', tone:3}
          ],
          dir:['less distress','more distress'] })}
        <div class="profile-table" style="--cols:minmax(130px,1fr) 62px minmax(150px,2.6fr) 120px;margin-top:14px">
          <div class="ph"><span>Measure</span><span class="r">Score</span><span class="col-opt">0 to max (higher = more distress)</span><span class="c">Level</span></div>
          ${subRows}
        </div>
      </div>
    `;
  },

  /* ═══════════ WURS-25 RESULTS ═══════════ */
  /* Wender Utah Rating Scale (25-item). Summed 0–100 (higher = more childhood
     ADHD traits); 30+ is the primary screening cut-off (Gift 2021), 46+ the higher
     threshold that better separates ADHD from depression or anxiety (Ward 1993).
     Scored by the generic `likert` method (total, no subscales). */
  resultsWURS(t, r){
    const total = r.total, max = t.scoring.totalMax, cut = (t.scoring.cutoff!=null?t.scoring.cutoff:46);
    const toP = v => Math.max(0, Math.min(100, (v/max)*100));
    const pos = total >= cut;
    const band = pos ? 'band-high' : 'band-typical';
    const status = pos ? 'Suggestive of childhood ADHD' : 'Below the childhood-ADHD cut-off';
    // Thresholds to display: distinct scores from the cutoffs[] list (sorted). The
    // self and observer forms both carry two (30 primary + 46).
    const cuts = [...new Set((t.cutoffs||[]).map(c=>c.score).filter(v=>typeof v==='number'))].sort((a,b)=>a-b);
    const lo = cuts.length ? cuts[0] : cut, hi = cuts.length ? cuts[cuts.length-1] : cut;
    const twoCut = cuts.length >= 2 && lo !== hi;
    // clinical-group comparison (Gift et al. 2021), sex-matched where known
    let normPanel = '';
    const nm = t.norms;
    if(nm && nm.groups){
      const sex = (State.client && (State.client.sex==='male'||State.client.sex==='female')) ? State.client.sex : null;
      // z-derived percentile, hedged at the tails: the low-scoring groups sit near
      // the floor of the 0-100 scale, so a normal-curve "99th percentile" claim
      // there is the least trustworthy number on the card
      const tailWord = z => {
        if(total === 0) return 'at the scale floor (lowest possible score)';
        const p = zToPercentile(z);
        if(p >= 99) return "markedly above this group's typical range";
        if(p <= 1) return "markedly below this group's typical range";
        const w = this.refPositionWord(p);          // shared reference ladder
        return w==='within reference range' ? `${this.pctileLabel(z)}, within this group's range` : `${w.replace(' reference','')} this group (${this.pctileLabel(z)})`;
      };
      // rows low to high (controls, MDD/GAD, ADHD) so the lanes read upwards
      const laneGroups = [...nm.groups].reverse().map(g => {
        const cell = (sex && g[sex]) ? g[sex] : g.all;
        const z = cell.sd > 0 ? (total - cell.mean) / cell.sd : 0;
        return { label:g.label, color:g.color, mean:cell.mean, sd:cell.sd, extra:tailWord(z) };
      });
      const CUT_SRC = { 30:'Gift 2021', 46:'Ward 1993' };
      const laneCuts = (twoCut ? cuts : [cut]).map(c => ({ score:c, label:`${c}${CUT_SRC[c] ? ' · ' + CUT_SRC[c] : ''}` }));
      normPanel = `
      <div class="panel">
        <div class="panel-head"><h3>Compared with clinical groups</h3><span class="nv" style="font-size:12px;color:var(--ink-faint)">0–${nm.scaleMax} scale</span></div>
        <p class="panel-sub">Each row is one group${sex?` (${sex}s)`:''}: the bar spans ±1 SD around the mean (dot), the vertical line is this client's total, and the dashed ticks mark the cut-off${laneCuts.length>1?'s':''}. Read the whole pattern: the WURS-25 separates ADHD from controls well but overlaps with depression/anxiety (MDD/GAD), so a high score is not specific to ADHD.</p>
        ${this.groupLanes({ max:nm.scaleMax, groups:laneGroups, score:total, cuts:laneCuts, dir:['fewer childhood ADHD traits','more childhood ADHD traits'] })}
        <p class="src-note">Percentile estimates assume each group is approximately normal; they are least reliable for the lower-scoring groups, whose distributions are squeezed against the floor of the scale. ${this.esc(nm.source)}${t.id==='wurs_observer'?' Applied to the observer report as an approximation; these are self-report norms.':''}</p>
      </div>`;
    }
    let interp;
    if(twoCut){
      if(total >= hi) interp = `This is at or above both the ${lo} screening cut-off and the higher ${hi} cut-off (which further separates ADHD from depression/anxiety), so a retrospective childhood-ADHD picture is likely`;
      else if(total >= lo) interp = `This is at or above the ${lo} screening cut-off (Gift et al. 2021: best separates non-clinical controls from ADHD, sensitivity 91%, specificity 92%), suggesting probable childhood ADHD, but below ${hi}, the higher threshold that further separates ADHD from depression/anxiety`;
      else interp = `This is below the ${lo} screening cut-off; a retrospective childhood-ADHD picture is less likely`;
    } else {
      interp = pos ? `This is at or above the cut-off of ${cut}, suggesting probable childhood ADHD`
                   : `This is below the cut-off of ${cut}; a retrospective childhood-ADHD picture is less likely`;
    }
    const summary = `WURS-25 total ${total} of ${max}. ${interp}. Higher scores mean more childhood ADHD traits; mood can inflate the total, so read it alongside the wider assessment.`;
    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill ${band}">${status}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Score &amp; cut-off</h3><span class="card-tag tag-adhd">${pos?'at/above cut-off':'below cut-off'}</span></div>
        <p class="panel-sub">${twoCut
          ? `The WURS-25 runs 0–${max}; two thresholds are marked. ${lo} (Gift et al. 2021) is the primary screening cut-off separating non-clinical controls from ADHD (sensitivity 91%, specificity 92%). ${hi} is Ward et al.'s (1993) original cut-off, which better separates ADHD from depression/anxiety; Ward reported ${hi}+ correctly classified 86% of adults with ADHD, 99% of controls and 81% of adults with depression. Mood can inflate the score.`
          : `The WURS-25 runs 0–${max} (the tick marks the ${cut} cut-off). A total of ${cut} or above suggests probable childhood ADHD; Ward et al. (1993) report this correctly classified 86% of adults with ADHD and 99% of controls (and 81% of depressed subjects; mood can inflate the score).`}</p>
        <div class="profile-table" style="--cols:minmax(130px,1fr) 62px minmax(150px,2.6fr) 132px">
          <div class="ph"><span>Measure</span><span class="r">Score</span><span class="col-opt">0 to ${max} (higher = more childhood ADHD traits)</span><span class="c">Outcome</span></div>
          <div class="sdq-u-row sdq-u-lead">
            <span class="sdq-name">WURS-25 total</span>
            <span class="sdq-score">${total}<span class="sdq-max">/${max}</span></span>
            <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${pos?'fill-high':'fill-typical'}" style="width:${toP(total)}%"></span></div>${(twoCut?cuts:[cut]).map(c=>`<div class="hsc-cut" style="left:${toP(c)}%" title="cut-off ${c}"></div>`).join('')}</div>
            <span class="band-pill ${band}">${pos?'Screen positive':'Screen negative'}</span>
          </div>
        </div>
      </div>
      ${normPanel}
    `;
  },

  /* ═══════════ RBQ-3 RESULTS ═══════════ */
  /* Repetitive Behaviours Questionnaire-3. MEAN-scored (1.00–4.00) with NO
     cut-off — the authors are explicit it is a quantitative measure, not a
     screen — so this panel reports the pattern (mean total over 20 and over
     Q1–19, the two published factor means, and the Q20 activity choice)
     without a positive/negative verdict. Bars run from 1 (scale floor), not
     0, so a client answering "never or rarely" throughout shows an empty bar. */
  resultsRBQ3(t, r){
    const sc = t.scoring, max = sc.scaleMax;
    const fmt = v => v==null ? '—' : (Number.isInteger(v) ? v+'.00' : String(v.toFixed ? v.toFixed(2) : v));
    const toP = v => v==null ? 0 : Math.max(0, Math.min(100, ((v-1)/(max-1))*100));
    // soft dimensional descriptor from the item-mean (no validated bands — wording stays neutral)
    const m = r.mean20;
    const level = m==null ? '' :
      m < 1.5 ? 'Most items were rated “never or rarely”.' :
      m < 2.5 ? 'On average, behaviours were rated in the mild / occasional range.' :
      m < 3.5 ? 'On average, behaviours were rated in the marked / notable range.' :
                'On average, behaviours were rated at the serious / severe end of the scale.';
    const summary = `RBQ-3 mean total ${fmt(r.mean20)} on the 1–4 scale (Q1–19 mean ${fmt(r.mean19)}). ${level} Higher means reflect more frequent or intense restricted and repetitive behaviours over the last two weeks. The RBQ-3 has no cut-off, so read the pattern dimensionally.`;
    // factor rows (published two-factor solution appropriate to this version)
    const S = r.subscales || {};
    const factorRows = Object.keys(S).map(k => {
      const s = S[k]; if(!s) return '';
      return `<div class="sdq-u-row">
        <span class="sdq-name">${s.name}</span>
        <span class="sdq-score">${fmt(s.raw)}<span class="sdq-max">/${max}</span></span>
        <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-elevated" style="width:${toP(s.raw)}%"></span></div></div>
        <span class="sdq-pct">${s.nItems} items</span>
      </div>`;
    }).join('');
    // Q20 (activity choice) — its own 3-option scale, reported separately per the manual
    const actOpts = (sc.optionSets && sc.optionSets.activity) || [];
    const actOpt = actOpts.find(o => o.v === r.activity);
    const excluded = (sc.factorExcluded && sc.factorExcluded.length)
      ? ` Items ${sc.factorExcluded.join(' and ')} are not assigned to either factor in this solution.` : '';
    // adult reference values (Jones et al. 2024): one 1–4 axis per measure with
    // group bands (±1 SD, median notch where published) and the client's marker.
    // Self-report compares only against the study 2 diagnostic-contrast pair
    // (non-autistic, autistic), which carries the validated separation; the
    // study 1 referred sample was dropped from self-report (autism-enriched,
    // referral/state-inflated, no distinct clinical question) and survives only
    // as the sole informant reference. groupLanes still supports section
    // captions for callers that need them; RBQ self no longer sets any.
    // NO normal-approximation percentile: the RBQ-3 distributions failed
    // Shapiro-Wilk normality in BOTH source studies (skew + floor/ceiling), and
    // an elevated client against the non-autistic group's tiny SD (0.25, mean
    // only 1.4 SD above the scale floor) would z out at 4+, i.e. fake tail
    // precision from n=151. Positions are words (z counts SDs only); the robust
    // rank statement is the published group separation (d and its
    // common-language effect size), which lives in the body of the distribution
    // where non-normality barely moves it.
    let normPanel = '';
    const nm = t.norms;
    if(nm && nm.groups && nm.groups.length){
      const ordered = nm.groups;
      const isInf = t.id === 'rbq3_other';
      const who = isInf ? 'informant report' : 'client';
      const measures = [
        ['total', 'Mean total (20 items)', r.mean20],
        ['rsm',   (S.rsm && S.rsm.name) || 'Repetitive sensory–motor', S.rsm ? S.rsm.raw : null],
        ['is',    (S.is && S.is.name) || 'Insistence on sameness',     S.is ? S.is.raw : null]
      ];
      // one lanes chart per measure: a row per reference group (bar = ±1 SD,
      // dot = mean, notch = published median), one score line; direction labels
      // on the first chart only. Lanes use each group's short label; the legend
      // below carries the full one.
      const axes = measures.map(([mk, label, val], mi) => {
        if(val == null) return '';
        const laneGroups = ordered.map(g => {
          const cell = g.measures && g.measures[mk]; if(!cell) return null;
          return { label:g.short || g.label, color:g.color, mean:cell.mean, sd:cell.sd,
                   median:cell.median, section:g.section };
        }).filter(Boolean);
        if(!laneGroups.length) return '';
        return `<div class="norm-item">
          <div class="norm-item-head"><span class="nm">${this.esc(label)}</span><span class="nv">${nm.scaleMin}–${nm.scaleMax} scale</span></div>
          ${this.groupLanes({ min:nm.scaleMin, max:nm.scaleMax, groups:laneGroups, score:val, scoreLabel:fmt(val), legend:false,
            dir: mi===0 ? ['less frequent or intense','more frequent or intense'] : null })}
        </div>`;
      }).join('');
      // Legend: full group label, descriptives (median/IQR where published) and a
      // position word for the MEAN TOTAL. z is used only to count SDs and pick
      // the word; it is never converted to a percentile (see block comment).
      // vocabulary matches the shared reference ladder (refPosition), on its SD
      // equivalents rather than percentiles — the RBQ-3 distributions failed
      // Shapiro-Wilk in both source studies, so no percentile is claimed
      const posWord = z => z >= 2.05 ? 'markedly above' : z >= 1.5 ? 'moderately above'
        : z >= 1 ? 'mildly above' : z > -1 ? 'within' : 'below';
      // the position word is a straight SD count off the group mean (z, not a
      // percentile — no normality assumed); state that count so the word's basis
      // is explicit
      const sdPhrase = z => Math.abs(z) < 0.05 ? 'at the group mean'
        : `${Math.abs(z).toFixed(1)} SD ${z >= 0 ? 'above' : 'below'} the mean`;
      let legend = '';
      for(const g of ordered){
        const cell = g.measures && g.measures.total; if(!cell) continue;
        let tail = '';
        if(r.mean20 != null && cell.sd > 0){
          const z = (r.mean20 - cell.mean) / cell.sd, pos = posWord(z);
          const where = pos === 'within' ? 'within this range' : `${pos} this range`;
          tail = ` · ${who} ${where} (${sdPhrase(z)})`;
        }
        const med = cell.median != null ? `, median ${cell.median.toFixed(2)}${cell.iqr != null ? ` (IQR ${cell.iqr.toFixed(2)})` : ''}` : '';
        legend += `<div class="norm-legend-item"><span class="norm-legend-swatch" style="background:${g.color}"></span>${this.esc(g.label)} (n=${g.n}): mean total ${cell.mean} (SD ${cell.sd})${med}${tail}</div>`;
      }
      // group-separation anchor (self-report only): the published Cohen's d with
      // its common-language effect size. A fixed property of the two reference
      // groups; never a per-client figure.
      const sep = nm.separation;
      const sepLine = sep ? `<p class="src-note" style="margin-top:12px">Group separation (published): a typical autistic adult scored higher than about ${sep.total.cles}% of the non-autistic comparison adults on the mean total (Cohen's d ${sep.total.d}), about ${sep.rsm.cles}% on repetitive sensory-motor behaviour (d ${sep.rsm.d}) and about ${sep.is.cles}% on insistence on sameness (d ${sep.is.d}). These figures describe the two reference groups, not this client.</p>` : '';
      const sampleNotes = ordered.map(g => `${g.label}: ${g.note}`).join(' ');
      normPanel = `
      <div class="panel">
        <div class="panel-head"><h3>Compared with adult reference groups</h3></div>
        <p class="panel-sub">Each measure shows one row per reference group (dot = mean, bar = ±1 SD${isInf ? '' : ', notch = published median'}); the vertical line is this ${who}. ${isInf
          ? 'The only published informant reference is informant ratings of adults referred to an NHS adult autism diagnostic service; no autistic vs non-autistic informant comparison exists for this version. Informants rate systematically lower than self-report (referred mean total 2.32 vs 2.48), so a modestly lower informant score than the client’s own report is usual rather than a discrepancy.'
          : 'The two rows are the validated autistic vs non-autistic contrast. Their ±1 SD bars do not meet, but the groups still overlap (see the group separation figure below). Where a median notch sits off its mean dot the distribution is skewed, which is why positions are given in words rather than percentiles.'} These are reference samples, not population norms, and all are adults. The RBQ-3 has no cut-off: a high score is not a diagnosis${isInf ? '' : ' (autism also requires social-communication features the RBQ-3 does not measure)'}, and a low score does not rule autism out.</p>
        ${axes}
        <div class="norm-legend">
          <div class="norm-legend-item"><span class="spql-sw spql-sw-you"></span>This ${who} (${fmt(r.mean20)})</div>${legend}
        </div>
        ${sepLine}
        <p class="src-note">Reference samples. ${this.esc(sampleNotes)} ${this.esc(nm.source)}</p>
      </div>`;
    }
    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${fmt(r.mean20)} out of ${max}</h2>
          <p>${summary}</p>
          <span class="band-pill band-neutral">Quantitative measure · no cut-off</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Mean scores</h3><span class="card-tag tag-autism">dimensional</span></div>
        <p class="panel-sub">Each item scores 1 (never or rarely) to 4; means run 1.00–4.00. The manual reports the mean total both over all 20 items and over Q1–19 (the subscales use Q1–19 only). Two-factor subscales follow ${this.esc(sc.factorSource||'the published two-factor solution')}.${excluded}</p>
        <div class="profile-table" style="--cols:minmax(150px,1.3fr) 74px minmax(150px,2.4fr) 84px">
          <div class="ph"><span>Measure</span><span class="r">Mean</span><span class="col-opt">1 · never/rarely to serious/severe · ${max}</span><span class="r col-opt">Items</span></div>
          <div class="sdq-u-row sdq-u-lead">
            <span class="sdq-name">Mean total (20 items)</span>
            <span class="sdq-score">${fmt(r.mean20)}<span class="sdq-max">/${max}</span></span>
            <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-elevated" style="width:${toP(r.mean20)}%"></span></div></div>
            <span class="sdq-pct">20</span>
          </div>
          <div class="sdq-u-row">
            <span class="sdq-name">Mean total (Q1–19)</span>
            <span class="sdq-score">${fmt(r.mean19)}<span class="sdq-max">/${max}</span></span>
            <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-elevated" style="width:${toP(r.mean19)}%"></span></div></div>
            <span class="sdq-pct">19</span>
          </div>
          ${factorRows}
        </div>
        ${actOpt ? `<p class="src-note">Q20 (self-occupied activity, rated separately): “${this.esc(actOpt.label)}” (${r.activity} of 3).</p>` : ''}
      </div>
      ${normPanel}
    `;
  },

  /* ═══════════ GSQ RESULTS ═══════════ */
  resultsGsq(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const max = t.scoring.totalMax, total = r.total;

    if(!t.norm){
      // no published comparison values at all (rGSQ-P): totals + profile only,
      // no band pill — nothing to band against.
      const summary = `Total ${total} of ${max} (hyper-sensitivity ${r.hyper}, hypo-sensitivity ${r.hypo}). Higher totals reflect more frequent atypical sensory responses, both over- and under-responsivity. No group means have been published for this short form, so the result is read from the profile below rather than against a comparison sample.`;
      return `
        <div class="score-hero"><div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
        </div></div>
        ${this.caveatLine(t)}
        ${this.gsqProfilePanels(t, r)}`;
    }

    const nm = t.norm || {mean:0, sd:1};   // norm is always defined for GSQ; guard only
    const z = nm.sd>0 ? (total-nm.mean)/nm.sd : 0;

    if(nm.nonNormal){
      // Descriptive comparison only — the reference sample is small (GSQ-P:
      // n=37) and non-normally distributed, so no percentile is computed AND
      // NO BAND PILL IS SHOWN. A coloured band is a stronger claim than the
      // percentile the nonNormal flag exists to suppress; the position is
      // stated in words instead, which is all this evidence carries.
      const refName = nm.group || 'the comparison sample';
      // terse lane labels (groupLanes reserves a fixed label gutter; long ones clip)
      const groups = (t.compareGroups||[{label:refName, mean:nm.mean, sd:nm.sd, n:nm.n}]).map((g,i)=>({
        label:(g.laneLabel||g.label).replace(/ children/i,''), color: i===0 ? 'var(--green)' : 'var(--rose)',
        mean:g.mean, sd:g.sd, extra:(g.n?`n=${g.n}`:null),
        right:this.sdCell(g.sd>0 ? (total-g.mean)/g.sd : NaN)
      }));
      const summary = `Total ${total} of ${max}, ${this.sdPhrase(z, refName)} (${nm.mean}, SD ${nm.sd}). Higher totals reflect more frequent atypical sensory responses, both over- and under-responsivity.${t.compareGroups&&t.compareGroups[1]?` Autistic children in the same study averaged ${t.compareGroups[1].mean} (SD ${t.compareGroups[1].sd}).`:''} Distance is given in standard deviations, not percentiles, because these comparison samples are small and not normally distributed. Descriptive anchors only, not norms.`;
      return `
        <div class="score-hero"><div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${total} out of ${max}</h2>
          <p>${summary}</p>
        </div></div>

        ${this.caveatLine(t)}

        <div class="panel">
          <div class="panel-head"><h3>Total vs comparison groups</h3><span class="card-tag tag-sensory">descriptive</span></div>
          <p class="panel-sub">Each bar spans a comparison group's mean ±1 SD (dot = mean); the vertical line is this child's total, and the right-hand column gives its distance from each group's mean in standard deviations. These comparison samples are small and not normally distributed, so no percentile is computed; read the position dimensionally. There is no validated clinical cut-off.</p>
          ${this.groupLanes({ max:max, score:total, groups, rightHeader:'vs group mean',
            dir:['fewer atypical sensory responses','more atypical sensory responses'] })}
          ${this.gsqSourceNotes(t, nm)}
        </div>

        ${this.gsqProfilePanels(t, r)}`;
    }

    const sdCell = this.sdCell, sdPhrase = this.sdPhrase;
    const refName = nm.label || 'reference sample';
    // Each lane shows where the client falls WITHIN that sample, so the effect of
    // the reference choice is visible rather than hidden behind one number.
    const cg = t.compareGroups && t.compareGroups.length ? t.compareGroups : [{label:refName, mean:nm.mean, sd:nm.sd, n:nm.n}];
    // primary lane chromatic, secondary deliberately neutral/recessive (context,
    // not the scoring reference). Pair checked for colour-vision separation;
    // every lane also carries a text label, SD figure and legend line, so
    // identity is never colour-alone.
    // a lane with its own published frequency distribution gets an EMPIRICAL
    // percentile (right column); lanes without one show SD distance. The primary
    // lane's hist lives on nm; per-lane hists (if any) ride on the compareGroup.
    const histFor = (g,i) => g.hist || (i===0 ? nm.hist : null);
    const groups = cg.map((g,i)=>{
      const gz = g.sd>0 ? (total-g.mean)/g.sd : 0;
      const b = this.gsqEmpBand(total, histFor(g,i));
      // show both the empirical percentile band and the SD distance when we have
      // a distribution; SD only otherwise
      const right = b ? `${this.fmtBand(b, false)} · ${sdCell(gz)}` : sdCell(gz);
      return { label:g.label, color: i===0 ? 'var(--green)' : 'var(--ink-faint)',
               mean:g.mean, sd:g.sd, extra:(g.n?`n=${g.n}`:null), right };
    });
    const primaryHist = histFor(cg[0], 0);
    const empBand = primaryHist ? this.gsqEmpBand(total, primaryHist) : null;
    // Position band (shared reference ladder — the GSQ has NO validated clinical
    // cut-off, so standing within the comparison group is the only claim there
    // is). Keyed off the empirical band's LOW end: gsqEmpBand returns the range
    // the score's own 10-point bin permits, and taking the bottom of it means a
    // rung is only claimed once the WHOLE bin has cleared that centile. The
    // label therefore understates rather than overstates at every boundary,
    // which is the right direction for a cut-off-free measure. No normal
    // approximation anywhere in this chain.
    const posBand = empBand ? this.refPosition(empBand.lo, {}) : null;
    const multi = cg.length > 1;
    const secondaryLine = '';
    // headline: guaranteed empirical percentile BAND when we have the
    // distribution (no interpolation), else SD distance
    const headline = empBand
      ? `in the band spanning the ${this.fmtBand(empBand, true)} percentile of ${refName} (${sdPhrase(z)}; mean ${nm.mean}, SD ${nm.sd})`
      : `${sdPhrase(z, refName)} (${nm.mean}, SD ${nm.sd})`;
    const pctExplain = empBand
      ? ' The percentile is a guaranteed band read directly from this group’s published score distribution (N=' + (primaryHist? primaryHist.counts.reduce((a,b)=>a+b,0):nm.n) + '): the score’s 10-point bin fixes these bounds exactly, with no interpolation and no assumption about distribution shape. The SD figure is shown alongside.'
      : ' Distance is given in standard deviations rather than a percentile, because the shape of the comparison distribution isn’t known.';
    const posExplain = posBand
      ? ` The position band above reads off that same distribution (mildly above from the 84th centile, moderately from the 93rd, markedly from the 98th), taken at the lower bound so it never overstates. It describes standing in this comparison group, not severity: the GSQ has no validated clinical cut-off.`
      : '';
    const summary = `Total ${total} of ${max}, ${headline}. Higher totals reflect more frequent atypical sensory responses, both over- and under-responsivity, which correlate strongly with autistic traits.${pctExplain}${posExplain}`;

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2>${total} out of ${max}</h2>
        <p>${summary}</p>
        ${this.refPill(empBand ? empBand.lo : null, { group:refName })}
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        ${primaryHist && !multi ? `
        <div class="panel-head"><h3>Where this client falls in the ${this.esc(refName)} distribution</h3><span class="card-tag tag-sensory">${empBand?this.fmtBand(empBand,false)+' %ile · '+sdCell(z):sdCell(z)}</span></div>
        <p class="panel-sub">Each bar is the number of ${this.esc(refName)} (n=${primaryHist.counts.reduce((a,b)=>a+b,0)}) scoring in that 10-point range; the dark line is this client (${total}). <b style="color:var(--accent)">Green</b> is the ${this.fmtBand(empBand,false).split('–')[0]}% who scored lower, the <b>hatched</b> bar is the client's own range (which straddles the boundary, hence the ${this.fmtBand(empBand,true)} <i>band</i> rather than a single point), and grey scored higher. The ruler beneath gives the same position in SD units. The distribution is right-skewed, so its shape is shown directly rather than assumed. This is a convenience sample rather than a representative population norm, and there is no validated clinical cut-off, so read it dimensionally.</p>
        ${this.gsqDistChart(total, primaryHist, nm.mean, nm.sd)}
        ` : `
        <div class="panel-head"><h3>Total vs ${multi?'comparison groups':this.esc(refName)}</h3><span class="card-tag tag-sensory">${empBand?this.fmtBand(empBand,false)+' pct · '+sdCell(z):sdCell(z)}</span></div>
        <p class="panel-sub">The bar spans the comparison group's mean ±1 SD (dot = mean); the vertical line is this client's total.${multi?` Scoring uses the first lane (${this.esc(refName)}).${secondaryLine}`:''} The right-hand column gives ${empBand?`both a guaranteed empirical percentile band and the distance from the group's mean in SD units`:`distance from the group's mean in SD units`}. ${multi?'These are':'This is a'} convenience sample${multi?'s':''} rather than ${multi?'representative population norms':'a representative population norm'}, and there is no validated clinical cut-off, so read it dimensionally.</p>
        ${this.groupLanes({ max:max, score:total, groups, rightHeader:(empBand&&!multi)?'percentile · SD':'vs group',
          dir:['fewer atypical sensory responses','more atypical sensory responses'] })}
        `}
        ${this.gsqSourceNotes(t, nm)}
      </div>

      ${this.gsqProfilePanels(t, r)}`;
  },

  /* Empirical-distribution chart for a lane with a published histogram (GSQ adult).
     Shows the real distribution shape (honest about the right skew — no symmetric
     ±SD band), with the client marked, the percentile split shaded (green = below
     the client's bin, hatched = the client's own bin / the band's uncertainty,
     grey = above), and an SD ruler beneath for readers who think in SD units.
     900-unit viewBox so text matches the suite's other charts. */
  gsqDistChart(total, hist, mean, sd){
    const c = hist.counts, x0 = hist.x0||0, w = hist.binWidth||10;
    const W = 900, L = 60, R = W - 20, top = 30, base = 196, H = 250;
    const xmax = 168;   // GSQ total range 0–168 (data reaches ~140; headroom shown)
    const sx = s => L + (Math.max(0,Math.min(xmax,s))/xmax) * (R - L);
    const mxc = Math.max.apply(null, c) || 1;
    const sy = n => (base - top) * (n / mxc);
    let cbin = Math.floor((total - x0) / w);
    if(cbin < 0) cbin = 0; else if(cbin >= c.length) cbin = c.length - 1;
    let b = `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img">`;
    b += `<defs><pattern id="gsqhatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="var(--accent-wash)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--accent)" stroke-width="2" opacity="0.55"/></pattern></defs>`;
    // faint SD gridlines
    [-1,1,2].forEach(k=>{ const v = mean + k*sd; if(v>=x0 && v<=xmax) b += `<line x1="${sx(v).toFixed(1)}" y1="${top}" x2="${sx(v).toFixed(1)}" y2="${base}" stroke="var(--line)" stroke-width="1"/>`; });
    // bars
    c.forEach((n,i)=>{
      const xa = sx(i*w+x0), xb = sx(i*w+x0+w), h = sy(n);
      const fill = i<cbin ? 'var(--accent)' : (i===cbin ? 'url(#gsqhatch)' : 'var(--line)');
      const op = i<cbin ? ' opacity="0.62"' : '';
      if(h>0) b += `<rect x="${xa.toFixed(1)}" y="${(base-h).toFixed(1)}" width="${(xb-xa-1).toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"${op} stroke="var(--paper-raised)" stroke-width="0.5"/>`;
    });
    // main score axis
    b += `<line x1="${L}" y1="${base}" x2="${sx(xmax).toFixed(1)}" y2="${base}" class="spqsvg-axis"/>`;
    [0,42,84,126,168].filter(t=>t<=xmax).forEach(t=>{ const x=sx(t).toFixed(1);
      b += `<line x1="${x}" y1="${base}" x2="${x}" y2="${base+4}" class="spqsvg-axis"/><text x="${x}" y="${base+17}" text-anchor="middle" class="spqsvg-tk">${t}</text>`; });
    // SD ruler beneath
    const ry = base + 30;
    b += `<text x="${L-6}" y="${ry+4}" text-anchor="end" class="spqsvg-dir">SD</text>`;
    [[-1,'−1'],[0,'mean'],[1,'+1'],[2,'+2']].forEach(([k,lab])=>{ const v = mean + k*sd; if(v>=x0 && v<=xmax){ const x=sx(v).toFixed(1);
      b += `<line x1="${x}" y1="${ry-4}" x2="${x}" y2="${ry+2}" class="spqsvg-axis"/><text x="${x}" y="${ry+15}" text-anchor="middle" class="spqsvg-dir">${lab}</text>`; } });
    // mean dashed guide
    b += `<line x1="${sx(mean).toFixed(1)}" y1="${top-2}" x2="${sx(mean).toFixed(1)}" y2="${base}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3 3"/>`;
    // client line + value
    b += `<line x1="${sx(total).toFixed(1)}" y1="${top-4}" x2="${sx(total).toFixed(1)}" y2="${base}" style="stroke:var(--ink)" stroke-width="2.5"/>`;
    b += `<text x="${sx(total).toFixed(1)}" y="${top-8}" text-anchor="middle" class="spqsvg-score">${total}</text>`;
    b += `<text x="18" y="${((top+base)/2).toFixed(0)}" class="spqsvg-dir" transform="rotate(-90 18 ${((top+base)/2).toFixed(0)})" text-anchor="middle">no. of adults</text>`;
    b += `</svg>`;
    return b;
  },


  /* GSQ profile: diverging ("butterfly") chart — hyper bars extend right, hypo
     bars left of a centre spine — plus the items rated Often/Always grouped by
     sense. Direction encodes the paper's interpretation rule: in children,
     hyper-sensitivities cluster by sense (read the right wing per sense) while
     hypo-sensitivities cluster by behaviour (read the left wing as a general
     seeking/dampening style) — Smees et al. (2022). Hypo is blue, not the
     suite green: rose/green is not colour-vision-safe as a diverging pair. */
  gsqProfilePanels(t, r){
    if(!r.subscales || !Object.keys(r.subscales).length) return '';
    const order = ['vis','aud','tac','gus','olf','ves','pro'].filter(k=>r.subscales[k]);
    const subs = order.map(k=>r.subscales[k]);
    const sideMax = Math.max.apply(null, subs.map(s=>Math.max(s.hyperMax, s.hypoMax)));
    const HYPER='var(--rose)', HYPO='var(--c-2c6bb0)';
    // geometry: 900-unit viewBox (matches groupLanes so type renders at the same
    // table size as the comparison chart above), 152-wide centre gutter, 310u wings
    const W=900, CX=450, GUT=76, PW=310, RH=34, BH=14, top=28;
    const axisY = top + order.length*RH + 6;
    const u = PW/sideMax;
    let body = `<text x="${CX+GUT+PW-4}" y="16" text-anchor="end" class="spqsvg-colhdr">HYPER · OVER-RESPONSIVE →</text>` +
               `<text x="${CX-GUT-PW+4}" y="16" class="spqsvg-colhdr">← HYPO · UNDER-RESPONSIVE</text>`;
    subs.forEach((s,i)=>{
      const y = top + i*RH, cy = y + BH/2 + 4;
      body += `<text x="${CX}" y="${cy}" text-anchor="middle" class="spqsvg-lbl">${this.esc(s.name)}</text>`;
      const hw = s.hyper*u, ow = s.hypo*u;
      if(s.hyper>0) body += `<rect x="${CX+GUT}" y="${y}" width="${hw.toFixed(1)}" height="${BH}" rx="4" style="fill:${HYPER}"/>`;
      body += `<text x="${(CX+GUT+hw+6).toFixed(1)}" y="${cy}" class="spqsvg-pct">${s.hyper}</text>`;
      if(s.hypo>0) body += `<rect x="${(CX-GUT-ow).toFixed(1)}" y="${y}" width="${ow.toFixed(1)}" height="${BH}" rx="4" style="fill:${HYPO}"/>`;
      body += `<text x="${(CX-GUT-ow-6).toFixed(1)}" y="${cy}" text-anchor="end" class="spqsvg-pct">${s.hypo}</text>`;
    });
    body += `<line x1="${CX+GUT}" y1="20" x2="${CX+GUT}" y2="${axisY}" class="spqsvg-axis"/>` +
            `<line x1="${CX-GUT}" y1="20" x2="${CX-GUT}" y2="${axisY}" class="spqsvg-axis"/>` +
            `<line x1="${CX+GUT}" y1="${axisY}" x2="${CX+GUT+PW}" y2="${axisY}" class="spqsvg-axis"/>` +
            `<line x1="${CX-GUT-PW}" y1="${axisY}" x2="${CX-GUT}" y2="${axisY}" class="spqsvg-axis"/>`;
    for(let i=0;i<=4;i++){
      const tv = Math.round(sideMax*i/4), dx = PW*i/4;
      const aR = i===0?'start':(i===4?'end':'middle'), aL = i===0?'end':(i===4?'start':'middle');
      body += `<text x="${(CX+GUT+dx).toFixed(1)}" y="${axisY+14}" text-anchor="${aR}" class="spqsvg-tk">${tv}</text>` +
              `<text x="${(CX-GUT-dx).toFixed(1)}" y="${axisY+14}" text-anchor="${aL}" class="spqsvg-tk">${tv}</text>`;
    }
    const H = axisY + 34;
    body += `<text x="${CX+GUT+PW}" y="${H-4}" text-anchor="end" class="spqsvg-dir">sense-specific difficulties: read per sense</text>` +
            `<text x="${CX-GUT-PW}" y="${H-4}" class="spqsvg-dir">general seeking / dampening style: read as a whole</text>`;
    const hyperMax = t.items.filter(i=>i.pole==='hyper').length*4,
          hypoMax  = t.items.filter(i=>i.pole==='hypo').length*4;
    const chart = `
      <div class="panel">
        <div class="panel-head"><h3>Sensory profile: over- vs under-responsivity by sense</h3><span class="card-tag tag-sensory">descriptive</span></div>
        <p class="panel-sub">Bars to the right are hyper-sensitivity (overload/avoidance; tends to be sense-specific); bars to the left are hypo-sensitivity (dampening/seeking; tends to reflect a general behavioural style). Each side is 0–${sideMax}. Descriptive only, no per-modality norms.</p>
        <svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img">${body}</svg>
        <div class="spql-legend">
          <span class="it"><span class="spql-sw" style="background:${HYPER}"></span>Hyper (over-responsive / avoidant): ${r.hyper}/${hyperMax} overall</span>
          <span class="it"><span class="spql-sw" style="background:${HYPO}"></span>Hypo (under-responsive / seeking): ${r.hypo}/${hypoMax} overall</span>
        </div>
      </div>`;
    return chart + this.gsqEndorsedPanel(t, r);
  },

  /* items the respondent rated Often/Always, grouped by sense (heaviest first) —
     the concrete behaviours behind the bars, for interview and formulation */
  gsqEndorsedPanel(t, r){
    const en = r.endorsed || [];
    const intro = `<p class="panel-sub">Items rated <b>Often</b> or <b>Always</b>: the concrete behaviours behind the bars, grouped by sense. These are the things to probe at interview and carry into the formulation.</p>`;
    if(!en.length) return `
      <div class="panel">
        <div class="panel-head"><h3>Behaviours reported as frequent</h3></div>
        ${intro}
        <p class="panel-sub" style="margin-bottom:0">No items were rated Often or Always.</p>
      </div>`;
    const strip = s => s.replace(/^Does your child\s+/i,'').replace(/^Do you(r)?\s+/i,'').replace(/\?\s*$/,'');
    const byMod = {};
    en.forEach(e=>{ (byMod[e.modality]=byMod[e.modality]||[]).push(e); });
    const mods = Object.keys(byMod).sort((a,b)=> byMod[b].length - byMod[a].length ||
      ((r.subscales[b]&&r.subscales[b].raw)||0) - ((r.subscales[a]&&r.subscales[a].raw)||0));
    const groups = mods.map(k=>{
      const name = (t.subscales[k]&&t.subscales[k].name) || k;
      const rows = byMod[k].map(e=>`
        <div class="gsq-eg-item">
          <span class="gsq-chip gsq-chip-${e.pole}">${e.pole}</span>
          <span class="gsq-eg-text">${this.esc(strip(e.text))}</span>
          <span class="gsq-eg-freq">${this.esc(e.label)}</span>
        </div>`).join('');
      return `<div class="gsq-eg-group"><div class="gsq-eg-sense">${this.esc(name)}</div>${rows}</div>`;
    }).join('');
    return `
      <div class="panel">
        <div class="panel-head"><h3>Behaviours reported as frequent</h3><span class="card-tag tag-sensory">${en.length} of ${t.items.length} items</span></div>
        ${intro}
        ${groups}
      </div>`;
  },

  /* ═══════════ COVENTRY GRID RESULTS ═══════════ */
  resultsCoventry(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const pct = (a,b)=> b ? Math.round((a/b)*100) : 0;
    // NEUTRAL, never amber. The Coventry Grid is a differential aid with no
    // cut-off and no reference distribution (there is nothing to be "above"),
    // so a lean of even one feature out of ~60 must not read as severity. This
    // also aligns the report with Online.summaryLevel, which already returns
    // null for the Coventry precisely because it carries no severity colour.
    const leanCls = 'band-neutral';
    const summary = `${r.asd} of ${r.asdMax} autism-spectrum-consistent features and ${r.att} of ${r.attMax} attachment / relational-consistent features were marked present. This profile leans towards ${r.lean}.`;

    // category balance rows
    const cats = r.cats || {};
    const catRows = Object.keys(cats).map(k=>{
      const c = cats[k];
      const aPct = c.asdN ? (c.asd/c.asdN)*100 : 0;
      const tPct = c.attN ? (c.att/c.attN)*100 : 0;
      return `<div class="cov-cat">
        <div class="cov-cat-name">${this.esc(c.name)}</div>
        <div class="cov-cat-bars">
          <div class="cov-bar-row"><span class="cov-bar-lbl cov-asd">ASD</span><div class="cov-track"><span class="cov-fill cov-fill-asd" style="width:${aPct.toFixed(0)}%"></span></div><span class="cov-bar-n">${c.asd}/${c.asdN}</span></div>
          <div class="cov-bar-row"><span class="cov-bar-lbl cov-att">Att</span><div class="cov-track"><span class="cov-fill cov-fill-att" style="width:${tPct.toFixed(0)}%"></span></div><span class="cov-bar-n">${c.att}/${c.attN}</span></div>
        </div>
      </div>`;
    }).join('');

    const list = arr => arr.length
      ? `<ul class="cov-list">${arr.map(e=>`<li><span class="cov-list-cat">${this.esc(e.category)}</span> ${this.esc(e.text)}</li>`).join('')}</ul>`
      : `<p class="panel-sub" style="margin:0">None marked present.</p>`;

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <div class="cov-tally">
          <div class="cov-tally-side"><div class="cov-tally-num cov-asd-c">${r.asd}<span class="cov-tally-max">/${r.asdMax}</span></div><div class="cov-tally-lbl">Autism-spectrum-consistent</div></div>
          <div class="cov-tally-vs">vs</div>
          <div class="cov-tally-side"><div class="cov-tally-num cov-att-c">${r.att}<span class="cov-tally-max">/${r.attMax}</span></div><div class="cov-tally-lbl">Attachment / relational-consistent</div></div>
        </div>
        <p>${summary}</p>
        <span class="band-pill ${leanCls}">Leans: ${r.lean}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Feature balance by domain</h3><span class="card-tag tag-autism">present / total</span></div>
        <p class="panel-sub">Within each domain, how many features were present on each pole. Read the pattern across domains rather than any single count.</p>
        <div class="cov-cats">${catRows}</div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Features marked present, autism-spectrum-consistent</h3><span class="card-tag tag-autism">${r.asd}</span></div>
        ${list(r.endorsed.asd)}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Features marked present, attachment / relational-consistent</h3><span class="card-tag tag-mood">${r.att}</span></div>
        ${list(r.endorsed.att)}
      </div>

      ${this.coventryNotesPanel(t, r)}`;
  },

  /* clinician per-item notes captured during an administered run (any instrument).
     Coventry is excluded here — resultsCoventry renders its own pole-aware panel. */
  clinicianNotesPanel(t, r){
    if(t.scoring && t.scoring.type==='coventry') return '';
    const notes = r && r.itemNotes; if(!notes || !Object.keys(notes).length) return '';
    const byN = {}; (t.items||[]).forEach(it=>byN[String(it.n)]=it);
    const rows = Object.keys(notes).map(n=>{
      const it = byN[n] || {};
      return `<div class="cov-note"><div class="cov-note-q">${it.text?this.esc(String(it.text)):('Item '+this.esc(n))}</div><div class="cov-note-txt">${this.esc(notes[n])}</div></div>`;
    }).join('');
    return `<div class="panel">
      <div class="panel-head"><h3>Clinician notes</h3><span class="card-tag tag-autism">${Object.keys(notes).length}</span></div>
      ${rows}
    </div>`;
  },

  /* clinician per-item notes captured during a Coventry run */
  coventryNotesPanel(t, r){
    const notes = r.itemNotes; if(!notes || !Object.keys(notes).length) return '';
    const byN = {}; (t.items||[]).forEach(it=>byN[it.n]=it);
    const rows = Object.keys(notes).map(n=>{
      const it = byN[n] || {}; const pole = it.pole==='att' ? 'attachment' : (it.pole==='asd' ? 'ASD' : '');
      return `<div class="cov-note"><div class="cov-note-q">${it.text?this.esc(it.text):('Item '+n)}${pole?` <span class="cov-note-pole">(${pole})</span>`:''}</div><div class="cov-note-txt">${this.esc(notes[n])}</div></div>`;
    }).join('');
    return `<div class="panel">
      <div class="panel-head"><h3>Clinician notes</h3><span class="card-tag tag-autism">${Object.keys(notes).length}</span></div>
      ${rows}
    </div>`;
  },

  /* ═══════════ WFIRS-S RESULTS ═══════════ */
  resultsWfirs(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const subs = r.subscales || {};
    // WFIRS-S reference samples (ADHD adults + non-ADHD students); descriptive, no percentiles.
    // A band is shown ONLY when the client's age falls inside its source sample's span, so we
    // never plot a patient against a sample that did not include their age.
    const crefs = Array.isArray(t.scoring.clinicalRefs) ? t.scoring.clinicalRefs : null;
    const cAge = (typeof State!=='undefined' && State.client && State.client.dob) ? this.calcAge(State.client.dob, State.client.date) : null;
    const activeRefs = crefs ? crefs.filter(cr => cAge!=null && cAge>=cr.ageMin && cAge<=cr.ageMax) : [];

    // WFIRS-P general-population percentile norms (Arildskov 2023), age + sex matched.
    // Sex-stratified cell when sex is recorded and a matching cell exists; else unisex-by-age.
    const pop = t.scoring.popNorms;
    const cSex = (typeof State!=='undefined' && State.client) ? State.client.sex : null;
    const normCell = (pop && cAge!=null && cAge>=pop.ageMin && cAge<=pop.ageMax)
      ? (pop.cells.find(c=>c.sex===cSex && cAge>=c.ageMin && cAge<=c.ageMax)
         || pop.cells.find(c=>c.sex===null && cAge>=c.ageMin && cAge<=c.ageMax) || null)
      : null;
    // Arildskov publishes the 80th/90th/93rd/98th centiles (thr[0..3]); the
    // colours are cut to the suite reference ladder, so the 93rd and 98th mean
    // the same thing here as on an RCADS in the same pack. The 80th and 90th
    // are still REPORTED, they just no longer carry amber: the 80th centile is
    // one child in five and was reading as "elevated".
    const pctBand = (mean, thr) =>
      mean>=thr[3] ? {label:'≥98th centile', cls:'band-high'} :
      mean>=thr[2] ? {label:'93rd–98th centile', cls:'band-elevated'} :
      mean>=thr[1] ? {label:'90th–93rd centile', cls:'band-neutral'} :
      mean>=thr[0] ? {label:'80th–90th centile', cls:'band-neutral'} :
                     {label:'below 80th centile', cls:'band-typical'};
    // "Overall (excl. risky)" mean to match the norm total, which excludes the risky domain
    let normedTotal = null;
    if(normCell){
      let sum=0, count=0;
      (pop.normedDomains||[]).forEach(k=>{ const s=subs[k]; if(s && s.count){ sum+=s.sum; count+=s.count; } });
      if(count) normedTotal = { mean:sum/count, band:pctBand(sum/count, normCell.total) };
    }
    const order = Object.keys(t.subscales);
    const nImp = r.impairedDomains.length, nAssessed = r.assessedDomains;
    // The CADDRA rule defines impairment PER DOMAIN; "3 or more domains = more
    // severe" was an app convention with no source, so the red step is gone.
    // Any impaired domain is amber, none is green; the count is in the label.
    const band = nImp>=1 ? 'band-elevated' : 'band-typical';
    const headline = nImp ? `${nImp} of ${nAssessed} assessed domain${nAssessed===1?'':'s'} in the impaired range` : 'No domain in the impaired range';
    const summary = (nImp
      ? `Functioning is in the impaired range for: ${r.impairedDomains.join(', ')}. `
      : `No domain meets the impairment rule. `)
      + `A domain is flagged when its mean reaches 1.5, or two items are rated 2, or any item is rated 3.`;

    // qualitative position vs a reference group (deliberately words, not
    // percentiles: distributions are unpublished and right-skewed). Vocabulary
    // matches the shared reference ladder, so "mildly / moderately / markedly
    // above" means the same distance here as anywhere else in the suite; the
    // boundaries are the ladder's SD equivalents (+1.0 / +1.5 / +2.05) rather
    // than percentiles, because these samples publish no distribution.
    const zWord = z => z >= 2.05 ? 'markedly above' : z >= 1.5 ? 'moderately above'
      : z >= 1 ? 'mildly above' : z > -1 ? 'within the range of' : 'below';
    const rowHtml = key => {
      const s = subs[key]; if(!s) return '';
      if(!s.assessed){
        return `<div class="sdq-u-row"><span class="sdq-name">${this.esc(s.name)}<span class="sdq-note">all items N/A</span></span><span class="sdq-score">—</span><div class="sdq-track"><div class="vand-bar"></div></div><span class="band-pill band-typical">Not assessed</span></div>`;
      }
      const pct = Math.max(0, Math.min(100, (s.mean/3)*100));
      const impPct = (1.5/3)*100;
      const impNote = s.impaired ? (s.c3?`${s.c3}×“very often”`:(s.c2>=2?`${s.c2}×“often”`:'mean ≥1.5')) : '';
      let track, note;
      if(activeRefs.length){
        // SDQ-style axis: one mean ±1 SD band per age-matched reference group (clipped at 0) + patient dot
        const bands = activeRefs.map(cr=>{
          const d = cr.domains[key]; if(!d) return '';
          const lo = Math.max(0, Math.min(100, ((d.mean-d.sd)/3)*100));
          const hi = Math.max(0, Math.min(100, ((d.mean+d.sd)/3)*100));
          const mn = Math.max(0, Math.min(100, (d.mean/3)*100));
          return `<div class="norm-group-band" style="left:${lo.toFixed(1)}%;width:${(hi-lo).toFixed(1)}%;background:${cr.color}"></div><div class="norm-group-mean" style="left:${mn.toFixed(1)}%;background:${cr.color}"></div>`;
        }).join('');
        track = `<div class="sdq-track"><div class="norm-axis"></div>${bands}<div class="hsc-cut" style="left:${impPct}%" title="impairment ≥1.5"></div><div class="norm-marker" style="left:${pct.toFixed(1)}%"><div class="norm-marker-dot"></div></div></div>`;
        const ctx = activeRefs.map(cr=>{
          const d = cr.domains[key]; if(!d || !(d.sd>0)) return null;
          return `${zWord((s.mean-d.mean)/d.sd)} ${this.esc(cr.short)}${d.caveat?` (${this.esc(d.caveat)})`:''}`;
        }).filter(Boolean).join(' · ');
        note = [impNote, s.na?`${s.na} N/A`:'', ctx].filter(Boolean).join(' · ');
      } else {
        // no amber at mean>=1.0: an invented step below the 1.5 impairment rule
        const fill = s.impaired ? 'fill-high' : 'fill-typical';
        track = `<div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${fill}" style="width:${pct.toFixed(0)}%"></span></div><div class="hsc-cut" style="left:${impPct}%" title="impairment ≥1.5"></div></div>`;
        const pn = (normCell && normCell.domains[key]) ? pctBand(s.mean, normCell.domains[key]).label : '';
        note = [`mean ${s.mean.toFixed(2)}`, impNote, s.na?`${s.na} N/A`:'', pn].filter(Boolean).join(' · ');
      }
      return `<div class="sdq-u-row">
        <span class="sdq-name">${this.esc(s.name)}${note?`<span class="sdq-note">${note}</span>`:''}</span>
        <span class="sdq-score">${s.mean.toFixed(2)}<span class="sdq-max">/3</span></span>
        ${track}
        <span class="band-pill ${s.impaired?'band-high':'band-typical'}">${s.impaired?'Impaired':'Not impaired'}</span>
      </div>`;
    };

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2 style="font-size:clamp(22px,2.4vw,28px)">${headline}</h2>
        <p>${summary}</p>
        <span class="band-pill ${band}">${nImp} impaired</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Domain impairment</h3><span class="card-tag tag-adhd">mean / 3 · tick = ≥1.5</span></div>
        <p class="panel-sub">Each domain’s mean excludes N/A items. The tick marks the 1.5 impairment threshold; a domain is also flagged on ≥2 items rated “often” or any item rated “very often”.</p>
        <div class="profile-table" style="--cols:minmax(160px,1.8fr) 56px minmax(110px,2fr) 110px">
          <div class="ph"><span>Domain</span><span class="r">Mean</span><span class="col-opt">${activeRefs.length?'● = this person · bands = reference groups · tick = 1.5':(normCell?'Severity · tick = 1.5 · centile in note':'Severity · tick = 1.5')}</span><span class="c">Result</span></div>
          ${order.map(rowHtml).join('')}
        </div>
        ${activeRefs.length ? `<div class="norm-legend" style="margin-top:12px;padding-top:12px">
          <div class="norm-legend-item"><span class="norm-legend-dot"></span>This person</div>
          ${activeRefs.map(cr=>`<div class="norm-legend-item"><span class="norm-legend-swatch" style="background:${cr.color};opacity:.5"></span>${this.esc(cr.short)}, mean ±1 SD</div>`).join('')}
        </div>
        <p class="panel-sub" style="margin:8px 0 0;font-size:12px">Reference bands are descriptive mean ±1 SD ranges, clipped at 0, and shown only where the client's age (${cAge}) is inside the source sample: ${activeRefs.map(cr=>this.esc(cr.label)).join('; ')}. Severity context only, not population norms and not diagnostic thresholds. No percentiles are shown because neither study publishes score distributions and WFIRS scores are right-skewed, so percentiles estimated from a mean and SD would be unreliable.</p>`
        : (crefs ? `<p class="panel-sub" style="margin:8px 0 0;font-size:12px">${cAge==null
            ? `Add the client's date of birth to show age-matched reference bands.`
            : `No reference sample covers age ${cAge}, so no comparison bands are shown.`} Each sample is only shown within its own age span: ${crefs.map(cr=>`${this.esc(cr.short)} ${cr.ageMin}–${cr.ageMax}`).join('; ')}.</p>` : '')}
        ${normCell ? `<div class="norm-legend" style="margin-top:12px;padding-top:12px">
          <div class="norm-legend-item">Centiles vs ${this.esc(pop.label)}${normCell.sex?`, ${normCell.sex==='male'?'boys':'girls'}`:''} aged ${normCell.ageMin}–${normCell.ageMax} (n=${this.esc(normCell.n)})</div>
        </div>
        ${normedTotal ? `<p class="panel-sub" style="margin:8px 0 0;font-size:12px"><b>Overall, excluding risky activities: mean ${normedTotal.mean.toFixed(2)}, ${normedTotal.band.label}.</b></p>` : ''}
        <p class="panel-sub" style="margin:6px 0 0;font-size:12px">Centiles are empirical general-population values (they handle the skew in WFIRS scores that mean/SD estimates cannot). Severity context only, not diagnostic: the impairment rule in the Result column stays the clinical call. They cover 6 domains, the risky-activities domain has no norms and the reference total excludes it, and they are available for ages 6–11 only. ${this.esc(pop.citation)}.</p>`
        : (pop ? `<p class="panel-sub" style="margin:8px 0 0;font-size:12px">${cAge==null
            ? `Add the client's date of birth (and sex) to show general-population centiles.`
            : `General-population centiles are available for ages 6–11 only, so none are shown for age ${cAge}.`} Source: ${this.esc(pop.label)}.</p>` : '')}
      </div>
      ${this._wfirsAdhdPanel(t, r)}`;
  },

  /* ADHD-discrimination screen (WFIRS-P; Thompson et al. 2017). Rendered only when
     the instrument defines scoring.adhdScreen, so WFIRS-S shows nothing. Kept
     visually separate from the impairment rule because it answers a different
     question (ADHD vs control, not clinical impairment) and is computed differently
     (average of the six domain means, School and learning merged). */
  _wfirsAdhdPanel(t, r){
    const a = r.adhd; if(!a) return '';
    const pos = a.positive;
    const verdict = a.overall==null
      ? 'Not enough answered items to compute the overall screening score.'
      : (pos ? `The overall score of ${a.overall.toFixed(2)} is at or above the 0.65 cut-off: a positive screen for ADHD-level functional impairment.`
             : `The overall score of ${a.overall.toFixed(2)} is below the 0.65 cut-off: a negative screen.`);
    const domRows = a.domains.map(d=>{
      if(!d.assessed) return `<div class="sdq-u-row"><span class="sdq-name">${this.esc(d.name)}<span class="sdq-note">all items N/A</span></span><span class="sdq-score">—</span><div class="sdq-track"><div class="vand-bar"></div></div><span class="band-pill band-typical">—</span></div>`;
      const pct = Math.max(0, Math.min(100, (d.mean/3)*100));
      const tpct = Math.max(0, Math.min(100, (d.threshold/3)*100));
      const fill = d.positive ? 'fill-elevated' : 'fill-typical';
      return `<div class="sdq-u-row">
        <span class="sdq-name">${this.esc(d.name)}<span class="sdq-note">cut-off ≥${d.threshold.toFixed(2)}</span></span>
        <span class="sdq-score">${d.mean.toFixed(2)}<span class="sdq-max">/3</span></span>
        <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${fill}" style="width:${pct.toFixed(0)}%"></span></div><div class="hsc-cut" style="left:${tpct}%" title="cut-off ${d.threshold.toFixed(2)}"></div></div>
        <span class="band-pill ${d.positive?'band-elevated':'band-typical'}">${d.positive?'At / above':'Below'}</span>
      </div>`;
    }).join('');
    return `
      <div class="panel">
        <div class="panel-head"><h3>ADHD screen (Thompson 2017)</h3><span class="card-tag tag-adhd">overall ${a.overall==null?'not computed':a.overall.toFixed(2)} · cut-off 0.65</span></div>
        <div class="caveat report-caveat" style="margin-bottom:12px"><div class="cv-body"><span class="band-pill ${pos?'band-elevated':'band-typical'}">${pos?'Positive screen':'Negative screen'}</span> ${verdict} This is a validated ADHD-vs-control screen (sensitivity 83%, specificity 85%, AUC 0.91), <b>distinct from the clinical impairment rule above</b> and computed differently: the overall score is the average of the six domain means, with School and learning combined. Screening only, not diagnostic.</div></div>
        <div class="profile-table" style="--cols:minmax(160px,1.8fr) 56px minmax(110px,2fr) 110px">
          <div class="ph"><span>Domain (6-domain grouping)</span><span class="r">Mean</span><span class="col-opt">Mean · tick = cut-off</span><span class="c">Screen</span></div>
          ${domRows}
        </div>
        <p class="src-note">${this.esc(a.citation)}. Overall and per-domain cut-offs from Table 2; no significant difference by sex or age (5–12 vs 13–19).</p>
      </div>`;
  },

  /* ═══════════ DSM-5 SEVERITY MEASURE RESULTS ═══════════ */
  resultsDsm5Sev(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const max = r.totalMax, total = r.total, avg = r.average, label = r.severityLabel;
    const cls = r.severityIndex>=3 ? 'band-high' : (r.severityIndex===2 ? 'band-elevated' : 'band-typical');
    const opts = t.scoring.options;
    const ans = r.answers || {};
    const summary = r.notScoreable
      ? `${r.missing} of ${r.nItems} items were left unanswered. Per the APA scoring instructions the total is not calculated when 3 or more items are missing.`
      : `Total ${total} of ${max}${r.prorated ? ` (prorated: ${r.missing} item${r.missing===1?'':'s'} unanswered, raw sum × ${r.nItems} ÷ ${r.answered})` : ''}; average ${avg.toFixed(1)} on the 0–4 scale, ${label.toLowerCase()} social-anxiety symptoms over the past 7 days.`;
    const itemRows = t.items.map(it=>{
      const v = ans[it.n];
      const lab = (v==null) ? '—' : (opts[v] ? opts[v].label : v);
      const hit = (v!=null && v>=3);
      return `<div class="sdq-u-row${hit?'':''}">
        <span class="sdq-name"${hit?' style="font-weight:600"':''}>${it.n}. ${this.esc(it.text)}</span>
        <span class="sdq-score">${v==null?'—':v}<span class="sdq-max">/4</span></span>
        <span class="sdq-pct"${hit?' style="color:var(--rose);font-weight:700"':''}>${this.esc(lab)}</span>
      </div>`;
    }).join('');

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2>${r.notScoreable ? 'Not scoreable' : `${total} out of ${max}`}</h2>
        <p>${summary}</p>
        ${r.notScoreable ? '' : `<span class="band-pill ${cls}">${label} (avg ${avg.toFixed(1)})</span>`}
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Item responses</h3><span class="card-tag tag-mood">past 7 days</span></div>
        <p class="panel-sub">Each item is rated 0 (Never) to 4 (All of the time). Items rated most or all of the time are highlighted; persistently high items may warrant further assessment.</p>
        <div class="profile-table" style="--cols:minmax(200px,2.4fr) 50px minmax(90px,1fr)">
          <div class="ph"><span>Over the past 7 days, I have…</span><span class="r">Score</span><span>Response</span></div>
          ${itemRows}
        </div>
      </div>`;
  },

  /* ═══════════ LSAS-SR RESULTS ═══════════ */
  resultsLSAS(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const sc = t.scoring, max = sc.totalMax, total = r.total, sev = r.severity || {label:'—'};
    // Colour comes from the two published cut-offs (30 / 60), NOT from the six
    // severity-band edges, which are an unvalidated interpretation table. The
    // scorer computes it; the fallback repeats the same rule for older results.
    const bandCls = r.bandCls || (total>=sc.cutoff2 ? 'band-high' : (total>=sc.cutoff ? 'band-elevated' : 'band-typical'));
    const fillCls = bandCls==='band-high' ? 'fill-high' : (bandCls==='band-elevated' ? 'fill-elevated' : 'fill-typical');
    const toP = (v,m) => Math.max(0, Math.min(100, (v/m)*100));
    const summary = `Total ${total} of ${max}, ${sev.label.toLowerCase()} social-anxiety symptoms. `
      + (total>=sc.cutoff2 ? `At or above ≥${sc.cutoff2}, the range indicating a high likelihood of generalized social anxiety disorder.`
        : (total>=sc.cutoff ? `At or above the ≥${sc.cutoff} screening cut-off for possible social anxiety disorder.`
          : `Below the ≥${sc.cutoff} screening cut-off.`));

    const N = t.clinicalNorms || {};
    const hasNorms = !!t.clinicalNorms;
    // total: lanes chart (clinical-sample row, ±1 SD bar + mean dot, score line)
    // with the severity-band boundaries as dashed notches; the chips below give
    // each band's meaning
    const lsasLines = [...new Set([sc.cutoff, sc.cutoff2, ...sc.severity.filter(b=>b.max!=null).map(b=>b.max+1)])]
      .filter(v=>v!=null).sort((a,b)=>a-b)
      .map(v=>({score:v, label:(v===sc.cutoff||v===sc.cutoff2) ? String(v) : ''}));
    const totalLanes = (N.total && N.total.sd>0) ? this.groupLanes({
      max:144, score:total,
      groups:[{ label:'SAD clinical sample', color:'var(--accent)', mean:N.total.mean, sd:N.total.sd,
        right:this.pctileCell((total-N.total.mean)/N.total.sd) }],
      // labelled lines at the two validated cut-offs (30, 60); the National Social
      // Anxiety Center band starts (50, 65, 80, 95) are drawn unlabelled
      cuts: lsasLines,
      dir:['less social anxiety','more social anxiety']
    }) : '';
    const rows = [
      ...(totalLanes ? [] : [{name:'Total (fear + avoidance)', raw:total, max:144, lead:true, cls:fillCls, norm:N.total, ticks:true}]),
      {name:'Fear / anxiety', raw:r.fear, max:72, cls:'fill-elevated', norm:N.fear},
      {name:'Avoidance', raw:r.avoid, max:72, cls:'fill-elevated', norm:N.avoidance},
      {name:'Performance situations', sub:true, raw:r.perfTotal, max:78, note:`fear ${r.perfFear} · avoidance ${r.perfAvoid}`, cls:'fill-accent',
        meanSum:[N.perfFear, N.perfAvoid], components:[[r.perfFear, N.perfFear],[r.perfAvoid, N.perfAvoid]]},
      {name:'Social-interaction situations', sub:true, raw:r.socTotal, max:66, note:`fear ${r.socFear} · avoidance ${r.socAvoid}`, cls:'fill-accent',
        meanSum:[N.socFear, N.socAvoid], components:[[r.socFear, N.socFear],[r.socAvoid, N.socAvoid]]}
    ];
    // bar = magnitude; overlay = clinical-sample reference lines (mean + ±1 SD band),
    // plus severity-band cut-off ticks on the total. Gives the raw score perspective.
    const trackHtml = rw => {
      let bh='';
      if(rw.norm && rw.norm.sd>0){
        const lo=toP(rw.norm.mean-rw.norm.sd,rw.max), hi=toP(rw.norm.mean+rw.norm.sd,rw.max), m=toP(rw.norm.mean,rw.max);
        bh += `<div class="norm-group-band" style="left:${lo}%;width:${Math.max(0,hi-lo)}%;background:var(--accent-fill)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--accent-fill)"></div>`;
      } else if(rw.meanSum && rw.meanSum.every(Boolean)){
        const mean=rw.meanSum.reduce((s,n)=>s+n.mean,0);
        bh += `<div class="norm-group-mean" style="left:${toP(mean,rw.max)}%;background:var(--accent-fill)"></div>`;
      }
      if(rw.ticks) bh += lsasLines.map(c=>`<div class="hsc-cut" style="left:${toP(c.score,rw.max)}%" title="${c.label ? 'cut-off ≥'+c.score : 'band starts at '+c.score}"></div>`).join('');
      return `<div class="sdq-track"><div class="norm-axis"></div>${bh}<div class="norm-marker" style="left:${toP(rw.raw,rw.max)}%" title="Score ${rw.raw} / ${rw.max}"><div class="norm-marker-dot"></div></div></div>`;
    };
    const pctOf = (raw,n) => (n && n.sd>0) ? this.pctileCell((raw-n.mean)/n.sd) : null;
    const pctCell = rw => {
      const p = pctOf(rw.raw, rw.norm);
      if(p) return p;
      if(rw.components){
        const lbl = ['fear','avoid'];
        return rw.components.map((c,i)=>`<span class="lsas-pct-pair"><span class="lsas-pct-lbl">${lbl[i]}</span> ${pctOf(c[0],c[1])||'—'}</span>`).join('');
      }
      return '<span class="sdq-pct-empty">—</span>';
    };
    const cols = hasNorms ? '--cols:minmax(150px,1.5fr) 60px minmax(120px,2.2fr) 98px' : '--cols:minmax(160px,1.6fr) 64px minmax(120px,2.2fr)';
    const rowHtml = rw => `<div class="sdq-u-row${rw.lead?' sdq-u-lead':rw.sub?' sdq-u-sub':''}">
      <span class="sdq-name">${rw.name}${rw.note?`<span class="sdq-note">${rw.note}</span>`:''}</span>
      <span class="sdq-score">${rw.raw}<span class="sdq-max">/${rw.max}</span></span>
      ${trackHtml(rw)}
      ${hasNorms?`<span class="sdq-pct">${pctCell(rw)}</span>`:''}
    </div>`;
    const bandChips = sc.severity.map((b,i)=>`<span class="sev-chip ${b===sev?'sev-chip-on '+bandCls:''}">${t.bandRanges[i]} · ${b.label}</span>`).join('');

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2>${total} out of ${max}</h2>
        <p>${summary}</p>
        <span class="band-pill ${bandCls}">${sev.label}${sev.note?`, ${this.esc(sev.note)}`:''}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Score breakdown</h3><span class="card-tag tag-mood">${total>=sc.cutoff2?'≥ '+sc.cutoff2:(total>=sc.cutoff?'≥ '+sc.cutoff:'below cut-off')}</span></div>
        <p class="panel-sub">Fear and avoidance are each summed across all 24 situations (0–72 each); performance and social-interaction subsets combine both ratings. The 13 / 11 division of situations is the author's own, taken from the (P) / (S) tag printed against each item on the original scale.${hasNorms?` ${totalLanes?'Top: the total against the treatment-seeking social-anxiety sample (bar = ±1 SD around the mean dot, vertical line = this client), with the severity-band boundaries as dashed notches. Below, each':'Each'} row plots this client (the dot) against the same sample: the shaded band is the typical range (±1 SD) and the line that sample's average. The %ile is the client's standing within that clinical group, so ~50th percentile is average <i>for someone with social anxiety disorder</i>, not the general population (the situation rows show fear / avoidance percentiles).`:''}</p>
        ${totalLanes}
        <div class="profile-table" style="${cols}${totalLanes?';margin-top:14px':''}">
          <div class="ph"><span>Measure</span><span class="r">Score</span><span class="col-opt">Profile${hasNorms?' · vs clinical sample':''}</span>${hasNorms?'<span class="r col-opt">%ile · SAD</span>':''}</div>
          ${rows.map(rowHtml).join('')}
        </div>
        ${hasNorms?`<div class="norm-legend" style="margin-top:12px;padding-top:12px"><div class="norm-legend-item"><span class="norm-legend-dot"></span>This client</div><div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--accent-fill);opacity:.45"></span>Clinical sample ±1 SD</div>${totalLanes?'':'<div class="norm-legend-item"><span class="lsas-leg-tick"></span>Severity cut-offs (total)</div>'}</div>`:''}
        <div class="sev-chips">${bandChips}</div>
        ${hasNorms?`<p class="src-note" style="margin-top:10px">Norms: ${this.esc(t.normsSource)}</p>`:''}
      </div>

      ${this.lsasFactorPanel(t, r)}`;
  },

  /* Safren (1999) exploratory four-factor profile, descriptive supplement */
  lsasFactorPanel(t, r){
    if(!r.factors || !t.safrenFactors) return '';
    const sf = t.safrenFactors;
    const order = sf.order || Object.keys(sf.fear);
    const toP = v => Math.max(0, Math.min(100, (v/3)*100));   // factor scores are item means (0–3)
    const facRow = (dim, key) => {
      const f = r.factors[dim] && r.factors[dim][key]; if(!f) return '';
      const norm = ((sf[dim]||{})[key]||{}).norm;
      const ans = f.answered || f.nItems || 0;
      const mean = ans ? f.score/ans : null;
      let band = '';
      if(norm && norm.sd>0){
        const lo=toP(norm.mean-norm.sd), hi=toP(norm.mean+norm.sd), m=toP(norm.mean);
        band = `<div class="norm-group-band" style="left:${lo}%;width:${Math.max(0,hi-lo)}%;background:var(--accent-fill)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--accent-fill)"></div>`;
      }
      const dot = mean!=null ? `<div class="norm-marker" style="left:${toP(mean)}%" title="mean ${mean.toFixed(2)} of 3"><div class="norm-marker-dot"></div></div>` : '';
      const z = (norm && norm.sd>0 && mean!=null) ? (mean-norm.mean)/norm.sd : null;
      // Factors whose sample mean is no bigger than its SD pile up at 0 (a normal
      // curve would put over 16% of that sample below the scale's floor), so a
      // normal-curve percentile would mislead; show the SD distance instead.
      const floored = norm && norm.sd>0 && norm.mean <= norm.sd;
      const pct = z==null ? '<span class="sdq-pct-empty">—</span>'
        : mean >= 3 ? '<span title="Highest possible score; a normal curve would place part of the sample above it, so no percentile is given">at ceiling</span>'
        : floored ? `<span title="Sample scores pile up at 0, so no percentile is given">${mean===0 ? 'at floor' : (z>=0?'+':'−')+Math.abs(z).toFixed(1)+' SD'}</span>`
        : this.pctileCell(z);
      return `<div class="sdq-u-row">
        <span class="sdq-name">${this.esc(f.name||key)}</span>
        <span class="sdq-score">${mean!=null?mean.toFixed(2):'—'}<span class="sdq-max">/3</span></span>
        <div class="sdq-track"><div class="norm-axis"></div>${band}${dot}</div>
        <span class="sdq-pct">${pct}</span>
      </div>`;
    };
    const section = (dim, label) => `
      <div class="lsas-fac-h">${label}</div>
      <div class="profile-table" style="--cols:minmax(150px,1.6fr) 56px minmax(120px,2.4fr) 64px">
        <div class="ph"><span>Factor</span><span class="r">Mean</span><span class="col-opt">vs clinical sample</span><span class="r col-opt">%ile</span></div>
        ${order.map(k=>facRow(dim,k)).join('')}
      </div>`;
    return `
      <div class="panel">
        <div class="panel-head"><h3>Exploratory factor profile</h3><span class="card-tag tag-mood">exploratory</span></div>
        <p class="panel-sub">Four empirically-derived domains of social fear (Safren et al. 1999). Each factor score is the mean of its items (0–3); the dot is this client against a separate clinical sample (Safren et al. 1999, N=382, clinician-administered LSAS; shaded band ±1 SD, line = sample mean) and the %ile is their standing within it. Exploratory: fear and avoidance use slightly different item sets, some items are excluded, and the Observation (α .56) and Eating (2 items) factors are weak, so weight the total and the standard subscales above this. Where a factor’s sample scores pile up at 0 (its mean is no bigger than its SD), the last column gives the distance from the mean in SDs, or “at floor” for a score of 0, instead of a percentile.</p>
        ${section('fear','Fear / anxiety')}
        ${section('avoid','Avoidance')}
        <div class="norm-legend" style="margin-top:12px;padding-top:12px"><div class="norm-legend-item"><span class="norm-legend-dot"></span>This client</div><div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--accent-fill);opacity:.45"></span>Clinical sample ±1 SD</div></div>
        <p class="src-note">${this.esc(sf.source)}</p>
      </div>`;
  },

  /* ═══════════ DIVA-5 RESULTS (clinician interview) ═══════════ */
  resultsDiva(t, r){
    const esc=s=>this.esc(s);
    const met=!!r.diagnosisMet;
    const a=r.attention||{childhood:0,adulthood:0}, h=r.hyperimpulsive||{childhood:0,adulthood:0};
    const crit=r.criteria||{};
    // variant-aware labelling (older adult results lack these → default to adult)
    const young = r.variant==='young_diva';
    const T = r.threshold || 5;
    const sA = r.stageA || 'Adulthood', sC = r.stageC || 'Childhood';
    const shA = young?'Current':'Adult', shC = young?'Earlier':'Child';
    const twoStage = r.impTwoStage!==false;
    const adhdNoun = young?'ADHD':'adult ADHD';
    const yn=b=>b?'<span class="diva-met">Met</span>':'<span class="diva-unmet">Not met</span>';
    const pres=b=>b===true?'<span class="diva-pres">Present</span>':b===false?'<span class="diva-abs">Absent</span>':'<span class="diva-abs">—</span>';
    const items=(r.items||[]).filter(it=>!it.removed);
    const removedN=(r.items||[]).filter(it=>it.removed).length;
    // ticked example prompts + free-text notes recorded against each stage
    const stageEv=(lbl,exs,note)=>{
      if((!exs||!exs.length)&&!note) return '';
      const parts=[];
      if(exs&&exs.length) parts.push(`<span class="diva-rep-tags">${exs.map(esc).join(' · ')}</span>`);
      if(note) parts.push(`<span class="diva-rep-noteq">${esc(note)}</span>`);
      return `<div class="diva-rep-ev"><span class="diva-rep-stg">${lbl}</span><span>${parts.join(' &nbsp;·&nbsp; ')}</span></div>`;
    };
    const itemRows=items.map(it=>{
      const detail=stageEv(shA,it.examplesAdult,it.noteAdult)+stageEv(shC,it.examplesChild,it.noteChild);
      return `<div class="diva-rep-row"><span class="diva-rep-code">${esc(it.code)}</span><span class="diva-rep-label">${esc(it.label)}</span><span class="diva-rep-c">${pres(it.adulthood)}</span><span class="diva-rep-c">${pres(it.childhood)}</span></div>${detail?`<div class="diva-rep-detail">${detail}</div>`:''}`;
    }).join('');
    const imp=r.impairment||{};
    const impA=(imp.adult||[]).filter(d=>d.impaired).map(d=>esc(d.domain));
    const impC=(imp.child||[]).filter(d=>d.impaired).map(d=>esc(d.domain));
    // per-domain impairment evidence (ticked prompts + notes), where recorded
    const impEvRow=d=>{
      const bits=[];
      if(d.examples&&d.examples.length) bits.push(`<span class="diva-rep-tags">${d.examples.map(esc).join(' · ')}</span>`);
      if(d.note) bits.push(`<span class="diva-rep-noteq">${esc(d.note)}</span>`);
      if(!bits.length && !d.impaired) return '';
      return `<div class="diva-rep-imp"><span class="diva-rep-impd">${esc(d.domain)}${d.impaired?' <span class="diva-met">Impaired</span>':''}</span>${bits.length?`<div class="diva-rep-impe">${bits.join(' &nbsp;·&nbsp; ')}</div>`:''}</div>`;
    };
    const impAR=(imp.adult||[]).map(impEvRow).filter(Boolean).join('');
    const impCR=twoStage?(imp.child||[]).map(impEvRow).filter(Boolean).join(''):'';
    const impDetailHtml=(impAR||impCR)?`<div class="panel"><div class="panel-head"><h3>Impairment detail</h3></div>${impAR?`${twoStage?`<p class="panel-sub" style="margin:0 0 2px"><b>${esc(sA)}</b></p>`:''}<div class="diva-rep-implist">${impAR}</div>`:''}${impCR?`<p class="panel-sub" style="margin:12px 0 2px"><b>${esc(sC)}</b></p><div class="diva-rep-implist">${impCR}</div>`:''}</div>`:'';
    const col=r.collateral||{};
    const cLabelA = young?'Parent / carer':sA, cLabelC = young?'Teacher / school':sC;
    const collat=[];
    if(col.partner&&col.partner.name) collat.push(`<b>${esc(cLabelA)}</b> ${this.interviewInformantHtml(col.partner,'paren')}`);
    if(col.family&&col.family.name) collat.push(`<b>${esc(cLabelC)}</b> ${this.interviewInformantHtml(col.family,'paren')}`);
    const onsetTxt = r.onset==='yes'?'Several symptoms before age 12 (set)':r.onset==='no'?`Not before age 12 (set)${r.onsetAge!=null&&r.onsetAge!==''?`, starting from age ${esc(r.onsetAge)}`:''}`:'From childhood symptoms (auto)';
    const clin = r.dxSource==='clinician';
    const presTxt = (r.presentation||'') + (r.remission?', partly in remission':'');
    const autoTxt = r.autoDiagnosisMet ? `criteria met${r.autoPresentation?` (${r.autoPresentation})`:''}` : 'criteria not met';
    const csWord = v => v==null ? null : v==='na' ? 'N/A' : ({'0':'0, none or little support','1':'1, some support','2':'2, clear support'})[String(v)] || String(v);
    const cs = r.collateralSupport || {};
    const csRows = [['Parent(s) / sibling / other',cs.family],['Partner / good friend / other',cs.partner],['School reports',cs.school]].filter(x=>x[1]!=null);
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>${clin ? (met?`ADHD: ${esc(presTxt)}`:'No ADHD diagnosis') : (met?`ADHD criteria met${r.presentation?`: ${esc(presTxt)}`:''}`:'ADHD criteria not met')}</h2>
        <p>${clin
          ? `Clinician’s diagnosis${r.dsmCode?` (${esc(r.dsmCode)})`:''}${r.severity?`, ${esc(r.severity)} severity`:''}. ${r.dxDiffers?`<b>This differs from the interview’s automatic readout</b> (${esc(autoTxt)}).`:`The interview’s automatic readout agrees (${esc(autoTxt)}).`}`
          : met
          ? `The DSM-5 criteria for ${adhdNoun} are met on this interview${r.dsmCode?` (${esc(r.dsmCode)})`:''}${r.severity?`, ${esc(r.severity)} severity`:''}. This is a clinician decision aid. Confirm against the full clinical picture.`
          : `The DSM-5 criteria for ${adhdNoun} are not fully met on this interview. The counts and unmet criteria are shown below; clinical judgement applies.`}${!clin&&r.remission?' Recorded as partly in remission.':''}</p>
        <span class="band-pill ${met?'band-high':'band-typical'}">${clin?(met?'ADHD (clinician)':'No ADHD (clinician)'):(met?'Criteria met':'Criteria not met')}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Symptom counts</h3></div>
        <div class="profile-table" style="--cols:minmax(160px,1.6fr) 90px 90px">
          <div class="ph"><span>Domain</span><span class="r">${esc(shA)}</span><span class="r">${esc(shC)}</span></div>
          <div class="sdq-u-row sdq-u-lead"><span class="sdq-name">Inattention (A)</span><span class="sdq-score">${a.adulthood}/9${a.adulthood>=T?' ✓':''}</span><span class="sdq-score">${a.childhood}/9</span></div>
          <div class="sdq-u-row sdq-u-lead"><span class="sdq-name">Hyperactivity / impulsivity (HI)</span><span class="sdq-score">${h.adulthood}/9${h.adulthood>=T?' ✓':''}</span><span class="sdq-score">${h.childhood}/9</span></div>
        </div>
        <p class="panel-sub">${esc(sA)} diagnostic threshold is ≥${T} symptoms in a domain (✓). Onset requires several (3+) symptoms before age 12.</p>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>DSM-5 criteria</h3></div>
        <div class="diva-crit-grid">
          <div><span>A · ${esc(shA)} threshold (≥${T})</span>${yn(crit.A)}</div>
          <div><span>B · Onset before age 12</span>${yn(crit.B)}</div>
          <div><span>C/D · Impairment in ≥2 domains</span>${yn(crit.CD)}</div>
          <div><span>E · Not better explained</span>${yn(crit.E)}</div>
        </div>
        ${csRows.length?`<p class="panel-sub" style="margin-bottom:4px"><b>Diagnosis supported by collateral information:</b> ${csRows.map(x=>`${esc(x[0])}: ${esc(csWord(x[1]))}`).join(' · ')}.</p>`:''}
        <p class="panel-sub">Onset: ${esc(onsetTxt)}.${(impA.length||impC.length)?(twoStage?` Impaired domains: ${esc(sA.toLowerCase())}: ${impA.join(', ')||'none'}; ${esc(sC.toLowerCase())}: ${impC.join(', ')||'none'}.`:` Impaired domains: ${impA.join(', ')||'none'}.`):''}</p>
      </div>

      ${collat.length?`<div class="panel"><div class="panel-head"><h3>Collateral informants present</h3></div><p class="panel-sub">${collat.join(' &nbsp;·&nbsp; ')}</p></div>`:''}

      ${impDetailHtml}

      <div class="panel">
        <div class="panel-head"><h3>Per-criterion ratings</h3></div>
        <div class="diva-rep-table">
          <div class="diva-rep-row diva-rep-head"><span class="diva-rep-code"></span><span class="diva-rep-label">Criterion</span><span class="diva-rep-c">${esc(shA)}</span><span class="diva-rep-c">${esc(shC)}</span></div>
          ${itemRows}
        </div>
        ${removedN?`<p class="panel-sub">${removedN} criteri${removedN===1?'on was':'a were'} removed from this interview and not counted.</p>`:''}
      </div>`;
  },

  /* ═══════════ DASI-2 (Diagnostic Autism Spectrum Interview) ═══════════ */
  resultsDasi(t, r){
    const esc=s=>this.esc(s);
    const crit=r.criteria||{};
    const met=!!r.asdMet, scd=!!r.scdPattern;
    const cats=r.categories||{};
    const sevTxt={mild:'requires mild to moderate support', substantial:'requires substantial support', very:'requires very substantial support'}[r.severitySupport]||null;
    const yn=b=>b?'<span class="diva-met">Met</span>':'<span class="diva-unmet">Not met</span>';
    const ratingTxt=v=>v==='present'?'<span class="diva-pres">Present</span>':v==='partial'?'<span class="diva-pres" style="opacity:.75">Partial*</span>':v==='absent'?'<span class="diva-abs">Absent</span>':'<span class="diva-abs">—</span>';
    // per-category endorsement rows
    const catRow=n=>{ const c=cats[n]||{};
      return `<div class="sdq-u-row sdq-u-lead"><span class="sdq-name">${n} · ${esc(c.label||'')}</span><span class="sdq-score">${c.endorsed?'Endorsed ✓':'Not endorsed'}</span><span class="sdq-score">${c.present||0} present · ${c.partial||0} partial</span></div>`; };
    // per-symptom rows with the recorded notes
    const noteBits=it=>{ const n=it.notes||{}; const parts=[];
      if(n.toddler) parts.push(`<span class="diva-rep-noteq"><b>Toddler/child:</b> ${esc(n.toddler)}</span>`);
      if(n.impact) parts.push(`<span class="diva-rep-noteq"><b>Impact/masking:</b> ${esc(n.impact)}</span>`);
      if(n.settings) parts.push(`<span class="diva-rep-noteq"><b>Home vs outside:</b> ${esc(n.settings)}</span>`);
      if(n.current) parts.push(`<span class="diva-rep-noteq"><b>Current:</b> ${esc(n.current)}</span>`);
      return parts.length?`<div class="diva-rep-detail"><div class="diva-rep-ev"><span>${parts.join(' &nbsp;·&nbsp; ')}</span></div></div>`:''; };
    const symRows=(r.symptoms||[]).map(it=>`<div class="diva-rep-row"><span class="diva-rep-code">${esc(it.id)}</span><span class="diva-rep-label">${esc(it.label)}</span><span class="diva-rep-c" style="grid-column:span 2">${ratingTxt(it.rating)}</span></div>${noteBits(it)}`).join('');
    // co-existing flags
    const coexRows=(r.coexisting||[]).map(c=>{
      const flags=[]; if(c.previouslyDiagnosed===true) flags.push('<span class="diva-met">Previously diagnosed</span>');
      if(c.furtherInvestigation===true) flags.push('<span class="diva-unmet">Further investigation</span>');
      if(c.previouslyDiagnosed===false&&c.furtherInvestigation===false&&!c.notes) return '';
      return `<div class="diva-rep-row"><span class="diva-rep-label" style="grid-column:1/span 2">${esc(c.label)}</span><span class="diva-rep-c" style="grid-column:span 2">${flags.join(' ')||'—'}</span></div>${c.notes?`<div class="diva-rep-detail"><div class="diva-rep-ev"><span class="diva-rep-noteq">${esc(c.notes)}</span></div></div>`:''}`;
    }).filter(Boolean).join('');
    // observational record summary
    const or=r.observational||{};
    const orScale={none:'No difficulty',some:'Some/limited',difficulty:'Difficulty',marked:'Marked difficulty',good:'Good',poor:'Poor',unable:'Unable/refused',spont:'Spontaneous'};
    const orRow=(code,label,rating,note)=>`<div class="diva-rep-row"><span class="diva-rep-code">${esc(code)}</span><span class="diva-rep-label">${esc(label)}</span><span class="diva-rep-c" style="grid-column:span 2">${rating?esc(orScale[rating]||rating):'—'}</span></div>${note?`<div class="diva-rep-detail"><div class="diva-rep-ev"><span class="diva-rep-noteq">${esc(note)}</span></div></div>`:''}`;
    let orHtml='';
    if(or.done){
      const bits=[];
      if(or.or1&&or.or1.elements&&or.or1.elements.some(x=>x.rating||x.note)) bits.push(or.or1.elements.map(x=>orRow('OR1',x.label,x.rating,x.note)).join(''));
      if(or.or2&&or.or2.some(x=>x.rating||x.response)) bits.push(or.or2.map(x=>orRow('OR2',x.label+(x.prompted?' (prompted)':''),x.rating,[x.response,x.why].filter(Boolean).join(' · Why: '))).join(''));
      if(or.or3&&(or.or3.spontaneous||or.or3.categories.some(x=>x.rating||x.note))) bits.push((or.or3.spontaneous?orRow('OR3','Free viewing',null,or.or3.spontaneous):'')+or.or3.categories.map(x=>orRow('OR3',x.label,x.rating,x.note)).join(''));
      if(or.or4&&(or.or4.story||or.or4.rating)){ const a=or.or4.aspects||{}; const asp=['A','B','C'].filter(k=>a[k]).join(', ');
        bits.push(orRow('OR4','Imaginative effort'+(asp?` (aspects ${asp})`:''),or.or4.rating,or.or4.story)); }
      if(or.or5&&or.or5.length) bits.push(or.or5.map(x=>orRow('OR5',x.label,null,x.note)).join(''));
      if(or.summaryNotes) bits.push(orRow('OR','Summary notes',null,or.summaryNotes));
      if(bits.length) orHtml=`<div class="panel"><div class="panel-head"><h3>Observational record</h3></div><div class="diva-rep-table">${bits.join('')}</div></div>`;
    }
    // background: only recorded fields
    const bg=r.background||{};
    const bgKeys=Object.keys(bg);
    const bgHtml=bgKeys.length?`<div class="panel"><div class="panel-head"><h3>Background</h3></div><div class="diva-rep-table">${bgKeys.map(k=>{ const x=bg[k]; const v=[x.yn===true?'Yes':x.yn===false?'No':'', x.value, x.detail].filter(Boolean).join(' · '); return v?`<div class="diva-rep-row"><span class="diva-rep-label" style="grid-column:1/span 2">${esc(x.label)}</span><span class="diva-rep-c" style="grid-column:span 2;white-space:normal;text-align:right">${esc(v)}</span></div>`:''; }).filter(Boolean).join('')}</div></div>`:'';
    const inf=(r.collateral&&r.collateral.informant)||{};
    const q=r.qualifiers||{};
    const heroTxt = met
      ? `The DSM-5 criteria for autism spectrum disorder are met on this assessment${sevTxt?`, ${sevTxt.replace('requires','requiring')}`:''}. This is a clinician decision aid. Confirm against the full clinical picture, developmental history and observation.`
      : scd
        ? 'Criterion 1 (with onset and impairment) is met but Criterion 2 is not: the DASI-2 flags a Social Communication Disorder pattern for clinical consideration.'
        : 'The DSM-5 ASD criteria are not fully met on this assessment. The endorsements and unmet criteria are shown below; clinical judgement applies.';
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>${met?'ASD criteria met':(scd?'Social Communication Disorder pattern':'ASD criteria not met')}</h2>
        <p>${heroTxt}</p>
        <span class="band-pill ${met||scd?'band-high':'band-typical'}">${met?'Criteria met':(scd?'SCD pattern':'Criteria not met')}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Criterion category endorsements</h3></div>
        <div class="profile-table" style="--cols:minmax(200px,2fr) 130px minmax(140px,1fr)">
          <div class="ph"><span>Criterion 1 · social communication (all 3 required, ${r.c1Endorsed||0}/3)</span><span class="r"></span><span class="r"></span></div>
          ${[1,2,3].map(catRow).join('')}
          <div class="ph"><span>Criterion 2 · restricted, repetitive (≥2 of 4, ${r.c2Endorsed||0}/4)</span><span class="r"></span><span class="r"></span></div>
          ${[4,5,6,7].map(catRow).join('')}
        </div>
        <p class="panel-sub">A category is endorsed when at least one symptom is rated present or partially present with impairment and/or managed by significant compensation.</p>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Diagnosis</h3></div>
        <div class="diva-crit-grid">
          <div><span>A · Criterion 1: all 3 categories, across settings, not developmental delay</span>${yn(crit.A)}</div>
          <div><span>B · Criterion 2: ≥2 of 4 categories, across settings, not developmental delay</span>${yn(crit.B)}</div>
          <div><span>C · Symptoms present since early childhood</span>${yn(crit.C)}</div>
          <div><span>D · Clinically significant impairment</span>${yn(crit.D)}</div>
        </div>
        <p class="panel-sub">${met?'ASD: A, B, C and D all endorsed.':(scd?'Social Communication Disorder: A, C and D endorsed without B.':'ASD requires A, B, C and D; SCD requires A, C and D without B.')}${sevTxt?` Severity: ${esc(sevTxt)}.`:''}${r.intellectualImpairment==='yes'?' Intellectual impairment recorded: consider a comprehensive intellectual assessment.':''}${r.languageImpairment==='yes'?' Current language impairment recorded.':''}${r.nonverbal?' Assessed as non-verbal (item 1c and OR1-OR4 not applicable).':''}</p>
        ${r.finalNotes?`<p class="panel-sub"><b>Notes:</b> ${esc(r.finalNotes)}</p>`:''}
      </div>

      ${(inf.name)?`<div class="panel"><div class="panel-head"><h3>Informant present</h3></div><p class="panel-sub">${this.interviewInformantHtml(inf)}</p></div>`:''}

      ${(r.symptoms||[]).some(x=>x.rating!=null)?`<div class="panel">
        <div class="panel-head"><h3>Symptom ratings</h3></div>
        <div class="diva-rep-table">${symRows}</div>
        <p class="panel-sub">*Partial = partially present with impairment and/or managed by significant compensation (includes masking, camouflaging and scaffolding by others). Qualifiers recorded: Criterion 1 pervasive ${esc(q.perv1||'—')}, not dev-delay ${esc(q.dev1||'—')}; Criterion 2 pervasive ${esc(q.perv2||'—')}, not dev-delay ${esc(q.dev2||'—')}.</p>
      </div>`:''}

      ${coexRows?`<div class="panel"><div class="panel-head"><h3>Co-existing problems and disorders</h3></div><div class="diva-rep-table">${coexRows}</div><p class="panel-sub">Flags identify conditions needing further investigation; this section does not make a diagnosis.</p></div>`:''}

      ${orHtml}
      ${bgHtml}`;
  },

  /* ═══════════ ADI-R algorithm (DSM-5 + toddler forms, engine/adir.js) ═════ */
  resultsAdir(t, r){
    const esc=s=>this.esc(s);
    const isDsm5=(r.form==='dsm5');
    const inf=(r.collateral&&r.collateral.informant)||{};
    const ageTxt=(r.ageYears!=null||r.ageMonthsPart!=null)?`${r.ageYears||0}y ${r.ageMonthsPart||0}m`:'';
    // hero classification
    let heroH2, heroTxt, pill, pillCls;
    if(isDsm5){
      heroH2 = r.meetsCutoff ? 'Meets the ASD cut-off' : 'Below the ASD cut-off';
      heroTxt = `Social Communication + Restricted and Repetitive Behavior total of <b>${r.total}</b> against the revised (09/2025) ASD cut-off of <b>${r.cutoff}</b> on the ${esc(r.algorithmLabel)} algorithm.${r.adultApplied?' No adult algorithm has been developed; per the authors the young person/adolescent algorithm is applied to adults.':''}`;
      pill = r.meetsCutoff ? 'Meets cut-off' : 'Below cut-off';
      pillCls = r.meetsCutoff ? 'band-high' : 'band-typical';
    } else {
      heroH2 = esc(r.rangeOfConcern||r.classification||'Toddler algorithm');
      heroTxt = `Algorithm total of <b>${r.total}</b> on the ${esc(r.algorithmLabel)} algorithm. Research ASD cut-off ${r.researchCutoff}: <b>${r.meetsResearch?'met':'not met'}</b> · clinical ASD cut-off ${r.clinicalCutoff}: <b>${r.meetsClinical?'met':'not met'}</b>.`;
      pill = esc(r.rangeOfConcern||'');
      pillCls = r.meetsResearch ? 'band-high' : (r.meetsClinical ? 'band-elevated' : 'band-typical');
    }
    const missWarn = r.missing ? `<p class="panel-sub" style="color:var(--rose)"><b>${r.missing} algorithm item${r.missing===1?' was':'s were'} left uncoded</b> and scored 0 per the form rules; the total may understate. Edit the scoring to complete them.${isDsm5 && r.missing>=4 ? ' Lampinen et al. (2025) validated the DSM-5 algorithms only on interviews with 3 or fewer uncoded items (4 or more were excluded), so with this many missing the classification is outside the conditions it was tested under.' : ''}</p>` : '';
    // per-section tables (code → converted score)
    const secHtml=(r.sections||[]).map(sec=>{
      const rows=(sec.items||[]).map(x=>{
        const ref=`${x.item}-${x.type==='MA'?'MA':(x.type==='E'?'Ever':'Cur')}`;
        const code=(x.code==null)?'—':x.code;
        const sc=(x.score==null)?'—':x.score;
        return `<div class="diva-rep-row"><span class="diva-rep-code">${esc(ref)}</span><span class="diva-rep-label">${esc(x.typeLabel)}: ${esc(x.label)}</span><span class="diva-rep-c">code ${esc(String(code))}</span><span class="diva-rep-c">${x.code==null?'<span class="diva-abs">uncoded</span>':`score <b>${esc(String(sc))}</b>`}</span></div>`;
      }).join('');
      return `<div class="panel">
        <div class="panel-head"><h3>${esc(sec.label)}${sec.supplementary?' <span style="font-weight:400;font-size:12px;color:var(--ink-faint)">(supplementary, not part of the total)</span>':''}</h3></div>
        <div class="diva-rep-table">${rows}</div>
        <p class="panel-sub"><b>${esc(sec.label)} total: ${sec.total}</b>${sec.missing?` · ${sec.missing} uncoded`:''}</p>
      </div>`;
    }).join('');
    const cutPanel = isDsm5
      ? `<div class="diva-crit-grid">
          <div><span>Algorithm total (SC + RRB)</span><b>${r.total}</b></div>
          <div><span>ASD cut-off (revised 09/2025)</span><b>${r.cutoff}</b></div>
          <div><span>Classification</span>${r.meetsCutoff?'<span class="diva-met">Meets the ASD cut-off</span>':'<span class="diva-abs">Below the ASD cut-off</span>'}</div>
        </div>`
      : `<div class="diva-crit-grid">
          <div><span>Algorithm total</span><b>${r.total}</b></div>
          <div><span>Research ASD cut-off = ${r.researchCutoff}</span>${r.meetsResearch?'<span class="diva-met">Met</span>':'<span class="diva-abs">Not met</span>'}</div>
          <div><span>Clinical ASD cut-off = ${r.clinicalCutoff}</span>${r.meetsClinical?'<span class="diva-met">Met</span>':'<span class="diva-abs">Not met</span>'}</div>
          <div><span>Range of concern</span><b>${esc(r.rangeOfConcern||'')}</b></div>
        </div>`;
    const detailBits=[];
    if(ageTxt) detailBits.push(`Age at interview: ${esc(ageTxt)}`);
    if(r.item30!=null) detailBits.push(`Item 30 (Overall Level of Language): code ${esc(String(r.item30))}`);
    if(inf.name) detailBits.push(`Informant: ${this.interviewInformantHtml(inf,'paren')}`);
    if(r.clinician) detailBits.push(`Clinician: ${esc(r.clinician)}`);
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>${heroH2}</h2>
        <p>${heroTxt} An algorithm classification is a decision aid, not a diagnosis; the clinician integrates it with observation, developmental history and clinical judgement.</p>
        <span class="band-pill ${pillCls}">${pill}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>${esc(r.formLine||'Algorithm')}</h3></div>
        ${cutPanel}
        ${missWarn}
        <p class="panel-sub">${detailBits.join(' · ')}${detailBits.length?'. ':''}Scoring rule: protocol codes of 3 convert to 2; codes other than 0–3 score 0.</p>
        ${r.notes?`<p class="panel-sub"><b>Notes:</b> ${esc(r.notes)}</p>`:''}
      </div>

      ${secHtml}

      <div class="panel"><div class="panel-head"><h3>Source</h3></div><p class="panel-sub">${esc(r.citation||'')}. ADI-R © Western Psychological Services; scored by an ADI-R-trained clinician from a completed protocol (algorithm forms, 09/2025 revision).</p></div>`;
  },

  /* ═══════════ ADI-R interview record (engine/adirw.js) ═══════════════════════
     The clinician's own record of an administered ADI-R: item codes, notes and
     the booklet's free-text areas. Deliberately carries NO score, band or pill:
     there is no total and no cut-off here. Classification comes from the
     separate ADI-R algorithm scoring (resultsAdir). ── */
  resultsAdirw(t, r){
    const esc=s=>this.esc(s);
    const inf=(r.collateral&&r.collateral.informant)||{};
    const ageTxt=(r.ageYears!=null||r.ageMonthsPart!=null)?`${r.ageYears||0}y ${r.ageMonthsPart||0}m`:'';

    const blockHtml=b=>{
      if(b.t==='head') return `<div class="aiwr-sub">${esc(b.label)}</div>`;
      if(b.t==='text'){
        if(!b.value) return '';
        return `<div class="aiwr-item"><div class="aiwr-sub" style="margin:0 0 5px">${esc(b.label)}${b.page?` <span class="aiwr-p">p.${b.page}</span>`:''}</div><p class="aiwr-txt">${esc(b.value)}</p></div>`;
      }
      if(b.t==='table'){
        if(!(b.rows||[]).length) return '';
        const head=(b.cols||[]).map(c=>`<th>${esc(c)}</th>`).join('');
        const body=(b.rows||[]).map(row=>`<tr>${(b.cols||[]).map((c,i)=>`<td>${esc(row[i]||'')}</td>`).join('')}</tr>`).join('');
        return `<div class="aiwr-item"><div class="aiwr-sub" style="margin:0 0 5px">${esc(b.label)}${b.page?` <span class="aiwr-p">p.${b.page}</span>`:''}</div>
          <div class="aiwr-tw"><table class="aiwr-tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
      }
      if(b.t!=='item') return '';
      const cols=(b.cols||[]);
      // an "age in months" box holds either a month count or one of the item's
      // special codes (991+); labelling a special code as months would misread it
      const chipLabel=c=>c.special
        ? 'Special code'
        : esc(c.label)+(c.qual?` (${esc(c.qual)})`:'');
      const chips=cols.length
        ? `<div class="aiwr-cs">${cols.map(c=>c.code==null
            ? `<span class="aiwr-c none">${esc(c.label)}${c.qual?` (${esc(c.qual)})`:''}: not coded</span>`
            : `<span class="aiwr-c">${chipLabel(c)}: <b>${esc(String(c.code))}</b></span>`).join('')}</div>`
        : '<div class="aiwr-cs"><span class="aiwr-c none">no coding needed here</span></div>';
      return `<div class="aiwr-item">
        <div class="aiwr-it-h"><span class="aiwr-n">${b.n}</span><span class="aiwr-t">${esc(b.title)}</span><span class="aiwr-p">p.${b.page}</span></div>
        ${chips}
        ${b.note?`<p class="aiwr-note">${esc(b.note)}</p>`:''}
      </div>`;
    };

    // A record shows what was recorded. Items with no code and no note are
    // listed compactly at the end of their section instead of taking a card
    // each, so a part-finished interview reads as its content plus its gaps.
    const hasContent=b=>
      (b.t==='item' && ((b.cols||[]).some(c=>c.code!=null) || b.note)) ||
      (b.t==='text' && b.value) ||
      (b.t==='table' && (b.rows||[]).length);

    const secHtml=(r.sections||[]).map(sec=>{
      const blocks=(sec.blocks||[]);
      const kept=blocks.filter(b=>b.t==='head' || hasContent(b));
      // drop sub-headings that ended up with nothing under them
      const keptTrimmed=kept.filter((b,i)=>{
        if(b.t!=='head') return true;
        const rest=kept.slice(i+1);
        const nextHead=rest.findIndex(y=>y.t==='head');
        return (nextHead===-1?rest:rest.slice(0,nextHead)).some(hasContent);
      });
      const blank=blocks.filter(b=>b.t==='item' && !hasContent(b)).map(b=>b.n);

      if(!keptTrimmed.some(hasContent)){
        return `<div class="panel"><div class="panel-head"><h3>${esc(sec.label)}</h3></div>
          <p class="panel-sub"><span class="diva-abs">Nothing recorded in this section</span> · protocol pages ${esc(sec.pages)}${blank.length?` · items ${blank[0]} to ${blank[blank.length-1]} not coded`:''}</p></div>`;
      }
      let page=null;
      const body=keptTrimmed.map(b=>{
        let pre='';
        if(b.page && b.page!==page){ page=b.page; pre=`<div class="aiwr-page"><span class="lab">Protocol page ${b.page}</span><span class="rule"></span></div>`; }
        return pre+blockHtml(b);
      }).join('');
      return `<div class="panel">
        <div class="panel-head"><h3>${esc(sec.label)}</h3></div>
        <p class="panel-sub">Protocol pages ${esc(sec.pages)}${sec.codeBoxes?` · ${sec.coded} of ${sec.codeBoxes} code boxes entered`:''}</p>
        ${body}
        ${blank.length?`<p class="panel-sub"><span class="diva-abs">No code or note recorded for item${blank.length===1?'':'s'} ${blank.join(', ')}.</span></p>`:''}
      </div>`;
    }).join('');

    const detailBits=[];
    if(r.interviewDate) detailBits.push(`Administered: ${esc(this.fmtDate?this.fmtDate(r.interviewDate):r.interviewDate)}`);
    if(ageTxt) detailBits.push(`Age at interview: ${esc(ageTxt)}`);
    if(inf.name) detailBits.push(`Informant: ${this.interviewInformantHtml(inf,'paren')}`);
    else if(inf.relationship) detailBits.push(`Informant: ${esc(inf.relationship)}`);
    if(r.clinician) detailBits.push(`Clinician: ${esc(r.clinician)}`);

    const seedN=Object.keys((r.algoSeed&&r.algoSeed.codes)||{}).length;

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>ADI-R interview record</h2>
        <p>The clinician's record of an administered ADI-R: <b>${r.coded||0}</b> of <b>${r.codeBoxes||0}</b> code boxes entered, with notes. This is a record, not a score. There is no total and no cut-off here: the ADI-R classification comes from the separate algorithm scoring.</p>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Interview</h3></div>
        <div class="diva-crit-grid">
          <div><span>Code boxes entered</span><b>${r.coded||0} of ${r.codeBoxes||0}</b></div>
          <div><span>Protocol</span><b>${esc(r.protocol||'WPS Edition Interview Protocol')}</b></div>
          <div><span>Codes available to the algorithm</span><b>${seedN}</b></div>
        </div>
        ${detailBits.length?`<p class="panel-sub">${detailBits.join(' · ')}.</p>`:''}
        <p class="panel-sub">Current, Ever and Most-abnormal codes recorded here are the codes the ADI-R algorithm forms read, so the algorithm can be scored from this record without re-keying.</p>
      </div>

      ${secHtml}

      <div class="panel"><div class="panel-head"><h3>Source</h3></div><p class="panel-sub">${esc(r.citation||'Le Couteur A, Lord C, Rutter M (2003). The Autism Diagnostic Interview-Revised (ADI-R). Los Angeles: Western Psychological Services.')} ADI-R © Western Psychological Services; administered by an ADI-R-trained clinician from the WPS Edition Interview Protocol (W-382A). This record reproduces no interview questions, probes or coding descriptors.</p></div>`;
  },

  /* ═══════════ ADOS-2 Module 4 revised algorithm (engine/ados.js) ══════════ */
  resultsAdos(t, r){
    const esc=s=>this.esc(s);
    const ageTxt=(r.ageYears!=null||r.ageMonthsPart!=null)?`${r.ageYears||0}y ${r.ageMonthsPart||0}m`:'';
    const heroTxt=`Overall total of <b>${r.total}</b> (Social Affect ${r.saTotal} + Restricted and Repetitive Behaviour ${r.rrbTotal}) against the ASD cut-off of <b>${r.cutoff}</b> on the revised Module 4 algorithm (Hus &amp; Lord 2014; sensitivity 90.5%, specificity 82.2%). Calibrated severity score: <b>${r.severityScore} of 10</b>${r.severityInRange===false?' (calibrated for ages 9 to 39; this patient is outside that range, interpret with caution)':''}. An observation algorithm classification is a decision aid, not a diagnosis.`;
    const missWarn = r.missing ? `<p class="panel-sub" style="color:var(--rose)"><b>${r.missing} algorithm item${r.missing===1?' was':'s were'} left uncoded</b> and scored 0 per the algorithm rules; the total may understate. Edit the scoring to complete them.</p>` : '';
    const secHtml=(r.sections||[]).map(sec=>{
      const rows=(sec.items||[]).map(x=>{
        const code=(x.code==null)?'—':x.code;
        return `<div class="diva-rep-row"><span class="diva-rep-code">${esc(x.ref)}</span><span class="diva-rep-label">${esc(x.label)}</span><span class="diva-rep-c">rating ${esc(String(code))}</span><span class="diva-rep-c">${x.code==null?'<span class="diva-abs">uncoded</span>':`score <b>${esc(String(x.score))}</b>`}</span></div>`;
      }).join('');
      return `<div class="panel">
        <div class="panel-head"><h3>${esc(sec.label)}</h3></div>
        <div class="diva-rep-table">${rows}</div>
        <p class="panel-sub"><b>${esc(sec.label)} total: ${sec.total}</b>${sec.missing?` · ${sec.missing} uncoded`:''}</p>
      </div>`;
    }).join('');
    const detailBits=[];
    if(ageTxt) detailBits.push(`Age at assessment: ${esc(ageTxt)}`);
    if(r.clinician) detailBits.push(`Clinician: ${esc(r.clinician)}`);
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>${r.meetsCutoff?'Meets the ASD cut-off':'Below the ASD cut-off'}</h2>
        <p>${heroTxt}</p>
        <span class="band-pill ${r.meetsCutoff?'band-high':'band-typical'}">${r.meetsCutoff?'Meets cut-off':'Below cut-off'} · severity ${r.severityScore}/10</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>ADOS-2 Module 4 revised algorithm (Hus &amp; Lord 2014)</h3></div>
        <div class="diva-crit-grid">
          <div><span>Social Affect (SA) total</span><b>${r.saTotal}</b></div>
          <div><span>Restricted and Repetitive Behaviour (RRB) total</span><b>${r.rrbTotal}</b></div>
          <div><span>Overall total vs ASD cut-off = ${r.cutoff}</span>${r.meetsCutoff?'<span class="diva-met">Meets cut-off</span>':'<span class="diva-abs">Below cut-off</span>'}</div>
          <div><span>Calibrated severity score (ages 9–39)</span><b>${r.severityScore} / 10${r.severityInRange===false?' *':''}</b></div>
        </div>
        ${r.severityInRange===false?'<p class="panel-sub">* The calibrated severity score is calibrated for ages 9 to 39; this patient is outside that range, interpret with caution.</p>':''}
        ${missWarn}
        <p class="panel-sub">${detailBits.join(' · ')}${detailBits.length?'. ':''}Conversion rule: protocol ratings of 3 convert to 2; ratings other than 0–3 (7/8/9) score 0.</p>
      </div>

      ${r.observedBehaviours?`<div class="panel"><div class="panel-head"><h3>Observed behaviours</h3></div><p class="panel-sub" style="white-space:pre-wrap">${esc(r.observedBehaviours)}</p><p class="panel-sub">Per the ADOS-2 manual, findings are communicated through these descriptions alongside the classification; raw item and total scores stay within the clinical record.</p></div>`:''}

      ${secHtml}

      <div class="panel"><div class="panel-head"><h3>Source</h3></div><p class="panel-sub">${esc(r.citation||'')}. ADOS-2 © Western Psychological Services; scored by an ADOS-2-trained clinician from a completed Module 4 protocol (Compass Psychology scoring resource, Dec 2024).</p></div>`;
  },

  /* ═══════════ SPQ (Sensory Perception Quotient) + SPQ-35 short ═══════════ */
  resultsSPQ(t, r){
    const esc=s=>this.esc(s);
    const ON=t.origNorms||{}, RN=t.rsNorms;
    const SENSES=['touch','hearing','vision','smell','taste'];
    const SN={touch:'Touch',hearing:'Hearing',vision:'Vision',smell:'Smell',taste:'Taste'};
    // sex-matched original norms (2014 paper has male/female breakdowns + sex effects);
    // fall back to combined-sex when sex is unknown or a cell is a source erratum (null).
    const sexKey = (State.client && State.client.sex==='male') ? 'male' : (State.client && State.client.sex==='female') ? 'female' : 'both';
    const sexWord = sexKey==='male' ? 'male' : sexKey==='female' ? 'female' : 'combined-sex';
    const oN=(grp,key)=>{ const g=ON[grp]; if(!g) return null; const cell=g[sexKey]&&g[sexKey][key]; return (cell&&cell[0]!=null)?cell:(g.both&&g.both[key])||null; };
    const fmt=x=>x&&x[0]!=null?`${x[0]} (${x[1]})`:'—';
    // percentile rank within a group (original SPQ only — the 2014 distribution is
    // ~normal, KS p>.20); zToPercentile = % of the group scoring at/below the total.
    const ord=n=>{ n=Math.round(n); const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
    const pctileIn=arr=>{ if(!arr||arr[1]==null||arr[1]<=0||typeof zToPercentile!=='function') return null; return zToPercentile((r.total-arr[0])/arr[1]); };
    // Cohen's d between the two endpoint groups → "how much do the groups overlap"
    const dCalc=(a,b)=>{ if(!a||!b||a[1]==null||b[1]==null) return null; const p=Math.sqrt((a[1]*a[1]+b[1]*b[1])/2); return p>0?Math.abs(a[0]-b[0])/p:null; };
    const badgeFor=d=>{ if(d==null) return ''; const r2=d.toFixed(2);
      const b = d<0.2 ? {c:'none',x:`Groups overlap almost entirely (d≈${r2}). Position here is not informative`}
        : d<0.5 ? {c:'low',x:`Small separation, large overlap between groups (d≈${r2})`}
        : d<0.8 ? {c:'mod',x:`Medium separation (d≈${r2})`}
        : {c:'good',x:`Large separation (d≈${r2})`};
      return `<div class="spql-badge spql-badge-${b.c}">${b.x}</div>`; };
    // compact separation cell (Cohen's d) for the by-sense table
    const sepWord=d=> d==null?{c:'',x:'—'} : d<0.2?{c:'none',x:`negligible (${d.toFixed(2)})`} : d<0.5?{c:'low',x:`small (${d.toFixed(2)})`} : d<0.8?{c:'mod',x:`medium (${d.toFixed(2)})`} : {c:'good',x:`large (${d.toFixed(2)})`};
    // per-group lanes (box = ±1 SD, dot = mean); shared renderer, no cut-offs here
    const lanes=(max, groups, score, dir)=>this.groupLanes({max, groups, score, dir});
    const origMax=t.id==='spq35'?105:276, okey=t.id==='spq35'?'short':'full';
    const SENS_DIR=['more sensitive','less sensitive'];
    const G=(arr,color,label)=>({label,color,mean:arr?arr[0]:null,sd:arr?arr[1]:null});
    let html=`
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>${r.total} out of ${origMax}</h2>
        <p class="ss-sub"><b>Lower = more sensory sensitivity</b>. The SPQ runs opposite to most questionnaires. There is <b>no cut-off</b>; the score is shown only against study-sample averages, which overlap considerably.</p>
      </div></div>
      ${this.caveatLine(t)}
      <div class="panel"><div class="panel-head"><h3>${t.id==='spq35'?'SPQ short form: total':'Original SPQ: total'}</h3></div>
        ${lanes(origMax, [G(oN('asc',okey),'var(--rose)','Autistic'), G(oN('control',okey),'var(--green)','Non-autistic (control)')], r.total, SENS_DIR)}
        ${badgeFor(dCalc(oN('asc',okey), oN('control',okey)))}
        ${(()=>{ const pa=pctileIn(oN('asc',okey)), pc=pctileIn(oN('control',okey)); if(pa==null&&pc==null) return '';
          return `<p class="spq-pctile"><b>Percentile rank</b>: autistic sample ${pa!=null?'≈'+ord(pa)+' percentile':'—'}, comparison sample ${pc!=null?'≈'+ord(pc)+' percentile':'—'}.</p>
          <p class="panel-sub">Percentile = % of that ${sexWord} group scoring lower; because lower = more sensitive, a <b>lower</b> percentile reflects <b>greater</b> sensitivity relative to that group (the original SPQ distribution is approximately normal). Each group is a row (bar = ±1 SD, dot = mean); the line is this client, descriptives, not norms or cut-offs.</p>`; })()}
      </div>`;
    if(t.id==='spq'){
      let rows='';
      SENSES.forEach(k=>{ const sc=r.subscales[k]; if(!sc) return;
        const s=sepWord(dCalc(oN('asc',k), oN('control',k)));
        rows+=`<tr><td>${SN[k]}</td><td class="r">${sc.raw} / ${sc.max}</td><td class="r">${fmt(oN('asc',k))}</td><td class="r">${fmt(oN('control',k))}</td><td class="r"><span class="spq-sep spq-sep-${s.c}">${s.x}</span></td></tr>`;
      });
      html+=`<div class="panel"><div class="panel-head"><h3>By sense</h3></div>
        <table class="spq-subtab"><thead><tr><th>Sense</th><th class="r">This client</th><th class="r">Autistic (SD)</th><th class="r">Non-autistic (SD)</th><th class="r">Separation</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="panel-sub">Lower = more sensitive; ${sexWord} sample. "Separation" is Cohen's d between the two groups, worded by Cohen's (1988) conventions: 0.2 small, 0.5 medium, 0.8 large. Below 0.2 the groups overlap almost entirely and the score says little about group membership.</p></div>`;
    }
    if(r.hasRs && RN && sexKey==='male'){
      // revised scoring has a female-only reference sample → not interpretable for men
      html+=`<div class="panel"><div class="panel-head"><h3>Revised scoring (hyper- / hypo-sensitivity)</h3></div>
        <p class="panel-sub norm-warn">Not shown for this patient: the revised scoring's only reference sample is female (Taylor et al. 2020), so the hyper-/hypo-sensitivity scales can't be interpreted for male patients. The original SPQ above is the appropriate scoring here.</p></div>`;
    } else if(r.hasRs && RN){
      const ATYP_DIR=['less atypical','more atypical'];
      const rsScale=(scaleObj,normObj,max)=>{
        const chart=lanes(max, [G(normObj.ascF.total,'var(--rose)','Autistic women'), G(normObj.control.total,'var(--green)','Non-autistic women')], scaleObj.total, ATYP_DIR);
        const badge=badgeFor(dCalc(normObj.ascF.total, normObj.control.total));
        let tr='';
        SENSES.forEach(k=>{ const sd=scaleObj.sub[k]; if(!sd) return;
          tr+=`<tr><td>${SN[k]}</td><td class="r">${sd.raw} / ${sd.max}</td><td class="r">${fmt(normObj.ascF[k])}</td><td class="r">${fmt(normObj.control[k])}</td></tr>`; });
        return `${chart}${badge}<table class="spq-subtab"><thead><tr><th>Subdomain</th><th class="r">This client</th><th class="r">Autistic women (SD)</th><th class="r">Non-autistic women (SD)</th></tr></thead><tbody>${tr}</tbody></table>
          <p class="panel-sub" style="margin:10px 0 0">Subdomain group differences are small and overlap heavily. Read as supporting detail, not on their own.</p>`;
      };
      const rsNote = sexKey==='female'
        ? `<p class="panel-sub">Reference sample is female, <b>matched to this patient</b> (Taylor et al. 2020). Still descriptive only; no cut-off.</p>`
        : `<p class="panel-sub norm-warn">⚠ Female-only reference sample (verbal, clinically-diagnosed ASC; Taylor et al. 2020). Interpret with particular caution${sexKey==='male'?' for this patient (male)':''} and across the wider spectrum.</p>`;
      html+=`<div class="panel"><div class="panel-head"><h3>Revised scoring: Hypersensitivity</h3></div>
        ${rsScale(r.hyper, RN.hyper, r.hyper.max)}
        ${rsNote}</div>
        <div class="panel"><div class="panel-head"><h3>Revised scoring: Hyposensitivity</h3></div>
        ${rsScale(r.hypo, RN.hypo, r.hypo.max)}
        <p class="panel-sub">Higher = more atypical; same reference sample as above.</p></div>`;
    }
    if(ON.source) html+=`<p class="src-note">${esc(ON.source)}</p>`;
    if(r.hasRs && RN && RN.source) html+=`<p class="src-note">${esc(RN.source)}</p>`;
    return html;
  },

  /* ═══════════ SQ-A-2 (signposting autism, self-report) ═══════════ */
  resultsSQA2(t, r){
    const esc=s=>this.esc(s);
    const total=r.total||0, max=(t.scoring&&t.scoring.totalMax)||18;
    const rg=r.range, hasRange=!!(rg && rg.high!==rg.low);
    const lo=hasRange?rg.low:total, hi=hasRange?rg.high:total;
    const scoreStr=hasRange?`${lo}–${hi}`:`${total}`;
    const nm=t.norms||{}, aut=nm.autistic||{mean:7.7}, non=nm.nonAutistic||{mean:2.5};
    // NO band pill. The old rule coloured the hero red at or above the autistic
    // group MEAN — but a group mean is not a threshold (roughly half that
    // reference group sits below it), the SQ-A-2 has no validated cut-off by its
    // authors' own account, the per-item keying for items 15-18 is still
    // inferred (instrument is `unverified`), and this page already prints the
    // total as a RANGE because of that uncertainty. Colouring a score the page
    // cannot pin down exactly is not defensible. Position is stated in words.
    const posLabel = total>=aut.mean ? 'at or above the autistic group average'
      : total<=non.mean ? 'at or around the non-autistic group average'
      : 'between the two group averages';
    // two-lane layout: each group on its own row (mean ± 1 SD box + mean dot +
    // a thin line for the full range); one score line crosses both lanes.
    const fr=v=>Math.max(0,Math.min(1,v/max));
    const posL=v=>`calc(var(--lb) + ${fr(v).toFixed(4)} * (100% - var(--lb)))`;
    const spanW=(a,b)=>`calc(${(fr(b)-fr(a)).toFixed(4)} * (100% - var(--lb)))`;
    const rng=s=>{ const m=String(s==null?'':s).split(/[–-]/).map(x=>parseFloat(x)); return (m.length===2 && !isNaN(m[0]) && !isNaN(m[1]))?m:null; };
    const lane=(g,lbl,cls,topY)=>{
      const rr=rng(g.range);
      const wk=rr?`<div class="sqa2-wk" style="left:${posL(rr[0])};width:${spanW(rr[0],rr[1])}"></div><div class="sqa2-cap" style="left:${posL(rr[0])}"></div><div class="sqa2-cap" style="left:${posL(rr[1])}"></div>`:'';
      const box=g.sd!=null?`<div class="sqa2-box sqa2-box-${cls}" style="left:${posL(g.mean-g.sd)};width:${spanW(g.mean-g.sd,g.mean+g.sd)}"></div>`:'';
      return `<div class="sqa2-lane sqa2-${cls}" style="top:${topY}px">
          <span class="sqa2-llbl">${lbl}</span>
          ${wk}${box}
          <div class="sqa2-mn sqa2-mn-${cls}" style="left:${posL(g.mean)}"></div>
        </div>`;
    };
    let ticks=''; for(let v=0;v<=max;v+=3){ ticks+=`<span class="sqa2-tk" style="left:${posL(v)}">${v}</span>`; }
    const scale=`
      <div class="sqa2-wrap">
        <div class="sqa2-plot">
          ${hasRange?`<div class="sqa2-sband" style="left:${posL(lo)};width:${spanW(lo,hi)}"></div>`:''}
          ${lane(non,'Non-autistic','non',34)}
          ${lane(aut,'Autistic','aut',58)}
          <div class="sqa2-sline" style="left:${posL(total)}"></div>
          <div class="sqa2-slbl" style="left:${posL(total)}">${scoreStr}</div>
        </div>
        <div class="sqa2-axis"><div class="sqa2-axline" style="left:var(--lb)"></div>${ticks}</div>
        <div class="sqa2-dir"><span>fewer autistic features</span><span>more autistic features</span></div>
        <div class="sqa2-legend">
          <span><span class="sqa2-sw sqa2-sw-non"></span>Non-autistic: mean ${non.mean}${non.sd!=null?` (±${non.sd} SD)`:''}</span>
          <span><span class="sqa2-sw sqa2-sw-aut"></span>Autistic: mean ${aut.mean}${aut.sd!=null?` (±${aut.sd} SD)`:''}</span>
          <span><span class="sqa2-sw sqa2-sw-you"></span>This score (${scoreStr})</span>
        </div>
        <p class="sqa2-note">Each row is one group: the solid bar is ±1 SD around the mean (dot) and the thin line shows the full range. The groups overlap, so a score in the overlap is not, by itself, conclusive.${hasRange?` The score is shown as a range (${lo}–${hi}) because this person answered “Slightly” on one or more items whose Definitely/Slightly scoring rule is provisional; the true total is within ±1 point.`:''}</p>
      </div>`;
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${esc(t.fullName)}</div>
        <h2>${scoreStr} out of ${max}</h2>
        ${hasRange?`<p class="ss-sub">Best estimate ${total}, shown as a range because a few items have a provisional scoring rule (see below); the true total is within ±1 point.</p>`:''}
        <p>Higher scores reflect more autistic behaviours. This is a brief <b>signposting screen with no diagnostic cut-off</b>. The score is read against group averages: autistic adults averaged <b>${aut.mean}</b>${aut.sd?` (SD ${aut.sd})`:''} and non-autistic adults <b>${non.mean}</b>${non.sd?` (SD ${non.sd})`:''}, placing this total ${esc(posLabel)}. The two groups overlap, and a group average is not a threshold, so this is a position rather than a result.</p>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>How this compares</h3></div>
        ${scale}
        <p class="panel-sub">Autistic: mean ${aut.mean}${aut.sd?` (SD ${aut.sd})`:''}${aut.median!=null?`, median ${aut.median}`:''}${aut.range?`, range ${esc(aut.range)}`:''}. Non-autistic: mean ${non.mean}${non.sd?` (SD ${non.sd})`:''}${non.median!=null?`, median ${non.median}`:''}${non.range?`, range ${esc(non.range)}`:''}.</p>
        ${nm.source?`<p class="src-note">Norms: ${esc(nm.source)}</p>`:''}
      </div>`;
  },

  /* ═══════════ CATI RESULTS ═══════════ */
  resultsCati(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const total = r.total, max = t.scoring.totalMax;
    const thr = t.scoring.threshold, ci = t.scoring.thresholdCI || [];
    const atThr = total >= thr;
    const band = atThr ? 'band-high' : 'band-typical';

    const summary = atThr
      ? `A total of ${total} is at or above the suggested classification threshold of ${thr}${ci.length?` (95% CI ${ci[0]}–${ci[1]})`:''}, ~77% sensitivity, ~87% specificity in validation. This supports, but does not confirm, autism; scores near the threshold warrant particular caution.`
      : `A total of ${total} falls below the suggested classification threshold of ${thr}${ci.length?` (95% CI ${ci[0]}–${ci[1]})`:''}. The subscale profile below may still be informative.`;

    // CATI norms are matched by gender identity, not natal sex (English &
    // Maddox 2021). Select the comparison group from the recorded gender; fall
    // back to sex only when gender is blank, then to gender-diverse norms.
    const grp = this.catiNormGroup();
    const rows = [{name:'Total CATI', raw:total, max:max, key:'total', lead:true}];
    for(const key of Object.keys(t.subscales)){
      const s = r.subscales[key]; if(!s) continue;
      rows.push({name:s.name, raw:s.raw, max:t.subscales[key].max, key, sub:true});
    }
    this._cati = { rows, gender:grp.g, source:grp.source };

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2>${total} out of ${max}</h2>
        <p>${summary}</p>
        <span class="band-pill ${band}">${atThr?'At / above threshold':'Below threshold'}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div id="cati-profile">${this.catiProfilePanel()}</div>

      ${this.catiItemResponses(t, r)}`;
  },

  /* Item-by-item responses: every statement and the answer the person actually
     gave, grouped by domain, so the raw responses behind the totals are visible
     on the report. Reverse-scored items are flagged (a high rating there lowers
     the trait score). Uses r.per (raw option value 1–5, set by the cati scorer). */
  catiItemResponses(t, r){
    return this.likertItemResponses(t, r, {group:'domain', lowers:'trait score'});
  },
  /* The same panel for any 1–k Likert instrument whose scorer returns r.per
     (CATI, CAT-Q). `o.group` names the grouping ("domain" / "subscale") and
     `o.lowers` what a high rating on a reverse-scored item lowers. */
  likertItemResponses(t, r, o){
    const per = (r && r.per) || {};
    const rev = new Set(t.scoring.reversed || []);
    const opts = t.scoring.options, k = opts.length;
    const optLabel = v => { const x = (v!=null) && opts[v-1]; return x ? x.label : '—'; };
    const groups = Object.keys(t.subscales).map(key=>{
      const s = t.subscales[key];
      const head = `<div class="sdq-u-row sdq-u-lead"><span class="sdq-name">${this.esc(s.name)}</span><span class="sdq-score"></span><span class="sdq-pct"></span></div>`;
      const its = (s.items||[]).map(n=>{
        const it = t.items.find(x=>x.n===n); if(!it) return '';
        const val = per[n] ? per[n].raw : null;
        return `<div class="sdq-u-row sdq-u-sub">
          <span class="sdq-name">${it.n}. ${this.esc(it.text)}${rev.has(n)?' <span class="sdq-max">(reverse-scored)</span>':''}</span>
          <span class="sdq-score">${val==null?'—':val}<span class="sdq-max">/${k}</span></span>
          <span class="sdq-pct">${val==null?'<span class="sdq-pct-empty">—</span>':this.esc(optLabel(val))}</span>
        </div>`;
      }).join('');
      return head + its;
    }).join('');
    return `
      <div class="panel">
        <div class="panel-head"><h3>Item responses</h3><span class="card-tag tag-autism">${t.items.length} items</span></div>
        <p class="panel-sub">Every statement with the response given, grouped by ${o.group}. Rated 1 (${this.esc(opts[0].label)}) to ${k} (${this.esc(opts[k-1].label)}). Reverse-scored items are marked: a high rating there lowers the ${o.lowers}.</p>
        <div class="profile-table" style="--cols:minmax(200px,3fr) 56px minmax(120px,1.3fr)">
          <div class="ph"><span>Statement</span><span class="r">Score</span><span>Response</span></div>
          ${groups}
        </div>
      </div>`;
  },

  /* Shared per-item responses panel. Lists every item with the response the
     person actually gave, so the raw answers behind the totals are on the report.
     Two columns (item, response) so it stays correct across the different answer-
     storage conventions: optionSet items store the option VALUE, `mean` scales
     store the number, standard option rows store the index. Grouped by subscale
     when items carry one, otherwise a flat list. */
  itemResponsesPanel(t, r){
    const ans = (r && r.answers) || (typeof State!=='undefined' && State.answers) || {};
    const sc = t.scoring || {};
    const labelFor = it => {
      const a = ans[it.n];
      if(a==null) return null;
      // optionSet items — answer is the option's VALUE
      if(it.optionSet && sc.optionSets && sc.optionSets[it.optionSet]){
        const set = sc.optionSets[it.optionSet];
        const byV = set.find(o=>o && o.v===a);
        if(byV) return byV.label!=null?String(byV.label):String(a);
        if(typeof a==='number' && set[a]) return set[a].label!=null?String(set[a].label):String(a);
        return String(a);
      }
      // scale / mean — answer is the numeric rating itself
      if(sc.type==='mean' || !Array.isArray(sc.options)){
        return sc.scaleMax ? `${a} / ${sc.scaleMax}` : String(a);
      }
      // standard option rows — answer is the option index
      const opts = sc.options;
      if(typeof a==='number' && opts[a]) return opts[a].label!=null?String(opts[a].label):String(a);
      const byV = opts.find(o=>o && o.v===a);
      if(byV) return byV.label!=null?String(byV.label):String(a);
      return String(a);
    };
    const rowFor = it => {
      const l = labelFor(it);
      const dim = it.dim ? ` <span class="sdq-max">(${this.esc(String(it.dim))})</span>` : '';
      return `<div class="sdq-u-row sdq-u-sub">
        <span class="sdq-name">${it.n}. ${this.esc(String(it.text||('Item '+it.n)))}${dim}</span>
        <span class="sdq-pct">${l==null?'<span class="sdq-pct-empty">—</span>':this.esc(l)}</span>
      </div>`;
    };
    const items = t.items || [];
    const grouped = t.subscales && items.length && items.every(it=>it.subscale && t.subscales[it.subscale]);
    let rows;
    if(grouped){
      rows = Object.keys(t.subscales).map(key=>{
        const its = items.filter(it=>it.subscale===key);
        if(!its.length) return '';
        const head = `<div class="sdq-u-row sdq-u-lead"><span class="sdq-name">${this.esc(t.subscales[key].name||key)}</span><span class="sdq-pct"></span></div>`;
        return head + its.map(rowFor).join('');
      }).join('');
    } else {
      rows = items.map(rowFor).join('');
    }
    if(!rows) return '';
    return `
      <div class="panel">
        <div class="panel-head"><h3>Item responses</h3><span class="card-tag tag-mood">${items.length} item${items.length>1?'s':''}</span></div>
        <p class="panel-sub">Every item with the response given, for the full record behind the scores above.</p>
        <div class="profile-table" style="--cols:minmax(220px,3fr) minmax(120px,1.3fr)">
          <div class="ph"><span>Item</span><span>Response</span></div>
          ${rows}
        </div>
      </div>`;
  },

  /* Human-readable label for a stored gender value. */
  genderLabel(g){
    return {man:'Man / Boy', woman:'Woman / Girl', 'non-binary':'Non-binary', other:'Other / self-described'}[g]
      || (g ? g.charAt(0).toUpperCase()+g.slice(1) : '');
  },

  /* Map the recorded gender (falling back to natal sex) to one of the three
     CATI norm groups. Returns {g, source} where source ∈ gender|sex|default,
     used to caption how the comparison group was chosen. */
  catiNormGroup(){
    const gd = State.client.gender, sx0 = State.client.sex;
    // English et al. 2025 compare CISGENDER men and women; trans people are in
    // its gender-diverse group (Table 1 note), so a recorded gender that differs
    // from recorded natal sex maps there.
    if(gd==='man' && sx0==='female') return {g:'diverse', source:'trans'};
    if(gd==='woman' && sx0==='male') return {g:'diverse', source:'trans'};
    if(gd==='man') return {g:'man', source:'gender'};
    if(gd==='woman') return {g:'woman', source:'gender'};
    if(gd) return {g:'diverse', source:'gender'};   // non-binary / other
    const sx = State.client.sex;
    if(sx==='male') return {g:'man', source:'sex'};
    if(sx==='female') return {g:'woman', source:'sex'};
    return {g:'diverse', source:'default'};
  },

  /* the gender-matched profile panel. The comparison group is fixed by the
     recorded gender (see catiNormGroup); no on-report toggle. */
  catiProfilePanel(){
    const t = REGISTRY.cati;
    const ctx = this._cati || {rows:[], gender:'diverse', source:'default'};
    const g = ctx.gender || 'diverse';
    const gLabel = {man:'men', woman:'women', diverse:'gender-diverse people'}[g];
    const norms = (t.genderNorms || {})[g] || {};
    const conv = n => n ? {mean:n.m, sd:n.sd} : null;
    const zOf = (raw,n) => (n && n.sd>0) ? (raw-n.mean)/n.sd : null;
    const row = rw => {
      const c = conv(norms.non && norms.non[rw.key]);
      const a = conv(norms.aut && norms.aut[rw.key]);
      const toPct = v => Math.max(0, Math.min(100, (v/rw.max)*100));
      const cp = toPct(rw.raw);
      let bh = '';
      if(c){const lo=toPct(c.mean-c.sd),hi=toPct(c.mean+c.sd),m=toPct(c.mean);bh+=`<div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:var(--green)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--green)"></div>`;}
      if(a){const lo=toPct(a.mean-a.sd),hi=toPct(a.mean+a.sd),m=toPct(a.mean);bh+=`<div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:var(--rose-fill)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--rose-fill)"></div>`;}
      const zc = zOf(rw.raw, c), za = zOf(rw.raw, a);
      return `<div class="sdq-u-row${rw.lead?' sdq-u-lead':rw.sub?' sdq-u-sub':''}">
        <span class="sdq-name">${rw.name}</span>
        <span class="sdq-score">${rw.raw}<span class="sdq-max">/${rw.max}</span></span>
        <div class="sdq-track"><div class="norm-axis"></div>${bh}<div class="norm-marker" style="left:${cp}%"><div class="norm-marker-dot"></div></div></div>
        <span class="sdq-pct">${zc!=null?this.pctileCell(zc):'<span class="sdq-pct-empty">—</span>'}</span>
        <span class="sdq-pct">${za!=null?this.pctileCell(za):'<span class="sdq-pct-empty">—</span>'}</span>
      </div>`;
    };
    const gTag = {man:'Men',woman:'Women',diverse:'Gender-diverse'}[g];
    const tag = `<span class="card-tag tag-autism">${gTag}</span>`;
    const srcNote = ctx.source==='gender'
      ? 'matched to the recorded gender identity'
      : ctx.source==='trans'
        ? 'the gender-diverse group, because the recorded gender differs from natal sex and the study placed trans participants in that group (its men and women groups are cisgender)'
      : ctx.source==='sex'
        ? 'inferred from natal sex, as no gender identity was recorded. Set a gender on the profile to match a trans or non-binary client'
        : 'defaulting to the gender-diverse norms, as neither gender nor sex was recorded';
    // total: lanes chart (row per group, ±1 SD bar + mean dot, score line) with
    // the suggested classification threshold as a dashed notch
    const totRow = ctx.rows.find(rw=>rw.lead);
    let totalLanes = '';
    if(totRow){
      const c = conv(norms.non && norms.non.total), a = conv(norms.aut && norms.aut.total);
      const zc = zOf(totRow.raw, c), za = zOf(totRow.raw, a);
      const thr = t.scoring && t.scoring.threshold;
      if(c || a) totalLanes = this.groupLanes({
        max:totRow.max, score:totRow.raw,
        groups:[
          c ? {label:'Non-autistic', color:'var(--green)', mean:c.mean, sd:c.sd, right:zc!=null?this.pctileCell(zc):null} : null,
          a ? {label:'Autistic', color:'var(--rose)', mean:a.mean, sd:a.sd, right:za!=null?this.pctileCell(za):null} : null
        ].filter(Boolean),
        cuts: thr!=null ? [{score:thr, label:`threshold ${thr}`}] : [],
        dir:['fewer autistic traits','more autistic traits']
      });
    }
    return `
      <div class="panel">
        <div class="panel-head"><h3>CATI profile vs norms</h3>${tag}</div>
        <p class="panel-sub">Top: the total, one row per comparison group (bar = ±1 SD around the mean dot, vertical line = this client) with the suggested classification threshold as a dashed notch. Below: the six domains, where this client (●) falls relative to non-autistic (green) and autistic (red) ${this.esc(gLabel)}; the two right columns are the client's percentile within each group. CATI norms are matched by gender identity; this comparison is ${srcNote}.</p>
        ${totalLanes}
        <div class="profile-table" style="--cols:minmax(120px,1.2fr) 60px minmax(120px,2.3fr) 54px 54px;margin-top:14px">
          <div class="ph"><span>Domain</span><span class="r">Score</span><span class="col-opt">Non-autistic · Autistic</span><span class="r col-opt">vs Non</span><span class="r col-opt">vs Aut</span></div>
          ${ctx.rows.filter(rw=>rw.sub).map(row).join('')}
        </div>
        <div class="norm-legend" style="margin-top:12px;padding-top:12px">
          <div class="norm-legend-item"><span class="norm-legend-dot"></span>This client</div>
          <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--green);opacity:.5"></span>Non-autistic ±1 SD</div>
          <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--rose-fill);opacity:.5"></span>Autistic ±1 SD</div>
        </div>
        <p class="src-note">Norms: ${this.esc(t.normsSource)}</p>
      </div>`;
  },

  /* ═══════════ CAT-Q RESULTS ═══════════ */
  /* No published cut-off, so no band pill: the score is positioned against the
     gender-matched autistic and non-autistic groups of Hull et al. (2020) and
     that position is stated in words. Each group is drawn and read from its own
     score distribution (t.distributions: Gaussian mixtures traced from the
     paper's density figures, matched to Table 1), not a normal curve, so the
     ceiling-skewed autistic groups are read honestly. Percentiles for women and
     men only; the small non-binary groups (n=27, n=16) get SD distance. */
  _mixPdf(c, x){ let y = 0; for(const [w, m, s] of c) y += w*Math.exp(-0.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI)); return y; },
  _normCdf(z){   // A&S 26.2.17, unclamped (zToPercentile clamps to 0.1–99.9)
    const t = 1/(1+0.2316419*Math.abs(z)), d = 0.3989423*Math.exp(-z*z/2);
    const p = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
    return z>0 ? 1-p : p;
  },
  _mixCdf(c, x){ let p = 0; for(const [w, m, s] of c) p += w*this._normCdf((x-m)/s); return p; },
  /* the same, restricted to the possible scores lo–hi: the traced curves are
     smoothed and spill a little past each end, and nobody can score outside
     the scale, so that spill belongs to the end scores */
  _mixCdfIn(c, x, lo, hi){
    const a = this._mixCdf(c, lo - 0.5), b = this._mixCdf(c, hi + 0.5);
    return Math.max(0, Math.min(1, (this._mixCdf(c, x) - a) / (b - a)));
  },
  _mixQuantile(c, q, lo, hi){
    const f0 = this._mixCdf(c, lo - 0.5), f1 = this._mixCdf(c, hi + 0.5), target = f0 + q*(f1 - f0);
    let a = lo - (hi-lo), b = hi + (hi-lo);
    for(let i = 0; i < 60; i++){ const m = (a+b)/2; if(this._mixCdf(c, m) < target) a = m; else b = m; }
    return (a+b)/2;
  },
  /* percentile (0–100) as a table cell / a phrase, same hedging as pctileCell */
  _pCell(p){ return p>=99 ? '≥99th' : p<=1 ? '≤1st' : '≈'+this.ordinalPct(Math.round(p)); },
  _pPhrase(p){ return p>=99 ? 'at or above the 99th percentile' : p<=1 ? 'at or below the 1st percentile' : `about the ${this.ordinalPct(Math.round(p))} percentile`; },
  catqNormGroup(){
    const gd = State.client.gender;
    if(gd==='man') return {g:'man', source:'gender'};
    if(gd==='woman') return {g:'woman', source:'gender'};
    if(gd) return {g:'diverse', source:'gender'};   // non-binary / other
    const sx = State.client.sex;
    if(sx==='male') return {g:'man', source:'sex'};
    if(sx==='female') return {g:'woman', source:'sex'};
    return {g:null, source:'default'};
  },
  resultsCatq(t, r){
    const total = r.total, min = t.scoring.totalMin, max = t.scoring.totalMax;
    const grp = this.catqNormGroup();
    const norms = grp.g ? (t.genderNorms||{})[grp.g] : null;
    const small = !!norms && [norms.non, norms.aut].some(d => d && d.n < (t.smallGroupN||30));
    const gLabel = {man:'men', woman:'women', diverse:'non-binary people'}[grp.g] || '';
    const zOf = d => (d && d.total && d.total.sd>0) ? (total - d.total.m)/d.total.sd : null;
    const dist = grp.g ? ((t.distributions||{}).total||{})[grp.g] : null;
    let pos;
    if(!norms){
      pos = 'No gender or sex is recorded, so the score is not compared with a matched group; the chart shows the men’s and women’s groups for context.';
    } else if(small || !dist){
      pos = `Against ${gLabel} in Hull et al. (2020), this is ${this.sdPhrase(zOf(norms.non),'non-autistic')} and ${this.sdPhrase(zOf(norms.aut),'autistic')}. Those groups were small (n=${norms.non.n} and n=${norms.aut.n}), so no percentiles are given.`;
    } else {
      pos = `Against ${gLabel} in Hull et al. (2020), this is ${this._pPhrase(100*this._mixCdfIn(dist.non, total, min, max))} of the non-autistic group and ${this._pPhrase(100*this._mixCdfIn(dist.aut, total, min, max))} of the autistic group.`;
    }
    const incomplete = r.complete===false
      ? ` Only ${r.answered} of ${t.items.length} items were answered, so the totals are incomplete.` : '';
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2>${total} out of ${max}</h2>
        <p>Total camouflaging score (range ${min}–${max}; higher means more camouflaging). ${pos} The CAT-Q has no cut-off, so this describes a position, not a classification.${incomplete}</p>
      </div></div>

      ${this.caveatLine(t)}

      ${this.catqProfilePanel(t, r, grp, norms, small)}

      ${this.catqEndorsed(t, r)}

      ${this.likertItemResponses(t, r, {group:'subscale', lowers:'camouflaging score'})}`;
  },
  /* Interview prompts: the items answered at the camouflaging end of the scale
     (scored 7, then 6, after reverse-keying), as the CAT-Q authors suggest
     (Hannon et al. 2026). For a reverse-scored item that end is disagreement,
     so the actual response is shown beside each statement. */
  catqEndorsed(t, r){
    const per = (r && r.per) || {};
    const opts = t.scoring.options, top = opts.length;
    const hits = t.items.filter(it => per[it.n] && per[it.n].scored >= top-1)
      .sort((a,b) => (per[b.n].scored - per[a.n].scored) || (a.n - b.n));
    const row = it => {
      const p = per[it.n];
      return `<div class="sdq-u-row sdq-u-sub">
        <span class="sdq-name">${it.n}. ${this.esc(it.text)}${p.reversed?' <span class="sdq-max">(reverse-scored)</span>':''}</span>
        <span class="sdq-pct">${this.esc(t.subscales[it.subscale].name)}</span>
        <span class="sdq-pct">${this.esc(opts[p.raw-1].label)}</span>
      </div>`;
    };
    const body = hits.length
      ? `<div class="profile-table" style="--cols:minmax(220px,3fr) minmax(90px,1fr) minmax(110px,1.2fr)">
          <div class="ph"><span>Statement</span><span>Subscale</span><span>Response</span></div>
          ${hits.map(row).join('')}
        </div>`
      : `<p class="panel-sub" style="margin-bottom:0">No item was answered at the top two levels of the scale.</p>`;
    return `
      <div class="panel">
        <div class="panel-head"><h3>Most strongly endorsed items</h3><span class="card-tag tag-autism">${hits.length} of ${t.items.length}</span></div>
        <p class="panel-sub">Items answered at the camouflaging end of the scale (scored ${top} or ${top-1}), strongest first, as prompts for the developmental interview (Hannon et al. 2026). For reverse-scored items this means the person disagreed with the statement.</p>
        ${body}
      </div>`;
  },
  catqProfilePanel(t, r, grp, norms, small){
    const D = t.distributions || {};
    const who = {man:'men', woman:'women', diverse:'non-binary people'}[grp.g] || '';
    const tagTxt = {man:'Men', woman:'Women', diverse:'Non-binary'}[grp.g] || 'Not matched';
    const srcNote = grp.source==='gender'
      ? 'matched to the recorded gender identity'
      : grp.source==='sex'
        ? 'inferred from natal sex, as no gender identity was recorded. Set a gender on the profile to match a trans or non-binary client'
        : 'not matched, as neither gender nor sex was recorded';
    const readout = small ? 'distance from each group’s mean in SDs (the non-binary groups are too small for percentiles)'
                          : 'the client’s approximate percentile within each group';
    return `
      <div class="panel">
        <div class="panel-head"><h3>CAT-Q profile vs comparison groups</h3><span class="card-tag tag-autism">${tagTxt}</span></div>
        <p class="panel-sub">Total score: autistic ${who||'people'} above the line, non-autistic below, each curve the spread of scores in that group; the vertical line is this client${norms?' and the shaded part of each curve is the people who scored lower':''}. Each group overlaps the other, which is why the CAT-Q cannot say whether someone is autistic. Below: every scale as range strips (middle 80% light, middle 50% dark, median line)${norms?`; the right-hand columns are ${readout}`:''}. Groups are matched by gender identity, as in the source; this comparison is ${srcNote}.</p>
        ${this.catqMirror(t, r, grp, norms, small, D)}
        ${this.catqStrips(t, r, grp, norms, small, D)}
        <p class="src-note">Norms: ${this.esc(t.normsSource)}</p>
      </div>`;
  },
  /* Mirrored distributions of the total, the format of Hull et al. (2020)
     Figure 1: autistic group above the axis, non-autistic below, one shared
     density scale, client line through both. Matched client: the area of each
     curve below the client's score is shaded and counted. No gender recorded:
     women (solid) and men (dashed) in each half, no shading or counts. */
  catqMirror(t, r, grp, norms, small, D){
    const min = t.scoring.totalMin, max = t.scoring.totalMax, score = r.total;
    const dist = D.total || {};
    const W = 900, LB = 210, R = 880, HH = 92, yT = 24 + HH, yB = yT + 22, H = yB + HH + 26;
    const x = v => LB + (Math.max(min, Math.min(max, v)) - min) / (max - min) * (R - LB);
    const N = 240, xs = []; for(let i = 0; i <= N; i++) xs.push(min + (max - min) * i / N);
    const curves = [];   // {half:'aut'|'non', c, color, dash, shade}
    const COL = {aut:'var(--rose)', non:'var(--green)'};
    if(norms && dist[grp.g]){
      for(const half of ['aut', 'non']) curves.push({half, c:dist[grp.g][half], color:COL[half], dash:'', shade:true});
    } else {
      for(const half of ['aut', 'non']) for(const [g, dash] of [['woman', ''], ['man', '6 4']])
        if(dist[g]) curves.push({half, c:dist[g][half], color:COL[half], dash, shade:false});
    }
    let ymax = 0; const ys = curves.map(cv => xs.map(v => { const d = this._mixPdf(cv.c, v); ymax = Math.max(ymax, d); return d; }));
    const yOf = (half, d) => half==='aut' ? yT - d / ymax * HH : yB + d / ymax * HH;
    const base = half => half==='aut' ? yT : yB;
    let body = '';
    curves.forEach((cv, i) => {
      const pts = xs.map((v, j) => `${x(v).toFixed(1)},${yOf(cv.half, ys[i][j]).toFixed(1)}`);
      body += `<path d="M${x(min).toFixed(1)},${base(cv.half)}L${pts.join('L')}L${x(max).toFixed(1)},${base(cv.half)}Z" style="fill:${cv.color}" opacity="0.10"/>`;
      if(cv.shade){
        const k = xs.filter(v => v <= score).length;
        if(k > 1) body += `<path d="M${x(min).toFixed(1)},${base(cv.half)}L${pts.slice(0, k).join('L')}L${x(score).toFixed(1)},${yOf(cv.half, this._mixPdf(cv.c, score)).toFixed(1)}L${x(score).toFixed(1)},${base(cv.half)}Z" style="fill:${cv.color}" opacity="0.30"/>`;
      }
      body += `<path d="M${pts.join('L')}" fill="none" style="stroke:${cv.color}" stroke-width="2"${cv.dash?` stroke-dasharray="${cv.dash}"`:''}/>`;
    });
    body += `<line x1="${LB}" y1="${yT}" x2="${R}" y2="${yT}" class="spqsvg-axis"/><line x1="${LB}" y1="${yB}" x2="${R}" y2="${yB}" class="spqsvg-axis"/>`;
    // group labels, with the count below the client where matched
    const lbl = (half, yMid) => {
      const name = half==='aut' ? 'Autistic' : 'Non-autistic';
      let s = `<text x="${LB - 12}" y="${yMid}" text-anchor="end" class="spqsvg-lbl" style="fill:${COL[half]}">${name} ${this.esc(norms ? ({man:'men', woman:'women', diverse:'non-binary'}[grp.g]) : 'groups')}</text>`;
      if(norms){
        const d = norms[half];
        const line2 = small
          ? this.sdCell((score - d.total.m) / d.total.sd) + ' vs mean'
          : `${Math.round(100 * this._mixCdfIn(dist[grp.g][half], score, min, max))} in 100 score lower`;
        s += `<text x="${LB - 12}" y="${yMid + 16}" text-anchor="end" class="spqsvg-tk">n=${d.n} · ${this.esc(line2)}</text>`;
      }
      return s;
    };
    body += lbl('aut', yT - HH / 2) + lbl('non', yB + HH / 2);
    body += `<line x1="${x(score).toFixed(1)}" y1="14" x2="${x(score).toFixed(1)}" y2="${yB + HH}" style="stroke:var(--accent)" stroke-width="2"/>` +
      `<text x="${x(score).toFixed(1)}" y="10" text-anchor="middle" class="spqsvg-score">${score}</text>`;
    body += `<text x="${LB}" y="${H - 4}" class="spqsvg-dir">less camouflaging</text><text x="${R}" y="${H - 4}" text-anchor="end" class="spqsvg-dir">more camouflaging</text>`;
    for(let v = 25; v <= max; v += 25) body += `<text x="${x(v).toFixed(1)}" y="${yT + 15}" text-anchor="${v===min?'start':v===max?'end':'middle'}" class="spqsvg-tk" style="paint-order:stroke;stroke:var(--paper);stroke-width:4px">${v}</text>`;
    const legend = norms ? '' : `<div class="spql-legend"><span class="it"><span class="spql-sw" style="background:var(--ink-soft)"></span>solid line = women, dashed = men</span></div>`;
    return `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img" aria-label="Distribution of CAT-Q totals in each comparison group, with this client's score">${body}</svg>${legend}`;
  },
  /* Range strips for the total and each subscale, each row on its own scale:
     middle 80% (10th–90th) light, middle 50% dark, median line, per group, read
     from the traced distributions. Inline SVG so it survives printing. */
  catqStrips(t, r, grp, norms, small, D){
    const rows = [{key:'total', name:'Total', raw:r.total, min:t.scoring.totalMin, max:t.scoring.totalMax}]
      .concat(Object.keys(t.subscales).map(k => ({key:k, name:t.subscales[k].name, raw:(r.subscales[k]||{}).raw, min:t.subscales[k].min, max:t.subscales[k].max})));
    const W = 900, LB = 210, R = W - 170, C1 = W - 88, C2 = W - 4, rowH = 60, top = 30;
    const H = top + rows.length * rowH;
    const COL = {non:'var(--green)', aut:'var(--rose)'};
    let body = norms ? `<text x="${C1}" y="14" text-anchor="end" class="spqsvg-colhdr">vs non-autistic</text><text x="${C2}" y="14" text-anchor="end" class="spqsvg-colhdr">vs autistic</text>` : '';
    rows.forEach((rw, i) => {
      if(rw.raw == null) return;
      const y = top + i * rowH, x = v => LB + (Math.max(rw.min, Math.min(rw.max, v)) - rw.min) / (rw.max - rw.min) * (R - LB);
      body += `<text x="${LB - 12}" y="${y + 13}" text-anchor="end" class="spqsvg-lbl">${this.esc(rw.name)}</text>` +
              `<text x="${LB - 12}" y="${y + 29}" text-anchor="end" class="spqsvg-tk">${rw.raw} / ${rw.max}</text>`;
      body += `<line x1="${LB}" y1="${y + 36}" x2="${R}" y2="${y + 36}" class="spqsvg-axis"/>` +
              `<text x="${LB}" y="${y + 48}" class="spqsvg-tk">${rw.min}</text><text x="${R}" y="${y + 48}" text-anchor="end" class="spqsvg-tk">${rw.max}</text>`;
      const dg = norms && D[rw.key] ? D[rw.key][grp.g] : null;
      if(dg) [['non', y + 2], ['aut', y + 18]].forEach(([half, yy]) => {
        const c = dg[half], q = p => x(this._mixQuantile(c, p, rw.min, rw.max));
        body += `<rect x="${q(0.1).toFixed(1)}" y="${yy}" width="${(q(0.9) - q(0.1)).toFixed(1)}" height="12" rx="3" style="fill:${COL[half]}" opacity="0.22"/>` +
                `<rect x="${q(0.25).toFixed(1)}" y="${yy}" width="${(q(0.75) - q(0.25)).toFixed(1)}" height="12" rx="3" style="fill:${COL[half]}" opacity="0.55"/>` +
                `<line x1="${q(0.5).toFixed(1)}" y1="${yy - 1}" x2="${q(0.5).toFixed(1)}" y2="${yy + 13}" style="stroke:${COL[half]}" stroke-width="2.5"/>`;
        const d = norms[half][rw.key];
        const cell = small ? this.sdCell((rw.raw - d.m) / d.sd) : this._pCell(100 * this._mixCdfIn(c, rw.raw, rw.min, rw.max));
        body += `<text x="${half==='non' ? C1 : C2}" y="${y + 21}" text-anchor="end" class="spqsvg-pct">${this.esc(cell)}</text>`;
      });
      body += `<line x1="${x(rw.raw).toFixed(1)}" y1="${y - 4}" x2="${x(rw.raw).toFixed(1)}" y2="${y + 36}" style="stroke:var(--accent)" stroke-width="2"/>` +
              `<circle cx="${x(rw.raw).toFixed(1)}" cy="${y + 16}" r="4" style="fill:var(--accent)"/>`;
    });
    const legend = norms ? `<div class="spql-legend">
        <span class="it"><span class="spql-sw spql-sw-you"></span>This client</span>
        <span class="it"><span class="spql-sw" style="background:var(--green)"></span>Non-autistic ${this.esc(({man:'men', woman:'women', diverse:'non-binary'}[grp.g]))} (upper strip)</span>
        <span class="it"><span class="spql-sw" style="background:var(--rose)"></span>Autistic ${this.esc(({man:'men', woman:'women', diverse:'non-binary'}[grp.g]))} (lower strip)</span>
      </div>` : '';
    return `<svg class="spqsvg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMinYMin meet" role="img" aria-label="Range strips for each CAT-Q scale with this client's score" style="margin-top:18px">${body}</svg>${legend}`;
  },

  /* ═══════════ WHO ASSIST RESULTS ═══════════ */
  resultsAssist(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    if(!r || !r.anyUse){
      return `
        <div class="score-hero"><div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>No substance use reported</h2>
          <p>None of the ${t.substances.length} substance classes screened were reported as ever used, so no ASSIST risk scoring applies. Review alongside the wider clinical picture.</p>
          <span class="band-pill band-typical">No use reported</span>
        </div></div>

        ${this.caveatLine(t)}`;
    }

    const pillCls = k => k==='high'?'band-high':(k==='moderate'?'band-elevated':'band-typical');
    const fillCls = k => k==='high'?'fill-high':(k==='moderate'?'fill-elevated':'fill-typical');
    const riskLabel = k => k==='high'?'High risk':(k==='moderate'?'Moderate risk':'Lower risk');
    const max = t.scoring.ssiMax;
    const subs = r.substances || [];
    const highest = subs[0] || {risk:'low'};
    const counts = {high:0, moderate:0, low:0};
    subs.forEach(s=>counts[s.risk]++);

    const headline = counts.high
      ? `${counts.high} substance${counts.high>1?'s':''} at high risk`
      : (counts.moderate ? `${counts.moderate} substance${counts.moderate>1?'s':''} at moderate risk` : 'Lower-risk use only');
    const summary = `Ever used ${subs.length} substance${subs.length>1?'s':''}. `
      + (counts.high ? `${counts.high} reached the high-risk band (suggests likely dependence, assessment and referral indicated). ` : '')
      + (counts.moderate ? `${counts.moderate} reached the moderate-risk band (a brief intervention is indicated). ` : '')
      + (counts.low ? `${counts.low} fell in the lower-risk band. ` : '');

    const rows = subs.map(s=>{
      const sMax = s.max || max;
      const pct = Math.min(100, (s.score/sMax)*100);
      const modPct = (s.mod/sMax)*100, highPct = (s.high/sMax)*100;
      return `<div class="sdq-u-row">
        <span class="sdq-name">${this.esc(s.label)}<span class="sdq-note">bands: 0–${s.mod-1} lower · ${s.mod}–${s.high-1} moderate · ${s.high}+ high</span></span>
        <span class="sdq-score">${s.score}<span class="sdq-max">/${sMax}</span></span>
        <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${fillCls(s.risk)}" style="width:${pct.toFixed(0)}%"></span></div><div class="hsc-cut" style="left:${modPct}%" title="moderate ≥${s.mod}"></div><div class="hsc-cut" style="left:${highPct}%" title="high ≥${s.high}"></div></div>
        <span class="band-pill ${pillCls(s.risk)}">${riskLabel(s.risk)}</span>
      </div>`;
    }).join('');

    const actions = subs.map(s=>`<li><b>${this.esc(s.label)}, ${riskLabel(s.risk).toLowerCase()}:</b> ${this.esc(t.riskActions[s.risk])}</li>`).join('');

    // per-substance response detail, shows exactly which answers drove each score
    const setLabel = (setKey, v) => {
      if(v==null) return '<i>No answer</i>';
      const o = (t.scoring.optionSets[setKey]||[]).find(x=>x.v===v);
      return this.esc(o ? o.label : String(v));
    };
    const detailBlocks = subs.map(s=>{
      const sMax = s.max || max;
      // only the questions actually scored for this substance (tobacco omits Q5)
      const qrows = t.questions.filter(q => s.qv && (q.key in s.qv)).map(q=>{
        const v = s.qv ? s.qv[q.key] : null;
        const pts = (v==null?0:v);
        return `<div class="assist-qr${pts>0?' assist-qr-hit':''}">
          <span class="assist-qr-q">${this.esc(q.text.replace('{S}', s.label.toLowerCase()))}</span>
          <span class="assist-qr-a">${setLabel(q.set, v)}</span>
          <span class="assist-qr-p">${pts>0?'+'+pts:'0'}</span>
        </div>`;
      }).join('');
      return `<div class="assist-detail">
        <div class="assist-detail-head"><span class="assist-detail-name">${this.esc(s.label)}</span><span class="band-pill ${pillCls(s.risk)}">${riskLabel(s.risk)} · ${s.score}/${sMax}</span></div>
        <div class="assist-qr assist-qr-head"><span class="assist-qr-q">Question</span><span class="assist-qr-a">Response</span><span class="assist-qr-p">Points</span></div>
        ${qrows}
      </div>`;
    }).join('');

    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2 style="font-size:clamp(22px,2.4vw,28px)">${headline}</h2>
        <p>${summary}</p>
        <span class="band-pill ${pillCls(highest.risk)}">${riskLabel(highest.risk)} (highest)</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Per-substance involvement (SSI)</h3><span class="card-tag tag-substance">${subs.length} reported</span></div>
        <p class="panel-sub">Each substance ever used is scored 0–39 across six questions (tobacco 0–31 across five); Q3 to Q5 are asked only about use in the past 3 months. The two ticks mark the moderate and high-risk thresholds (alcohol uses a higher moderate threshold, 11, than other substances, 4).</p>
        <div class="profile-table" style="--cols:minmax(200px,1.7fr) 56px minmax(120px,2.1fr) 120px">
          <div class="ph"><span>Substance</span><span class="r">SSI</span><span class="col-opt">Score vs band cut-offs</span><span class="c">Risk</span></div>
          ${rows}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Responses behind each score</h3></div>
        <p class="panel-sub">The exact answer given to each question, with the points it contributed, so the basis for every risk band is visible. Points-scoring answers are highlighted.</p>
        ${detailBlocks}
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Suggested response by risk band</h3></div>
        <ul class="assist-actions">${actions}</ul>
      </div>`;
  },

  /* ═══════════ BAARS-IV RESULTS ═══════════ */
  resultsBAARS(t, r){
    const g = r.groups;
    const ina = g.current_inattention, hyp = g.current_hyperimpulsive, sct = g.sct;
    const cIna = g.child_inattention, cHyp = g.child_hyperimpulsive;
    const curTh = t.scoring.currentThreshold, chTh = t.scoring.childThreshold;
    const meets = r.meetsAny;
    const band = meets ? 'band-high' : 'band-typical';
    const headline = meets ? `ADHD screen positive, ${r.presentation.toLowerCase()}` : 'ADHD symptom criteria not met';
    const summary = meets
      ? `Symptom counts meet the DSM-5 threshold (inattention ${ina.count}/9, hyperactivity–impulsivity ${hyp.count}/9; need ≥${curTh} in a domain). ${r.childOnset ? 'The retrospective childhood ratings support onset of several symptoms before age 12.' : 'The retrospective childhood ratings do not reach the onset threshold, review developmental history directly.'}`
      : `Symptom counts do not reach the DSM-5 threshold (inattention ${ina.count}/9, hyperactivity–impulsivity ${hyp.count}/9; need ≥${curTh} in a domain). ADHD is not indicated on this informant’s symptom counts, interpret within the full clinical picture.`;

    // domain row with a count-vs-threshold bar + Meets/Not pill
    const crow = (s, th, posLbl, negLbl) => {
      const meet = s.count >= th;
      // no amber at (threshold - 2): a "nearly meets" step invented here, with
      // no basis in DSM-5 or the BAARS manual. The count and the tick already
      // show how close the person is.
      const cls = meet ? 'fill-high' : 'fill-typical';
      const pillCls = meet ? 'band-high' : 'band-typical';
      const pct = Math.min(100,(s.count/s.nItems)*100);
      const threshPct = (th/s.nItems)*100;
      return `
        <div class="sdq-u-row">
          <span class="sdq-name">${s.name}<span class="sdq-note">needs ≥${th} of ${s.nItems} rated Often / Very often</span></span>
          <span class="sdq-score">${s.count}<span class="sdq-max">/${s.nItems}</span></span>
          <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${cls}" style="width:${pct.toFixed(0)}%"></span></div><div class="hsc-cut" style="left:${threshPct}%" title="threshold ${th}"></div></div>
          <span class="band-pill ${pillCls}">${meet?posLbl:negLbl}</span>
        </div>`;
    };
    // SCT descriptive row (no cut-off): count + total frequency
    const sctRow = `
        <div class="sdq-u-row">
          <span class="sdq-name">${sct.name}<span class="sdq-note">descriptive only, not a DSM diagnosis</span></span>
          <span class="sdq-score">${sct.count}<span class="sdq-max">/${sct.nItems}</span></span>
          <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill fill-accent" style="width:${Math.min(100,(sct.count/sct.nItems)*100).toFixed(0)}%"></span></div></div>
          <span class="sdq-pct">${sct.total}/${sct.max}</span>
        </div>`;

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">BAARS-IV · ${t.respondent}</div>
          <h2 style="font-size:clamp(22px,2.4vw,28px)">${headline}</h2>
          <p>${summary}</p>
          <span class="band-pill ${band}">${r.presentation}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Current ADHD symptoms (DSM-5)</h3><span class="card-tag tag-adhd">Total ${r.total}/${r.totalMax} · threshold ≥${curTh}</span></div>
        <p class="panel-sub">A symptom counts when rated “Often / Very often”; the tick marks the DSM-5 adult cut-off (≥${curTh} of 9 in a domain).</p>
        <div class="profile-table" style="--cols:minmax(220px,1.6fr) 54px minmax(120px,2.1fr) 116px">
          <div class="ph"><span>Domain</span><span class="r">Symptoms</span><span class="col-opt">Count vs cut-off</span><span class="c">Result</span></div>
          ${crow(ina, curTh, 'Meets', 'Not met')}
          ${crow(hyp, curTh, 'Meets', 'Not met')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Childhood symptoms (retrospective), onset</h3><span class="card-tag ${r.childOnset?'tag-adhd':'tag-social'}">Onset before 12: ${r.childOnset?'supported':'not reached'}</span></div>
        <p class="panel-sub">DSM-5 requires several symptoms to have been present before age 12. These retrospective ratings support that criterion when a domain reaches ≥${chTh} of 9. They corroborate history; they do not replace it.</p>
        <div class="profile-table" style="--cols:minmax(220px,1.6fr) 54px minmax(120px,2.1fr) 116px">
          <div class="ph"><span>Domain (as a child)</span><span class="r">Symptoms</span><span class="col-opt">Count vs threshold</span><span class="c">Onset</span></div>
          ${crow(cIna, chTh, 'Supported', 'Not reached')}
          ${crow(cHyp, chTh, 'Supported', 'Not reached')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Sluggish Cognitive Tempo</h3><span class="card-tag tag-social">Descriptive</span></div>
        <p class="panel-sub">A separate dimension (excessive daydreaming, mental fogginess, underactivity). It is not a DSM diagnosis and does not feed the ADHD count, shown for description only, with no validated cut-off here.</p>
        <div class="profile-table" style="--cols:minmax(220px,1.6fr) 54px minmax(120px,2.4fr) 70px">
          <div class="ph"><span>Scale</span><span class="r">Symptoms</span><span class="col-opt">Symptom count</span><span class="r col-opt">Freq</span></div>
          ${sctRow}
        </div>
      </div>

    `;
  },

  /* ═══════════ ASRS v1.1 RESULTS ═══════════ */
  resultsASRS(t, r){
    const opts = t.scoring.options;
    const ans = r.answers || State.answers || {};   // robust for saved-submission views
    const th = t.scoring.partAThresholds;
    const paPos = r.partAPositive;
    const band = paPos ? 'band-high' : 'band-typical';
    const headline = paPos ? 'ADHD screen positive. Part A' : 'ADHD screen not met. Part A';
    const summary = paPos
      ? `${r.partACount} of 6 Part A items fell in the high-frequency range (a positive screen is ≥4). ${t.borrowedCutoff ? 'On this observer form the cut-off is borrowed from the self-report version, so treat this as indicative; it' : 'This indicates symptoms highly consistent with adult ADHD and'} warrants a fuller diagnostic assessment.`
      : `${r.partACount} of 6 Part A items fell in the high-frequency range; a positive screen needs ≥4. A negative screen makes adult ADHD less likely but does not exclude it, interpret alongside history and the wider assessment.`;

    // ---- Part A: six-item screener, each item with its response + shaded mark ----
    const paRows = t.scoring.partA.map(n=>{
      const item = t.items.find(i=>i.n===n);
      const v = ans[n];
      const shaded = v!=null && v>=th[n];
      const respLbl = v!=null ? opts[v].label : '—';
      const need = opts[th[n]].label;
      return `
        <div class="sdq-u-row">
          <span class="sdq-name">${n}. ${item.text}<span class="sdq-note">counts from “${need}”</span></span>
          <span class="asrs-resp ${shaded?'asrs-resp-on':''}">${respLbl}</span>
          <span class="asrs-mark ${shaded?'on':''}" title="${shaded?'counts toward screen':'does not count'}">${shaded?'●':'○'}</span>
        </div>`;
    }).join('');
    const paPct = Math.min(100,(r.partACount/6)*100);
    const threshPct = (4/6)*100;

    // ---- Adler 2018: 0–18 Symptom-Checklist total vs US general-population norms ----
    let adlerPanel = '';
    const an = t.adlerNorms;
    if(an){
    const cTotal = r.checklistTotal;
    const sexKey = State.client.sex==='male' ? 'male' : (State.client.sex==='female' ? 'female' : null);
    const refN = (sexKey && an.sex[sexKey]) ? an.sex[sexKey] : an.general;
    const refLabel = sexKey ? (sexKey==='male' ? 'US men' : 'US women') : 'US general population';
    const z = refN.sd>0 ? (cTotal - refN.mean)/refN.sd : 0;
    const zTxt = (z>=0?'+':'') + z.toFixed(1);
    // NO band pill on this row. The Adler community distribution is heavily
    // floor-bound (mean 2.0, SD 3.2, floor 0), which the
    // panel text below already states; z is not interpretable on it, so neither
    // is any band derived from z. The old rule went red at +2 SD, i.e. a raw
    // 8.4/18. The deviation itself is still reported, in SDs, as a magnitude.
    const devLabel = `${zTxt} SD from the community mean`;
    const toP = v => Math.max(0,Math.min(100,(v/18)*100));
    const lo=toP(Math.max(0,refN.mean-refN.sd)), hi=toP(refN.mean+refN.sd), m=toP(refN.mean), p2=toP(refN.mean+2*refN.sd);
    const normTrack = `<div class="norm-axis"></div><div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:var(--green)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--green)"></div><div class="hsc-cut" style="left:${p2}%" title="+2 SD"></div><div class="norm-marker" style="left:${toP(cTotal)}%"><div class="norm-marker-dot"></div></div>`;
    const totalRow = `
        <div class="sdq-u-row sdq-u-lead">
          <span class="sdq-name">Symptom-checklist total</span>
          <span class="sdq-score">${cTotal}<span class="sdq-max">/18</span></span>
          <div class="sdq-track">${normTrack}</div>
          <span class="sdq-pct">${devLabel}</span>
        </div>`;
    const subRow = (key, name) => {
      const c = r.checklistSub[key] || 0;
      const sym = c >= an.subtypeSymptomatic;
      // no amber at c>=4: that "two below the threshold" step was invented here,
      // not published. The DSM-IV count (>=6 of 9) is the only real boundary.
      const cls = sym ? 'fill-high' : 'fill-typical';
      const pct = Math.min(100,(c/9)*100), tPct=(an.subtypeSymptomatic/9)*100;
      return `
        <div class="sdq-u-row">
          <span class="sdq-name">${name}<span class="sdq-note">symptomatic at ≥${an.subtypeSymptomatic} of 9</span></span>
          <span class="sdq-score">${c}<span class="sdq-max">/9</span></span>
          <div class="sdq-track"><div class="vand-bar"><span class="vand-bar-fill ${cls}" style="width:${pct.toFixed(0)}%"></span></div><div class="hsc-cut" style="left:${tPct}%" title="symptomatic ≥${an.subtypeSymptomatic}"></div></div>
          <span class="band-pill ${sym?'band-high':'band-typical'}">${sym?'Symptomatic':'Below'}</span>
        </div>`;
    };
    const subtypeRows = subRow('inattention','Inattention') + subRow('hyperimpulsive','Hyperactivity / Impulsivity');
    adlerPanel = `
      <div class="panel">
        <div class="panel-head"><h3>Symptom burden vs US general population</h3><span class="card-tag tag-adhd">Total ${cTotal}/18 · ${refLabel} mean ${refN.mean}</span></div>
        <p class="panel-sub">The 0–18 Symptom-Checklist total (items 1, 2, 3, 9, 12, 16, 18 count from Sometimes; the other 11 from Often) against the ${refLabel} (mean ${refN.mean}, SD ${refN.sd}). Green band = community mean ±1 SD; tick = +2 SD. This score is about ${zTxt} SD from the community mean. Community scores bunch near 0 (the floor is less than one SD below the mean), so read this as deviation, not a precise percentile.</p>
        <div class="profile-table" style="--cols:minmax(150px,1.2fr) 58px minmax(140px,2.6fr) 150px">
          <div class="ph"><span>Measure</span><span class="r">Score</span><span class="col-opt">vs ${refLabel} (mean ${refN.mean})</span><span class="c">Deviation</span></div>
          ${totalRow}
          ${subtypeRows}
        </div>
        <p class="panel-sub" style="margin:10px 0 0;font-size:12.5px">Community norms (Adler 2018, N=22,397): general ${an.general.mean} (SD ${an.general.sd}); women ${an.sex.female.mean} / men ${an.sex.male.mean}; higher in younger adults (≈${an.age['18-29'].mean} at 18–29, falling to ≈${an.age['65+'].mean} at 65+). The deviation above uses the sex norms only, because Adler reports age figures for 18–29 and 65+ alone. The 0–72 frequency total for this client is ${r.total}.</p>
      </div>`;
    }

    // ---- ADHD vs non-ADHD symptom profile (Adler 2018 per-item norms) ----
    // Each group's TOTAL/subscale SD is derived from its per-item SDs and the
    // scale's internal consistency (Cronbach α): var = Σσ²ᵢ / (1 − α(k−1)/k).
    let profilePanel = '';
    if(t.itemNorms){
      const inA = t.itemNorms.adhd, inB = t.itemNorms.noAdhd, labels = t.itemNorms.labels || {};
      const alpha = t.itemNorms.alpha || 0.88;
      const groupStats = (norm, items) => {
        const k = items.length;
        const mean = items.reduce((s,n)=>s+(norm[n]?norm[n].m:0),0);
        const sumVar = items.reduce((s,n)=>s+(norm[n]?norm[n].sd*norm[n].sd:0),0);
        const denom = 1 - alpha*(k-1)/k;
        return {mean, sd: Math.sqrt(Math.max(0, denom>0 ? sumVar/denom : sumVar))};
      };
      // verdict by band membership: in both → Mixed; in/above ADHD → ADHD-like; in/below non-ADHD → non-ADHD-like
      const verdict = (v, B, A) => {
        const inB = v>=B.mean-B.sd && v<=B.mean+B.sd, inA = v>=A.mean-A.sd && v<=A.mean+A.sd;
        if(inA && inB) return {label:'Mixed', cls:'is-mix'};
        if(inA || v>A.mean) return {label:'ADHD-like', cls:'is-adhd'};
        if(inB || v<B.mean) return {label:'Non-ADHD-like', cls:'is-non'};
        return {label:'Mixed', cls:'is-mix'};
      };
      const vcell = vd => `<span class="asrs-closer ${vd.cls}">${vd.label}</span>`;
      const bandsHtml = (max, B, A) => {
        const toP=v=>Math.max(0,Math.min(100,(v/max)*100));
        const seg=(g,c)=>{const lo=toP(g.mean-g.sd),hi=toP(g.mean+g.sd),m=toP(g.mean);return `<div class="norm-group-band" style="left:${lo}%;width:${Math.max(0,hi-lo)}%;background:${c}"></div><div class="norm-group-mean" style="left:${m}%;background:${c}"></div>`;};
        return seg(B,'var(--green)')+seg(A,'var(--rose)');
      };
      const sumItems = items => items.reduce((s,n)=>s+(ans[n]||0),0);
      const allItems = t.items.map(it=>it.n), inatt = t.subscales.inattention.items, hyper = t.subscales.hyperimpulsive.items;
      const profRow = (name, raw, max, items, lead) => {
        const B=groupStats(inB,items), A=groupStats(inA,items), toP=v=>Math.max(0,Math.min(100,(v/max)*100));
        return `<div class="sdq-u-row${lead?' sdq-u-lead':''}">
          <span class="sdq-name">${name}</span>
          <span class="sdq-score">${raw}<span class="sdq-max">/${max}</span></span>
          <div class="sdq-track"><div class="norm-axis"></div>${bandsHtml(max,B,A)}<div class="norm-marker" style="left:${toP(raw)}%"><div class="norm-marker-dot"></div></div></div>
          <span class="sdq-pct">${vcell(verdict(raw,B,A))}</span>
        </div>`;
      };
      // per-item rows (real per-item SD bands) + headline tallies
      let nAdhd=0,nMix=0,nNon=0,answered=0;
      const itemRowsHtml = t.items.map(it=>{
        const v=ans[it.n], a=inA[it.n], b=inB[it.n];
        const Bs = b&&{mean:b.m,sd:b.sd}, As = a&&{mean:a.m,sd:a.sd};
        let vd=null;
        if(v!=null&&As&&Bs){ vd=verdict(v,Bs,As); answered++; if(vd.cls==='is-adhd')nAdhd++; else if(vd.cls==='is-non')nNon++; else nMix++; }
        const toP4=x=>Math.max(0,Math.min(100,(x/4)*100));
        const dot = v!=null?`<div class="norm-marker" style="left:${toP4(v)}%"><div class="norm-marker-dot"></div></div>`:'';
        return `<div class="sdq-u-row">
          <span class="sdq-name">${it.n}. ${this.esc(labels[it.n]||('Item '+it.n))}</span>
          <span class="sdq-score">${v!=null?v:'—'}<span class="sdq-max">/4</span></span>
          <div class="sdq-track"><div class="norm-axis"></div>${(As&&Bs)?bandsHtml(4,Bs,As):''}${dot}</div>
          <span class="sdq-pct">${vd?vcell(vd):'<span class="sdq-pct-empty">—</span>'}</span>
        </div>`;
      }).join('');
      const totalRaw = r.total!=null ? r.total : sumItems(allItems);
      profilePanel = `
      <div class="panel">
        <div class="panel-head"><h3>Symptom profile vs ADHD and non-ADHD adults</h3><span class="card-tag tag-adhd">${nAdhd}/${answered} items ADHD-like</span></div>
        <p class="panel-sub">Where this client (●) sits between the typical non-ADHD adult (green) and the typical adult with self-reported ADHD (red), on the raw 0–4 ratings (Adler et al. 2018; non-ADHD n=21,932, ADHD n=465). Each group's ±1 SD range is estimated from the published item SDs and the scale's internal consistency (Cronbach α≈0.88–0.89), since total-score SDs aren't published directly; a score inside both ranges reads as Mixed. Across the 18 items the ratings are ADHD-like on ${nAdhd}, mixed on ${nMix}, non-ADHD-like on ${nNon}. Descriptive pattern-matching to support the screen, not a diagnostic classifier (the ADHD group is self-reported).</p>
        <div class="profile-table" style="--cols:minmax(130px,1.3fr) 54px minmax(120px,2.4fr) 104px">
          <div class="ph"><span>Measure (raw)</span><span class="r">Score</span><span class="col-opt">non-ADHD · ADHD ±1 SD</span><span class="r col-opt">Profile</span></div>
          ${profRow('Total ASRS', totalRaw, 72, allItems, true)}
          ${profRow('Inattention', sumItems(inatt), inatt.length*4, inatt)}
          ${profRow('Hyperactivity / Impulsivity', sumItems(hyper), hyper.length*4, hyper)}
        </div>
        <details class="asrs-itemprof"><summary>Item-by-item profile (all 18)</summary>
          <div class="profile-table" style="--cols:minmax(130px,1.3fr) 44px minmax(120px,2.4fr) 104px;margin-top:10px">
            <div class="ph"><span>Item</span><span class="r">Resp</span><span class="col-opt">non-ADHD · ADHD ±1 SD</span><span class="r col-opt">Profile</span></div>
            ${itemRowsHtml}
          </div>
        </details>
        <div class="norm-legend" style="margin-top:12px;padding-top:12px"><div class="norm-legend-item"><span class="norm-legend-dot"></span>This client</div><div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--green);opacity:.5"></span>Non-ADHD ±1 SD</div><div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--rose-fill);opacity:.5"></span>ADHD ±1 SD</div></div>
        <p class="src-note">${this.esc(t.itemNorms.source)} Group ±1 SD ranges are estimated via Cronbach α (var(total)=Σσ²ᵢ/(1−α(k−1)/k), α=${alpha}). The α is the full 18-item scale’s, quoted by Adler from another sample; reusing it for the 9-item subscales probably makes those ranges somewhat too wide. Shown as ±1 SD ranges and categories, not precise percentiles, because the empirical score distribution isn't published. Any percentile would be a normal-curve model over this same SD.</p>
      </div>`;
    }

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">ASRS v1.1 · Part A screener</div>
          <h2 style="font-size:clamp(22px,2.4vw,28px)">${headline}</h2>
          <p>${summary}</p>
          <span class="band-pill ${band}">${headline}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>${t.borrowedCutoff ? 'Part A screener (cut-off from the self-report form)' : 'Part A, validated six-item screener'}</h3><span class="card-tag tag-adhd">${r.partACount}/6 · positive ≥4</span></div>
        <p class="panel-sub">Each item “counts” when answered at or above its shaded threshold (items 1–3 from Sometimes, items 4–6 from Often). Four or more counted items is a positive screen (Kessler et al. 2005).</p>
        <div class="profile-table" style="--cols:minmax(220px,1fr) 104px 34px">
          <div class="ph"><span>Part A item</span><span class="r">Response</span><span class="c">Counts</span></div>
          ${paRows}
        </div>
        <div class="sdq-track" style="height:auto;margin:14px 4px 0"><div class="vand-bar"><span class="vand-bar-fill ${paPos?'fill-high':'fill-typical'}" style="width:${paPct.toFixed(0)}%"></span></div><div class="hsc-cut" style="left:${threshPct}%" title="positive cut-off (4 of 6)"></div></div>
        <p class="panel-sub" style="margin:8px 0 0;font-size:12.5px">Counted items vs the positive cut-off (tick at 4 of 6).</p>
      </div>

      ${adlerPanel}

      ${profilePanel}

      <div class="panel">
        <div class="panel-head"><h3>About this result</h3></div>
        <p class="panel-sub" style="margin-bottom:0">Part A is the WHO-validated screener (sensitivity ${(t.screener.sensitivity*100).toFixed(1)}%, specificity ${(t.screener.specificity*100).toFixed(1)}%${t.borrowedCutoff?', figures from the self-report form; not validated for observer report':''}); Part B adds context but has no separate cut-off. Kessler et al. (2005) also calibrated cut-points for all 18 items (9 or more symptoms; frequency total 37 or more), but the six-item Part A outperformed them, so the total is shown descriptively.</p>
      </div>
    `;
  },

  /* ═══════════ ASRS SCREENER — ADOLESCENT RESULTS ═══════════ */
  resultsASRSTeen(t, r){
    const infoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    const cAge = State.client.dob ? this.calcAge(State.client.dob, State.client.date) : null;
    const elevated = r.partAPositive;
    const band = elevated ? 'band-high' : 'band-typical';
    const headline = elevated ? 'Elevated screen' : 'Below the screening cut-off';
    const summary = elevated
      ? `${r.partACount} of 6 screener items fell in the high-frequency range (an elevated screen is ≥4). In a young person this warrants a fuller ADHD assessment.`
      : `${r.partACount} of 6 screener items fell in the high-frequency range; an elevated screen needs ≥4. A negative screen makes ADHD less likely but does not exclude it.`;
    const th = t.scoring.partAThresholds, opt = t.scoring.options;
    const ans = r.answers || State.answers || {};
    const paRows = t.scoring.partA.map(n=>{
      const v = ans[n], counts = v!=null && v>=th[n];
      const lbl = (v!=null && opt[v]) ? opt[v].label : '—';
      const item = t.items.find(it=>it.n===n);
      return `<div class="sdq-u-row"><span class="sdq-name">${item?this.esc(item.text):('Item '+n)}</span><span class="sdq-score">${this.esc(lbl)}</span><span class="c">${counts?'✓':'·'}</span></div>`;
    }).join('');
    return `
      <div class="score-hero"><div class="score-summary" style="max-width:none">
        <div class="ss-label">${t.fullName}</div>
        <h2 style="font-size:clamp(22px,2.4vw,28px)">${headline}</h2>
        <p>${summary}</p>
        <span class="band-pill ${band}">${headline}</span>
      </div></div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Six-item screener</h3><span class="card-tag tag-adhd">${r.partACount}/6 · elevated ≥4</span></div>
        <p class="panel-sub">Each item counts when answered at or above its threshold (items 1–3 from Sometimes, items 4–6 from Often); four or more counted items is an elevated screen.</p>
        <div class="profile-table" style="--cols:minmax(220px,1fr) 104px 34px">
          <div class="ph"><span>Item</span><span class="r">Response</span><span class="c">Counts</span></div>
          ${paRows}
        </div>
      </div>

      ${this.asrsTeenPanel(t, r, cAge)}`;
  },

  /* Adolescent ASRS Screener norm bar (Green et al. 2019): the 6-item screener
     score (0–24) vs an age-matched US community sample. Distribution ≈ normal
     (skew 0.52) so the percentile is meaningful. Falls back to the overall 11–18
     sample if the age is unknown / out of range. */
  asrsTeenPanel(t, r, age){
    const an = t.adolescentNorms; if(!an) return '';
    const g = (age!=null && an.byAge[age]) ? an.byAge[age] : null;
    const norm = g || an.overall; if(!norm) return '';
    const ans = r.answers || State.answers || {};
    const max = an.screenerMax || 24;
    let pasum = 0; (t.scoring.partA || []).forEach(n=>{ const v = ans[n]; if(v != null) pasum += v; });
    const z = norm.sd>0 ? (pasum - norm.mean)/norm.sd : 0;
    // At 0 the normal curve would place part of the sample below the floor, so
    // the percentile is not meaningful there.
    const pct = pasum === 0 ? 'at floor' : this.pctileCell(z);
    const elevated = r.partAPositive;
    // the pill states the NATIVE screen outcome only (Green et al. 2019 define
    // the >=4-of-6 screen, not an SD band). The old `z>=1 → amber` fallback
    // added an app-invented second threshold on top of a validated one.
    const bandCls = elevated ? 'band-high' : 'band-typical';
    const who = g ? `age ${age}` : 'ages 11–18';
    const ctx = g
      ? `for this ${age}-year-old against a US community adolescent sample (Green et al. 2019; US grade ${g.grade} ≈ age ${age}, n=2,472)`
      : `against the overall US community adolescent sample (Green et al. 2019, ages 11–18, n=2,472)${age==null?'. Add a date of birth for an age-matched norm':''}`;
    const elevCtx = g ? `for context, ${g.elev}% of same-age peers screened elevated. ` : '';
    return `
      <div class="panel">
        <div class="panel-head"><h3>Adolescent screener norm${g?` (age ${age})`:''}</h3><span class="band-pill ${bandCls}">${elevated?'Elevated screen':'Below elevated cut-off'}</span></div>
        <p class="panel-sub">The 6-item ASRS Screener score (0–24) ${ctx}. The distribution is ≈ normal, so the percentile is meaningful here: this score is <b>${this.esc(this.refPositionWord(zToPercentile(z)) || 'unplaceable')}</b> for that sample. ${elevated?`Elevated screen: ≥4 of 6 items in the high-frequency range`:`Below the elevated cut-off (≥4 of 6 items)`}; ${elevCtx}The screen outcome, not the position, is the verdict here. The ASRS is an adult scale used off-label, with preliminary adolescent validity. Weight this with a youth-specific measure (e.g. Vanderbilt) and the clinical picture.</p>
        ${this.groupLanes({ max, score:pasum,
          groups:[{ label:`Community (${who})`, color:'var(--green)', mean:norm.mean, sd:norm.sd, right:pct }],
          dir:['fewer ADHD-consistent responses','more ADHD-consistent responses'] })}
        <p class="src-note">${this.esc(an.source)}</p>
      </div>`;
  },

  /* ═══════════ NICHQ VANDERBILT RESULTS ═══════════ */
  resultsVanderbilt(t, r){
    const screens = r.screens || [];
    const byKey = k => screens.find(s => s.key===k);
    const inatt = byKey('inattentive'), hyper = byKey('hyperactive');
    const iPos = !!(inatt && inatt.positive), hPos = !!(hyper && hyper.positive);
    const iMeet = !!(inatt && inatt.meetsCount), hMeet = !!(hyper && hyper.meetsCount);

    // ---- ADHD screen conclusion ----
    let adhdLabel, adhdBand, adhdText;
    if(iPos && hPos){ adhdLabel = 'ADHD screen positive, combined presentation'; adhdBand = 'band-high'; }
    else if(iPos){ adhdLabel = 'ADHD screen positive, predominantly inattentive'; adhdBand = 'band-high'; }
    else if(hPos){ adhdLabel = 'ADHD screen positive, predominantly hyperactive/impulsive'; adhdBand = 'band-high'; }
    else { adhdLabel = 'ADHD screen not met'; adhdBand = 'band-typical'; }

    if(iPos || hPos){
      adhdText = `Both the symptom-count and the performance-impairment criteria for an ADHD screen are met on this informant. A positive screen indicates further assessment is warranted.`;
    } else if((iMeet || hMeet) && !r.impairment){
      adhdText = `Symptom counts reach the threshold, but no performance area was rated 4–5, so the impairment criterion is not met on this informant. Symptoms without impairment do not meet ADHD screening criteria.`;
    } else {
      adhdText = `The symptom-count threshold for an ADHD screen is not reached on this informant.`;
    }

    // ---- per-screen blocks: header (name · count · result) + discrete count strip ----
    const impWord = r.impairment ? 'Yes' : 'No';
    const vrow = (s) => {
      const pillCls = s.positive ? 'band-high' : (s.meetsCount ? 'band-elevated' : 'band-typical');
      const lbl = s.positive ? 'Positive' : (s.meetsCount ? 'Symptoms only' : 'Not met');
      return `
        <div class="cs-block">
          <div class="cs-head"><span class="cs-name">${s.name}</span><span class="cs-score">${s.count} of ${s.nItems} counted · needs ≥${s.need}${s.requiresImpairment?' + impairment':''}</span><span class="band-pill ${pillCls}">${lbl}</span></div>
          ${this.countStrip({ n:s.nItems, count:s.count, need:s.need, met:s.meetsCount })}
        </div>`;
    };
    const screenRows = screens.map(vrow).join('');

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">NICHQ Vanderbilt · ${t.respondent}</div>
          <h2 style="font-size:clamp(22px,2.4vw,28px)">${adhdLabel}</h2>
          <p>${adhdText}</p>
          <span class="band-pill ${adhdBand}">${adhdLabel}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>Symptom &amp; behaviour screens</h3><span class="card-tag tag-adhd">Total ${r.total}/${r.totalMax} · impairment ${impWord}</span></div>
        <p class="panel-sub">Each dot is one symptom item; a filled dot was rated Often / Very often and counts towards the screen. The tinted zone is the screening range (the count needed). ADHD and the behaviour screens also require a performance area rated 4–5, impairment present: ${impWord} (${r.perfHits||0} performance area${(r.perfHits||0)===1?'':'s'} rated 4–5).</p>
        ${screenRows}
        <p class="panel-sub" style="margin-top:12px;margin-bottom:0">Total symptom score (0–${r.totalMax}, items 1–18) tracks severity over time, it is not a diagnostic cut-off. A positive screen suggests further evaluation; a negative screen does not exclude ADHD. Cross-setting agreement (home and school) and a clinical interview are essential.</p>
        <p class="src-note">Scoring per the official AAP/NICHQ scoring instructions (2002).</p>
      </div>
    `;
  },

  /* ═══════════ SNAP-IV 26 RESULTS ═══════════ */
  /* Three DSM subset SUMS (Inattention, Hyperactivity/Impulsivity, ODD), each
     mapped to a severity band with a suggested target tick. Mirrors the Vanderbilt
     visual (score-hero verdict + subset bars). The ADHD symptom total (items 1–18)
     is a tracking figure, not a diagnostic cut-off. */
  resultsSnap(t, r){
    const subs = r.subscales || {};
    const list = ['inattention','hyperactive','odd'].map(k=>subs[k]).filter(Boolean);
    const posNames = list.filter(s=>s.positive).map(s=>s.name);

    let label, band;
    if(r.adhdPositive){ label = 'One or more ADHD subsets at or above the suggested cut-off'; band = 'band-high'; }
    else if(r.oddPositive){ label = 'Oppositional subset at or above the suggested cut-off'; band = 'band-elevated'; }
    else { label = 'No subset above the suggested cut-off'; band = 'band-typical'; }
    const text = posNames.length
      ? `On this informant, ${posNames.length===1?'this subset reached':'these subsets reached'} or exceeded the suggested target: ${posNames.join(', ')}. A raised subset indicates further assessment is warranted; it is not diagnostic.`
      : `No subset reached its suggested target on this informant. A negative screen does not exclude ADHD; weight the developmental history and cross-setting information.`;

    const pillFor = b => b ? b.cls : 'band-neutral';
    // one severity track per subset: the published Swanson bands as named
    // zones; the suggested target coincides with the first band boundary,
    // so it is labelled on that boundary rather than drawn as a extra tick
    // Swanson's own tentative 5% cut-offs (item mean, informant-specific), shown
    // as a plain line beside the sum bands; they do not drive the colour.
    const sw = t.swanson5pct;
    // items 1-18 actually answered (a clinician edit can leave blanks); average over those
    // (older results saved without answers: use the subsets' own answered counts, as the subset lines do)
    const n18 = r.answers ? (Array.from({length:18},(_,i)=>i+1).filter(n=>r.answers[n]!=null).length || 18)
      : (((subs.inattention&&subs.inattention.answered)||0) + ((subs.hyperactive&&subs.hyperactive.answered)||0) || 18);
    const swLine = (key, raw, nItems) => {
      if(!sw || !key || sw[key]==null || !nItems) return '';
      // compare the 2-dp mean that is printed, so the words match the figures
      // (Swanson's cut-offs are themselves 2-dp, e.g. 1.78 = 16/9). Swanson's
      // sheet gives no direction; Bussing et al. 2008 describe these cut-offs as
      // scores ABOVE the 95th percentile, so the comparison is strict.
      const m = Math.round(raw / nItems * 100) / 100;
      return `<p class="panel-sub" style="margin:6px 0 0">Average per item ${m.toFixed(2)}; Swanson’s tentative 5% cut-off for ${sw.who} is ${sw[key].toFixed(2)}, so this is <b>${m > sw[key] ? 'above' : 'not above'}</b> it.</p>`;
    };
    const srow = (s) => {
      const cfg = (t.scoring.subsets || []).find(c => c.key && subs[c.key] === s);
      const zones = cfg ? this.sevZones(cfg.bands, cfg.max).map(z =>
        z.from === s.target ? { ...z, blabel: `${z.from} · target` } : z) : null;
      return `
        <div class="cs-block">
          <div class="cs-head"><span class="cs-name">${s.name}</span><span class="cs-score">${s.raw}/${s.max} · ${s.nItems} items · target ≥${s.target}</span><span class="band-pill ${pillFor(s.band)}">${s.band ? s.band.label : '—'}</span></div>
          ${zones ? this.severityTrack({ max:s.max, score:s.raw, zones }) : ''}
          ${swLine(cfg && cfg.key, s.raw, s.answered || s.nItems)}
        </div>`;
    };
    const rows = list.map(srow).join('');

    return `
      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">SNAP-IV 26 · ${t.respondent}</div>
          <h2 style="font-size:clamp(22px,2.4vw,28px)">${label}</h2>
          <p>${text}</p>
          <span class="band-pill ${band}">${label}</span>
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>SNAP-IV subset scores</h3><span class="card-tag tag-adhd">ADHD symptom total ${r.total}/${r.totalMax}</span></div>
        <p class="panel-sub">Each subset is the summed item rating (0–3 per item), shown against the published severity bands; the marker is this informant's score. The suggested target, at or above which symptoms are treated as clinically significant, is the first band boundary.</p>
        ${rows}
        <p class="panel-sub" style="margin-top:12px;margin-bottom:0">The ADHD symptom total (items 1–18, 0–54) tracks severity over time; it is not a diagnostic threshold. A positive screen suggests further evaluation; a negative screen does not exclude ADHD. Cross-setting agreement (home and school) and a clinical interview are essential.</p>
        ${sw && sw.combined!=null ? `<p class="panel-sub" style="margin-top:8px;margin-bottom:0">ADHD combined (items 1–18): average per item ${(Math.round(r.total/n18*100)/100).toFixed(2)}; Swanson’s tentative 5% cut-off for ${sw.who} is ${sw.combined.toFixed(2)}, so this is <b>${Math.round(r.total/n18*100)/100 > sw.combined ? 'above' : 'not above'}</b> it.</p>` : ''}
        <p class="src-note">Subset severity bands and targets per the SNAP-IV 26-item scoring guide (OHSU copy). ${sw ? `The per-item lines use ${this.esc(sw.source)} Swanson labels them tentative; they mark roughly the top 5% of ratings in his reference sample, separately for parents and teachers. The colour follows the sum bands.` : ''}</p>
      </div>
    `;
  },

  /* ═══════════ SDQ RESULTS ═══════════ */
  resultsSDQ(t, r){
    const bands = r.bands || {};
    const subs = r.subscales || {};
    const pillForBand = i => ['band-typical','band-elevated','band-elevated','band-high'][i] || 'band-neutral';
    const tb = bands.total || {i:0,label:''};

    // norms / percentiles by age band & sex
    const sex = (State.client.sex==='male'||State.client.sex==='female') ? State.client.sex : null;
    const sexWord = sex==='male' ? 'boys' : (sex==='female' ? 'girls' : null);
    const cAge = State.client.dob ? this.calcAge(State.client.dob, State.client.date) : null;
    const ageBand = (t.id==='sdq_self') ? '11-15' : ((cAge!=null && cAge<=10) ? '5-10' : '11-15');
    const N = (t.norms && sex && t.norms[sex]) ? (t.norms[sex][ageBand] || t.norms[sex]['11-15']) : null;
    const pctGroup = (typeof SDQ_PERCENTILES!=='undefined' && t.percentileKey && SDQ_PERCENTILES[t.percentileKey] && SDQ_PERCENTILES[t.percentileKey][sexWord])
      ? SDQ_PERCENTILES[t.percentileKey][sexWord][ageBand] : null;
    const ordinal = p => { const n=Math.round(p); if(n>=100) return '≥99th'; if(n<=0) return '≤1st'; const s=(n%10===1&&n%100!==11)?'st':(n%10===2&&n%100!==12)?'nd':(n%10===3&&n%100!==13)?'rd':'th'; return n+s; };
    const lookupPct = (key, raw) => { if(!key || !pctGroup || !pctGroup[key]) return null; const a=pctGroup[key]; return a[Math.min(raw, a.length-1)]; };
    const bandLabel = ageBand==='5-10' ? 'ages 5–10' : 'ages 11–15';
    const offBand = cAge!=null && (cAge<5 || cAge>15);   // 4, 16 and 17 have no band of their own

    // ONE unified row: name · score · normative track (mean±1SD band + ● marker) · percentile · band
    const urow = (key, name, max, raw, band, opts={}) => {
      if(!band || raw==null) return '';
      const toPct = v => Math.max(0,Math.min(100,(v/max)*100));
      const cp = toPct(raw);
      const n = (key && N && N[key]) ? N[key] : null;
      let bandHtml = '';
      if(n){ const lo=toPct(n.mean-n.sd), hi=toPct(n.mean+n.sd), m=toPct(n.mean);
        bandHtml = `<div class="norm-group-band" style="left:${lo}%;width:${hi-lo}%;background:var(--green)"></div><div class="norm-group-mean" style="left:${m}%;background:var(--green)"></div>`; }
      const pc = lookupPct(key, raw);
      const cls = `sdq-u-row${opts.lead?' sdq-u-lead':''}${opts.sub?' sdq-u-sub':''}`;
      return `
        <div class="${cls}">
          <span class="sdq-name">${name}${opts.note?`<span class="sdq-note">${opts.note}</span>`:''}</span>
          <span class="sdq-score">${raw}<span class="sdq-max">/${max}</span></span>
          <div class="sdq-track"><div class="norm-axis"></div>${bandHtml}<div class="norm-marker" style="left:${cp}%"><div class="norm-marker-dot"></div></div></div>
          <span class="sdq-pct">${pc!=null ? ordinal(pc) : '<span class="sdq-pct-empty">—</span>'}</span>
          <span class="band-pill ${pillForBand(band.i)}">${band.label}</span>
        </div>`;
    };

    const profile =
      urow('total','Total difficulties',40,r.total,tb,{lead:true}) +
      urow('emotional','Emotional',10,subs.emotional&&subs.emotional.raw,bands.emotional,{sub:true}) +
      urow('conduct','Conduct',10,subs.conduct&&subs.conduct.raw,bands.conduct,{sub:true}) +
      urow('hyperactivity','Hyperactivity',10,subs.hyperactivity&&subs.hyperactivity.raw,bands.hyperactivity,{sub:true}) +
      urow('peer','Peer problems',10,subs.peer&&subs.peer.raw,bands.peer,{sub:true}) +
      urow(null,'Internalising',20,r.internalising,bands.internalising,{note:' emo + peer'}) +
      urow(null,'Externalising',20,r.externalising,bands.externalising,{note:' con + hyp'}) +
      urow('prosocial','Prosocial',10,subs.prosocial&&subs.prosocial.raw,bands.prosocial,{note:' low = concern'});

    const legend = N ? `
      <div class="norm-legend" style="margin-top:12px;padding-top:12px">
        <div class="norm-legend-item"><span class="norm-legend-dot"></span>This child</div>
        <div class="norm-legend-item"><span class="norm-legend-swatch" style="background:var(--green);opacity:.5"></span>Community mean ±1 SD (${sex}, ${bandLabel})</div>
      </div>` : '';
    const headerTag = N
      ? `<span class="card-tag tag-behaviour">${sex.charAt(0).toUpperCase()+sex.slice(1)} · ${bandLabel}</span>`
      : `<span class="card-tag tag-behaviour">${t.respondent}</span>`;
    const subText = N
      ? `Score, the community comparison (green band = mean ±1 SD, ● = this child), percentile (% of community children scoring this or lower), and four-band category, per scale. Higher = more difficulty, except prosocial.${(cAge==null && t.id!=='sdq_self')?' Age unknown, using the 11–15 band; add a DOB for age-matched norms.':''}${offBand?` Age ${cAge} is outside the normed age bands, so the nearest band (${bandLabel}) is used.`:''}`
      : `Score, scale position (●), and four-band category. Add the child's sex and date of birth on the intake screen to show community percentiles and the mean comparison.`;

    return `
      <div class="panel">
        <div class="panel-head"><h3>SDQ profile</h3>${headerTag}</div>
        <p class="panel-sub">${subText}</p>
        <div class="profile-table">
          <div class="ph"><span>Scale</span><span class="r">Score</span><span class="col-opt">${N?'Score vs community':'Position'}</span><span class="r col-opt">%ile</span><span class="c">Band</span></div>
          ${profile}
        </div>
        ${legend}
        ${(r.notScoreable && r.notScoreable.length) ? `<p class="panel-sub" style="margin-top:10px"><b>Not scoreable:</b> ${r.notScoreable.map(k => this.esc((subs[k]&&subs[k].name)||k)).join(', ')} (fewer than 3 of its 5 items answered)${r.total==null ? '; Total difficulties' : ''}${r.internalising==null ? ', Internalising' : ''}${r.externalising==null ? ', Externalising' : ''}${(r.total==null||r.internalising==null||r.externalising==null) ? ' cannot be calculated because a component scale is missing' : ''}. Scales with 3 or 4 items answered are scaled up pro rata (SDQ scoring instructions).</p>` : ''}
        ${N?`<p class="src-note">${t.norms.source}</p>`:''}
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>About this result</h3></div>
        <p class="panel-sub" style="margin-bottom:0">A raised or high band suggests an area to explore, not a diagnosis; a typical result does not exclude difficulty. Internalising = emotional + peer; Externalising = conduct + hyperactivity (Goodman &amp; Goodman, 2009).</p>
      </div>
    `;
  },

  /* ═══════════ RCADS RESULTS ═══════════ */
  /* Norm comparison group for the RCADS T-score tables (boys / girls only).
     Mirrors the CATI approach: recorded gender identity first, natal sex as the
     fallback; null when neither maps (raw scores are still shown). */
  rcadsNormGroup(client){
    const c = client || State.client || {};
    const gd = c.gender;
    if(gd==='man') return {g:'boys', source:'gender'};
    if(gd==='woman') return {g:'girls', source:'gender'};
    const sx = c.sex;
    if(sx==='male') return {g:'boys', source:'sex'};
    if(sx==='female') return {g:'girls', source:'sex'};
    return null;
  },
  /* Demographics-explicit RCADS summary for the console / proforma, where the
     patient's dob+gender come from their profile (not State.client). Returns
     {level:'high'|'elevated'|'typical'|null, descriptor} using the Total
     Internalising T-score (T≥70 clinical, 65–69 borderline), or {level:null}
     when demographics or the total are unavailable (so callers degrade to raw).
     `client` = {dob, sex, gender, date}. */
  rcadsSignal(t, r, client){
    if(!r || !r.isRcads || !t || !t.scoring) return null;
    const grp = this.rcadsNormGroup(client);
    const age = (client && client.dob) ? this.calcAge(client.dob, client.date) : null;
    const band = this.rcadsGradeBand(age);
    if(!grp || !band || r.total==null) return {level:null, descriptor:null};
    const tot = this.rcadsT(t.scoring.normVersion, 'anxdep', grp.g, band, r.total);
    if(!tot) return {level:null, descriptor:null};
    const clinical = tot.rel==='>' || tot.t>=70;
    const borderline = !clinical && tot.t>=65;
    const level = clinical ? 'high' : borderline ? 'elevated' : 'typical';
    const tstr = (tot.rel==='>'?'>':'') + tot.t;
    const descriptor = `Internalising T ${tstr}` + (clinical?' (clinical)':borderline?' (borderline)':' (typical)');
    return {level, descriptor};
  },
  /* US school-grade band from age. Per the official RCADS scoring guidance
     (rcads.ucla.edu/Scoring): "To convert age in years to U.S. grade level,
     subtract 6." Grades below 3 use the grades 3–4 norms and above 12 the
     grades 11–12 norms, as UCLA's SPSS syntax does ("grade le 4", "grade ge 11");
     rcadsGradeNearest() says when that has happened. */
  rcadsGradeBand(age){
    if(age==null) return null;
    const grade = Math.max(3, Math.min(12, age - 6));
    return grade<=4?'3-4':grade<=6?'5-6':grade<=8?'7-8':grade<=10?'9-10':'11-12';
  },
  rcadsGradeNearest(age){
    return age!=null && (age - 6 < 3 || age - 6 > 12);
  },
  /* T at a non-integer raw (a prorated score with items missing): UCLA computes
     T from the unrounded prorated raw, so interpolate between the two table rows. */
  rcadsInterp(arr, raw, offset){
    const x = raw - (offset||0), lo = Math.floor(x), hi = Math.ceil(x);
    if(arr[lo]==null || arr[hi]==null) return null;
    return lo===hi ? arr[lo] : Math.round(arr[lo] + (x-lo)*(arr[hi]-arr[lo]));
  },
  /* raw → T from the official conversion tables. kind = subscale key or
     'anxiety' / 'anxdep'. Returns {t, rel} where rel '<'/'>' marks a raw below
     the table floor / above its ceiling (totals only), or null when unnormed. */
  rcadsT(version, kind, g, band, raw){
    if(typeof RCADS_TSCORES==='undefined' || !g || !band || raw==null) return null;
    const V = RCADS_TSCORES[version]; if(!V) return null;
    if(kind==='anxiety' || kind==='anxdep'){
      const arr = ((V.totals[g]||{})[band]||{})[kind]; if(!arr) return null;
      if(raw < RCADS_TOTALS_START) return {t:arr[0], rel:'<'};
      const i = raw - RCADS_TOTALS_START;
      if(i > arr.length-1) return {t:arr[arr.length-1], rel:'>'};
      const tv = this.rcadsInterp(arr, raw, RCADS_TOTALS_START);
      return tv==null ? null : {t:tv, rel:''};
    }
    const key = kind==='soc' ? 'sp' : kind;   // registry 'soc' = tables 'sp'
    const arr = ((V.subscales[g]||{})[band]||{})[key];
    const tv = arr ? this.rcadsInterp(arr, raw, 0) : null;
    return tv==null ? null : {t:tv, rel:''};
  },
  resultsRCADS(t, r){
    const subs = r.subscales || {};
    const version = t.scoring.normVersion;
    const grp = this.rcadsNormGroup();
    const cAge = State.client.dob ? this.calcAge(State.client.dob, State.client.date) : null;
    const band = this.rcadsGradeBand(cAge);
    const normed = !!(grp && band);

    // T → interpretation band (developer thresholds: 65 borderline, 70 clinical)
    const tBand = tv => tv==null ? null
      : tv.rel==='<' || (tv.rel==='' && tv.t<65) ? {label:'Typical range', cls:'band-typical'}
      : (tv.rel==='' && tv.t<70) ? {label:'Borderline', cls:'band-elevated'}
      : {label:'Clinical range', cls:'band-high'};
    const tText = tv => tv==null ? '—' : (tv.rel? tv.rel+' ':'')+tv.t;
    // No per-scale percentile (Ryan, 2026-10-01): the school-sample scales pile up
    // at 0, so a normal-curve percentile from T misleads; only the developer's
    // T65 ~ top 7% / T70 ~ top 2% framing is kept, in the summary and footnote.
    const nearest = this.rcadsGradeNearest(cAge);

    // one row: scale · raw · T track (axis T30–90, amber 65–70, rose 70+) · T · band
    const T_LO = 30, T_HI = 90;
    const toP = v => Math.max(0, Math.min(100, ((v-T_LO)/(T_HI-T_LO))*100));
    const p65 = toP(65), p70 = toP(70);
    const row = (kind, name, raw, max, opts={}) => {
      if(raw==null) return '';
      const tv = normed ? this.rcadsT(version, kind, grp.g, band, opts.exact!=null ? opts.exact : raw) : null;
      const b = tBand(tv);
      const track = tv
        ? `<div class="sdq-track"><div class="norm-axis"></div>
             <div class="norm-group-band" style="left:${p65}%;width:${p70-p65}%;background:var(--amber)"></div>
             <div class="norm-group-band" style="left:${p70}%;width:${100-p70}%;background:var(--rose-fill)"></div>
             <div class="norm-marker" style="left:${toP(tv.t)}%"><div class="norm-marker-dot"></div></div>
           </div>`
        : `<div class="sdq-track"><div class="norm-axis"></div><div class="norm-marker" style="left:${Math.max(0,Math.min(100,(raw/max)*100))}%"><div class="norm-marker-dot"></div></div></div>`;
      return `
        <div class="sdq-u-row${opts.lead?' sdq-u-lead':''}${opts.sub?' sdq-u-sub':''}">
          <span class="sdq-name">${name}${opts.note?`<span class="sdq-note">${opts.note}</span>`:''}</span>
          <span class="sdq-score">${raw}<span class="sdq-max">/${max}</span></span>
          ${track}
          <span class="sdq-pct">${tText(tv)}</span>
          ${b?`<span class="band-pill ${b.cls}">${b.label}</span>`:'<span class="sdq-pct-empty">—</span>'}
        </div>`;
    };

    const tots = r.totals || {};
    const profile =
      row('anxdep', 'Total Internalising', r.total, 141, {lead:true, note:' all 47 items', exact:tots.internalising&&tots.internalising.exact}) +
      row('anxiety','Total Anxiety', r.totalAnxiety, 111, {lead:true, note:' 37 anxiety items', exact:tots.anxiety&&tots.anxiety.exact}) +
      ['sad','soc','gad','pd','ocd','mdd'].map(k => row(k, subs[k]?subs[k].name:'', subs[k]&&subs[k].raw, subs[k]&&subs[k].max, {sub:true, exact:subs[k]&&subs[k].exact})).join('');

    // headline: Total Internalising T (or raw when unnormed)
    const heroExact = tots.internalising && tots.internalising.exact;
    const heroT = normed ? this.rcadsT(version, 'anxdep', grp.g, band, heroExact!=null ? heroExact : r.total) : null;
    const heroB = tBand(heroT);
    const who = version==='parent' ? 'the young person' : 'this young person';
    const summary = r.total==null
      ? `Too many items are missing to score the Total Internalising scale (more than 12 blank overall, or a subscale with more than 2 blank). Complete the missing items to produce a total. Any subscales with 2 or fewer missing items are still shown below.`
      : heroT
      ? `Total Internalising raw score ${r.total} of 141, T-score ${tText(heroT)}, against ${grp.g} in the ${band.replace('-',' & ')} grade band${nearest?' (the nearest normed band)':''}. ${heroT.t>=70||heroT.rel==='>' ? 'This is at or above the clinical threshold (T 70, roughly the top 2% of un-referred young people).' : heroT.t>=65 ? 'This is in the borderline range (T 65–69, roughly the top 7% of un-referred young people).' : 'This is within the typical range for age and gender.'} Subscale T-scores below show where any elevation sits.`
      : `Total Internalising raw score ${r.total} of 141 (Total Anxiety ${r.totalAnxiety} of 111). ${(!grp)?'Record the young person’s gender (or sex) on the intake screen':'Add a date of birth'} to convert raw scores to age- and gender-normed T-scores.`;

    // item 37 (thoughts about death) safety surface, mirrored from PHQ-9 item 9
    let safety = '';
    if(r.flag && r.flag.positive){
      const said = version==='parent' ? `The parent/carer answered “${r.flag.label}” to “My child thinks about death”` : `${who.charAt(0).toUpperCase()+who.slice(1)} answered “${r.flag.label}” to “I think about death”`;
      safety = `<div class="caveat" style="background:var(--rose-wash);border-color:var(--c-eccdd0)">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="cv-body"><b style="color:var(--rose)">Item 37 endorsed. Review for safety.</b> ${said}. Thoughts about death should be explored directly with the young person and a risk assessment considered, regardless of scale scores.</div></div>`;
    }

    const headerTag = normed
      ? `<span class="card-tag tag-mood">${grp.g.charAt(0).toUpperCase()+grp.g.slice(1)} · grades ${band.replace('-',' & ')}${grp.source==='sex'?' · via recorded sex':''}</span>`
      : `<span class="card-tag tag-mood">${t.respondent}</span>`;
    const subText = normed
      ? `Raw score, T-score position (amber = borderline T 65–69, red = clinical T ≥ 70, ● = ${who}), T-score, and range, per scale. Norms are matched on gender${grp.source==='sex'?' (from recorded sex, no gender identity on file)':''} and US school-grade band, derived from age per the official RCADS scoring guidance (grade = age − 6)${cAge!=null?`; age ${cAge} → grades ${band.replace('-',' & ')}${nearest?', the nearest normed band (the norms cover grades 3 to 12, ages 9 to 18), as UCLA’s scoring syntax does':''}`:''}.`
      : `Raw scores only: ${(!grp)?'no gender or sex is recorded for this profile':'no date of birth is recorded'}, so the gender- and grade-matched T-scores can’t be looked up yet.`;

    return `
      ${safety}

      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${heroT ? 'T-score '+tText(heroT) : (r.total==null ? 'Not scoreable' : r.total+' out of 141')}</h2>
          <p>${summary}</p>
          ${heroB?`<span class="band-pill ${heroB.cls}">${heroB.label}</span>`:''}
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>RCADS profile</h3>${headerTag}</div>
        <p class="panel-sub">${subText}</p>
        <div class="profile-table" style="--cols:minmax(140px,1.4fr) 48px minmax(120px,2fr) 42px 104px">
          <div class="ph"><span>Scale</span><span class="r">Raw</span><span class="col-opt">${normed?'T-score scale 30–90 · amber 65 · red 70':'Position'}</span><span class="r col-opt">T</span><span class="c">Range</span></div>
          ${profile}
        </div>
        ${normed?`<p class="src-note">T-scores from the official RCADS conversion tables (rcads.ucla.edu; ${version==='parent'?'parent norms Ebesutani et al. 2011':'Chorpita et al. 2000'}). Totals below raw 13 fall under the table floor and are shown as “&lt; T”. No per-scale percentile is given: in the school samples many scales pile up at 0, so a percentile read off a normal curve would mislead. The developer describes T 65 and T 70 as roughly the top 7% and top 2% of un-referred young people.</p>`:''}
      </div>

      <div class="panel">
        <div class="panel-head"><h3>About this result</h3></div>
        <p class="panel-sub" style="margin-bottom:0">Subscales: separation anxiety, social phobia, generalised anxiety, panic, obsessive-compulsive, and depression (low mood). Total Anxiety sums the five anxiety subscales; Total Internalising adds depression. A borderline or clinical T-score flags an area to assess further, not a diagnosis, and a typical score does not exclude difficulty${version==='parent'?'; where parent and self-report disagree, explore both accounts':''}.</p>
      </div>
    `;
  },

  /* ═══════════ RCADS-25 RESULTS ═══════════ */
  /* raw → T from the RCADS-25 tables. scale ∈ 'dep'|'anx'|'anxdep'. Tables span
     the full raw range from 0, so there is no floor/ceiling. Returns {t, rel:''}
     or null when unnormed / out of range. */
  rcads25T(version, scale, g, band, raw){
    if(typeof RCADS25_TSCORES==='undefined' || !g || !band || raw==null) return null;
    const arr = (((RCADS25_TSCORES[version]||{})[g]||{})[band]||{})[scale];
    const tv = arr ? this.rcadsInterp(arr, raw, 0) : null;
    return tv==null ? null : {t:tv, rel:''};
  },
  /* console/proforma band for RCADS-25 (mirrors rcadsSignal): Total Anxiety &
     Depression T from explicit demographics. {level, descriptor} or {level:null}. */
  rcads25Signal(t, r, client){
    if(!r || !r.isRcads25 || !t || !t.scoring) return null;
    const grp = this.rcadsNormGroup(client);
    const age = (client && client.dob) ? this.calcAge(client.dob, client.date) : null;
    const band = this.rcadsGradeBand(age);
    if(!grp || !band || r.total==null) return {level:null, descriptor:null};
    const tot = this.rcads25T(t.scoring.normVersion, 'anxdep', grp.g, band, r.total);
    if(!tot) return {level:null, descriptor:null};
    const clinical = tot.t>=70, borderline = !clinical && tot.t>=65;
    const level = clinical ? 'high' : borderline ? 'elevated' : 'typical';
    const descriptor = `Anx+Dep T ${tot.t}` + (clinical?' (clinical)':borderline?' (borderline)':' (typical)');
    return {level, descriptor};
  },
  resultsRCADS25(t, r){
    const scales = r.scales || {};
    const version = t.scoring.normVersion;
    const grp = this.rcadsNormGroup();
    const cAge = State.client.dob ? this.calcAge(State.client.dob, State.client.date) : null;
    const band = this.rcadsGradeBand(cAge);
    const normed = !!(grp && band);

    const tBand = tv => tv==null ? null
      : tv.t<65 ? {label:'Typical range', cls:'band-typical'}
      : tv.t<70 ? {label:'Borderline', cls:'band-elevated'}
      : {label:'Clinical range', cls:'band-high'};
    const tText = tv => tv==null ? '—' : ''+tv.t;
    const nearest = this.rcadsGradeNearest(cAge);

    const T_LO = 30, T_HI = 90;
    const toP = v => Math.max(0, Math.min(100, ((v-T_LO)/(T_HI-T_LO))*100));
    const p65 = toP(65), p70 = toP(70);
    const row = (scale, name, raw, max, opts={}) => {
      if(raw==null) return '';
      const tv = normed ? this.rcads25T(version, scale, grp.g, band, opts.exact!=null ? opts.exact : raw) : null;
      const b = tBand(tv);
      const track = tv
        ? `<div class="sdq-track"><div class="norm-axis"></div>
             <div class="norm-group-band" style="left:${p65}%;width:${p70-p65}%;background:var(--amber)"></div>
             <div class="norm-group-band" style="left:${p70}%;width:${100-p70}%;background:var(--rose-fill)"></div>
             <div class="norm-marker" style="left:${toP(tv.t)}%"><div class="norm-marker-dot"></div></div>
           </div>`
        : `<div class="sdq-track"><div class="norm-axis"></div><div class="norm-marker" style="left:${Math.max(0,Math.min(100,(raw/max)*100))}%"><div class="norm-marker-dot"></div></div></div>`;
      return `
        <div class="sdq-u-row${opts.lead?' sdq-u-lead':''}${opts.sub?' sdq-u-sub':''}">
          <span class="sdq-name">${name}${opts.note?`<span class="sdq-note">${opts.note}</span>`:''}</span>
          <span class="sdq-score">${raw}<span class="sdq-max">/${max}</span></span>
          ${track}
          <span class="sdq-pct">${tText(tv)}</span>
          ${b?`<span class="band-pill ${b.cls}">${b.label}</span>`:'<span class="sdq-pct-empty">—</span>'}
        </div>`;
    };

    const ad = scales.anxdep || {};
    const profile =
      row('anxdep','Total Anxiety & Depression', r.total, 75, {lead:true, note:' all 25 items', exact:ad.exact}) +
      row('anx','Total Anxiety', scales.anx&&scales.anx.raw, 45, {sub:true, note:' 15 items', exact:scales.anx&&scales.anx.exact}) +
      row('dep','Total Depression', scales.dep&&scales.dep.raw, 30, {sub:true, note:' 10 items', exact:scales.dep&&scales.dep.exact});

    const heroT = normed ? this.rcads25T(version, 'anxdep', grp.g, band, ad.exact!=null ? ad.exact : r.total) : null;
    const heroB = tBand(heroT);
    const who = version==='parent' ? 'the young person' : 'this young person';
    const summary = r.total==null
      ? `Not enough items are completed to score the total (it needs at least 21 of the 25 items). Either scale that is within its own missing limit (Depression ≥8 of 10, Anxiety ≥12 of 15) is still shown below.`
      : heroT
      ? `Total Anxiety & Depression raw score ${r.total} of 75, T-score ${heroT.t}, against ${grp.g} in the ${band.replace('-',' & ')} grade band${nearest?' (the nearest normed band)':''}. ${heroT.t>=70 ? 'This is at or above the clinical threshold (T 70, roughly the top 2% of un-referred young people).' : heroT.t>=65 ? 'This is in the borderline range (T 65–69, roughly the top 7% of un-referred young people).' : 'This is within the typical range for age and gender.'} The Anxiety and Depression scales below show which is driving it.`
      : `Total Anxiety & Depression raw score ${r.total} of 75 (Anxiety ${r.totalAnxiety==null?'—':r.totalAnxiety} of 45, Depression ${r.totalDepression==null?'—':r.totalDepression} of 30). ${(!grp)?'Record the young person’s gender (or sex) on the intake screen':'Add a date of birth'} to convert raw scores to age- and gender-normed T-scores.`;

    let safety = '';
    if(r.flag && r.flag.positive){
      const said = version==='parent' ? `The parent/carer answered “${r.flag.label}” to “My child thinks about death”` : `${who.charAt(0).toUpperCase()+who.slice(1)} answered “${r.flag.label}” to “I think about death”`;
      safety = `<div class="caveat" style="background:var(--rose-wash);border-color:var(--c-eccdd0)">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="cv-body"><b style="color:var(--rose)">Item 18 endorsed. Review for safety.</b> ${said}. Thoughts about death should be explored directly with the young person and a risk assessment considered, regardless of scale scores.</div></div>`;
    }

    const headerTag = normed
      ? `<span class="card-tag tag-mood">${grp.g.charAt(0).toUpperCase()+grp.g.slice(1)} · grades ${band.replace('-',' & ')}${grp.source==='sex'?' · via recorded sex':''}</span>`
      : `<span class="card-tag tag-mood">${t.respondent}</span>`;
    const subText = normed
      ? `Raw score, T-score position (amber = borderline T 65–69, red = clinical T ≥ 70, ● = ${who}), T-score, and range, per scale. Norms are matched on gender${grp.source==='sex'?' (from recorded sex, no gender identity on file)':''} and US school-grade band (grade = age − 6)${cAge!=null?`; age ${cAge} → grades ${band.replace('-',' & ')}${nearest?', the nearest normed band (the norms cover grades 3 to 12, ages 9 to 18), as UCLA’s scoring syntax does':''}`:''}.`
      : `Raw scores only: ${(!grp)?'no gender or sex is recorded for this profile':'no date of birth is recorded'}, so the gender- and grade-matched T-scores can’t be looked up yet.`;

    return `
      ${safety}

      <div class="score-hero">
        <div class="score-summary" style="max-width:none">
          <div class="ss-label">${t.fullName}</div>
          <h2>${heroT ? 'T-score '+heroT.t : (r.total==null ? 'Not scoreable' : r.total+' out of 75')}</h2>
          <p>${summary}</p>
          ${heroB?`<span class="band-pill ${heroB.cls}">${heroB.label}</span>`:''}
        </div>
      </div>

      ${this.caveatLine(t)}

      <div class="panel">
        <div class="panel-head"><h3>RCADS-25 profile</h3>${headerTag}</div>
        <p class="panel-sub">${subText}</p>
        <div class="profile-table" style="--cols:minmax(140px,1.4fr) 48px minmax(120px,2fr) 42px 104px">
          <div class="ph"><span>Scale</span><span class="r">Raw</span><span class="col-opt">${normed?'T-score scale 30–90 · amber 65 · red 70':'Position'}</span><span class="r col-opt">T</span><span class="c">Range</span></div>
          ${profile}
        </div>
        ${normed?`<p class="src-note">T-scores from the official RCADS-25 conversion tables (rcads.ucla.edu; ${version==='parent'?'parent norms Ebesutani et al. 2017':'Ebesutani et al. 2012'}). No per-scale percentile is given: in the school samples many scales pile up at 0, so a percentile read off a normal curve would mislead. The developer describes T 65 and T 70 as roughly the top 7% and top 2% of un-referred young people.</p>`:''}
      </div>

      <div class="panel">
        <div class="panel-head"><h3>About this result</h3></div>
        <p class="panel-sub" style="margin-bottom:0">The 25-item short form gives two broad scales, Total Anxiety (15 items) and Total Depression (10 items), plus their combination, rather than the six disorder-specific subscales of the 47-item RCADS. It is designed for brief screening and progress monitoring; use the full RCADS where a detailed subscale profile is needed. A borderline or clinical T-score flags an area to assess further, not a diagnosis${version==='parent'?'; where parent and self-report disagree, explore both accounts':''}.</p>
      </div>
    `;
  },

  resultsGeneric(t, r){
    return `<div class="panel"><div class="panel-head"><h3>Score</h3></div><p>Total: ${r.total} / ${r.totalMax}</p></div>`;
  },

  /* scoreRing REMOVED: its last caller (RMET) stopped rendering it, and it
     carried a percent-of-max colour rule (>=70% rose, >=50% amber) that would
     have banded any instrument by raw proportion of its maximum — a scheme with
     no psychometric basis at all. The [data-ring-target] animation hookups in
     this file and online.js are now no-ops over zero elements; harmless, and
     left in place so nothing else that renders a ring in future has to re-add
     them. Any replacement MUST take an explicit colour, not derive one. */

  /* ---- date helpers ---- */
  fmtDate(iso){
    if(!iso) return '—';
    const d = new Date(iso+'T00:00:00');
    if(isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  },
  calcAge(dobIso, refIso){
    if(!dobIso) return null;
    const dob = new Date(dobIso+'T00:00:00');
    const ref = refIso ? new Date(refIso+'T00:00:00') : new Date();
    if(isNaN(dob)||isNaN(ref)) return null;
    let age = ref.getFullYear()-dob.getFullYear();
    const m = ref.getMonth()-dob.getMonth();
    if(m<0 || (m===0 && ref.getDate()<dob.getDate())) age--;
    return age>=0 && age<120 ? age : null;
  },
});

/* ---- ring animation hookup (runs after results render) ---- */
const _origRenderResults = App.renderResults.bind(App);
App.renderResults = function(opts){
  _origRenderResults(opts);
  const scope = (opts && opts.target) || document.getElementById('view-results');
  requestAnimationFrame(()=>{
    scope.querySelectorAll('[data-ring-target]').forEach(c=>{
      c.style.strokeDashoffset = c.getAttribute('data-ring-target');
    });
  });
};

/* keep the demo "Raw answers" section expanded when printing / saving to PDF
   (a collapsed <details> won't render its contents in print) */
window.addEventListener('beforeprint', ()=>{ document.querySelectorAll('details.raw-answers').forEach(d=>{ d.open=true; }); });



/* ════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', ()=>{
  App.renderHome();
  App.go('home');
});

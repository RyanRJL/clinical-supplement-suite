/* ── Application State & Age Bounds ─────────────────────────────────────────────
   Shared state. AGE_BOUNDS sourced from original validation papers.
─────────────────────────────────────────────────────────────────────────────── */

const State = {
  client:{name:'',dob:'',sex:'',gender:'',clinician:'',date:'',ref:''},
  currentTest:null,
  answers:{},
  qIndex:0,
  result:null,
  // RMET-only: practice flow + timing (testStart..finish + per-item response times)
  rmet:{phase:null, startMs:null, itemShownMs:null, itemTimes:{}, elapsedMs:0, timer:null},
};

/* ════════════════════════════════════════════════════════════
   APP CONTROLLER
   ════════════════════════════════════════════════════════════ */

const AGE_BOUNDS = {
  aq_child:      {min:4,  max:11,  label:'4–11 years',      note:'Validated on ages 4–11 (Auyeung et al. 2008)'},
  aq_adolescent: {min:12, max:15,  label:'12–15 years',     note:'ARC form and scoring key: ages 12–15; AQ-Adolescent validated on ages 9.8–16.5 (Baron-Cohen et al. 2006)'},
  aq_adult:      {min:16, max:null,label:'16+ years',          note:'Validated on adults 16+ (Baron-Cohen et al. 2001); clinical data from 18+ (Ashwood et al. 2016)'},
  rmet:          {min:16, max:null,label:'16+ years',       note:'Adult version used from 16 (Greenberg et al. 2023, PNAS, ages 16–70; the authors note it is not fully validated under 16). Age and sex percentiles (Kynast 2021) start at 20. A separate child version exists but is not included here'},
  asrs:          {min:18, max:null,label:'18+ years',       note:'Screener accuracy from adults aged 18–44 (Kessler et al. 2005); community norms extend to 65+ (Adler et al. 2018)'},
  phq9:          {min:14, max:null,label:'14+ years',       note:'PHQ-9 norms cover ages 14–92 (Kocalevent et al. 2013). The severity bands are the adult ones; an adolescent validation (Richardson et al. 2010, ages 13–17) found 11 or more best for major depression (sensitivity 89.5%, specificity 77.5%), against 10 in adults'},
  gad7:          {min:16, max:null,label:'16+ years',       note:'GAD-7 norms cover ages 16+ (Kliem et al. 2025)'},
  vand_parent:   {min:6,  max:12,  label:'6–12 years',      note:'Validation studies were for ages 6–12 (AAP Vanderbilt scoring instructions); being DSM-5 criteria based, the AAP says it can also be used with preschoolers and adolescents'},
  vand_teacher:  {min:6,  max:12,  label:'6–12 years',      note:'Validation studies were for ages 6–12 (AAP Vanderbilt scoring instructions); being DSM-5 criteria based, the AAP says it can also be used with preschoolers and adolescents'},
  snap_parent:   {min:6,  max:18,  label:'6–18 years',      note:'SNAP-IV 26 spans school age and adolescence (about 6 to 18); Bussing et al. 2008 community data cover ages 5 to 11 only'},
  snap_teacher:  {min:6,  max:18,  label:'6–18 years',      note:'SNAP-IV 26 spans school age and adolescence (about 6 to 18); Bussing et al. 2008 community data cover ages 5 to 11 only'},
  sdq_parent:    {min:4,  max:17,  label:'4–17 years',      note:'SDQ parent/teacher version covers ages 4–17 (Goodman)'},
  sdq_self:      {min:11, max:17,  label:'11–17 years',     note:'SDQ self-report version is for ages 11–17 (Goodman)'},
  sad_child:     {min:11, max:17,  label:'11–17 years',     note:'DSM-5 child severity measure for ages 11–17 (Craske et al. 2013)'},
  cati:          {min:18, max:null,label:'18+ years',       note:'CATI validated in adults (English & Poulsen et al. 2025)'},
  catq:          {min:16, max:null,label:'16+ years',       note:'CAT-Q validated in adults aged 16+ (Hull et al. 2019); not yet established for younger adolescents'},
  lsas:          {min:18, max:null,label:'18+ years',       note:'LSAS validated in adults (Safren 1999 sample 18–61); use LSAS-CA for under-18s'},
  assist:        {min:18, max:60,  label:'18–60 years',     note:'WHO ASSIST v3.0 manual: validated only in adults aged 18 to 60'},
  wfirs_s:       {min:18, max:null,label:'18+ years',       note:'WFIRS self-report validated in adults (Canu et al. 2016, college students). Use the parent version (WFIRS-P) for under-18s'},
  wfirs_p:       {min:6,  max:18,  label:'6–18 years',      note:'WFIRS-P studied in ages 5–19 (Thompson et al. 2017) and 6–17 (Gajria et al. 2015, Health Qual Life Outcomes 13:184); general-population norms cover 6–11 (Arildskov et al. 2023)'},
  coventry:      {min:2,  max:18,  label:'Children & young people', note:'Clinician differential aid for children/young people (Coventry Grid, Moran 2010)'},
  gsq:           {min:16, max:null,label:'16+ years',       note:'GSQ validated in adults 16–66 (Robertson & Simmons 2013)'},
  gsq_p:         {min:6,  max:11,  label:'6–11 years',      note:'GSQ-P validated with parents of children 6–11 (Smees et al. 2022)'},
  rgsq_p:        {min:6,  max:11,  label:'6–11 years',      note:'rGSQ-P short form; same validation sample as the GSQ-P (Smees et al. 2022)'},
  asrs_adolescent:{min:11, max:17,  label:'11–17 years',     note:'ASRS adolescent adaptation for ages 11–17'},
  spq:           {min:18, max:null,label:'18+ years',       note:'Validated in adults only (Tavassoli et al. 2014; German short form, ages 18–62, 2022); no adolescent validation found'},
  spq35:         {min:18, max:null,label:'18+ years',       note:'SPQ short form; validated in adults only (Tavassoli et al. 2014; German short form, ages 18–62, 2022)'},
  sci:           {min:16, max:null,label:'16+ years',       note:'SCI reference values cover ages 16–75 (Espie et al. 2018, J Sleep Res 27:e12643; described as adults); the 2014 validation samples were 18+'},
  rbq3_self:     {min:13, max:null,label:'13+ years',       note:'RBQ-3 v1.3 manual: self-report from age 13'},
  sqa2:          {min:18, max:null,label:'18+ years',       note:'SQ-A-2 self-report is for adults (18+)'},
  wurs_self:     {min:18, max:null,label:'18+ years',       note:'Adults rating their own childhood; validated in adult samples only (Ward et al. 1993; Gift et al. 2021)'},
  wurs_observer: {min:18, max:null,label:'Rates an adult 18+', note:'Informant rating of an adult’s childhood; the WURS is validated in adults only (Ward et al. 1993)'},
  asrs_observer: {min:18, max:null,label:'Rates an adult 18+', note:'No official observer form or validation study exists; age follows the self-report ASRS (adults 18+, Kessler et al. 2005)'},
  ocir:          {min:18, max:null,label:'18+ years',       note:'OCI-R validated in adults (Foa et al. 2002); use the OCI-CV-R for ages 6–17'},
  oci_cv_r:      {min:6,  max:17,  label:'6–17 years',      note:'OCI-CV-R sample ages 6–17 (Abramovitch et al. 2022)'},
};

/* ── Deployment config ─────────────────────────────────────────────────────────
   ONE switch decides how the app behaves:

   • mode:'local'  → the current clinician tool. Results are shown on screen at the
                     end of an assessment. This is what the OFFLINE single-file build
                     ships with — leave it 'local' there.
   • mode:'online' → remote patient↔clinician mode. The patient signs in (magic link),
                     completes assigned assessments, and on finish their answers are
                     submitted to the clinic; the patient sees only a confirmation, not
                     scores. Fill supabaseUrl/supabaseAnonKey/clinicId for this mode.

   The anon key is safe to embed — security comes from Supabase Row Level Security,
   not from hiding the key.
─────────────────────────────────────────────────────────────────────────── */
const CONFIG = {
  /* 'auto' picks the mode from where the app is running:
       • served from assessment-suite.pages.dev (or any non-local host) → 'online'
       • opened from disk (file://) or a dev server (localhost)          → 'local'
     The offline single-file build hard-codes 'local' regardless.
     Set explicitly to 'local' or 'online' to override auto-detection. */
  mode: 'auto',                  // 'auto' | 'local' | 'online'

  // --- online mode only (Phase 1) ---
  supabaseUrl: 'https://fxklpstvcdgeqvcjywwl.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2xwc3R2Y2RnZXF2Y2p5d3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MjQsImV4cCI6MjA5Njg1NDcyNH0.E6KotOK-bUGZVVHHxnO6FFNOiZBz86F6zVTUWYnAAy0',           // ← PASTE the anon/publishable key here (Supabase → Settings → API)
  clinicId: '',                  // this clinic's id (scopes patients to the clinic)
  clinicName: 'Ardessa Psychology',   // ← the name patients see: header, sign-in, consent wording, informant links, etc.
  // The registered organisation, until the change of name is formal: invoices, receipts,
  // the privacy notices and the subject-access export name this, not clinicName.
  legalName: 'Neurominds',
  // The single generic disclaimer shown once in every score report's footer. The
  // instrument-specific caveat (registry: report.caveat) is rendered separately,
  // near the top — this is only the universal "screen, not diagnosis" reminder.
  reportFooter: 'These tools are screening supplements, not diagnostic instruments. Interpret every result within a comprehensive clinical assessment alongside developmental history and observation.',
  clinicEmail: 'appointments@neurominds.uk',   // shown to patients: page footer, declined/cancel messages (same address as on invoices)
  clinicPhone: '',               // optional; shown in the patient footer when set
  clinicSite: 'https://neurominds.uk',          // public site: complaints, terms and full privacy policy links
  clinicRegLine: 'Clinical psychologists registered with the HCPC',   // patient footer credentials line (matches the public site)

  /* Fees, in pence. The ONE source for invoice presets, the booking deposit and
     the welcome pack. Must match site/services.html; change both together. */
  fees: {
    assessments: [
      { key:'asd',      label:'Autism (ASD) assessment',        adult:149500, child:159500 },
      { key:'adhd',     label:'ADHD assessment',                adult:109500, child:129500 },
      { key:'combined', label:'Combined ASD + ADHD assessment', adult:189500, child:209500 }
    ],
    deposit: 30000,     // flat booking deposit (PAYMENTS_PLAN.md)
    inPerson: 10000,    // face-to-face surcharge, as on the services page
    phoneScreening: 5000   // a clinician goes through the screening questionnaires by phone (Ryan, 2026-09-29)
  },
  /* Welcome pack (engine/welcome_pack.js): false keeps the portal row, the
     emailed PDF and the console button hidden from patients while the pack still
     has "to be confirmed" gaps. Clinicians can still see it in the demo, the
     landing-page preview and from the patient record. */
  welcomePackLive: false,
  /* Source library (console > Test library > Source library): the SharePoint
     folder holding the contents of sources/ (papers and _forms/), with the same
     sub-folders. Each entry links to <this URL>/<its path>; SharePoint asks for a
     Neurominds Microsoft sign-in, so the files stay team-only. Empty = the list
     still shows, without open links. No trailing slash. */
  sourceLibraryUrl: 'https://rjlneuro.sharepoint.com/Shared%20Documents/Source%20Library',
  /* Practice policies each clinician confirms they've read (their file >
     Joining and leaving). Raise `version` when a policy changes and everyone is
     asked to confirm again. `url` (optional): where the policy lives, e.g. its
     SharePoint link. */
  practicePolicies: [
    { key:'safeguarding', title:'Safeguarding policy', version:'1', url:'' },
    { key:'data', title:'Data protection and confidentiality policy', version:'1', url:'' }
  ],
  registration: 'invite',        // patients are pre-registered by the clinician (allowlist)
  // Internal domain for username-based logins. Patients sign in with a username;
  // it maps to <slug>@<usernameDomain> behind the scenes (never emailed).
  // MUST match USERNAME_DOMAIN in supabase/functions/manage-user/index.ts.
  usernameDomain: 'patients.assessment-suite.app',

  /* Front door for self-referrals: FALLBACK ONLY. The owner opens or pauses
     self-referrals from Settings in the console (front_door_settings,
     supabase/changes/012). This value is used only until the database answers,
     or if 012 hasn't been run. false = every "Refer yourself" route shows the
     "Referrals are paused" notice and no account is created. */
  selfReferralsOpen: true,

  /* Show a "type the code from the email" box on the self-referral "Check your
     email" screen. Leave false until {{ .Token }} is in the Supabase Confirm
     signup and Magic Link templates, which Supabase only lets you edit once
     custom SMTP is set up (NEXT_STEPS.md). Otherwise the box asks for a code the
     email doesn't contain. */
  authEmailCode: false,

  /* Assessment batteries — one-click bundles for your standard work-ups, shown
     on the Assign screen. Selecting a battery ticks all its assessments at once;
     you can still add/remove individual ones afterwards. Edit freely: `tests`
     are instrument ids from engine/registry.js (+ 'referral' for the intake
     form). Any id that isn't a live instrument is silently ignored, so it's
     safe to leave a battery referencing something not yet enabled. */
  batteries: [
    /* Standard packs: age x phase x part. A case = the Base part plus the ASD
       and/or ADHD part (Combined = both). Screening = free, before the deposit;
       Full assessment = behind the deposit. Clinician-only interviews (ADI-R,
       ADOS-2, DIVA) are listed so the pathway is complete; they never go to the
       patient and show on the Assign screen as an in-session reminder. */
    { id:'child_screen_base', group:'child', phase:'screen', part:'base', label:'Child · Screening · Base', tests:['referral','sdq_parent'] },
    { id:'child_screen_asd', group:'child', phase:'screen', part:'asd', label:'Child · Screening · ASD', tests:['aq_child'] },
    { id:'child_screen_adhd', group:'child', phase:'screen', part:'adhd', label:'Child · Screening · ADHD', tests:['vand_parent'] },
    { id:'child_full_base', group:'child', phase:'full', part:'base', label:'Child · Full assessment · Base', tests:['rcads25_parent','wfirs_p'] },
    { id:'child_full_asd', group:'child', phase:'full', part:'asd', label:'Child · Full assessment · ASD', tests:['adir','rbq3_other','gsq_p','coventry'] },
    { id:'child_full_adhd', group:'child', phase:'full', part:'adhd', label:'Child · Full assessment · ADHD', tests:['young_diva','vand_teacher'] },
    { id:'adolescent_screen_base', group:'adolescent', phase:'screen', part:'base', label:'Teen · Screening · Base', tests:['referral','sdq_parent','sdq_self'] },
    { id:'adolescent_screen_asd', group:'adolescent', phase:'screen', part:'asd', label:'Teen · Screening · ASD', tests:['aq_adolescent'] },
    { id:'adolescent_screen_adhd', group:'adolescent', phase:'screen', part:'adhd', label:'Teen · Screening · ADHD', tests:['asrs_adolescent','snap_parent'] },
    { id:'adolescent_full_base', group:'adolescent', phase:'full', part:'base', label:'Teen · Full assessment · Base', tests:['rcads25_parent','rcads25_self','wfirs_p','sad_child'] },
    { id:'adolescent_full_asd', group:'adolescent', phase:'full', part:'asd', label:'Teen · Full assessment · ASD', tests:['adir','rbq3_self','rbq3_other'] },
    { id:'adolescent_full_adhd', group:'adolescent', phase:'full', part:'adhd', label:'Teen · Full assessment · ADHD', tests:['young_diva','snap_teacher'] },
    { id:'adult_screen_base', group:'adult', phase:'screen', part:'base', label:'Adult · Screening · Base', tests:['referral','phq9','gad7'] },
    { id:'adult_screen_asd', group:'adult', phase:'screen', part:'asd', label:'Adult · Screening · ASD', tests:['aq_adult','sqa2'] },
    { id:'adult_screen_adhd', group:'adult', phase:'screen', part:'adhd', label:'Adult · Screening · ADHD', tests:['asrs'] },
    { id:'adult_full_base', group:'adult', phase:'full', part:'base', label:'Adult · Full assessment · Base', tests:['wfirs_s','assist','lsas'] },
    { id:'adult_full_asd', group:'adult', phase:'full', part:'asd', label:'Adult · Full assessment · ASD', tests:['adirw','ados_m4','cati','rmet','rbq3_self','rbq3_other','gsq'] },
    { id:'adult_full_adhd', group:'adult', phase:'full', part:'adhd', label:'Adult · Full assessment · ADHD', tests:['diva','baars_self','baars_informant','wurs_self'] },
    { id:'mood',           group:'general', label:'Mood & anxiety',     tests:['phq9','gad7','lsas'] },
    { id:'mood_cyp',       group:'general', label:'Mood & anxiety · child/YP', tests:['rcads_self','rcads_parent'] },
    { id:'mood_cyp_brief', group:'general', label:'Mood & anxiety · child/YP (brief)', tests:['rcads25_self','rcads25_parent'] },
    /* ocir first: it is the screener (is this OCD at all?), the Y-BOCS rates
       severity once that is established. ocir is also the only member that
       survives the hosted build's ALLOW filter, so this battery stays non-empty
       there instead of being dropped. */
    { id:'ocd',            group:'general', label:'OCD',                tests:['ocir','ybocs_sr'] },
    { id:'ocd_cyp',        group:'general', label:'OCD · child/YP',     tests:['oci_cv_r'] },
    { id:'sleep',          group:'general', label:'Sleep',              tests:['sci'] },
    { id:'trauma',         group:'general', label:'Trauma & stress',    tests:['iesr'] },
    { id:'substance',      group:'general', label:'Substance use',      tests:['assist'] },
    { id:'sensory',        group:'general', label:'Sensory',            tests:['gsq','gsq_p','rgsq_p','spq35','spq'] }
  ],

  /* Quick note presets offered on the Assign screen (click to fill; still
     editable). Keep these short — they appear to the patient with the task. */
  notePresets: [
    'Please complete before our next session.',
    'Please complete as soon as you can.',
    'Bring any questions to your appointment.'
  ],

  // --- safety signposting shown to a patient who flags self-harm (UK) ---
  crisis: {
    region: 'UK',
    intro: 'If you are struggling or thinking about harming yourself, you do not have to face it alone, help is available right now, day or night.',
    lines: [
      {name: 'Samaritans, free, 24/7', value: '116 123', href: 'tel:116123',
       desc: 'Free, confidential support any time of day or night, for anyone struggling to cope.'},
      {name: 'Text SHOUT', value: '85258', href: 'sms:85258',
       desc: 'Free, 24/7 crisis support by text message if you’d rather not speak on the phone.'},
      {name: 'NHS, urgent, non-emergency', value: '111', href: 'tel:111',
       desc: 'For urgent medical or mental health help when it’s not life-threatening. Choose the mental health option.'},
      {name: 'Emergency services', value: '999', href: 'tel:999',
       desc: 'If you or someone else is in immediate danger, or life is at risk, call 999 or go to A&E.'}
    ]
  }
};

/* Resolve 'auto' once at load. file:// and localhost are the clinician's machine;
   anything served from a real host is the deployed patient site. */
CONFIG.resolvedMode = (function(){
  if(CONFIG.mode === 'local' || CONFIG.mode === 'online') return CONFIG.mode;
  try{
    const h = (window.location.hostname || '').toLowerCase();
    const isLocal = window.location.protocol === 'file:' ||
                    h === '' || h === 'localhost' || h === '127.0.0.1' ||
                    h.endsWith('.local') || /^192\.168\./.test(h) || /^10\./.test(h);
    return isLocal ? 'local' : 'online';
  }catch(e){ return 'local'; }
})();

/* ── Test Registry ───────────────────────────────────────────────────────────
   Master list of every assessment. To add a new test, append an entry to
   REGISTRY below following the schema in CLAUDE_CODE_HANDOFF.md.
   AGE_BOUNDS: numeric validation bounds sourced from original papers.
─────────────────────────────────────────────────────────────────────────── */

/* Adler et al. 2018 Table 3 means fit a 1-5 coding (see asrs itemNorms.source);
   shift them onto the app's 0-4 answers. SDs are unchanged. */
function asrsTable3To04(o){ const r={}; for(const k in o) r[k]={ m:Math.round((o[k].m-1)*100)/100, sd:o[k].sd }; return r; }

/* ════════════════════════════════════════════════════════════
   DATA REGISTRY
   Every test is a self-contained object. To add a new test,
   append an entry here — the UI, scoring, and dashboard all
   read from this structure. No other code needs to change.

   SCHEMA
   -------
   id            unique key
   name          short display name
   fullName      expanded name
   category      autism | adhd | sensory | social  (drives tag colour)
   status        'live' | 'soon'
   respondent    who completes it
   ageRange      validated age range string
   estMinutes    rough completion time
   description   one-line summary for the card
   citation      source reference (shown on results)
   higherMeans   what a higher score indicates
   scoring: {
     type        'binary' | 'likert' | 'mean'
     options     [{label, ...}]  shown as answer buttons
     // scoring rules vary by type — see scoreTest()
   }
   items         [{n, text, subscale, ...}]
   subscales     {key:{name, items:[...]}}
   norms         comparison groups (structure varies; read by dashboard)
   cutoffs       clinical thresholds with caveats
   ════════════════════════════════════════════════════════════ */

const REGISTRY = {};

/* Informant / observer forms that BORROW the self-report form's cut-off.
   Such a test carries `borrowedCutoff:{from, cutoff}` (the self-report form
   the threshold comes from, and what the threshold is). No observer-specific
   cut-off is invented here; the classification is shown with one consistent
   caveat instead (rendered by Results.caveatLine, readable by any consumer via
   informantCutoffCaveat). Pending clinical sign-off: BAND_DESCRIPTOR_AUDIT.md. */
function informantCutoffCaveat(t){
  const b = t && t.borrowedCutoff;
  if(!b) return '';
  return 'Cut-off taken from the self-report form: '+b.cutoff+' ('+b.from+'). It has not been validated for informant report, so treat the classification as indicative.';
}

Object.assign(REGISTRY, {"aq_adolescent":{"id":"aq_adolescent","name":"AQ (Adolescent)","fullName":"Autism-Spectrum Quotient (Adolescent)","verified":{"date":"2026-07-20","note":"50 items, the four-point binary response set, the five subscale allocations and every scored direction verified as an exact third-person parity match to the already-verified AQ Adult (the 2006 adolescent form rewords the adult items for a parent/carer rater and does NOT adopt the Child form's content changes). Cut-offs (>=30 recommended, 0% of controls at/above; >=32 adult-equivalent) and the AS/HFA (n=52), Autism (n=79) and Control (n=50) group + subscale norms match Baron-Cohen, Hoekstra, Knickmeyer & Wheelwright (2006) and the verified norms log cell-by-cell. Reliability (test-retest r=0.92, per-subscale alphas) from the same paper."},"category":"autism","status":"live","respondent":"Parent / carer report","informantKind":"childhood","informantHelp":"An autism-traits questionnaire for a parent or carer to complete about {subject}.","ageRange":"12–15 years","estMinutes":"8–10 min","description":"Quantifies autistic traits across five domains. A widely used screening supplement.","citation":"Baron-Cohen, Hoekstra, Knickmeyer & Wheelwright (2006). J Autism Dev Disord 36(3):343–350.","report":{},"higherMeans":"more autistic traits","scoring":{"type":"binary","options":[{"label":"Definitely agree","agree":true},{"label":"Slightly agree","agree":true},{"label":"Slightly disagree","agree":false},{"label":"Definitely disagree","agree":false}],"totalMax":50,"subscaleMax":10},"items":[{"n":1,"text":"S/he prefers to do things with others rather than on her/his own.","subscale":"social_skill","scoredDirection":"disagree"},{"n":2,"text":"S/he prefers to do things the same way over and over again.","subscale":"attention_switching","scoredDirection":"agree"},{"n":3,"text":"If s/he tries to imagine something, s/he finds it very easy to create a picture in her/his mind.","subscale":"imagination","scoredDirection":"disagree"},{"n":4,"text":"S/he frequently gets so strongly absorbed in one thing that s/he loses sight of other things.","subscale":"attention_switching","scoredDirection":"agree"},{"n":5,"text":"S/he often notices small sounds when others do not.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":6,"text":"S/he usually notices car number plates or similar strings of information.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":7,"text":"Other people frequently tell her/him that what s/he has said is impolite, even though s/he thinks it is polite.","subscale":"communication","scoredDirection":"agree"},{"n":8,"text":"When s/he is reading a story, s/he can easily imagine what the characters might look like.","subscale":"imagination","scoredDirection":"disagree"},{"n":9,"text":"S/he is fascinated by dates.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":10,"text":"In a social group, s/he can easily keep track of several different people's conversations.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":11,"text":"S/he finds social situations easy.","subscale":"social_skill","scoredDirection":"disagree"},{"n":12,"text":"S/he tends to notice details that others do not.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":13,"text":"S/he would rather go to a library than a party.","subscale":"social_skill","scoredDirection":"agree"},{"n":14,"text":"S/he finds making up stories easy.","subscale":"imagination","scoredDirection":"disagree"},{"n":15,"text":"S/he finds her/himself drawn more strongly to people than to things.","subscale":"social_skill","scoredDirection":"disagree"},{"n":16,"text":"S/he tends to have very strong interests, which s/he gets upset about if s/he can't pursue.","subscale":"attention_switching","scoredDirection":"agree"},{"n":17,"text":"S/he enjoys social chit-chat.","subscale":"communication","scoredDirection":"disagree"},{"n":18,"text":"When s/he talks, it isn't always easy for others to get a word in edgeways.","subscale":"communication","scoredDirection":"agree"},{"n":19,"text":"S/he is fascinated by numbers.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":20,"text":"When s/he is reading a story, s/he finds it difficult to work out the characters' intentions.","subscale":"imagination","scoredDirection":"agree"},{"n":21,"text":"S/he doesn't particularly enjoy reading fiction.","subscale":"imagination","scoredDirection":"agree"},{"n":22,"text":"S/he finds it hard to make new friends.","subscale":"social_skill","scoredDirection":"agree"},{"n":23,"text":"S/he notices patterns in things all the time.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":24,"text":"S/he would rather go to the theatre than a museum.","subscale":"imagination","scoredDirection":"disagree"},{"n":25,"text":"It does not upset him/her if his/her daily routine is disturbed.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":26,"text":"S/he frequently finds that s/he doesn't know how to keep a conversation going.","subscale":"communication","scoredDirection":"agree"},{"n":27,"text":"S/he finds it easy to “read between the lines” when someone is talking to her/him.","subscale":"communication","scoredDirection":"disagree"},{"n":28,"text":"S/he usually concentrates more on the whole picture, rather than the small details.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":29,"text":"S/he is not very good at remembering phone numbers.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":30,"text":"S/he doesn't usually notice small changes in a situation, or a person's appearance.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":31,"text":"S/he knows how to tell if someone listening to him/her is getting bored.","subscale":"communication","scoredDirection":"disagree"},{"n":32,"text":"S/he finds it easy to do more than one thing at once.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":33,"text":"When s/he talks on the phone, s/he is not sure when it's her/his turn to speak.","subscale":"communication","scoredDirection":"agree"},{"n":34,"text":"S/he enjoys doing things spontaneously.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":35,"text":"S/he is often the last to understand the point of a joke.","subscale":"communication","scoredDirection":"agree"},{"n":36,"text":"S/he finds it easy to work out what someone is thinking or feeling just by looking at their face.","subscale":"social_skill","scoredDirection":"disagree"},{"n":37,"text":"If there is an interruption, s/he can switch back to what s/he was doing very quickly.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":38,"text":"S/he is good at social chit-chat.","subscale":"communication","scoredDirection":"disagree"},{"n":39,"text":"People often tell her/him that s/he keeps going on and on about the same thing.","subscale":"communication","scoredDirection":"agree"},{"n":40,"text":"When s/he was younger, s/he used to enjoy playing games involving pretending with other children.","subscale":"imagination","scoredDirection":"disagree"},{"n":41,"text":"S/he likes to collect information about categories of things (e.g. types of car, types of bird, types of train, types of plant, etc.).","subscale":"imagination","scoredDirection":"agree"},{"n":42,"text":"S/he finds it difficult to imagine what it would be like to be someone else.","subscale":"imagination","scoredDirection":"agree"},{"n":43,"text":"S/he likes to plan any activities s/he participates in carefully.","subscale":"attention_switching","scoredDirection":"agree"},{"n":44,"text":"S/he enjoys social occasions.","subscale":"social_skill","scoredDirection":"disagree"},{"n":45,"text":"S/he finds it difficult to work out people's intentions.","subscale":"social_skill","scoredDirection":"agree"},{"n":46,"text":"New situations make him/her anxious.","subscale":"attention_switching","scoredDirection":"agree"},{"n":47,"text":"S/he enjoys meeting new people.","subscale":"social_skill","scoredDirection":"disagree"},{"n":48,"text":"S/he is a good diplomat.","subscale":"social_skill","scoredDirection":"disagree"},{"n":49,"text":"S/he is not very good at remembering people's date of birth.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":50,"text":"S/he finds it very easy to play games with children that involve pretending.","subscale":"imagination","scoredDirection":"disagree"}],"subscales":{"social_skill":{"name":"Social Skill","items":[1,11,13,15,22,36,44,45,47,48],"max":10},"attention_switching":{"name":"Attention Switching","items":[2,4,10,16,25,32,34,37,43,46],"max":10},"attention_to_detail":{"name":"Attention to Detail","items":[5,6,9,12,19,23,28,29,30,49],"max":10},"communication":{"name":"Communication","items":[7,17,18,26,27,31,33,35,38,39],"max":10},"imagination":{"name":"Imagination","items":[3,8,14,20,21,24,40,41,42,50],"max":10}},"cutoffs":[{"score":30,"recommended":true,"source":"Baron-Cohen et al. 2006","note":"suggested adolescent cut-off; no controls scored 30 or more","pct_at_or_above":{"control_all":0,"as_hfa_boys":86.8,"as_hfa_girls":100,"autism_boys":90.5,"autism_girls":81.3}},{"score":32,"recommended":false,"source":"Baron-Cohen et al. 2006","note":"the adult cut-off; no controls scored 32 or more","pct_at_or_above":{"control_all":0,"as_hfa_all":80.8,"as_hfa_boys":73.7,"as_hfa_girls":100,"autism_all":83.5,"autism_boys":87.3,"autism_girls":68.8}}],"_raw_version":"adolescent","norms":[{"group":"AS/HFA","sex":"all","n":52,"total":{"mean":37.3,"sd":5.8},"subscales":{"communication":{"mean":8.2,"sd":1.6},"social":{"mean":7.8,"sd":1.8},"imagination":{"mean":6.7,"sd":2.2},"attention_to_detail":{"mean":6.1,"sd":2.4},"attention_switching":{"mean":8.5,"sd":1.7}}},{"group":"AS/HFA","sex":"male","n":38,"total":{"mean":36.4,"sd":6.0},"subscales":{"communication":{"mean":7.9,"sd":1.6},"social":{"mean":7.4,"sd":1.7},"imagination":{"mean":6.8,"sd":2.3},"attention_to_detail":{"mean":6.1,"sd":2.5},"attention_switching":{"mean":8.2,"sd":1.9}}},{"group":"AS/HFA","sex":"female","n":14,"total":{"mean":39.8,"sd":4.3},"subscales":{"communication":{"mean":9.0,"sd":1.4},"social":{"mean":8.8,"sd":1.4},"imagination":{"mean":6.8,"sd":2.0},"attention_to_detail":{"mean":6.1,"sd":2.4},"attention_switching":{"mean":9.0,"sd":1.0}}},{"group":"Autism","sex":"all","n":79,"total":{"mean":38.3,"sd":6.0},"subscales":{"communication":{"mean":8.0,"sd":1.5},"social":{"mean":8.0,"sd":1.9},"imagination":{"mean":7.6,"sd":2.0},"attention_to_detail":{"mean":6.5,"sd":2.1},"attention_switching":{"mean":8.3,"sd":1.6}}},{"group":"Autism","sex":"male","n":63,"total":{"mean":39.0,"sd":5.9},"subscales":{"communication":{"mean":8.1,"sd":1.5},"social":{"mean":8.2,"sd":1.8},"imagination":{"mean":7.7,"sd":2.0},"attention_to_detail":{"mean":6.6,"sd":2.2},"attention_switching":{"mean":8.3,"sd":1.6}}},{"group":"Autism","sex":"female","n":16,"total":{"mean":35.7,"sd":6.1},"subscales":{"communication":{"mean":7.6,"sd":1.6},"social":{"mean":7.3,"sd":2.0},"imagination":{"mean":6.8,"sd":2.1},"attention_to_detail":{"mean":5.9,"sd":1.9},"attention_switching":{"mean":8.1,"sd":1.8}}},{"group":"Control","sex":"all","n":50,"total":{"mean":17.7,"sd":5.7},"subscales":{"communication":{"mean":2.7,"sd":1.7},"social":{"mean":2.0,"sd":1.9},"imagination":{"mean":3.2,"sd":2.3},"attention_to_detail":{"mean":5.3,"sd":2.4},"attention_switching":{"mean":4.5,"sd":2.0}}},{"group":"Control","sex":"male","n":25,"total":{"mean":20.2,"sd":4.8},"subscales":{"communication":{"mean":2.9,"sd":1.8},"social":{"mean":2.2,"sd":1.9},"imagination":{"mean":4.4,"sd":2.2},"attention_to_detail":{"mean":5.8,"sd":2.6},"attention_switching":{"mean":5.0,"sd":1.7}}},{"group":"Control","sex":"female","n":25,"total":{"mean":15.3,"sd":5.7},"subscales":{"communication":{"mean":2.6,"sd":1.6},"social":{"mean":1.8,"sd":1.9},"imagination":{"mean":2.0,"sd":1.8},"attention_to_detail":{"mean":4.8,"sd":2.2},"attention_switching":{"mean":4.1,"sd":2.1}}}],"reliability":{"test_retest_r":0.92,"cronbach_alpha":{"whole":0.79,"communication":0.82,"social":0.88,"imagination":0.81,"attention_to_detail":0.66,"attention_switching":0.76}}},"aq_adult":{"id":"aq_adult","name":"AQ (Adult)","fullName":"Autism-Spectrum Quotient (Adult, AQ-50)","verified":{"date":"2026-07-20","note":"50 items, the five subscale allocations and binary scoring verified against the AQ-50; AQ-10 subset and NICE >=6 referral cutoff confirmed; group norms (Ruzich et al. 2015 and Baron-Cohen et al. 2001) 42/42 in the log; total-score thresholds rebuilt as a source-attributed ladder (Woodbury-Smith 2005 >=26, Broadbent 2013 >=30, Baron-Cohen 2001 >=32), each with its study sensitivity/specificity and sample, checked against the original papers. Re-checked 2026-08-04: the six adultNorms ci95 pairs are Ruzich's 95% confidence intervals around each meta-analysed mean, all six exact against the paper; Ruzich reports no observed min-max score range for any group, so range_low/range_high stay empty for this instrument in the norms log."},"category":"autism","status":"live","respondent":"Self-report","ageRange":"16+ years","estMinutes":"8–10 min","description":"Quantifies autistic traits across five domains. A widely used screening supplement.","citation":"Baron-Cohen, Wheelwright, Skinner, Martin & Clubley (2001). J Autism Dev Disord 31:5–17.","higherMeans":"more autistic traits","scoring":{"type":"binary","options":[{"label":"Definitely agree","agree":true},{"label":"Slightly agree","agree":true},{"label":"Slightly disagree","agree":false},{"label":"Definitely disagree","agree":false}],"totalMax":50,"subscaleMax":10},"items":[{"n":1,"text":"I prefer to do things with others rather than on my own.","subscale":"social_skill","scoredDirection":"disagree"},{"n":2,"text":"I prefer to do things the same way over and over again.","subscale":"attention_switching","scoredDirection":"agree"},{"n":3,"text":"If I try to imagine something, I find it very easy to create a picture in my mind.","subscale":"imagination","scoredDirection":"disagree"},{"n":4,"text":"I frequently get so strongly absorbed in one thing that I lose sight of other things.","subscale":"attention_switching","scoredDirection":"agree"},{"n":5,"text":"I often notice small sounds when others do not.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":6,"text":"I usually notice car number plates or similar strings of information.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":7,"text":"Other people frequently tell me that what I've said is impolite, even though I think it is polite.","subscale":"communication","scoredDirection":"agree"},{"n":8,"text":"When I'm reading a story, I can easily imagine what the characters might look like.","subscale":"imagination","scoredDirection":"disagree"},{"n":9,"text":"I am fascinated by dates.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":10,"text":"In a social group, I can easily keep track of several different people's conversations.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":11,"text":"I find social situations easy.","subscale":"social_skill","scoredDirection":"disagree"},{"n":12,"text":"I tend to notice details that others do not.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":13,"text":"I would rather go to a library than a party.","subscale":"social_skill","scoredDirection":"agree"},{"n":14,"text":"I find making up stories easy.","subscale":"imagination","scoredDirection":"disagree"},{"n":15,"text":"I find myself drawn more strongly to people than to things.","subscale":"social_skill","scoredDirection":"disagree"},{"n":16,"text":"I tend to have very strong interests, which I get upset about if I can't pursue.","subscale":"attention_switching","scoredDirection":"agree"},{"n":17,"text":"I enjoy social chit-chat.","subscale":"communication","scoredDirection":"disagree"},{"n":18,"text":"When I talk, it isn't always easy for others to get a word in edgeways.","subscale":"communication","scoredDirection":"agree"},{"n":19,"text":"I am fascinated by numbers.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":20,"text":"When I'm reading a story, I find it difficult to work out the characters' intentions.","subscale":"imagination","scoredDirection":"agree"},{"n":21,"text":"I don't particularly enjoy reading fiction.","subscale":"imagination","scoredDirection":"agree"},{"n":22,"text":"I find it hard to make new friends.","subscale":"social_skill","scoredDirection":"agree"},{"n":23,"text":"I notice patterns in things all the time.","subscale":"attention_to_detail","scoredDirection":"agree"},{"n":24,"text":"I would rather go to the theatre than a museum.","subscale":"imagination","scoredDirection":"disagree"},{"n":25,"text":"It does not upset me if my daily routine is disturbed.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":26,"text":"I frequently find that I don't know how to keep a conversation going.","subscale":"communication","scoredDirection":"agree"},{"n":27,"text":"I find it easy to “read between the lines” when someone is talking to me.","subscale":"communication","scoredDirection":"disagree"},{"n":28,"text":"I usually concentrate more on the whole picture, rather than the small details.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":29,"text":"I am not very good at remembering phone numbers.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":30,"text":"I don't usually notice small changes in a situation, or a person's appearance.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":31,"text":"I know how to tell if someone listening to me is getting bored.","subscale":"communication","scoredDirection":"disagree"},{"n":32,"text":"I find it easy to do more than one thing at once.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":33,"text":"When I talk on the phone, I'm not sure when it's my turn to speak.","subscale":"communication","scoredDirection":"agree"},{"n":34,"text":"I enjoy doing things spontaneously.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":35,"text":"I am often the last to understand the point of a joke.","subscale":"communication","scoredDirection":"agree"},{"n":36,"text":"I find it easy to work out what someone is thinking or feeling just by looking at their face.","subscale":"social_skill","scoredDirection":"disagree"},{"n":37,"text":"If there is an interruption, I can switch back to what I was doing very quickly.","subscale":"attention_switching","scoredDirection":"disagree"},{"n":38,"text":"I am good at social chit-chat.","subscale":"communication","scoredDirection":"disagree"},{"n":39,"text":"People often tell me that I keep going on and on about the same thing.","subscale":"communication","scoredDirection":"agree"},{"n":40,"text":"When I was young, I used to enjoy playing games involving pretending with other children.","subscale":"imagination","scoredDirection":"disagree"},{"n":41,"text":"I like to collect information about categories of things (e.g. types of car, types of bird, types of train, types of plant, etc.).","subscale":"imagination","scoredDirection":"agree"},{"n":42,"text":"I find it difficult to imagine what it would be like to be someone else.","subscale":"imagination","scoredDirection":"agree"},{"n":43,"text":"I like to plan any activities I participate in carefully.","subscale":"attention_switching","scoredDirection":"agree"},{"n":44,"text":"I enjoy social occasions.","subscale":"social_skill","scoredDirection":"disagree"},{"n":45,"text":"I find it difficult to work out people's intentions.","subscale":"social_skill","scoredDirection":"agree"},{"n":46,"text":"New situations make me anxious.","subscale":"attention_switching","scoredDirection":"agree"},{"n":47,"text":"I enjoy meeting new people.","subscale":"social_skill","scoredDirection":"disagree"},{"n":48,"text":"I am a good diplomat.","subscale":"social_skill","scoredDirection":"disagree"},{"n":49,"text":"I am not very good at remembering people's date of birth.","subscale":"attention_to_detail","scoredDirection":"disagree"},{"n":50,"text":"I find it very easy to play games with children that involve pretending.","subscale":"imagination","scoredDirection":"disagree"}],"subscales":{"social_skill":{"name":"Social Skill","items":[1,11,13,15,22,36,44,45,47,48],"max":10},"attention_switching":{"name":"Attention Switching","items":[2,4,10,16,25,32,34,37,43,46],"max":10},"attention_to_detail":{"name":"Attention to Detail","items":[5,6,9,12,19,23,28,29,30,49],"max":10},"communication":{"name":"Communication","items":[7,17,18,26,27,31,33,35,38,39],"max":10},"imagination":{"name":"Imagination","items":[3,8,14,20,21,24,40,41,42,50],"max":10}},"cutoffs":[{"score":26,"source":"Woodbury-Smith et al. 2005","sens":0.945,"spec":0.519,"ppv":0.84,"npv":0.78,"correct":0.83,"sample":"CLASS clinic: 100 consecutive suspected-Asperger referrals (73 ASD / 27 not; 73% base rate). The non-ASD group were referrals with elevated pre-test probability (mean AQ 26.2), not healthy controls - so the low specificity and the PPV/NPV are clinic-sample values, not transferable operating characteristics.","note":"High-sensitivity referral threshold"},{"score":30,"source":"Broadbent et al. 2013 (printed as >29)","sens":0.856,"spec":0.992,"sample":"104 clinically-diagnosed ASD (IQ>70) vs 129 community typically-developing adults (Australia).","note":"Balanced; aligns with the AQ-Adolescent cut of 30. Table 5 row >29 (bold in the paper): sensitivity 85.6%, specificity 99.2%. Controls n=129 (the abstract says 128; the Table 5 percentages fit 129)."},{"score":32,"source":"Baron-Cohen et al. 2001","sens":0.793,"spec":0.977,"sexSplit":{"female":{"sens":0.923,"spec":0.99},"male":{"sens":0.756,"spec":0.961}},"sample":"58 AS/HFA vs 174 general-population volunteers (postal survey, mean age 37). Sensitivity = % of the 58 scoring 32+; specificity = 100 - 2.3% of controls. The abstract rounds sensitivity to 80%.","note":"Original clinical threshold"}],"_raw_version":"adult","adultMeans":[{"sample":"general_population_male","scale":"AQ-50","mean":17.8,"sd":6.8,"source":"restated in Auyeung et al. 2008, citing Baron-Cohen et al. 2001"},{"sample":"general_population_female","scale":"AQ-50","mean":15.4,"sd":5.7,"source":"restated in Auyeung et al. 2008, citing Baron-Cohen et al. 2001"},{"sample":"clinical_referral_suspected_ASD","scale":"AQ-50","mean":34.9,"sd":8.2,"n":456,"source":"Ashwood et al. 2016 (clinical, not population)"},{"sample":"clinical_referral_suspected_ASD","scale":"AQ-10","mean":7.2,"sd":2.3,"n":428,"source":"Ashwood et al. 2016 (clinical, not population)"}],"adultNorms":{"source":"Ruzich et al. (2015), Molecular Autism 6:2, systematic review/meta-analysis of 78 studies, N≈6,900 adults.","scale":"AQ-50 total","pooledSD":{"nonclinical":5.59,"asc":6.27,"note":"No sex-specific SDs are reported; pooled SDs used for z-score/percentile estimation (assumes approx. normality)."},"groups":{"nonclinical":{"male":{"mean":17.89,"ci95":[16.7,19.1],"nStudies":10,"n":872},"female":{"mean":14.88,"ci95":[13.3,16.5],"nStudies":10,"n":1378},"overall":{"mean":16.94,"ci95":[16.4,17.4],"nStudies":72,"n":4931}},"asc":{"male":{"mean":36.40,"ci95":[33.1,39.7],"nStudies":6,"n":363},"female":{"mean":38.83,"ci95":[36.3,41.4],"nStudies":6,"n":298},"overall":{"mean":35.19,"ci95":[34.5,35.9],"nStudies":39,"n":1374}}},"sexDifference":{"hedges_g":0.40,"direction":"males higher in non-clinical samples; small/reversed in ASC"}},"norms":[{"group":"Control","sex":"all","n":174,"total":{"mean":16.4,"sd":6.3},"subscales":{"communication":{"mean":2.4,"sd":1.9},"social":{"mean":2.6,"sd":2.3},"imagination":{"mean":2.3,"sd":1.7},"attention_to_detail":{"mean":5.3,"sd":2.3},"attention_switching":{"mean":3.9,"sd":1.9}}},{"group":"Control","sex":"male","n":76,"total":{"mean":17.8,"sd":6.8},"subscales":{"communication":{"mean":2.8,"sd":2.0},"social":{"mean":2.8,"sd":2.5},"imagination":{"mean":2.7,"sd":1.9},"attention_to_detail":{"mean":5.2,"sd":2.3},"attention_switching":{"mean":4.3,"sd":1.9}}},{"group":"Control","sex":"female","n":98,"total":{"mean":15.4,"sd":5.7},"subscales":{"communication":{"mean":2.1,"sd":1.8},"social":{"mean":2.3,"sd":2.2},"imagination":{"mean":1.9,"sd":1.5},"attention_to_detail":{"mean":5.4,"sd":2.3},"attention_switching":{"mean":3.6,"sd":1.8}}},{"group":"Autism","sex":"all","n":58,"total":{"mean":35.8,"sd":6.5},"subscales":{"communication":{"mean":7.2,"sd":2.0},"social":{"mean":7.5,"sd":1.9},"imagination":{"mean":6.4,"sd":2.1},"attention_to_detail":{"mean":6.7,"sd":2.3},"attention_switching":{"mean":8.0,"sd":1.8}}},{"group":"Autism","sex":"male","n":45,"total":{"mean":35.1,"sd":6.9},"subscales":{"communication":{"mean":7.2,"sd":2.0},"social":{"mean":7.4,"sd":2.0},"imagination":{"mean":6.2,"sd":2.2},"attention_to_detail":{"mean":6.6,"sd":2.3},"attention_switching":{"mean":7.7,"sd":1.9}}},{"group":"Autism","sex":"female","n":13,"smallSample":true,"total":{"mean":38.1,"sd":4.4},"subscales":{"communication":{"mean":7.3,"sd":2.1},"social":{"mean":7.9,"sd":1.4},"imagination":{"mean":7.0,"sd":1.5},"attention_to_detail":{"mean":6.9,"sd":2.1},"attention_switching":{"mean":8.9,"sd":1.0}}}],"subscaleNormsSource":"Baron-Cohen et al. (2001), J Autism Dev Disord 31:5–17, Table I, UK sample (n=174 controls, n=58 AS/HFA; female AS/HFA cell n=13 is small).","aq10":{"total_min":0,"total_max":10,"items":[5,20,27,28,31,32,36,37,41,45],"agree_scored_items":[5,20,41,45],"disagree_scored_items":[27,28,31,32,36,37],"cutoffs":[{"score":6,"note":"Allison et al. 2012; endorsed by NICE for referral triage"}]},"report":{"caveat":"In clinical samples the AQ has high sensitivity but low specificity, many people scoring below cut-off are later diagnosed, and generalised anxiety can inflate scores. Use as one data point only."}},"aq_child":{"id":"aq_child","name":"AQ (Child)","fullName":"Autism-Spectrum Quotient (Child, AQ-Child)","verified":{"date":"2026-07-20","note":"50 items and the 0-3 Likert scoring (definitely agree=0 ... definitely disagree=3; total 0-150, subscale max 30) verified against Auyeung, Baron-Cohen, Wheelwright & Allison (2008). Five subscale allocations are identical to the verified AQ Adult; every per-item reverse flag is internally consistent (reverse=true exactly where the autism-consistent answer is 'agree'). The twelve items the paper marks as changed substantially from the adult version (Appendix 1 footnote a, pp.1238-1239: items 6, 7, 8, 13, 15, 20, 21, 24, 26, 32, 40, 48) confirmed. Cut-offs 66/76(recommended)/86 with their sens/spec, and the Control (1225), AS/HFA (348) and Autism (192) group + subscale norms match the paper and the verified norms log. The Autism-all attention-switching mean is corrected to 22.8 (source misprints 10.9, the Control mean); independently re-derived by pooling boys 22.9 (n156) + girls 22.4 (n36) = 22.81, pooled SD 4.4."},"category":"autism","status":"live","respondent":"Parent report","informantKind":"childhood","informantHelp":"An autism-traits questionnaire for a parent or carer to complete about {subject}.","ageRange":"4–11 years","estMinutes":"8–10 min","description":"Parent-report measure of autistic traits in children, using a four-point scale.","citation":"Auyeung, Baron-Cohen, Wheelwright & Allison (2008). J Autism Dev Disord 38:1230–1240.","scoringBasis":"Scoring basis. Total: all 50 items summed (0–150), per the Autism Research Centre scoring key. Subscales: 10 items each, summed (0–30), per Gomez, Stavropoulos & Vance (2019), J Autism Dev Disord 49:468–480; Attention to Detail includes items 29, 30 and 49. Gomez et al. found only minimal support for this five-subscale structure (CFI .747) and proposed a 32-item four-factor alternative, so read subscale scores descriptively. Cut-offs (66, 76, 86) and group means: Auyeung, Baron-Cohen, Wheelwright & Allison (2008), J Autism Dev Disord 38:1230–1240, Tables 3 and 4. That paper dropped items 29, 30 and 49 before calculating its norms and cut-offs (p.1233; “maximum obtainable score = 141”, p.1234). So a 50-item total runs about 5 to 6 points higher than those norms assume for a typical child (about 4 to 5 for an autistic child), and Attention to Detail runs about 5.6 points (over 1 SD) higher against the control mean. Read scores near a cut-off, and the Attention to Detail comparison, with that in mind.","report":{},"higherMeans":"more autistic traits","scoring":{"type":"likert","options":[{"label":"Definitely agree","base":0},{"label":"Slightly agree","base":1},{"label":"Slightly disagree","base":2},{"label":"Definitely disagree","base":3}],"totalMax":150,"subscaleMax":30},"items":[{"n":1,"text":"S/he prefers to do things with others rather than on her/his own.","subscale":"social_skill","reverse":false},{"n":2,"text":"S/he prefers to do things the same way over and over again.","subscale":"attention_switching","reverse":true},{"n":3,"text":"If s/he tries to imagine something, s/he finds it very easy to create a picture in her/his mind.","subscale":"imagination","reverse":false},{"n":4,"text":"S/he frequently gets so strongly absorbed in one thing that s/he loses sight of other things.","subscale":"attention_switching","reverse":true},{"n":5,"text":"S/he often notices small sounds when others do not.","subscale":"attention_to_detail","reverse":true},{"n":6,"text":"S/he usually notices house numbers or similar strings of information.","subscale":"attention_to_detail","reverse":true},{"n":7,"text":"S/he has difficulty understanding rules for polite behaviour.","subscale":"communication","reverse":true},{"n":8,"text":"When s/he is reading a story, s/he can easily imagine what the characters might look like.","subscale":"imagination","reverse":false},{"n":9,"text":"S/he is fascinated by dates.","subscale":"attention_to_detail","reverse":true},{"n":10,"text":"In a social group, s/he can easily keep track of several different people's conversations.","subscale":"attention_switching","reverse":false},{"n":11,"text":"S/he finds social situations easy.","subscale":"social_skill","reverse":false},{"n":12,"text":"S/he tends to notice details that others do not.","subscale":"attention_to_detail","reverse":true},{"n":13,"text":"S/he would rather go to a library than a birthday party.","subscale":"social_skill","reverse":true},{"n":14,"text":"S/he finds making up stories easy.","subscale":"imagination","reverse":false},{"n":15,"text":"S/he is drawn more strongly to people than to things.","subscale":"social_skill","reverse":false},{"n":16,"text":"S/he tends to have very strong interests, which s/he gets upset about if s/he cannot pursue.","subscale":"attention_switching","reverse":true},{"n":17,"text":"S/he enjoys social chit-chat.","subscale":"communication","reverse":false},{"n":18,"text":"When s/he talks, it is not always easy for others to get a word in edgeways.","subscale":"communication","reverse":true},{"n":19,"text":"S/he is fascinated by numbers.","subscale":"attention_to_detail","reverse":true},{"n":20,"text":"When s/he is reading a story, s/he finds it difficult to work out the characters' intentions or feelings.","subscale":"imagination","reverse":true},{"n":21,"text":"S/he does not particularly enjoy fictional stories.","subscale":"imagination","reverse":true},{"n":22,"text":"S/he finds it hard to make new friends.","subscale":"social_skill","reverse":true},{"n":23,"text":"S/he notices patterns in things all the time.","subscale":"attention_to_detail","reverse":true},{"n":24,"text":"S/he would rather go to the cinema than a museum.","subscale":"imagination","reverse":false},{"n":25,"text":"It does not upset him/her if his/her daily routine is disturbed.","subscale":"attention_switching","reverse":false},{"n":26,"text":"S/he does not know how to keep a conversation going with her/his peers.","subscale":"communication","reverse":true},{"n":27,"text":"S/he finds it easy to “read between the lines” when someone is talking to her/him.","subscale":"communication","reverse":false},{"n":28,"text":"S/he usually concentrates more on the whole picture, rather than the small details.","subscale":"attention_to_detail","reverse":false},{"n":29,"text":"S/he is not very good at remembering phone numbers.","subscale":"attention_to_detail","reverse":false},{"n":30,"text":"S/he does not usually notice small changes in a situation, or a person's appearance.","subscale":"attention_to_detail","reverse":false},{"n":31,"text":"S/he knows how to tell if someone listening to him/her is getting bored.","subscale":"communication","reverse":false},{"n":32,"text":"S/he finds it easy to go back and forth between different activities.","subscale":"attention_switching","reverse":false},{"n":33,"text":"When s/he talks on the phone, s/he is not sure when it is her/his turn to speak.","subscale":"communication","reverse":true},{"n":34,"text":"S/he enjoys doing things spontaneously.","subscale":"attention_switching","reverse":false},{"n":35,"text":"S/he is often the last to understand the point of a joke.","subscale":"communication","reverse":true},{"n":36,"text":"S/he finds it easy to work out what someone is thinking or feeling just by looking at their face.","subscale":"social_skill","reverse":false},{"n":37,"text":"If there is an interruption, s/he can switch back to what s/he was doing very quickly.","subscale":"attention_switching","reverse":false},{"n":38,"text":"S/he is good at social chit-chat.","subscale":"communication","reverse":false},{"n":39,"text":"People often tell her/him that s/he keeps going on and on about the same thing.","subscale":"communication","reverse":true},{"n":40,"text":"When s/he was in preschool, s/he used to enjoy playing games involving pretending with other children.","subscale":"imagination","reverse":false},{"n":41,"text":"S/he likes to collect information about categories of things (e.g. types of car, types of bird, types of train, types of plant, etc.).","subscale":"imagination","reverse":true},{"n":42,"text":"S/he finds it difficult to imagine what it would be like to be someone else.","subscale":"imagination","reverse":true},{"n":43,"text":"S/he likes to plan any activities s/he participates in carefully.","subscale":"attention_switching","reverse":true},{"n":44,"text":"S/he enjoys social occasions.","subscale":"social_skill","reverse":false},{"n":45,"text":"S/he finds it difficult to work out people's intentions.","subscale":"social_skill","reverse":true},{"n":46,"text":"New situations make him/her anxious.","subscale":"attention_switching","reverse":true},{"n":47,"text":"S/he enjoys meeting new people.","subscale":"social_skill","reverse":false},{"n":48,"text":"S/he is good at taking care not to hurt other people's feelings.","subscale":"social_skill","reverse":false},{"n":49,"text":"S/he is not very good at remembering people's date of birth.","subscale":"attention_to_detail","reverse":false},{"n":50,"text":"S/he finds it very easy to play games with children that involve pretending.","subscale":"imagination","reverse":false}],"subscales":{"social_skill":{"name":"Social Skill","items":[1,11,13,15,22,36,44,45,47,48],"max":30},"attention_switching":{"name":"Attention Switching","items":[2,4,10,16,25,32,34,37,43,46],"max":30},"attention_to_detail":{"name":"Attention to Detail","items":[5,6,9,12,19,23,28,29,30,49],"max":30},"communication":{"name":"Communication","items":[7,17,18,26,27,31,33,35,38,39],"max":30},"imagination":{"name":"Imagination","items":[3,8,14,20,21,24,40,41,42,50],"max":30}},"norms":[{"group":"Control","sex":"all","n":1225,"total":{"mean":41.7,"sd":18.6},"subscales":{"communication":{"mean":8.2,"sd":5.0},"attention_to_detail":{"mean":8.7,"sd":4.5},"social":{"mean":7.0,"sd":5.0},"imagination":{"mean":7.0,"sd":4.6},"attention_switching":{"mean":10.9,"sd":5.1}}},{"group":"Control","sex":"male","n":607,"total":{"mean":45.7,"sd":20.0},"subscales":{"communication":{"mean":9.0,"sd":5.4},"attention_to_detail":{"mean":8.9,"sd":4.7},"social":{"mean":7.8,"sd":5.3},"imagination":{"mean":8.5,"sd":4.9},"attention_switching":{"mean":11.5,"sd":5.6}}},{"group":"Control","sex":"female","n":618,"total":{"mean":37.7,"sd":16.1},"subscales":{"communication":{"mean":7.4,"sd":4.4},"attention_to_detail":{"mean":8.5,"sd":4.4},"social":{"mean":6.1,"sd":4.6},"imagination":{"mean":5.5,"sd":3.7},"attention_switching":{"mean":10.3,"sd":4.6}}},{"group":"AS/HFA","sex":"all","n":348,"total":{"mean":104.8,"sd":15.6},"subscales":{"communication":{"mean":24.4,"sd":4.0},"attention_to_detail":{"mean":14.7,"sd":4.0},"social":{"mean":22.1,"sd":5.1},"imagination":{"mean":19.2,"sd":5.4},"attention_switching":{"mean":24.2,"sd":4.2}}},{"group":"AS/HFA","sex":"male","n":312,"total":{"mean":104.8,"sd":15.7},"subscales":{"communication":{"mean":24.4,"sd":4.0},"attention_to_detail":{"mean":14.9,"sd":4.0},"social":{"mean":21.9,"sd":5.1},"imagination":{"mean":19.4,"sd":5.2},"attention_switching":{"mean":24.2,"sd":4.2}}},{"group":"AS/HFA","sex":"female","n":36,"total":{"mean":104.7,"sd":15.7},"subscales":{"communication":{"mean":24.9,"sd":4.2},"attention_to_detail":{"mean":13.7,"sd":3.5},"social":{"mean":23.4,"sd":4.4},"imagination":{"mean":17.9,"sd":6.7},"attention_switching":{"mean":24.7,"sd":3.6}}},{"group":"Autism","sex":"all","n":192,"total":{"mean":103.0,"sd":16.3},"subscales":{"communication":{"mean":23.9,"sd":4.1},"attention_to_detail":{"mean":13.7,"sd":4.4},"social":{"mean":21.7,"sd":5.1},"imagination":{"mean":20.9,"sd":5.4},"attention_switching":{"mean":22.8,"sd":4.4,"source_printed_mean":10.9,"source_printed_sd":22.8,"flag":"probable_typo","flag_note":"Source prints 10.9 (22.8), a typo (10.9 = the Control mean; inconsistent with autistic boys 22.9 / girls 22.4). Mean corrected to 22.8; SD 4.4 derived by pooling boys (n=156, SD 4.2) + girls (n=36, SD 5.3), which sum to the All n of 192."}}},{"group":"Autism","sex":"male","n":156,"total":{"mean":103.6,"sd":15.1},"subscales":{"communication":{"mean":24.0,"sd":3.9},"attention_to_detail":{"mean":13.7,"sd":4.4},"social":{"mean":21.7,"sd":4.8},"imagination":{"mean":21.3,"sd":4.7},"attention_switching":{"mean":22.9,"sd":4.2}}},{"group":"Autism","sex":"female","n":36,"total":{"mean":100.2,"sd":20.8},"subscales":{"communication":{"mean":23.5,"sd":5.0},"attention_to_detail":{"mean":13.3,"sd":4.8},"social":{"mean":21.8,"sd":6.2},"imagination":{"mean":19.2,"sd":6.2},"attention_switching":{"mean":22.4,"sd":5.3}}}],"norms_subscale_order":["communication","attention_to_detail","social","imagination","attention_switching"],"cutoffs":[{"score":66,"recommended":false,"source":"Auyeung et al. 2008, Table 4","tier":"low","label":"low cut-off","sensitivity":0.99,"specificity":0.9,"pct_at_or_above":{"control_all":9.7,"control_female":4.7,"control_male":14.8,"as_hfa":98.9,"autism":99.5}},{"score":76,"recommended":true,"source":"Auyeung et al. 2008, Table 4","tier":"middle","label":"middle cut-off, recommended","sensitivity":0.95,"specificity":0.95,"pct_at_or_above":{"control_all":4.3,"control_female":1.6,"control_male":7.1,"as_hfa":95.1,"autism":94.8}},{"score":86,"recommended":false,"source":"Auyeung et al. 2008, Table 4","tier":"high","label":"high cut-off","sensitivity":0.86,"specificity":0.98,"pct_at_or_above":{"control_all":2.2,"control_female":1.0,"control_male":3.5,"as_hfa":87.1,"autism":82.8}}],"reliability":{"test_retest_r":0.85,"cronbach_alpha":{"whole":0.97,"social":0.93,"attention_to_detail":0.83,"attention_switching":0.89,"communication":0.92,"imagination":0.88}}}});

/* ── RMET — Reading the Mind in the Eyes Test (Revised) ────────────────────────
   Performance-based test: each item is an eye-region photograph + 4 mental-state
   words; the participant picks the word that best matches. Different shape from
   the questionnaires: items carry `image`, `options[]` and a `correct` index
   instead of agree/Likert responses; there are no subscales.

   Items, options and answer key are transcribed from Appendix A of the source
   paper (Baron-Cohen et al. 2001, J Child Psychol Psychiatry 42:241–252) and
   cross-checked against the canonical RMET-R key. Norms are from Table 3 of the
   same paper. Images: assets/rmet-images/image-000.jpg (practice) … image-036.jpg.
─────────────────────────────────────────────────────────────────────────── */
Object.assign(REGISTRY, {"rmet":{
  id:'rmet',
  name:'RMET',
  fullName:'Reading the Mind in the Eyes Test (Revised)',
  category:'social',
  status:'live',
  format:'image',                         // signals the image-based runner/scorer
  respondent:'Performance-based (direct)',
  ageRange:'16+ years',
  estMinutes:'10–15 min',
  description:'Emotion-recognition task: identify mental states from the eye region. Untimed; completion time is recorded.',
  citation:'Test: Baron-Cohen, Wheelwright, Hill, Raste & Plumb (2001), J Child Psychol Psychiatry 42(2):241–252. Group norms: Baron-Cohen, Bowen, Holt et al. (2015), PLoS ONE 10(8):e0136521 (autism n=395, controls n=320). Age/sex norms: Kynast et al. (2021).',
  higherMeans:'better complex-emotion recognition (note: lower scores are the clinical direction here)',
  verified:{ date:'2026-07-20', note:'All 36 items plus the practice item, their four options each, and the answer key (correct index) verified against Baron-Cohen et al. (2001). British spelling "sceptical" (item 12) kept by choice. Group norms (Baron-Cohen et al. 2015) and Kynast et al. (2021) age/sex percentiles previously verified in the norms log.' },
  scoring:{ type:'rmet', totalMax:36, chance:9 },
  imageBase:'assets/rmet-images/',
  practice:{ image:'image-000.jpg', options:['jealous','panicked','arrogant','hateful'], correct:1 },
  items:[
    {n:1,  image:'image-001.jpg', options:['playful','comforting','irritated','bored'],            correct:0},
    {n:2,  image:'image-002.jpg', options:['terrified','upset','arrogant','annoyed'],              correct:1},
    {n:3,  image:'image-003.jpg', options:['joking','flustered','desire','convinced'],             correct:2},
    {n:4,  image:'image-004.jpg', options:['joking','insisting','amused','relaxed'],               correct:1},
    {n:5,  image:'image-005.jpg', options:['irritated','sarcastic','worried','friendly'],          correct:2},
    {n:6,  image:'image-006.jpg', options:['aghast','fantasizing','impatient','alarmed'],          correct:1},
    {n:7,  image:'image-007.jpg', options:['apologetic','friendly','uneasy','dispirited'],         correct:2},
    {n:8,  image:'image-008.jpg', options:['despondent','relieved','shy','excited'],               correct:0},
    {n:9,  image:'image-009.jpg', options:['annoyed','hostile','horrified','preoccupied'],         correct:3},
    {n:10, image:'image-010.jpg', options:['cautious','insisting','bored','aghast'],               correct:0},
    {n:11, image:'image-011.jpg', options:['terrified','amused','regretful','flirtatious'],        correct:2},
    {n:12, image:'image-012.jpg', options:['indifferent','embarrassed','sceptical','dispirited'],  correct:2},
    {n:13, image:'image-013.jpg', options:['decisive','anticipating','threatening','shy'],         correct:1},
    {n:14, image:'image-014.jpg', options:['irritated','disappointed','depressed','accusing'],     correct:3},
    {n:15, image:'image-015.jpg', options:['contemplative','flustered','encouraging','amused'],    correct:0},
    {n:16, image:'image-016.jpg', options:['irritated','thoughtful','encouraging','sympathetic'],  correct:1},
    {n:17, image:'image-017.jpg', options:['doubtful','affectionate','playful','aghast'],          correct:0},
    {n:18, image:'image-018.jpg', options:['decisive','amused','aghast','bored'],                  correct:0},
    {n:19, image:'image-019.jpg', options:['arrogant','grateful','sarcastic','tentative'],         correct:3},
    {n:20, image:'image-020.jpg', options:['dominant','friendly','guilty','horrified'],            correct:1},
    {n:21, image:'image-021.jpg', options:['embarrassed','fantasizing','confused','panicked'],     correct:1},
    {n:22, image:'image-022.jpg', options:['preoccupied','grateful','insisting','imploring'],      correct:0},
    {n:23, image:'image-023.jpg', options:['contented','apologetic','defiant','curious'],          correct:2},
    {n:24, image:'image-024.jpg', options:['pensive','irritated','excited','hostile'],             correct:0},
    {n:25, image:'image-025.jpg', options:['panicked','incredulous','despondent','interested'],    correct:3},
    {n:26, image:'image-026.jpg', options:['alarmed','shy','hostile','anxious'],                   correct:2},
    {n:27, image:'image-027.jpg', options:['joking','cautious','arrogant','reassuring'],           correct:1},
    {n:28, image:'image-028.jpg', options:['interested','joking','affectionate','contented'],      correct:0},
    {n:29, image:'image-029.jpg', options:['impatient','aghast','irritated','reflective'],         correct:3},
    {n:30, image:'image-030.jpg', options:['grateful','flirtatious','hostile','disappointed'],     correct:1},
    {n:31, image:'image-031.jpg', options:['ashamed','confident','joking','dispirited'],           correct:1},
    {n:32, image:'image-032.jpg', options:['serious','ashamed','bewildered','alarmed'],            correct:0},
    {n:33, image:'image-033.jpg', options:['embarrassed','guilty','fantasizing','concerned'],      correct:3},
    {n:34, image:'image-034.jpg', options:['aghast','baffled','distrustful','terrified'],          correct:2},
    {n:35, image:'image-035.jpg', options:['puzzled','nervous','insisting','contemplative'],       correct:1},
    {n:36, image:'image-036.jpg', options:['ashamed','nervous','suspicious','indecisive'],         correct:2}
  ],
  norms:[
    {group:'General population controls', short:'Controls', sex:'all',    n:320, mean:26.53, sd:4.11, color:'var(--green)'},
    {group:'General population controls', sex:'male',   n:152, mean:25.54, sd:4.57},
    {group:'General population controls', sex:'female', n:168, mean:27.42, sd:3.43},
    {group:'Autism', short:'Autism', sex:'all',    n:395, mean:23.49, sd:6.87, color:'var(--rose)'},
    {group:'Autism', sex:'male',   n:178, mean:23.53, sd:6.64},
    {group:'Autism', sex:'female', n:217, mean:23.45, sd:7.06}
  ],
  /* Age- & sex-specific percentile ranks — Kynast et al. (2021), Front Aging Neurosci
     12:607107. German RMET (Bölte 2005), N=966 healthy adults, population-weighted to
     German demographics. Percentile-rank tables (their Table 3, p.7) by sex × five age
     bands; a percentile rank is the % scoring at or below that score (p.4). Scores with
     no published row are linearly interpolated at lookup and labelled as such. Below a
     cell's lowest row the rank is only known to be at or below that row's value, so no
     reference band is assigned. sampleMin: no one in the whole sample scored below 11
     (Fig. 2, p.6). Ages 20–79 only.
     German-version stimulus words differ from the English RMET-R, so treat as a close
     approximation for English administration, not an exact norm. */
  ageNorms:{
    source:'Kynast et al. (2021), Frontiers in Aging Neuroscience 12:607107. German RMET (Bölte 2005) standardization; N=966 healthy adults, population-weighted to German demographics.',
    caveat:'German-version standardization: the eye photographs are identical but the mental-state words are translated, so these percentiles are a close approximation for English administration. Covers ages 20–79 only.',
    bands:['20-29','30-39','40-49','50-59','60+'],
    sampleMin:11,
    // Table 3 prints two open-ended rows: men 60+ "≤12" (PR 1) and women 20-29
    // "≥32" (PR 98). They are stored under keys 12 and 32; these flags make any
    // score at or below 12 / at or above 32 in those cells take that row.
    openRows:{ male:{'60+':{le:12}}, female:{'20-29':{ge:32}} },
    groupMeans:{'20-29':{mean:26.0,sd:3.2,n:138},'30-39':{mean:24.7,sd:3.2,n:144},'40-49':{mean:24.1,sd:3.3,n:177},'50-59':{mean:23.4,sd:3.2,n:180},'60+':{mean:22.4,sd:3.8,n:327}},
    sexMeans:{male:{mean:23.4,sd:3.6,n:469},female:{mean:24.1,sd:3.7,n:497}},
    pctile:{
      male:{
        '20-29':{30:98,29:92,28:84,27:72,26:63,25:46,24:41,23:34,22:23,20:12},
        '30-39':{30:98,29:94,28:91,27:88,26:77,25:58,24:50,23:37,22:24,21:15,20:9,19:6,17:1},
        '40-49':{29:98,28:94,27:85,26:78,25:72,24:61,23:47,22:32,21:25,20:20,19:12,18:10,17:8,16:3,15:1},
        '50-59':{28:95,27:91,26:82,25:73,24:63,23:53,21:30,20:15,19:12,18:6,17:4,15:2},
        '60+':{30:99,29:98,28:97,27:92,26:89,25:82,24:72,23:58,22:49,21:38,20:29,19:21,18:15,17:11,16:8,15:6,14:5,13:4,12:1}
      },
      female:{
        '20-29':{32:98,31:96,30:89,29:70,28:66,27:47,26:40,25:33,24:29,23:19,22:15},
        '30-39':{31:98,29:96,28:82,27:74,26:56,25:47,23:41,21:19,20:15,19:5},
        '40-49':{29:92,28:87,27:80,26:74,25:51,24:42,23:32,22:21,21:16,20:10,18:3,17:1},
        '50-59':{30:97,28:94,26:88,25:69,24:63,23:47,22:41,21:33,20:19,19:11,18:5},
        '60+':{30:99,29:97,28:95,27:92,26:85,25:79,24:70,23:58,22:46,21:36,20:26,19:17,18:13,17:9,16:7,15:4,14:2,13:1}
      }
    }
  },
  report:{caveat:"A large psychometric study (Higgins et al. 2026, Assessment) found poor structural and psychometric properties for the RMET across nine large non-clinical samples. Treat results as informative about complex-emotion recognition tendencies only, not as a validated dimensional score, and never as diagnostic."},
  notes:[
    "Performance-based: the score is the number of items answered correctly (0–36).",
    "Chance performance is 9/36 (four options per item). Scores near chance suggest difficulty, disengagement, or guessing.",
    "Lower scores are the clinical direction (the opposite of the questionnaire measures): autistic adults scored lower than controls in the validation study.",
    "The test is administered UNTIMED. Completion time is captured for descriptive context only and has no validated norms.",
    "The ARC word-definition handout is available on every item through the Word meanings button, as the official instructions allow (\"look it up in the definition handout\")."
  ]
}});
/* ARC word-definition handout for the adult RMET (sources/_forms/autism/RMET/
   RMET-adult_instructions_ARC.pdf): definition (d) and example sentence (e) for
   93 words. The handout has no entry for bored, shy or excited. */
REGISTRY.rmet.glossary = {"accusing":{"d":"blaming","e":"The policeman was accusing the man of stealing a wallet."},"affectionate":{"d":"showing fondness towards someone","e":"Most mothers are affectionate to their babies by giving them lots of kisses and cuddles."},"aghast":{"d":"horrified, astonished, alarmed","e":"Jane was aghast when she discovered her house had been burgled."},"alarmed":{"d":"fearful, worried, filled with anxiety","e":"Claire was alarmed when she thought she was being followed home."},"amused":{"d":"finding something funny","e":"I was amused by a funny joke someone told me."},"annoyed":{"d":"irritated, displeased","e":"Jack was annoyed when he found out he had missed the last bus home."},"anticipating":{"d":"expecting","e":"At the start of the football match, the fans were anticipating a quick goal."},"anxious":{"d":"worried, tense, uneasy","e":"The student was feeling anxious before taking her final exams."},"apologetic":{"d":"feeling sorry","e":"The waiter was very apologetic when he spilt soup all over the customer."},"arrogant":{"d":"conceited, self-important, having a big opinion of oneself","e":"The arrogant man thought he knew more about politics than everyone else in the room."},"ashamed":{"d":"overcome with shame or guilt","e":"The boy felt ashamed when his mother discovered him stealing money from her purse."},"assertive":{"d":"confident, dominant, sure of oneself","e":"The assertive woman demanded that the shop give her a refund."},"baffled":{"d":"confused, puzzled, dumbfounded","e":"The detectives were completely baffled by the murder case."},"bewildered":{"d":"utterly confused, puzzled, dazed","e":"The child was bewildered when visiting the big city for the first time."},"cautious":{"d":"careful, wary","e":"Sarah was always a bit cautious when talking to someone she did not know."},"comforting":{"d":"consoling, compassionate","e":"The nurse was comforting the wounded soldier."},"concerned":{"d":"worried, troubled","e":"The doctor was concerned when his patient took a turn for the worse."},"confident":{"d":"self-assured, believing in oneself","e":"The tennis player was feeling very confident about winning his match."},"confused":{"d":"puzzled, perplexed","e":"Lizzie was so confused by the directions given to her, she got lost."},"contemplative":{"d":"reflective, thoughtful, considering","e":"John was in a contemplative mood on the eve of his 60th birthday."},"contented":{"d":"satisfied","e":"After a nice walk and a good meal, David felt very contented."},"convinced":{"d":"certain, absolutely positive","e":"Richard was convinced he had come to the right decision."},"curious":{"d":"inquisitive, inquiring, prying","e":"Louise was curious about the strange shaped parcel."},"deciding":{"d":"making your mind up","e":"The man was deciding whom to vote for in the election."},"decisive":{"d":"already made your mind up","e":"Jane looked very decisive as she walked into the polling station."},"defiant":{"d":"insolent, bold, dont care what anyone else thinks","e":"The animal protester remained defiant even after being sent to prison."},"depressed":{"d":"miserable","e":"George was depressed when he didn't receive any birthday cards."},"desire":{"d":"passion, lust, longing for","e":"Kate had a strong desire for chocolate."},"despondent":{"d":"gloomy, despairing, without hope","e":"Gary was despondent when he did not get the job he wanted."},"disappointed":{"d":"displeased, disgruntled","e":"Manchester United fans were disappointed not to win the Championship."},"dispirited":{"d":"glum, miserable, low","e":"Adam was dispirited when he failed his exams."},"distrustful":{"d":"suspicious, doubtful, wary","e":"The old woman was distrustful of the stranger at her door."},"dominant":{"d":"commanding, bossy","e":"The sergeant major looked dominant as he inspected the new recruits."},"doubtful":{"d":"dubious, suspicious, not really believing","e":"Mary was doubtful that her son was telling the truth."},"dubious":{"d":"doubtful, suspicious","e":"Peter was dubious when offered a surprisingly cheap television in a pub."},"eager":{"d":"keen","e":"On Christmas morning, the children were eager to open their presents."},"earnest":{"d":"having a serious intention","e":"Harry was very earnest about his religious beliefs."},"embarrassed":{"d":"ashamed","e":"After forgetting a colleague's name, Jenny felt very embarrassed."},"encouraging":{"d":"hopeful, heartening, supporting","e":"All the parents were encouraging their children in the school sports day."},"entertained":{"d":"absorbed and amused or pleased by something","e":"I was very entertained by the magician."},"enthusiastic":{"d":"very eager, keen","e":"Susan felt very enthusiastic about her new fitness plan."},"fantasizing":{"d":"daydreaming","e":"Emma was fantasizing about being a film star."},"fascinated":{"d":"captivated, really interested","e":"At the seaside, the children were fascinated by the creatures in the rock pools."},"fearful":{"d":"terrified, worried","e":"In the dark streets, the women felt fearful."},"flirtatious":{"d":"brazen, saucy, teasing, playful","e":"Connie was accused of being flirtatious when she winked at a stranger at a party."},"flustered":{"d":"confused, nervous and upset","e":"Sarah felt a bit flustered when she realised how late she was for the meeting and that she had forgotten an important document."},"friendly":{"d":"sociable, amiable","e":"The friendly girl showed the tourists the way to the town centre."},"grateful":{"d":"thankful","e":"Kelly was very grateful for the kindness shown by the stranger."},"guilty":{"d":"feeling sorry for doing something wrong","e":"Charlie felt guilty about having an affair."},"hateful":{"d":"showing intense dislike","e":"The two sisters were hateful to each other and always fighting."},"hopeful":{"d":"optimistic","e":"Larry was hopeful that the post would bring good news."},"horrified":{"d":"terrified, appalled","e":"The man was horrified to discover that his new wife was already married."},"hostile":{"d":"unfriendly","e":"The two neighbours were hostile towards each other because of an argument about loud music."},"impatient":{"d":"restless, wanting something to happen soon","e":"Jane grew increasingly impatient as she waited for her friend who was already 20 minutes late."},"imploring":{"d":"begging, pleading","e":"Nicola looked imploring as she tried to persuade her dad to lend her the car."},"incredulous":{"d":"not believing","e":"Simon was incredulous when he heard that he had won the lottery."},"indecisive":{"d":"unsure, hesitant, unable to make your mind up","e":"Tammy was so indecisive that she couldn't even decide what to have for lunch."},"indifferent":{"d":"disinterested, unresponsive, don't care","e":"Terry was completely indifferent as to whether they went to the cinema or the pub."},"insisting":{"d":"demanding, persisting, maintaining","e":"After a work outing, Frank was insisting he paid the bill for everyone."},"insulting":{"d":"rude, offensive","e":"The football crowd was insulting the referee after he gave a penalty."},"interested":{"d":"inquiring, curious","e":"After seeing Jurassic Park, Hugh grew very interested in dinosaurs."},"intrigued":{"d":"very curious, very interested","e":"A mystery phone call intrigued Zoe."},"irritated":{"d":"exasperated, annoyed","e":"Frances was irritated by all the junk mail she received."},"jealous":{"d":"envious","e":"Tony was jealous of all the taller, better-looking boys in his class."},"joking":{"d":"being funny, playful","e":"Gary was always joking with his friends."},"nervous":{"d":"apprehensive, tense, worried","e":"Just before her job interview, Alice felt very nervous."},"offended":{"d":"insulted, wounded, having hurt feelings","e":"When someone made a joke about her weight, Martha felt very offended."},"panicked":{"d":"distraught, feeling of terror or anxiety","e":"On waking to find the house on fire, the whole family was panicked."},"pensive":{"d":"thinking about something slightly worrying","e":"Susie looked pensive on the way to meeting her boyfriend's parents for the first time."},"perplexed":{"d":"bewildered, puzzled, confused","e":"Frank was perplexed by the disappearance of his garden gnomes."},"playful":{"d":"full of high spirits and fun","e":"Neil was feeling playful at his birthday party."},"preoccupied":{"d":"absorbed, engrossed in one's own thoughts","e":"Worrying about her mother's illness made Debbie preoccupied at work"},"puzzled":{"d":"perplexed, bewildered, confused","e":"After doing the crossword for an hour, June was still puzzled by one clue."},"reassuring":{"d":"supporting, encouraging, giving someone confidence","e":"Andy tried to look reassuring as he told his wife that her new dress did suit her."},"reflective":{"d":"contemplative, thoughtful","e":"George was in a reflective mood as he thought about what he'd done with his life."},"regretful":{"d":"sorry","e":"Lee was always regretful that he had never travelled when he was younger."},"relaxed":{"d":"taking it easy, calm, carefree","e":"On holiday, Pam felt happy and relaxed."},"relieved":{"d":"freed from worry or anxiety","e":"At the restaurant, Ray was relieved to find that he had not forgotten his wallet."},"resentful":{"d":"bitter, hostile","e":"The businessman felt very resentful towards his younger colleague who had been promoted above him."},"sarcastic":{"d":"cynical, mocking, scornful","e":"The comedian made a sarcastic comment when someone came into the theatre late."},"satisfied":{"d":"content, fulfilled","e":"Steve felt very satisfied after he had got his new flat just how he wanted it."},"sceptical":{"d":"doubtful, suspicious, mistrusting","e":"Patrick looked sceptical as someone read out his horoscope to him."},"serious":{"d":"solemn, grave","e":"The bank manager looked serious as he refused Nigel an overdraft."},"stern":{"d":"severe, strict, firm","e":"The teacher looked very stern as he told the class off."},"suspicious":{"d":"disbelieving, suspecting, doubting","e":"After Sam had lost his wallet for the second time at work, he grew suspicious of one of his colleagues."},"sympathetic":{"d":"kind, compassionate","e":"The nurse looked sympathetic as she told the patient the bad news."},"tentative":{"d":"hesitant, uncertain, cautious","e":"Andrew felt a bit tentative as he went into the room full of strangers."},"terrified":{"d":"alarmed, fearful","e":"The boy was terrified when he thought he saw a ghost."},"thoughtful":{"d":"thinking about something","e":"Phil looked thoughtful as he sat waiting for the girlfriend he was about to finish with."},"threatening":{"d":"menacing, intimidating","e":"The large, drunken man was acting in a very threatening way."},"uneasy":{"d":"unsettled, apprehensive, troubled","e":"Karen felt slightly uneasy about accepting a lift from the man she had only met that day."},"upset":{"d":"agitated, worried, uneasy","e":"The man was very upset when his mother died."},"worried":{"d":"anxious, fretful, troubled","e":"When her cat went missing, the girl was very worried."}};

/* ── NICHQ Vanderbilt Assessment Scales (Parent + Teacher) ─────────────────────
   ADHD + ODD / Conduct / Anxiety-Depression screens. Free for clinical use
   (American Academy of Pediatrics & NICHQ, 2002). Items transcribed from the
   clinic's own forms; scoring cut-offs verified against the official AAP/NICHQ
   "Scoring Instructions for the NICHQ Vanderbilt Assessment Scales" (2002).

   New scoring type 'vanderbilt' (symptom counting + performance impairment) and
   per-item response sets: symptom items are 0–3 (Never…Very often); performance
   items are 1–5 (Excellent…Problematic, 4–5 = impairment). Screening only.
─────────────────────────────────────────────────────────────────────────── */
const VANDERBILT_OPTION_SETS = {
  symptom: [
    {label:'Never', v:0},
    {label:'Occasionally', v:1},
    {label:'Often', v:2},
    {label:'Very often', v:3}
  ],
  performance: [
    {label:'Excellent', v:1},
    {label:'Above average', v:2},
    {label:'Average', v:3},
    {label:'Somewhat of a problem', v:4},
    {label:'Problematic', v:5}
  ]
};
function vandRange(a,b){ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; }

Object.assign(REGISTRY, {"vand_parent":{
  id:'vand_parent',
  name:'Vanderbilt (parent)',
  fullName:'NICHQ Vanderbilt Assessment Scale (parent informant)',
  category:'adhd',
  status:'live',
  respondent:'Parent / carer report',
  informantKind:'childhood',
  informantHelp:'An ADHD rating scale, best completed by a parent or carer who has known {subject} since childhood.',
  ageRange:'6–12 years',
  estMinutes:'8–12 min',
  description:'Parent-report ADHD screen with oppositional-defiant, conduct, and anxiety/depression screens, plus performance.',
  citation:'Wolraich ML et al.; American Academy of Pediatrics & NICHQ (2002). NICHQ Vanderbilt Assessment Scales.',
  higherMeans:'more ADHD / behavioural symptoms',
  scoring:{ type:'vanderbilt', optionSets:VANDERBILT_OPTION_SETS, symptomPositive:[2,3], performanceImpair:[4,5] },
  report:{caveat:'NICHQ Vanderbilt scores must be combined with a clinical interview and history. Best practice is to gather both parent and teacher reports. A single informant is not sufficient. Against a structured interview, the parent ODD, conduct and anxiety/depression screens rarely flag children without the disorder (specificity .88, .96 and .88) but miss many who have it (sensitivity .77, .67 and .46; Becker et al. 2012), so a negative screen does not rule these out.'},
  items:[
    {n:1,  optionSet:'symptom', text:'Does not pay attention to details or makes careless mistakes with, for example, homework'},
    {n:2,  optionSet:'symptom', text:'Has difficulty keeping attention to what needs to be done'},
    {n:3,  optionSet:'symptom', text:'Does not seem to listen when spoken to directly'},
    {n:4,  optionSet:'symptom', text:'Does not follow through when given directions and fails to finish activities (not due to refusal or failure to understand)'},
    {n:5,  optionSet:'symptom', text:'Has difficulty organising tasks and activities'},
    {n:6,  optionSet:'symptom', text:'Avoids, dislikes, or does not want to start tasks that require ongoing mental effort'},
    {n:7,  optionSet:'symptom', text:'Loses things necessary for tasks or activities (toys, assignments, pencils, or books)'},
    {n:8,  optionSet:'symptom', text:'Is easily distracted by noises or other stimuli'},
    {n:9,  optionSet:'symptom', text:'Is forgetful in daily activities'},
    {n:10, optionSet:'symptom', text:'Fidgets with hands or feet or squirms in seat'},
    {n:11, optionSet:'symptom', text:'Leaves seat when remaining seated is expected'},
    {n:12, optionSet:'symptom', text:'Runs about or climbs too much when remaining seated is expected'},
    {n:13, optionSet:'symptom', text:'Has difficulty playing or beginning quiet play activities'},
    {n:14, optionSet:'symptom', text:'Is “on the go” or often acts as if “driven by a motor”'},
    {n:15, optionSet:'symptom', text:'Talks too much'},
    {n:16, optionSet:'symptom', text:'Blurts out answers before questions have been completed'},
    {n:17, optionSet:'symptom', text:'Has difficulty waiting his or her turn'},
    {n:18, optionSet:'symptom', text:'Interrupts or intrudes in on others’ conversations and/or activities'},
    {n:19, optionSet:'symptom', text:'Argues with adults'},
    {n:20, optionSet:'symptom', text:'Loses temper'},
    {n:21, optionSet:'symptom', text:'Actively defies or refuses to go along with adults’ requests or rules'},
    {n:22, optionSet:'symptom', text:'Deliberately annoys people'},
    {n:23, optionSet:'symptom', text:'Blames others for his or her mistakes or misbehaviours'},
    {n:24, optionSet:'symptom', text:'Is touchy or easily annoyed by others'},
    {n:25, optionSet:'symptom', text:'Is angry or resentful'},
    {n:26, optionSet:'symptom', text:'Is spiteful and wants to get even'},
    {n:27, optionSet:'symptom', text:'Bullies, threatens, or intimidates others'},
    {n:28, optionSet:'symptom', text:'Starts physical fights'},
    {n:29, optionSet:'symptom', text:'Lies to get out of trouble or to avoid obligations (i.e., “cons” others)'},
    {n:30, optionSet:'symptom', text:'Is truant from school (skips school) without permission'},
    {n:31, optionSet:'symptom', text:'Is physically cruel to people'},
    {n:32, optionSet:'symptom', text:'Has stolen things that have value'},
    {n:33, optionSet:'symptom', text:'Deliberately destroys others’ property'},
    {n:34, optionSet:'symptom', text:'Has used a weapon that can cause serious harm (bat, knife, brick, gun)'},
    {n:35, optionSet:'symptom', text:'Is physically cruel to animals'},
    {n:36, optionSet:'symptom', text:'Has deliberately set fires to cause damage'},
    {n:37, optionSet:'symptom', text:'Has broken into someone else’s home, business, or car'},
    {n:38, optionSet:'symptom', text:'Has stayed out at night without permission'},
    {n:39, optionSet:'symptom', text:'Has run away from home overnight'},
    {n:40, optionSet:'symptom', text:'Has forced someone into sexual activity'},
    {n:41, optionSet:'symptom', text:'Is fearful, anxious, or worried'},
    {n:42, optionSet:'symptom', text:'Is afraid to try new things for fear of making mistakes'},
    {n:43, optionSet:'symptom', text:'Feels worthless or inferior'},
    {n:44, optionSet:'symptom', text:'Blames self for problems, feels guilty'},
    {n:45, optionSet:'symptom', text:'Feels lonely, unwanted, or unloved; complains that “no one loves him or her”'},
    {n:46, optionSet:'symptom', text:'Is sad, unhappy, or depressed'},
    {n:47, optionSet:'symptom', text:'Is self-conscious or easily embarrassed'},
    {n:48, optionSet:'performance', text:'Overall school performance'},
    {n:49, optionSet:'performance', text:'Reading'},
    {n:50, optionSet:'performance', text:'Writing'},
    {n:51, optionSet:'performance', text:'Mathematics'},
    {n:52, optionSet:'performance', text:'Relationship with parents'},
    {n:53, optionSet:'performance', text:'Relationship with siblings'},
    {n:54, optionSet:'performance', text:'Relationship with peers'},
    {n:55, optionSet:'performance', text:'Participation in organized activities (e.g. teams)'}
  ],
  performanceItems: vandRange(48,55),
  totalSymptomItems: vandRange(1,18),
  screens:[
    {key:'inattentive', name:'Predominantly Inattentive', items:vandRange(1,9),   need:6, requiresImpairment:true},
    {key:'hyperactive', name:'Hyperactive / Impulsive',   items:vandRange(10,18), need:6, requiresImpairment:true},
    {key:'odd',         name:'Oppositional-Defiant screen',items:vandRange(19,26), need:4, requiresImpairment:true},
    {key:'conduct',     name:'Conduct Disorder screen',    items:vandRange(27,40), need:3, requiresImpairment:true},
    {key:'anxdep',      name:'Anxiety / Depression screen', items:vandRange(41,47), need:3, requiresImpairment:true}
  ]
},"vand_teacher":{
  id:'vand_teacher',
  name:'Vanderbilt (teacher)',
  fullName:'NICHQ Vanderbilt Assessment Scale (teacher informant)',
  category:'adhd',
  status:'live',
  respondent:'Teacher / staff report',
  informantKind:'teacher',
  informantHelp:'An ADHD rating scale, best completed by a teacher or someone from school who knows {subject} well.',
  ageRange:'6–12 years',
  estMinutes:'6–10 min',
  description:'Teacher-report ADHD screen with a combined oppositional/conduct screen, anxiety/depression screen, and classroom performance.',
  citation:'Wolraich ML et al.; American Academy of Pediatrics & NICHQ (2002). NICHQ Vanderbilt Assessment Scales.',
  higherMeans:'more ADHD / behavioural symptoms',
  scoring:{ type:'vanderbilt', optionSets:VANDERBILT_OPTION_SETS, symptomPositive:[2,3], performanceImpair:[4,5] },
  report:{caveat:'NICHQ Vanderbilt scores must be combined with a clinical interview and history. Best practice is to gather both parent and teacher reports. A single informant is not sufficient.'},
  items:[
    {n:1,  optionSet:'symptom', text:'Fails to give attention to details or makes careless mistakes in school work'},
    {n:2,  optionSet:'symptom', text:'Has difficulty sustaining attention to tasks or activities'},
    {n:3,  optionSet:'symptom', text:'Does not seem to listen when spoken to directly'},
    {n:4,  optionSet:'symptom', text:'Does not follow through on instructions and fails to finish schoolwork (not due to oppositional behavior or failure to understand)'},
    {n:5,  optionSet:'symptom', text:'Has difficulty organizing tasks and activities'},
    {n:6,  optionSet:'symptom', text:'Avoids, dislikes, or is reluctant to engage in tasks that require sustained mental effort'},
    {n:7,  optionSet:'symptom', text:'Loses things necessary for tasks or activities (school assignments, pencils, or books)'},
    {n:8,  optionSet:'symptom', text:'Is easily distracted by extraneous stimuli'},
    {n:9,  optionSet:'symptom', text:'Is forgetful in daily activities'},
    {n:10, optionSet:'symptom', text:'Fidgets with hands or feet or squirms in seat'},
    {n:11, optionSet:'symptom', text:'Leaves seat in classroom or in other situations in which remaining seated is expected'},
    {n:12, optionSet:'symptom', text:'Runs about or climbs excessively in situations in which remaining seated is expected'},
    {n:13, optionSet:'symptom', text:'Has difficulty playing or engaging in leisure activities quietly'},
    {n:14, optionSet:'symptom', text:'Is “on the go” or often acts as if “driven by a motor”'},
    {n:15, optionSet:'symptom', text:'Talks excessively'},
    {n:16, optionSet:'symptom', text:'Blurts out answers before questions have been completed'},
    {n:17, optionSet:'symptom', text:'Has difficulty waiting in line'},
    {n:18, optionSet:'symptom', text:'Interrupts or intrudes on others (e.g. butts into conversations/games)'},
    {n:19, optionSet:'symptom', text:'Loses temper'},
    {n:20, optionSet:'symptom', text:'Actively defies or refuses to comply with adult’s requests or rules'},
    {n:21, optionSet:'symptom', text:'Is angry or resentful'},
    {n:22, optionSet:'symptom', text:'Is spiteful and vindictive'},
    {n:23, optionSet:'symptom', text:'Bullies, threatens, or intimidates others'},
    {n:24, optionSet:'symptom', text:'Initiates physical fights'},
    {n:25, optionSet:'symptom', text:'Lies to obtain goods for favors or to avoid obligations (e.g. “cons” others)'},
    {n:26, optionSet:'symptom', text:'Is physically cruel to people'},
    {n:27, optionSet:'symptom', text:'Has stolen items of nontrivial value'},
    {n:28, optionSet:'symptom', text:'Deliberately destroys others’ property'},
    {n:29, optionSet:'symptom', text:'Is fearful, anxious, or worried'},
    {n:30, optionSet:'symptom', text:'Is self-conscious or easily embarrassed'},
    {n:31, optionSet:'symptom', text:'Is afraid to try new things for fear of making mistakes'},
    {n:32, optionSet:'symptom', text:'Feels worthless or inferior'},
    {n:33, optionSet:'symptom', text:'Blames self for problems; feels guilty'},
    {n:34, optionSet:'symptom', text:'Feels lonely, unwanted, or unloved; complains that “no one loves him or her”'},
    {n:35, optionSet:'symptom', text:'Is sad, unhappy, or depressed'},
    {n:36, optionSet:'performance', text:'Reading'},
    {n:37, optionSet:'performance', text:'Mathematics'},
    {n:38, optionSet:'performance', text:'Written expression'},
    {n:39, optionSet:'performance', text:'Relationship with peers'},
    {n:40, optionSet:'performance', text:'Following directions'},
    {n:41, optionSet:'performance', text:'Disrupting class'},
    {n:42, optionSet:'performance', text:'Assignment completion'},
    {n:43, optionSet:'performance', text:'Organizational skills'}
  ],
  performanceItems: vandRange(36,43),
  totalSymptomItems: vandRange(1,18),
  screens:[
    {key:'inattentive',  name:'Predominantly Inattentive', items:vandRange(1,9),   need:6, requiresImpairment:true},
    {key:'hyperactive',  name:'Hyperactive / Impulsive',   items:vandRange(10,18), need:6, requiresImpairment:true},
    {key:'odd_conduct',  name:'Oppositional-Defiant / Conduct screen', items:vandRange(19,28), need:3, requiresImpairment:true},
    {key:'anxdep',       name:'Anxiety / Depression screen', items:vandRange(29,35), need:3, requiresImpairment:true}
  ]
}});

/* ── SNAP-IV 26 — Swanson, Nolan and Pelham Rating Scale (26-item) ──────────────
   The abbreviated SNAP: DSM ADHD Inattention (items 1–9) and Hyperactivity/
   Impulsivity (10–18), plus Oppositional-Defiant (19–26). Each item rated 0–3
   (Not at all…Very much). Scored as three subset SUMS, each mapped to a severity
   band (not significant / mild / moderate / severe) with a suggested "target"
   cut-off at or above which symptoms are treated as clinically significant
   (Swanson 1992; scoring guide supplied with the form). The same 26 items are
   used for the parent and teacher informant forms. Freely available for clinical
   use. New scoring type 'snap'. Validated roughly ages 6–18, which extends ADHD
   informant coverage past the Vanderbilt (6–12) into the teen range. Screening
   only — never diagnostic on its own.
─────────────────────────────────────────────────────────────────────────── */
function snapRange(a,b){ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; }
const SNAP_OPTIONS = [
  {label:'Not at all'}, {label:'Just a little'}, {label:'Quite a bit'}, {label:'Very much'}
];
// 1–9 Inattention · 10–18 Hyperactivity/Impulsivity · 19–26 Opposition/Defiance
const SNAP_ITEMS = [
  {n:1,  text:'Often fails to give close attention to details or makes careless mistakes in schoolwork or tasks'},
  {n:2,  text:'Often has difficulty sustaining attention in tasks or play activities'},
  {n:3,  text:'Often does not seem to listen when spoken to directly'},
  {n:4,  text:'Often does not follow through on instructions and fails to finish schoolwork, chores, or duties'},
  {n:5,  text:'Often has difficulty organising tasks and activities'},
  {n:6,  text:'Often avoids, dislikes, or reluctantly engages in tasks requiring sustained mental effort'},
  {n:7,  text:'Often loses things necessary for activities (e.g. toys, school assignments, pencils, or books)'},
  {n:8,  text:'Often is distracted by extraneous stimuli'},
  {n:9,  text:'Often is forgetful in daily activities'},
  {n:10, text:'Often fidgets with hands or feet or squirms in seat'},
  {n:11, text:'Often leaves seat in classroom or in other situations in which remaining seated is expected'},
  {n:12, text:'Often runs about or climbs excessively in situations in which it is inappropriate'},
  {n:13, text:'Often has difficulty playing or engaging in leisure activities quietly'},
  {n:14, text:'Often is "on the go" or often acts as if "driven by a motor"'},
  {n:15, text:'Often talks excessively'},
  {n:16, text:'Often blurts out answers before questions have been completed'},
  {n:17, text:'Often has difficulty awaiting turn'},
  {n:18, text:'Often interrupts or intrudes on others (e.g. butts into conversations or games)'},
  {n:19, text:'Often loses temper'},
  {n:20, text:'Often argues with adults'},
  {n:21, text:'Often actively defies or refuses adult requests or rules'},
  {n:22, text:'Often deliberately does things that annoy other people'},
  {n:23, text:'Often blames others for his or her mistakes or misbehaviour'},
  {n:24, text:'Often is touchy or easily annoyed by others'},
  {n:25, text:'Often is angry and resentful'},
  {n:26, text:'Often is spiteful or vindictive'}
];
const SNAP_BANDS_27 = [   // 9-item subsets, max 27
  {max:12,   label:'Not clinically significant', cls:'band-typical'},
  {max:17,   label:'Mild',     cls:'band-elevated'},
  {max:22,   label:'Moderate', cls:'band-elevated'},
  {max:null, label:'Severe',   cls:'band-high'}
];
const SNAP_BANDS_24 = [   // 8-item ODD subset, max 24
  {max:7,    label:'Not clinically significant', cls:'band-typical'},
  {max:13,   label:'Mild',     cls:'band-elevated'},
  {max:18,   label:'Moderate', cls:'band-elevated'},
  {max:null, label:'Severe',   cls:'band-high'}
];
const SNAP_SUBSETS = [
  {key:'inattention', name:'Inattention',                 items:snapRange(1,9),   max:27, target:13, bands:SNAP_BANDS_27},
  {key:'hyperactive', name:'Hyperactivity / Impulsivity', items:snapRange(10,18), max:27, target:13, bands:SNAP_BANDS_27},
  {key:'odd',         name:'Opposition / Defiance',       items:snapRange(19,26), max:24, target:8,  bands:SNAP_BANDS_24}
];
const SNAP_SCORING = { type:'snap', options:SNAP_OPTIONS, subsets:SNAP_SUBSETS, adhdItems:snapRange(1,18), totalMax:54 };
/* Swanson's own scoring sheet (SNAP-IV-C instructions, adhd.net, archived
   2000-08-23; sources/_forms/adhd/SNAP-IV): "Tentative 5% Cutoffs" on the
   item mean (subset sum / items), separate for teachers and parents. Shown
   alongside the sum bands, not used for the colour (Ryan, 2026-10-01). */
const SNAP_SWANSON_SRC = 'Swanson JM, Scoring Instructions for the SNAP-IV-C Rating Scale (adhd.net, archived 2000): tentative 5% cut-offs on the average rating per item.';
const SNAP_CAVEAT = 'The SNAP-IV is a screening aid, not a diagnostic test. Scores must be combined with a clinical interview and developmental history. Best practice is to gather ratings from more than one setting, for example a parent and a teacher. A single informant is not sufficient.';

Object.assign(REGISTRY, {"snap_parent":{
  id:'snap_parent',
  name:'SNAP-IV (parent)',
  fullName:'Swanson, Nolan and Pelham Rating Scale, 26-item (parent report)',
  category:'adhd',
  status:'live',
  respondent:'Parent / carer report',
  informantKind:'childhood',
  informantHelp:'An ADHD and oppositional-behaviour rating scale, best completed by a parent or carer who knows {subject} well.',
  ageRange:'6–18 years',
  estMinutes:'5–10 min',
  description:'Parent-report ADHD screen (DSM inattention and hyperactivity/impulsivity) with an oppositional-defiant subset. Spans primary and secondary age.',
  citation:'Swanson JM (1992). School-Based Assessments and Interventions for ADD Students; Bussing R et al. (2008) SNAP-IV psychometrics, Assessment 15(3):317–328.',
  licence:'The SNAP-IV is freely available for clinical and research use (J.M. Swanson).',
  higherMeans:'more ADHD / oppositional symptoms',
  swanson5pct:{ who:'parents', inattention:1.78, hyperactive:1.44, combined:1.67, odd:1.88, source:SNAP_SWANSON_SRC },
  verified:{ date:'2026-07-21', note:'All 26 items, the four response anchors (0–3), the three subset allocations (1–9 / 10–18 / 19–26), the severity bands (13/18/23 of 27; 8/14/19 of 24) and the suggested targets (13, 13, 8) checked against the SNAP-IV 26-item form and scoring guide (OHSU copy, PDF dated 2022; the same table circulates on other clinic sites, and the earlier "2023" date could not be traced). 2026-10-01: Swanson’s own informant-specific 5% item-mean cut-offs added alongside, from his SNAP-IV-C scoring instructions (adhd.net, archived 2000). Items cross-checked against the official Swanson 18-item form (items 1–18 identical). Deliberate Anglicisation of item 5 ("organising"); items 7 and 18 close a parenthesis the source leaves open. No normative tables in the app.' },
  scoring:SNAP_SCORING,
  report:{caveat:SNAP_CAVEAT},
  items:SNAP_ITEMS
},"snap_teacher":{
  id:'snap_teacher',
  name:'SNAP-IV (teacher)',
  fullName:'Swanson, Nolan and Pelham Rating Scale, 26-item (teacher report)',
  category:'adhd',
  status:'live',
  respondent:'Teacher / staff report',
  informantKind:'teacher',
  informantHelp:'An ADHD and oppositional-behaviour rating scale, best completed by a teacher or someone from school who knows {subject} well.',
  ageRange:'6–18 years',
  estMinutes:'5–10 min',
  description:'Teacher-report ADHD screen (DSM inattention and hyperactivity/impulsivity) with an oppositional-defiant subset. Spans primary and secondary age.',
  citation:'Swanson JM (1992). School-Based Assessments and Interventions for ADD Students; Bussing R et al. (2008) SNAP-IV psychometrics, Assessment 15(3):317–328.',
  licence:'The SNAP-IV is freely available for clinical and research use (J.M. Swanson).',
  higherMeans:'more ADHD / oppositional symptoms',
  swanson5pct:{ who:'teachers', inattention:2.56, hyperactive:1.78, combined:2.00, odd:1.38, source:SNAP_SWANSON_SRC },
  verified:{ date:'2026-07-21', note:'Same 26 items, anchors, subsets, severity bands and targets as the verified parent form; the source scoring guide is titled for both teacher and parent, and the official Swanson 18-item form is a combined teacher-and-parent scale, so the shared item set is source-faithful for the teacher informant too.' },
  scoring:SNAP_SCORING,
  report:{caveat:SNAP_CAVEAT},
  items:SNAP_ITEMS
}});

/* ── ASRS v1.1 — WHO Adult ADHD Self-Report Scale ──────────────────────────────
   18 DSM symptoms in adult context, rated 0–4 (Never…Very often). Free to reproduce
   for clinical use (© WHO 2003; reproduction/translation requests → Prof. R. Kessler,
   Harvard Medical School). Item text transcribed from the official ASRS-v1.1 Symptom
   Checklist; Part A screener scoring per Kessler et al. (2005). Screening only.

   Part A = the validated 6-item screener: each item has an item-specific "shaded"
   threshold (items 1–3 count from Sometimes/≥2; items 4–6 from Often/≥3); ≥4 marks =
   positive screen (sens 68.7%, spec 99.5%; Kessler 2005). Part B adds 12 items for a
   fuller symptom picture. No general-population norms exist — interpretation is anchored
   on the Part A cut-off, not a normative mean. New scoring type 'asrs'.
─────────────────────────────────────────────────────────────────────────── */
const ASRS_OPTIONS = [{label:'Never'},{label:'Rarely'},{label:'Sometimes'},{label:'Often'},{label:'Very often'}];
Object.assign(REGISTRY, {"asrs":{
  id:'asrs',
  name:'ASRS v1.1',
  formLabel:'Adult (self-report)',
  fullName:'Adult ADHD Self-Report Scale (ASRS v1.1)',
  category:'adhd',
  status:'live',
  respondent:'Self-report',
  ageRange:'18+ years',
  estMinutes:'5–7 min',
  description:'WHO adult ADHD symptom screen. Part A is the validated 6-item screener; Part B adds 12 symptom items.',
  citation:'Kessler RC et al. (2005). The World Health Organization Adult ADHD Self-Report Scale (ASRS). Psychological Medicine 35:245–256.',
  licence:'© World Health Organization 2003. Free for clinical use; reproduction/translation requests are directed to Prof. R. Kessler, Harvard Medical School. Confirm digital-use terms before public hosting.',
  higherMeans:'more frequent adult ADHD symptoms',
  verified:{ date:'2026-07-20', note:'Adler et al. (2018) community norms (0–18 checklist) and the full per-item ADHD / non-ADHD / treated / not-treated means and SDs verified cell-by-cell against source (72/72 per-item pairs, 9/9 community groups). 18 item texts and the Part A ≥4/6 screener checked against the official WHO ASRS v1.1 form (items 12 & 16 corrected to the form wording). The 0–18 "Sometimes"-threshold set [1,2,3,9,12,16,18] confirmed against the form shading.' },
  scoring:{ type:'asrs', options:ASRS_OPTIONS,
    partA:[1,2,3,4,5,6],
    partAThresholds:{1:2,2:2,3:2,4:3,5:3,6:3},  // value at/above which the box is "shaded"
    partAPositive:4,
    symptomThreshold:3,                          // Often/Very often = a counted DSM symptom
    checklistSometimesItems:[1,2,3,9,12,16,18],  // 0–18 Adler total: these count from "sometimes" (≥2); the other 11 from "often" (≥3)
    totalMax:72 },
  /* US general-population norms for the 0–18 Symptom-Checklist total — Adler et al.
     (2018), Int J Clin Pract 73(1):e13260; N=22,397. The distribution is highly skewed
     (scores bunch near 0: mean 2.0, SD 3.2, floor 0), so deviation from the mean is descriptive, not a precise
     percentile. Age bands: only the 18–29 and 65+ means are reported numerically in the
     text (intermediate bands appear only in a figure), so the age trend is shown but not
     used for a point estimate. */
  adlerNorms:{
    source:'Adler et al. (2018), Int J Clin Pract 73(1):e13260, US general-population norms for the 0–18 ASRS-v1.1 Symptom-Checklist total; N=22,397.',
    range:[0,18], subtypeSymptomatic:6,
    general:{mean:2.0, sd:3.2},
    sex:{male:{mean:1.9, sd:3.3}, female:{mean:2.1, sd:3.2}},
    age:{'18-29':{mean:3.0, sd:4.1}, '65+':{mean:1.2, sd:2.1}},
    race:{White:{mean:2.0, sd:3.1}, Black:{mean:2.2, sd:3.7}, Other:{mean:2.5, sd:3.8}},
    hispanic:{mean:2.8, sd:4.2},
    note:'Items 1, 2, 3, 9, 12, 16, 18 score a point from “sometimes”; the other 11 items from “often”. Community scores bunch near 0 (mean 2.0, SD 3.2), so read a score as deviation from this community average, not a normal-curve percentile.'
  },
  /* Per-item means (SD) by ADHD status, from the SAME study (Adler 2018,
     N=22,397). Used for the ADHD-vs-non-ADHD symptom profile. m/sd keyed by item
     number; labels are short item names. The values below are AS PRINTED in
     Table 3; asrsTable3To04() subtracts 1 from each mean before use (see the
     source note). SDs are unaffected by the shift. */
  itemNorms:{
    source:'Adler et al. (2018), Int J Clin Pract 73(1):e13260, Table 3, per-item ASRS-v1.1 means (SD) by ADHD status: self-reported ADHD (n=465), no ADHD (n=21,932). The table footnote says items were scored 0 (never) to 4 (very often), but the printed means only fit a 1 (never) to 5 coding: read as 0–4, the no-ADHD item means imply a Symptom Checklist mean of about 6.9, against the paper\'s own 2.0; with 1 subtracted they imply 1.99. So the app subtracts 1 from every mean to put it on the 0–4 answers (an inference from the paper\'s own figures, checked 2026-10-02).',
    // Cronbach α of the Symptom Checklist (Adler 2018: 0.88–0.89). Lets the report
    // estimate each group's total-score SD from the per-item SDs:
    // var(total) = Σσ²ᵢ / (1 − α(k−1)/k). Conservative lower bound used.
    alpha:0.88,
    groupN:{adhd:465, noAdhd:21932, treated:174, notTreated:291},
    adhd:asrsTable3To04({1:{m:2.65,sd:1.26},2:{m:2.72,sd:1.29},3:{m:2.68,sd:1.24},4:{m:2.97,sd:1.31},5:{m:3.14,sd:1.39},6:{m:2.55,sd:1.24},7:{m:2.55,sd:1.16},8:{m:3.16,sd:1.30},9:{m:2.91,sd:1.22},10:{m:2.85,sd:1.24},11:{m:3.17,sd:1.29},12:{m:2.15,sd:1.24},13:{m:2.94,sd:1.24},14:{m:2.79,sd:1.30},15:{m:2.66,sd:1.30},16:{m:2.62,sd:1.30},17:{m:2.43,sd:1.23},18:{m:2.51,sd:1.18}}),
    noAdhd:asrsTable3To04({1:{m:1.75,sd:0.87},2:{m:1.72,sd:0.88},3:{m:1.77,sd:0.90},4:{m:2.00,sd:1.01},5:{m:1.97,sd:1.13},6:{m:1.67,sd:0.93},7:{m:1.79,sd:0.83},8:{m:1.98,sd:0.99},9:{m:1.79,sd:0.93},10:{m:2.07,sd:0.96},11:{m:2.04,sd:1.00},12:{m:1.38,sd:0.73},13:{m:1.84,sd:0.95},14:{m:1.81,sd:0.99},15:{m:1.75,sd:0.94},16:{m:1.78,sd:0.94},17:{m:1.61,sd:0.86},18:{m:1.76,sd:0.82}}),
    // Treated / not treated, as printed and NOT shifted or shown: the not-treated
    // column is the no-ADHD column + 0.01 to 0.02 on every item, so it is mislabelled.
    treated:{1:{m:2.84,sd:1.21},2:{m:2.93,sd:1.26},3:{m:2.80,sd:1.22},4:{m:3.16,sd:1.29},5:{m:3.16,sd:1.32},6:{m:2.74,sd:1.24},7:{m:2.69,sd:1.18},8:{m:3.27,sd:1.28},9:{m:3.03,sd:1.15},10:{m:2.93,sd:1.20},11:{m:3.19,sd:1.24},12:{m:2.30,sd:1.18},13:{m:2.97,sd:1.22},14:{m:2.99,sd:1.26},15:{m:2.78,sd:1.28},16:{m:2.71,sd:1.24},17:{m:2.54,sd:1.17},18:{m:2.60,sd:1.22}},
    notTreated:{1:{m:1.76,sd:0.88},2:{m:1.73,sd:0.90},3:{m:1.78,sd:0.91},4:{m:2.01,sd:1.02},5:{m:1.98,sd:1.14},6:{m:1.68,sd:0.94},7:{m:1.80,sd:0.84},8:{m:1.99,sd:1.00},9:{m:1.81,sd:0.94},10:{m:2.08,sd:0.97},11:{m:2.06,sd:1.02},12:{m:1.39,sd:0.74},13:{m:1.86,sd:0.96},14:{m:1.82,sd:1.00},15:{m:1.76,sd:0.95},16:{m:1.79,sd:0.95},17:{m:1.62,sd:0.87},18:{m:1.77,sd:0.83}},
    labels:{1:'Wrapping up details',2:'Getting things in order',3:'Remembering appointments',4:'Avoid / delay starting',5:'Fidget or squirm',6:'Overly active / driven',7:'Careless mistakes',8:'Keeping attention',9:'Concentrating on people',10:'Misplacing things',11:'Distracted by noise',12:'Leaving your seat',13:'Restless or fidgety',14:'Unwinding / relaxing',15:'Talking too much',16:'Finishing sentences',17:'Waiting your turn',18:'Interrupting others'}
  },
  subscales:{
    inattention:{name:'Inattention', items:[1,2,3,4,7,8,9,10,11]},
    hyperimpulsive:{name:'Hyperactivity / Impulsivity', items:[5,6,12,13,14,15,16,17,18]}
  },
  items:[
    {n:1,  part:'A', subscale:'inattention',    text:'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?'},
    {n:2,  part:'A', subscale:'inattention',    text:'How often do you have difficulty getting things in order when you have to do a task that requires organization?'},
    {n:3,  part:'A', subscale:'inattention',    text:'How often do you have problems remembering appointments or obligations?'},
    {n:4,  part:'A', subscale:'inattention',    text:'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?'},
    {n:5,  part:'A', subscale:'hyperimpulsive', text:'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?'},
    {n:6,  part:'A', subscale:'hyperimpulsive', text:'How often do you feel overly active and compelled to do things, like you were driven by a motor?'},
    {n:7,  part:'B', subscale:'inattention',    text:'How often do you make careless mistakes when you have to work on a boring or difficult project?'},
    {n:8,  part:'B', subscale:'inattention',    text:'How often do you have difficulty keeping your attention when you are doing boring or repetitive work?'},
    {n:9,  part:'B', subscale:'inattention',    text:'How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?'},
    {n:10, part:'B', subscale:'inattention',    text:'How often do you misplace or have difficulty finding things at home or at work?'},
    {n:11, part:'B', subscale:'inattention',    text:'How often are you distracted by activity or noise around you?'},
    {n:12, part:'B', subscale:'hyperimpulsive', text:'How often do you leave your seat in meetings or other situations in which you are expected to remain seated?'},
    {n:13, part:'B', subscale:'hyperimpulsive', text:'How often do you feel restless or fidgety?'},
    {n:14, part:'B', subscale:'hyperimpulsive', text:'How often do you have difficulty unwinding and relaxing when you have time to yourself?'},
    {n:15, part:'B', subscale:'hyperimpulsive', text:'How often do you find yourself talking too much when you are in social situations?'},
    {n:16, part:'B', subscale:'hyperimpulsive', text:"When you're in a conversation, how often do you find yourself finishing the sentences of the people you are talking to, before they can finish them themselves?"},
    {n:17, part:'B', subscale:'hyperimpulsive', text:'How often do you have difficulty waiting your turn in situations when turn taking is required?'},
    {n:18, part:'B', subscale:'hyperimpulsive', text:'How often do you interrupt others when they are busy?'}
  ],
  screener:{partA:6, positive:4, sensitivity:0.687, specificity:0.995, source:'Kessler et al. (2005)'},
  report:{caveat:'The ASRS flags adults whose symptoms warrant fuller assessment; it cannot confirm or exclude ADHD on its own. ADHD frequently co-occurs with autism, read this alongside the wider picture.'}
}});

/* ── ASRS v1.1 Screener — Adolescent (Green et al. 2019) ───────────────────────
   A SEPARATE assessment (like the AQ has adult/adolescent/child versions): the
   6-item Part A screener only — the version validated in adolescents (ages 11–18).
   Same items and ≥4-of-6 "elevated" scoring as the adult Part A, but scored against
   age-matched community norms (Green 2019) and clearly framed as off-label /
   preliminary for under-18s. Reuses the 'asrs' scorer (6 items, no subscales →
   total = the 0–24 screener sum). Norms applied by AGE (UK-friendly). */
const ASRS_TEEN_NORMS = {
  source:'Green, DeYoung, Wogan, Wolf, Lane & Adler (2019), Int J Methods Psychiatr Res 28:e1751: ASRS v1.1 Screener (6-item, 0–24) in a US community adolescent sample (grades 6–12, ages 11–18, n=2,472). Distribution ≈ normal (skew 0.52). Norms are by US grade, applied here by age (US grade ≈ age − 5; sample 91–94% non-Latino White, two districts). Adolescent validity is preliminary (vs SDQ); the ASRS is an adult scale used off-label.',
  screenerMax:24,
  byAge:{
    11:{mean:5.4, sd:4.4, grade:6,  elev:6.2},
    12:{mean:6.4, sd:4.5, grade:7,  elev:9.5},
    13:{mean:7.0, sd:4.8, grade:8,  elev:13.1},
    14:{mean:7.7, sd:4.4, grade:9,  elev:12.5},
    15:{mean:8.7, sd:4.8, grade:10, elev:17.1},
    16:{mean:9.6, sd:5.1, grade:11, elev:26.0},
    17:{mean:9.4, sd:4.8, grade:12, elev:23.5}
  },
  overall:{mean:7.5, sd:4.9, elev:14.6}
};
Object.assign(REGISTRY, {"asrs_adolescent":{
  id:'asrs_adolescent',
  name:'ASRS Screener (teen)',
  formLabel:'Adolescent (teen)',
  fullName:'ADHD Self-Report Scale v1.1 Screener: Adolescent',
  category:'adhd',
  status:'live',
  respondent:'Self-report (young person)',
  ageRange:'11–17 years',
  estMinutes:'2–3 min',
  description:'The 6-item ASRS Part A screener, scored against age-matched adolescent community norms (Green et al. 2019). Off-label / preliminary in under-18s.',
  citation:'Green JG et al. (2019), Int J Methods Psychiatr Res 28:e1751 (adolescent validation). Screener scoring per Kessler RC et al. (2005), Psychol Med 35:245–256.',
  licence:'© World Health Organization 2003. Free for clinical use; reproduction/translation requests are directed to Prof. R. Kessler, Harvard Medical School.',
  higherMeans:'more frequent ADHD symptoms',
  scoring:{ type:'asrs', options:ASRS_OPTIONS,
    partA:[1,2,3,4,5,6],
    partAThresholds:{1:2,2:2,3:2,4:3,5:3,6:3},
    partAPositive:4,
    symptomThreshold:3,
    totalMax:24 },
  adolescentNorms:ASRS_TEEN_NORMS,
  items:[
    {n:1, part:'A', text:'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?'},
    {n:2, part:'A', text:'How often do you have difficulty getting things in order when you have to do a task that requires organization?'},
    {n:3, part:'A', text:'How often do you have problems remembering appointments or obligations?'},
    {n:4, part:'A', text:'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?'},
    {n:5, part:'A', text:'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?'},
    {n:6, part:'A', text:'How often do you feel overly active and compelled to do things, like you were driven by a motor?'}
  ],
  report:{caveat:'A screen, not a diagnosis, and an adult instrument used off-label in adolescents (preliminary validity, validated against the SDQ rather than a diagnostic interview). In under-18s, weight a positive screen alongside a youth-specific measure (e.g. NICHQ Vanderbilt), developmental history and a clinical interview. ADHD frequently co-occurs with autism.'}
}});

/* (excluded instrument omitted from the hosted build) */

/* ── PHQ-9 (depression) & GAD-7 (anxiety) ──────────────────────────────────────
   Public-domain Pfizer instruments (developed by Drs Spitzer, Williams, Kroenke &
   colleagues; PHQ funded by Pfizer). "No permission required to reproduce, translate,
   display or distribute." Items are the standard published wording. Each item 0–3
   (Not at all / Several days / More than half the days / Nearly every day) over the
   last 2 weeks; summed to a total mapped to the conventional severity bands.

   German general-population cumulative-percentile norms are layered alongside the
   conventional thresholds (engine/screener_norms.js):
   • PHQ-9: Kocalevent, Hinz & Brähler (2013) — by sex × age band.
   • GAD-7: Kliem et al. (2025) — by age band (gender-neutral).
   New scoring type 'screener'. PHQ-9 item 9 (self-harm) is surfaced for safety review.
─────────────────────────────────────────────────────────────────────────── */
const PHQGAD_OPTIONS = [{label:'Not at all'},{label:'Several days'},{label:'More than half the days'},{label:'Nearly every day'}];
Object.assign(REGISTRY, {"phq9":{
  id:'phq9', name:'PHQ-9', fullName:'Patient Health Questionnaire-9 (Depression)',
  category:'mood', status:'live', respondent:'Self-report', ageRange:'14+ years', estMinutes:'2–4 min',
  description:'Nine-item depression severity measure. “Over the last 2 weeks, how often have you been bothered by…”. Conventional severity bands plus German general-population percentiles.',
  citation:'Kroenke K, Spitzer RL, Williams JBW (2001). The PHQ-9. J Gen Intern Med 16:606–613. Norms: Kocalevent, Hinz & Brähler (2013), Gen Hosp Psychiatry 35:551–555 (German general population, N=5018).',
  licence:'Public domain (Pfizer). No permission required to reproduce, translate, display or distribute.',
  verified:{ date:'2026-07-19', note:'Items, response options and severity bands checked against the PHQ-9 manual; Kocalevent, Hinz & Brähler (2013) percentile norms matched cell-by-cell to the source table.' },
  higherMeans:'more severe depressive symptoms',
  scoring:{ type:'screener', options:PHQGAD_OPTIONS, totalMax:27, cutoff:10, flagItem:9, normSet:'phq9', normBy:'sexage',
    // the form's closing difficulty question (item 10): not scored (PHQ manual p.2)
    optionSets:{ difficulty:[{label:'Not difficult at all',v:0},{label:'Somewhat difficult',v:1},{label:'Very difficult',v:2},{label:'Extremely difficult',v:3}] },
    severity:[
      {max:4,  label:'None–minimal',     cls:'band-typical'},
      {max:9,  label:'Mild',             cls:'band-elevated'},
      {max:14, label:'Moderate',         cls:'band-high'},
      {max:19, label:'Moderately severe',cls:'band-high'},
      {max:null,label:'Severe',          cls:'band-high'}
    ] },
  items:[
    {n:1, text:'Little interest or pleasure in doing things'},
    {n:2, text:'Feeling down, depressed, or hopeless'},
    {n:3, text:'Trouble falling or staying asleep, or sleeping too much'},
    {n:4, text:'Feeling tired or having little energy'},
    {n:5, text:'Poor appetite or overeating'},
    {n:6, text:'Feeling bad about yourself, or that you are a failure or have let yourself or your family down'},
    {n:7, text:'Trouble concentrating on things, such as reading the newspaper or watching television'},
    {n:8, text:'Moving or speaking so slowly that other people could have noticed? Or the opposite, being so fidgety or restless that you have been moving around a lot more than usual'},
    {n:9, text:'Thoughts that you would be better off dead, or of hurting yourself in some way'},
    {n:10, prompt:'If you checked off any problems…', text:'How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?', optionSet:'difficulty', unscored:true}
  ],
  bandRanges:['0–4','5–9','10–14','15–19','20–27'],
  report:{caveat:'A total ≥10 has 88% sensitivity and 88% specificity for major depression (Kroenke 2001) and warrants clinical follow-up. Item 9 asks about thoughts of self-harm, any non-zero response should be reviewed directly and a risk assessment considered.'}
},"gad7":{
  id:'gad7', name:'GAD-7', fullName:'Generalised Anxiety Disorder-7',
  category:'mood', status:'live', respondent:'Self-report', ageRange:'Adults (16+)', estMinutes:'2–3 min',
  description:'Seven-item anxiety severity measure. “Over the last 2 weeks, how often have you been bothered by…”. Conventional severity bands plus German general-population percentiles.',
  citation:'Spitzer RL, Kroenke K, Williams JBW, Löwe B (2006). A brief measure for assessing GAD: the GAD-7. Arch Intern Med 166:1092–1097. Norms: Kliem et al. (2025), Front Psychol (German general population, N=2519).',
  licence:'Public domain (Pfizer). No permission required to reproduce, translate, display or distribute.',
  verified:{ date:'2026-07-19', note:'Items, response options and severity bands checked against the GAD-7 manual; Kliem et al. (2025) age-band percentile norms matched cell-by-cell to the source table.' },
  higherMeans:'more severe anxiety symptoms',
  scoring:{ type:'screener', options:PHQGAD_OPTIONS, totalMax:21, cutoff:10, normSet:'gad7', normBy:'age',
    severity:[
      {max:4,  label:'Minimal',  cls:'band-typical'},
      {max:9,  label:'Mild',     cls:'band-elevated'},
      {max:14, label:'Moderate', cls:'band-high'},
      {max:null,label:'Severe',  cls:'band-high'}
    ] },
  items:[
    {n:1, text:'Feeling nervous, anxious, or on edge'},
    {n:2, text:'Not being able to stop or control worrying'},
    {n:3, text:'Worrying too much about different things'},
    {n:4, text:'Trouble relaxing'},
    {n:5, text:'Being so restless that it is hard to sit still'},
    {n:6, text:'Becoming easily annoyed or irritable'},
    {n:7, text:'Feeling afraid, as if something awful might happen'}
  ],
  bandRanges:['0–4','5–9','10–14','15–21'],
  report:{caveat:'A total ≥10 is the conventional cut-off for probable generalised anxiety disorder (sensitivity 89%, specificity 82%; Spitzer 2006) and warrants clinical follow-up; it also screens for panic, social anxiety, and PTSD with reasonable sensitivity.'}
}});

/* ── Strengths & Difficulties Questionnaire (SDQ) — Parent + Child self-report ──
   © Robert Goodman; free for non-commercial / clinical paper use (youthinmind /
   sdqinfo.org). NOTE: confirm digital-use licensing before public web hosting.
   Items transcribed from the clinic's own forms. Scoring (reverse items, 5×5
   subscales, Total Difficulties) and four-band cut-offs verified against sdqinfo;
   every band, including the self-report total and internalising/externalising,
   re-checked against the scoring instructions Table 3 (p.4) on 2026-10-01.
   New scoring type 'sdq'.
─────────────────────────────────────────────────────────────────────────── */
const SDQ_OPTIONS = [{label:'Not true'},{label:'Somewhat true'},{label:'Certainly true'}];
const SDQ_SUBSCALES = {
  emotional:    {name:'Emotional Problems', items:[3,8,13,16,24], max:10},
  conduct:      {name:'Conduct Problems',   items:[5,7,12,18,22], max:10},
  hyperactivity:{name:'Hyperactivity / Inattention', items:[2,10,15,21,25], max:10},
  peer:         {name:'Peer Problems',      items:[6,11,14,19,23], max:10},
  prosocial:    {name:'Prosocial',          items:[1,4,9,17,20], max:10}
};
const SDQ_DIFF_SCALES = ['emotional','conduct','hyperactivity','peer'];

Object.assign(REGISTRY, {"sdq_parent":{
  id:'sdq_parent',
  report:{caveat:'SDQ bands reflect population norms (~80% close to average / 10% slightly raised / 5% high / 5% very high). Interpret with history and, ideally, more than one informant.'},
  name:'SDQ (parent)',
  fullName:'Strengths & Difficulties Questionnaire (parent)',
  category:'behaviour',
  status:'live',
  respondent:'Parent / carer report',
  informantKind:'childhood',
  informantHelp:'A brief emotional and behavioural questionnaire, best completed by a parent or carer who knows {subject} well.',
  ageRange:'4–17 years',
  estMinutes:'4–6 min',
  description:'Brief emotional & behavioural screen: emotional, conduct, hyperactivity, peer, and prosocial scales.',
  citation:'Goodman R (1997, 2001). Strengths & Difficulties Questionnaire. youthinmind / sdqinfo.org.',
  higherMeans:'more difficulties (a low prosocial score is the concerning direction)',
  licence:'© Robert Goodman. Free for non-commercial clinical use; confirm digital-use terms before public hosting.',
  verified:{ date:'2026-07-20', note:'Items, response options, subscale allocation and reverse-scoring confirmed; British community percentile tables (sdqinfo UKNorm frequency distributions), four-band cut-offs (official SDQ 4-17 scoring table) and gender×age-band mean/SD norms (UKNorm4) all checked cell-by-cell against source.' },
  scoring:{ type:'sdq', options:SDQ_OPTIONS, difficultyScales:SDQ_DIFF_SCALES, bands:{
    total:{dir:'diff',cuts:[13,16,19]},
    emotional:{dir:'diff',cuts:[3,4,6]},
    conduct:{dir:'diff',cuts:[2,3,5]},
    hyperactivity:{dir:'diff',cuts:[5,7,8]},
    peer:{dir:'diff',cuts:[2,3,4]},
    prosocial:{dir:'pros',cuts:[8,7,6]},
    internalising:{dir:'diff',cuts:[5,7,9]},
    externalising:{dir:'diff',cuts:[8,10,12]}
  }},
  subscales:SDQ_SUBSCALES,
  percentileKey:'parent',
  norms:{ source:'British community norms (British Child & Adolescent Mental Health Surveys; sdqinfo), by age band and sex.',
    male:{
      '5-10':{total:{mean:9.3,sd:6.0},emotional:{mean:1.8,sd:2.0},conduct:{mean:1.8,sd:1.8},hyperactivity:{mean:4.1,sd:2.8},peer:{mean:1.5,sd:1.7},prosocial:{mean:8.4,sd:1.7}},
      '11-15':{total:{mean:8.8,sd:5.9},emotional:{mean:1.8,sd:1.9},conduct:{mean:1.6,sd:1.8},hyperactivity:{mean:3.8,sd:2.7},peer:{mean:1.6,sd:1.7},prosocial:{mean:8.3,sd:1.7}}
    },
    female:{
      '5-10':{total:{mean:7.9,sd:5.4},emotional:{mean:2.0,sd:1.9},conduct:{mean:1.5,sd:1.5},hyperactivity:{mean:3.1,sd:2.5},peer:{mean:1.3,sd:1.6},prosocial:{mean:8.9,sd:1.4}},
      '11-15':{total:{mean:7.6,sd:5.6},emotional:{mean:2.1,sd:2.1},conduct:{mean:1.4,sd:1.7},hyperactivity:{mean:2.6,sd:2.3},peer:{mean:1.5,sd:1.6},prosocial:{mean:8.8,sd:1.5}}
    } },
  items:[
    {n:1,  subscale:'prosocial',     text:'Considerate of other people’s feelings'},
    {n:2,  subscale:'hyperactivity', text:'Restless, overactive, cannot stay still for long'},
    {n:3,  subscale:'emotional',     text:'Often complains of headaches, stomach-aches or sickness'},
    {n:4,  subscale:'prosocial',     text:'Shares readily with other children (treats, toys, pencils etc.)'},
    {n:5,  subscale:'conduct',       text:'Often has temper tantrums or hot tempers'},
    {n:6,  subscale:'peer',          text:'Rather solitary, tends to play alone'},
    {n:7,  subscale:'conduct',       reverse:true, text:'Generally obedient, usually does what adults request'},
    {n:8,  subscale:'emotional',     text:'Many worries, often seems worried'},
    {n:9,  subscale:'prosocial',     text:'Helpful if someone is hurt, upset or feeling ill'},
    {n:10, subscale:'hyperactivity', text:'Constantly fidgeting or squirming'},
    {n:11, subscale:'peer',          reverse:true, text:'Has at least one good friend'},
    {n:12, subscale:'conduct',       text:'Often fights with other children or bullies them'},
    {n:13, subscale:'emotional',     text:'Often unhappy, down-hearted or tearful'},
    {n:14, subscale:'peer',          reverse:true, text:'Generally liked by other children'},
    {n:15, subscale:'hyperactivity', text:'Easily distracted, concentration wanders'},
    {n:16, subscale:'emotional',     text:'Nervous or clingy in new situations, easily loses confidence'},
    {n:17, subscale:'prosocial',     text:'Kind to younger children'},
    {n:18, subscale:'conduct',       text:'Often lies or cheats'},
    {n:19, subscale:'peer',          text:'Picked on or bullied by other children'},
    {n:20, subscale:'prosocial',     text:'Often volunteers to help others (parents, teachers, other children)'},
    {n:21, subscale:'hyperactivity', reverse:true, text:'Thinks things out before acting'},
    {n:22, subscale:'conduct',       text:'Steals from home, school or elsewhere'},
    {n:23, subscale:'peer',          text:'Gets on better with adults than with other children'},
    {n:24, subscale:'emotional',     text:'Many fears, easily scared'},
    {n:25, subscale:'hyperactivity', reverse:true, text:'Sees tasks through to the end, good attention span'}
  ]
},"sdq_self":{
  id:'sdq_self',
  report:{caveat:'SDQ bands reflect population norms (~80% close to average / 10% slightly raised / 5% high / 5% very high). Interpret with history and, ideally, more than one informant.'},
  name:'SDQ (child, self-report)',
  fullName:'Strengths & Difficulties Questionnaire (self-report)',
  category:'behaviour',
  status:'live',
  respondent:'Self-report (young person)',
  ageRange:'11–17 years',
  estMinutes:'4–6 min',
  description:'Self-report emotional & behavioural screen: emotional, conduct, hyperactivity, peer, and prosocial scales.',
  citation:'Goodman R (1997, 2001). Strengths & Difficulties Questionnaire. youthinmind / sdqinfo.org.',
  higherMeans:'more difficulties (a low prosocial score is the concerning direction)',
  licence:'© Robert Goodman. Free for non-commercial clinical use; confirm digital-use terms before public hosting.',
  verified:{ date:'2026-07-20', note:'Items, response options, subscale allocation and reverse-scoring confirmed; British community percentile tables (sdqinfo UKNorm frequency distributions), four-band cut-offs (official SDQ 4-17 scoring table) and gender×age-band mean/SD norms (UKNorm4) all checked cell-by-cell against source.' },
  scoring:{ type:'sdq', options:SDQ_OPTIONS, difficultyScales:SDQ_DIFF_SCALES, bands:{
    total:{dir:'diff',cuts:[14,17,19]},
    emotional:{dir:'diff',cuts:[4,5,6]},
    conduct:{dir:'diff',cuts:[3,4,5]},
    hyperactivity:{dir:'diff',cuts:[5,6,7]},
    peer:{dir:'diff',cuts:[2,3,4]},
    prosocial:{dir:'pros',cuts:[7,6,5]},
    internalising:{dir:'diff',cuts:[6,8,10]},
    externalising:{dir:'diff',cuts:[8,10,12]}
  }},
  subscales:SDQ_SUBSCALES,
  percentileKey:'self',
  norms:{ source:'British community norms, ages 11–15, self-report (British Child & Adolescent Mental Health Surveys; sdqinfo).',
    male:{ '11-15':{total:{mean:10.5,sd:5.1},emotional:{mean:2.6,sd:1.9},conduct:{mean:2.4,sd:1.7},hyperactivity:{mean:3.9,sd:2.2},peer:{mean:1.6,sd:1.4},prosocial:{mean:7.5,sd:1.7}} },
    female:{ '11-15':{total:{mean:10.0,sd:5.3},emotional:{mean:3.0,sd:2.1},conduct:{mean:2.0,sd:1.6},hyperactivity:{mean:3.6,sd:2.2},peer:{mean:1.4,sd:1.4},prosocial:{mean:8.5,sd:1.4}} } },
  items:[
    {n:1,  subscale:'prosocial',     text:'I try to be nice to other people. I care about their feelings'},
    {n:2,  subscale:'hyperactivity', text:'I am restless, I cannot stay still for long'},
    {n:3,  subscale:'emotional',     text:'I get a lot of headaches, stomach-aches or sickness'},
    {n:4,  subscale:'prosocial',     text:'I usually share with others (food, games, pens etc.)'},
    {n:5,  subscale:'conduct',       text:'I get very angry and often lose my temper'},
    {n:6,  subscale:'peer',          text:'I am usually on my own. I generally play alone or keep to myself'},
    {n:7,  subscale:'conduct',       reverse:true, text:'I usually do as I am told'},
    {n:8,  subscale:'emotional',     text:'I worry a lot'},
    {n:9,  subscale:'prosocial',     text:'I am helpful if someone is hurt, upset or feeling ill'},
    {n:10, subscale:'hyperactivity', text:'I am constantly fidgeting or squirming'},
    {n:11, subscale:'peer',          reverse:true, text:'I have one good friend or more'},
    {n:12, subscale:'conduct',       text:'I fight a lot. I can make other people do what I want'},
    {n:13, subscale:'emotional',     text:'I am often unhappy, down-hearted or tearful'},
    {n:14, subscale:'peer',          reverse:true, text:'Other people my age generally like me'},
    {n:15, subscale:'hyperactivity', text:'I am easily distracted, I find it difficult to concentrate'},
    {n:16, subscale:'emotional',     text:'I am nervous in new situations. I easily lose confidence'},
    {n:17, subscale:'prosocial',     text:'I am kind to younger children'},
    {n:18, subscale:'conduct',       text:'I am often accused of lying or cheating'},
    {n:19, subscale:'peer',          text:'Other children or young people pick on me or bully me'},
    {n:20, subscale:'prosocial',     text:'I often volunteer to help others (parents, teachers, children)'},
    {n:21, subscale:'hyperactivity', reverse:true, text:'I think before I do things'},
    {n:22, subscale:'conduct',       text:'I take things that are not mine from home, school or elsewhere'},
    {n:23, subscale:'peer',          text:'I get on better with adults than with people my own age'},
    {n:24, subscale:'emotional',     text:'I have many fears, I am easily scared'},
    {n:25, subscale:'hyperactivity', reverse:true, text:'I finish the work I’m doing. My attention is good'}
  ]
}});

/* (excluded instrument omitted from the hosted build) */

/* (excluded instrument omitted from the hosted build) */

/* ── Question framing (instrument stems) ───────────────────────────────────────
   Each instrument's items are only meaningful with their standard instruction —
   the timeframe ("over the last 2 weeks") and the lead-in ("how often have you
   been bothered by…"). The runner shows this stem above every item. A per-item
   `prompt` (set below for BAARS sections and Vanderbilt item types) overrides the
   test-level stem. Kept here so all framing text lives in one place. */
(function(){
  const STEMS = {
    aq_adult:      'How strongly do you agree or disagree with each statement?',
    aq_adolescent: 'Based on this young person, how strongly do you agree or disagree with each statement?',
    aq_child:      'Based on this child, how strongly do you agree or disagree with each statement?',
    phq9:          'Over the last 2 weeks, how often have you been bothered by the following problem?',
    gad7:          'Over the last 2 weeks, how often have you been bothered by the following problem?',
    asrs:          'Think about how you have felt and behaved over the past 6 months, then answer each question.',
    asrs_adolescent: 'Think about how you have felt and behaved over the past 6 months, then answer each question.',
    sdq_parent:    'Based on this child’s behaviour over the last six months:',
    sdq_self:      'Thinking about how things have been for you over the last six months:'
  };
  Object.keys(STEMS).forEach(id => { if(REGISTRY[id]) REGISTRY[id].prompt = STEMS[id]; });

  // BAARS: current/SCT items use the past-6-months frame; childhood items the
  // retrospective frame. Wording depends on self vs informant report.
  [['baars_self', true], ['baars_informant', false]].forEach(([id, self]) => {
    const t = REGISTRY[id]; if(!t) return;
    const current   = self ? 'Over the past 6 months, how often have you experienced each of the following?'
                           : 'Over the past 6 months, how often has this person shown each of the following?';
    const childhood = self ? 'Thinking back to when you were 5–12 years old, how often did each of these apply?'
                           : 'Thinking back to when this person was 5–12 years old, how often did each of these apply?';
    t.items.forEach(it => {
      const isChild = /^child_/.test(it.subscale||'');
      it.prompt = isChild ? childhood : current;
      it.sectionKey = isChild ? 'child' : 'now';
      it.timeframe  = isChild ? 'CHILDHOOD · ages 5–12' : 'NOW · past 6 months';
    });
    // The childhood items are near-identical to the current ones, so people think
    // they're repeating. Flag the first childhood item so the runner shows a clear
    // transition card before it.
    const firstChild = t.items.find(it => it.sectionKey==='child');
    if(firstChild) firstChild.sectionIntro = {
      tag:'Part 2 of 2',
      title:'Now think back to childhood',
      blurb: self
        ? 'The next questions look very similar to the ones you’ve just answered, that’s expected. This time, answer for when you were 5–12 years old, not how things are now.'
        : 'The next questions look very similar to the ones you’ve just answered, that’s expected. This time, answer for when this person was 5–12 years old, not how they are now.'
    };
    t.prompt = current;
  });

  // Vanderbilt: symptom items are frequency ratings; the final items rate
  // classroom performance and need a different lead-in.
  [['vand_parent','Over the past 6 months, how often does this child show each behaviour?','this child'],
   ['vand_teacher','This school year, how often does this student show each behaviour?','this student']
  ].forEach(([id, symptomStem, who]) => {
    const t = REGISTRY[id]; if(!t) return;
    t.items.forEach(it => {
      it.prompt = it.optionSet==='performance'
        ? `Compared with others of the same age, how would you rate ${who} in each area?`
        : symptomStem;
    });
    t.prompt = symptomStem;
  });
})();

/* ── ASSIST (WHO v3.0 tobacco/alcohol + NIDA-Modified v2.0 drug list) ─────────
   Alcohol, Smoking and Substance Involvement Screening Test. Tobacco and
   alcohol follow WHO ASSIST v3.0; the drug classes follow the NIDA-Modified
   ASSIST v2.0. The injection-risk item (Q8) is omitted by clinical decision. Flow is branching, so ASSIST uses a custom runner (format:'assist'):
     Q1  lifetime-use grid (ever used, non-medical) — gates everything else
     Q2–Q7  asked ONLY for each substance flagged at Q1
   Per-substance Specific Substance Involvement (SSI) score = sum(Q2..Q7); risk
   band per substance (alcohol 11/27, all others 4/27 — WHO manual Box 6;
   NIDA-Modified v2.0 p.7 for the drugs).
   Screening only — guides feedback intensity (education / brief intervention /
   brief intervention + referral), not diagnosis.

   Option VALUES below ARE the ASSIST item scores (the runner stores o.v and the
   scorer sums them). Sets are weighted differently per question, per the manual.
─────────────────────────────────────────────────────────────────────────── */
Object.assign(REGISTRY, {"assist":{
  id:'assist',
  name:'ASSIST',
  fullName:'WHO ASSIST v3.0 (substance use screen)',
  category:'substance',
  status:'live',
  format:'assist',
  respondent:'Self-report',
  ageRange:'18+ years',
  estMinutes:'5–10 min',   // WHO ASSIST v3.0 manual: about 5-10 minutes
  description:'WHO substance-involvement screen. A lifetime-use grid, then risk questions for each substance used, giving a risk band per substance.',
  citation:'WHO ASSIST Working Group (2002). Addiction 97(9):1183–1194; WHO (2010), The ASSIST screening test manual for use in primary care. Drug list: NIDA-Modified ASSIST v2.0 (National Institute on Drug Abuse).',
  licence:'Free for clinical use (World Health Organization).',
  higherMeans:'higher substance-involvement risk',
  verified:{ date:'2026-07-20', note:'Checked against the WHO ASSIST v3.0 manual: substance grid (tobacco + alcohol added for full coverage; drug list follows the NIDA-Modified ASSIST v2.0, which splits stimulants and opioids into prescription/street classes; checked 2026-10-02 against the NIDA form, same weights and 0–3/4–26/27+ drug bands), Q2–Q7 wording and the standard per-response weights, SSI = sum of Q2–Q7 with tobacco omitting Q5 (max 31 vs 39), and risk bands (alcohol 0–10/11–26/27+; all other substances 0–3/4–26/27+). Cannabis threshold corrected from a mistaken 0–4/5–26 to the manual 0–3/4–26. Q8 injection-risk omitted by clinical decision.' },
  scoring:{
    type:'assist',
    optionSets:{
      // Q2 — frequency of use in the past 3 months
      freq:[
        {label:'Never', v:0},
        {label:'Once or twice', v:2},
        {label:'Monthly', v:3},
        {label:'Weekly', v:4},
        {label:'Daily or almost daily', v:6}
      ],
      // Q3 — strong desire / urge to use, past 3 months
      urge:[
        {label:'Never', v:0},
        {label:'Once or twice', v:3},
        {label:'Monthly', v:4},
        {label:'Weekly', v:5},
        {label:'Daily or almost daily', v:6}
      ],
      // Q4 — health, social, legal or financial problems, past 3 months
      problems:[
        {label:'Never', v:0},
        {label:'Once or twice', v:4},
        {label:'Monthly', v:5},
        {label:'Weekly', v:6},
        {label:'Daily or almost daily', v:7}
      ],
      // Q5 — failed to do what was normally expected, past 3 months
      failrole:[
        {label:'Never', v:0},
        {label:'Once or twice', v:5},
        {label:'Monthly', v:6},
        {label:'Weekly', v:7},
        {label:'Daily or almost daily', v:8}
      ],
      // Q6 — anyone expressed concern (lifetime, with recency)
      concern:[
        {label:'No, never', v:0},
        {label:'Yes, in the past 3 months', v:6},
        {label:'Yes, but not in the past 3 months', v:3}
      ],
      // Q7 — tried and failed to cut down / control / stop (lifetime, with recency)
      cutdown:[
        {label:'No, never', v:0},
        {label:'Yes, in the past 3 months', v:6},
        {label:'Yes, but not in the past 3 months', v:3}
      ]
    },
    // SSI risk-band thresholds (lower bound, inclusive). Per WHO ASSIST v3.0:
    // alcohol 0–10/11–26/27+; all other substances 0–3/4–26/27+.
    bands:{ alcohol:{mod:11, high:27}, default:{mod:4, high:27} },
    // max possible SSI = Q2..Q7 = 6+6+7+8+6+6 = 39 (tobacco skips Q5, so its max is 31)
    ssiMax:39
  },
  // Q1 substance classes (full WHO ASSIST; for medicines, non-medical / not as prescribed)
  substances:[
    {key:'tobacco',      label:'Tobacco products',        examples:'cigarettes, roll-ups, vapes / e-cigarettes, chewing tobacco, cigars', skip:['q5']},
    {key:'alcohol',      label:'Alcohol',                 examples:'beer, wine, spirits, cider'},
    {key:'cannabis',     label:'Cannabis',                examples:'marijuana, weed, hash, skunk, edibles'},
    {key:'cocaine',      label:'Cocaine',                 examples:'coke, crack, powder'},
    {key:'rx_stimulants',label:'Prescription stimulants', examples:'used non-medically, e.g. Ritalin, Adderall, Elvanse, Concerta'},
    {key:'meth',         label:'Amphetamine-type stimulants', examples:'speed, crystal meth, ice'},
    {key:'inhalants',    label:'Inhalants',               examples:'nitrous oxide, poppers, glue, solvents, aerosols'},
    {key:'sedatives',    label:'Sedatives or sleeping pills', examples:'used non-medically, e.g. Valium, Xanax, diazepam, benzodiazepines, Z-drugs'},
    {key:'hallucinogens',label:'Hallucinogens',           examples:'LSD, acid, magic mushrooms, ketamine, MDMA / ecstasy / molly'},  // ecstasy here per NIDA-Modified v2.0
    {key:'street_opioids',label:'Street opioids',         examples:'heroin, illicit fentanyl'},
    {key:'rx_opioids',   label:'Prescription opioids',    examples:'used non-medically, e.g. codeine, tramadol, oxycodone, morphine'},
    {key:'other',        label:'Any other drug',          examples:'anything not listed above'}
  ],
  lifetimePrompt:'In your life, which of these have you ever used? Tick all that apply, and leave anything you have never used unticked. For prescribed medicines, only count use that was non-medical or more than was prescribed.',
  lifetimeReassure:'This is confidential and goes only to your clinical team. Honest answers help us offer the right support, there is no judgement here.',
  // Q2–Q7 templates ({S} = the substance label, lower-cased at render)
  questions:[
    {key:'q2', set:'freq',     text:'In the past 3 months, how often have you used {S}?'},
    {key:'q3', set:'urge',     text:'In the past 3 months, how often have you had a strong desire or urge to use {S}?'},
    {key:'q4', set:'problems', text:'In the past 3 months, how often has your use of {S} led to health, social, legal or financial problems?'},
    {key:'q5', set:'failrole', text:'In the past 3 months, how often have you failed to do what was normally expected of you because of your use of {S}?'},
    {key:'q6', set:'concern',  text:'Has a friend, relative or anyone else ever expressed concern about your use of {S}?'},
    {key:'q7', set:'cutdown',  text:'Have you ever tried and failed to control, cut down or stop using {S}?'}
  ],
  riskActions:{
    low:'Lower risk, general health information / brief education.',
    moderate:'Moderate risk, a brief intervention is indicated.',
    high:'High risk, brief intervention plus assessment and referral to specialist substance-use services.'
  },
  report:{caveat:'The ASSIST is a screening tool that indicates level of risk from substance use, not a diagnosis of a substance-use disorder. The injection-risk item is not included in this version. The WHO has validated the ASSIST only as a health-worker interview, not for self-completion (WHO 2010 manual), so treat a self-completed result as indicative and confirm it in interview. Interpret the per-substance risk bands alongside a full clinical assessment.'},
  notes:[
    'Full WHO ASSIST coverage: tobacco and alcohol plus the drug classes. The injection-risk question (Q8) is omitted by clinical decision.',
    'Each substance ever used gets a Specific Substance Involvement (SSI) score from questions 2–7 (0–39). Tobacco omits Q5 per the manual, so its SSI runs 0–31.',
    'Risk bands: alcohol, 0–10 lower, 11–26 moderate, 27+ high. All other substances (including cannabis and tobacco), 0–3 lower, 4–26 moderate, 27+ high.',
    'Risk band guides the intensity of feedback (education / brief intervention / referral), not a diagnosis.'
  ]
}});

/* ── CATI — Comprehensive Autistic Trait Inventory ─────────────────────────────
   42-item self-report of autistic traits across six domains, 5-point Likert
   (1 Definitely disagree … 5 Definitely agree). Five items are reverse-scored.
   Total 42–210; each subscale 7–35. Higher = more autistic traits. Suggested
   classification threshold 147.5 (95% CI 140.5–150.5; sens .772, spec .874; Table 6,
   diagnosed autistic vs non-autistic only, self-identifying participants excluded).
   Norms are gender-matched (man / woman / gender-diverse), each with a
   non-autistic and an autistic comparison group, for total + all six subscales
   (English & Poulsen et al. 2025, Autism, n=2,601, Tables S6 & S10). Screening
   aid only — not diagnostic.
─────────────────────────────────────────────────────────────────────────── */
Object.assign(REGISTRY, {"cati":{
  id:'cati',
  name:'CATI',
  fullName:'Comprehensive Autistic Trait Inventory',
  category:'autism',
  status:'live',
  respondent:'Self-report',
  ageRange:'18+ years (adults)',
  estMinutes:'8–12 min',
  // the official form's instruction, in full (CATI 1.1 form, p.1)
  prompt:'Using the five response options, select the option that best describes you. For items of a social nature, think about situations that do not involve very close friends or family members. Try not to spend too much time thinking about each choice.',
  description:'Self-report autistic traits across six domains, with gender-matched comparison to non-autistic and autistic groups.',
  citation:'English et al. (2021), Molecular Autism 12:37; validated by English & Poulsen et al. (2025), Autism (n=2,601).',
  licence:'Free for research and clinical use.',
  higherMeans:'more autistic traits',
  verified:{ date:'2026-07-20', note:'All 42 item texts, the 1–5 response options, the five reverse-scored items (8,15,19,23,28) and all six subscale allocations verified against the official CATI v1.1 standard form and scoring key. Gender-matched norms (cisgender man/cisgender woman/gender-diverse × non-autistic/autistic; total + 6 subscales) re-checked 2026-10-02 against supplementary Table S10 of English, Poulsen et al. (2025): 84/84 means and SDs match; the autistic group is diagnosed and self-identified combined. Classification threshold 147.5 [140.5–150.5] is English et al. (2025) Table 6 (sensitivity 77.2%, specificity 87.4%); the 2021 paper gave 134.' },
  scoring:{
    type:'cati',
    options:[
      {label:'Definitely disagree'},
      {label:'Somewhat disagree'},
      {label:'Neither agree nor disagree'},
      {label:'Somewhat agree'},
      {label:'Definitely agree'}
    ],
    reversed:[8,15,19,23,28],
    subscaleMax:35,
    totalMax:210,
    threshold:147.5,
    thresholdCI:[140.5,150.5]
  },
  items:[
    {n:1,subscale:'REG',text:'I often find myself fiddling or playing repetitively with objects (e.g. clicking pens)'},
    {n:2,subscale:'FLX',text:'I like to stick to certain routines for every-day tasks'},
    {n:3,subscale:'CAM',text:'I expend a lot of mental energy trying to fit in with others'},
    {n:4,subscale:'SEN',text:'I am very sensitive to bright lighting'},
    {n:5,subscale:'FLX',text:'There are certain activities that I always choose to do the same way, every time'},
    {n:6,subscale:'CAM',text:'Sometimes I watch people interacting and try to copy them when I need to socialise'},
    {n:7,subscale:'REG',text:'I often rock when sitting in a chair'},
    {n:8,subscale:'SOC',text:'I generally enjoy social events'},
    {n:9,subscale:'CAM',text:'I look for strategies and ways to appear more sociable'},
    {n:10,subscale:'SOC',text:'In social situations, I try to avoid interactions with other people'},
    {n:11,subscale:'SEN',text:'There are times when I feel that my senses are overloaded'},
    {n:12,subscale:'REG',text:'There are certain objects that I fiddle or play with that can help me calm down or collect my thoughts'},
    {n:13,subscale:'COM',text:'Reading non-verbal cues (e.g. facial expressions, body language) is difficult for me'},
    {n:14,subscale:'FLX',text:'I like my belongings to be sorted in certain ways and will spend time making sure they are that way'},
    {n:15,subscale:'SOC',text:'Social interaction is easy for me'},
    {n:16,subscale:'CAM',text:'When interacting with other people, I spend a lot of effort monitoring how I am coming across'},
    {n:17,subscale:'SOC',text:'I find social interactions stressful'},
    {n:18,subscale:'SEN',text:'I am very sensitive to touch'},
    {n:19,subscale:'COM',text:'I can tell how people feel from their facial expressions'},
    {n:20,subscale:'REG',text:'I have a tendency to pace or move around in a repetitive path'},
    {n:21,subscale:'FLX',text:'I feel discomfort when prevented from completing a particular routine'},
    {n:22,subscale:'CAM',text:'I rely on a set of scripts when I talk with people'},
    {n:23,subscale:'COM',text:'I find it easy to sense what someone else is feeling'},
    {n:24,subscale:'SEN',text:'I am very sensitive to particular tastes (e.g. salty, sour, spicy, or sweet)'},
    {n:25,subscale:'REG',text:'I engage in certain repetitive actions when I feel stressed'},
    {n:26,subscale:'COM',text:'I rarely use non-verbal cues in my interactions with others'},
    {n:27,subscale:'FLX',text:"I often insist on doing things in a certain way, or re-doing things until they are 'just right'"},
    {n:28,subscale:'SOC',text:'I feel confident or capable when meeting new people'},
    {n:29,subscale:'CAM',text:'Before engaging in a social situation, I will create a script to follow where possible'},
    {n:30,subscale:'SOC',text:'Social occasions are often challenging for me'},
    {n:31,subscale:'SEN',text:'Sometimes the presence of a smell makes it hard for me to focus on anything else'},
    {n:32,subscale:'REG',text:"There are certain repetitive actions that others consider to be 'characteristic' of me (e.g. stroking my hair)"},
    {n:33,subscale:'COM',text:"Metaphors or 'figures of speech' often confuse me"},
    {n:34,subscale:'FLX',text:'It annoys me when plans I have made are changed'},
    {n:35,subscale:'SOC',text:'I find it difficult to make new friends'},
    {n:36,subscale:'SEN',text:'I react strongly to unexpected loud noises'},
    {n:37,subscale:'COM',text:"I have difficulty understanding someone else's point-of-view"},
    {n:38,subscale:'FLX',text:'I like to arrange items in rows or patterns'},
    {n:39,subscale:'CAM',text:"I try to follow certain 'rules' in order to get by in social situations"},
    {n:40,subscale:'SEN',text:'I am sensitive to flickering lights'},
    {n:41,subscale:'REG',text:'I have certain habits that I find difficult to stop (e.g. biting/tearing nails, pulling strands of hair)'},
    {n:42,subscale:'COM',text:"I have difficulty understanding the 'unspoken rules' of social situations"}
  ],
  subscales:{
    SOC:{name:'Social Interactions', items:[8,10,15,17,28,30,35], max:35, desc:'Desire for, and self-appraisal in, social interactions.'},
    COM:{name:'Communication', items:[13,19,23,26,33,37,42], max:35, desc:'Use and understanding of non-verbal communicative behaviours.'},
    CAM:{name:'Social Camouflage', items:[3,6,9,16,22,29,39], max:35, desc:'Masking and compensatory behaviours used to fit in.'},
    FLX:{name:'Cognitive Flexibility', items:[2,5,14,21,27,34,38], max:35, desc:'Adaptability to change; insistence on sameness and routines.'},
    REG:{name:'Self-Regulatory Behaviours', items:[1,7,12,20,25,32,41], max:35, desc:'Repetitive actions that help alleviate stress and anxiety.'},
    SEN:{name:'Sensory Sensitivity', items:[4,11,18,24,31,36,40], max:35, desc:'Oversensitivity to external stimuli across sensory modalities.'}
  },
  /* gender-matched norms: group → {non, aut} → {total, subscale...} → {m, sd}.
     English & Poulsen et al. (2025), Autism. 'diverse' = gender-diverse / nonbinary / trans. */
  genderNorms:{
    man:{
      non:{total:{m:118.29,sd:26.26},SOC:{m:21.34,sd:7.94},COM:{m:15.96,sd:5.13},CAM:{m:19.35,sd:5.72},REG:{m:20.06,sd:6.74},FLX:{m:23.55,sd:5.28},SEN:{m:18.03,sd:6.28}},
      aut:{total:{m:153.08,sd:24.11},SOC:{m:27.98,sd:6.27},COM:{m:21.77,sd:5.82},CAM:{m:25.03,sd:5.69},REG:{m:25.72,sd:5.87},FLX:{m:27.79,sd:5.20},SEN:{m:24.79,sd:6.21}}
    },
    woman:{
      non:{total:{m:113.11,sd:26.64},SOC:{m:20.96,sd:8.03},COM:{m:13.65,sd:4.47},CAM:{m:18.55,sd:6.09},REG:{m:18.07,sd:6.42},FLX:{m:22.74,sd:5.63},SEN:{m:19.13,sd:6.82}},
      aut:{total:{m:163.54,sd:20.89},SOC:{m:29.15,sd:5.10},COM:{m:21.99,sd:5.82},CAM:{m:27.50,sd:5.18},REG:{m:27.13,sd:5.33},FLX:{m:28.75,sd:4.70},SEN:{m:29.01,sd:5.09}}
    },
    diverse:{
      non:{total:{m:129.58,sd:28.97},SOC:{m:24.92,sd:7.29},COM:{m:14.64,sd:5.63},CAM:{m:20.94,sd:6.70},REG:{m:22.77,sd:7.03},FLX:{m:22.83,sd:6.50},SEN:{m:23.47,sd:6.52}},
      aut:{total:{m:168.46,sd:17.12},SOC:{m:29.17,sd:5.35},COM:{m:22.69,sd:5.60},CAM:{m:27.81,sd:5.20},REG:{m:29.20,sd:4.24},FLX:{m:29.79,sd:3.94},SEN:{m:29.79,sd:4.21}}
    }
  },
  normsSource:'English & Poulsen et al. (2025), Autism (n=2,601), Tables S6 & S10. Autistic group combines diagnosed and self-identifying participants. Percentiles use a normal-distribution approximation; the normative sample was predominantly English-speaking and White (81%).',
  report:{caveat:'The CATI measures autistic traits and is not a diagnostic instrument. A score at or above the suggested threshold of 147.5 (95% CI 140.5–150.5) supports, but does not confirm, autism, scores in that range warrant particular caution. Interpret within a full clinical assessment.'},
  notes:[
    'Total range 42–210; each of the six subscales ranges 7–35. Higher = more autistic traits.',
    'Items 8, 15, 19, 23 and 28 are reverse-scored.',
    'Suggested classification threshold 147.5 (95% CI 140.5–150.5): 77% sensitivity, 87% specificity, comparing formally diagnosed autistic adults with non-autistic adults (Table 6).',
    'Percentiles are gender-matched (man / woman / gender-diverse) against both non-autistic and autistic groups.'
  ]
}});

/* ── CAT-Q: Camouflaging Autistic Traits Questionnaire ─────────────────────────
   25-item self-report of social camouflaging, 7-point Likert (1 Strongly
   disagree … 7 Strongly agree). Five items reverse-scored (8 − value). Three
   subscales: Compensation (9 items, 9–63), Masking (8, 8–56), Assimilation
   (8, 8–56); total 25–175. Higher = more camouflaging. Items, order, response
   labels, reverse keys and factor keys are Appendix 1 of Hull et al. (2019),
   verbatim. NO published cut-off, so no band: the report shows position
   against gender-matched autistic and non-autistic groups (Hull et al. 2020,
   Table 1, unadjusted). Not diagnostic.
─────────────────────────────────────────────────────────────────────────── */
Object.assign(REGISTRY, {"catq":{
  id:'catq',
  name:'CAT-Q',
  fullName:'Camouflaging Autistic Traits Questionnaire',
  category:'autism',
  status:'live',
  respondent:'Self-report',
  ageRange:'16+ years (adults)',
  estMinutes:'5–10 min',
  description:'Self-report social camouflaging (compensation, masking, assimilation), with gender-matched comparison to autistic and non-autistic groups.',
  citation:'Hull et al. (2019), J Autism Dev Disord 49(3):819–833; comparison groups from Hull et al. (2020), Autism 24(2):352–363.',
  licence:'Published as Appendix 1 of Hull et al. (2019), an open-access article under CC BY 4.0. Credit the authors when reproducing.',
  higherMeans:'more camouflaging',
  // Appendix 1 instruction, verbatim (set here, not in STEMS: that block runs
  // before this entry is registered)
  prompt:'Choose the answer that best fits your experiences during social interactions.',
  verified:{ date:'2026-09-29', note:'All 25 item texts, their order, the 1–7 response labels, the five reverse-scored items (3,12,19,22,24) and the three factor keys machine-checked against Appendix 1 of Hull et al. (2019) (Europe PMC supplementary file); item wording also matches the paper’s Table 4. Group means/SDs transcribed from Hull et al. (2020) Table 1 (unadjusted), checked against the published article (Autism 24(2), p. 356) and the accepted manuscript, which are identical. In five of the six groups the three subscale means sum to the total mean (±0.01); in the autistic non-binary group (n=16) they sum to 119.44 against a printed total of 122.00, in the published table as well as the manuscript. The printed values are kept; that group shows SD distance only. Group score distributions traced from Figure 1 and Supplementary Figure 1 (see distributions); traced means matched Table 1 before being aligned to it exactly.' },
  scoring:{
    type:'catq',
    options:[
      {label:'Strongly disagree'},
      {label:'Disagree'},
      {label:'Somewhat disagree'},
      {label:'Neither agree nor disagree'},
      {label:'Somewhat agree'},
      {label:'Agree'},
      {label:'Strongly agree'}
    ],
    reversed:[3,12,19,22,24],
    totalMin:25,
    totalMax:175
  },
  items:[
    {n:1,subscale:'COMP',text:'When I am interacting with someone, I deliberately copy their body language or facial expressions'},
    {n:2,subscale:'MASK',text:'I monitor my body language or facial expressions so that I appear relaxed'},
    {n:3,subscale:'ASSIM',text:'I rarely feel the need to put on an act in order to get through a social situation'},
    {n:4,subscale:'COMP',text:'I have developed a script to follow in social situations (for example, a list of questions or topics of conversation)'},
    {n:5,subscale:'COMP',text:'I will repeat phrases that I have heard others say in the exact same way that I first heard them'},
    {n:6,subscale:'MASK',text:'I adjust my body language or facial expressions so that I appear interested by the person I am interacting with'},
    {n:7,subscale:'ASSIM',text:'In social situations, I feel like I’m ‘performing’ rather than being myself'},
    {n:8,subscale:'COMP',text:'In my own social interactions, I use behaviours that I have learned from watching other people interacting'},
    {n:9,subscale:'MASK',text:'I always think about the impression I make on other people'},
    {n:10,subscale:'ASSIM',text:'I need the support of other people in order to socialise'},
    {n:11,subscale:'COMP',text:'I practice my facial expressions and body language to make sure they look natural'},
    {n:12,subscale:'MASK',text:'I don’t feel the need to make eye contact with other people if I don’t want to'},
    {n:13,subscale:'ASSIM',text:'I have to force myself to interact with people when I am in social situations'},
    {n:14,subscale:'COMP',text:'I have tried to improve my understanding of social skills by watching other people'},
    {n:15,subscale:'MASK',text:'I monitor my body language or facial expressions so that I appear interested by the person I am interacting with'},
    {n:16,subscale:'ASSIM',text:'When in social situations, I try to find ways to avoid interacting with others'},
    {n:17,subscale:'COMP',text:'I have researched the rules of social interactions (for example, by studying psychology or reading books on human behaviour) to improve my own social skills'},
    {n:18,subscale:'MASK',text:'I am always aware of the impression I make on other people'},
    {n:19,subscale:'ASSIM',text:'I feel free to be myself when I am with other people'},
    {n:20,subscale:'COMP',text:'I learn how people use their bodies and faces to interact by watching television or films, or by reading fiction'},
    {n:21,subscale:'MASK',text:'I adjust my body language or facial expressions so that I appear relaxed'},
    {n:22,subscale:'ASSIM',text:'When talking to other people, I feel like the conversation flows naturally'},
    {n:23,subscale:'COMP',text:'I have spent time learning social skills from television shows and films, and try to use these in my interactions'},
    {n:24,subscale:'MASK',text:'In social interactions, I do not pay attention to what my face or body are doing'},
    {n:25,subscale:'ASSIM',text:'In social situations, I feel like I am pretending to be ‘normal’'}
  ],
  subscales:{
    COMP:{name:'Compensation', items:[1,4,5,8,11,14,17,20,23], min:9, max:63, desc:'Strategies used to actively compensate for difficulties in social situations.'},
    MASK:{name:'Masking', items:[2,6,9,12,15,18,21,24], min:8, max:56, desc:'Strategies used to hide autistic characteristics or portray a non-autistic persona.'},
    ASSIM:{name:'Assimilation', items:[3,7,10,13,16,19,22,25], min:8, max:56, desc:'Strategies that reflect trying to fit in with others in social situations.'}
  },
  /* gender-matched comparison groups: gender → {non, aut} → {n, total, subscale…}
     → {m, sd}. Hull et al. (2020) Table 1, unadjusted means, gender as
     self-identified. 'diverse' = the paper's non-binary groups (n=27 / n=16),
     which the authors call preliminary; the report shows them without
     percentiles. Source inconsistency, kept as printed: diverse.aut subscale
     means sum to 119.44, not the printed total 122.00 (every other group sums
     to its total within 0.01). */
  genderNorms:{
    man:{
      non:{n:193, total:{m:96.89,sd:24.22}, COMP:{m:30.06,sd:10.92}, MASK:{m:36.34,sd:8.13}, ASSIM:{m:30.48,sd:10.33}},
      aut:{n:108, total:{m:109.64,sd:26.50}, COMP:{m:36.81,sd:12.14}, MASK:{m:32.90,sd:10.57}, ASSIM:{m:39.93,sd:11.26}}
    },
    woman:{
      non:{n:252, total:{m:90.87,sd:27.67}, COMP:{m:27.18,sd:11.50}, MASK:{m:34.69,sd:9.05}, ASSIM:{m:29.00,sd:11.73}},
      aut:{n:182, total:{m:124.35,sd:23.27}, COMP:{m:41.85,sd:11.11}, MASK:{m:37.87,sd:10.54}, ASSIM:{m:44.63,sd:7.82}}
    },
    diverse:{
      non:{n:27, total:{m:109.44,sd:27.20}, COMP:{m:35.48,sd:11.32}, MASK:{m:38.70,sd:7.61}, ASSIM:{m:35.26,sd:12.11}},
      aut:{n:16, total:{m:122.00,sd:17.12}, COMP:{m:43.50,sd:9.89}, MASK:{m:36.06,sd:8.78}, ASSIM:{m:39.88,sd:6.43}}
    }
  },
  /* Score DISTRIBUTIONS per group, as Gaussian mixtures [[weight, mean, sd], …]
     (weights sum to 1). Traced from the kernel-density curves in Hull et al.
     (2020) Figure 1 (total) and Supplementary Figure 1 (subscales), one line
     style per gender (solid = women, dashed = men, dotted = non-binary, as the
     figure legend says; the supplementary caption has women and men swapped,
     and the traced means confirm the legend). Each fit had area 0.95–1.01 and
     reproduced the Table 1 mean within 1.2 points (women/men) or 3.0 (non-
     binary). Each curve was then shifted and rescaled about its mean (factor
     0.80–0.96) so its mean and SD equal Table 1 exactly: a KDE keeps the sample
     mean but adds its smoothing width to the SD. Drawn on the report and used
     for approximate percentiles (women and men only). Reproduce with
     scripts/catq_trace/. */
  distributions:{
    total:{
      woman:{non:[[0.5127,79.01,18.92],[0.0889,52.66,14.2],[0.3367,111.09,17.24],[0.0617,134.18,11.9]], aut:[[0.2018,95.13,13.59],[0.0105,47.34,9.43],[0.5677,137.7,15.37],[0.22,120.37,11.69]]},
      man:{non:[[0.2767,70.39,14.18],[0.2835,93.4,12.89],[0.4383,116.06,16.58],[0.0015,41.62,4.53]], aut:[[0.0663,81.5,9.7],[0.0697,58.58,11.66],[0.7642,113.8,22.22],[0.0998,132.14,10.69]]},
      diverse:{non:[[0.0971,65.39,10.6],[0.821,110.62,21.84],[0.0477,142.75,7.38],[0.0342,159.9,12.37]], aut:[[0.0655,108.44,7.47],[0.0384,129.01,6.21],[0.8689,121.51,16.35],[0.0272,160.72,5.06]]}
    },
    COMP:{
      woman:{non:[[0.5723,31.67,10.6],[0.0917,12.61,4.43],[0.2922,20.66,6.45],[0.0438,42.3,3.66]], aut:[[0.0726,20.1,6.67],[0.2517,34.59,6.7],[0.604,45.6,7.36],[0.0717,57.77,5.11]]},
      man:{non:[[0.0583,13.34,4.64],[0.0956,32.47,4.7],[0.2381,21.39,5.93],[0.608,34.68,9.92]], aut:[[0.0082,31.63,2.95],[0.1938,38.62,5.39],[0.3817,24.92,8.68],[0.4163,46.97,6.04]]},
      diverse:{non:[[0.0881,18.8,4.31],[0.2555,26.27,4.88],[0.5037,37.85,6.19],[0.1527,52.71,6.67]], aut:[[0.0419,30.59,4.11],[0.5622,37.44,5.46],[0.2445,54.48,6.38],[0.1514,51.85,4.24]]}
    },
    MASK:{
      woman:{non:[[0.1931,22.71,6.72],[0.1527,29.39,4.02],[0.629,38.99,5.62],[0.0252,51.28,3.2]], aut:[[0.1215,34.74,5.01],[0.0993,39.89,4.17],[0.3336,27.69,8.91],[0.4456,45.89,5.82]]},
      man:{non:[[0.0068,12.31,2.73],[0.3141,28.26,5.2],[0.6533,40.09,5.71],[0.0258,46.15,2.63]], aut:[[0.1007,15.48,5.7],[0.4303,31.53,6.16],[0.1009,21.68,4.33],[0.3681,42.34,6.02]]},
      diverse:{non:[[0.075,27.26,3.0],[0.5805,36.17,5.33],[0.3149,44.61,5.25],[0.0296,54.48,2.58]], aut:[[0.0609,19.24,3.57],[0.572,34.47,8.13],[0.2272,38.62,3.72],[0.1399,45.74,3.85]]}
    },
    ASSIM:{
      woman:{non:[[0.1701,14.49,5.27],[0.5327,26.46,7.53],[0.1213,37.01,4.87],[0.1759,45.17,6.2]], aut:[[0.2467,37.72,6.49],[0.012,13.95,4.23],[0.4529,45.2,5.0],[0.2884,50.93,3.98]]},
      man:{non:[[0.0103,10.42,3.23],[0.1643,17.55,4.6],[0.2791,28.01,5.42],[0.5463,36.01,9.07]], aut:[[0.027,17.83,4.08],[0.2723,28.04,9.01],[0.5311,43.26,5.89],[0.1696,52.14,4.2]]},
      diverse:{non:[[0.0935,13.99,4.84],[0.4129,28.6,7.18],[0.1049,39.95,4.15],[0.3887,46.18,5.59]], aut:[[0.108,50.54,3.54],[0.0014,40.27,0.82],[0.7675,40.02,4.18],[0.1231,29.68,3.51]]}
    }
  },
  smallGroupN:30,
  normsSource:'Hull et al. (2020), Autism 24(2):352–363, Table 1 (unadjusted means). Online UK, North American and European sample, n=778; autism diagnosis self-reported as given by a healthcare professional, self-diagnosed people excluded. Group curves are traced from the paper’s Figure 1 and Supplementary Figure 1 and matched to the Table 1 means and SDs; percentiles read from them are approximate. The non-binary groups (n=27, n=16) are shown as distance from the mean in SDs, not percentiles.',
  report:{caveat:'The CAT-Q measures how often someone reports using camouflaging strategies. It is not a screening or diagnostic tool for autism: there is no cut-off, and its authors advise against using scores to label someone a ‘high’ or ‘low’ camouflager, to suggest autistic or non-autistic group membership, or to track treatment outcome (Hannon et al. 2026). People without autism also camouflage, and scores rise with social anxiety. Use the subscales and the most strongly endorsed items as a starting point for the developmental interview.'},
  notes:[
    'Total range 25–175. Compensation 9–63, Masking 8–56, Assimilation 8–56. Higher = more camouflaging.',
    'Items 3, 12, 19, 22 and 24 are reverse-scored.',
    'No published cut-off. Position is shown against gender-matched autistic and non-autistic groups (Hull et al. 2020).',
    'Masking separates autistic from non-autistic groups least well (Hull et al. 2019); in the 2020 sample non-autistic men scored higher on Masking than autistic men.',
    'Validated in adults aged 16 and over without intellectual disability; it relies on the person being able to reflect on their own behaviour.',
    'Scores fall with age in non-autistic adults but stay high in autistic adults (Lundin Remnélius & Bölte 2024; Ai et al. 2024). The Hull (2020) non-autistic groups averaged about 30 years old, so for older clients the non-autistic comparison is likely set too high.',
    'Clinical use (Hannon et al. 2026, the CAT-Q authors): an information-gathering tool within a multi-method assessment. Not a screen, no cut-off, not for deciding autistic status, not an outcome measure.'
  ]
}});

/* ── LSAS-SR — Liebowitz Social Anxiety Scale (Self-Report) ────────────────────
   24 social situations, each rated on TWO 0–3 dimensions: Fear/anxiety and
   Avoidance (over the past week). We model this as 48 linear items (a Fear item
   and an Avoidance item per situation, interleaved) so the standard runner can
   drive it. Total 0–144 (Fear 0–72 + Avoidance 0–72). Items split into
   Performance (13) and Social-interaction (11) subsets. Severity bands + the
   conventional ≥30 (possible SAD) and ≥60 (likely generalized) cut-offs.
   Screening aid only — not diagnostic.
─────────────────────────────────────────────────────────────────────────── */
(function(){
  const SIT = [
    'Using a telephone in public',
    'Participating in a small group activity',
    'Eating in public',
    'Drinking with others',
    'Talking to someone in authority',
    'Acting, performing or speaking in front of an audience',
    'Going to a party',
    'Working while being observed',
    'Writing while being observed',
    'Calling someone you don’t know very well',
    'Talking face to face with someone you don’t know very well',
    'Meeting strangers',
    'Urinating in a public bathroom',
    'Entering a room when others are already seated',
    'Being the centre of attention',
    'Speaking up at a meeting',
    'Taking a test of ability, skill or knowledge',
    'Expressing disagreement or disapproval to someone you don’t know very well',
    'Looking someone you don’t know very well in the eyes',
    'Giving a prepared oral talk to a group',
    'Trying to make someone’s acquaintance for a romantic or sexual relationship',
    'Returning goods to a store for a refund',
    'Giving a party',
    'Resisting a high-pressure salesperson'
  ];
  // Liebowitz's rational split, read off the (P)/(S) tag printed against every
  // item on the original scale (Liebowitz 1987, Fig. 1), and matching the 13 / 11
  // counts the author's 2003 guidelines give at §II.3. Note 21 ("trying to pick
  // up someone") is tagged P despite being interpersonal, and 15 ("being the
  // center of attention") is S despite sounding like performance: the tags are
  // the author's, not inferred. The list supplied at build time had only 12.
  const PERF = new Set([1,2,3,4,6,8,9,13,14,16,17,20,21]);   // performance items; rest = social interaction
  const fearOpts  = [{label:'None',v:0},{label:'Mild',v:1},{label:'Moderate',v:2},{label:'Severe',v:3}];
  // Avoidance is the ONLY anchored scale on the LSAS, and its two sources
  // disagree by one point. The original form (Liebowitz 1987, Fig. 1) prints
  // "2 = Often (33-67%)", which overlaps its neighbours at both 33 and 67. The
  // author's later guidelines resolve that deliberately, twice: §IV.2 prints
  // 0% / 1-33% / 34-66% / 67-100%, and §II.4 spells it out as "more than 33%,
  // but less than 67%". We follow the 2003 resolution, since an overlapping
  // anchor gives two correct answers for the same behaviour.
  const avoidOpts = [{label:'Never (0%)',v:0},{label:'Occasionally (1–33%)',v:1},{label:'Often (34–66%)',v:2},{label:'Usually (67–100%)',v:3}];
  // Plain-language "what counts here" for each situation, paraphrased from the
  // Liebowitz (2003) administration guidance (the manual prose is copyrighted, so
  // these are our own concise wordings of the same clinical intent). Index = SIT.
  const HELP = [
    'On the phone where people nearby could overhear you (e.g. payphones side by side in a public place).',
    'Joining in a discussion with a few others, at work or socially.',
    'Eating with other people present. The worry is usually trembling or looking awkward handling food or utensils, not dining out alone.',
    'Drinking any beverage (not just alcohol) with others. The worry is usually shaking or looking awkward holding the cup or glass.',
    'Someone in authority, a boss, teacher or similar, covering required meetings (reviews, organised meetings) as well as optional or chance encounters.',
    'Acting, performing or giving a talk, assume a sizeable audience of around 50 or more.',
    'A party where you know some, but not all, of the people.',
    'Any kind of work being watched, including schoolwork or jobs around the home.',
    'Writing while someone watches, e.g. signing a cheque or card receipt, not writing an essay.',
    'Phoning a casual acquaintance of average importance to you, not a make-or-break call.',
    'A face-to-face conversation with a casual acquaintance (someone you know slightly).',
    'A face-to-face conversation with someone you have not met before.',
    'Using a public toilet with others sometimes present, as usual. (For men, using a stall when urinals are free can itself reflect avoidance.)',
    'Walking into a room where people are already seated and likely to look up, assume no one has to move for you.',
    'Being the focus of a group, e.g. telling a story, or people singing “Happy Birthday” to you.',
    'Speaking without preparation, from your seat in a small meeting, or standing up in a larger one.',
    'A written test that will be graded.',
    'Disagreeing or expressing disapproval in an appropriate situation, not when feeling enraged.',
    'Making normal, appropriate eye contact with someone you know only slightly.',
    'Giving an oral talk to a small group, with time to prepare beforehand.',
    'Approaching someone to start a romantic or sexual relationship. If you are in a relationship, imagine “if you were single…”.',
    'Returning goods to a shop where returns are normally accepted.',
    'Hosting an average party (people usually know more of the guests at a party they host).',
    'Standing your ground with a pushy salesperson, avoidance might mean buying something unwanted, or sitting through a sales pitch longer than you want.'
  ];
  const items = [];
  SIT.forEach((text, idx)=>{
    const i = idx+1; const group = PERF.has(i) ? 'performance' : 'social'; const help = HELP[idx];
    items.push({n:i,     dim:'fear',  sit:i, group, optionSet:'fear',  text, help,
      prompt:'How much fear or anxiety would this cause you?', timeframe:'FEAR · anxiety', sectionKey:'fear'});
    items.push({n:i+100, dim:'avoid', sit:i, group, optionSet:'avoid', text, help,
      prompt:'How often would you avoid this situation?', timeframe:'AVOIDANCE · how often', sectionKey:'avoid'});
  });
  items[0].sectionIntro = {
    tag:'How to answer',
    title:'Two quick ratings per situation',
    blurb:'For each of the 24 situations, thinking about the past week, you’ll give two ratings: how much fear or anxiety it would cause, and how often you would avoid it. Each situation appears twice, once for each rating.'
  };
  Object.assign(REGISTRY, {"lsas":{
    id:'lsas',
    name:'LSAS',
    fullName:'Liebowitz Social Anxiety Scale (Self-Report)',
    verified:{ date:'2026-08-03', note:'All 24 situations, their order, and the (P) / (S) performance / social-interaction allocation (13 / 11) verified against the scale as published (Liebowitz 1987, Fig. 1); item stems follow the modern self-report form with UK adaptations kept by choice (centre, shop, cheque, high-pressure salesperson). Response anchors, the past-week frame, all 24 per-situation conventions and the rater guidance verified against the author\'s own Guidelines for Using the LSAS (2003). The avoidance anchors follow that manual\'s 0 / 1-33 / 34-66 / 67-100% (§IV.2 and §II.4), which deliberately resolves the overlapping 33-67% printed on the 1987 form. Cut-offs 30 (social anxiety disorder vs none) and 60 (generalized vs non-generalized) are Mennin et al. (2002), cited as such by Liebowitz. Clinical-sample norms (7 mean/SD pairs) matched cell-by-cell to Baker, Heinrichs, Kim & Hofmann (2002) Table 2, N=175. The Safren et al. (1999) four-factor panel matched cell-by-cell to Tables 3 and 4: item sets, Cronbach alphas and factor means/SDs for both fear and avoidance, including the cross-loaded items each half drops. Two things deliberately NOT claimed: the six severity words are the National Social Anxiety Center\'s interpretation table, not a validation study, and so are shown as description only without driving the result colour; and the N=382 sample size quoted in the factor panel\'s source line comes from the citation rather than a checked reading of the paper\'s method section.' },
    category:'mood',
    status:'live',
    respondent:'Self-report',
    ageRange:'18+ years (adults)',
    estMinutes:'5–10 min',
    description:'Self-report social-anxiety scale: 24 situations rated for fear and avoidance, giving a total severity score.',
    citation:'Liebowitz MR (1987), Mod Probl Pharmacopsychiatry 22:141–173; administration conventions from the author\'s own Guidelines for Using the LSAS (Liebowitz 2003); cut-offs from Mennin et al. (2002), J Anxiety Disord 16:661–673; self-report version (Fresco et al. 2001; Baker et al. 2002).',
    licence:'Free for clinical and research use.',
    higherMeans:'greater social anxiety (fear + avoidance)',
    scoring:{
      type:'lsas',
      optionSets:{ fear:fearOpts, avoid:avoidOpts },
      totalMax:144,
      cutoff:30,
      cutoff2:60,
      performanceItems:[...PERF].sort((a,b)=>a-b),
      socialItems:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].filter(n=>!PERF.has(n)),
      // Six severity LABELS, and deliberately no `cls`: the colour pill does not
      // follow these boundaries. They are the interpretation table circulated by
      // the National Social Anxiety Center, which has no validation study behind
      // it, and "Marked from 65" in particular is not a published threshold
      // anywhere. Colour is derived instead from the two thresholds that ARE
      // published, 30 and 60, in Scoring.lsas -> bandCls. The words still change
      // at the boundaries below, so nothing is lost from the description.
      severity:[
        {max:29, label:'Minimal',      note:'Below the ≥30 screening cut-off'},
        {max:49, label:'Mild',         note:'At or above the ≥30 screening cut-off'},
        {max:64, label:'Moderate',     note:'Above the ≥30 screening cut-off; 60 or more also reaches the generalized threshold'},
        {max:79, label:'Marked',       note:'High severity range'},
        {max:94, label:'Severe',       note:'Very high impairment likely'},
        {max:null,label:'Very severe', note:'Extremely high symptom burden'}
      ]
    },
    items,
    bandRanges:['0–29','30–49','50–64','65–79','80–94','95–144'],
    cutoffs:[
      {score:30, label:'Possible social anxiety disorder', note:'Rytwinski 2009: on this self-report version, the best balance for social anxiety disorder vs no disorder (sensitivity 95%, specificity 89%); Mennin 2002 found the same cut-off on the clinician-rated LSAS.'},
      {score:60, label:'High likelihood of generalized social anxiety', note:'Rytwinski 2009: on this self-report version, the best balance for the generalized vs non-generalized form (sensitivity 83%, specificity 78%); Mennin 2002 found the same cut-off on the clinician-rated LSAS.'}
    ],
    // Safren et al. (1999) exploratory four-factor structure. Fear and avoidance
    // loaded differently; cross-loading / non-loading items are excluded, so this
    // is a DESCRIPTIVE supplement, not a validated subscale score. Item numbers
    // match the situation index; the scorer reads fear from n and avoidance from n+100.
    safrenFactors:{
      source:'Safren, Heimberg, Horner, Juster, Schneier & Liebowitz (1999), J Anxiety Disord 13:253–270, exploratory common factor analysis (N=382 clinical; clinician-administered LSAS, a separate sample from the Baker 2002 norms). Items that cross-loaded or did not load are excluded; fear and avoidance use slightly different item sets. Factor means/SDs are unit-weighted factor scores (item average, 0–3) from Tables 3 (fear) and 4 (avoidance).',
      order:['social','speaking','observation','eating'],
      // norm = the factor score AS AN ITEM MEAN (0–3), per the paper's unit-weighted
      // scoring; the report compares the client's factor mean (score ÷ items answered).
      fear:{
        social:{name:'Social interaction', items:[5,7,10,11,12,18,19,21], alpha:0.88, norm:{mean:1.62, sd:0.74}},
        speaking:{name:'Public speaking', items:[2,6,15,16,20], alpha:0.80, norm:{mean:2.30, sd:0.62}},
        observation:{name:'Observation by others', items:[1,9,13,17], alpha:0.56, norm:{mean:0.96, sd:0.64}},
        eating:{name:'Eating & drinking in public', items:[3,4], alpha:0.78, norm:{mean:0.68, sd:0.88}}
      },
      avoid:{
        social:{name:'Social interaction', items:[5,10,11,12,18,19,21], alpha:0.86, norm:{mean:1.49, sd:0.81}},
        speaking:{name:'Public speaking', items:[2,6,15,16,20], alpha:0.83, norm:{mean:2.13, sd:0.75}},
        observation:{name:'Observation by others', items:[9,13,17], alpha:0.56, norm:{mean:0.56, sd:0.68}},
        eating:{name:'Eating & drinking in public', items:[3,4], alpha:0.75, norm:{mean:0.66, sd:0.68}}
      }
    },
    // Baker, Heinrichs, Kim & Hofmann (2002), Behav Res Ther 40:701–715, Table 2.
    // Reference sample = ~175 treatment-seeking adults with DSM-IV social phobia.
    // Keys match the scorer's output fields so the report can map them directly.
    // Percentiles derived from these are RELATIVE TO OTHER SAD PATIENTS, not the
    // general population — a mid percentile still means clinically significant SAD.
    clinicalNorms:{
      total:    {mean:69.1, sd:25.5},
      fear:     {mean:37.2, sd:12.9},
      avoidance:{mean:33.2, sd:14.4},
      perfFear: {mean:19.5, sd:6.1},   // performance · fear  (low test–retest r=.53)
      perfAvoid:{mean:16.6, sd:7.3},   // performance · avoidance
      socFear:  {mean:18.9, sd:7.3},   // social-interaction · fear
      socAvoid: {mean:16.6, sd:7.9}    // social-interaction · avoidance
    },
    normsSource:'Baker, Heinrichs, Kim & Hofmann (2002), Behav Res Ther 40:701–715, Table 2, ~175 treatment-seeking adults with DSM-IV social phobia. Percentiles are this client\'s standing WITHIN that clinical sample, not the general population: a mid-range percentile still reflects clinically significant social anxiety. Normal-distribution approximation.',
    // Shown only when a clinician administers this as a structured interview
    // (Administer with patient). Paraphrased from the Liebowitz (2003) rater notes.
    adminGuide:[
      'Orient first: ratings cover the past week, and the person should rate how they would feel and act even in situations they did not actually meet this week.',
      'Two scales per situation, fear/anxiety (none → severe) and avoidance by how often it is avoided (0% · 1–33% · 34–66% · 67–100%). Have them rate avoidance on the avoidance scale; don’t convert a fear rating yourself.',
      'Cover the whole range for each item, not just one recent instance, ask whether other examples were avoided too.',
      'Don’t lead. Ask “is there any avoidance?” rather than assuming it, and rate what is actually avoided, not what they wish they could avoid.',
      'Probe obvious inconsistencies (e.g. high avoidance but little anxiety) for clarification, that is not leading.',
      'If they deny fear but report discomfort in a situation, rate it as present.'
    ],
    report:{caveat:'The LSAS is a symptom-severity screen for social anxiety, not a diagnosis. A total of ≥30 suggests possible social anxiety disorder and ≥60 a high likelihood of the generalized form; confirm clinically.'},
    notes:[
      'Each of the 24 situations is rated twice (Fear 0–3, Avoidance 0–3) over the past week; total 0–144 (Fear 0–72 + Avoidance 0–72).',
      'Performance items: 1,2,3,4,6,8,9,13,14,16,17,20,21 (13). Social-interaction items: the remaining 11. This is the author\'s own allocation, taken from the (P) / (S) tag printed against each item on the original scale (Liebowitz 1987, Fig. 1) and matching the 13 / 11 counts in his 2003 guidelines. Two of the tags are counter-intuitive and are still his: item 21 is performance, item 15 is social interaction.',
      'Cut-offs: ≥30 classified social anxiety disorder against no disorder, and ≥60 discriminated the generalized from the non-generalized form, on this self-report version in Rytwinski et al. (2009), the same values Mennin et al. (2002) found on the clinician-administered LSAS and cited in the author\'s own guidelines. These two thresholds drive the result colour.',
      'The six severity words (Minimal / Mild / Moderate / Marked / Severe / Very severe) come from the interpretation table circulated by the National Social Anxiety Center, not from a validation study. They are shown as description only. Read the total and the two published cut-offs above the label.',
      'Developed and validated in adults (Safren 1999 sample 18–61). For under-18s use the dedicated child/adolescent version (LSAS-CA), which is a separate instrument.',
      'Liebowitz designed the LSAS as a clinician-administered interview and did not intend it as a self-rated scale, though it is widely used as one; the two modes agree reasonably well where the person has been briefed properly on the conventions first (Fresco et al. 2001). The per-situation notes in this form carry that briefing, and "Administer with patient" gives the rater guidance.'
    ]
  }});
})();

/* ── DSM-5 Severity Measure for Social Anxiety Disorder (Social Phobia) — Child ──
   APA "emerging measure": 10 items rated 0–4 for the past 7 days (Never … All of
   the time). Total 0–40; the Average Total Score (total ÷ 10) reduces to a 0–4
   severity anchor — none(0)/mild(1)/moderate(2)/severe(3)/extreme(4). Child
   self-report, ages 11–17. Free to reproduce for research/clinical use (APA).
   Generic 'dsm5severity' scoring type so other DSM-5 severity measures can reuse it.
─────────────────────────────────────────────────────────────────────────── */
Object.assign(REGISTRY, {"sad_child":{
  id:'sad_child',
  name:'SAD severity (child)',
  fullName:'Severity Measure for Social Anxiety Disorder (Social Phobia): Child age 11–17',
  category:'mood',
  status:'live',
  respondent:'Child self-report (11–17)',
  ageRange:'11–17 years',
  estMinutes:'2–3 min',
  description:'DSM-5 10-item measure of social-anxiety symptom severity over the past 7 days, for children and adolescents.',
  citation:'Craske, Wittchen, Bögels, Stein, Andrews & LeBeau; © 2013 American Psychiatric Association (DSM-5 emerging measures).',
  licence:'Reproducible without permission for research and clinical use (APA).',
  higherMeans:'greater social-anxiety severity',
  prompt:'During the past 7 days, I have…',
  scoring:{
    type:'dsm5severity',
    options:[
      {label:'Never'},{label:'Occasionally'},{label:'Half of the time'},{label:'Most of the time'},{label:'All of the time'}
    ],
    totalMax:40,
    anchors:['None','Mild','Moderate','Severe','Extreme']
  },
  items:[
    {n:1, text:'felt moments of sudden terror, fear, or fright in social situations'},
    {n:2, text:'felt anxious, worried, or nervous about social situations'},
    {n:3, text:'had thoughts of being rejected, humiliated, embarrassed, ridiculed, or offending others'},
    {n:4, text:'felt a racing heart, sweaty, trouble breathing, faint, or shaky in social situations'},
    {n:5, text:'felt tense muscles, felt on edge or restless, or had trouble relaxing in social situations'},
    {n:6, text:'avoided, or did not approach or enter, social situations'},
    {n:7, text:'left social situations early or participated only minimally (e.g., said little, avoided eye contact)'},
    {n:8, text:'spent a lot of time preparing what to say or how to act in social situations'},
    {n:9, text:'distracted myself to avoid thinking about social situations'},
    {n:10,text:'needed help to cope with social situations (e.g., alcohol or medications, superstitious objects)'}
  ],
  report:{caveat:'A DSM-5 symptom-severity measure to support clinical decision-making and track change, not a diagnostic instrument or the sole basis for a diagnosis.'},
  notes:[
    'Each item rated 0–4 (Never … All of the time) for the past 7 days; total 0–40.',
    'Average Total Score = total ÷ 10, interpreted on a 0–4 anchor: none(0), mild(1), moderate(2), severe(3), extreme(4).',
    'Designed for repeat use to monitor severity over time; persistently high items may warrant further assessment.'
  ]
}});

/* ── Coventry Grid (clinician differential aid: ASD vs attachment) ─────────────
   A clinician tool to help distinguish autism-spectrum presentations from those
   arising from attachment difficulties / maltreatment — features overlap and can
   co-occur. Each behaviour points to one pole (ASD-consistent or attachment-
   consistent); the clinician marks whether it's present, and the tool tallies the
   two poles overall and by category. NOT a diagnostic test or a cut-off score —
   it structures clinical judgement. Adapted from the Coventry Grid (Moran 2010).
─────────────────────────────────────────────────────────────────────────── */
(function(){
  // [category, pole('asd'|'att'), question]
  const D = [
    ['Routine','asd','Do they have problems with birthdays and Christmas and find it hard to share the excitement?'],
    ['Routine','att','Do they get distressed or avoid anniversaries or times such as Christmas, possibly because of difficult memories (as opposed to the social and sensory overload of gatherings and the change in routine)?'],
    ['Routine','asd','Does everything tend to revolve around his or her special interests?'],
    ['Eating','asd','Is food restricted by texture or colour?'],
    ['Eating','asd','Is restricted diet about maintaining sameness?'],
    ['Eating','att','Does the child hoard food or binge eat?'],
    ['Language','asd','Does the child use language repetitively?'],
    ['Language','asd','Does the child use made-up words?'],
    ['Language','asd','Does the child have overly formal or stilted language?'],
    ['Language','asd','Does the child over-use stock phrases or words (e.g. “basically”, “actually”, or phrases from the TV)?'],
    ['Language','att','Does the child say things to shock or for a reaction?'],
    ['Treasured objects','att','Does the child try to make others approve of or envy his or her possessions?'],
    ['Treasured objects','att','Does s/he deliberately destroy treasured objects when angry?'],
    ['Treasured objects','asd','When given a new toy, does s/he still favour old toys?'],
    ['Play','asd','Does the child collect and order or arrange particular toys or objects?'],
    ['Play','asd','Does the child prefer to play alone?'],
    ['Play','asd','Does the child play mechanically with toys rather than creating stories about them (e.g. lining up and ordering)?'],
    ['Play','att','Does the child play dramatic or traumatic games which may mirror things that have happened in their own lives?'],
    ['Play','asd','Does the child play with unusual things?'],
    ['Play','asd','Does the child play a limited range of activities?'],
    ['Play','att','Can the child take on different roles in pretend play?'],
    ['Play','att','Does the child struggle to end role-play games?'],
    ['Social interaction','att','Does the child seek to provoke strong emotional reactions in others?'],
    ['Social interaction','att','Does the child show an awareness of his or her own role in interactions?'],
    ['Social interaction','asd','Does the child struggle to understand how interactions with teachers may be different from interactions with friends or peers?'],
    ['Social interaction','asd','Does the child show less of an awareness to share than you would expect for his or her age?'],
    ['Social interaction','att','Are they aware but too anxious to share, and so hoard possessions?'],
    ['Social interaction','att','Does the child steal or take things to hoard?'],
    ['Mind reading','att','Does s/he refer to other people’s views and feelings?'],
    ['Mind reading','asd','Does s/he think you know about situations when you have not been present?'],
    ['Mind reading','att','Is s/he aware of the types of information you are interested to hear about (e.g. what went well at school today)?'],
    ['Mind reading','att','Does the child exaggerate and elaborate stories?'],
    ['Mind reading','att','Is s/he hypervigilant to others’ feelings and actions, especially anger?'],
    ['Mind reading','asd','Does s/he ever find it hard to distinguish fact from fiction?'],
    ['Mind reading','att','Does s/he often tell sophisticated lies?'],
    ['Communication','att','Does the child seek to get their needs met by making loud or unusual noises for attention?'],
    ['Communication','asd','Does s/he give detail in a pedantic fashion and give excessive detail?'],
    ['Communication','asd','Does s/he have a poor awareness of others in a conversation?'],
    ['Communication','att','Does he or she understand jokes and sarcasm?'],
    ['Communication','att','Does he or she seem overly sensitive to tone of voice?'],
    ['Communication','att','Does the child worry his or her needs won’t be met if you are running late for them?'],
    ['Executive functioning','att','Does waiting have an emotional significance (e.g. do they relate waiting to neglect, or to having or losing emotional control over someone)?'],
    ['Executive functioning','asd','Does waiting upset the child because it upsets their routine?'],
    ['Executive functioning','asd','Does s/he dislike getting a hug from another person when s/he has not initiated this?'],
    ['Executive functioning','asd','Does the child seem unaware of personal space?'],
    ['Sensory, general','asd','Is the child’s awareness of hot and cold or pain unusual?'],
    ['Sensory, eating','asd','Does the child seek or avoid particular foods or textures?'],
    ['Sensory, eating','att','Does the child use food to self-soothe or comfort?'],
    ['Sensory, eating','att','Does the child use food to control, hoard or create an emotional response from key figures?'],
    ['Sensory, motor','asd','Does the child tend to bump into things, spill drinks or trip over?'],
    ['Sensory, motor','att','Is the child able to learn new motor skills easily (e.g. ride a bike, swim)?'],
    ['Sensory, movement','asd','Does the child seek or avoid movement but not recognise the associated dangers involved?'],
    ['Sensory, movement','att','Does the child intentionally seek out risk through movement?'],
    ['Sensory, movement','asd','Does the child swing between over- and under-activity throughout the day?'],
    ['Sensory, tactile','asd','Does the child seek or avoid exploring through touch?'],
    ['Sensory, tactile','asd','Does the child seek deep pressure (e.g. firm hugs)?'],
    ['Sensory, tactile','asd','Is the child overly sensitive to texture of clothing (e.g. labels, seams)?'],
    ['Sensory, auditory','asd','Is the child unable to filter out sounds so that it impairs everyday activities (e.g. noises outside, conversations, hum of machines)?'],
    ['Sensory, auditory','att','Is the child more hypervigilant to sounds associated with a previous trauma?'],
    ['Sensory, visual','asd','Is the child often seeking or avoiding visual stimuli (e.g. wearing sunglasses, seeking patterns, lining up coloured pencils, finger movements in front of their eyes)?'],
    ['Sensory, visual','att','Does the child scan the environment and seek and recall information essential for maintaining their safety?'],
    ['Sensory, smell','asd','Does the child seek or avoid smells (e.g. sniffing food before eating it)?'],
    ['Sensory, smell','att','Is the child reactive to smells associated with key attachment figures or key events?']
  ];
  const NOTES = {
    21:'Some autistic females can take on different roles in pretend play.',
    32:'Autistic females can have elaborate fantasy worlds.',
    34:'In an attachment picture this may relate only to perceived threats.'
  };
  const slug = c => c.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  const items = [], subscales = {};
  D.forEach((row,i)=>{
    const [cat, pole, text] = row; const n = i+1; const key = slug(cat);
    if(!subscales[key]) subscales[key] = { name:cat, items:[] };
    subscales[key].items.push(n);
    const it = { n, subscale:key, category:cat, pole, optionSet:'cov', text };
    if(NOTES[n]) it.note = NOTES[n];
    items.push(it);
  });
  items[0].sectionKey = 'start';
  items[0].sectionIntro = { tag:'Clinician aid', title:'Comparing two explanations',
    blurb:'For each behaviour, mark whether it is present. Some behaviours point towards an autism-spectrum explanation and others towards an attachment / relational one; the tool tallies both. Features overlap and can co-occur, this structures judgement, it is not a diagnostic score.' };
  Object.assign(REGISTRY, {"coventry":{
    id:'coventry',
    name:'Coventry Grid',
    fullName:'Coventry Grid, autism vs attachment differential aid',
    category:'autism',
    status:'live',
    respondent:'Clinician-rated',
    ageRange:'Children & young people',
    estMinutes:'15–25 min',
    description:'Clinician aid to help distinguish autism-spectrum presentations from attachment/relational ones, comparing features across many domains.',
    citation:'Adapted from the Coventry Grid (Moran H, 2010, Good Autism Practice); revised editions thereafter.',
    licence:'Clinical aid, free for clinical use.',
    higherMeans:'more features present on a given pole (ASD-consistent or attachment-consistent)',
    itemNotes:true,
    scoring:{
      type:'coventry',
      optionSets:{ cov:[
        {label:'Present', v:1},
        {label:'Not present', v:0},
        {label:'Unclear', v:-1}
      ]}
    },
    items,
    subscales,
    report:{caveat:'The Coventry Grid is a clinical aid to help distinguish autism-spectrum presentations from those arising from attachment difficulties or maltreatment. Features overlap and frequently co-occur, it is NOT a diagnostic test and has no cut-off score. Use it to structure clinical judgement within a full assessment.'},
    notes:[
      'Each behaviour points to one pole, autism-spectrum-consistent or attachment/relational-consistent. Marking it “present” tallies that pole.',
      'The comparison of the two poles (overall and by domain) is a clinical aid only, there is no validated cut-off, and a higher count on one side does not confirm anything.',
      'Autism and attachment difficulties can co-exist; a mixed picture is common and important.'
    ]
  }});
})();

/* ── WFIRS-S — Weiss Functional Impairment Rating Scale (Self-Report) ──────────
   Measures the impact of emotional/behavioural problems on functioning across 7
   domains (Family, Work, School, Life-skills, Self-concept, Social, Risk) — 69
   items rated 0–3 over the last month, with an N/A option excluded from scoring.
   A domain is "impaired" if its mean ≥1.5, OR ≥2 items rated 2, OR ≥1 item rated 3
   (DSM-IV-aligned rule). Deliberately excludes ADHD symptom items so functioning
   is assessed independently. Adolescents & adults; free for clinical/research use.
─────────────────────────────────────────────────────────────────────────── */
(function(){
  const DOMAINS = [
    {key:'family', name:'Family', items:[
      'Having problems with family',
      'Having problems with spouse/partner',
      'Relying on others to do things for you',
      'Causing fighting in the family',
      'Makes it hard for the family to have fun together',
      'Problems taking care of your family',
      'Problems balancing your needs against those of your family',
      'Problems losing control with family'
    ]},
    {key:'work', name:'Work', items:[
      'Problems performing required duties',
      'Problems with getting your work done efficiently',
      'Problems with your supervisor',
      'Problems keeping a job',
      'Getting fired from work',
      'Problems working in a team',
      'Problems with your attendance',
      'Problems with being late',
      'Problems taking on new tasks',
      'Problems working to your potential',
      'Poor performance evaluations'
    ]},
    {key:'school', name:'School', items:[
      'Problems taking notes',
      'Problems completing assignments',
      'Problems getting your work done efficiently',
      'Problems with teachers',
      'Problems with school administrators',
      'Problems meeting minimum requirements to stay in school',
      'Problems with attendance',
      'Problems with being late',
      'Problems with working to your potential',
      'Problems with inconsistent grades'
    ]},
    {key:'life', name:'Life skills', items:[
      'Excessive or inappropriate use of internet, video games or TV',
      'Problems keeping an acceptable appearance',
      'Problems getting ready to leave the house',
      'Problems getting to bed',
      'Problems with nutrition',
      'Problems with sex',
      'Problems with sleeping',
      'Getting hurt or injured',
      'Avoiding exercise',
      'Problems keeping regular appointments with doctor/dentist',
      'Problems keeping up with household chores',
      'Problems managing money'
    ]},
    {key:'self', name:'Self-concept', items:[
      'Feeling bad about yourself',
      'Feeling frustrated with yourself',
      'Feeling discouraged',
      'Not feeling happy with your life',
      'Feeling incompetent'
    ]},
    {key:'social', name:'Social', items:[
      'Getting into arguments',
      'Trouble cooperating',
      'Trouble getting along with people',
      'Problems having fun with other people',
      'Problems participating in hobbies',
      'Problems making friends',
      'Problems keeping friends',
      'Saying inappropriate things',
      'Complaints from neighbours'
    ]},
    {key:'risk', name:'Risky activities', items:[
      'Aggressive driving',
      'Doing other things while driving',
      'Road rage',
      'Breaking or damaging things',
      'Doing things that are illegal',
      'Being involved with the police',
      'Smoking cigarettes',
      'Smoking marijuana',
      'Drinking alcohol',
      'Taking “street” drugs',
      'Sex without protection (birth control, condom)',
      'Sexually inappropriate behaviour',
      'Being physically aggressive',
      'Being verbally aggressive'
    ]}
  ];
  const items = [];
  const subscales = {};
  let n = 0;
  DOMAINS.forEach(d=>{
    const ns = [];
    d.items.forEach(text=>{ n++; ns.push(n); items.push({n, subscale:d.key, optionSet:'wf', text}); });
    subscales[d.key] = { name:d.name, items:ns };
  });
  // first item of each domain gets a transition card (orients across 7 sections)
  DOMAINS.forEach(d=>{
    const first = items.find(it=>it.subscale===d.key);
    if(first){ first.sectionKey = d.key; first.sectionIntro = {
      tag:'Functioning', title:d.name,
      blurb:`The next questions are about how things have been with ${d.name.toLowerCase()} over the last month. Choose “N/A” for anything that doesn’t apply to you.`
    };}
  });
  Object.assign(REGISTRY, {"wfirs_s":{
    id:'wfirs_s',
    name:'WFIRS-S',
    formLabel:'Self-report',
    fullName:'Weiss Functional Impairment Rating Scale (self-report)',
    category:'adhd',
    status:'live',
    respondent:'Self-report',
    ageRange:'18+ years',
    estMinutes:'10–15 min',
    description:'Self-report of how emotional/behavioural problems affect everyday functioning across seven life domains, distinct from ADHD symptoms.',
    citation:'Weiss MD. Weiss Functional Impairment Rating Scale (WFIRS); CADDRA scoring guide (2025).',
    licence:'Free for clinical and research use (© M. D. Weiss).',
    higherMeans:'greater functional impairment',
    prompt:'Over the last month, how much have emotional or behavioural problems caused…',
    scoring:{
      type:'wfirs',
      optionSets:{ wf:[
        {label:'Never / not at all', v:0},
        {label:'Sometimes / somewhat', v:1},
        {label:'Often / much', v:2},
        {label:'Very often / very much', v:3},
        {label:'N/A', v:-1}
      ]},
      impairMean:1.5,
      // Reference samples for context (NOT population norms, NOT cut-offs, and
      // deliberately NO percentiles: neither paper publishes distributions, and
      // the raw data are right-skewed — in the non-ADHD group several domain SDs
      // exceed the mean on a 0-floored scale — so normal-theory percentiles from
      // mean/SD would fabricate precision. Bands are descriptive mean ±1 SD,
      // clipped at 0.)
      //  · adhd:    diagnosed adult-ADHD cohort, French (Quebec) translation,
      //             treatment-seeking, aged 18-71 (Micoulaud-Franchi 2018).
      //  · nonadhd: US college students 18-25 who did NOT meet a DSM-5 symptom
      //             research cutoff (self-report, not clinician-verified); their
      //             WFIRS-S version scores School over 11 items (ours 10) and a
      //             70-item total, so treat as a close approximation (Canu 2016).
      // Each band carries ageMin/ageMax = its source sample's age span; a band is
      // shown ONLY when the client's age falls inside it (results layer), so we
      // never plot a patient against a sample that didn't include their age. If
      // age is unknown, or outside both, no bands show (plain impairment bar).
      // WFIRS-P deliberately has neither (it has the Thompson ADHD screen).
      clinicalRefs:[
        { key:'adhd', ageMin:18, ageMax:71,
          label:'Diagnosed adult ADHD, French clinical sample (Micoulaud-Franchi 2018, N=363, ages 18–71)',
          short:'Diagnosed ADHD adults', color:'var(--rose)',
          citation:'Micoulaud-Franchi et al. (2019), J Atten Disord 23(10):1148–1159',
          domains:{
            family:{mean:1.66, sd:0.72}, work:{mean:1.52, sd:0.67},
            school:{mean:1.74, sd:0.60}, life:{mean:1.49, sd:0.57},
            self:{mean:2.21, sd:0.73}, social:{mean:1.35, sd:0.59},
            risk:{mean:0.82, sd:0.53}
          },
          total:{mean:1.43, sd:0.42} },
        { key:'nonadhd', ageMin:18, ageMax:25,
          label:'Non-ADHD US college students 18–25 (Canu 2016, n=1,641)',
          short:'Non-ADHD students (18–25)', color:'var(--green)',
          citation:'Canu et al. (2016), J Atten Disord 24(12):1648–1660',
          domains:{
            family:{mean:0.29, sd:0.37}, work:{mean:0.14, sd:0.27, caveat:'reference may be too low: no student marked Work not applicable (Canu 2016)'},
            school:{mean:0.38, sd:0.41}, life:{mean:0.48, sd:0.44},
            self:{mean:0.80, sd:0.74}, social:{mean:0.26, sd:0.35},
            risk:{mean:0.32, sd:0.33}
          },
          total:{mean:0.35, sd:0.28} }
      ]
    },
    items,
    subscales,
    report:{caveat:'The WFIRS-S measures functional impairment, not ADHD symptoms or a diagnosis. A domain is flagged impaired if its mean ≥1.5, or ≥2 items are rated 2, or any item is rated 3. Interpret within the full clinical assessment.'},
    notes:[
      'Each item rated 0–3 over the last month (Never … Very often); items marked N/A are excluded from that domain’s mean.',
      'Domain impaired if mean ≥1.5, OR ≥2 items rated 2, OR ≥1 item rated 3 (DSM-IV-aligned).',
      'Work and School are separate domains, complete whichever applies and mark the other N/A.',
      'Designed to exclude ADHD symptom items so functioning is assessed independently of symptoms.'
    ]
  }});
})();

/* ── WFIRS-P — Weiss Functional Impairment Rating Scale (Parent report) ─────────
   The parent-report sibling of the WFIRS-S. 50 items across seven domains
   (Family 10, Learning 4, School behaviour 6, Life skills 10, Self-concept 3,
   Social activities 7, Risky activities 10), each rated 0–3 over the last month
   with an N/A option excluded from scoring. Reuses the shared 'wfirs' scoring
   type and impairment rule (domain impaired if mean ≥1.5, OR ≥2 items rated 2,
   OR ≥1 item rated 3). Designed to measure functioning independently of ADHD
   symptoms. Item wording from the official WFIRS-P form. The scale is free for
   clinical/research use and may be posted (© M. D. Weiss); the CADDRA scoring
   guide is separately copyrighted for private/clinic use. Fills the child-ADHD
   functional-impairment gap (WFIRS-S is for adults 18+).
─────────────────────────────────────────────────────────────────────────── */
(function(){
  const DOMAINS = [
    {key:'family', name:'Family', items:[
      'Having problems with brothers & sisters',
      'Causing problems between parents',
      "Takes time away from family members' work or activities",
      'Causing fighting in the family',
      'Isolating the family from friends and social activities',
      'Makes it hard for the family to have fun together',
      'Makes parenting difficult',
      'Makes it hard to give fair attention to all family members',
      'Provokes others to hit or scream at him/her',
      'Costs the family more money'
    ]},
    {key:'learning', name:'Learning', items:[
      'Makes it difficult to keep up with schoolwork',
      'Needs extra help at school',
      'Needs tutoring',
      'Receives grades that are not as good as his/her ability'
    ]},
    {key:'school', name:'School behaviour', items:[
      'Causes problems for the teacher in the classroom',
      'Receives "time-out" or removal from the classroom',
      'Having problems in the school yard',
      'Receives detentions (during or after school)',
      'Suspended or expelled from school',
      'Misses classes or is late for school'
    ]},
    {key:'life', name:'Life skills', items:[
      'Excessive use of TV, computer, or video games',
      'Keeping clean, brushing teeth, brushing hair, bathing, etc.',
      'Problems getting ready for school',
      'Problems getting ready for bed',
      'Problems with eating (picky eater, junk food)',
      'Problems with sleeping',
      'Gets hurt or injured',
      'Avoids exercise',
      'Needs more medical care',
      'Has trouble taking medication, getting needles, or visiting the doctor/dentist'
    ]},
    {key:'self', name:'Self-concept', items:[
      'My child feels bad about himself/herself',
      'My child does not have enough fun',
      'My child is not happy with his/her life'
    ]},
    {key:'social', name:'Social activities', items:[
      'Being teased or bullied by other children',
      'Teases or bullies other children',
      'Problems getting along with other children',
      'Problems participating in after-school activities (sports, music, clubs)',
      'Problems making new friends',
      'Problems keeping friends',
      'Difficulty with parties (not invited, avoids them, misbehaves)'
    ]},
    {key:'risk', name:'Risky activities', items:[
      'Easily led by other children (peer pressure)',
      'Breaking or damaging things',
      'Doing things that are illegal',
      'Being involved with the police',
      'Smoking cigarettes',
      'Taking illegal drugs',
      'Doing dangerous things',
      'Causes injury to others',
      'Says mean or inappropriate things',
      'Sexually inappropriate behaviour'
    ]}
  ];
  const items = [];
  const subscales = {};
  let n = 0;
  DOMAINS.forEach(d=>{
    const ns = [];
    d.items.forEach(text=>{ n++; ns.push(n); items.push({n, subscale:d.key, optionSet:'wf', text}); });
    subscales[d.key] = { name:d.name, items:ns };
  });
  DOMAINS.forEach(d=>{
    const first = items.find(it=>it.subscale===d.key);
    if(first){ first.sectionKey = d.key; first.sectionIntro = {
      tag:'Functioning', title:d.name,
      blurb:`The next questions are about how things have been with ${d.name.toLowerCase()} over the last month. Choose “N/A” for anything that doesn’t apply to your child.`
    };}
  });
  Object.assign(REGISTRY, {"wfirs_p":{
    id:'wfirs_p',
    name:'WFIRS-P',
    formLabel:'Parent',
    fullName:'Weiss Functional Impairment Rating Scale (parent report)',
    category:'adhd',
    status:'live',
    respondent:'Parent / carer report',
    informantKind:'childhood',
    informantHelp:'A rating of how emotional or behavioural problems affect everyday functioning, best completed by a parent or carer who knows {subject} well.',
    ageRange:'6–18 years',
    estMinutes:'10–15 min',
    description:'Parent-report of how emotional or behavioural problems affect a child’s everyday functioning across seven life domains, distinct from ADHD symptoms.',
    citation:'Weiss MD. Weiss Functional Impairment Rating Scale — Parent Report (WFIRS-P); CADDRA scoring guide (2025).',
    licence:'The scale is free for clinical and research use and may be posted online (© M. D. Weiss). The CADDRA scoring guide is separately copyrighted for private/clinic use.',
    higherMeans:'greater functional impairment',
    prompt:"Over the last month, how much have your child’s emotional or behavioural problems affected…",
    scoring:{
      type:'wfirs',
      optionSets:{ wf:[
        {label:'Never / not at all', v:0},
        {label:'Sometimes / somewhat', v:1},
        {label:'Often / much', v:2},
        {label:'Very often / very much', v:3},
        {label:'N/A', v:-1}
      ]},
      impairMean:1.5,
      // ADHD-discrimination screen (Thompson, Lloyd, Joseph & Weiss 2017, Qual Life
      // Res 26:1879–1885). Overall = AVERAGE OF THE SIX DOMAIN MEANS (School =
      // Learning + Behaviour merged, per the paper), NOT the item-weighted total.
      // Optimal overall cut-off ≥0.65 (sens 0.83, spec 0.85, AUC 0.91); per-domain
      // thresholds and sens/spec from Table 2. Screening only, never diagnostic.
      adhdScreen:{
        cutoff:0.65, sens:0.83, spec:0.85, auc:0.91,
        citation:'Thompson, Lloyd, Joseph & Weiss (2017), Qual Life Res 26:1879–1885',
        domains:[
          { name:'Family',              subs:['family'],            threshold:0.75, sens:0.84, spec:0.78 },
          { name:'School and learning', subs:['learning','school'], threshold:0.70, sens:0.86, spec:0.78 },
          { name:'Life skills',         subs:['life'],              threshold:0.78, sens:0.75, spec:0.81 },
          { name:'Self-concept',        subs:['self'],              threshold:1.00, sens:0.85, spec:0.66 },
          { name:'Social activities',   subs:['social'],            threshold:0.71, sens:0.79, spec:0.75 },
          { name:'Risky activities',    subs:['risk'],              threshold:0.22, sens:0.75, spec:0.81 }
        ]
      },
      // General-population percentile norms (Arildskov et al. 2023, Assessment
      // 30(8):2533–2544): 2,027 Danish schoolchildren aged 6–11. EMPIRICAL
      // percentiles (read off the observed distribution — honest for skewed
      // data), per domain-mean (0–3). Covers 6 of our 7 domains: NO risky
      // norms (floor effect), and the reference "total" is a 40-item mean that
      // EXCLUDES the risky domain. Ages 6–11 only. Sex-stratified cells for 6–9
      // are large (n≈850–1000); 10–11 cells are small (n≈63–144) — use a
      // sex cell only when sex is recorded, else the unisex-by-age cell.
      // Percentiles: [80th, 90th, 93rd, 98th]. Descriptive, NOT diagnostic.
      popNorms:{
        label:'Danish general-population schoolchildren (Arildskov 2023)',
        citation:'Arildskov et al. (2023), Assessment 30(8):2533–2544',
        ageMin:6, ageMax:11, pcts:[80,90,93,98],
        normedDomains:['family','learning','school','life','self','social'],
        cells:[
          { sex:null, ageMin:6, ageMax:9, n:'1834–1877', domains:{
            family:[0.5,0.8,0.9,1.5], learning:[0.5,1,1.25,2.25], school:[0.17,0.33,0.5,0.83],
            life:[0.7,0.9,1,1.4], self:[0.67,1,1,2], social:[0.57,0.83,0.86,1.29] },
            total:[0.49,0.68,0.79,1.19] },
          { sex:null, ageMin:10, ageMax:11, n:'142–144', domains:{
            family:[0.6,1,1.2,2.5], learning:[0.75,1.75,2,2.67], school:[0.17,0.33,0.5,0.67],
            life:[0.9,1.2,1.3,1.8], self:[1,1.33,1.67,3], social:[0.71,1.29,1.33,1.86] },
            total:[0.68,0.93,1.05,1.66] },
          { sex:'male', ageMin:6, ageMax:9, n:'989–1006', domains:{
            family:[0.5,0.8,0.9,1.5], learning:[0.5,1,1.25,2.25], school:[0.17,0.5,0.5,1],
            life:[0.7,1,1,1.4], self:[0.67,1,1.33,2], social:[0.57,0.86,1,1.43] },
            total:[0.53,0.74,0.83,1.23] },
          { sex:'male', ageMin:10, ageMax:11, n:'79–80', domains:{
            family:[0.75,1.25,1.5,2.56], learning:[1.13,2,2.25,2.75], school:[0.27,0.5,0.67,0.83],
            life:[0.95,1.15,1.3,1.8], self:[1,1.33,1.67,3], social:[0.83,1.29,1.33,1.71] },
            total:[0.78,1.09,1.26,1.66] },
          { sex:'female', ageMin:6, ageMax:9, n:'843–871', domains:{
            family:[0.44,0.7,0.89,1.5], learning:[0.5,0.75,1,2], school:[0.17,0.17,0.33,0.5],
            life:[0.7,0.9,1,1.5], self:[0.67,1,1,2], social:[0.57,0.71,0.86,1.17] },
            total:[0.45,0.63,0.73,1.14] },
          { sex:'female', ageMin:10, ageMax:11, n:'63–64', domains:{
            family:[0.6,0.9,0.9,1.2], learning:[0.75,1.25,1.5,1.75], school:[0.17,0.17,0.33,0.33],
            life:[0.9,1.2,1.4,1.5], self:[1,1.33,1.67,2.33], social:[0.71,1.14,1.4,1.86] },
            total:[0.58,0.88,0.93,1.15] }
        ]
      }
    },
    items,
    subscales,
    report:{caveat:'The WFIRS-P measures functional impairment, not ADHD symptoms or a diagnosis. A domain is flagged impaired if its mean ≥1.5, or ≥2 items are rated 2, or any item is rated 3. Interpret within the full clinical assessment.'},
    notes:[
      'Each item rated 0–3 over the last month (Never … Very often); items marked N/A are excluded from that domain’s mean.',
      'Domain impaired if mean ≥1.5, OR ≥2 items rated 2, OR ≥1 item rated 3 (DSM-IV-aligned).',
      'Seven domains: Family, Learning, School behaviour, Life skills, Self-concept, Social activities, Risky activities.',
      'Designed to exclude ADHD symptom items so functioning is assessed independently of symptoms.'
    ]
  }});
})();

/* ── GSQ — Glasgow Sensory Questionnaire (42-item) ─────────────────────────────
   Self-report of how frequently a person experiences atypical sensory responses
   (both over- and under-responsivity) across seven modalities. 42 items rated
   Never(0) … Always(4) for the last 12 months; total 0–168. Higher = more frequent
   atypical sensory responses, which correlate strongly with autistic traits
   (Robertson & Simmons 2013, r=.78 with the AQ). Comparison group: the non-ASD
   adults of the Horder et al. (2014) dataset (n=749, mean 42.77, SD 20.26; empirical
   percentile band from the published distribution). Robertson & Simmons’ own pooled
   mean 56.65 (N=212) is deliberately NOT used — that sample was over-recruited for
   high AQ, so it is inflated. Screening/descriptive — not diagnostic.
   NOTE: the published 7-modality × hyper/hypo profile needs the official final-
   item key (not derivable from the supplied 70-item appendix), so only the
   validated total is scored here.
─────────────────────────────────────────────────────────────────────────── */
(function(){
  const Q = [
    'Do you dislike the physical sensation you get when people hug you?',
    'Do you gag when you are eating certain foods (perhaps feeling as if you are going to be sick)?',
    'Do you find it difficult to manipulate your hands when completing a delicate task (for example, picking up small objects or transferring objects from one hand to the other)?',
    'Do you ever run your hand around the outside of an object before picking it up?',
    'Do you stand very close (for example, less than 1 metre away) or very far (for example, more than 3 metres away) when you are talking to someone?',
    'Do you find certain noises or pitches of sound annoying?',
    'Do you smell your food before you eat it?',
    'Do bright lights ever hurt your eyes or cause a headache?',
    'Do you like to listen to the same piece of music or part of a film over and over again?',
    'Do you feel ill, dizzy or peculiar if you have to reach up high or bend down low for something?',
    'Do you find yourself fascinated by small particles (for example, little bits of dust in the air)?',
    'Do you like to spin yourself round and round?',
    'Do you ever feel ill just from smelling a certain odour?',
    'Do you find it difficult to hear what people are saying?',
    'Do you dislike having a haircut (for example, because little bits of hair go down your back)?',
    'Do you notice that you have hurt yourself but did not feel any pain?',
    'Are you ever told by others that you wear too much perfume or aftershave?',
    'Do lights ever seem to flicker when you look at them? (“Flickering” in this question means appearing to turn on and off very quickly instead of appearing constant.)',
    'Do you like lining objects up?',
    'Do you rock yourself backwards and forwards?',
    'Do you find it difficult to go into a strong-smelling shop?',
    'Do you cut the labels out of your clothes?',
    'Do you hate the feel or texture of certain foods in your mouth?',
    'Do you avoid going to restaurants because you can smell a certain odour?',
    'Do you dislike loud noises?',
    'Do you use the tip of your tongue to taste your food before eating it?',
    'Does your body ever feel “numb”, like you can’t feel anything against your skin?',
    'Do you think you have a weak sense of taste (for example, most food tastes of “nothing”)?',
    'Do you find that you are unaware of your body’s signals (for example, you don’t often feel hungry, tired or thirsty)?',
    'Do you ever feel dizzy or ill when playing fast-paced sports (for example, basketball or football)?',
    'Do you react very strongly when you hear an unexpected sound?',
    'Do you dislike walking on uneven surfaces?',
    'Do you really like listening to certain sounds (for example, the sound of paper rustling)?',
    'Do you like to run about, perhaps up and down in straight lines or round in circles?',
    'Do you chew and lick objects that aren’t food (for example, pen lids or bottle tops) because you like the way they feel in your mouth?',
    'Do you enjoy wearing very strong perfumes or aftershaves?',
    'Do you find that you position your body in a way that is different to most people (for example, lying on your back on a sofa with your legs straight up in the air at a 90° angle)?',
    'Do you find it difficult to tie your shoelaces or button up your clothes?',
    'Do you find that you are able to go outside without a coat or jacket when other people think it is too cold?',
    'Do you eat the same foods most of the time?',
    'Do you like to wear something or hold something (for example, a hat or a pencil) so that you know where your body “ends”?',
    'Do you flick your fingers in front of your eyes?'
  ];
  // modality + hyper/hypo per final item, derived from Robertson & Simmons (2013)
  // Table S3 (the 42 retained items by original Q-number, in ascending order map
  // 1:1 onto the final 1–42; modality confirmed against every item's wording).
  // VERIFIED 2026-08-03 against Table S3 itself (the supplementary material to
  // Robertson & Simmons 2013, which lists all 42 retained items by original
  // Q-number with modality and pole). The ascending-order 1:1 mapping onto the
  // final 1–42 is confirmed: every one of the 42 modality assignments and 41 of
  // the 42 poles reproduce the table exactly, and the one apparent exception is
  // a conflict in the literature rather than a transcription error.
  //
  // Item 40, "Do you eat the same foods most of the time?" (original Q67), is
  // GUSTATORY HYPER in Table S3, and that is what we code. Two things sit
  // against it, and both are recorded here so this is not "fixed" by mistake:
  //   1. Table S3 gives gustatory 4 hyper and 2 hypo where every other modality
  //      is 3/3, so the totals are 22/20. That contradicts the same paper's
  //      stated method, which separated 70 items into 14 modality x pole groups
  //      of 5 and reduced each to 3, i.e. 21/21. Table S1 confirms gustatory
  //      began as a proper 5/5, so the imbalance enters at the reduction step.
  //   2. Smees, Rinaldi, Simmons & Simner (2022) Table A.2, the coding sheet for
  //      the parent form (Simmons co-authored both), keys the same question as
  //      gustatory HYPO, giving a clean 21/21. Our gsq_p follows that sheet, so
  //      the two forms deliberately disagree on this one item.
  // The adult form follows the adult form's own published key. Do not sync it to
  // gsq_p without a decision: it moves the hyper/hypo split and the gustatory
  // butterfly row, though never the total or any modality subtotal.
  // [modalityKey, pole]  pole: 'hyper' | 'hypo'
  const MAP = [
    ['tac','hyper'],['gus','hyper'],['pro','hypo'],['vis','hypo'],['pro','hypo'],
    ['aud','hyper'],['olf','hypo'],['vis','hyper'],['aud','hypo'],['ves','hyper'],
    ['vis','hyper'],['ves','hypo'],['olf','hyper'],['aud','hypo'],['tac','hyper'],
    ['tac','hypo'],['olf','hypo'],['vis','hyper'],['vis','hypo'],['ves','hypo'],
    ['olf','hyper'],['tac','hyper'],['gus','hyper'],['olf','hyper'],['aud','hyper'],
    ['gus','hyper'],['tac','hypo'],['gus','hypo'],['pro','hypo'],['ves','hyper'],
    ['aud','hyper'],['ves','hyper'],['aud','hypo'],['ves','hypo'],['gus','hypo'],
    ['olf','hypo'],['pro','hyper'],['pro','hyper'],['tac','hypo'],['gus','hyper'],
    ['pro','hyper'],['vis','hypo']
  ];
  const MODNAME = {vis:'Visual', aud:'Auditory', gus:'Gustatory', olf:'Olfactory', tac:'Tactile', ves:'Vestibular', pro:'Proprioceptive'};
  const items = Q.map((text,i)=>({ n:i+1, text, modality:MAP[i][0], pole:MAP[i][1] }));
  const gsqSubscales = {};
  ['vis','aud','gus','olf','tac','ves','pro'].forEach(k=>{
    gsqSubscales[k] = { name:MODNAME[k], items:items.filter(it=>it.modality===k).map(it=>it.n) };
  });
  // Both substantive claims here are the questionnaire's own, from its sample-question
  // preamble (verified 2026-08-03): the timeframe is "the option that corresponds best
  // with your experience over the last 12 months", and "Examples are only given to help
  // prompt you (if needed)" - the preamble's worked answer makes the point explicitly,
  // that you answer the same way "regardless of whether I experienced the exact issue
  // detailed by the example". That is why an item's parenthetical examples can be
  // localised, but a parenthetical that DEFINES a term cannot.
  items[0].sectionIntro = { tag:'How to answer', title:'About these questions',
    blurb:'For each statement, choose how often it applies to you over the last 12 months. Never, Rarely, Sometimes, Often or Always. There are no right or wrong answers, and the examples are only there to help.' };
  Object.assign(REGISTRY, {"gsq":{
    id:'gsq',
    name:'GSQ',
    fullName:'Glasgow Sensory Questionnaire (42-item)',
    verified:{ date:'2026-08-03', note:'All 42 items verified against the questionnaire, and every modality and hyper/hypo assignment against Table S3 of the supplementary material to Robertson & Simmons (2013), which lists the 42 retained items by their original Q-number: the ascending-order mapping onto the final 1-42 is confirmed, 42/42 on both. Response set Never(0) to Always(4), total 0-168. The "last 12 months" timeframe and the note that examples are only prompts are both taken from the questionnaire\'s own sample-question preamble. Item stems follow the source, with slashes expanded to "or" for readability and two examples localised (item 5 gives metric only, item 9 says film rather than DVD); the preamble states that a person answers the same way "regardless of whether I experienced the exact issue detailed by the example", so an item\'s examples do not constrain the response. Item 21 does not carry the source\'s two named high-street shops. One thing NOT claimed: item 40 is gustatory hyper here, following this form\'s own table, while the parent form keys the same question as hypo following its; Table S3 gives gustatory 4/2 against 3/3 everywhere else, which contradicts the paper\'s own account of how the item set was reduced, so the two published keys genuinely disagree.' },
    category:'sensory',
    status:'live',
    respondent:'Self-report',
    ageRange:'16+ years',
    estMinutes:'8–12 min',
    description:'Self-report of how often a person experiences atypical sensory responses (over- and under-responsivity) across seven modalities.',
    citation:'Robertson AE & Simmons DR (2013), J Autism Dev Disord 43:775–784.',
    licence:'© 2009 University of Glasgow. Free for clinical and research use.',
    higherMeans:'more frequent atypical sensory responses',
    scoring:{
      type:'gsq',
      options:[{label:'Never'},{label:'Rarely'},{label:'Sometimes'},{label:'Often'},{label:'Always'}],
      totalMax:168
    },
    items,
    subscales:gsqSubscales,
    /* PRIMARY comparison = the non-ASD group of the Horder et al. (2014) dataset:
       3.5× larger than Robertson & Simmons and, crucially, NOT enriched for high
       AQ, so it is not inflated the way the R&S pooled mean is (42.77 vs 56.65 —
       a 14-point/0.6 SD gap). Still a young university convenience sample, so it
       is a comparison group, not a population norm. Horder supplied no
       distributional statistics, and with a mean item response of ~1.0/4 the
       distribution is likely right-skewed, so the UI reports distance from the
       mean in SD units rather than a percentile — SDs need no assumption about
       distribution shape, a percentile would. */
    /* hist = the published frequency distribution of this exact group (Horder's
       SPSS histogram of GSQ_Final, N=749). Counts recovered from the chart by
       pixel measurement and cross-checked: they sum to 749 and reproduce the
       reported mean/SD (42.77/20.26) to within midpoint-coarsening tolerance.
       This lets us report an EMPIRICAL percentile — read straight off the
       distribution — instead of a normal approximation, so it is valid despite
       the moderate right skew (skewness ≈ +0.67). binWidth 10 from x0=0. */
    norm:{ mean:42.77, sd:20.26, n:749, label:'Non-ASD adults',
      hist:{ x0:0, binWidth:10, counts:[13,74,127,146,138,104,74,39,19,7,4,3,0,1] },
      source:'Non-ASD comparison group, Horder et al. (2014) dataset, n=749 adults (J. Horder, personal communication, 27 July 2026). King’s College London students and staff, 2012; 82% aged 30 or under and 72% female (Horder et al. 2014, full sample of 772), so a young-adult convenience sample rather than a representative population norm. Percentiles are given as a guaranteed empirical band read from the group’s published frequency distribution; the score’s bin fixes the bounds exactly, with no interpolation and no distribution-shape assumption; SD distance is shown alongside.' },
    /* single comparison group; its citation drives the source note on the chart */
    compareGroups:[
      { label:'Non-ASD adults', mean:42.77, sd:20.26, n:749,
        source:'Non-ASD group of the Horder et al. (2014) dataset (J. Horder, personal communication, 27 July 2026). King’s College London students and staff, 2012; 82% aged 30 or under and 72% female (Horder et al. 2014, full sample of 772); a young-adult convenience sample, not a representative population norm.' }
    ],
    /* Recorded for the norms dashboard only — deliberately NOT shown as a
       comparison lane. n=23, ASD status self-reported on a single unverified
       item; the author explicitly advises caution. Sexes are listed for
       completeness: the ~2-point difference is about a tenth of an SD, so
       scoring uses the combined non-ASD figures. The Robertson & Simmons (2013)
       sample is intentionally excluded — its high-AQ over-recruitment makes it
       unusable as a comparison group. */
    refGroups:[
      { label:'Non-ASD adults',            n:749, mean:42.77, sd:20.26, note:'Primary (and only) comparison used for scoring.' },
      { label:'Self-reported ASD',         n:23,  mean:54.52, sd:22.23, note:'Self-reported on a single unverified item; author advises strong caution. Not used as a comparison.' },
      { label:'Male (whole sample)',       n:217, mean:44.62, sd:21.30, note:'Sex difference ≈0.1 SD; not used for scoring.' },
      { label:'Female (whole sample)',     n:555, mean:42.53, sd:20.03, note:'Sex difference ≈0.1 SD; not used for scoring.' }
    ],
    report:{caveat:'The GSQ measures the frequency of atypical sensory responses; higher totals correlate strongly with autistic traits but it is a screening/descriptive tool, not a diagnostic test, and has no clinical cut-off.'},
    notes:[
      'Each item rated 0 (Never) to 4 (Always) for the last 12 months; total 0–168. Both over- and under-responsivity raise the score.',
      'Scoring compares against the non-ASD group of the Horder et al. (2014) dataset (n=749, mean 42.77, SD 20.26; personal communication). Robertson & Simmons’ widely-quoted 56.65 (SD 23.60, N=212) is deliberately not used: that sample was over-recruited for high AQ, so its mean is inflated by roughly 14 points (0.6 SD) and has no clean interpretation as a comparison group.',
      'GSQ total correlates with the AQ at r≈.78 (Robertson & Simmons 2013).',
      'Distribution: the non-ASD group is moderately right-skewed (skewness ≈ +0.67), so its total is not normal. Its full frequency distribution is available (Horder’s N=749 histogram), so the percentile is a guaranteed EMPIRICAL band — the score’s 10-point bin fixes the bounds directly from that distribution, with no interpolation and no normality assumption. SD distance is shown alongside.',
      'Seven modalities (6 items each) plus a hyper- vs hypo-responsivity split, from Robertson & Simmons (2013) Table S3. Per the published table, Gustatory has 4 hyper / 2 hypo items (others 3/3).'
    ]
  }});
})();
/* ── GSQ-P — Parent-completed Glasgow Sensory Questionnaire (42-item) ──────────
   Parent-report adaptation of the GSQ for children 6–11 (Smees, Rinaldi,
   Simmons & Simner 2022, J Child Fam Stud 32:1805–1822). 42 items rated
   Never(0)…Always(4); total 0–168, hyper/hypo 0–84 each. Item text, item→sense/
   pole coding and scoring are from the paper's Appendix (Tables 3–4) and SI
   Table SI1. A 24-item short form (rGSQ-P, no proprioception; total 0–96,
   hyper/hypo 0–48) is scored alongside from the same responses (short-form
   membership per the shaded Appendix items). Items printed with a trailing
   ellipsis in the source were completed with the parenthetical example from the
   corresponding adult GSQ item (items 15, 28, 30, 33, 35); item 21's was left
   as it stands. Item TEXT verified 2026-08-03 against the paper's printed item
   list, which carries the validation item numbers: the numbering is identical
   to ours and 37 of the 42 stems match exactly, the 5 exceptions being those
   documented ellipsis completions. NB the earlier note here said item 21 had
   "no adult counterpart" — it does, the adult item names two high-street shops,
   but our adult item had already dropped them, so there was nothing to copy
   across. Freely offered by the authors.
   Norms: the validation paper reports TD-vs-SEND significance but not group
   means; the only published GSQ-P means are James (2025, BYU MSc thesis,
   all-ages Table 1: NT 23.70 (15.86) n=37; ASD 46.74 (13.06) n=19). Small,
   non-normal sample — comparison values are descriptive, never percentiles. */
(function(){
  // [text (after 'Does your child…'), modalityKey, pole, inShortForm]
  const DEF = [
    ['dislike the physical sensation from when people hug him/her?','tac','hyper',0],
    ['gag when eating certain foods, perhaps feeling as if he/she is going to be sick?','gus','hyper',1],
    ['seem to find it difficult to manipulate his/her hands when completing a delicate task (for example, picking up small objects or transferring objects from one hand to the other)?','pro','hypo',0],
    ['ever run his/her hand around the outside of an object before picking it up?','vis','hypo',0],
    ['stand very close or very far when he/she is talking to someone?','pro','hypo',0],
    ['find certain noises/pitches of sound annoying?','aud','hyper',1],
    ['ever smell food before eating it?','olf','hypo',0],
    ['ever complain of bright lights hurting his/her eyes or causing a headache?','vis','hyper',1],
    ['like to listen to the same piece of music or part of a song over and over again?','aud','hypo',1],
    ['ever seem ill, dizzy or peculiar if he/she has to reach up high or bend down low for something?','ves','hyper',1],
    ['seem to be fascinated by small particles (for example, little bits of dust in the air)?','vis','hyper',0],
    ['like to spin round and round?','ves','hypo',1],
    ['complain about feeling ill from smelling a certain odour?','olf','hyper',0],
    ['seem to find it difficult to hear what people are saying?','aud','hypo',0],
    ['dislike having a haircut (for example, because little bits of hair go down his/her back)?','tac','hyper',1],
    ['sometimes hurt him/herself but not appear to feel pain?','tac','hypo',1],
    ['‘borrow’ your perfume, after-shave etc.?','olf','hypo',1],
    ['ever seem bothered by fluorescent or flickering lights?','vis','hyper',1],
    ['like lining objects up?','vis','hypo',1],
    ['rock him/herself backwards and forwards?','ves','hypo',0],
    ['complain about going into a strong smelling shop?','olf','hyper',1],
    ['complain about the labels in clothes and ask for them to be taken out?','tac','hyper',1],
    ['hate the feeling or texture of certain foods in his/her mouth?','gus','hyper',1],
    ['complain about going to restaurants because he/she can smell a certain odour?','olf','hyper',1],
    ['dislike loud noises?','aud','hyper',1],
    ['use the tip of his/her tongue to taste food before eating it?','gus','hyper',0],
    ['ever say his/her body feels ‘numb’ – or act like he/she can’t feel anything against the skin?','tac','hypo',0],
    ['ever complain of having a weak sense of taste (for example, most food tastes of ‘nothing’)?','gus','hypo',1],
    ['seem to be unaware of his/her body’s signals (for example, doesn’t complain about being hungry, tired or thirsty)?','pro','hypo',0],
    ['complain about feeling dizzy or ill when playing fast-paced sports (for example, basketball or football)?','ves','hyper',1],
    ['react strongly when he/she hears an unexpected sound?','aud','hyper',0],
    ['complain about walking on uneven surfaces?','ves','hyper',0],
    ['really like listening to certain sounds (for example, the sound of paper rustling)?','aud','hypo',1],
    ['like to run about more than the average child, perhaps up and down in straight lines or round in circles?','ves','hypo',1],
    ['chew and lick objects that aren’t food (for example, pen lids or bottle tops) because he/she likes the feel of them in the mouth?','gus','hypo',1],
    ['seek out strong smells like perfumes, plastics, paints etc.?','olf','hypo',1],
    ['seem to position his/her body in a way that is different to most people (for example, lying on his/her back on a sofa with legs straight up in the air at a 90° angle)?','pro','hyper',0],
    ['find it more difficult than other children to tie up his/her shoelaces or button up clothes?','pro','hyper',0],
    ['seem to be able to go outside without a coat or jacket when other people think that it is too cold?','tac','hypo',1],
    ['like to eat the same foods most of the time?','gus','hypo',0],
    ['turn his/her whole body (rather than only the head) when looking at something or someone?','pro','hyper',0],
    ['flick his/her fingers in front of his/her eyes?','vis','hypo',1]
  ];
  const MODNAME = {vis:'Visual', aud:'Auditory', gus:'Gustatory', olf:'Olfactory', tac:'Tactile', ves:'Vestibular', pro:'Proprioceptive'};
  const items = DEF.map((d,i)=>({ n:i+1, text:'Does your child '+d[0], modality:d[1], pole:d[2], short:!!d[3] }));
  const subs = {};
  ['vis','aud','gus','olf','tac','ves','pro'].forEach(k=>{
    subs[k] = { name:MODNAME[k], items:items.filter(it=>it.modality===k).map(it=>it.n) };
  });
  items[0].sectionIntro = { tag:'How to answer', title:'About these questions',
    blurb:'For each question, choose how often it applies to your child: Never, Rarely, Sometimes, Often or Always. There are no right or wrong answers, and the examples are only there to help.' };
  Object.assign(REGISTRY, {"gsq_p":{
    id:'gsq_p',
    name:'GSQ-P',
    fullName:'Parent-completed Glasgow Sensory Questionnaire (42-item)',
    verified:{ date:'2026-08-03', note:'Item numbering and all 42 stems verified against the printed item list in Smees, Rinaldi, Simmons & Simner (2022), which carries the validation item numbers: numbering identical, 37/42 stems exact. The 5 exceptions are items the paper prints with a trailing ellipsis (15, 28, 30, 33, 35), completed here with the parenthetical from the corresponding adult GSQ item. Every modality and hyper/hypo assignment verified against that paper\'s Table A.2 coding sheet, where the key is the shaded cell rather than any text: 41/41 on both, giving 21 hyper and 21 hypo, 3 of each per modality. Item 41 has no adult counterpart, this form uses a different proprioceptive item there, as the source does. Response set Never(0) to Always(4), total 0-168, hyper and hypo 0-84 each. Norms are NOT from the validation paper, which reports group differences but not means; they are a small non-normal MSc sample and the entry says so.' },
    category:'sensory',
    status:'live',
    respondent:'Parent / carer',
    ageRange:'6–11 years',
    estMinutes:'8–12 min',
    description:'Parent report of how often a child shows atypical sensory responses (over- and under-responsivity) across seven modalities; also yields the 24-item rGSQ-P short form.',
    citation:'Smees R, Rinaldi LJ, Simmons DR & Simner J (2022), J Child Fam Stud 32:1805–1822.',
    licence:'Offered by the authors as a free measure for clinical and research use (Smees et al. 2022).',
    higherMeans:'more frequent atypical sensory responses',
    scoring:{
      type:'gsq',
      options:[{label:'Never'},{label:'Rarely'},{label:'Sometimes'},{label:'Often'},{label:'Always'}],
      totalMax:168
    },
    items,
    subscales:subs,
    /* Descriptive comparison only: small (n=56), explicitly non-normal sample
       (Mann-Whitney throughout) — nonNormal suppresses percentile claims. */
    norm:{ mean:23.70, sd:15.86, n:37, nonNormal:true, group:'Neurotypical children',
      source:'Neurotypical comparison children (all ages 5–11), James (2025), BYU MSc thesis, Table 1. Small non-normal sample; descriptive only.' },
    compareGroups:[
      { label:'Neurotypical children', mean:23.70, sd:15.86, n:37,
        source:'Neurotypical comparison children, James (2025), BYU MSc thesis, Table 1 (all ages 5–11). Small, non-normally distributed sample; descriptive only.' },
      { label:'Autistic children',     mean:46.74, sd:13.06, n:19,
        source:'Autistic children, James (2025), BYU MSc thesis, Table 1 (all ages 5–11). Small sample; the thesis’s age-band tables are internally inconsistent and are not used.' }
    ],
    report:{caveat:'The GSQ-P measures the frequency of atypical sensory responses reported by a parent; SEND and autistic groups score significantly higher on average, but it is a descriptive tool with no published norms or clinical cut-off, so interpret it dimensionally.'},
    notes:[
      'Each item rated 0 (Never) to 4 (Always); total 0–168, hyper- and hypo-sensitivity 0–84 each. For a briefer administration use the separate 24-item rGSQ-P.',
      'Validated on parents of 601 UK children aged 6–11; scores were invariant across age and gender, and SEND children scored significantly higher than typically developing children on every scale (Smees et al. 2022). Group means were not published.',
      'Comparison values shown are from James (2025, BYU MSc thesis, all-ages Table 1): neurotypical M 23.70 (SD 15.86, n=37) vs autistic M 46.74 (SD 13.06, n=19). Small, non-normally distributed sample — treated as descriptive anchors, not norms; no percentiles are computed.',
      'Item→modality and hyper/hypo coding from the paper’s coding sheet and SI (each modality 6 items, hyper/hypo 3/3 in the long form). Items printed with a trailing ellipsis in the source (15, 28, 30, 33, 35) were completed with the example from the corresponding adult GSQ item.'
    ]
  }});

  /* rGSQ-P — the 24-item reduced form as a standalone administration: the items
     the validation retained for their factor structure (no proprioception; six
     senses × 4 items, 2 hyper / 2 hypo). Items renumbered 1–24 in the source's
     order (ascending original validation numbers); origN keeps the mapping.
     No published means exist for the rGSQ-P total (the thesis administered the
     full GSQ-P), so no comparison groups — profile + totals only. */
  const shortItems = items.filter(it=>it.short).map((it,i)=>({
    n:i+1, origN:it.n, text:it.text, modality:it.modality, pole:it.pole
  }));
  const shortSubs = {};
  ['vis','aud','gus','olf','tac','ves'].forEach(k=>{
    shortSubs[k] = { name:MODNAME[k], items:shortItems.filter(it=>it.modality===k).map(it=>it.n) };
  });
  shortItems[0].sectionIntro = items[0].sectionIntro;
  Object.assign(REGISTRY, {"rgsq_p":{
    id:'rgsq_p',
    name:'rGSQ-P',
    fullName:'Reduced Parent-completed Glasgow Sensory Questionnaire (24-item)',
    verified:{ date:'2026-08-03', note:'The 24-item short form shares its items and scoring with the verified 42-item parent form, so the same text check applies. Short-form membership and every modality and hyper/hypo assignment verified against the shaded rows of Table A.2 in Smees, Rinaldi, Simmons & Simner (2022): all 24 match by position, 12 hyper and 12 hypo, and proprioception is absent entirely, leaving 6 modalities of 4 items. Total 0-96, hyper and hypo 0-48 each, matching the ranges the coding sheet states. No norms are attached to this form.' },
    category:'sensory',
    status:'live',
    respondent:'Parent / carer',
    ageRange:'6–11 years',
    estMinutes:'4–6 min',
    description:'Brief parent report of a child’s atypical sensory responses — the 24 GSQ-P items with the cleanest factor structure (proprioception excluded).',
    citation:'Smees R, Rinaldi LJ, Simmons DR & Simner J (2022), J Child Fam Stud 32:1805–1822.',
    licence:'Offered by the authors as a free measure for clinical and research use (Smees et al. 2022).',
    higherMeans:'more frequent atypical sensory responses',
    scoring:{
      type:'gsq',
      options:[{label:'Never'},{label:'Rarely'},{label:'Sometimes'},{label:'Often'},{label:'Always'}],
      totalMax:96
    },
    items:shortItems,
    subscales:shortSubs,
    report:{caveat:'The rGSQ-P is the reduced form of the GSQ-P with the strongest factor structure; it has no published norms, comparison means, or clinical cut-off, so read the totals and profile descriptively. Where a comparison against published group values is wanted, administer the full 42-item GSQ-P.'},
    notes:[
      'Each item rated 0 (Never) to 4 (Always); total 0–96, hyper- and hypo-sensitivity 0–48 each. Six senses × 4 items (2 hyper / 2 hypo); proprioception is excluded by design.',
      'Scale reliability in the validation sample: total α = .87, hyper α = .85, hypo α = .77 (Smees et al. 2022, SI). Chosen over the long form when brevity matters; the long form has better per-modality reliability.',
      'No group means have been published for the rGSQ-P total, so results are descriptive only — the GSQ-P comparison values (James 2025) apply to the 42-item total and are not shown here.'
    ]
  }});
})();
/* ── SPQ — Sensory Perception Quotient (92-item) + SPQ-35 short form ───────────
   Tavassoli et al. (2014) Mol Autism 5:29 (original; one dimension, lower = more
   sensitive) and Taylor et al. (2020) Mol Autism 11:18 (SPQ-RS revised scoring;
   two scales, higher = more atypical). Same 92 items; the 35-item short form is a
   subset scored with the original system. Data transcribed from the user's
   verified reference (SPQ_complete_reference.md). Per-item ORIGINAL reverse keys
   are reconstructed from each item's RS scale + RS reverse (an item is original-
   reversed iff "agree = less sensitive": Hyper&reverse or Hypo&¬reverse); this is
   exact for the 79 RS-scored items. The 13 RS-excluded items' original direction
   is set directly from Tavassoli (2014) Table 4 (italic = reverse), user-verified. No
   population norms or clinical cut-offs exist for the SPQ — comparison values are
   study-sample descriptives only (and the RS sample is female-only). ── */
(function(){
  const Q=[
    "I would notice if someone added 5 grains of salt to my cup of water",
    "I would be able to distinguish different people by their smell",
    "I wouldn't notice if someone added a spoonful of sugar to my tea",
    "I wouldn't be afraid of hurting myself when falling off my bike at high speed",
    "I wouldn't be able to detect the motion of the blades of a rotating fan even when it is at minimum speed",
    "The sound of a piano and a violin playing the same note seem very similar to me",
    "I would be able to detect if a strawberry was ripe by smell alone",
    "I would be able to distinguish milk chocolate and dark chocolate by their taste alone",
    "I cannot tolerate hot showers (above 40°C / 105°F)",
    "I wouldn't need an anaesthetic to cope with a dental procedure, such as a cavity-filling",
    "I would have to wait for 10 minutes for a hot drink to cool down before swallowing it, otherwise it would be too hot for me",
    "I would be able to visually detect the change in brightness of a light each time a dimmer control is moved one notch",
    "I wouldn't be able to detect large objects, such as parked cars, clearly on a dark night",
    "I would notice if someone added 5 drops of lemon juice to my cup of water",
    "I would be the last person to detect if something was burning",
    "I wouldn't be able to feel the vibrations from loud music if I was sitting next to the loud speaker (e.g. at a concert)",
    "I wouldn't be able to feel a small volume change in music as a difference in vibration on my skin",
    "I can't hear the TV when it is very quiet, even when other people can",
    "I would be able to hear a leaf move if blown by the wind on a quiet street",
    "I wouldn't be able to taste the difference between two pieces of dark chocolate",
    "I would be able to taste the difference between two brands of salty potato chips/crisps",
    "When people are talking the words seem to merge together",
    "I can only look at bright colours for a brief period of time",
    "I would lose my balance very easily if I was standing on one foot with my eyes closed",
    "I wouldn't be able to smell a barbecue from 60 feet (20 metres) away",
    "I can't spin round and round without falling over",
    "I wouldn't notice a 10 degree difference in temperature of the weather",
    "I can drink tea/coffee \"straight\", without needing to add milk or sugar",
    "I can't hear the bass in music",
    "I would be able to smell the difference between freshly cut grass and uncut grass",
    "I wouldn't be able to feel the label at the back of my shirt even if I thought about it",
    "I can hear electricity humming in the walls",
    "I notice the flickering of a desktop computer even when it is working properly",
    "I wouldn't be able to tell if milk is off simply by smelling it",
    "I would be able to notice a tiny change (e.g. 1 degree) in the temperature of the weather",
    "I would be able to feel a one millimetre cut in my skin",
    "I would be able to see the individual blades in a rotating fan even if it was at maximum speed",
    "I would be able to tell the weight difference between two different coin sizes on the palm of my hand, if my eyes were closed",
    "I wouldn't get dizzy on a carousel/merry-go-round, even at high speed",
    "I can't see written words on a page that other people can see",
    "I would be able to distinguish between two oranges purely by their taste",
    "I couldn't distinguish a familiar person and a stranger by their smell",
    "I couldn't detect if bread is stale purely by its smell",
    "I can't tell if my clothes are clean or dirty by smell alone",
    "I would be able to detect the sound of a vacuum cleaner from any room in a two storey building",
    "I wouldn't notice the difference between even and uneven ground when driving over it sitting in the back seat of a car",
    "I would be able to drink a cup of boiling water straight after it had been poured from the kettle",
    "I couldn't tell two types of green apples apart purely from their colour",
    "I would be able to distinguish between an old and a new book by their smell",
    "I would be able to read a street sign from a distance of 100 feet (30 metres)",
    "I can't tell if cars passing me on the street are going at different speeds",
    "I would be able to notice if someone added 5 grains of sugar to my glass of water",
    "I would have difficulty seeing a single leaf clearly even on a tree that is close up",
    "I wouldn't taste if someone added a whole teaspoon of salt to my glass of water",
    "I would be able to feel the elastic holding up my socks if I stop and thought about it",
    "I can't taste the difference between ripe and non-ripe fruit",
    "I would be able to stand on one foot for fifteen seconds without wobbling",
    "I would be able to taste the difference between apparently identical pieces of candy",
    "I notice the weight and pressure of a hat on my head",
    "I would feel if a single hair touched the back of my hand",
    "If I was walking along, I would be able to feel a passing truck's vibrations even if my eyes were closed",
    "I would be able to smell the smallest gas leak from anywhere in the house",
    "I wouldn't notice if someone changed their perfume, by smell alone",
    "I would be able to tell when an elevator/lift started moving",
    "I can hear dog whistles very easily in the park",
    "I wouldn't taste the difference between different types of lettuce leaves",
    "I couldn't taste if there were two slices of lemon in my glass of water if I was drinking it with my eyes closed",
    "I can't go out in bright sunlight without sunglasses",
    "I would be able to read small print, such as a serial number on the back of a DVD, at 10 feet (3 metres) away",
    "I get motion sickness easily (e.g., car sickness or sea sickness)",
    "I would be able to feel a change in the temperature of a cup of coffee after it had sat for 1 minute",
    "I can't hear very low frequency sounds, such as low voices",
    "I would be the first to hear if there was a fly in the room",
    "If I look at a pile of blue sweaters in a shop that are meant to be identical, I would be able to see differences between them",
    "I wouldn't detect a new smell in my house instantly before anyone else",
    "I have perfect pitch: e.g. I could repeat a musical tone without any cue",
    "I would be able to bite into a lemon without any problems",
    "I wouldn't need to wear a coat in the winter, even when it is zero degrees outside",
    "I wouldn't be able to match the colour of a sweater in the shop with the colour of my trousers at home",
    "I wouldn't hear every single note when listening to music",
    "I would be able to smell the difference between most men and women",
    "I choose to wear muted colours",
    "I listen to music at minimum loudness",
    "I would be able to hear each note in a chord even if there were 10 notes",
    "I close curtains to avoid bright lights",
    "I wouldn't be able to hear differences in sound if the same instrument played the same note at different times",
    "I would be able to distinguish two brands of coffee by their smell, even with my eyes closed",
    "I can see dust particles in the air in most environments",
    "I wouldn't be able to taste the difference between two brands of tomato sauce if they had different concentrations of salt",
    "I would be able to smell the smallest amount of burning from anywhere in the house",
    "If my mobile phone was vibrating in my pocket I would be quick to sense it",
    "I find it difficult to see individual stars on a clear night"
  ];
  // [sense, subdomain, rsScale, rsReverse]  sense t/h/v/s/g ; rsScale hy/ho/x
  const M=[
    ['g','Salty','hy',0],['s','Social','hy',0],['g','Sweet','ho',0],['t','Pain','ho',0],['v','Motion','ho',0],
    ['h','Complexity','x',0],['s','Food','hy',0],['g','Sweet','ho',1],['t','Pain','x',0],['t','Pain','ho',0],
    ['t','Temperature','hy',0],['v','Brightness','ho',1],['v','Brightness','ho',0],['g','Sour','ho',1],['s','Danger','ho',0],
    ['t','Vibration','ho',0],['t','Vibration','hy',1],['h','Loudness','ho',0],['h','Loudness','hy',0],['g','Sweet','hy',1],
    ['g','Salty','x',0],['h','Complexity','ho',0],['v','Colour','hy',0],['h','Vestibular','ho',1],['s','Food','ho',0],
    ['h','Vestibular','x',0],['t','Temperature','ho',0],['g','Bitter','ho',0],['h','Frequency','ho',0],['s','Neutral','ho',1],
    ['t','Pressure','ho',0],['h','Frequency','hy',0],['v','Motion','hy',0],['s','Food','ho',0],['t','Temperature','hy',0],
    ['t','Pain','x',0],['v','Motion','hy',0],['t','Pressure','ho',1],['h','Vestibular','x',0],['v','Acuity','ho',0],
    ['g','Sour','hy',0],['s','Social','ho',0],['s','Food','hy',1],['s','Neutral','ho',0],['h','Frequency','hy',0],
    ['t','Vibration','ho',0],['t','Pain','ho',0],['v','Colour','x',0],['s','Neutral','ho',1],['v','Acuity','hy',0],
    ['v','Motion','ho',0],['g','Sweet','hy',0],['v','Acuity','ho',0],['g','Salty','ho',0],['t','Pressure','hy',0],
    ['g','Sweet','ho',0],['h','Vestibular','x',0],['g','Sweet','hy',0],['t','Pressure','ho',1],['t','Pressure','ho',1],
    ['t','Vibration','x',0],['s','Danger','hy',0],['s','Social','ho',0],['h','Vestibular','ho',1],['h','Frequency','hy',0],
    ['g','Bitter','ho',0],['g','Sour','ho',0],['v','Brightness','hy',0],['v','Acuity','hy',0],['v','Motion','hy',0],
    ['t','Temperature','hy',0],['h','Frequency','ho',0],['h','Loudness','hy',0],['v','Colour','hy',0],['s','Neutral','ho',0],
    ['h','Complexity','hy',0],['g','Sour','ho',0],['t','Temperature','ho',0],['v','Colour','x',0],['h','Frequency','x',0],
    ['s','Social','x',0],['v','Brightness','x',0],['h','Loudness','hy',0],['h','Complexity','hy',0],['v','Acuity','hy',0],
    ['h','Complexity','ho',1],['s','Food','hy',0],['v','Acuity','hy',0],['g','Salty','ho',0],['s','Danger','hy',0],
    ['t','Vibration','ho',1],['v','Acuity','ho',0]
  ];
  // ORIGINAL reverse direction for the 13 RS-excluded items, set directly from
  // Tavassoli (2014) Table 4 (italic = reverse-scored), user-verified. [origReverse, provisional]
  const EXCL={6:[0,0],9:[0,0],21:[0,0],26:[1,0],36:[0,0],39:[1,0],48:[1,0],57:[1,0],61:[0,0],79:[1,0],80:[1,0],81:[0,0],82:[0,0]};
  const IN35=new Set([2,7,12,14,19,21,31,32,33,35,36,38,42,43,45,55,58,59,60,61,62,63,68,71,73,74,75,81,84,85,87,88,89,90,91]);
  const SENSE={t:'touch',h:'hearing',v:'vision',s:'smell',g:'taste'};
  const SENSENAME={touch:'Touch',hearing:'Hearing',vision:'Vision',smell:'Smell',taste:'Taste'};
  const items=Q.map((text,i)=>{
    const n=i+1,m=M[i],sense=SENSE[m[0]],rs=m[2],rsRev=!!m[3];
    let origRev,prov=false;
    if(rs==='x'){ const e=EXCL[n]; origRev=!!(e&&e[0]); prov=!!(e&&e[1]); }
    else origRev=(rs==='hy'&&rsRev)||(rs==='ho'&&!rsRev);
    return {n,text,sense,sub:m[1],rs,rsRev,origRev,provOrig:prov,in35:IN35.has(n)};
  });
  items[0].sectionIntro={tag:'How to answer',title:'About these questions',blurb:'For each statement, choose how strongly you agree or disagree. There are no right or wrong answers. Answer for how things usually are for you.'};
  const SPQ_OPTS=[{label:'Strongly disagree'},{label:'Disagree'},{label:'Agree'},{label:'Strongly agree'}];
  const modSubs=list=>{ const o={}; ['touch','hearing','vision','smell','taste'].forEach(k=>{ const its=list.filter(it=>it.sense===k).map(it=>it.n); if(its.length) o[k]={name:SENSENAME[k],items:its}; }); return o; };
  const ORIG_NORMS={
    source:'Tavassoli et al. (2014), Molecular Autism 5:29, Table 5: study-sample descriptives (not norms or cut-offs).',
    dir:'lower = more sensitive',
    asc:{n:196, both:{full:[92.95,26.61],short:[38.55,18.68],vision:[22.12,6.61],hearing:[22.56,5.41],touch:[18.35,6.29],smell:[14.56,8.34],taste:[14.34,6.39]},
      male:{full:[97.50,25.24],short:[40.70,19.84],vision:[22.77,6.36],hearing:[23.37,6.36],touch:[null,null],smell:[15.93,8.29],taste:[15.75,5.78]},
      female:{full:[88.21,27.30],short:[36.25,17.20],vision:[21.54,6.84],hearing:[null,null],touch:[18.58,5.39],smell:[13.12,8.23],taste:[12.87,6.69]}},
    control:{n:163, both:{full:[108.96,20.53],short:[43.01,14.67],vision:[27.12,5.35],hearing:[25.85,4.79],touch:[22.74,5.20],smell:[14.85,5.85],taste:[16.25,5.09]},
      male:{full:[110.06,17.53],short:[null,null],vision:[27.25,4.16],hearing:[25.58,4.57],touch:[22.70,4.46],smell:[16.00,6.10],taste:[17.85,5.50]},
      female:{full:[106.84,21.71],short:[44.57,14.60],vision:[27.09,5.82],hearing:[25.95,4.93],touch:[22.74,5.52],smell:[14.34,5.69],taste:[15.53,4.75]}},
    suspect:'In Table 5 three cells repeat a neighbouring cell and are omitted here (female clients fall back to the both-sexes value): ASC-Male Touch duplicates ASC-Male Hearing, ASC-Female Hearing duplicates ASC-Female Vision (21.54, 6.84; the both-sexes and male rows imply about 21.7), and Control-Male Short duplicates the Control-Both cell. Separately, the Control both-sexes Full mean is printed as 108.96, but the male and female rows (n 49 and 114) combine to 107.81; it is kept as printed because the faulty cell cannot be identified (used only when sex is not recorded, a 0.06 SD difference).'
  };
  const RS_NORMS={
    source:'Taylor et al. (2020), Molecular Autism 11:18, Tables 1–2: female-only study sample (verbal, clinically-diagnosed ASC). Descriptive, not norms.',
    dir:'higher = more atypical', femaleOnly:true,
    hyper:{max:68, sub:{touch:10,hearing:16,vision:20,smell:12,taste:10},
      ascF:{total:[35.1,13.1],touch:[5.5,2.2],hearing:[7.7,3.6],vision:[9.3,4.1],smell:[7.3,3.5],taste:[5.4,2.9]},
      bap:{total:[22.1,11.9],touch:[3.5,2.2],hearing:[4.4,3.2],vision:[5.0,3.6],smell:[5.6,3.1],taste:[3.5,2.6]},
      control:{total:[25.0,10.4],touch:[4.2,2.2],hearing:[4.9,2.8],vision:[5.5,3.0],smell:[6.2,3.3],taste:[4.2,2.6]}},
    hypo:{max:90, sub:{touch:24,hearing:14,vision:14,smell:18,taste:20},
      ascF:{total:[10.5,6.0],touch:[2.3,2.3],hearing:[3.2,1.9],vision:[1.2,1.8],smell:[1.6,2.1],taste:[2.3,2.0]},
      bap:{total:[11.7,4.7],touch:[3.0,2.3],hearing:[2.6,1.5],vision:[1.3,1.4],smell:[1.9,1.9],taste:[2.9,1.8]},
      control:{total:[9.9,5.3],touch:[2.3,1.9],hearing:[2.7,1.8],vision:[0.9,1.3],smell:[1.6,2.0],taste:[2.5,1.8]}}
  };
  Object.assign(REGISTRY,{"spq":{
    id:'spq', name:'SPQ', formLabel:'Full (92-item)', fullName:'Sensory Perception Quotient (92-item)',
    category:'sensory', status:'live', respondent:'Self-report', ageRange:'18+ years', estMinutes:'15–20 min',
    description:'Self-report of sensory sensitivity across the five senses, giving the original single SPQ score and the revised hyper-/hypo-sensitivity scales.',
    citation:'Tavassoli, Hoekstra & Baron-Cohen (2014), Molecular Autism 5:29; revised scoring Taylor et al. (2020), Molecular Autism 11:18.',
    licence:'Open access (CC-BY). Free for clinical and research use.',
    higherMeans:'depends on scale: original total: lower = more sensitive; revised hyper/hypo scales: higher = more atypical',
    scoring:{ type:'spq', rs:true, totalMax:276, options:SPQ_OPTS },
    items,
    subscales:modSubs(items),
    origNorms:ORIG_NORMS, rsNorms:RS_NORMS,
    report:{caveat:'The SPQ has no population norms and no clinical cut-off. It was never validated as a diagnostic classifier, and the studies diagnosed via the AQ, not the SPQ. Scores are shown only against study-sample averages (the revised hyper/hypo reference values are from a female-only sample). The original total runs "lower = more sensitive"; the revised scales run "higher = more atypical". Interpret descriptively, alongside clinical judgement.'}
  }});
  const items35=items.filter(it=>it.in35);
  items35[0]=Object.assign({},items35[0],{sectionIntro:items[0].sectionIntro});
  Object.assign(REGISTRY,{"spq35":{
    id:'spq35', name:'SPQ-35', formLabel:'Short (35-item)', fullName:'Sensory Perception Quotient: short form (35-item)',
    category:'sensory', status:'live', respondent:'Self-report', ageRange:'18+ years', estMinutes:'6–9 min',
    description:'The 35-item short form of the SPQ, a single sensory-sensitivity score (lower = more sensitive).',
    citation:'Tavassoli, Hoekstra & Baron-Cohen (2014), Molecular Autism 5:29 (Table 4 short form).',
    licence:'Open access (CC-BY). Free for clinical and research use.',
    higherMeans:'lower = more sensitive (reverse of most questionnaires)',
    scoring:{ type:'spq', rs:false, totalMax:105, options:SPQ_OPTS },
    items:items35,
    subscales:modSubs(items35),
    origNorms:ORIG_NORMS,
    report:{caveat:'The SPQ short form has no population norms and no clinical cut-off. The score is shown only against study-sample averages. Note the direction: a LOWER score means MORE sensory sensitivity. Interpret descriptively, alongside clinical judgement.'}
  }});
})();
/* (excluded instrument omitted from the hosted build) */

/* (excluded instrument omitted from the hosted build) */

/* (excluded instrument omitted from the hosted build) */

/* (excluded instrument omitted from the hosted build) */

/* (excluded instrument omitted from the hosted build) */

/* (excluded instrument omitted from the hosted build) */

/* ── SQ-A-2 — Signposting Questionnaire for Autism-2 (self-report, adult) ─────
   Livingston, Jones et al. (2026), 18-item Adapted self-report. 4-point scale,
   binary scoring (DISCO weighting): 6 reverse items {1,4,5,9,10,15}; 10 items
   score only on the extreme "Definitely" response (strict:true), 8 also score
   on "Slightly". NO validated cut-off — signposting only; score is read against
   the autistic vs non-autistic group means. Items 1–14 keying confirmed against
   Jones 2020; items 15–18 weighting inferred to fit the published 10/8 split
   (RRB/sensory items strict, "share happiness" not) — verify if the authors'
   scoring syntax becomes available. ── */
Object.assign(REGISTRY, {"sqa2":{
  id:'sqa2', name:'SQ-A-2', fullName:'Signposting Questionnaire for Autism-2 (self-report)',
  category:'autism', status:'live', respondent:'Self-report', ageRange:'Adult', estMinutes:'~5 min',
  description:'A brief 18-item self-report signposting screen for autism in adults, mapped to DSM-5 via the DISCO. Higher scores indicate more autistic behaviours; there is no diagnostic cut-off.',
  citation:'Livingston LA, Jones CRG, et al. (2026). The Signposting Questionnaire for Autism-2 (SQ-A-2). Molecular Autism 17:22.',
  higherMeans:'more autistic behaviours',
  unverified:{ date:'2026-07-20', note:'Provisional: the per-item scoring key for items 15–18 was inferred to satisfy the published totals, not taken from an authoritative source. Awaiting the owners\' official copy before this instrument can be verified.' },
  norms:{
    source:'Livingston et al. (2026), Molecular Autism 17:22: 18-item Adapted SQ-A-2 (Table 3).',
    autistic:{ mean:7.70, sd:3.31, median:8, range:'0–17' },
    nonAutistic:{ mean:2.48, sd:2.23, median:2, range:'0–9' }
  },
  report:{caveat:'A brief signposting screen, not a diagnostic test: there is no validated cut-off. The total is shown against autistic and non-autistic group averages to indicate where a person sits; clinical judgement and full assessment apply.'},
  scoring:{ type:'binary', totalMax:18, subscales:{},
    // items 15–18 have a provisional Definitely/Slightly rule (see items below);
    // exactly ONE of them is truly "Slightly-counts", so the inferred keying can
    // move a total by at most ±1 — the scorer returns a `range` reflecting this.
    provisionalSlightlyCount:1,
    options:[
      {label:'Definitely agree', agree:true,  strong:true },
      {label:'Slightly agree',   agree:true,  strong:false},
      {label:'Slightly disagree',agree:false, strong:false},
      {label:'Definitely disagree',agree:false, strong:true }
    ]},
  items:[
    {n:1,  text:"I seek comfort or help when I am in pain or distress.", scoredDirection:'disagree', strict:false},
    {n:2,  text:"I find it difficult to offer comfort if others are upset.", scoredDirection:'agree', strict:true},
    {n:3,  text:"I tend to avoid others (e.g. I move away if I am near them).", scoredDirection:'agree', strict:false},
    {n:4,  text:"I enjoy sharing lots of different interests with others.", scoredDirection:'disagree', strict:false},
    {n:5,  text:"I use gestures that express emotion.", scoredDirection:'disagree', strict:true},
    {n:6,  text:"I have difficulty responding to others' emotions.", scoredDirection:'agree', strict:true},
    {n:7,  text:"I do not use a pointing gesture to show objects and share interest with others.", scoredDirection:'agree', strict:true},
    {n:8,  text:"I have difficulty making and keeping friendships.", scoredDirection:'agree', strict:false},
    {n:9,  text:"I join in and interact with others without needing to be asked.", scoredDirection:'disagree', strict:false},
    {n:10, text:"I am aware of others' feelings.", scoredDirection:'disagree', strict:false},
    {n:11, text:"I repeat certain words or phrases out of context, over and over again.", scoredDirection:'agree', strict:true},
    {n:12, text:"I arrange objects in patterns or lines and do not like these to be disturbed.", scoredDirection:'agree', strict:true},
    {n:13, text:"When left to choose my own activities, I choose only a few things that are always the same.", scoredDirection:'agree', strict:false},
    {n:14, text:"My approaches to others can be one-sided.", scoredDirection:'agree', strict:true},
    {n:15, text:"I share in others' happiness as if it were my own.", scoredDirection:'disagree', strict:false, provisional:true},
    {n:16, text:"I insist on things at home remaining the same (e.g. furniture staying in the same place, or things being kept in certain places or arranged in certain ways).", scoredDirection:'agree', strict:true, provisional:true},
    {n:17, text:"I collect particular types of objects because I want to make a large collection.", scoredDirection:'agree', strict:true, provisional:true},
    {n:18, text:"I am upset by some sounds that do not affect other people (e.g. vacuum cleaners, aeroplanes).", scoredDirection:'agree', strict:true, provisional:true}
  ]
}});

/* ── SCI-08 — Sleep Condition Indicator ───────────────────────────────────────
   Eight self-report items, each scored 0–4 (higher = better sleep), summed to a
   0–32 total. A total of 16 or below screens positive for probable insomnia
   disorder (DSM-5 aligned). A two-item short form (SCI-02, items 3 + 7, 0–8) is
   reported for reference. Each item has its OWN response labels, so we use the
   per-item optionSet mechanism (like Vanderbilt); options store the VALUE, so a
   stored answer IS the item's score. Scored by Scoring.sci (reverse cut-off). */
Object.assign(REGISTRY, {"sci":{
  id:'sci', name:'SCI-08', fullName:'Sleep Condition Indicator (SCI-08)',
  category:'sleep', status:'live',
  respondent:'Self-report', ageRange:'16+ years', estMinutes:'2–3 min',
  description:'Eight-item screen for probable insomnia disorder (DSM-5 aligned).',
  citation:'Espie, C.A. et al. (2014). The Sleep Condition Indicator: a clinical screening tool to evaluate insomnia disorder. BMJ Open 4(3):e004183.',
  higherMeans:'better sleep (lower scores indicate more insomnia)',
  verified:{ date:'2026-07-20', note:'Items, the five per-item response sets and the reverse-keyed ≤16 probable-insomnia cut-off checked against source (Espie et al. 2014). Q8 duration bands corrected to match the source form (1–2 / 3–6 / 7–12 mo). No normative tables in the app.' },
  report:{ caveat:'The SCI screens for insomnia disorder; it is not diagnostic. A positive screen (total ≤16) indicates probable insomnia and warrants a fuller sleep assessment. Interpret alongside the clinical picture.' },
  scoring:{
    type:'sci', totalMax:32, cutoff:16, shortItems:[3,7], shortMax:8,
    optionSets:{
      latency:[{label:'0–15 min',v:4},{label:'16–30 min',v:3},{label:'31–45 min',v:2},{label:'46–60 min',v:1},{label:'≥ 61 min',v:0}],
      nights:[{label:'0–1',v:4},{label:'2',v:3},{label:'3',v:2},{label:'4',v:1},{label:'5–7',v:0}],
      quality:[{label:'Very good',v:4},{label:'Good',v:3},{label:'Average',v:2},{label:'Poor',v:1},{label:'Very poor',v:0}],
      impact:[{label:'Not at all',v:4},{label:'A little',v:3},{label:'Somewhat',v:2},{label:'Much',v:1},{label:'Very much',v:0}],
      duration:[{label:"I don't have a problem / < 1 mo",v:4},{label:'1–2 mo',v:3},{label:'3–6 mo',v:2},{label:'7–12 mo',v:1},{label:'> 1 yr',v:0}]
    }
  },
  subscales:{},
  items:[
    {n:1, prompt:'Thinking about a typical night in the last month…', text:'How long does it take you to fall asleep?', optionSet:'latency'},
    {n:2, prompt:'Thinking about a typical night in the last month…', text:'If you then wake up during the night, how long are you awake for in total? (Add all the wakenings up.)', optionSet:'latency'},
    {n:3, prompt:'Thinking about a typical night in the last month…', text:'How many nights a week do you have a problem with your sleep?', optionSet:'nights', short:true},
    {n:4, prompt:'Thinking about a typical night in the last month…', text:'How would you rate your sleep quality?', optionSet:'quality'},
    {n:5, prompt:'Thinking about the past month…', text:'To what extent has poor sleep affected your mood, energy, or relationships?', optionSet:'impact'},
    {n:6, prompt:'Thinking about the past month…', text:'To what extent has poor sleep affected your concentration, productivity, or ability to stay awake?', optionSet:'impact'},
    {n:7, prompt:'Thinking about the past month…', text:'To what extent has poor sleep troubled you in general?', optionSet:'impact', short:true},
    {n:8, prompt:'Finally…', text:'How long have you had a problem with your sleep?', optionSet:'duration'}
  ],
  cutoffs:[{score:16, recommended:true, note:'Espie et al. 2014; a total of 16 or below indicates probable insomnia disorder (higher scores = better sleep). Against the ISI, not a clinical diagnosis: 89% of probable-insomnia cases and 82% of non-cases correctly classified.'}]
}});

/* ── IES-R — Impact of Event Scale – Revised ──────────────────────────────────
   22 self-report items rating distress about a SPECIFIC stressful/traumatic
   event over the PAST 7 DAYS, each 0–4 (Not at all → Extremely). Summed to a
   0–88 total plus three subscales: Intrusion (8), Avoidance (8), Hyperarousal
   (6). All items share one 0–4 response set, so this uses the standard `likert`
   scoring (total + subscale sums; no reverse items). Total bands: ≥25 clinical
   concern (Asukai 2002, a 24/25 cut), ≥33 probable PTSD (Creamer 2003, best
   cut-off). The 37 "immune suppression" line on circulating scoring sheets was
   dropped: in Kawamura 2001 (Table 1) 37 is the mean score of 12 men with past
   PTSD, not a threshold. Verdict → resultsIESR. */
/* IES-R omitted from the hosted build (copyright: Weiss / Guilford Press). */

/* Y-BOCS family omitted from the hosted build (copyright: OCD Scales, LLC). */

/* ── OCI-R — Obsessive-Compulsive Inventory-Revised ───────────────────────────
   18 self-report items, each rated 0–4 for how much that experience DISTRESSED
   or BOTHERED the person over the PAST MONTH, summed to a 0–72 total and to six
   three-item subscales (0–12 each): Washing, Obsessing, Hoarding, Ordering,
   Checking, Mental Neutralizing. No reverse-scored items.

   Deliberately NOT built as a variant of anything else, and nothing here may be
   reused for a child form: the OCI-CV / OCI-CV-R rate 0–2 with a different
   subscale count and their own separately-derived cut-offs. Each form is built
   from its own paper.

   Cut-offs are Foa et al.'s own ROC results (Table 9), NOT the "18 or a subscale
   mean of 2.5" rule that circulates on third-party scoring handouts — that rule
   is absent from the paper, and the paper scores SUMS, never means.

   Read the subscales with care: in the validation sample Hoarding ran BACKWARDS
   (controls scored higher than OCD patients, d = -0.24) and Ordering did not
   separate the groups at all (p = .25). resultsOci says so on the page rather
   than letting the bars imply otherwise. */
(function(){
  const DISTRESS = [
    {label:'Not at all',  v:0},
    {label:'A little',    v:1},
    {label:'Moderately',  v:2},
    {label:'A lot',       v:3},
    {label:'Extremely',   v:4}
  ];

  /* Subscale membership is Table 1 (p.487): the six promax factors of the final
     18-item solution, three items each. NOT inferred from the item wording. */
  const SUBSCALES = {
    washing:      {name:'Washing',            items:[5,11,17]},
    obsessing:    {name:'Obsessing',          items:[6,12,18]},
    hoarding:     {name:'Hoarding',           items:[1,7,13]},
    ordering:     {name:'Ordering',           items:[3,9,15]},
    checking:     {name:'Checking',           items:[2,8,14]},
    neutralizing: {name:'Mental Neutralizing', items:[4,10,16]}
  };

  /* Two lanes from two different papers, each the best available of its kind.
     Both are US samples and NEITHER is a UK general-population norm.

     NON-CLINICAL lane — Foa et al. (2002) Table 8. Labelled for what it actually
     is: 477 University of Delaware psychology students (p.490), not "the general
     population". Foa states this sample was normally distributed (p.491), so a
     percentile would be defensible on distribution grounds; the app nonetheless
     reports SD DISTANCE ONLY (see sdOnly below).

     OCD lane — Abramovitch, Abramowitz, Riemann & McKay (2020) Table 2, which
     REPLACED Foa's own n=215 OCD group on 2026-08-04 (Ryan's decision): 1,339
     treatment-seeking US adults across outpatient, partial-hospitalisation and
     residential settings, six times the size and two decades more recent. Note
     it runs LOWER than Foa's OCD sample (25.11 vs 28.01).

     CONSEQUENCE, stated on the results panel rather than hidden: the 21/18
     cut-offs were derived on Foa's OCD-vs-control comparison, so the cut-off
     marks no longer sit on the OCD sample that produced them. */
  const GROUPS = [
    { key:'nac', label:'US students', fullLabel:'Non-clinical (US undergraduates)', n:477,
      mean:18.82, sd:11.10, median:17,
      source:'Foa et al. (2002) Table 8: 477 psychology students, University of Delaware.',
      subs:{ washing:{mean:2.41, sd:2.50, median:2}, obsessing:{mean:2.86, sd:2.72, median:2},
             hoarding:{mean:4.41, sd:2.67, median:4}, ordering:{mean:4.40, sd:3.03, median:4},
             checking:{mean:2.91, sd:2.56, median:2}, neutralizing:{mean:1.82, sd:2.20, median:1} } },
    { key:'ocd', label:'OCD', fullLabel:'Treatment-seeking adults with OCD', n:1339,
      mean:25.11, sd:12.72, median:23, iqr:16,
      source:'Abramovitch, Abramowitz, Riemann & McKay (2020) Table 2: 1,339 treatment-seeking US adults with OCD.',
      subs:{ washing:{mean:4.62, sd:4.30, median:4, iqr:9}, obsessing:{mean:6.89, sd:3.76, median:7, iqr:6},
             hoarding:{mean:2.72, sd:3.26, median:2, iqr:4}, ordering:{mean:4.00, sd:3.68, median:3, iqr:6},
             checking:{mean:4.09, sd:3.56, median:3, iqr:5}, neutralizing:{mean:2.77, sd:3.49, median:1, iqr:4} } }
  ];
  /* Cohen's d, OCD vs nonanxious, Table 8. Negative = controls scored HIGHER. */
  const SUB_D = { washing:0.61, obsessing:1.40, hoarding:-0.24, ordering:0.11,
                  checking:0.64, neutralizing:0.48 };
  /* subscales the paper reports as NOT significantly separating OCD from controls */
  const SUB_NS = ['hoarding','ordering'];

  /* ── DSM-5 RESCORING ────────────────────────────────────────────────────────
     Wootton, Diefenbach, Bragdon, Steketee, Frost & Tolin (2015), Psychological
     Assessment 27(3):874-882, on 118 adults with OCD, 201 with hoarding disorder
     and 155 community controls.

     DSM-5 made hoarding its own diagnosis, so three of the OCI-R's eighteen items
     now measure a different disorder from the other fifteen. This paper scores
     them apart: OCI-HD (items 1, 7, 13) and OCI-OCD (the rest). It is a SECOND
     LENS, not the verdict - the 21/18 total cut-offs stay the headline, because
     they are what the rest of the literature and the child form's sibling
     relationship rest on.

     Why the OCI-HD's numbers are so much better than the total's, and why that is
     NOT a reason to promote them: this study's controls were screened by
     structured interview to have no current OR PAST mental disorder, a
     supernormal group against which any screen looks good. Its positive
     predictive power for the OCI-OCD was .61 at a 25% base rate, so at a lower
     base rate it would be worse. The good argument for the split is construct,
     not ROC: if hoarding is a separate diagnosis, three hoarding items inside an
     OCD total are noise, which is the same thing this entry already says when it
     flags Hoarding as non-discriminating.

     DISTRIBUTIONS: the OCI-HD lanes carry one, the OCI-OCD lanes deliberately do
     NOT. Both come from ROC coordinate tables, but only Table 3 survives the
     recoverability gate. Sampling every printed 2dp value inside its +/-0.005
     rounding envelope and enforcing ROC monotonicity, Table 3 reaches the
     hoarding group's separately published mean and SD (9.29, 2.45) while Table 4
     cannot reach the OCD group's (23.94 reachable only to 23.77; 12.11 only to
     11.71). Table 4's tail is also visibly corrupt - rows 51-56 duplicate rows
     41-46 exactly, printing a sensitivity that RISES after reaching 0.00, and its
     correctly-classified column exceeds the ceiling that a
     nobody-screens-positive cut imposes. Both moments being too LOW is exactly
     what a lost upper tail produces. scripts/diff_ocir_wootton.py asserts the
     pass, the failure AND both printed faults, so a corrected reprint reopens the
     decision rather than silently passing. */
  const W_SRC = 'Wootton BM, Diefenbach GJ, Bragdon LB, Steketee G, Frost RO & Tolin DF (2015). A contemporary psychometric evaluation of the Obsessive Compulsive Inventory-Revised (OCI-R). Psychological Assessment 27(3):874-882.';
  const WOOTTON_SPLIT = {
    source:W_SRC,
    caveat:'Both cut-offs come from one study whose control group was screened to have no current or past mental disorder, which is a stronger comparison than a clinic sees. Read them as a second lens on the same eighteen items, not as a replacement for the total and its 21 / 18 cut-offs.',
    scales:[
      { key:'oci_hd', name:'OCI-HD', label:'Hoarding (OCI-HD)', items:[1,7,13], max:12,
        cutoff:6, target:'hoarding disorder', sens:92, spec:93, auc:0.97, ppv:91, npv:94, correct:93,
        note:'Wootton et al. 2015, Table 3: the three hoarding items scored alone, against everyone else in the study. This is the strongest screen anywhere on the OCI-R: area under the curve .97, correctly classifying 93%. DSM-5 separated hoarding disorder from OCD, which is why these items do not help identify OCD and do identify something else.',
        table2:{ hd:[9.29,2.45], ocd:[1.89,2.59], cc:[1.32,2.16] },
        groups:[
          { key:'non', label:'Everyone else in the study', n:273, mean:1.57, sd:2.37, median:0, iqr:2,
            derived:true,
            source:'Wootton et al. (2015) Table 3, specificity column: the 118 adults with OCD and 155 community controls POOLED, because the study contrasts each disorder against everyone else and the two cannot be separated back out. Their published means apart are 1.89 (SD 2.59) and 1.32 (SD 2.16); the pooled figures here are computed from those, and the distribution is the table\'s own.',
            dist:[0.5,0.64,0.76,0.86,0.9,0.93,0.95,0.96,0.97,0.98,0.98,0.99,1] },
          { key:'hd', label:'Hoarding disorder', n:201, mean:9.29, sd:2.45, median:10, iqr:3,
            source:'Wootton et al. (2015) Table 2 for the mean and SD, Table 3\'s sensitivity column for the distribution.',
            dist:[0,0,0.01,0.02,0.05,0.08,0.14,0.21,0.32,0.46,0.61,0.78,1] }
        ] },
      { key:'oci_ocd', name:'OCI-OCD', label:'OCD symptoms (OCI-OCD)',
        items:[2,3,4,5,6,8,9,10,11,12,14,15,16,17,18], max:60,
        cutoff:12, target:'OCD', sens:82, spec:83, auc:0.91, ppv:61, npv:93, correct:83,
        note:'Wootton et al. 2015, Table 4: the fifteen non-hoarding items scored alone, against everyone else in the study. Its positive predictive power was .61, so even here a positive screen was wrong about two times in five in a sample where one in four had OCD.',
        table2:{ hd:[9.25,8.28], ocd:[23.94,12.11], cc:[2.35,3.54] },
        groups:[
          { key:'cc', label:'Community controls', n:155, mean:2.35, sd:3.54,
            source:'Wootton et al. (2015) Table 2: 155 adults screened by structured interview to have no current or past mental disorder. Note how far this sits below Foa\'s 477 undergraduates on the total scale: "non-clinical" is not one thing.' },
          { key:'hd', label:'Hoarding disorder', n:201, mean:9.25, sd:8.28,
            source:'Wootton et al. (2015) Table 2. The paper\'s Discussion misprints this as 9.23 (SD 2.45), carrying across the SD from its OCI-HD row; the table is used.' },
          { key:'ocd', label:'Adults with OCD', n:118, mean:23.94, sd:12.11,
            source:'Wootton et al. (2015) Table 2.' }
        ] }
    ]
  };

  Object.assign(REGISTRY, {"ocir":{
    id:'ocir', name:'OCI-R', fullName:'Obsessive-Compulsive Inventory-Revised (OCI-R)',
    category:'ocd', status:'live',
    respondent:'Self-report', ageRange:'Adults', estMinutes:'5–10 min',   // OCI-R manual: typically 5-10 minutes
    description:'Eighteen-item self-report screen for obsessive-compulsive symptoms, rating distress over the past month across six symptom dimensions. Total 0–72 with published screening cut-offs.',
    citation:'Foa EB, Huppert JD, Leiberg S, Langner R, Kichic R, Hajcak G & Salkovskis PM (2002). The Obsessive-Compulsive Inventory: development and validation of a short version. Psychological Assessment 14(4):485–496. Severity benchmarks and the OCD reference sample: Abramovitch A, Abramowitz JS, Riemann BC & McKay D (2020). Severity benchmarks and contemporary clinical norms for the Obsessive-Compulsive Inventory-Revised (OCI-R). J Obsessive-Compulsive Relat Disord 27:100557. Subscale validity against symptom subtypes: Huppert JD, Walther MR, Hajcak G, Yadin E, Foa EB, Simpson HB & Liebowitz MR (2007). The OCI-R: validation of the subscales in a clinical sample. J Anxiety Disord 21(3):394–406.',
    licence:'© Edna B. Foa 2002 (the copyright line printed on the form and on the paper’s Appendix). NO explicit grant of permission to reproduce or web-publish the scale could be located: the paper contains none, and PsyToolkit (who document scale licensing carefully) say only that it may be used for research while respecting that copyright note. The formal permission route is a request to Foa / the Center for the Treatment and Study of Anxiety at the University of Pennsylvania. Aggregator sites assert it is "public domain" or "free for non-commercial use", but none is the rights holder and none cites a grant. INCLUDED in the publicly hosted build by Ryan’s explicit decision (2026-08-04) on the basis that the scale circulates freely in NHS and university materials; this is a documented risk acceptance, not a located licence. Reverse it by removing ocir from ALLOW in build.py.',
    higherMeans:'greater distress from obsessive-compulsive symptoms',
    verified:{ date:'2026-08-04', note:'All 18 items GENERATED from the Appendix (p.496) of the source PDF rather than retyped, then machine-diffed back against that page: 18/18 exact. ONE declared correction, scoped to item 7 only, covering the substring "don ’t" -> "don\'t": the PDF text layer extracts a spurious space before the apostrophe (a kerning artefact, the printed page reads "don\'t") and registry.js writes apostrophes as ASCII (grep: 5 ASCII, 0 curly). Declared per item rather than globally, so it cannot silently rewrite another item. No other character differs from the printed form; no US spellings needed anglicising. Re-checkable at any time with scripts/diff_ocir.py, which re-extracts the PDF and asserts 95 facts (item text, Table 1 allocations, response set, cut-offs, all 56 Table 8 figures) — currently 18/18 items exact, 95/95 pass. The six subscale allocations are Table 1 (p.487) factor loadings, three items each, NOT inferred from wording. Response set, its five verbal labels, the past-month frame and the distress (not frequency) instruction are the Appendix’s own; there are no reverse-scored items. SUM scoring with subscale 0–12 and total 0–72 confirmed from the Table 7 and Table 8 notes. Cut-offs are Table 9: 21 vs nonanxious (sens 65.6%, spec 63.9% — see the CORRECTION below) and 18 vs anxious controls (sens 74.0%, spec 75.2%), with the Obsessing-subscale cut-offs 4 and 5. TWO DEPARTURES FROM COMMON PRACTICE, both deliberate: (1) the widely circulated third-party scoring handout — which prints "a total of 18 or more, or a MEAN of 2.5 or more in any subscale", adds frequency anchors ("A little = once per week or less") absent from Foa’s form, and contradicts itself by naming six subscales then seven — is NOT followed; the paper is. (2) The paper disagrees with itself on one figure: p.492 text gives specificity 63.9% for the cut-off of 21 while Table 9 gives 63.4%. CORRECTED 2026-08-04, after Ryan challenged an earlier claim about Table 9 and the page was re-rendered from the PDF at 3x to read it directly: the app FIRST shipped the table value 63.4 on a general table-beats-prose rule, which was WRONG here. The text is arithmetically corroborated and the table is not. The same p.492 sentence prints the raw counts, "141 of 215 OCs and 305 of 477 NACs"; 305/477 = 63.94%, matching the text exactly, whereas 63.4% would require 302.42 of 477 controls. Every other specificity in that column maps cleanly onto a whole number of 477 (37, 121, 223, 267, 295, 446); only 63.4 corresponds to no whole count at all. The TEXT VALUE 63.9 IS NOW USED. Norms are Table 8 (p.492) as printed, both samples, all six subscales plus total, means SDs and medians. DISTRIBUTION SHAPE, stated exactly as the paper does after a re-read on 2026-08-05: p.491 says only that "the new student sample and the OCs had distributions within the normal range", and that narrow sentence is what licensed the percentiles the app originally showed. It should not be quoted as a general normality claim — the SAME paper states twice (pp.486 and 489-490) that Kolmogorov-Smirnov tests showed most measures were NOT normally distributed, and uses nonparametric statistics throughout. Percentiles have since been dropped anyway (see sdOnly below), on sample grounds rather than distributional ones, so nothing now rests on this. The medians are still displayed because mean 18.82 vs median 17 shows residual right skew. Hoarding (d = -0.24, controls HIGHER) and Ordering (p = .25) are flagged non-discriminating on the results page. Reliability, factor structure and the AUCs are not re-derived here. ── ADDED 2026-08-04 FROM A SECOND PAPER, Abramovitch, Abramowitz, Riemann & McKay (2020), J Obsessive-Compulsive Relat Disord 27:100557 (1-s2.0-S2211364920300786-mainext.pdf): (a) SEVERITY BANDS 0-15 mild / 16-27 moderate / 28-72 severe, read off Fig. 3 and cross-checked against the Discussion (p.6). Fig. 3 settles an off-by-one the prose leaves open: Table 6 prints the mild/moderate cut score as 15 and its worked example treats 15 as moderate, while the figure puts 15 inside mild. THE FIGURE IS FOLLOWED. Two objections were weighed and ACCEPTED by Ryan on 2026-08-04 rather than overlooked. FIRST, provenance: these bands are calibrated against the Y-BOCS severity groups of Storch et al. (2015), which this app deliberately does NOT use for the Y-BOCS itself (ybocs_clin keeps the NICE CKS ladder). Of the four reasons recorded for that choice, three do not carry over - there is no NICE or CKS band for the OCI-R to compete with, this is a US sample not a Brazilian one, and OCI-R totals here span the full 1-72 rather than flooring at 7 - leaving only the shared-rater concern, which reaches the OCI-R second-hand, since within the 2020 study the OCI-R is self-report and the Y-BOCS was mostly self-report too (375 of the 606 with a Y-BOCS, 62%, used the self-report version; p.3). SECOND, and independent of Storch: the boundaries are weak at the top. Table 6 gives sensitivity .53 and specificity .51 for moderate-severe vs severe, Table 5 gives AUC .58, and even the collapsed moderate-vs-severe cut manages only .62/.59. The authors state that caution is merited and that severity should not be judged from the OCI-R alone; that warning is carried on the results page. (b) The OCD REFERENCE LANE was REPLACED: Foa\'s own n=215 OCD group gives way to Table 2\'s n=1339 treatment-seeking US adults (total M 25.11, SD 12.72, Mdn 23, IQR 16, range 1-72, all six subscales), six times the size and two decades more recent, and notably LOWER than Foa (25.11 vs 28.01). Consequence stated on the panel rather than hidden: the 21/18 cut-offs were derived on Foa\'s OCD-vs-control comparison, so the cut-off marks no longer sit on the OCD sample that produced them. (c) PERCENTILES DROPPED in favour of per-group SD distance (sdOnly), Ryan\'s decision. This is NOT the child form\'s distributional argument: Foa states his control sample was normally distributed, but that sample is 477 University of Delaware psychology students (p.490), so a percentile against it would read as a population standing it cannot support. The lane is now labelled for what it is. The 2020 paper supplies no control group of its own (n=1339, all OCD), so it could not fix this. (d) Its CFA independently reproduces the same six-factor structure with alphas .83-.91, corroborating the Table 1 subscale allocation. NOT verified from the 2020 paper: its own AUCs, alphas, higher-order loadings and Table 4 severity-group breakdown are cited, not re-derived. TABLE 9 CUTSCORE-25 ROW, an observation only, and DELIBERATELY NOT ACTED ON. It has two oddities. (i) It reports sensitivity 50.2% against nonanxious and 49.8% against anxious controls, though both are computed on the same 215 patients and every other row agrees exactly across the two columns; the implied counts are 108 and 107, so one cell is out by a single patient. Real, but trivial. (ii) Its specificity of 93.5% implies that only 31 of the 477 controls scored 25 or above, while 175 scored 21 or above - putting 144 people, 30% of the whole sample, inside the four-point band 21-24, when the single point 20 holds 8. That is a strange shape for a unimodal distribution. HOWEVER, an earlier and stronger claim here that the row "looks corrupt" was WITHDRAWN on 2026-08-04: 93.5% is exactly 446/477, a clean whole count, so it is not a transposition artefact of the kind the 63.4 cell is, and the oddity is an inference from published marginals rather than a demonstrated error. Nothing in the app uses this row either way; it is recorded so that nobody quotes 93.5% as a specificity without noticing the distribution it implies. ── ADDED 2026-08-05 FROM A THIRD PAPER, Huppert, Walther, Hajcak, Yadin, Foa, Simpson & Liebowitz (2007), J Anxiety Disord 21(3):394-406. TEXT ONLY, NO DATA CHANGED. The app carried Foa\'s finding that Hoarding and Ordering do not separate OCD from controls and stopped there, which reads as "these two subscales are useless". Huppert tested the complementary question in 186 patients with OCD plus 17 with GAD, comparing each subscale across patients for whom that symptom subtype was primary, present but not primary, or absent, keyed to the Y-BOCS symptom checklist. All six subscales, Hoarding and Ordering included, were elevated in the patients whose primary symptom was that dimension. Both halves are now stated on the subscale panel through the new subscaleNote field: the subscales do not tell you WHETHER OCD is present, but within someone who has it they do tell you WHICH dimension is prominent. Also carried from that paper, and the only number taken from it: the clinical-sample internal consistency of Neutralizing, alpha .57, which is weak enough that a reader should discount that row (the full set is obsessing .88, washing .69, checking .87, neutralizing .57, ordering .89, hoarding .93, total .84). NOT taken from this paper: its group means as a reference lane. Its OCD sample of 186 is far smaller than the n=1339 lane already in use, its GAD comparison group is n=17, and only 4 patients had primary neutralizing and 5 primary ordering, so several subtype cells are too small to quote.' },
    report:{ caveat:'The OCI-R screens for obsessive-compulsive symptoms and is not diagnostic. Even at its best cut-off it misclassifies a substantial minority in both directions (at 21, sensitivity 66% and specificity 63%), so a negative screen does not exclude OCD and a positive one needs confirming against DSM-5-TR or ICD-11 criteria, ideally with the Y-BOCS. Hoarding and Ordering did not distinguish OCD from controls in the validation sample; do not read an elevation on either as evidence of OCD.' },
    scoring:{
      type:'oci', itemMax:4, totalMax:72, cutoff:21, cutoffAc:18, endorseAt:3,
      /* Empirically derived severity benchmarks, Abramovitch, Abramowitz, Riemann
         & McKay (2020) Fig. 3, confirmed against the Discussion (p.6): 0-15 mild,
         16-27 moderate, 28-72 severe. The figure settles an off-by-one the prose
         leaves open (Table 6 prints the mild/moderate cut score as 15 and treats
         15 as moderate in its worked example, while the bands put 15 in mild).
         ADDED WITH COLOUR by Ryan's explicit decision, 2026-08-04 — see the
         verified note for the two objections weighed and accepted. */
      severity:[
        {max:15,   label:'Mild',     cls:'band-typical'},
        {max:27,   label:'Moderate', cls:'band-elevated'},
        {max:null, label:'Severe',   cls:'band-high'}
      ],
      optionSets:{ distress:DISTRESS }
    },
    severitySource:'Severity benchmarks: Abramovitch, Abramowitz, Riemann & McKay (2020), J Obsessive-Compulsive Relat Disord 27:100557, Fig. 3: derived on the 606 of 1,339 treatment-seeking adults with OCD who had a Y-BOCS (62% of them the self-report version), by calibrating OCI-R totals against the Y-BOCS severity groups of Storch et al. (2015).',
    /* The benchmarks describe position on the OCD severity continuum. They were
       derived entirely within an OCD sample, so "Mild" on a score that has not
       even reached the screening cut-off does NOT mean mild OCD - it means a low
       score. resultsOci says so whenever the two disagree. */
    severityCaveat:'These benchmarks were derived entirely within a sample of people already diagnosed with OCD, by calibrating OCI-R totals against Y-BOCS severity. They describe where a total sits on the OCD severity continuum; they do not establish that OCD is present. The authors report that accuracy falls away at the top of the range (the moderate versus severe boundary drawn here, at 27/28, managed 62% sensitivity and 59% specificity, AUC .65; the finer moderate-severe versus severe split managed only 53% and 51%) and advise that severity should not be judged from the OCI-R alone.',
    /* SD DISTANCE ONLY, no percentile - Ryan's decision 2026-08-04. Distinct from
       the child form's normsNonNormal, which is a distributional argument: here
       Foa's control sample IS normally distributed, but it is 477 US psychology
       undergraduates, so a percentile against it would read as a population
       standing it cannot support. Per-group SD says exactly as much as is known. */
    sdOnly:true,
    subscales:SUBSCALES,
    subscaleD:SUB_D, subscaleNonDiscriminating:SUB_NS,
    dsm5Split:WOOTTON_SPLIT,
    /* The non-discriminating warning above is true but is only half of what the
       literature says, and on its own it reads as "these two subscales are
       useless". Huppert et al. (2007) tested the other half in a clinical sample
       and it holds, so both are now stated. Kept as data rather than results-page
       copy so the child form, which has no non-discriminating subscales, is
       untouched. */
    subscaleNote:'Within someone who does have OCD, the same subscales do work. Huppert et al. (2007) validated all six against Y-BOCS symptom subtypes in 186 patients with OCD: each subscale was elevated in the patients whose primary symptom was that dimension, Hoarding and Ordering included. So read an elevation here as a pointer to which dimension is prominent, not as evidence about whether OCD is present at all. One reliability caveat from that same clinical sample: Neutralizing is the weakest of the six (alpha .57, against .84 for the total and .87 to .93 for Checking, Ordering and Hoarding), so treat a Neutralizing score as the least stable number on this table.',
    compareGroups:GROUPS,
    norm:{ label:'nonanxious controls', group:'nonanxious controls', n:477, mean:18.82, sd:11.10, median:17 },
    /* sens/spec are Table 9's figures, EXCEPT the one cell where the paper
       contradicts itself and the text demonstrably wins. See the note on the 21
       row: 63.4% corresponds to no whole number of the 477 controls, 63.9% is
       exactly the 305/477 the paper prints in its own running text. */
    cutoffs:[
      {score:21, recommended:true, contrast:'nonanxious controls', sens:65.6, spec:63.9,
       note:'Foa et al. 2002: optimal total-score cut-off separating OCD from nonanxious controls (sensitivity 65.6%, specificity 63.9%). The paper disagrees with itself here: Table 9 prints 63.4% while the p.492 text prints 63.9%. The TEXT is followed, against the usual table-beats-prose rule, because it is arithmetically corroborated and the table is not: the same sentence gives the raw counts (141 of 215 OCs, 305 of 477 NACs), and 305/477 = 63.94%, whereas 63.4% would require 302.42 controls. Every other specificity in that column maps onto a whole number of 477; only 63.4 does not.'},
      {score:18, contrast:'anxious controls', sens:74.0, spec:75.2,
       note:'Foa et al. 2002, Table 9 — optimal total-score cut-off separating OCD from ANXIOUS controls, i.e. when the question is OCD versus another anxiety disorder (sensitivity 74.0%, specificity 75.2%). The authors advise using this one with caution.'}
    ],
    subCutoffs:{ obsessing:[
      {score:4, recommended:true, contrast:'nonanxious controls', sens:74.4, spec:76.1,
       note:'Foa et al. 2002, Table 9: the Obsessing subscale separated OCD from nonanxious controls BETTER than the total score did (AUC .81 vs .70): sensitivity 74.4%, specificity 76.1%.'},
      {score:5, contrast:'anxious controls', sens:68.8, spec:72.7,
       note:'Foa et al. 2002, Table 9 — Obsessing cut-off versus anxious controls (sensitivity 68.8%, specificity 72.7%).'}
    ]},
    items:[
    {n:1, text:'I have saved up so many things that they get in the way.', subscale:'hoarding', optionSet:'distress'},
    {n:2, text:'I check things more often than necessary.', subscale:'checking', optionSet:'distress'},
    {n:3, text:'I get upset if objects are not arranged properly.', subscale:'ordering', optionSet:'distress'},
    {n:4, text:'I feel compelled to count while I am doing things.', subscale:'neutralizing', optionSet:'distress'},
    {n:5, text:'I find it difficult to touch an object when I know it has been touched by strangers or certain people.', subscale:'washing', optionSet:'distress'},
    {n:6, text:'I find it difficult to control my own thoughts.', subscale:'obsessing', optionSet:'distress'},
    {n:7, text:"I collect things I don't need.", subscale:'hoarding', optionSet:'distress'},
    {n:8, text:'I repeatedly check doors, windows, drawers, etc.', subscale:'checking', optionSet:'distress'},
    {n:9, text:'I get upset if others change the way I have arranged things.', subscale:'ordering', optionSet:'distress'},
    {n:10, text:'I feel I have to repeat certain numbers.', subscale:'neutralizing', optionSet:'distress'},
    {n:11, text:'I sometimes have to wash or clean myself simply because I feel contaminated.', subscale:'washing', optionSet:'distress'},
    {n:12, text:'I am upset by unpleasant thoughts that come into my mind against my will.', subscale:'obsessing', optionSet:'distress'},
    {n:13, text:'I avoid throwing things away because I am afraid I might need them later.', subscale:'hoarding', optionSet:'distress'},
    {n:14, text:'I repeatedly check gas and water taps and light switches after turning them off.', subscale:'checking', optionSet:'distress'},
    {n:15, text:'I need things to be arranged in a particular order.', subscale:'ordering', optionSet:'distress'},
    {n:16, text:'I feel that there are good and bad numbers.', subscale:'neutralizing', optionSet:'distress'},
    {n:17, text:'I wash my hands more often and longer than necessary.', subscale:'washing', optionSet:'distress'},
    {n:18, text:'I frequently get nasty thoughts and have difficulty in getting rid of them.', subscale:'obsessing', optionSet:'distress'}
    ],
    instructions:'The following statements refer to experiences that many people have in their everyday lives. Choose the response that best describes how much that experience has DISTRESSED or BOTHERED you during the PAST MONTH.'
  }});
})();

/* ── OCI-CV-R — Obsessive-Compulsive Inventory, Child Version, Revised ────────
   18 self-report items for 6-17s, each rated on the FREQUENCY of the experience
   in the last month (never 0 / sometimes 1 / always 2), summed to a 0-36 total
   and five subscales. Chosen over the original 21-item OCI-CV because DSM-5
   moved hoarding out of OCD and this revision drops those items; its authors
   state it should replace the OCI-CV, and unlike Foa et al. (2010) it carries a
   cut-off derived in the same paper.

   NOT PARALLEL TO THE ADULT OCI-R, in five ways that all matter clinically. Do
   not "harmonise" any of them:
     1. Rates FREQUENCY over the last month, not DISTRESS. Three points, not five.
     2. Five subscales, not six, and they are UNEQUAL in length (5/4/3/3/3), so
        subscale sums are NOT comparable with each other the way the OCI-R's
        deliberately-equalised three-item subscales are.
     3. Different cut-offs from a different ROC, on a different scale range.
     4. NO PERCENTILES. Foa et al. (2002) state their two adult samples were
        normally distributed, which is what licenses percentiles on the OCI-R.
        This paper makes no such claim and its samples are plainly floor-bound
        and right-skewed (nonclinical washing: mean 0.37, SD 0.79, median 0,
        IQR 0; nonclinical total: mean 3.27 vs median 2). Distance is given in
        SDs against published medians and IQRs instead.
     5. Every subscale here separated the diagnostic groups, so there is no
        equivalent of the OCI-R's backwards Hoarding scale; and the TOTAL beat
        every subscale on AUC, the reverse of the adult form, so no subscale
        cut-off is offered. */
(function(){
  const FREQ = [
    {label:'Never',     v:0},
    {label:'Sometimes', v:1},
    {label:'Always',    v:2}
  ];

  /* Membership is the Appendix's own "Administration & Scoring" page, verbatim.
     Named as Tables 2 and 5 name them ("Doubting/Checking"); the scoring page
     writes the same scale "Checking/Doubting". Same five items either way. */
  const SUBSCALES = {
    doubting_checking: {name:'Doubting / Checking', items:[3,4,11,13,17]},
    obsessing:         {name:'Obsessing',           items:[1,9,12,15]},
    washing:           {name:'Washing',             items:[2,8,18]},
    ordering:          {name:'Ordering',            items:[6,14,16]},
    neutralizing:      {name:'Neutralizing',        items:[5,7,10]}
  };

  /* Table 5 (norms) as printed, including the medians and IQRs — which are the
     point here, since these distributions are skewed and the means alone would
     mislead. NCC = non-clinical controls, CC = clinical controls (youth with
     other anxiety/developmental diagnoses, excluding OCD and autism). */
  const GROUPS = [
    /* `dist` is the sample's OWN cumulative distribution: dist[k] is the
       proportion of that group who scored k or lower. Recovered from the
       supplementary ROC tables, where specificity at threshold X.5 IS
       P(score <= X) in a control group and 1 - sensitivity is the same in the
       case group. Nothing is modelled and no normality is assumed; the scores
       the tables skip (nobody scored them) are forward-filled.

       Stored as PROPORTIONS, not counts: the source rounds to three decimals,
       so the implied counts miss whole numbers by up to half a person and sum
       to 258 rather than 260. Never render "n of 260" off these.

       scripts/sweep_oci.cjs asserts each array is monotone, ends at 1,
       reproduces its group's own published mean, SD, median and IQR (which is
       what proves the recovery is real, since those four are separately printed
       in the paper and separately checked by diff_ocicvr.py), and that every
       figure rendered on the page equals the array it came from. */
    { key:'ncc', label:'Non-clinical', fullLabel:'Non-clinical controls', n:260,
      mean:3.27, sd:3.64, median:2, iqr:5,
      dist:[0.307,0.455,0.529,0.626,0.704,0.763,0.837,0.864,0.899,0.918,0.942,0.965,0.973,0.977,0.984,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      subs:{ doubting_checking:{mean:1.00, sd:1.32, median:0, iqr:2}, obsessing:{mean:0.71, sd:1.27, median:0, iqr:1},
             washing:{mean:0.37, sd:0.79, median:0, iqr:0}, ordering:{mean:0.96, sd:1.29, median:0, iqr:2},
             neutralizing:{mean:0.21, sd:0.51, median:0, iqr:0} } },
    { key:'cc', label:'Clinical (other)', fullLabel:'Clinical controls (other diagnoses)', n:298,
      mean:6.29, sd:5.59, median:5, iqr:8,
      dist:[0.123,0.226,0.288,0.37,0.476,0.555,0.63,0.668,0.695,0.747,0.781,0.815,0.853,0.877,0.908,0.925,0.949,0.955,0.966,0.973,0.973,0.983,0.986,0.99,0.993,0.997,0.997,0.997,1,1,1,1,1,1,1,1,1],
      subs:{ doubting_checking:{mean:1.78, sd:1.94, median:1, iqr:3}, obsessing:{mean:1.88, sd:2.05, median:1, iqr:3},
             washing:{mean:0.56, sd:0.93, median:0, iqr:1}, ordering:{mean:1.60, sd:1.76, median:1, iqr:3},
             neutralizing:{mean:0.52, sd:1.06, median:0, iqr:1} } },
    { key:'ocd', label:'OCD', fullLabel:'Youth with OCD', n:489,
      mean:13.62, sd:7.19, median:13, iqr:11,
      dist:[0.016,0.033,0.047,0.071,0.096,0.134,0.176,0.218,0.272,0.321,0.356,0.414,0.474,0.526,0.577,0.617,0.664,0.706,0.737,0.766,0.802,0.851,0.875,0.909,0.927,0.947,0.958,0.969,0.976,0.98,0.989,0.989,0.993,0.998,1,1,1],
      subs:{ doubting_checking:{mean:3.63, sd:2.73, median:3, iqr:4}, obsessing:{mean:3.54, sd:2.36, median:3, iqr:3},
             washing:{mean:2.51, sd:2.23, median:2, iqr:4.25}, ordering:{mean:2.48, sd:1.88, median:2, iqr:2.50},
             neutralizing:{mean:1.49, sd:1.54, median:1, iqr:2} } }
  ];

  /* Table 2: the OCD sample split at age 12. Shown as context for a child's own
     age band, never as a cut-off. See the verified note for the discrepancy
     between this table and the Appendix's scoring page. */
  const AGE_NORMS = { source:'Table 2 (p.22)', split:12,
    younger:{ label:'OCD, under 12', n:186, mean:11.27, sd:6.03 },
    older:  { label:'OCD, 12 and over', n:288, mean:15.01, sd:7.30 } };

  Object.assign(REGISTRY, {"oci_cv_r":{
    id:'oci_cv_r', name:'OCI-CV-R', formLabel:'Child self-report',
    fullName:'Obsessive-Compulsive Inventory, Child Version – Revised (OCI-CV-R)',
    category:'ocd', status:'live',
    respondent:'Self-report (child / young person)', ageRange:'6–17 years', estMinutes:'3–5 min',
    description:'Eighteen-item self-report screen for obsessive-compulsive symptoms in children and young people, rating how often each experience has happened in the last month. Total 0–36 with a published cut-off. Hoarding items removed, following DSM-5.',
    citation:'Abramovitch A, Abramowitz JS, McKay D, Cham H, Anderson KS, Farrell L, Geller DA, Hanna GL, Mathieu S, McGuire JF, Rosenberg DR, Stewart SE, Storch EA & Wilhelm S (2022). The OCI-CV-R: A Revision of the Obsessive-Compulsive Inventory – Child Version. Journal of Anxiety Disorders 86:102532.',
    licence:'Scale derived from the original OCI-CV (Foa et al., 2010) and published in the Journal of Anxiety Disorders (Elsevier). NO explicit grant of permission to reproduce or web-publish the scale could be located. The copy used here is the NIHPA author manuscript (nihms-1776782) deposited in PubMed Central under the NIH Public Access Policy: that policy makes the ARTICLE free to read, and grants no redistribution right over the INSTRUMENT printed in its Appendix. INCLUDED in the publicly hosted build by Ryan’s explicit decision (2026-08-04), the same documented risk acceptance recorded for the adult OCI-R, not a located licence. Reverse it by removing oci_cv_r from ALLOW in build.py.',
    higherMeans:'more frequent obsessive-compulsive symptoms',
    verified:{ date:'2026-08-04', note:'All 18 items GENERATED from the Appendix (manuscript p.11) of nihms-1776782.pdf rather than retyped, then machine-diffed back against that page: 18/18 exact, ZERO corrections needed (the source already uses ASCII apostrophes and UK-compatible spelling). The printed "Example: I think a lot about dogs" line is deliberately excluded, being an instruction rather than an item. The five subscale allocations (Doubting/Checking 3,4,11,13,17; Obsessing 1,9,12,15; Washing 2,8,18; Ordering 6,14,16; Neutralizing 5,7,10) are copied from the Appendix’s own Administration & Scoring page and cover all 18 items exactly once; the paper names the first scale "Doubting/Checking" in Tables 2 and 5 but "Checking/Doubting" on the scoring page, and the table form is used. Response set (never 0 / sometimes 1 / always 2), the FREQUENCY framing, the last-month window and the 0–36 range are the Appendix’s own; there are no reverse-scored items. Cut-offs are the Results section: 6 or higher vs non-clinical controls (sensitivity 86%, specificity 76%, overall accuracy 83%, DOR 20.8) and 8 or higher vs clinical controls (73%/70%, DOR 7.2). NO subscale cut-off is offered because the TOTAL had the highest AUC against both comparison groups (.90 and .79), beating every subscale — the OPPOSITE of the adult OCI-R, where the Obsessing subscale beat the total. Norms are Table 5 (p.25) as printed, all three samples, all five subscales plus total, with the medians and IQRs. DELIBERATE DEPARTURE, and the most important one: NO PERCENTILES are shown. Foa et al. (2002) explicitly state their adult samples were normally distributed, which is what licenses the adult form’s percentiles; this paper makes no such claim, and its distributions are visibly floor-bound and right-skewed (non-clinical washing mean 0.37, SD 0.79, median 0, IQR 0). Distance is reported in SDs against the published medians instead, per the suite rule that colour and position need a defensible distribution. DISCREPANCY RECORDED: the age-split norms disagree between the paper’s own two statements. Table 2 (p.22) gives under-12 M 11.27 SD 6.03 (n=186) and 12-plus M 15.01 SD 7.30 (n=288); the Appendix scoring page (p.12) gives 11.41 SD 6.33 and 15.08 SD 7.37 for the same split. TABLE 2 IS USED, because it is the analysis table, it carries the t, p and Cohen’s d, and its figures reproduce the reported d of 0.55 on recomputation, whereas the Appendix figures are a user-facing restatement. Both samples’ overall OCD mean (13.62, SD 7.19) agrees between the Appendix and Table 5, so only the age split is affected. Re-checkable with scripts/diff_ocicvr.py. Internal consistency, the CFA and invariance testing, and the AUC confidence intervals are cited but not re-derived here. ── SUPPLEMENTARY TABLES S1 AND S2 CHECKED 2026-08-05 (Ryan supplied the full sensitivity / specificity / Youden tables, which the manuscript itself does not reproduce). THE RECOMMENDED CUT-OFF OF 6 IS CORROBORATED ON EVERY FIGURE: it is row 5.5 of Table S1 (sensitivity .866, specificity .763), which reproduces the paper\'s 86% and 76%, its 83% overall classification accuracy (exact, on 489 OCD + 260 NCC), its NLR of 0.18 and its DOR of 20.8. Nothing about the app\'s verdict changes. That reconciliation also FIXES THE TABLES\' CONVENTION: the row labels are ROC midpoints ("positive if at or above this threshold"), not scores. The proof is in the rows that are NOT half-integers — 31 is the midpoint of the observed 30 and 32, and 35 of 34 and 36 (sensitivity .000 there, so 34 was the highest score anyone reached). So row 5.5 IS "6 or higher", exactly as the paper describes it. THE SECONDARY CUT-OFF OF 8 DOES NOT RECONCILE, and the paper contradicts itself across three statements about it. Under that same convention "8 or higher" is row 7.5 (sensitivity .782, specificity .668), and row 7.5 is what the paper\'s own derived statistics reproduce: PLR 2.34 (row gives 2.36), NLR 0.33 (0.326) and DOR 7.2 (7.22), all three. But the sensitivity and specificity the paper prints in that sentence, 73% and 70%, are row 8.5 — which under the same convention is "9 or higher", a cut-off nobody claims. So the paragraph mixes two adjacent rows, and its stated cut-off, its stated sensitivity/specificity and its stated odds ratio cannot all be true at once. REVISED 2026-10-02 (Ryan, after checking the publisher supplement): the app now carries 78.2% / 66.8% from Table S2 row 7.5, the figures that reproduce the paper\'s PLR, NLR and DOR. Earlier decision, now superseded: DECIDED 2026-08-05 (Ryan, option B of three offered): KEEP THE PRINTED 73% / 70% and drop the diagnostic odds ratio, rather than substitute the arithmetically implied 78% / 67%. So the app now prints two numbers that are certainly in the paper and no third number that contradicts them. This is the OPPOSITE call from the adult form\'s 63.9 / 63.4 correction, and deliberately so: there the paper printed the raw counts (141 of 215, 305 of 477) that settled the question against the table, whereas here the only corroboration is derived ratios, and the whole-count test that decided the adult case is UNUSABLE on this one — only 19 of the 33 published sensitivities map onto a whole number of the stated 489 OCD participants, so the analysis denominators are evidently not the stated group sizes, and .782 maps to no whole count while .728 does. NOT ACTED ON, recorded as an observation only: the Youden index peaks at row 6.5 in BOTH supplementary tables (.661 vs non-clinical, .454 vs clinical controls), so a cut-off of 7 is the statistical optimum against either comparison group. The paper chose 6 and 8 on a stated best-balance criterion and the app follows the paper rather than re-deriving its own thresholds. A published erratum reopens all of this.' },
    report:{ caveat:'The OCI-CV-R screens for obsessive-compulsive symptoms in young people and is not diagnostic. It rates how OFTEN symptoms happen, not how distressing or impairing they are, so a child with frequent mild symptoms can outscore one with rarer but disabling ones. The cut-off of 6 is set against children with no psychiatric diagnosis; against children who have another anxiety or developmental diagnosis the appropriate threshold is 8, and even then it misclassifies roughly three in ten. Confirm a positive screen against DSM-5-TR or ICD-11 criteria, ideally with the CY-BOCS. Hoarding is deliberately not assessed: it is a separate disorder in DSM-5 and the hoarding items were removed in this revision.' },
    scoring:{
      type:'oci', itemMax:2, totalMax:36, cutoff:6, cutoffAc:8, endorseAt:2,
      optionSets:{ freq:FREQ }
    },
    subscales:SUBSCALES,
    compareGroups:GROUPS,
    ageNorms:AGE_NORMS,
    /* suppresses percentiles across the results page: see the verified note */
    normsNonNormal:true,
    /* every subscale separated the groups here (all ps < .001 vs OCD, < .05
       CC vs NCC), unlike the adult form's Hoarding and Ordering */
    subscaleNonDiscriminating:[],
    norm:{ label:'non-clinical controls', group:'non-clinical controls', n:260, mean:3.27, sd:3.64, median:2 },
    cutoffs:[
      {score:6, recommended:true, contrast:'non-clinical controls', sens:86, spec:76,
       note:'Abramovitch et al. 2022, Results: the total cut-off with the best balance of sensitivity (86%) and specificity (76%) separating youth with OCD from children with no psychiatric diagnosis; overall classification accuracy 83%, diagnostic odds ratio 20.8. This is the cut-off the paper recommends.'},
      {score:8, contrast:'youth with other diagnoses', sens:78.2, spec:66.8,
       note:'Abramovitch et al. 2022: the total cut-off with the best balance separating youth with OCD from youth carrying OTHER psychiatric diagnoses. Sensitivity 78.2% and specificity 66.8% are supplementary Table S2, row 7.5 (8 or higher); these reproduce the paper\'s own likelihood ratios and diagnostic odds ratio (7.2). The Results text prints 73% and 70%, which are the next row (9 or higher). Use this one when the differential is OCD versus another anxiety or developmental condition rather than OCD versus nothing.'}
    ],
    items:[
    {n:1, text:"I think about bad things and can't stop.", subscale:'obsessing', optionSet:'freq'},
    {n:2, text:'I feel like I must wash and clean over and over again.', subscale:'washing', optionSet:'freq'},
    {n:3, text:'I check many things over and over again.', subscale:'doubting_checking', optionSet:'freq'},
    {n:4, text:"After I have done things, I'm not sure if I really did them.", subscale:'doubting_checking', optionSet:'freq'},
    {n:5, text:'I need to count while I do things.', subscale:'neutralizing', optionSet:'freq'},
    {n:6, text:'I get upset if my stuff is not in the right order.', subscale:'ordering', optionSet:'freq'},
    {n:7, text:'I get behind in my schoolwork because I repeat things over and over again.', subscale:'neutralizing', optionSet:'freq'},
    {n:8, text:'I worry a lot about things being clean.', subscale:'washing', optionSet:'freq'},
    {n:9, text:"I'm upset by bad thoughts.", subscale:'obsessing', optionSet:'freq'},
    {n:10, text:'I have to say some numbers over and over.', subscale:'neutralizing', optionSet:'freq'},
    {n:11, text:"Even after I'm done, I still worry that I didn't finish things.", subscale:'doubting_checking', optionSet:'freq'},
    {n:12, text:"I get upset by bad thoughts that pop into my head when I don't want them to.", subscale:'obsessing', optionSet:'freq'},
    {n:13, text:'I check doors, windows, and drawers over and over again.', subscale:'doubting_checking', optionSet:'freq'},
    {n:14, text:'I get upset if people change the way I arrange things.', subscale:'ordering', optionSet:'freq'},
    {n:15, text:'If a bad thought comes into my head, I need to say certain things over and over.', subscale:'obsessing', optionSet:'freq'},
    {n:16, text:'I need things to be in a certain way.', subscale:'ordering', optionSet:'freq'},
    {n:17, text:"Even when I do something very carefully, I don't think I did it right.", subscale:'doubting_checking', optionSet:'freq'},
    {n:18, text:'I wash my hands more than other kids.', subscale:'washing', optionSet:'freq'}
    ],
    instructions:'Read each sentence carefully and tell us how much it has happened to you in the last month. If it never happens to you, choose "Never". If it sometimes happens to you, choose "Sometimes". If it happens to you almost always, choose "Always". This is not a test, so there are no right and wrong answers.'
  }});
})();

/* ── ASRS-O — Adult ADHD Symptom Rating Scale, Observer version ───────────────
   The observer/informant twin of the self-report `asrs`: the SAME 18 WHO items
   and Part-A 6-item screener, but completed by a partner, relative or close
   friend rating the adult over the past 6 months. Reuses the `asrs` scorer
   (item numbers, Part A thresholds, subscales, checklist total are identical)
   and the resultsASRS builder (which gracefully omits the community-norm panels
   when adlerNorms/itemNorms are absent — those are SELF-report norms and don't
   apply here; observer norms/cutoffs to be added when supplied). */
Object.assign(REGISTRY, {"asrs_observer":{
  id:'asrs_observer',
  name:'ASRS-O',
  formLabel:'Observer',
  fullName:'Adult ADHD Symptom Rating Scale: Observer version (ASRS-O)',
  category:'adhd', status:'live',
  respondent:'Informant / observer report',
  informantKind:'observer',
  informantHelp:'An adult ADHD rating scale, best completed by someone who knows {subject} well now — a partner, close relative, or friend — rating them over the past 6 months.',
  ageRange:'rates an adult 18+', estMinutes:'5–7 min',
  description:'Observer-rated version of the WHO adult ADHD symptom scale. Part A is the 6-item screener; Part B adds 12 symptom items. Completed by a partner, relative or close friend.',
  citation:'Kessler RC et al. (2005). The World Health Organization Adult ADHD Self-Report Scale (ASRS). Psychological Medicine 35:245–256. Observer version, © World Health Organization 2005.',
  licence:'© World Health Organization 2005. Free for clinical use; reproduction/translation requests are directed to Prof. R. Kessler, Harvard Medical School. Confirm digital-use terms before public hosting.',
  higherMeans:'more frequent adult ADHD symptoms (as observed)',
  scoring:{ type:'asrs', options:ASRS_OPTIONS,
    partA:[1,2,3,4,5,6],
    partAThresholds:{1:2,2:2,3:2,4:3,5:3,6:3},
    partAPositive:4,
    symptomThreshold:3,
    checklistSometimesItems:[1,2,3,9,12,16,18],
    totalMax:72 },
  subscales:{
    inattention:{name:'Inattention', items:[1,2,3,4,7,8,9,10,11]},
    hyperimpulsive:{name:'Hyperactivity / Impulsivity', items:[5,6,12,13,14,15,16,17,18]}
  },
  items:[
    {n:1,  part:'A', subscale:'inattention',    text:'How often does this person have trouble wrapping up the final details of a project, once the challenging parts have been done?'},
    {n:2,  part:'A', subscale:'inattention',    text:'How often does this person have difficulty getting things in order when they have to do a task that requires organization?'},
    {n:3,  part:'A', subscale:'inattention',    text:'How often does this person have problems remembering appointments or obligations?'},
    {n:4,  part:'A', subscale:'inattention',    text:'When this person has a task that requires a lot of thought, how often do they avoid or delay getting started?'},
    {n:5,  part:'A', subscale:'hyperimpulsive', text:'How often does this person fidget or squirm with their hands or feet when they have to sit down for a long time?'},
    {n:6,  part:'A', subscale:'hyperimpulsive', text:'How often does this person seem overly active and compelled to do things, as if they were driven by a motor?'},
    {n:7,  part:'B', subscale:'inattention',    text:'How often does this person make careless mistakes when they have to work on a boring or difficult project?'},
    {n:8,  part:'B', subscale:'inattention',    text:'How often does this person have difficulty keeping their attention when they are doing boring or repetitive work?'},
    {n:9,  part:'B', subscale:'inattention',    text:'How often does this person have difficulty concentrating on what people are saying, even when they are speaking to the person directly?'},
    {n:10, part:'B', subscale:'inattention',    text:'How often does this person misplace or have difficulty finding things at home or at work?'},
    {n:11, part:'B', subscale:'inattention',    text:'How often is this person distracted by activity or noise around them?'},
    {n:12, part:'B', subscale:'hyperimpulsive', text:'How often does this person leave their seat in meetings or other situations in which they are expected to remain seated?'},
    {n:13, part:'B', subscale:'hyperimpulsive', text:'How often does this person appear restless or fidgety?'},
    {n:14, part:'B', subscale:'hyperimpulsive', text:'How often does this person have difficulty unwinding and relaxing when they have time to themselves?'},
    {n:15, part:'B', subscale:'hyperimpulsive', text:'How often does this person talk too much when in social situations?'},
    {n:16, part:'B', subscale:'hyperimpulsive', text:'When this person is in a conversation, how often do they finish the sentences of the people they are talking to, before they can finish them themselves?'},
    {n:17, part:'B', subscale:'hyperimpulsive', text:'How often does this person have difficulty waiting their turn in situations when turn taking is required?'},
    {n:18, part:'B', subscale:'hyperimpulsive', text:'How often does this person interrupt others?'}
  ],
  screener:{partA:6, positive:4, sensitivity:0.687, specificity:0.995, source:'Kessler et al. (2005), self-report screener characteristics; not validated for observer report.'},
  borrowedCutoff:{from:'ASRS v1.1 self-report, Kessler et al. 2005', cutoff:'the Part A screen, 4 or more of the 6 Part A items in the shaded range'},
  report:{caveat:'Observer-rated screen: flags an adult whose symptoms warrant fuller assessment; it cannot confirm or exclude ADHD on its own. Community norms shown for the self-report ASRS are omitted here; read the Part A screen and symptom profile alongside the self-report and the wider picture.'}
}});

/* ── WURS-25 — Wender Utah Rating Scale (short form) ──────────────────────────
   Retrospective childhood-ADHD screen: the 25 items of the original 61-item
   WURS most associated with ADHD. Each 0–4 (Not at all/very slightly → Very
   much); the 25-item sum (0–100) is the score. Ward, Wender & Reimherr (1993)
   report a CUT-OFF of 46 correctly classifying 86% of ADHD patients and 99% of
   controls. Self-report + observer versions share the same items and cut-off;
   the observer rates the adult's CHILDHOOD (informantKind 'childhood'). All
   items share one 0–4 response set → standard `likert` scoring (summed total).
   Verdict → resultsWURS. */
const WURS_OPTIONS = [
  {label:'Not at all or very slightly', base:0},
  {label:'Mildly',      base:1},
  {label:'Moderately',  base:2},
  {label:'Quite a bit', base:3},
  {label:'Very much',   base:4}
];
/* the 25 ADHD-associated items. `s` = self wording; `o` = observer wording where
   it differs (myself → themselves); `school` items carry the school-specific stem */
const WURS25_ITEMS = [
  {n:1,  s:'Concentration problems, easily distracted'},
  {n:2,  s:'Anxious, worrying'},
  {n:3,  s:'Nervous, fidgety'},
  {n:4,  s:'Inattentive, daydreaming'},
  {n:5,  s:'Hot- or short-tempered, low boiling point'},
  {n:6,  s:'Temper outbursts, tantrums'},
  {n:7,  s:'Trouble with stick-to-it-tiveness, not following through, failing to finish things started'},
  {n:8,  s:'Stubborn, strong-willed'},
  {n:9,  s:'Sad or blue, depressed, unhappy'},
  {n:10, s:'Disobedient with parents, rebellious, sassy'},
  {n:11, s:'Low opinion of myself', o:'Low opinion of themselves'},
  {n:12, s:'Irritable'},
  {n:13, s:'Moody, ups and downs'},
  {n:14, s:'Angry'},
  {n:15, s:'Acting without thinking, impulsive'},
  {n:16, s:'Tendency to be immature'},
  {n:17, s:'Guilty feelings, regretful'},
  {n:18, s:'Losing control of myself', o:'Losing control of themselves'},
  {n:19, s:'Tendency to be or act irrational'},
  {n:20, s:"Unpopular with other children, didn't keep friends for long, didn't get along with other children"},
  {n:21, s:"Trouble seeing things from someone else's point of view"},
  {n:22, s:"Trouble with authorities, trouble with school, visits to principal's office"},
  {n:23, s:'Overall a poor student, slow learner', school:true},
  {n:24, s:'Trouble with mathematics or numbers', school:true},
  {n:25, s:'Not achieving up to potential', school:true}
];
function _wursItems(observer){
  const school = observer ? 'As a child in school, this person was (or had)…' : 'As a child in school, I was (or had)…';
  return WURS25_ITEMS.map(it=>{
    const row = { n:it.n, text: observer ? (it.o || it.s) : it.s };
    if(it.school) row.prompt = school;
    return row;
  });
}
/* WURS-25 clinical-group norms (self-report), for the score-vs-groups panel.
   Gift, Reimherr, Marchant, Steans & Reimherr (2021), J Psychiatr Res 135:181–188.
   Three groups with sex-stratified means/SDs on the 0–100 WURS-25 total. */
const WURS_NORMS = {
  source:'Gift TE, Reimherr ML, Marchant BK, Steans TA, Reimherr FW (2021). Wender Utah Rating Scale: Psychometrics, clinical utility and implications regarding the elements of ADHD. Journal of Psychiatric Research 135:181–188.',
  scaleMax:100,
  groups:[
    {key:'adhd',    label:'ADHD',                  color:'var(--rose)',  n:137, all:{mean:51.5,sd:15.7}, male:{mean:51.7,sd:16.2}, female:{mean:51.0,sd:14.5}},
    {key:'mddgad',  label:'Depression / anxiety',  color:'var(--amber)', n:228, all:{mean:28.9,sd:16.4}, male:{mean:30.8,sd:15.1}, female:{mean:27.9,sd:16.9}},
    {key:'control', label:'Non-clinical controls', color:'var(--green)', n:120, all:{mean:14.5,sd:10.0}, male:{mean:16.5,sd:10.2}, female:{mean:12.5,sd:9.6}}
  ]
};
Object.assign(REGISTRY, {"wurs_self":{
  id:'wurs_self',
  name:'WURS-25',
  formLabel:'Self-report',
  fullName:'Wender Utah Rating Scale (25-item, self-report)',
  category:'adhd', status:'live',
  respondent:'Self-report', ageRange:'18+ years', estMinutes:'4–6 min',
  description:'Retrospective self-report of childhood ADHD traits: the 25 WURS items most associated with ADHD. Total 0–100; a score of 30 or more suggests childhood ADHD, and 46 or more better separates ADHD from depression or anxiety.',
  citation:'Ward MF, Wender PH, Reimherr FW (1993). The Wender Utah Rating Scale: an aid in the retrospective diagnosis of childhood Attention Deficit Hyperactivity Disorder. Am J Psychiatry 150:885–890.',
  higherMeans:'more childhood ADHD traits',
  verified:{ date:'2026-07-20', note:'25 items, the 0–4 response anchors and item stems, the Gift et al. (2021) clinical-group means/SDs, and both cut-offs checked against source. Verdict threshold set to 30 (Gift 2021, non-clinical vs ADHD; sens 91% spec 92%); the classic Ward et al. (1993) 46 threshold (ADHD vs clinical) is also shown. Observer form not yet verified.' },
  norms:WURS_NORMS,
  prompt:'As a child, I was (or had)…',
  report:{ caveat:'The WURS is a retrospective screen for CHILDHOOD ADHD, completed by an adult recalling their childhood; it is not diagnostic. A score of 30 or above is the primary screening cut-off (Gift et al. 2021); 46 or above is the higher threshold that better separates ADHD from depression or anxiety (Ward et al. 1993; Gift et al. 2021). Both are affected by current mood (depression can inflate scores), so interpret it alongside the wider assessment.' },
  scoring:{ type:'likert', options:WURS_OPTIONS, totalMax:100, cutoff:30 },
  subscales:{},
  items:_wursItems(false),
  cutoffs:[
    {score:30, recommended:true, sensitivity:0.91, specificity:0.92, note:'Gift et al. 2021: on the WURS-25, a total of 30 or above best separates non-clinical controls from ADHD (ROC AUC 0.974; logistic-regression sensitivity 91%, specificity 92%). Primary screening threshold.'},
    {score:46, note:'Ward et al. 1993 original cut-off (classified 86% of adults with ADHD, 99% of controls and 81% of adults with depression correctly; p.886). Against MDD/GAD, Gift et al. 2021 (Table 5) found sensitivity 62% and specificity 86% at this point. Per Gift et al. 2021 this higher threshold better separates ADHD from clinical controls (MDD/GAD); the full 61-item WURS separates those groups better still. Current mood can inflate the total.'}
  ]
}});
Object.assign(REGISTRY, {"wurs_observer":{
  id:'wurs_observer',
  name:'WURS-25 (observer)',
  formLabel:'Observer report',
  fullName:'Wender Utah Rating Scale (25-item, observer report)',
  category:'adhd', status:'live',
  respondent:'Informant / observer report',
  informantKind:'childhood',
  informantHelp:'A retrospective childhood-ADHD scale, best completed by a parent, older relative or someone who knew {subject} well as a child.',
  ageRange:'rates an adult 18+', estMinutes:'4–6 min',
  description:'Retrospective observer report of an adult’s CHILDHOOD ADHD traits — the 25 WURS items most associated with ADHD, completed by someone who knew them as a child. Total 0–100; the self-report thresholds are applied (no observer-specific norms exist).',
  citation:'Ward MF, Wender PH, Reimherr FW (1993). The Wender Utah Rating Scale: an aid in the retrospective diagnosis of childhood Attention Deficit Hyperactivity Disorder. Am J Psychiatry 150:885–890. Observer version.',
  higherMeans:'more childhood ADHD traits (as recalled by the observer)',
  verified:{ date:'2026-07-20', note:'Same 25 WURS-25 items (observer-worded), 0–4 anchors and Gift et al. (2021) clinical-group norms as the verified self-report form. Confirmed against the literature that the WURS-25 has NO separately validated observer version or observer-specific cut-off; the self-report thresholds (30 primary, 46 secondary) are applied to the informant report as corroborating history and interpreted cautiously.' },
  norms:WURS_NORMS,
  prompt:'As a child, this person was (or had)…',
  report:{ caveat:'A retrospective observer screen for the adult’s CHILDHOOD ADHD, completed by someone who knew them as a child; it is not diagnostic. The WURS-25 has no separately validated observer version or observer-specific norms, so the self-report thresholds are applied to the informant report as corroborating history and interpreted cautiously (30 primary; 46 the classic higher threshold). Read alongside the self-report, childhood records, and the wider assessment.' },
  scoring:{ type:'likert', options:WURS_OPTIONS, totalMax:100, cutoff:30 },
  borrowedCutoff:{from:'WURS-25 self-report, Gift et al. 2021 and Ward et al. 1993', cutoff:'a total of 30 (primary) and 46 (the classic higher threshold)'},
  subscales:{},
  items:_wursItems(true),
  cutoffs:[
    {score:30, recommended:true, sensitivity:0.91, specificity:0.92, note:'The WURS-25 has no observer-specific norms, so the self-report thresholds are applied to the informant report as corroborating history. Gift et al. (2021): 30+ best separates non-clinical controls from ADHD (AUC 0.974; sens 91%, spec 92%).'},
    {score:46, note:'Ward et al. (1993) original self-report cut-off (ADHD vs clinical controls); applied to the informant report and interpreted cautiously.'}
  ]
}});

/* ── RBQ-3 — Repetitive Behaviours Questionnaire-3 ────────────────────────────
   20-item quantitative measure of restricted and repetitive behaviours and
   interests (RRBIs) — motor behaviours, routines, sensory responses, focused
   interests and preference for sameness — rated over the LAST TWO WEEKS
   (Cardiff University v1.3; replaces the RBQ-2 / RBQ-2A). Administration Manual
   v1.3: about 10 minutes (p.2); self-report from age 13, informant version
   for all ages (p.11). Jones et al. 2024 administered it over the last month. Items score 1–4
   (item 20 has its own 3-option scale, 1–3) and carry four different response-
   label sets across the item ranges, so items use the per-item optionSet
   mechanism (like SCI/Vanderbilt) — the stored answer IS the item score.

   Scored as MEAN scores (1.00–4.00) per the manual: Mean Total over all 20
   items AND over Q1–19 (both reported; subscales use Q1–19 only, and Q20 is
   explored separately). Deliberately NO cut-off — the authors are explicit the
   RBQ is a quantitative measure for all populations, not a screening or
   diagnostic tool. Two-factor subscales use the version-appropriate published
   RBQ-2/2A solutions (there is no RBQ-3 factor analysis yet): self-report →
   Barrett et al. (2018, autistic adults); other-report → Lidstone, Uljarević
   et al. (2014, school-aged autistic + typically developing children).
   Scored by Scoring.rbq3; verdict → resultsRBQ3. */
(function(){
  const O = {
    freq:[
      {label:'Never or rarely', v:1},
      {label:'One or more times daily', v:2},
      {label:'15 or more times daily (or at least once an hour)', v:3},
      {label:'30 or more times daily (or at least twice an hour)', v:4}
    ],
    intensity:[
      {label:'Never or rarely', v:1},
      {label:'Mild or occasional', v:2},
      {label:'Marked or notable', v:3},
      {label:'Serious or extreme', v:4}
    ],
    affects:[
      {label:'Never or rarely', v:1},
      {label:'Mild or occasional (does not affect others)', v:2},
      {label:'Marked or notable (occasionally affects others)', v:3},
      {label:'Serious or severe (affects others on a regular basis)', v:4}
    ],
    change:[
      {label:'Never or rarely', v:1},
      {label:'Mild or occasional (not entirely resistant to change or new things)', v:2},
      {label:'Marked or notable (will tolerate changes when necessary)', v:3},
      {label:'Serious or severe (will not tolerate any changes)', v:4}
    ],
    activity:[
      {label:'A range of different and flexible self-chosen activities', v:1},
      {label:'Some varied and flexible interests but commonly chooses the same activities', v:2},
      {label:'Almost always chooses from a restricted range of repetitive activities', v:3}
    ]
  };
  /* Items 1–19 continue the "Do you / Does … the individual you know well"
     stem (per-item prompt so it does NOT render over Q20, which is a
     free-standing question with its own 3-option scale). Wording is exact per
     version (RBQ-3 v1.3 terms require the integrity of item wording, order and
     response scales to be maintained). */
  function items(self){
    const stem = self ? 'Do you:' : 'Does your child, relative or the individual you know well:';
    const p = {prompt:stem};
    return [
      Object.assign({n:1,  text:'Like to arrange items in rows or patterns?', optionSet:'freq'}, p),
      Object.assign({n:2,  text:'Repetitively fiddle with items? (e.g. spin, twiddle, bang, tap, twist, or flick anything repeatedly?)', optionSet:'freq'}, p),
      Object.assign({n:3,  text:self?'Spin yourself around and around?':'Spin themselves around and around?', optionSet:'freq'}, p),
      Object.assign({n:4,  text:'Rock backwards and forwards, or side to side, either when sitting or when standing?', optionSet:'freq'}, p),
      Object.assign({n:5,  text:'Pace or move around repetitively? (e.g. walk to and fro across a room, or around the same path outside?)', optionSet:'freq'}, p),
      Object.assign({n:6,  text:'Make repetitive hand and/or finger movements? (e.g. flap, wave, or flick hands or fingers repeatedly?)', optionSet:'freq'}, p),
      Object.assign({n:7,  text:'Have a fascination with specific objects? (e.g. trains, road signs or other things?)', optionSet:'intensity'}, p),
      Object.assign({n:8,  text:'Like to look at objects from particular or unusual angles?', optionSet:'intensity'}, p),
      Object.assign({n:9,  text:'Have a special interest in the smell of people or objects?', optionSet:'intensity'}, p),
      Object.assign({n:10, text:'Have a special interest in the feel of different surfaces?', optionSet:'intensity'}, p),
      Object.assign({n:11, text:self?'Have any special objects you like to carry around?':'Have any special objects he/she likes to carry around?', optionSet:'intensity'}, p),
      Object.assign({n:12, text:'Collect or hoard items of any sort?', optionSet:'intensity'}, p),
      Object.assign({n:13, text:'Insist on things at home remaining the same? (e.g. furniture staying in the same place, things being kept in certain places, or arranged in certain ways?)', optionSet:'affects'}, p),
      Object.assign({n:14, text:'Get upset about minor changes to objects? (e.g. flecks of dirt on clothes, minor scratches on objects?)', optionSet:'affects'}, p),
      Object.assign({n:15, text:'Insist that aspects of daily routine must remain the same?', optionSet:'affects'}, p),
      Object.assign({n:16, text:'Insist on doing things in a certain way or re-doing things until they are “just right”?', optionSet:'affects'}, p),
      Object.assign({n:17, text:'Play the same music, game or video, or read the same book repeatedly?', optionSet:'change'}, p),
      Object.assign({n:18, text:'Insist on wearing the same clothes or refuse to wear new clothes?', optionSet:'change'}, p),
      Object.assign({n:19, text:self?'Insist on eating the same foods, or a very small range of foods, at every meal?':'Insist on eating the same foods, or a very small range of foods, at every meal', optionSet:'change'}, p),
      {n:20, text:self?'What sort of activity will you choose if left to occupy yourself?':'What sort of activity will they choose if left to occupy themselves?', optionSet:'activity'}
    ];
  }
  const CAVEAT = 'The RBQ-3 is a quantitative measure of restricted and repetitive behaviours over the last two weeks; the authors are explicit that it has NO cut-off score and is not a screening or diagnostic tool. Use the pattern of mean scores to inform the clinical picture, alongside developmental history and observation. The two-week time frame is the official v1.3 form’s; the published reference values (Jones et al. 2024) came from ratings over the last month.';

  /* RBQ-3 adult reference values — Jones et al. (2024), the RBQ-3 validation
     paper. Study 2: online autistic (n=151, existing clinical diagnosis) vs
     non-autistic (n=151, screened: anyone suspecting autism or seeking a
     diagnosis was excluded, so a contrast group rather than a population
     norm) adults, self-report, matched on age/sex/cognitive ability.
     Study 1: adults referred to a specialist NHS adult autism diagnostic
     service (n=110; 89% met DSM-5 autism criteria on the DISCO-Abbreviated
     ALGORITHM — an algorithm figure, not a confirmed-diagnosis rate),
     self- AND informant-report — the informant means are the only
     informant-specific reference, so the other-report entry compares
     against those alone (informant ratings ran significantly LOWER than
     self-report, d≈0.5, so self-report bands must not be applied to
     informant scores). All values are MEAN scores on the 1–4 scale
     (total = 20 items; RSMB/IS = Barrett 2018 items from Q1–19).
     Medians/IQRs (Table 5) exist for the study 2 groups only; study 1
     publishes mean/SD alone. The SELF-report panel compares only against
     the study 2 diagnostic-contrast pair (non-autistic + autistic): that
     pair already answers the substantive question with a real effect size,
     whereas the study 1 referred sample is ~89% autism-positive by
     algorithm (neither a clean autism-positive nor a general-population
     anchor) and its higher mean is a referral/self-report-state artefact,
     so it added interpretive overhead without a distinct question. The
     study 1 referred sample is retained ONLY as the informant reference
     below, where it is the sole published informant norm.
     Deliberately NO normal-approximation percentiles are derived from
     these values: the RBQ-3 distributions failed Shapiro-Wilk normality in
     BOTH studies (skew, floor and ceiling effects; the non-autistic mean
     sits 1.4 SD above the scale floor, so an elevated client zs out at 4+
     against its SD of 0.25 — fake tail precision from n=151, which
     resolves nothing finer than ~1st/99th). `separation` carries the
     robust rank statement instead: the published Cohen's d (autistic vs
     non-autistic, study 2) with its common-language effect size
     Φ(d/√2) — the % of non-autistic adults a typical autistic adult
     outscores. That statistic sits in the body of the distribution where
     non-normality barely moves it, unlike client tail percentiles. */
  const SRC = 'Jones, C.R.G., Livingston, L.A., Fretwell, C., Uljarević, M., Carrington, S.J., Shah, P., & Leekam, S.R. (2024). Measuring self and informant perspectives of Restricted and Repetitive Behaviours (RRBs): psychometric evaluation of the Repetitive Behaviours Questionnaire-3 (RBQ-3) in adult clinical practice and research settings. Molecular Autism 15:24.';
  const NORMS_SELF = {
    source:SRC, scaleMin:1, scaleMax:4,
    separation:{ total:{d:2.07,cles:93}, rsm:{d:1.69,cles:88}, is:{d:1.97,cles:92} },
    groups:[
      {key:'nonautistic', label:'Non-autistic adults', short:'Non-autistic adults', color:'var(--green)', n:151,
        note:'screened online comparison group (study 2, Prolific; people who suspected they were autistic or were seeking a diagnosis were excluded), so a contrast group rather than a population norm.',
        measures:{ total:{mean:1.35,sd:0.25,median:1.30,iqr:0.35}, rsm:{mean:1.29,sd:0.33,median:1.17,iqr:0.33}, is:{mean:1.36,sd:0.30,median:1.27,iqr:0.45} }},
      {key:'autistic',    label:'Autistic adults', short:'Autistic adults', color:'var(--rose)',  n:151,
        note:'community adults with an existing clinical autism diagnosis (study 2, online), not the clinic population.',
        measures:{ total:{mean:2.18,sd:0.51,median:2.25,iqr:0.80}, rsm:{mean:2.07,sd:0.57,median:2.0,iqr:0.84}, is:{mean:2.28,sd:0.59,median:2.36,iqr:0.91} }}
    ]
  };
  const NORMS_INFORMANT = {
    source:SRC, scaleMin:1, scaleMax:4,
    groups:[
      {key:'clinic', label:'Informant reports on adults referred for autism assessment', short:'Referred adults (informant)', color:'var(--amber)', n:110,
        note:'informant ratings for the study 1 NHS clinic referrals (89% met DSM-5 autism criteria on the DISCO-Abbreviated algorithm); the only published informant reference for this version.',
        measures:{ total:{mean:2.32,sd:0.64}, rsm:{mean:2.05,sd:0.71}, is:{mean:2.52,sd:0.75} }}
    ]
  };
  const FACTORS = {
    rsm:{ name:'Repetitive sensory–motor behaviour', items:[2,3,4,5,6,10] },
    is:{ name:'Insistence on sameness', items:[1,7,11,12,13,14,15,16,17,18,19] }
  };
  const FACTOR_SOURCE = 'Barrett et al. (2018) two-factor solution (items 1–19), used for both versions in the RBQ-3 adult validation (Jones et al. 2024)';

  REGISTRY.rbq3_self = {
    id:'rbq3_self', name:'RBQ-3', formLabel:'Self-report', fullName:'Repetitive Behaviours Questionnaire-3 (self-report)',
    category:'autism', status:'live',
    respondent:'Self-report', ageRange:'13+ years', estMinutes:'about 10 min',
    description:'20-item quantitative measure of restricted and repetitive behaviours and interests over the last two weeks (motor, sensory, routines, sameness). Mean-scored 1–4; no cut-off — dimensional, not a screen.',
    citation:'Jones, C.R.G. et al. (2024). Psychometric evaluation of the RBQ-3 in adult clinical practice and research settings. Molecular Autism 15:24. Questionnaire: RBQ-3 v1.3 (2023), Cardiff University. Original items: Barrett et al. (2015), J Autism Dev Disord 45(11):3680–92.',
    higherMeans:'more restricted and repetitive behaviours',
    norms:NORMS_SELF,
    report:{ caveat:CAVEAT + ' Reference values are adult samples (Jones et al. 2024); the Study 2 autistic group’s diagnoses were self-reported.' },
    scoring:{
      type:'rbq3', scaleMax:4, totalMax:4, optionSets:O,
      factors:FACTORS,
      factorSource:FACTOR_SOURCE,
      factorExcluded:[8,9]
    },
    subscales:{},
    items:items(true)
  };

  REGISTRY.rbq3_other = {
    id:'rbq3_other', name:'RBQ-3 (other)', formLabel:'Other-report', fullName:'Repetitive Behaviours Questionnaire-3 (other-report)',
    category:'autism', status:'live',
    respondent:'Informant / observer report',
    informantKind:'observer',
    informantHelp:'A repetitive-behaviours questionnaire for someone who lives with {subject} or has seen their behaviour closely over the last two weeks (a parent, carer, relative or friend).',
    ageRange:'All ages (rated by an informant)', estMinutes:'about 10 min',
    description:'20-item informant-rated measure of an individual’s restricted and repetitive behaviours and interests over the last two weeks. Mean-scored 1–4; no cut-off — dimensional, not a screen.',
    citation:'Jones, C.R.G. et al. (2024). Psychometric evaluation of the RBQ-3 in adult clinical practice and research settings. Molecular Autism 15:24. Questionnaire: RBQ-3 v1.3 (2023), Cardiff University. Original items: Leekam et al. (2007), J Child Psychol Psychiatry 48(11):1131–1138.',
    higherMeans:'more restricted and repetitive behaviours (as rated by the informant)',
    norms:NORMS_INFORMANT,
    report:{ caveat:CAVEAT + ' Completed by an informant who has observed the individual closely in the previous two weeks. Informant ratings run systematically LOWER than self-report (Jones et al. 2024, d≈0.5), so compare against informant reference values, not self-report ones. For child other-reports note the reference values and factor solution are adult-derived.' },
    scoring:{
      type:'rbq3', scaleMax:4, totalMax:4, optionSets:O,
      factors:FACTORS,
      factorSource:FACTOR_SOURCE,
      factorExcluded:[8,9]
    },
    subscales:{},
    items:items(false)
  };
})();

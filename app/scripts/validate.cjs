/* Build-time gate: validate the registry/norms and exit non-zero on any error.
   Invoked by build.py before bundling, and runnable directly:  node scripts/validate.cjs
   Pure read-only — never modifies anything. */
const fs = require('fs'), path = require('path');
const E = path.join(__dirname, '..', 'assessment_suite', 'engine');
const rd = f => fs.readFileSync(path.join(E, f), 'utf8');

eval(
  rd('scoring.js') + '\n' + rd('screener_norms.js') + '\n' + rd('sdq_norms.js') + '\n' +
  rd('registry.js') + '\n' + rd('validate.js') +
  '\n;globalThis.__V = validateRegistry;' +
  'globalThis.__R = REGISTRY;' +
  'globalThis.__S = Scoring;' +
  'globalThis.__PHQ = typeof PHQ9_NORMS!=="undefined"?PHQ9_NORMS:null;' +
  'globalThis.__GAD = typeof GAD7_NORMS!=="undefined"?GAD7_NORMS:null;' +
  'globalThis.__SDQ = typeof SDQ_PERCENTILES!=="undefined"?SDQ_PERCENTILES:null;'
);

const res = globalThis.__V(globalThis.__R, {
  PHQ9_NORMS: globalThis.__PHQ, GAD7_NORMS: globalThis.__GAD, SDQ_PERCENTILES: globalThis.__SDQ,
  scoringTypes: Object.keys(globalThis.__S).filter(k => typeof globalThis.__S[k] === 'function' && k !== 'run')
});

const n = Object.keys(globalThis.__R).length;
const line = x => '  ['+x.id+'] '+x.rule+': '+x.msg;
if(res.warnings.length){ console.log('\nWARNINGS ('+res.warnings.length+'):'); res.warnings.forEach(w=>console.log(line(w))); }
if(res.errors.length){   console.log('\nERRORS ('+res.errors.length+'):');   res.errors.forEach(e=>console.log(line(e))); }

if(res.errors.length){
  console.log('\n✗ validateRegistry: '+res.errors.length+' error(s) across '+n+' instruments — build should NOT proceed.');
  process.exit(1);
}
console.log('\n✓ validateRegistry: '+n+' instruments passed'+(res.warnings.length?(' ('+res.warnings.length+' warning(s))'):'')+'.');
process.exit(0);

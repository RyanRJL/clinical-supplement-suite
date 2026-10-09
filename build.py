#!/usr/bin/env python3
"""
build.py: builds the Clinical Supplement Suite (tools.neurominds.uk).

Usage:
    py build.py                    build public/index.html from the copies in app/
    py build.py --sync             refresh app/ from the app's HEAD commit, then build
    py build.py --sync --ref <c>   the same, from app commit or branch <c>

Output:
    public/index.html   (committed; Cloudflare Pages serves public/ as-is, no build step)

The instrument engine (registry, scoring, norms, results, runner) belongs to the
Neurominds assessment app, which stays the single source of truth. This repo keeps
a copy of the files the build needs in app/, laid out as in the app repo, so the
tool builds on its own and the exact source of what is live sits beside it. The
copy is never edited here: --sync replaces it wholesale from a commit of the app,
so a fix made in the app reaches this tool on the next sync.

Sync reads committed files only (git show <commit>:<path>), so the app's working
tree, uncommitted work included, is never touched or picked up, and nothing is
ever written to the app repo.

This repo is public, so the copy is stripped of copyright-excluded content BEFORE
it is written (see ALLOW and the strip steps below), and the _FORBIDDEN leak check
runs on the copy as well as on the built page.

Where the app lives: ../assessment_suite_project by default, or set
SUPPLEMENT_APP_DIR to point elsewhere.
"""

import os, re, base64, csv, io, json, mimetypes, shutil, subprocess, sys, tempfile
from pathlib import Path

try:
    sys.stdout.reconfigure(errors="replace")   # the validator prints ticks; a cp1252 console cannot
except AttributeError:
    pass

HERE = Path(__file__).parent
VENDOR = HERE / 'app'                       # the copy of the app's files
SRC = VENDOR / 'assessment_suite'
OUT = HERE / 'public' / 'index.html'
SOURCE_NOTE = VENDOR / 'SOURCE.txt'


# ── Copyright filter ─────────────────────────────────────────────────────────────
# A publicly hosted clinician tool, so the library is filtered to a copyright-clean
# ALLOW list at boot, and the licensed clinician interview modules (DIVA/DASI/
# ADI-R/ADOS) are never copied. Excluded on purpose: baars_self/baars_informant
# (proprietary, Guilford), diva, young_diva, dasi, adir, adirw, ados_m4 (licensed/
# training-gated), rcads x4 (permission covers the clinic EHR only), iesr and the
# Y-BOCS family (rights holders forbid web posting outright, see the strip step
# below). To change the visible set, edit ALLOW below, then run --sync.
#
# ALLOW hides a card; it does NOT remove its item text from the file. Anything
# excluded for COPYRIGHT (rather than for licence-gating or training) must also be
# stripped below. Keep the two lists in step when adding an instrument.
ALLOW = [
    # autism / social
    'aq_adult', 'aq_adolescent', 'aq_child', 'rmet', 'cati', 'catq', 'gsq', 'sqa2', 'coventry',
    'rbq3_self', 'rbq3_other',
    # sensory (gsq_p: offered free by the authors, Smees et al. 2022, CC-BY)
    'gsq_p', 'rgsq_p', 'spq', 'spq35',
    # adhd
    'asrs', 'asrs_adolescent', 'asrs_observer', 'vand_parent', 'vand_teacher',
    'snap_parent', 'snap_teacher', 'wfirs_s', 'wfirs_p', 'wurs_self', 'wurs_observer',
    # mood / anxiety / other
    'phq9', 'gad7', 'lsas', 'assist', 'sad_child',
    # ocd. The Y-BOCS family is stripped outright (rights holder forbids web
    # posting), so the OCI pair is this build's only OCD coverage.
    # NOTE both are a documented RISK ACCEPTANCE, not a located licence. The
    # OCI-R is © Edna B. Foa 2002; the OCI-CV-R was published by Elsevier and
    # our copy is an NIHPA author manuscript, which grants no redistribution
    # right over the instrument itself. No grant permitting web publication was
    # found for either (see their `licence` fields in registry.js). Included by
    # Ryan's explicit decision, 2026-08-04. Remove these to reverse it.
    'ocir', 'oci_cv_r',
    # sleep (SCI-08: CC BY-NC 3.0 with the paper, Espie et al. 2014)
    'sci',
    # behaviour / development (informant)
    'sdq_parent', 'sdq_self',
]

# Probes for protected wording: must be present in the app's own registry (so the
# check is testing something) and absent from everything this repo holds or ships.
_FORBIDDEN = [
    ("BAARS", "Difficulty sustaining my attention in tasks or fun activities"),
    ("RCADS", "When I have a problem, I get a funny feeling in my stomach"),
    ("IES-R", "Any reminder brought back feelings about it"),
    ("Y-BOCS", "Time occupied by obsessive thoughts"),
    ("Y-BOCS checklist", "I am concerned or disgusted with bodily waste"),
    ("CY-BOCS checklist", "Fear harm will come to others"),
]

# The app files the build uses, by their path in the app repo (text files).
_TEXT_FILES = [
    'assessment_suite/engine/config.js',
    'assessment_suite/engine/scoring.js',
    'assessment_suite/engine/sdq_norms.js',
    'assessment_suite/engine/screener_norms.js',
    'assessment_suite/engine/registry.js',
    'assessment_suite/engine/validate.js',
    'assessment_suite/engine/state.js',
    'assessment_suite/ui/app.js',
    'assessment_suite/ui/results.js',
    'assessment_suite/ui/styles.css',
    'assessment_suite/index.html',
    'norms/cutoffs.csv',
    'scripts/validate.cjs',
]
# Folders copied whole, filtered by file name (fonts with their OFL licences; the
# RMET photographs).
_ASSET_DIRS = [
    ('assessment_suite/assets/fonts', re.compile(r'.+\.(woff2|txt)$')),
    ('assessment_suite/assets/rmet-images', re.compile(r'image-\d+\.jpg$')),
]


def strip_registry(registry):
    """Remove every copyright-excluded instrument from registry.js."""
    # registry.js carries protected item text for excluded instruments: the four
    # proprietary BAARS-IV item arrays and the four RCADS arrays (47 + 25 item, self +
    # parent; clinic EHR permission only). Empty them so this repo holds none of that
    # content. (DIVA/DASI/ADI-R/ADOS live in engine files this build never copies;
    # the RCADS T-score tables live in rcads_norms.js / rcads25_norms.js, also never
    # copied here.)
    out, n = re.subn(
        r"const (BAARS_SELF_CURRENT|BAARS_SELF_CHILD|BAARS_INF_CURRENT|BAARS_INF_CHILD) = \[.*?\n\];",
        r"const \1 = [];", registry, flags=re.DOTALL)
    if n != 4:
        raise ValueError(f"Expected to strip 4 BAARS item arrays, stripped {n}; registry.js format changed.")
    out, n = re.subn(
        r"const (RCADS_ITEMS_SELF|RCADS_ITEMS_PARENT|RCADS25_ITEMS_SELF|RCADS25_ITEMS_PARENT) = \[.*?\n\];",
        r"const \1 = [];", out, flags=re.DOTALL)
    if n != 4:
        raise ValueError(f"Expected to strip 4 RCADS item arrays (47 + 25), stripped {n}; registry.js format changed.")

    # IES-R and the Y-BOCS family: rights holders forbid web publication of the
    # instrument itself, so the whole REGISTRY block is removed (emptying an item
    # array would still leave the per-item response anchors).
    #   IES-R      Weiss (2007), Guilford Press chapter.
    #   Y-BOCS/CY-BOCS/self-report  OCD Scales, LLC (© Wayne K. Goodman); posting
    #              on a website is not permissible without a licence agreement.
    # Both stay available in the clinic's own app; this only governs this repo.
    out, n = re.subn(
        r'Object\.assign\(REGISTRY, \{"iesr":\{.*?\n\}\}\);\n',
        '/* IES-R omitted from the hosted build (copyright: Weiss / Guilford Press). */\n',
        out, flags=re.DOTALL)
    if n != 1:
        raise ValueError(f"Expected to strip 1 IES-R registry block, stripped {n}; registry.js format changed.")
    out, n = re.subn(
        r'/\* ── Y-BOCS — Yale-Brown Obsessive-Compulsive Scale.*?\n\}\)\(\);\n',
        '/* Y-BOCS family omitted from the hosted build (copyright: OCD Scales, LLC). */\n',
        out, flags=re.DOTALL)
    if n != 1:
        raise ValueError(f"Expected to strip 1 Y-BOCS registry block, stripped {n}; registry.js format changed.")

    # The other excluded instruments (BAARS-IV, RCADS, RCADS-25, DIVA-5, Young DIVA-5,
    # DASI-2, ADI-R, ADOS-2) are hidden at boot, but their registry blocks still carry
    # names, citations and descriptions. Remove each block with its header comment,
    # so nothing about them ships (audit 2026-10-02, issue 12).
    for hdr in ['BAARS-IV', 'RCADS — ', 'RCADS-25', 'DIVA-5 — ', 'Young DIVA-5', 'DASI-2',
                'ADI-R algorithm', 'ADI-R interview workspace', 'ADOS-2 Module 4']:
        out, n = re.subn(
            r'/\* ── ' + re.escape(hdr) + r'.*?Object\.assign\(REGISTRY, \{"[a-z0-9_]+":\{.*?\n\}\}\);\n',
            '/* (excluded instrument omitted from the hosted build) */\n',
            out, count=1, flags=re.DOTALL)
        if n != 1:
            raise ValueError(f"Expected to strip the '{hdr}' registry block, stripped {n}; registry.js format changed.")
    return out


def strip_state(state):
    """Their AGE_BOUNDS entries in state.js carry citation notes too (e.g. "Barkley
    2011"); drop those lines so the excluded instruments leave no trace."""
    excl = ['baars_self', 'baars_informant', 'rcads_self', 'rcads_parent', 'rcads25_self',
            'rcads25_parent', 'iesr', 'ybocs_clin', 'ybocs_sr', 'ybocs_check', 'ybocs_child',
            'ybocs_child_check']
    out, n = re.subn(r'(?m)^[ \t]*(' + '|'.join(excl) + r'):[ \t]*\{.*\},?[ \t]*\r?\n', '', state)
    if n != len(excl):
        raise ValueError(f"Expected to strip {len(excl)} AGE_BOUNDS lines, stripped {n}; state.js format changed.")
    return out


def strip_cutoffs(text):
    """Keep only the cut-off rows of the visible instruments: excluded ones leave no
    statistics in this repo either."""
    rows = list(csv.reader(io.StringIO(text, newline='')))
    head, body = rows[0], rows[1:]
    col = head.index('instrument')
    keep = [r for r in body if r and r[col].strip() in set(ALLOW)]
    buf = io.StringIO(newline='')
    csv.writer(buf, lineterminator='\n').writerows([head] + keep)
    print(f"  cutoffs.csv: kept {len(keep)} of {len(body)} rows (visible instruments only)")
    return buf.getvalue()


def leak_check(label, text):
    leaks = [name for name, probe in _FORBIDDEN if probe in text]
    if leaks:
        sys.exit(f"[ABORT] Protected item text found in {label}: {', '.join(leaks)}. "
                 "Nothing written. Fix the strip step in build.py.")


def run_validator(root, label):
    """The app's own validator (read-only), run against the engine files under root.
    Corrupted clinical data never ships."""
    print(f"Validating registry / norms ({label}) ...")
    try:
        res = subprocess.run(['node', str(root / 'scripts' / 'validate.cjs')], capture_output=True, text=True, encoding='utf-8')
    except FileNotFoundError:
        sys.exit("[ABORT] Node.js not found on PATH; required to run the validator.")
    print((res.stdout or '').strip())
    if res.returncode != 0:
        if (res.stderr or '').strip():
            print(res.stderr.strip())
        sys.exit("[ABORT] validateRegistry found errors; stopped. Fix the data in the app and re-run.")


# ── Sync: copy the app's files into app/ ─────────────────────────────────────────
def sync(ref):
    app_repo = Path(os.environ.get('SUPPLEMENT_APP_DIR') or (HERE.parent / 'assessment_suite_project')).resolve()
    if not (app_repo / '.git').exists():
        sys.exit(f"[ABORT] App repo not found at {app_repo}. Set SUPPLEMENT_APP_DIR to the app repo.")

    def git(*args, binary=False):
        r = subprocess.run(['git', '-C', str(app_repo), *args], capture_output=True)
        if r.returncode != 0:
            sys.exit(f"[ABORT] git {' '.join(args)} failed: {r.stderr.decode('utf-8', 'replace').strip()}")
        return r.stdout if binary else r.stdout.decode('utf-8')

    commit = git('rev-parse', '--short', ref + '^{commit}').strip()
    print(f"Copying from {app_repo} at {ref} ({commit}), committed files only")
    show = lambda p: git('show', f'{commit}:{p}', binary=True)

    texts = {p: show(p).decode('utf-8') for p in _TEXT_FILES}
    binaries = {}
    for folder, pat in _ASSET_DIRS:
        names = [n for n in git('ls-tree', '--name-only', f'{commit}:{folder}').split('\n') if n]
        for n in names:
            if pat.fullmatch(n):
                binaries[f'{folder}/{n}'] = show(f'{folder}/{n}')

    # 1. the app's data must pass its own validator, unstripped, before anything is copied
    for name, probe in _FORBIDDEN:
        if probe not in texts['assessment_suite/engine/registry.js']:
            raise ValueError(f"{name} canary string no longer present in registry.js; "
                             "the leak check is testing nothing. Update _FORBIDDEN.")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for p in ['assessment_suite/engine/scoring.js', 'assessment_suite/engine/screener_norms.js',
                  'assessment_suite/engine/sdq_norms.js', 'assessment_suite/engine/registry.js',
                  'assessment_suite/engine/validate.js', 'scripts/validate.cjs']:
            (tmp / p).parent.mkdir(parents=True, exist_ok=True)
            (tmp / p).write_text(texts[p], encoding='utf-8')
        run_validator(tmp, 'app, full')

    # 2. strip, then prove the protected wording is gone, before anything is written
    texts['assessment_suite/engine/registry.js'] = strip_registry(texts['assessment_suite/engine/registry.js'])
    texts['assessment_suite/engine/state.js'] = strip_state(texts['assessment_suite/engine/state.js'])
    texts['norms/cutoffs.csv'] = strip_cutoffs(texts['norms/cutoffs.csv'])
    for p, t in texts.items():
        leak_check('app/' + p, t)

    # 3. replace the copy wholesale, so a file dropped in the app is dropped here too
    if VENDOR.exists():
        shutil.rmtree(VENDOR)
    for p, t in texts.items():
        (VENDOR / p).parent.mkdir(parents=True, exist_ok=True)
        (VENDOR / p).write_bytes(t.encode('utf-8'))
    for p, b in binaries.items():
        (VENDOR / p).parent.mkdir(parents=True, exist_ok=True)
        (VENDOR / p).write_bytes(b)
    SOURCE_NOTE.write_text(
        f"Copied from assessment_suite_project commit {commit}\n\n"
        "These are copies of the app's files, stripped of copyright-excluded content.\n"
        "Never edit them here: fix the app, then run  py build.py --sync\n", encoding='utf-8')
    print(f"[OK] Copied {len(texts)} files and {len(binaries)} assets into app/ (commit {commit})")


# ── Build: assemble public/index.html from app/ and ui/ ──────────────────────────
def build():
    if not (SRC / 'engine' / 'registry.js').is_file() or not SOURCE_NOTE.is_file():
        sys.exit("[ABORT] app/ is missing. Run  py build.py --sync  first.")
    app_commit = re.search(r'commit (\w+)', SOURCE_NOTE.read_text(encoding='utf-8')).group(1)
    print(f"App copy: {VENDOR} (app commit {app_commit})")

    run_validator(VENDOR, 'copy in app/')

    def build_cutoffs_master():
        # The app's build writes this to engine/cutoffs_master.js; here it is built in
        # memory from the copied (already filtered) CSV.
        with open(VENDOR / 'norms' / 'cutoffs.csv', encoding='utf-8', newline='') as f:
            rows = list(csv.DictReader(f))
        keep = ['instrument', 'instrument_name', 'scale', 'cutoff', 'label', 'recommended',
                'sensitivity', 'specificity', 'target', 'comparison', 'reference_standard',
                'n_cases', 'n_noncases', 'setting', 'figure_type', 'source', 'verified']
        out = []
        for i, r in enumerate(rows, start=2):
            if None in r or any(r.get(k) is None for k in keep):
                sys.exit(f"[ABORT] norms/cutoffs.csv line {i} has the wrong number of columns "
                         "(an unquoted comma?). Fix the row in the app and re-run.")
            if r['instrument'].strip() not in set(ALLOW):
                continue
            if (r['sensitivity'] or '').strip() or (r['specificity'] or '').strip():
                out.append({k: (r[k] or '').strip() for k in keep})
        print(f"[OK] cut-off master: {len(out)} cut-off rows with sensitivity/specificity")
        return ("/* GENERATED by build.py from norms/cutoffs.csv. Do not edit; edit the CSV. */\n"
                "window.CUTOFFS_MASTER = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")

    def build_image_map():
        """Inline every RMET eye photo as a base64 data URI so the single file works
        on its own."""
        img_dir = SRC / 'assets' / 'rmet-images'
        if not img_dir.is_dir():
            return ''
        images = {}
        for p in sorted(img_dir.glob('image-*.jpg')):
            mime = mimetypes.guess_type(p.name)[0] or 'image/jpeg'
            images[p.name] = f'data:{mime};base64,{base64.b64encode(p.read_bytes()).decode("ascii")}'
        if not images:
            return ''
        print(f"  Inlined {len(images)} RMET image(s)")
        return 'window.RMET_IMAGES = ' + json.dumps(images) + ';\n'

    rd = lambda p: (SRC / p).read_text(encoding='utf-8')
    css = rd('ui/styles.css')
    def _inline_font(m):
        fp = SRC / 'assets/fonts' / m.group(1)
        return 'url("data:font/woff2;base64,' + base64.b64encode(fp.read_bytes()).decode('ascii') + '")'
    css, n_fonts = re.subn(r'url\("\.\./assets/fonts/([\w.-]+\.woff2)"\)', _inline_font, css)
    print(f"  Inlined {n_fonts} font file(s)")
    config, scoring, sdqnorms = rd('engine/config.js'), rd('engine/scoring.js'), rd('engine/sdq_norms.js')
    scrnorms, registry, validate = rd('engine/screener_norms.js'), rd('engine/registry.js'), rd('engine/validate.js')
    state, app, results, shell = rd('engine/state.js'), rd('ui/app.js'), rd('ui/results.js'), rd('index.html')

    # The session interface (this repo's own files, layered on the app's engine:
    # it calls REGISTRY, Scoring.run and App.resultBody, never copies them).
    suite_css = (HERE / 'ui' / 'suite.css').read_text(encoding='utf-8')
    suite_js = (HERE / 'ui' / 'suite.js').read_text(encoding='utf-8')

    # Force local mode no matter where the file is hosted (auto-detect would flip to
    # 'online' on a web host), and strip the Supabase credentials: this tool never
    # talks to the app's backend.
    config, n_mode = re.subn(r"mode:\s*'auto'", "mode: 'local'", config, count=1)
    if n_mode != 1:
        raise ValueError("config.js: expected exactly one mode:'auto' to force to 'local'")
    config = re.sub(r"(supabaseUrl:\s*)'[^']*'", r"\1''", config)
    config = re.sub(r"(supabaseAnonKey:\s*)'[^']*'", r"\1''", config)

    def strip_file_header(js):
        m = re.match(r'/\*.*?\*/[ \t]*\r?\n(?:[ \t]*\r?\n)*', js, re.DOTALL)
        return js[m.end():] if m else js

    body_match = re.search(r'<body>(.*?)</body>', shell, re.DOTALL)
    if not body_match:
        raise ValueError("Could not find <body> in index.html")
    body = body_match.group(1)
    body = re.sub(r'\n<script src=[^>]+></script>', '', body)
    body = re.sub(r'\n<script>\s*/\* Boot \*/.*?</script>\n', '', body, flags=re.DOTALL)
    body = body.strip()

    online_boot = f"""/* ── Boot (hosted, copyright-filtered) ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {{
  var ALLOW = new Set({json.dumps(ALLOW)});
  Object.keys(REGISTRY).forEach(function(k){{ if(!ALLOW.has(k)) delete REGISTRY[k]; }});
  if (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.batteries)) {{
    CONFIG.batteries = CONFIG.batteries
      .map(function(b){{ return Object.assign({{}}, b, {{ tests: (b.tests||[]).filter(function(t){{ return ALLOW.has(t); }}) }}); }})
      .filter(function(b){{ return b.tests.length; }});
  }}
  Suite.boot();
}});"""

    image_map = build_image_map()
    cutmaster = build_cutoffs_master()
    _rmet = image_map + '/* ── RMET images inlined above (single-file build only) ── */' if image_map else ''
    js_bundle = '\n\n'.join(p for p in [
        _rmet,
        strip_file_header(config),
        strip_file_header(scoring),
        sdqnorms,
        strip_file_header(scrnorms),
        strip_file_header(registry),
        strip_file_header(cutmaster),
        strip_file_header(validate),
        strip_file_header(state),
        strip_file_header(app),
        strip_file_header(results),
        suite_js,
        online_boot,
    ] if p)

    title = "Clinical Supplement Suite"
    out = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
{css}
</style>
<style>
{suite_css}
</style>
</head>
<body>
{body}

<script>
{js_bundle}
</script>
</body>
</html>"""

    # Leak check runs on the text BEFORE it is written, so protected item text can
    # never reach disk here, even if the copy in app/ were edited by hand.
    leak_check('the build', out)

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(out, encoding='utf-8')
    (HERE / 'BUILT_FROM.txt').write_text(f"Built from assessment_suite_project commit {app_commit}\n", encoding='utf-8')
    print(f"[OK] Built: {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")
    print(f"     Copyright check passed ({len(_FORBIDDEN)} protected instruments absent)")
    print(f"     Filtered to {len(ALLOW)} copyright-clean instruments")


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--sync', action='store_true', help="refresh app/ from the app repo before building")
    ap.add_argument('--ref', default='HEAD', help="app commit or branch to copy from (with --sync; default HEAD)")
    a = ap.parse_args()
    if a.ref != 'HEAD' and not a.sync:
        ap.error('--ref only applies with --sync')
    if a.sync:
        sync(a.ref)
    build()

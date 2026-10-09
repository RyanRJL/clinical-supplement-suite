# Clinical Supplement Suite

Copyright-clean, self-scoring screening tools for clinicians, hosted at
https://tools.neurominds.uk (unlisted, noindex).

The instrument engine belongs to the Neurominds assessment app. This repo keeps a
copy of the files the build needs in `app/` (laid out as in the app repo, with
copyright-excluded content already stripped), so it builds on its own.
`app/SOURCE.txt` records which app commit the copy came from. Never edit `app/`;
fix the app, then sync.

`ui/suite.js` and `ui/suite.css` are this repo's own interface, layered on the
app's engine. `build.py` writes a single self-contained `public/index.html`.

## Rebuild and publish

```
py build.py                      # build from the copy in app/
py build.py --sync               # refresh app/ from the app's HEAD commit, then build
py build.py --sync --ref <c>     # the same, from a given app commit or branch
git add app public BUILT_FROM.txt
git commit -m "Rebuild from app <commit>"
git push
```

Sync reads committed files only (`git show <commit>:<path>`), so uncommitted work in
the app is never picked up and nothing is written to the app repo. The app lives at
`../assessment_suite_project` by default, or set `SUPPLEMENT_APP_DIR`.

Cloudflare Pages serves `public/` as-is (no build command). `BUILT_FROM.txt` records
which app commit the live file came from.

## Changing which instruments appear

Edit `ALLOW` in `build.py`, then `py build.py --sync`. Anything excluded for
copyright must also be stripped (see the strip steps and `_FORBIDDEN` leak check in
the same file). This repo is public, so the strip runs before the copy is written,
and the leak check runs on the copy as well as on the built page.

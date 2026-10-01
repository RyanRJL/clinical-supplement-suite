# Clinical Supplement Suite

Copyright-clean, self-scoring screening tools for clinicians, hosted at
https://tools.neurominds.uk (unlisted, noindex).

The instrument engine is not stored here. `build.py` reads it from the Neurominds
assessment app (`../assessment_suite_project` by default, or `SUPPLEMENT_APP_DIR`)
and writes a single self-contained `public/index.html`. The build only reads the
app's files; it never writes to that repo.

## Rebuild and publish

```
py build.py
git add public BUILT_FROM.txt
git commit -m "Rebuild from app <commit>"
git push
```

Cloudflare Pages serves `public/` as-is (no build command). `BUILT_FROM.txt` records
which app commit the live file came from. Don't publish a build made while the app
had uncommitted changes (the build warns).

## Changing which instruments appear

Edit `ALLOW` in `build.py`. Anything excluded for copyright must also be stripped
(see the strip step and `_FORBIDDEN` leak check in the same file).

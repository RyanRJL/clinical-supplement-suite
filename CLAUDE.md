# Clinical Supplement Suite: project instructions

A separate product from the Neurominds assessment app. Hosted at tools.neurominds.uk
(Cloudflare Pages, serves `public/` with no build step). Unlisted and noindex.

## The one rule: never affect the app

The app (`../assessment_suite_project`) is the more important product. This project
must never change it.

- `build.py` READS the app's engine, UI, norms and validator. It must never write to
  the app repo (the cut-off master is built in memory for this reason).
- Do not edit app files to suit this tool. If the tool needs something the app
  doesn't have, raise it with Ryan first.
- Instrument data and scoring are fixed in the app, never patched here. Rebuild here
  afterwards to pick the fix up.

## Copyright

Only copyright-clean instruments ship. `ALLOW` controls what appears; anything
excluded for copyright is also physically stripped, and the `_FORBIDDEN` leak check
must keep passing. Never weaken or bypass either.

## Publishing

`py build.py`, then commit `public/` and `BUILT_FROM.txt` and push. Don't publish a
build the script warns was made from an app with uncommitted changes.

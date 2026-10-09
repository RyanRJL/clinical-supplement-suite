# Clinical Supplement Suite: project instructions

A separate product from the Neurominds assessment app. Hosted at tools.neurominds.uk
(Cloudflare Pages, serves `public/` with no build step). Unlisted and noindex.

## The one rule: never affect the app

The app (`../assessment_suite_project`) is the more important product. This project
must never change it.

- `build.py --sync` READS the app's committed files (`git show`) and copies the ones
  the build needs into `app/` here. It must never write to the app repo.
- `app/` is a copy, never edited here. Instrument data and scoring are fixed in the
  app, then synced (`py build.py --sync`); a fix made only in `app/` would be lost on
  the next sync and would diverge from the app.
- Do not edit app files to suit this tool. If the tool needs something the app
  doesn't have, raise it with Ryan first. This repo's own interface is `ui/`.

## Copyright

Only copyright-clean instruments ship. `ALLOW` controls what appears; anything
excluded for copyright is also physically stripped before `app/` is written (this
repo is public), and the `_FORBIDDEN` leak check must keep passing on both the copy
and the build. Never weaken or bypass either.

## Publishing

`py build.py` (or `py build.py --sync` to pick up app changes), then commit `app/`,
`public/` and `BUILT_FROM.txt` and push.

# CLAUDE.md — instructions for this repo

This repo is **my personal projects hub**. It's a collection of small, static,
self-contained projects (logs, trackers, timelines, experiments) shown from one
menu. A read-only-ish viewer/menu renders at <https://jamessw-ntv.github.io/>
(root, once the repo is named `jamessw-ntv.github.io`).

> **NTV-PROD is off-limits.** This hub has nothing to do with the `NTV-PROD`
> repo. Don't link to it, merge it in, or reference it here.

## Layout

```
index.html        the menu (a PROJECTS array → cards)
assets/hub.css    the shared design system (single source of truth)
_template/        starter skeleton for new projects
docs/             DESIGN.md (design system), PORTING.md (how projects arrive)
<project>/        one folder per project (e.g. satisfactory/), each self-contained
```

Each project folder owns its own `index.html`, `data.json`, `images/`, and may
have its own `CLAUDE.md` with project-specific rules (e.g. `satisfactory/CLAUDE.md`).

## Routing — figure out what I'm asking for

1. **Project content** (e.g. "update the Satisfactory plan") → defer to that
   project's own `CLAUDE.md` and edit files inside that project's folder.
2. **A new project / "port this in"** → follow [`docs/PORTING.md`](./docs/PORTING.md):
   create `/<slug>/` from `_template/`, conform to the design system, add a card
   to the `PROJECTS` array in `index.html`.
3. **Hub / menu / design change** → edit `index.html`, `assets/hub.css`, or the
   `docs/`. Keep it valid; changes appear after the ~30–60s Pages rebuild.
4. **Question** → just answer; don't commit.

## Golden rules

1. **Use the design system.** Link `assets/hub.css`, use its tokens, add the
   standard `.hubbar` back-link, and **use relative links only** (`../`, never a
   leading `/`). See [`docs/DESIGN.md`](./docs/DESIGN.md).
2. **Keep every project self-contained** in its own clearly-named folder.
3. Keep files valid, commit to `main`, push. Don't open PRs unless asked.
4. Respect each project's own rules (see each folder's `CLAUDE.md`).

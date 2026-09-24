# jamessw-ntv.github.io — personal projects hub

A little home for the small things I build: logs, trackers, timelines, and other
experiments. **One menu, one consistent look, each project self-contained in its
own folder.** Lives at **<https://jamessw-ntv.github.io/>**.

This README is the map of the whole place: the philosophy, how things get added,
and a catalogue of every module with links to its own docs.

> Nothing here is connected to the `NTV-PROD` repo — this is a separate, personal
> space on purpose. `NTV-PROD` is never linked, merged, or referenced here.

---

## Design philosophy (the short version)

Full version in **[`docs/DESIGN.md`](./docs/DESIGN.md)**. In a nutshell:

1. **One product, many corners.** Every project is independent but shares a single
   visual language (`assets/hub.css`) so the site never feels like a pile of
   unrelated pages.
2. **Boring tech on purpose.** Plain static HTML/CSS/vanilla JS. No build step, no
   bundler, no framework, no dependencies. If it can't be opened with a
   double-click, it's too complicated.
3. **Self-contained.** A project is one folder that owns everything it needs. Delete
   the folder and nothing else breaks.
4. **Data separated from presentation.** Anything that changes often lives in a
   `data.json`; the page renders it. Editing content never means editing code.
5. **Relative links, always.** Never a leading `/`. This is what let the repo be
   renamed and still work at any path.
6. **Content first, chrome second.** Dark, calm, legible.

The one rule that matters: **link `assets/hub.css` and use its tokens; never
hard-code colours or redefine `:root`.** Every page also starts with the standard
`.hubbar` back-link.

---

## The projects

| Project | Lives at | Status | What it is |
|---|---|---|---|
| 🏛️ **Blue Prince — Room & Item Log** | [`/blue-prince/`](./blue-prince/) | active | Spoiler-free notepad of rooms, items, codes and puzzles |
| 🏭 **Satisfactory 1.0 — Build Planner** | [`/satisfactory/`](./satisfactory/) | active | Guided build-once plan from the HUB to Project Assembly |

Status meanings: **active** = working and maintained · **wip** = built but not
finished/tested · **planned** = a card with no page yet.

### 🏛️ Blue Prince — Room & Item Log
A **spoiler-free** notepad for the game *Blue Prince*: rooms, items, codes, puzzles
and dated notes, logged from my own play. The read-only viewer renders
`blue-prince/data.json`; it starts empty on purpose and is filled from a logging
chat (it never pre-fills facts from a wiki). This is the **reference implementation**
of the hub's data-driven pattern.
- **How it works:** `index.html` fetches `data.json` (raw-GitHub URL first,
  same-origin fallback) and renders tabs for rooms / items / puzzles / notes / tips.
- **History:** the hub's first resident — the repo began life as the standalone
  *blue-prince-log* repo and was then generalised into this hub (see the migration
  runbook below).
- **Docs:** [`README.md`](./blue-prince/README.md) (schema) ·
  [`CLAUDE.md`](./blue-prince/CLAUDE.md) (spoiler-free logging rules) ·
  [`LOGGING.md`](./blue-prince/LOGGING.md) (how to log from a normal chat).

### 🏭 Satisfactory 1.0 — Build Planner
A build-once plan to take one Satisfactory 1.0 save from the HUB to a finished
Space Elevator, as a self-contained offline app (`factory-network.html`).
- **Docs:** [`README.md`](./satisfactory/README.md) · [`CLAUDE.md`](./satisfactory/CLAUDE.md).

---

## Repo layout

```
index.html        the menu — a PROJECTS array rendered as cards
assets/hub.css    the shared design system (tokens + components)
_template/        starter skeleton for a new project
docs/
  DESIGN.md       design philosophy + system rules
  PORTING.md      how to bring a project in from another chat (one paste)
  MIGRATION.md    one-time setup/rename runbook (now complete)
blue-prince/      Blue Prince log        (own README + CLAUDE.md + LOGGING.md)
satisfactory/     Satisfactory planner    (own README + CLAUDE.md)
CLAUDE.md         hub-wide instructions for the maintaining chat
.github/workflows/pages.yml   deploys the whole repo root to Pages
```

Each project is one folder (`<slug>/`) with its own `index.html`, optional
`data.json` and `images/`, and may carry its own `CLAUDE.md`/`README.md` with
project-specific rules.

## Adding a project

The easy path is in **[`docs/PORTING.md`](./docs/PORTING.md)**: paste an export
prompt into the chat that already has the project, then paste the result here and
say *"port this into the hub."* A new `/<slug>/` folder appears, restyled to the
design system, and a card is added to `index.html`.

By hand: copy `_template/` to `<slug>/`, build against
[`docs/DESIGN.md`](./docs/DESIGN.md), and add a card to the `PROJECTS` array in the
root `index.html`:

```js
{ ico:"🎯", title:"My project", href:"my-project/", status:"active",
  desc:"One line about it." },
```

## How it's served

The repo is named `jamessw-ntv.github.io`, so GitHub Pages publishes it at the root
automatically. A push to `main` redeploys the whole repo via
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) (≈30–60s). Because every
link is relative, projects work at any path.

## Rules of the house

- **`NTV-PROD` is off-limits** — never linked, merged, or referenced here.
- Commit project content and menu changes straight to `main`; don't open PRs unless
  asked. A push to `main` redeploys the site.
- Keep files valid — there's no build step to catch errors for you.

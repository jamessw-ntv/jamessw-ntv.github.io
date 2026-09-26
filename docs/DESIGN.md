# Design system

Every page on this site should feel like part of one product. That consistency
comes from a few simple, enforced rules — not a framework.

## Philosophy

The hub is built on a handful of principles. New projects should hold to them.

1. **One product, many corners.** Each project is independent, but they share a
   single visual language so the site never feels like a pile of unrelated pages.
2. **Boring tech on purpose.** Plain HTML, CSS and vanilla JS that runs straight
   from a static file. No build step, no bundler, no framework, no dependencies.
   If it can't be opened with a double-click, it's too complicated.
3. **Self-contained.** A project is one folder that owns everything it needs
   (markup, data, images). You can delete a folder and nothing else breaks.
4. **Data and presentation separated.** Anything that changes often lives in a
   `data.json`; the page renders it. Editing content never means editing code.
5. **Relative links, always.** Never a leading `/`. This is what lets the whole
   site survive being renamed or served from any path.
6. **Content first, chrome second.** Dark, calm, legible. The design gets out of
   the way of the thing you're actually looking at.
7. **Readable over clever.** Match the surrounding code; favour the obvious
   solution. These are personal tools, not a portfolio of techniques.

## The one rule that matters

**Link `assets/hub.css` and use its tokens. Never hard-code colours or redefine
the `:root` variables.** Project-specific CSS is welcome on top, but it should
reference the tokens below.

## Tokens (defined in `assets/hub.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0f1422` | page background |
| `--panel` | `#171d2e` | cards, inputs, pills |
| `--panel2` | `#1f2740` | nested / header surfaces |
| `--line` | `#2b3550` | borders, dividers |
| `--text` | `#e8ecf6` | primary text |
| `--muted` | `#9aa6c4` | secondary text |
| `--accent` | `#6ea8fe` | links, active state |
| `--blue/--orange/--green/--purple/--yellow/--red/--black` | — | category swatches |
| `--maxw` | `1100px` | content width |
| `--radius` | `12px` | card/border radius |

Dark theme, system font stack, generous radii, pill-shaped controls.

## Conventions

- **Layout:** wrap page content in `<div class="wrap">` (centres at `--maxw`).
- **Back-link:** every project page starts with the standard `.hubbar`:
  ```html
  <div class="hubbar">
    <a class="backlink" href="../">← Hub</a>
    <span class="crumb"><b>Project name</b></span>
  </div>
  ```
- **Relative links only.** Use `../` for the hub and `../assets/hub.css` for the
  stylesheet — never a leading `/`. This is what lets the site work both before
  and after the repo is renamed to `jamessw-ntv.github.io`.
- **Components available from `hub.css`:** `.grid` + `.card`, `.badges`/`.b`,
  `.status` (`.active`/`.wip`/`.planned`), `.toggle`, `footer.site`.
- **No build step, no dependencies.** Plain HTML/CSS/JS that runs from a static
  file. Data-driven projects keep a `data.json` beside their `index.html` and
  render it client-side (fetch `data.json`, raw-GitHub URL first, same-origin fallback).

## Starting a new project

Copy `_template/index.html` into a new folder named after the project's slug
(kebab-case), then build inside it. Add a card to the `PROJECTS` array in the
root `index.html` so it shows up on the menu.

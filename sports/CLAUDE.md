# Multi-Sport Dashboard — project rules

A personal, glanceable dashboard for two sports at once: **AFL** (Carlton) and
**NRL** (Melbourne Storm + State of Origin, backing Queensland). `sports/index.html`
renders `sports/data.json` at <https://jamessw-ntv.github.io/sports/>.

Teams to highlight everywhere: **Carlton** (AFL), **Melbourne Storm** (NRL),
**Queensland** (Origin).

The FIFA World Cup panel was removed after the 2026 tournament; the dashboard is
football (AFL) and rugby league (NRL) only. Do not re-add a soccer/World Cup panel
unless explicitly asked.

## Intent routing

1. **Update results / standings** (default): edit `sports/data.json`, commit to `main`.
2. **Viewer change** ("restyle a card", "add a column"): edit `sports/index.html`.
3. **Question**: just answer; don't commit.

## Architecture

Data is fully separated from presentation. `index.html` fetches `data.json` (raw
GitHub URL first, same-origin fallback) and renders it. **You normally only edit
`data.json`.** It links `../assets/hub.css` and uses the hub's dark tokens, never
hard-coded colours. Relative links only.

## Data shape (`data.json`)

- `meta` — `{title, updated (ISO date), note}`. Bump `updated` on every change.
- `nextup` — `{mine:[[icon,team,match,when,sub]], matches:{"Comp heading":[[match,when,sub]]}}`.
  Rows whose `when` date is before today are auto-hidden, so keep labels like "Sat 11 Jul".
- `afl.ladder` — `[[pos,team,P,W,L,D,PF,PA,pct,pts]]`. `nrl.ladder` — `[[pos,team,P,W,L,D,diff,pts]]`.
  A cell may be the "—" glyph when a figure is genuinely unverified (renders as-is).
- `afl.focus` / `nrl.focus` — `{team,pos,record,pct|diff,pts,note,form:["W"/"L"/"D"],next:{opp,when,venue}}`.
- `afl.fixtures` / `nrl.fixtures` — `[[opp,"H"/"A"/"-",result"W"/"L"/"",score,"Round label"]]`. "Bye" opp = bye row.
- `nrl.origin` — `{seriesQld,seriesNsw,state,games:[{g,res:"win"/"loss"/"upcoming",qld,nsw,venue,date,qldScorers,nswScorers}]}`. `res` is from QLD's point of view.
- `paths.{afl,nrl}` — `{finalOdds, gates:[...]}`. A gate = `{stage,title,req,odds(0-100),status:"passed"/"current"/"locked"/"out",games:[[label,sublabel,result,"w"/"l"/"tbd"]],note}`. A marker (sits before a gate) = `{marker:{type:"branch"/"wall",text}}`.

A result usually touches TWO places: the match score AND the standings/ladder it
feeds. They must reconcile (see below).

## Update protocol

1. Know the current date and what has actually been played since the last edit.
2. For each NEW final result: update the score, then the ladder it affects, then
   `focus`, `fixtures`, `origin`, and `paths` gates as needed.
3. **Verify before asserting (non-negotiable).** Do not trust agreeing sources by
   headcount; most sites resell the same feed. Reconcile each fact against a
   structurally different dependent fact: a match score must reproduce the
   standings (points, W/L, goal/point diff); scorers must sum to the scoreline.
   A contradiction means it is NOT verified. Investigate, do not average it away.
4. Anything not yet final: leave the score empty / mark pending. Never guess a
   live game.
5. Bump `meta.updated` and any "current through DATE" copy in `index.html`.

## Style rules

- **No em dashes or double dashes** in prose, anywhere. Use commas, colons, or full
  stops. (The "—" glyphs in the file are decorative placeholders for empty scores
  and the Origin series separator, not prose.)
- Concise, honest, no fluff. Call out wrong things, including the user's own.
- Keep `data.json` valid, commit to `main`, push. Don't open a PR unless asked.

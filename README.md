# Boston AI Atlas

[![Validate atlas data](https://github.com/holzerjm/boston-ai-atlas/actions/workflows/validate.yml/badge.svg)](https://github.com/holzerjm/boston-ai-atlas/actions/workflows/validate.yml)
[![Organizations](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fholzerjm%2Fboston-ai-atlas%2Fmain%2Fbadge.json)](data.js)
[![Live site](https://img.shields.io/badge/live-the--open--accelerator.com%2Fecosystem-EE0000)](https://the-open-accelerator.com/ecosystem/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-4ade80)](CONTRIBUTING.md)
[![The Open Accelerator](https://img.shields.io/badge/by-The%20Open%20Accelerator-EE0000)](https://the-open-accelerator.com)

The living map of Greater Boston's AI ecosystem — built by the community for the community and founders, presented by
[The Open Accelerator](https://the-open-accelerator.com) (an initiative between the
MA AI Hub, Red Hat & IBM).

**Four ways to explore 160+ verified organizations:**

- 🗺️ **Map** — every VC, lab, accelerator and community pinned across Greater Boston
- ✨ **Galaxy** — an animated network of how the ecosystem connects (spinouts, funds, hosts)
- 🧭 **Founder Journey** — resources curated by stage, from first spark to scale
- 📇 **Directory** — full-text search with category and stage filters

Every entry shows when a maintainer last verified it, and every entry and view is
linkable — `?entry=csail` opens straight to an organization, `#galaxy` to a view
(there's a 🔗 Copy link button in each entry's drawer).

## Run it

It's a static site — no build step.

The hosted live page is at https://the-open-accelerator.com/ecosystem/

```bash
# locally
python3 -m http.server     # then open http://localhost:8000
```

Opening `index.html` straight from `file://` mostly works, but a few hot-linked TOA
images will be broken and it's not how the page ships — prefer the local server above.

## Deploy

**Merging is publishing.** A GitHub Action deploys `index.html`, `data.js` and the
map style to [the live site](https://the-open-accelerator.com/ecosystem/) on every
merge to `main` that touches them — it re-validates the data first, then rsyncs to
the server and posts a summary to the TOA Slack. (Not GitHub Pages.)

Manual fallback, from a checkout with SSH access to the server:

```bash
./scripts/sync-to-site.sh <destination>
```

The page must be served at a directory URL (`…/ecosystem/`, trailing slash) so the
relative `data.js` include resolves.

**If the repo ever moves (or you host your own copy):** set `GH_REPO` in
`index.html` (search for `const GH_REPO`) to your `org/repo` so the in-app
**Suggest** and **Flag** buttons point at the right issue forms.

## Contribute

The atlas is community-maintained:

- **➕ Suggest an entry** — [open a suggestion](../../issues/new?template=suggest-entry.yml)
  or edit [`data.js`](data.js) and send a PR
- **🚩 Flag an entry** — [report something outdated or miscategorized](../../issues/new?template=flag-entry.yml)
  (or use the Flag button on any entry inside the atlas)

See [CONTRIBUTING.md](CONTRIBUTING.md) for the entry schema and review process.
Every PR touching `data.js` is automatically validated by CI, and a maintainer can
hand your suggestion to the **atlas bot**, which drafts it as a pull request
(geocoded and validated) for human review — nothing publishes without a maintainer
merge.

**Maintainers** turn accepted issues and PRs into entries — see
[MAINTAINING.md](MAINTAINING.md) for the step-by-step process.

## Repo layout

```
index.html                        the app — one file of HTML/CSS/vanilla JS (Leaflet +
                                  MapLibre GL, Tailwind & web fonts via CDN; TOA-branded)
data.js                           the dataset — this is what you edit
map-style-dark.json               the dark basemap style (OpenFreeMap fiord + our grafts)
scripts/validate.js               schema validation (runs in CI and locally)
scripts/badge.js                  regenerates badge.json (entry count — CI runs it on merge)
scripts/stale.js                  freshness report — entries longest unverified
scripts/export-csv.js             export the dataset to a spreadsheet-friendly CSV
scripts/issue-to-entry.js         the suggestion bot's form parser / entry builder
scripts/sync-to-site.sh           manual deploy fallback (CI normally deploys on merge)
.github/ISSUE_TEMPLATE/           suggest & flag forms
.github/workflows/validate.yml    CI validation + freshness summary on every data PR
.github/workflows/deploy.yml      auto-deploy to the live site + Slack notification
.github/workflows/suggest-to-pr.yml  the suggestion bot (maintainer-gated, drafts PRs)
CONTRIBUTING.md                   entry schema & contributor workflow
MAINTAINING.md                    maintainer guide — turn issues & PRs into data.js
PROJECT_STATE.md                  architecture, decisions & backlog (start here if new)
```

## The data

The atlas is also an **open dataset** — the only maintained, human-verified dataset of
Greater Boston's AI ecosystem. Two machine-readable endpoints regenerate on every
deploy:

- **JSON** — <https://the-open-accelerator.com/ecosystem/atlas.json> — a versioned
  envelope (`schema: 1`) with all entries, categories, stages and per-category counts
- **CSV** — <https://the-open-accelerator.com/ecosystem/atlas.csv> — one row per
  organization, ready for Google Sheets (*File → Import*) or Excel (*Data → From
  Text/CSV*)

Columns/fields include name, category, location, lat/lng, website, description, tags,
founder stages and the month a maintainer last verified the entry.

To regenerate locally: `node scripts/export-json.js` and `node scripts/export-csv.js`.

**Methodology:** every entry is checked by a human against the organization's own
website plus an independent source before it ships, and re-verified on a rolling
basis (`lastVerified` records the month; entries more than a year unverified are
flagged in the app). Defunct or unverifiable organizations are removed.

**License:** the dataset is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use, share and
adapt with attribution to **The Open Accelerator**. Suggested citation:
*"Boston AI Atlas, The Open Accelerator — the-open-accelerator.com/ecosystem"*.

Some pin locations are approximate (neighborhood-level) and community groups move
between venues — check official sites before visiting. Curated since June 2026.

© 2026 The Open Accelerator.

# Boston AI Atlas

[![Validate atlas data](https://github.com/holzerjm/boston-ai-atlas/actions/workflows/validate.yml/badge.svg)](https://github.com/holzerjm/boston-ai-atlas/actions/workflows/validate.yml)
[![Organizations](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fholzerjm%2Fboston-ai-atlas%2Fmain%2Fbadge.json)](data.js)
[![Live site](https://img.shields.io/badge/live-the--open--accelerator.com%2Fecosystem-EE0000)](https://the-open-accelerator.com/ecosystem/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-4ade80)](CONTRIBUTING.md)
[![The Open Accelerator](https://img.shields.io/badge/by-The%20Open%20Accelerator-EE0000)](https://the-open-accelerator.com)

The living map of Greater Boston's AI ecosystem — built by the community for the community and founders, presented by
[The Open Accelerator](https://the-open-accelerator.com) (an initiative between the
MA AI Hub, Red Hat & IBM).

**Four ways to explore 100+ organizations:**

- 🗺️ **Map** — every VC, lab, accelerator and community pinned across Greater Boston
- ✨ **Galaxy** — an animated network of how the ecosystem connects (spinouts, funds, hosts)
- 🧭 **Founder Journey** — resources curated by stage, from first spark to scale
- 📇 **Directory** — full-text search with category and stage filters

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

The atlas is **not** deployed from GitHub Pages — it ships as part of
[the TOA website](https://the-open-accelerator.com). To publish the current state:

```bash
git pull
./scripts/sync-to-site.sh /path/to/toa-site/src/ecosystem
# then deploy the TOA site as usual, e.g. npm run deploy:no-delete
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
Every PR touching `data.js` is automatically validated by CI.

**Maintainers** turn accepted issues and PRs into entries — see
[MAINTAINING.md](MAINTAINING.md) for the step-by-step process.

## Repo layout

```
index.html                      the app (Leaflet, Tailwind & web fonts via CDN; TOA-branded)
data.js                         the dataset — this is what you edit
scripts/validate.js             schema validation (runs in CI and locally)
scripts/badge.js                regenerates badge.json (entry count — CI runs it on merge)
scripts/export-csv.js           export the dataset to a spreadsheet-friendly CSV
scripts/sync-to-site.sh         copy index.html + data.js into the TOA site to deploy
.github/ISSUE_TEMPLATE/         suggest & flag forms
.github/workflows/validate.yml  CI validation on every data PR
CONTRIBUTING.md                 entry schema & contributor workflow
MAINTAINING.md                  maintainer guide — turn issues & PRs into data.js
PROJECT_STATE.md                architecture, decisions & backlog (start here if new)
```

## Export to a spreadsheet

Turn the dataset into a CSV you can open in Google Sheets or Excel:

```bash
node scripts/export-csv.js          # writes atlas.csv (one row per organization)
```

Then import it — Google Sheets: *File → Import → Upload*; Excel: *Data → From Text/CSV*.
Columns include name, category, location, lat/lng, website, description, tags and stages.

## License & data

Curated since June 2026. Some pin locations are approximate (neighborhood-level) and
community groups move between venues — check official sites before visiting.

© 2026 The Open Accelerator.

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
Note : Some TOA images will not work if run locally. The core functionality continues to work locally 

```bash
# locally
python3 -m http.server     # then open http://localhost:8000
```

Or just open `index.html` in a browser.

## Deploy (GitHub Pages)

1. Push this repo to GitHub
2. **Settings → Pages → Source: Deploy from a branch → `main` / root**
3. Done — the atlas is live at `https://<org>.github.io/<repo>/`

**After publishing:** set `GH_REPO` in `index.html` (search for `const GH_REPO`)
to your `org/repo` so the in-app **Suggest** and **Flag** buttons point at this
repository's issue forms.

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
scripts/sync-to-site.sh         copy index.html + data.js into the TOA site to deploy
.github/ISSUE_TEMPLATE/         suggest & flag forms
.github/workflows/validate.yml  CI validation on every data PR
CONTRIBUTING.md                 entry schema & contributor workflow
MAINTAINING.md                  maintainer guide — turn issues & PRs into data.js
```

## License & data

Curated June 2026. Some pin locations are approximate (neighborhood-level) and
community groups move between venues — check official sites before visiting.

© 2026 The Open Accelerator.

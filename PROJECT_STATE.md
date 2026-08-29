# Project State — Boston AI Atlas

**Purpose of this file:** a self-contained handoff so development can continue in
Claude Code (or by any new maintainer) without the original chat history. It captures
what this project is, how it's built, what's been decided, and what's left.

**Last updated:** 2026-08-29; 144 entries (FoundersEdge and Milemark Capital added via
issues #12/#13, then 21 verified VCs across two batches from a sweep of the MGMT
Boston directory).
Repo: <https://github.com/holzerjm/boston-ai-atlas> · Live: <https://the-open-accelerator.com/ecosystem/>

---

## 1. What this is

An interactive map of Greater Boston's AI ecosystem, aimed at **early-stage founders**
(especially young/first-time founders) who need to find capital, labs, community and
programs. Published by **The Open Accelerator (TOA)** — an initiative of the MA AI Hub,
Red Hat and IBM Ventures.

It began as a better answer to <https://daimlas.com/maaimap/> ("MAAI Map"), a static
list that — despite the name — has no map, no search, no filtering, and no entity
detail. The design brief was: *same domain, far more engaging and useful.*

**Four views**, all client-side over one dataset:

| View | What it does |
|------|--------------|
| 🗺️ **Map** | Leaflet dark-tile map, one pin per org, colour-coded by category; searchable; legend doubles as category toggles |
| ✨ **Galaxy** | Canvas force-directed graph — category hubs plus entity nodes, edges from `links` (e.g. CSAIL → Liquid AI). Drag/zoom/click |
| 🧭 **Founder Journey** | 5 stages (Spark → Validate → Build → Fund → Scale); each shows curated tips plus every entry whose `stages` includes that number |
| 📇 **Directory** | Card grid, full-text search, category chips, stage filter, sort |

A detail **drawer** is shared by all views: description, "why it matters for founders",
tags, stages, connected entries, website link, "show on map", and a **🚩 Flag** button.

---

## 2. Architecture & conventions

Deliberately **dependency-free and buildless** — it must survive being copied into a
static site and edited by non-developers.

```
index.html    ~104KB  the entire app: HTML + CSS + vanilla JS in one file
data.js        ~56KB  CATS, STAGES, DATA — the only file most contributors touch
```

- **No framework, no bundler, no npm install.** Open `index.html` in a browser and it
  runs. Node is used only for the maintenance scripts.
- `index.html` loads `data.js` via a plain `<script src="data.js">` — so **relative
  paths matter**: the page must be served at a directory URL (`/ecosystem/`), not
  `/ecosystem`.
- External runtime deps, all CDN: Leaflet 1.9.4 (map), Tailwind Play CDN, Google Fonts
  (Red Hat Display), plus the TOA logo hot-linked from `the-open-accelerator.com`.
- **Map tiles:** CARTO raster basemaps (`dark_all`/`light_all`). Since ~2026-08-25 CARTO
  watermarks keyless requests ("API KEY REQUIRED"), so the tile URLs in `index.html`
  carry a `?key=` parameter — a free key (no account; commercial use permitted;
  5M tiles/month) registered for `the-open-accelerator.com` via
  <https://carto.com/basemaps/apikey>. The key is public by design (referer-scoped).
  ⚠️ CARTO says the raster basemaps are *being retired* (no date announced) — see the
  basemap-migration backlog item.
  *Consequence:* opening `index.html` from `file://` shows a broken TOA logo — expected,
  noted in the README.
- **Brand:** dark theme, Red Hat red (`#EE0000` / `#ff5c45`) for primary actions, Red Hat
  Display typeface, TOA logo in the header, Red Hat + MA AI Hub + IBM logos in the footer.
  Per-category accent colours are defined in `CATS` and used consistently across all views.

### Data model (`data.js`)

Three exports: `CATS` (11 categories → label + colour), `STAGES` (5 founder stages with
tips), and `DATA` (the array of entries). One entry:

```js
{id:"acme-ai", name:"Acme AI Labs", cat:"startup", loc:"1 Broadway, Cambridge",
 lat:42.3629, lng:-71.0838, approx:true, url:"https://acme.ai", badge:"Applications open",
 desc:"1–2 factual sentences, max 400 chars.",
 why:"Why an early-stage founder should care.",
 tags:["robotics","warehouse"], stages:[3,4], links:["csail"], lastVerified:"2026-08"},
```

`id` kebab-case & unique · `cat` ∈ CATS keys · lat/lng inside MA bounds · `url` https ·
`links` must resolve to real ids (they draw Galaxy edges) · `approx: true` when the pin is
neighbourhood-level · `lastVerified` is the month a maintainer last **actually checked**
the org (validator warns if missing, errors if malformed; drawer shows "✓ Verified …",
entries >12 months old get a stale marker). Full reference: `CONTRIBUTING.md`; enforced
by `scripts/validate.js`.

**Current composition (144 entries):** vc 49 · accel 19 · startup 16 · university 12 ·
corporate 12 · event 8 · angel 7 · community 7 · student 6 · space 4 · gov 4.

### Editorial voice

Descriptions are factual and neutral; the `why` field is the opinionated, founder-useful
part ("Free money — apply every year you're eligible"). Keep that split. Entries are real,
verified organizations — no aspirational or promotional listings.

---

## 3. Contribution system

Community contributions are **GitHub-native** (chosen over forms/serverless: no backend,
transparent moderation, contribution history, on-brand for an open-source accelerator).

- In-app **➕ Suggest an entry** (nav) and **🚩 Flag** (every detail drawer) open prefilled
  GitHub issue forms. `const GH_REPO` in `index.html` controls the target repo —
  currently `holzerjm/boston-ai-atlas`. **Update it if the repo ever moves to a TOA org.**
- `.github/ISSUE_TEMPLATE/suggest-entry.yml` — structured form incl. category dropdown,
  stage checkboxes, spam/affiliation confirmations.
- `.github/ISSUE_TEMPLATE/flag-entry.yml` — reason dropdown + source link; the entry id is
  prefilled by the app.
- The forms apply `new-entry` / `flag` labels. ⚠️ Those labels must exist in the repo —
  GitHub **silently skips** labels that don't (they were missing until 2026-08-28, which
  is why issues #12/#13 arrived unlabelled). If the repo ever moves, recreate them
  (and `bot:draft`, below).
- **Nothing auto-publishes.** A maintainer converts each issue into a `data.js` edit —
  by hand, or with the suggestion bot.

### Suggestion bot (`.github/workflows/suggest-to-pr.yml` + `scripts/issue-to-entry.js`)

Maintainer adds the **`bot:draft`** label to a suggestion issue → the bot parses the
form, geocodes the address (Nominatim), builds a JSON-serialized `data.js` entry, and
opens a **draft PR** with a review checklist. It never publishes (merge does that).

**Trust model — read before editing this workflow:**
- **Maintainer-gated.** The trigger is `issues: [labeled]` gated on the `bot:draft`
  label, which the form does *not* auto-apply — so untrusted internet input is never
  parsed, geocoded, or handed a token until a human asks. Create the label if the repo
  moves: `gh label create bot:draft`.
- **Two jobs, split on trust.** `draft` (no bot secret, `contents:read`+`issues:write`)
  parses the untrusted issue and uploads an artifact; `publish` (holds the bot token)
  opens the PR from that artifact **without running any issue-derived code**. One parser
  bug can't reach the deploy-capable token.
- **Injection-safe.** Issue text is read from the event file (never `${{ }}`-interpolated
  into `run:`), every value reaches `data.js` via `JSON.stringify`, and `validate.js`
  rejects `<`/`>` in text fields (defence-in-depth with the app's `esc()` render
  escaping). The token pushes via an auth header, not a URL.
- **Token:** a GitHub App (`ATLAS_APP_ID` + `ATLAS_APP_PRIVATE_KEY`, Contents RW + PRs RW)
  — preferred — or a repo-scoped fine-grained PAT (`ATLAS_BOT_PAT`). Must be the bot token,
  not `GITHUB_TOKEN`, so `validate.yml` runs on the bot's PR (GitHub's recursion guard).
- Optional hardening not yet applied: branch protection on `main` requiring review. ⚠️
  Would also block the `badge` job's direct push — carve out `github-actions[bot]` first.

### CI (`.github/workflows/validate.yml`)

- `validate` job — runs `scripts/validate.js` on every PR/push touching `data.js` or
  `scripts/`. This is the safety net non-technical maintainers rely on.
- `badge` job — on push to `main`, regenerates `badge.json` (entry-count shield) and
  commits it as `github-actions[bot]`. ⚠️ If branch protection is ever enabled on `main`,
  allow the bot to push or this job fails.

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/validate.js` | Schema + integrity validation. Run before every commit. |
| `scripts/badge.js` | Regenerates `badge.json`. CI runs it; safe to run locally. |
| `scripts/stale.js` | Freshness report (`lastVerified` older than N months, default 12). Never fails; CI appends it to the job summary. |
| `scripts/export-csv.js` | Dataset → `atlas.csv` for Sheets/Excel. Output is gitignored. |
| `scripts/sync-to-site.sh` | Copies `index.html` + `data.js` into the TOA site tree. |

---

## 4. Deployment

**Automatic since 2026-08-29** — merging to `main` is publishing.
`.github/workflows/deploy.yml` fires on pushes touching `index.html`/`data.js`
(plus manual `workflow_dispatch` runs): it re-validates `data.js`, rsyncs both files
to the origin server, and posts a summary (new/updated entry names, count, links) to
the TOA Slack — or a failure alert; a failed deploy leaves the live site unchanged.

Plumbing (all in repo secrets, Settings → Secrets → Actions): `DEPLOY_SSH_KEY` is a
dedicated ed25519 key whose `authorized_keys` line on the server is
**rrsync-restricted** to writing the ecosystem docroot only; `DEPLOY_HOST` is the
**origin IP** (the domain resolves to Cloudflare's proxy, which won't pass SSH);
`DEPLOY_USER`; `DEPLOY_PATH` is `/` (paths are relative to the rrsync root);
`SLACK_WEBHOOK_URL` is optional — notifications skip silently without it and are
`continue-on-error`, so Slack can never break a deploy.

Manual fallback: `./scripts/sync-to-site.sh <dest>` from a local checkout with SSH
access. The atlas is **not** on GitHub Pages.

`index.html` carries `<link rel="canonical">` and `og:url` pointing at
`https://the-open-accelerator.com/ecosystem/`, so that URL stays canonical even if a
GitHub Pages copy exists.

---

## 5. Documentation map

| File | Audience |
|------|----------|
| `README.md` | Everyone — what it is, run, deploy, contribute, CSV export |
| `CONTRIBUTING.md` | Contributors — entry schema, what's accepted/removed, review process |
| `MAINTAINING.md` | **Maintainers — the full triage playbook**: issue → entry, PR review, publish, field cheat-sheets, flag handling, CI error decoder. Written for people who don't use Git daily; nearly all of it is point-and-click on github.com |
| `docs/add-an-entry-walkthrough.md` | The friendly 10-minute hand-to-anyone version of the above |
| `PROJECT_STATE.md` | This file — handoff/context |

---

## 6. Status & known gaps

**Done:** four views · 144 verified entries · TOA branding · GitHub contribution loop ·
CI validation + auto badge · auto-deploy on merge + Slack notifications · suggestion bot
(issue → draft PR) · maintainer docs · CSV export · `lastVerified` freshness field + stale
report · shareable deep links (`?entry=` / `#view`) · HTML-escaped rendering · MIT licence ·
live at `/ecosystem/`.

**Open items / ideas, roughly by value:**

1. **Basemap migration off CARTO raster** — CARTO's raster basemaps are officially
   "being retired" (no date); the free `?key=` fix (2026-08-28) is a patch, not a home.
   Recommended destination (researched 2026-08-28): **OpenFreeMap** via the
   `maplibre-gl-leaflet` binding — keyless, unlimited, commercial use permitted, dark +
   light styles, ~15-line buildless change, Leaflet and all marker/popup code untouched;
   VersaTiles as a one-line fallback style URL. Google Maps rejected (mandatory billing
   account + key + ToS bars its tiles in Leaflet); raw OSM tiles rejected (no dark
   style, no SLA); Stadia viable but $20/mo for for-profit-backed projects.
2. **Accessibility pass** — keyboard navigation for the Galaxy canvas, focus states,
   `prefers-reduced-motion` for the animated views, contrast audit.
5. **Mobile polish** — the Galaxy view is cramped on small screens.
6. **Self-hosted assets** — vendoring Leaflet/Tailwind/fonts/logo would remove CDN
   dependence and fix the `file://` experience. (Beyond the TOA logo, the favicon and
   `og:image` are also hot-linked — from the-open-accelerator.com and people.redhat.com.)
7. **Category balance** — `space`, `gov`, `student` are thin (4–6 entries); `vc` is heavy.
8. **Tailwind Play CDN** prints a console warning about production use; if it ever
   matters, precompile or drop it (most styling is hand-written CSS anyway).

*(Resolved 2026-08-28: README/CONTRIBUTING described a GitHub Pages deploy path that was
never how this ships — both now describe the real sync-to-site flow. `lastVerified`
freshness field + `scripts/stale.js` report shipped, all 123 entries backfilled from git
add-dates. Deep links `?entry=<id>` / `#<view>` + a drawer "Copy link" button shipped.)*

**Deliberate non-goals:** no backend/database, no build step, no auto-publishing of
community submissions, no user accounts.

---

## 7. Working here in Claude Code

- Repo root is the working directory; `main` is the only long-lived branch.
- **Always run `node scripts/validate.js` after touching `data.js`** — same check CI runs.
- Regenerate the badge (`node scripts/badge.js`) if you change the entry count locally,
  or just let CI do it on merge.
- Commit messages that close a suggestion should say `closes #NN` — it auto-closes the
  issue and links the commit for the contributor.
- To test the whole app quickly: `python3 -m http.server` and open `localhost:8000`.
  (Because of the relative `data.js` include, don't test via `file://`.)
- When adding entries in bulk, keep them inside the correct `// ---------- CATEGORY ----------`
  banner in `data.js` — order within a section doesn't matter, but the banners are how
  humans navigate the file.

# Contributing to the Boston AI Atlas

Thanks for keeping Boston's AI map alive. Two ways to contribute, pick your comfort level:

## 1. No Git required

- **Suggest a new entry:** [open a suggestion form](../../issues/new?template=suggest-entry.yml)
- **Flag a problem:** [open a flag form](../../issues/new?template=flag-entry.yml) — or click
  **🚩 Flag** on any entry inside the atlas itself

A maintainer reviews each issue and turns accepted suggestions into pull requests.

## 2. Pull requests (preferred)

All data lives in [`data.js`](data.js) as one array of plain objects.

### Adding an entry

1. Fork and clone the repo
2. Add your object to the `DATA` array (keep it inside its category section — see the
   section comments)
3. Validate: `node scripts/validate.js`
4. Open a PR explaining what the org is and including a source link

### Entry schema

```js
{
  id: "acme-ai",                    // unique, kebab-case
  name: "Acme AI Labs",
  cat: "startup",                   // startup | vc | angel | accel | university |
                                    // corporate | community | event | gov | space | student
  loc: "1 Broadway, Cambridge",     // address, or neighborhood if venues vary
  lat: 42.3629, lng: -71.0838,      // must be within Greater Boston / MA
  approx: true,                     // include if coordinates are neighborhood-level
  url: "https://acme.ai",           // official site, https only
  badge: "Applications open",       // optional highlight
  desc: "1-2 factual sentences. What it is, what it does.",   // max 400 chars
  why: "One sentence on why an early-stage founder should care.",
  tags: ["robotics", "lab space"],  // 2-4 short lowercase tags
  stages: [1, 3],                   // founder stages served: 1 Spark, 2 Validate,
                                    // 3 Build, 4 Fund, 5 Scale
  links: ["csail", "engine"]        // ids of related entries (Galaxy view edges)
}
```

### What gets accepted

- **Real, active, Boston-area** (Greater Boston / Massachusetts) organizations relevant
  to AI founders
- Factual, neutral descriptions — no marketing copy, no superlatives you can't source
- Affiliation is welcome (you know your org best!) — just disclose it in the PR/issue
- One entry per organization; programs of an org get a `links` edge, not always their
  own entry (maintainer's judgment)

### What gets removed

Entries flagged as shut down, relocated out of the region, or persistently
unverifiable. When in doubt we mark things clearly rather than delete silently.

## Review process

- CI (`scripts/validate.js`) must pass: unique ids, valid category, MA coordinates,
  https links, resolvable connections
- One maintainer approval merges; data PRs deploy automatically via GitHub Pages
- Flags with a source link get fast-tracked

## Maintainers

The Open Accelerator team — reach us via
[the TOA community](https://the-open-accelerator.com/community/).

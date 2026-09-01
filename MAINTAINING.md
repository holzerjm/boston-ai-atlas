# Maintainer Guide — Boston AI Atlas

This guide is for the people who **keep the atlas up to date**. It assumes you are
comfortable using a web browser but **not** that you use Git or GitHub every day —
almost everything here is done by pointing and clicking on **github.com**.

There are two ways new information arrives:

1. **An Issue** — someone filled in the "Suggest an entry" form. It's a wish-list
   item written in plain English. *Your job: turn it into a real entry in `data.js`.*
2. **A Pull Request (PR)** — someone who knows Git already wrote the entry for you and
   is proposing the exact change. *Your job: check it and merge it.*

> **What is `data.js`?** It's the single file that holds every organization on the
> map. It's a list of "entries," and each entry is a small block of fields like
> `name`, `category`, `location`, and so on. Everything you do ends up as an edit to
> this one file.

---

## The big picture (read this once)

```
  Someone suggests       You turn it into        A robot double-checks      You publish
  an org (Issue)   ──▶    a data.js entry   ──▶   the entry (automatic) ──▶  to the live site
       │                  (Part 1 or 2)            (the green ✓ check)        (Part 3)
       │
  …or sends a ready-made edit (Pull Request) ─────────────────────────────────▶
```

- Every change to `data.js` is **automatically checked by a robot** (GitHub Actions
  CI). It catches the most common mistakes — duplicate names, bad coordinates,
  missing fields — and shows a green ✓ or a red ✗. You do **not** have to memorize the
  rules; the robot is your safety net.
- Nothing goes to the public website until **you publish it** (Part 3).

---

## Part 1 — Turn an Issue into a `data.js` entry

Use this when someone used the **"➕ Suggest an entry"** form.

> **Shortcut — let the bot draft it for you.** After you've eyeballed a
> suggestion issue and it looks real (not spam), add the **`bot:draft`** label.
> A bot reads the form, geocodes the address, builds the entry, and opens a
> **draft pull request** with a review checklist — turning the rest of this
> Part into "check the draft and merge." The bot never publishes anything; you
> still verify the org and merge (which is what puts it live). If the bot can't
> parse the form it comments on the issue and you do it by hand as below. Re-run
> after the submitter edits: remove and re-add `bot:draft`. (Requires the bot's
> token secret to be configured — see PROJECT_STATE.md §3.)

### Step 1 — Open the issue

1. Go to the repository on github.com → click the **Issues** tab.
2. Click the issue (suggestions are labelled **`new-entry`**).
3. You'll see the form they filled in: organization name, website, category,
   location, description, why it matters, stages, tags, and connections.

### Step 2 — Look up the map coordinates (the one thing the form doesn't ask for)

The form collects an **address** but not latitude/longitude. You need those two
numbers so the pin lands in the right spot.

1. Open **[Google Maps](https://www.google.com/maps)** and search the address.
2. **Right-click** the exact spot on the map.
3. The very first item in the little menu is two numbers, e.g. `42.3629, -71.0838`.
   **Click it** — that copies them.
4. The **first** number is `lat`, the **second** is `lng`.

> If the org doesn't have one fixed address (a meetup that moves around, etc.), use the
> neighborhood (e.g. "Kendall Sq") and add `approx: true` to the entry.

### Step 3 — Build the entry

Copy this template and fill it in. Field-by-field help is in
[Appendix A](#appendix-a--field-by-field-cheat-sheet); a filled-in example is below it.

```js
{id:"", name:"", cat:"", loc:"",
 lat:0, lng:0, url:"https://",
 badge:"", desc:"",
 why:"",
 tags:[], stages:[], links:[],
 added:"", lastVerified:""},
```

Three fields need a quick "translation" from the form's words into the code's words —
the tables in Appendix A do this for you:

- **Category** — the form says *"Venture Capital"*; the code wants `vc`. → see the
  [category table](#category-the-cat-field).
- **Stages** — the form has checkboxes like *"🔧 Build"*; the code wants numbers like
  `3`. → see the [stage table](#stages-the-stages-field).
- **id** — you invent this: the name in **lowercase-with-hyphens**, e.g.
  `Acme AI Labs` → `acme-ai`. Keep it short and make sure it's not already used (in the
  GitHub file view, press **`/`** or `Ctrl/Cmd-F` and search the id).

Leave `badge` empty (or delete the line) if there's nothing special. `links` is
optional — see Appendix A. For `added` **and** `lastVerified`, put **today's month** as
`"YYYY-MM"` (e.g. `"2026-08"`) — the entry joins the atlas now, and you just verified
the org by building it.

### Step 4 — Add it to `data.js` (right in the browser)

1. In the repo, click **`data.js`** to open it.
2. Click the **pencil ✏️ icon** ("Edit this file") near the top right.
3. `data.js` is split into **category sections**, each starting with a comment banner
   like `// ---------- VENTURE CAPITAL ----------`. Scroll to the section that matches
   your entry's category and paste your filled-in block on its own line **among the
   other entries there** (order within a section doesn't matter).
4. Double-check you didn't break the commas: every entry ends with `},` and the very
   last entry in the whole file ends with just `}`.

### Step 5 — Save it as a Pull Request (this is easier than it sounds)

1. Scroll to the bottom of the edit page to the **"Commit changes"** box.
2. In the message, write something like `Add Acme AI Labs (closes #12)` — putting
   **`closes #` and the issue number** automatically closes the suggestion when this
   is merged.
3. Choose **"Create a new branch for this commit and start a pull request."**
   (A "branch" is just a safe scratch copy; this keeps `main` clean until it's
   reviewed.)
4. Click **Propose changes**, then **Create pull request** on the next screen.

### Step 6 — Wait for the green check, then merge

1. On the new PR, a check named **"Validate atlas data"** runs automatically.
   - **Green ✓** → the entry is well-formed. Continue.
   - **Red ✗** → click **Details** to see what's wrong, then click the pencil ✏️ on
     `data.js` again to fix it. [Appendix D](#appendix-d--when-the-robot-complains)
     lists the common ones.
2. When it's green, click **Merge pull request** → **Confirm merge**. (If you're the
   only reviewer, you can merge your own PR.)
3. The suggestion issue closes itself. 🎉

➡️ **The change is now in the repo but not yet on the public website.** Go to
[Part 3 — Publish](#part-3--publish-to-the-live-site).

---

## Part 2 — Review & merge a Pull Request that edits `data.js`

Use this when a contributor (someone who knows Git) opened a PR themselves. You're the
reviewer, not the author — most of the work is already done.

### Step 1 — Open the PR

1. Repo → **Pull requests** tab → click the PR.

### Step 2 — Check the robot's verdict first

Scroll to the bottom of the **Conversation** tab:

- **Green ✓ "All checks have passed"** → the data is structurally valid. Good sign.
- **Red ✗** → click **Details**. The contributor needs to fix it. Leave a friendly
  comment pointing them to the error (see [Appendix D](#appendix-d--when-the-robot-complains)),
  and wait — the check re-runs every time they push a fix.

The robot checks structure (no duplicates, valid category, MA coordinates, `https`
links, etc.). It does **not** know whether the org is *real and relevant* — that part
is your judgment, next.

### Step 3 — Read the actual change

1. Click the **Files changed** tab. Added lines are green, removed lines are red.
2. Sanity-check the new entry against this short checklist:

   - [ ] **Real, active, Greater-Boston / Massachusetts** organization relevant to AI founders
   - [ ] **Factual, neutral description** — no marketing hype or unverifiable superlatives
   - [ ] **Website works** and is the official one (click it)
   - [ ] **Right category** and the **pin location looks correct** (paste the lat/lng into
         Google Maps if unsure)
   - [ ] **No duplicate** of an org already in the atlas
   - [ ] **Carries a current `lastVerified`** (this month, or close to it) — it should
         reflect when the org was actually checked
   - [ ] If the author is **affiliated** with the org, they disclosed it (that's allowed —
         just expected to be stated)

### Step 4 — Approve, or ask for changes

- All good? Click **Review changes** (top right of *Files changed*) → **Approve** →
  **Submit review**.
- Needs a tweak? Same menu → **Request changes**, write what's needed, **Submit
  review**. You can also click the **`+`** on any specific line to comment on it
  directly.

### Step 5 — Merge

Once it's green and approved, click **Merge pull request** → **Confirm merge**.
Prefer **"Squash and merge"** if offered (it keeps history tidy — one clean entry per
contribution).

➡️ Now publish it → [Part 3](#part-3--publish-to-the-live-site).

---

## Part 3 — Publish to the live site

**Publishing is automatic.** When a change to `index.html` or `data.js` lands on
`main` (i.e. when you merge a PR, or the robot pushes the badge), a GitHub Action
re-checks the data and copies both files to the web server. Within about a minute
the public atlas at **the-open-accelerator.com/ecosystem** shows the change, and a
summary lands in the TOA Slack channel (what deployed, which entries are new or
updated — or a 🚨 alert if the deploy failed, in which case the live site is simply
unchanged).

So: **merging IS publishing.** There is no step 3 anymore.

If the deploy ever fails (red ✗ on the "Deploy to TOA site" action, or the 🚨 Slack
message): open the failed run from the Actions tab to see why, and know the live site
still serves the previous version — nothing half-deploys. A deploy can also be
triggered by hand from the **Actions tab → Deploy to TOA site → Run workflow**.

Manual fallback (only if GitHub Actions is unavailable), from a computer with the
repo checked out and SSH access to the server:

```bash
git pull
./scripts/sync-to-site.sh <destination>   # copies index.html + data.js
```

---

## The monthly freshness sweep

Every entry carries a `lastVerified` month — the month a maintainer last confirmed the
org is real, active, and the entry's facts are right.

> **The robot starts this for you.** On the 1st of each month, the "Monthly health
> check" action posts two lists to the TOA Slack: URLs that are **broken or have
> moved** (fix these first — a dead link on a "verified" atlas is the worst look),
> and the ~13 entries longest without a check — your 20-minute queue. The same
> report is in the action's job summary, or run it yourself:
> `node scripts/linkcheck.js` and `node scripts/stale.js --queue 13`.

To keep those honest, do a small sweep about once a month:

1. Run `node scripts/stale.js` on your computer — it lists the entries that have gone
   longest without a check. (No terminal? The robot prints the same list in the **job
   summary** of every CI run.)
2. For each stale org: open its website, fix anything that changed — or confirm it's
   all still right.
3. Bump `lastVerified` to the current month for each one you checked, and put them all
   in **one PR**.

With ~123 entries on a 12-month cycle, that's roughly **10 re-checks a month — a
20–30 minute session**.

---

## Appendix A — Field-by-field cheat sheet

Every entry has these fields. ⭐ = required.

| Field | ⭐ | What to put | Example |
|------|----|-------------|---------|
| `id` | ⭐ | A unique nickname in **lowercase-with-hyphens**. Invent it from the name. | `"acme-ai"` |
| `name` | ⭐ | The display name (must be unique). | `"Acme AI Labs"` |
| `cat` | ⭐ | The category **key** — translate from the form using the table below. | `"startup"` |
| `loc` | ⭐ | Street address, or neighborhood if it moves around. | `"1 Broadway, Cambridge"` |
| `lat` | ⭐ | First coordinate from Google Maps. | `42.3629` |
| `lng` | ⭐ | Second coordinate from Google Maps. | `-71.0838` |
| `approx` |  | Add `approx: true` **only** if the location is neighborhood-level, not exact. | `true` |
| `url` | ⭐ | Official website. **Must start with `https://`**. | `"https://acme.ai"` |
| `badge` |  | A short highlight, or omit. | `"Applications open"` |
| `desc` | ⭐ | 1–2 factual sentences (**max 400 characters**). | `"A robotics-AI startup…"` |
| `why` |  | One sentence on why an early-stage founder should care. | `"Hires from hackathons…"` |
| `tags` |  | 2–4 short lowercase tags. | `["robotics", "lab space"]` |
| `stages` |  | Which founder stages it serves — **numbers**, see table below. | `[1, 3]` |
| `links` |  | `id`s of related entries (draws lines in the Galaxy view). Optional. | `["csail", "engine"]` |
| `offers` |  | What founders **get**, 1–4 of: `funding` (invests) · `grants` (equity-free money) · `space` · `compute` · `mentorship` · `community` · `talent` · `customers` (pilots/buyers). Powers the Directory's "I need…" filter. The suggestion form asks this as checkboxes. | `["funding","mentorship"]` |
| `applyBy` |  | `"rolling"`, or the **current application deadline** as `"YYYY-MM-DD"`. Shows "Applications open" in the app; past dates auto-hide and the robot warns so you clear or roll them. Only for orgs with a real application (accelerators, grants, programs). | `"2026-10-15"` |
| `applyNote` |  | Short label next to the deadline, max 40 chars. | `"Fall 2026 cohort"` |
| `facts` |  | Optional "at a glance" table, 1–6 `[label, value]` rows. Labels must be one of: Check size, Stage, Terms, Equity, Board seat, Program length, Cohort size, Focus. Facts rot — only add ones you'd bet on, and re-check them at `lastVerified` time. | `[["Check size","$500K–$2M"]]` |
| `added` |  | The month (`"YYYY-MM"`) the entry **joined the atlas** — set it once to the current month and never change it. Powers the "✨ New" chips, the new-this-month banner, and the "Recently added" sort. | `"2026-08"` |
| `lastVerified` |  | The month (`"YYYY-MM"`) a maintainer last **confirmed the org is real, active, and the facts are right** — set it when you actually checked the org, not merely when you edited the entry. New entry → today's month. The robot only warns if it's missing, but always set it. | `"2026-08"` |

### Category (the `cat` field)

The suggestion form uses friendly labels; `data.js` uses the short key on the right.

| Form says… | Use `cat:` |
|------------|------------|
| AI Companies & Startups | `"startup"` |
| Venture Capital | `"vc"` |
| Angel Groups | `"angel"` |
| Accelerators & Founder Support | `"accel"` |
| University Labs & Centers | `"university"` |
| Corporate AI Labs | `"corporate"` |
| Communities & Meetups | `"community"` |
| Major Events | `"event"` |
| Government & Policy | `"gov"` |
| Spaces & Hubs | `"space"` |
| Student Groups | `"student"` |

### Stages (the `stages` field)

The form has checkboxes; put the matching **numbers** in a list. List every box they
ticked, e.g. Build + Fund → `stages: [3, 4]`.

| Form checkbox | Number |
|---------------|--------|
| 💡 Spark — learn & plug in | `1` |
| 🔬 Validate — test the idea | `2` |
| 🔧 Build — team, space & compute | `3` |
| 💸 Fund — raise your first round | `4` |
| 🚀 Scale — grow & lead | `5` |

### `links` (optional, for the Galaxy view)

If the suggestion lists "Connected entries" (e.g. *"spun out of MIT CSAIL"*), find that
org already in `data.js`, copy its `id`, and add it to `links`. If you can't find a
match, just leave `links` empty (`[]`). Wrong/unknown ids are caught by the robot.

---

## Appendix B — A complete, filled-in example

A suggestion comes in:

> **Organization:** Acme AI Labs · **Website:** https://acme.ai · **Category:**
> AI Companies & Startups · **Location:** 1 Broadway, Cambridge · **Description:**
> "Robotics-AI startup building warehouse pick-and-place arms." · **Why:** "Hires
> interns straight out of MIT hackathons." · **Stages:** ☑ Build ☑ Fund ·
> **Tags:** robotics, warehouse

You look up `1 Broadway, Cambridge` in Google Maps → `42.3629, -71.0838`, and you write:

```js
{id:"acme-ai", name:"Acme AI Labs", cat:"startup", loc:"1 Broadway, Cambridge",
 lat:42.3629, lng:-71.0838, url:"https://acme.ai",
 desc:"Robotics-AI startup building warehouse pick-and-place arms.",
 why:"Hires interns straight out of MIT hackathons.",
 tags:["robotics","warehouse"], stages:[3,4], links:[],
 added:"2026-08", lastVerified:"2026-08"},
```

…and paste it into the `// ---------- AI COMPANIES & STARTUPS ----------` section of
`data.js`.

---

## Appendix C — Handling "🚩 Flag" issues (updates & removals)

A **Flag** issue reports that an existing entry is wrong (shut down, moved, wrong
category, dead link…). The fix is the same kind of `data.js` edit:

1. Open the flag issue; note the **entry id** it names and what's wrong.
2. Edit `data.js` (pencil ✏️), press **`/`** or `Ctrl/Cmd-F` and search that **id** to
   jump to the entry.
3. Then:
   - **Outdated info / wrong category / wrong location** → fix the relevant field(s).
   - **Moved out of the region or shut down** → delete the whole entry block. Also
     **search the file for its id in other entries' `links`** and remove it there, or
     the robot will complain about a broken connection.
4. Commit with `Fix <name> per flag (closes #NN)` → open the PR → green check → merge →
   [publish](#part-3--publish-to-the-live-site).

> **Resolving a flag counts as re-verifying.** Whenever you keep the entry — you fixed
> something, *or* you checked and it was already correct — set its `lastVerified` to the
> current month (`"YYYY-MM"`). "I looked, and it's fine" is exactly the information the
> field records.

### When to bump `lastVerified` — and when not to

- **Bump it** whenever you actually looked at the org: building a new entry, resolving a
  flag, or a fact-check edit where you opened the org's site and confirmed things.
- **Don't bump it** on mechanical edits — fixing a tag typo, adding a `links` edge,
  reformatting. Bumping without looking corrupts the signal: the field is only useful if
  it truly means "a human checked this org then."

---

## Appendix D — When the robot complains

Open the failed **"Validate atlas data"** check → **Details** to see the message.
Common ones:

| Message contains… | Fix |
|-------------------|-----|
| `duplicate id` / `duplicate name` | That org (or id) is already in the atlas. Pick a new `id`, or it's a true duplicate — close the issue/PR instead. |
| `id must be kebab-case` | Use only lowercase letters, numbers, and hyphens: `acme-ai`, not `Acme_AI`. |
| `unknown category` | The `cat` value must be one of the **keys** in the category table (`vc`, `startup`, …), not the friendly label. |
| `coordinates … outside … bounds` | A typo in lat/lng, or they're swapped. For Boston, `lat` is around **42** and `lng` is **negative**, around **-71**. |
| `url must start with https://` | Add `https://`, and make sure it isn't `http://`. |
| `desc too long` | Trim the description to 400 characters or fewer. |
| `links to unknown entry` | A value in `links` doesn't match any `id`. Fix the spelling or remove it. |
| `missing lastVerified` (a ⚠ warning, not a failure) | Add the month you last confirmed this entry: `lastVerified:"YYYY-MM"`. |
| `lastVerified must be a "YYYY-MM" string` | Fix the format: four-digit year, hyphen, two-digit month — e.g. `2026-08`. |
| `lastVerified … is in the future` | Check the date — it can't be later than the current month. |
| `looks like a typo (before 2020)` | The year in `lastVerified` is wrong — fix it (e.g. a mistyped `2016` for `2026`). |

You can re-run the check just by editing the file again and committing — every commit
re-runs the robot automatically.

---

*Maintained by The Open Accelerator. Schema reference: [`CONTRIBUTING.md`](CONTRIBUTING.md).
The robot's exact rules live in [`scripts/validate.js`](scripts/validate.js).*

#!/usr/bin/env node
/*
 * issue-to-entry.js — turn a "new-entry" issue-form submission into a draft
 * data.js entry. Run by .github/workflows/suggest-to-pr.yml; can be tested
 * locally with:  GITHUB_EVENT_PATH=<event.json> RUNNER_TEMP=<dir> node scripts/issue-to-entry.js
 *
 * SECURITY MODEL (do not weaken):
 *  - The issue body is attacker-controlled text. It is read from the event
 *    payload FILE (never interpolated through a shell) and every string that
 *    ends up in data.js is serialized with JSON.stringify, so it can never
 *    escape a JS string literal. HTML in text fields is additionally rejected
 *    by scripts/validate.js and escaped at render time by the app.
 *  - This script only writes: data.js (in the checkout) and status/report
 *    files under RUNNER_TEMP. It never executes issue-derived content.
 *
 * Outputs (written to $GITHUB_OUTPUT when set):
 *  status=ok|duplicate|parse_failed   id=<entry id>   branch=<branch name>
 * Files (under $RUNNER_TEMP): pr-title.txt, pr-body.md, issue-comment.md
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const TMP = process.env.RUNNER_TEMP || path.join(ROOT, ".bot-tmp");
fs.mkdirSync(TMP, { recursive: true });

// ---------- load event ----------
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const issue = event.issue;
const body = issue.body || "";
const N = issue.number;
const submitter = (issue.user && issue.user.login) || "unknown";

// ---------- load current dataset ----------
const src = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={CATS,STAGES,DATA};")(mod, mod.exports);
const { CATS, DATA } = mod.exports;

// ---------- parse the issue-form body ("### Label\n\nvalue") ----------
function parseForm(text) {
  const fields = {};
  const parts = text.split(/^### +/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    if (nl === -1) continue;
    const label = part.slice(0, nl).trim();
    let value = part.slice(nl + 1).trim();
    if (value === "_No response_") value = "";
    fields[label] = value;
  }
  return fields;
}
const form = parseForm(body);
const get = (label) => (form[label] || "").trim();

const CAT_BY_LABEL = Object.create(null);
for (const [key, v] of Object.entries(CATS)) CAT_BY_LABEL[v.label.toLowerCase()] = key;

const STAGE_WORDS = [[/spark/i, 1], [/validate/i, 2], [/build/i, 3], [/fund/i, 4], [/scale/i, 5]];
function parseStages(section) {
  const out = [];
  for (const line of section.split("\n")) {
    const m = line.match(/^- \[[xX]\] (.+)$/);
    if (!m) continue;
    for (const [re, n] of STAGE_WORDS) if (re.test(m[1]) && !out.includes(n)) out.push(n);
  }
  return out.sort();
}

const name = get("Organization name").replace(/\s+/g, " ").trim();
let url = get("Official website");
const catLabel = get("Category");
const loc = get("Address or neighborhood").replace(/\s+/g, " ").trim();
const desc = get("Description").replace(/\s+/g, " ").trim();
const why = get("Why it matters for founders").replace(/\s+/g, " ").trim();
const stages = parseStages(form["Which founder stages does it serve?"] || "");
const tags = get("Tags").split(",").map(t => t.trim()).filter(Boolean).slice(0, 4);
const connectionsText = get("Connected entries (optional)");

// ---------- helpers for reporting ----------
const fence = (s) => "```text\n" + String(s).replace(/```/g, "ʼʼʼ") + "\n```";
function finish(status, extras = {}) {
  if (process.env.GITHUB_OUTPUT) {
    const lines = Object.entries({ status, ...extras }).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
    fs.appendFileSync(process.env.GITHUB_OUTPUT, lines);
  }
  console.log(`status: ${status}`, extras);
  process.exit(0);
}

// ---------- basic validation of the submission ----------
const problems = [];
if (!name) problems.push("**Organization name** is missing.");
if (!url) problems.push("**Official website** is missing.");
else if (/^http:\/\//.test(url)) url = url.replace(/^http:\/\//, "https://");
if (url && !/^https:\/\/[^\s"'<>\\]+$/.test(url)) problems.push("**Official website** doesn't look like a plain https:// URL.");
const catKey = catLabel.toLowerCase();
const cat = Object.hasOwn(CAT_BY_LABEL, catKey) ? CAT_BY_LABEL[catKey] : undefined;
if (!cat) problems.push(`**Category** "${catLabel}" doesn't match a known category.`);
if (!loc) problems.push("**Address or neighborhood** is missing.");
if (!desc) problems.push("**Description** is missing.");
if (problems.length) {
  fs.writeFileSync(path.join(TMP, "issue-comment.md"),
    `Thanks for the suggestion! I couldn't turn it into a draft entry automatically:\n\n` +
    problems.map(p => `- ${p}`).join("\n") +
    `\n\nA maintainer will pick it up by hand (see MAINTAINING.md Part 1), or you can edit the issue and a maintainer can re-run the bot by removing and re-adding the \`new-entry\` label.`);
  finish("parse_failed");
}

// ---------- id + duplicate check ----------
const id = name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30).replace(/-+$/g, "");
const nameKey = name.toLowerCase();
const dupe = DATA.find(d => d.id === id || d.name.toLowerCase() === nameKey);
if (dupe) {
  fs.writeFileSync(path.join(TMP, "issue-comment.md"),
    `Thanks for the suggestion! **${dupe.name}** already appears to be in the atlas ` +
    `(entry id \`${dupe.id}\`). If something about that entry is wrong or outdated, ` +
    `please use the 🚩 Flag button on the entry instead.`);
  finish("duplicate", { id: dupe.id });
}

// ---------- resolve suggested connections to real ids ----------
const links = [];
if (connectionsText) {
  const lower = connectionsText.toLowerCase();
  for (const d of DATA)
    if (lower.includes(d.id) || lower.includes(d.name.toLowerCase()))
      if (!links.includes(d.id)) links.push(d.id);
}

// ---------- geocode (Nominatim, one request, proper UA) ----------
function geocode(q) {
  const qs = new URLSearchParams({ q, format: "json", limit: "1", countrycodes: "us" });
  return new Promise((resolve) => {
    const req = https.get({
      host: "nominatim.openstreetmap.org",
      path: "/search?" + qs.toString(),
      headers: { "User-Agent": "boston-ai-atlas-bot/1.0 (github.com/holzerjm/boston-ai-atlas)" },
      timeout: 10000,
    }, (res) => {
      let buf = "";
      res.on("data", (c) => buf += c);
      res.on("end", () => { try { resolve(JSON.parse(buf)[0] || null); } catch { resolve(null); } });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

(async () => {
  const query = /massachusetts|,\s*ma\b/i.test(loc) ? loc : loc + ", Massachusetts";
  const hit = await geocode(query);
  let lat = 0, lng = 0, geocoded = false;
  if (hit) {
    const la = +(+hit.lat).toFixed(4), ln = +(+hit.lon).toFixed(4);
    if (la >= 41.5 && la <= 43 && ln >= -73.5 && ln <= -70.5) { lat = la; lng = ln; geocoded = true; }
  }

  // ---------- build the entry (every user string via JSON.stringify) ----------
  const month = new Date().toISOString().slice(0, 7);
  const J = JSON.stringify;
  let entry = `{id:${J(id)}, name:${J(name)}, cat:${J(cat)}, loc:${J(loc)}, approx:true,\n` +
    ` lat:${lat}, lng:${lng}, url:${J(url)},\n` +
    ` desc:${J(desc)},\n` +
    (why ? ` why:${J(why)},\n` : "") +
    ` tags:[${tags.map(t => J(t)).join(",")}], stages:[${stages.join(",")}]` +
    (links.length ? `, links:[${links.map(l => J(l)).join(",")}]` : "") +
    `, lastVerified:${J(month)}},`;

  // ---------- splice into the right category section ----------
  const BANNER = {
    university: "UNIVERSITY LABS & CENTERS", corporate: "CORPORATE AI LABS",
    startup: "STARTUPS / AI COMPANIES", vc: "VENTURE CAPITAL", angel: "ANGEL GROUPS",
    accel: "ACCELERATORS & FOUNDER SUPPORT", space: "SPACES & HUBS",
    community: "COMMUNITIES & MEETUPS", student: "STUDENT GROUPS",
    event: "MAJOR EVENTS", gov: "GOVERNMENT & POLICY",
  };
  const lines = src.split("\n");
  const isBanner = (l) => /^\/\/ -{5,} .+ -{5,}$/.test(l);
  const start = lines.findIndex(l => isBanner(l) && l.includes(BANNER[cat]));
  if (start === -1) { console.error(`section banner for "${cat}" not found`); process.exit(1); }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++)
    if (isBanner(lines[i]) || /^\];/.test(lines[i])) { end = i; break; }
  while (end > start && lines[end - 1].trim() === "") end--;
  lines.splice(end, 0, entry);
  fs.writeFileSync(path.join(ROOT, "data.js"), lines.join("\n"));

  // ---------- run the validator and capture its verdict ----------
  const { spawnSync } = require("child_process");
  const val = spawnSync("node", [path.join(ROOT, "scripts", "validate.js")], { encoding: "utf8" });
  const valOut = (val.stdout || "") + (val.stderr || "");

  // ---------- write PR title/body + issue comment (files, not shell) ----------
  // Title becomes a commit subject → the deploy Slack message renders it as
  // mrkdwn, so strip characters that could inject links/formatting there.
  const safeTitle = name.replace(/[`<>|*_~[\](){}\r\n]/g, " ").replace(/\s+/g, " ").trim();
  fs.writeFileSync(path.join(TMP, "pr-title.txt"), `[Suggestion] ${safeTitle}`.slice(0, 200) + "\n");
  fs.writeFileSync(path.join(TMP, "pr-body.md"), [
    `Drafted automatically from #${N} (submitted by @${submitter}). Closes #${N}.`,
    ``,
    `| field | value |`,
    `|---|---|`,
    `| id | \`${id}\` |`,
    `| category | \`${cat}\` |`,
    `| pin | ${geocoded ? `${lat}, ${lng} — geocoded via Nominatim (© OpenStreetMap contributors) from \`${query.replace(/[`|\r\n]/g, " ")}\`, marked \`approx:true\`` : "**GEOCODING FAILED** — lat/lng are 0,0 and CI is red on purpose; fix the pin before merge"} |`,
    `| stages | ${stages.join(", ") || "(none given)"} |`,
    ``,
    `Submitted text (already serialized safely into \`data.js\`; edit for house voice before merge):`,
    ``,
    fence(`desc: ${desc}\nwhy: ${why || "(none)"}\ntags: ${tags.join(", ") || "(none)"}\nconnections: ${connectionsText || "(none)"}`),
    ``,
    `Validator on this branch:`,
    ``,
    fence(valOut.trim().split("\n").slice(-12).join("\n")),
    ``,
    `**Maintainer checklist — merging publishes to the live site:**`,
    `- [ ] Opened the org's website; it is real, active, and Boston-area`,
    `- [ ] Pin location is right (fix coordinates / remove \`approx\` if exact)`,
    `- [ ] \`desc\` is factual + neutral, \`why\` is founder-useful (rewrite as needed)`,
    `- [ ] Category and stages are honest`,
    `- [ ] Merging attests you verified this entry (\`lastVerified\` is pre-stamped ${month})`,
  ].join("\n"));
  fs.writeFileSync(path.join(TMP, "issue-comment.md"),
    `Thanks @${submitter}! I've drafted this as a pull request for a maintainer to review — ` +
    `it will appear on the live atlas once a maintainer verifies and merges it.`);

  finish("ok", { id, branch: `suggestion/issue-${N}` });
})();

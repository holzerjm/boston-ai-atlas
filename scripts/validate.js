#!/usr/bin/env node
/* Validates data.js — run locally before opening a PR:  node scripts/validate.js */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={CATS,STAGES,DATA};")(mod, mod.exports);
const { CATS, STAGES, DATA } = mod.exports;

const errors = [];
const warn = [];
const err = (id, msg) => errors.push(`  ✗ [${id}] ${msg}`);

const ids = new Set();
const names = new Set();
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const TODAY = new Date().toISOString().slice(0, 10);
const OFFERS = new Set(["funding","grants","space","compute","mentorship","community","talent","customers"]);
const FACT_LABELS = new Set(["Check size","Stage","Terms","Equity","Board seat","Program length","Cohort size","Focus"]);
// canonical tag vocabulary — unknown tags only WARN (contributors may propose new
// ones; a maintainer either maps them to an existing tag or adds them here)
const TAGS = new Set(["pre-seed","seed","multi-stage","equity-free","strategic","venture studio",
  "incubator","research","applied AI","AI-native","generative AI","edge AI","ML","infrastructure",
  "open source","AI safety","deep tech","robotics","security","policy","defense","enterprise",
  "consumer","healthcare","biotech","fintech","education","climate","industrial","students",
  "founders","diverse founders","MIT spinout","co-living","coworking","lab space","events",
  "hackathons","MIT","Harvard","Tufts","Babson","Northeastern","BU","BC"]);
const THIS_MONTH = new Date().toISOString().slice(0, 7);   // current UTC month
const validStages = new Set(STAGES.map(s => s.n));

for (const d of DATA) {
  const id = d.id || "(missing id)";
  if (!d.id) err(id, "missing id");
  else {
    if (!KEBAB.test(d.id)) err(id, "id must be kebab-case (a-z, 0-9, hyphens)");
    if (ids.has(d.id)) err(id, "duplicate id");
    ids.add(d.id);
  }
  if (!d.name) err(id, "missing name");
  else {
    const key = d.name.toLowerCase();
    if (names.has(key)) err(id, `duplicate name "${d.name}"`);
    names.add(key);
  }
  if (!CATS[d.cat]) err(id, `unknown category "${d.cat}" (valid: ${Object.keys(CATS).join(", ")})`);
  if (typeof d.lat !== "number" || typeof d.lng !== "number")
    err(id, "lat/lng must be numbers");
  else if (d.lat < 41.5 || d.lat > 43 || d.lng < -73.5 || d.lng > -70.5)
    err(id, `coordinates (${d.lat}, ${d.lng}) outside Greater Boston / Massachusetts bounds`);
  if (!d.url || !/^https:\/\//.test(d.url)) err(id, "url must start with https://");
  else if (/[\s"'<>\\]/.test(d.url)) err(id, "url contains characters unsafe in a link");
  if (!d.loc) err(id, "missing loc (address or neighborhood)");
  if (!d.desc) err(id, "missing desc");
  else if (d.desc.length > 400) err(id, `desc too long (${d.desc.length} chars, max 400)`);
  // text fields are prose — HTML has no legitimate use here and is an XSS vector
  for (const [f, v] of [["name", d.name], ["loc", d.loc], ["desc", d.desc],
                        ["why", d.why], ["badge", d.badge]])
    if (typeof v === "string" && /[<>]/.test(v))
      err(id, `${f} must not contain < or > (HTML is not allowed in entry text)`);
  for (const t of d.tags || []) {
    if (typeof t === "string" && /[<>]/.test(t))
      err(id, `tag ${JSON.stringify(t)} must not contain < or > (HTML is not allowed)`);
    else if (typeof t === "string" && !TAGS.has(t))
      warn.push(`  ⚠ [${id}] tag ${JSON.stringify(t)} is not in the canonical vocabulary (see scripts/validate.js)`);
  }
  if (!d.why) warn.push(`  ⚠ [${id}] missing "why it matters" — strongly encouraged`);
  if (!Array.isArray(d.tags) || d.tags.length < 1) warn.push(`  ⚠ [${id}] no tags`);
  for (const s of d.stages || [])
    if (!validStages.has(s)) err(id, `invalid stage ${s} (valid: 1-5)`);
  if (d.offers === undefined)
    warn.push(`  ⚠ [${id}] missing offers — what does this org give founders? (funding, grants, space, compute, mentorship, community, talent, customers)`);
  else if (!Array.isArray(d.offers) || d.offers.length < 1 || d.offers.length > 4)
    err(id, "offers must be an array of 1-4 values");
  else for (const o of d.offers)
    if (!OFFERS.has(o)) err(id, `unknown offer "${o}" (valid: ${[...OFFERS].join(", ")})`);
  if (d.applyBy !== undefined) {
    if (d.applyBy !== "rolling" && (typeof d.applyBy !== "string" || !YMD.test(d.applyBy)))
      err(id, `applyBy must be "rolling" or a "YYYY-MM-DD" date (got ${JSON.stringify(d.applyBy)})`);
    else if (d.applyBy !== "rolling" && d.applyBy < TODAY)
      warn.push(`  ⚠ [${id}] applyBy ${d.applyBy} has passed — set the next deadline or remove it`);
  }
  if (d.applyNote !== undefined &&
      (typeof d.applyNote !== "string" || d.applyNote.length > 40 || /[<>]/.test(d.applyNote)))
    err(id, "applyNote must be a short string (max 40 chars, no HTML)");
  if (d.facts !== undefined) {
    if (!Array.isArray(d.facts) || d.facts.length < 1 || d.facts.length > 6)
      err(id, "facts must be an array of 1-6 [label, value] pairs");
    else for (const f of d.facts) {
      if (!Array.isArray(f) || f.length !== 2 || typeof f[0] !== "string" || typeof f[1] !== "string")
        { err(id, "each fact must be a [label, value] pair of strings"); break; }
      if (!FACT_LABELS.has(f[0])) err(id, `unknown fact label ${JSON.stringify(f[0])} (valid: ${[...FACT_LABELS].join(", ")})`);
      if (f[1].length > 48) err(id, `fact "${f[0]}" value too long (max 48 chars)`);
      if (/[<>]/.test(f[0] + f[1])) err(id, "facts must not contain < or > (HTML is not allowed)");
    }
  }
  if (d.added === undefined)
    warn.push(`  ⚠ [${id}] missing added — the month the entry joined the atlas ("YYYY-MM")`);
  else if (typeof d.added !== "string" || !YYYY_MM.test(d.added))
    err(id, `added must be a "YYYY-MM" string (got ${JSON.stringify(d.added)})`);
  else if (d.added > THIS_MONTH)
    err(id, `added ${d.added} is in the future`);
  if (d.lastVerified === undefined)
    warn.push(`  ⚠ [${id}] missing lastVerified — add the month this entry was last confirmed ("YYYY-MM")`);
  else if (typeof d.lastVerified !== "string" || !YYYY_MM.test(d.lastVerified))
    err(id, `lastVerified must be a "YYYY-MM" string (got ${JSON.stringify(d.lastVerified)})`);
  else if (d.lastVerified > THIS_MONTH)
    err(id, `lastVerified ${d.lastVerified} is in the future`);
  else if (d.lastVerified < "2020-01")
    err(id, `lastVerified ${d.lastVerified} looks like a typo (before 2020)`);
}
// resolve links after all ids known
for (const d of DATA)
  for (const l of d.links || [])
    if (!ids.has(l)) err(d.id, `links to unknown entry "${l}"`);

console.log(`Boston AI Atlas — validating ${DATA.length} entries, ${Object.keys(CATS).length} categories\n`);
if (warn.length) console.log("Warnings:\n" + warn.join("\n") + "\n");
if (errors.length) {
  console.log("Errors:\n" + errors.join("\n"));
  console.log(`\nFAILED: ${errors.length} error(s).`);
  process.exit(1);
}
console.log("PASSED: data.js is valid.");

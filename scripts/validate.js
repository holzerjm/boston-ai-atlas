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
  if (!d.loc) err(id, "missing loc (address or neighborhood)");
  if (!d.desc) err(id, "missing desc");
  else if (d.desc.length > 400) err(id, `desc too long (${d.desc.length} chars, max 400)`);
  if (!d.why) warn.push(`  ⚠ [${id}] missing "why it matters" — strongly encouraged`);
  if (!Array.isArray(d.tags) || d.tags.length < 1) warn.push(`  ⚠ [${id}] no tags`);
  for (const s of d.stages || [])
    if (!validStages.has(s)) err(id, `invalid stage ${s} (valid: 1-5)`);
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

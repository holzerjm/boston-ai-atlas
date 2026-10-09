#!/usr/bin/env node
/* Validates data/*.yml — run locally before opening a PR:  node scripts/validate.js
   Per-field rules (types, formats, lengths, allowed values, no HTML) live in
   data/*.schema.yml. This script runs those schemas, then the checks a schema
   can't express: uniqueness, references across files, links between entries,
   dates relative to today, and warnings. */
const { checkData } = require("./load-data");

let checked;
try { checked = checkData(); }
catch (e) {   // YAML syntax error — js-yaml's message names the file, line and column
  console.log(`FAILED: ${e.message}`);
  process.exit(1);
}
const { atlas, errors: schemaErrors } = checked;
const { CATS, STAGES, DATA } = atlas;

console.log(`Mass AI Atlas — validating ${DATA.length} entries, ${Object.keys(CATS).length} categories\n`);
if (schemaErrors.length) {
  console.log("Schema errors:\n" + schemaErrors.join("\n"));
  console.log(`\nFAILED: ${schemaErrors.length} schema error(s). Fix these first — the remaining checks run once the schema passes.`);
  process.exit(1);
}

const errors = [];
const warn = [];
const err = (id, msg) => errors.push(`  ✗ [${id}] ${msg}`);

const ids = new Set();
const names = new Set();
const TODAY = new Date().toISOString().slice(0, 10);
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
  const id = d.id;
  if (ids.has(d.id)) err(id, "duplicate id");
  ids.add(d.id);
  const key = d.name.toLowerCase();
  if (names.has(key)) err(id, `duplicate name "${d.name}"`);
  names.add(key);
  if (!Object.hasOwn(CATS, d.cat)) err(id, `unknown category "${d.cat}" (valid: ${Object.keys(CATS).join(", ")})`);
  for (const t of d.tags || [])
    if (!TAGS.has(t))
      warn.push(`  ⚠ [${id}] tag ${JSON.stringify(t)} is not in the canonical vocabulary (see scripts/validate.js)`);
  if (!d.why) warn.push(`  ⚠ [${id}] missing "why it matters" — strongly encouraged`);
  if (!d.tags || d.tags.length < 1) warn.push(`  ⚠ [${id}] no tags`);
  for (const s of d.stages || [])
    if (!validStages.has(s)) err(id, `invalid stage ${s} (valid: ${[...validStages].join(", ")})`);
  if (d.offers === undefined)
    warn.push(`  ⚠ [${id}] missing offers — what does this org give founders? (funding, grants, space, compute, mentorship, community, talent, customers)`);
  if (d.applyBy !== undefined && d.applyBy !== "rolling" && d.applyBy < TODAY)
    warn.push(`  ⚠ [${id}] applyBy ${d.applyBy} has passed — set the next deadline or remove it`);
  if (d.added === undefined)
    warn.push(`  ⚠ [${id}] missing added — the month the entry joined the atlas ("YYYY-MM")`);
  else if (d.added > THIS_MONTH)
    err(id, `added ${d.added} is in the future`);
  if (d.lastVerified === undefined)
    warn.push(`  ⚠ [${id}] missing lastVerified — add the month this entry was last confirmed ("YYYY-MM")`);
  else if (d.lastVerified > THIS_MONTH)
    err(id, `lastVerified ${d.lastVerified} is in the future`);
  else if (d.lastVerified < "2020-01")
    err(id, `lastVerified ${d.lastVerified} looks like a typo (before 2020)`);
}
// resolve links after all ids known
for (const d of DATA)
  for (const l of d.links || [])
    if (!ids.has(l)) err(d.id, `links to unknown entry "${l}"`);

if (warn.length) console.log("Warnings:\n" + warn.join("\n") + "\n");
if (errors.length) {
  console.log("Errors:\n" + errors.join("\n"));
  console.log(`\nFAILED: ${errors.length} error(s).`);
  process.exit(1);
}
console.log("PASSED: data/ is valid.");

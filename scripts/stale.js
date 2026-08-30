#!/usr/bin/env node
/* ============================================================
   Freshness report for data.js — which entries need re-verifying?

   Usage:
     node scripts/stale.js               -> report with 12-month threshold
     node scripts/stale.js --months 6    -> custom threshold
     node scripts/stale.js --queue 13    -> the N least-recently-verified
                                            entries (the monthly rota)

   lastVerified is the month ("YYYY-MM") a maintainer last confirmed
   the org is real, active, and the entry's facts are right.
   This script is a report, not a gate — it always exits 0.
   ============================================================ */
const fs = require("fs");
const path = require("path");

// --- Load data.js exactly like validate.js / badge.js do ---
const src = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={CATS,STAGES,DATA};")(mod, mod.exports);
const { DATA } = mod.exports;

// --- Threshold: default 12 months, override with --months N ---
let months = 12;
const argv = process.argv.slice(2);
const i = argv.indexOf("--months");
if (i !== -1 && argv[i + 1]) months = parseInt(argv[i + 1], 10);
for (const a of argv) {
  const m = a.match(/^--months=(\d+)$/);
  if (m) months = parseInt(m[1], 10);
}

// --- Rota mode: the N least-recently-verified entries, oldest first ---
const qi = argv.indexOf("--queue");
if (qi !== -1) {
  const n = Math.max(1, parseInt(argv[qi + 1], 10) || 13);
  const queue = [...DATA].sort((a, b) =>
    (a.lastVerified || "0000-00").localeCompare(b.lastVerified || "0000-00")).slice(0, n);
  console.log(`Verification rota — the ${queue.length} entries longest without a check:`);
  for (const d of queue)
    console.log(`  ${d.lastVerified || "never"}  ${d.name} — ${d.url}`);
  console.log(`\nOpen each site, fix or confirm the entry, bump lastVerified to the current month, one PR.`);
  process.exit(0);
}
if (!Number.isInteger(months) || months < 1) {
  console.log("Usage: node scripts/stale.js [--months N]  (N must be a positive integer)");
  process.exit(0);
}

// --- Age in whole months relative to the current UTC month ---
const now = new Date().toISOString().slice(0, 7);          // e.g. "2026-08"
const toIndex = ym => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};
const ageOf = ym => toIndex(now) - toIndex(ym);

// --- Bucket the entries ---
const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;
const never = [];                                          // missing (or unparseable) lastVerified
const dated = [];                                          // {d, age}
for (const d of DATA) {
  if (typeof d.lastVerified === "string" && YYYY_MM.test(d.lastVerified))
    dated.push({ d, age: ageOf(d.lastVerified) });
  else never.push(d);
}
const fresh = dated.filter(x => x.age <= months);
const stale = dated.filter(x => x.age > months).sort((a, b) => (a.d.lastVerified < b.d.lastVerified ? -1 : 1));
const agingMin = Math.ceil(months * 0.75);                 // 12 -> 9, i.e. "9-12 months"
const aging = dated
  .filter(x => x.age >= agingMin && x.age <= months)
  .sort((a, b) => (a.d.lastVerified < b.d.lastVerified ? -1 : 1));

// --- Report ---
const pct = DATA.length ? Math.round((fresh.length / DATA.length) * 100) : 0;
console.log(`${fresh.length} of ${DATA.length} entries verified within the last ${months} months (${pct}%)`);

const row = x =>
  `  ${x.d.id.padEnd(22)} ${String(x.d.name).padEnd(38)} ${String(x.d.cat).padEnd(11)} ${x.d.lastVerified}  ${x.age} month${x.age === 1 ? "" : "s"} ago`;

if (stale.length) {
  console.log(`\nSTALE (> ${months} months) — ${stale.length} entr${stale.length === 1 ? "y" : "ies"}, oldest first:`);
  for (const x of stale) console.log(row(x));
}
if (aging.length) {
  console.log(`\nAGING (${agingMin}–${months} months) — due for a re-check soon:`);
  for (const x of aging) console.log(row(x));
}
if (never.length) {
  console.log(`\nNEVER VERIFIED — ${never.length} entr${never.length === 1 ? "y" : "ies"} missing lastVerified:`);
  for (const d of never) console.log(`  ${d.id.padEnd(22)} ${String(d.name).padEnd(38)} ${String(d.cat)}`);
}
process.exit(0);

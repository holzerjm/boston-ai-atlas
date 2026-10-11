/* One-time check for the data.js → data/*.yml refactor: the YAML must hold
   exactly what data.js held at the last commit before the refactor — no entry,
   field, or value added, removed, reordered, or changed.

     node --test test/data-refactor-equivalence.test.js

   Needs that commit in local git history. Not run in CI: any later data edit
   would (correctly) make it fail. */
const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("child_process");
const path = require("path");
const { loadData } = require("../scripts/load-data");

const BASE = "3ecbb31";   // main's data.js, the commit this refactor merges

// Pointed at the commit being merged, this keeps proving the YAML equals the
// data.js it replaces. It expires the next time data/ is edited, which means it
// has done its job and can go.
let src;
try {
  src = execFileSync("git", ["show", `${BASE}:data.js`],
    { cwd: path.join(__dirname, ".."), encoding: "utf8", maxBuffer: 16 << 20,
      stdio: ["ignore", "pipe", "ignore"] });
} catch {
  test.skip(`${BASE} is not in this clone's history — one-time refactor check skipped`, () => {});
  return;
}
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={CATS,STAGES,DATA};")(mod, mod.exports);
const before = mod.exports;
const after = loadData();

for (const name of ["CATS", "STAGES", "DATA"])
  test(`${name} is unchanged`, () => {
    assert.deepStrictEqual(after[name], before[name]);
    // key order too, so JSON/CSV exports come out byte-identical
    assert.strictEqual(JSON.stringify(after[name]), JSON.stringify(before[name]));
  });

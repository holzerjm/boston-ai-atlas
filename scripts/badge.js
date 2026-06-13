#!/usr/bin/env node
/* Regenerates badge.json (shields.io endpoint badge) from data.js.
   Runs automatically in CI on every merge to main. */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={DATA};")(mod, mod.exports);

const badge = {
  schemaVersion: 1,
  label: "organizations",
  message: String(mod.exports.DATA.length),
  color: "60a5fa"
};
fs.writeFileSync(path.join(__dirname, "..", "badge.json"), JSON.stringify(badge) + "\n");
console.log(`badge.json → ${badge.message} organizations`);

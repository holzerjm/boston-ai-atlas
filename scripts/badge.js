#!/usr/bin/env node
/* Regenerates badge.json (shields.io endpoint badge) from data/entities.yml.
   Runs automatically in CI on every merge to main. */
const fs = require("fs");
const path = require("path");

const { DATA } = require("./load-data").loadData();

const badge = {
  schemaVersion: 1,
  label: "organizations",
  message: String(DATA.length),
  color: "60a5fa"
};
fs.writeFileSync(path.join(__dirname, "..", "badge.json"), JSON.stringify(badge) + "\n");
console.log(`badge.json → ${badge.message} organizations`);

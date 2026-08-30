#!/usr/bin/env node
/* Link-rot checker — fetches every entry's url and classifies the result.
 * A report, not a gate: ALWAYS exits 0. Run monthly by CI (with the
 * verification rota) and postable to Slack; safe to run locally.
 *
 *   node scripts/linkcheck.js            full report
 *   node scripts/linkcheck.js --plain    terse lines only (for Slack)
 *
 * Classifications:
 *   moved    2xx but the final URL is on a different domain — update the url
 *   blocked  403/429/503 — likely bot-blocking, needs a HUMAN look, not a bot
 *   broken   404/410/other 4xx-5xx, network error, or timeout (after 1 retry)
 * Healthy URLs are counted but not listed.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={CATS,STAGES,DATA};")(mod, mod.exports);
const { DATA } = mod.exports;

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 boston-ai-atlas-linkcheck";
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

async function probe(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctl.signal,
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" } });
    clearTimeout(timer);
    if ([403, 429, 503].includes(res.status)) return { cls: "blocked", note: `HTTP ${res.status}` };
    if (!res.ok) return { cls: "broken", note: `HTTP ${res.status}` };
    if (host(res.url) && host(res.url) !== host(url)) return { cls: "moved", note: `now at ${res.url}` };
    return { cls: "ok" };
  } catch (e) {
    clearTimeout(timer);
    return { cls: "error", note: e.name === "AbortError" ? "timeout" : (e.cause?.code || e.message) };
  }
}

(async () => {
  const results = [];
  const queue = [...DATA];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const d = queue.shift();
      let r = await probe(d.url);
      if (r.cls === "error") r = await probe(d.url);           // one retry
      if (r.cls === "error") r = { cls: "broken", note: r.note };
      results.push({ id: d.id, name: d.name, url: d.url, ...r });
    }
  });
  await Promise.all(workers);

  const by = (c) => results.filter(r => r.cls === c);
  const plain = process.argv.includes("--plain");
  const line = (r) => `  ${r.id} — ${r.url} (${r.note})`;

  console.log(`Link check: ${by("ok").length} of ${results.length} URLs healthy` +
    ` · ${by("broken").length} broken · ${by("moved").length} moved · ${by("blocked").length} blocked (need a human look)`);
  if (by("broken").length) console.log(`\nBROKEN — fix or flag the entry:\n` + by("broken").map(line).join("\n"));
  if (by("moved").length) console.log(`\nMOVED — update the url field:\n` + by("moved").map(line).join("\n"));
  if (!plain && by("blocked").length)
    console.log(`\nBLOCKED — the site refuses bots; open it in a browser before assuming it's fine:\n` + by("blocked").map(line).join("\n"));
})();

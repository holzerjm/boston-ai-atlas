#!/usr/bin/env node
/* Generates the static SEO/share layer into site-pages/ (gitignored;
 * CI runs this at deploy and rsyncs the output):
 *
 *   site-pages/e/<id>/index.html   per-entry stub — entry-specific OG tags for
 *                                  link unfurls, instant redirect into the app
 *   site-pages/e/index.html        crawlable index of all organizations
 *   site-pages/sitemap.xml         main page + every entry stub
 *
 * Entry text is escaped before it touches HTML/XML (validate.js also rejects
 * angle brackets in text fields — this is the second layer).
 *
 * Usage: node scripts/build-pages.js [outdir]
 */
const fs = require("fs");
const path = require("path");

const BASE = "https://the-open-accelerator.com/ecosystem/";
const OG_IMAGE = "https://people.redhat.com/jholzer/TOA/android-icon-192x192.png";

const src = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", src + "\n;module.exports={CATS,STAGES,DATA};")(mod, mod.exports);
const { CATS, DATA } = mod.exports;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

const OUT = process.argv[2] || path.join(__dirname, "..", "site-pages");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "e"), { recursive: true });

const urls = [BASE];
for (const d of DATA) {
  const name = esc(d.name);
  const cat = esc(CATS[d.cat].label);
  const blurb = esc(clip(d.why || d.desc, 200));
  const stubUrl = `${BASE}e/${d.id}/`;
  const app = `../../?entry=${d.id}`;
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — Boston AI Atlas</title>
<meta name="description" content="${esc(clip(d.desc, 200))}">
<link rel="canonical" href="${BASE}?entry=${d.id}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Boston AI Atlas">
<meta property="og:title" content="${name} — ${cat} · Boston AI Atlas">
<meta property="og:description" content="${blurb}">
<meta property="og:url" content="${stubUrl}">
<meta property="og:image" content="${OG_IMAGE}">
<meta name="twitter:card" content="summary">
<meta http-equiv="refresh" content="0;url=${app}">
<script>location.replace(${JSON.stringify(app)});</script>
</head><body>
<p><a href="${app}">${name} on the Boston AI Atlas</a> — ${esc(clip(d.desc, 300))}</p>
</body></html>\n`;
  fs.mkdirSync(path.join(OUT, "e", d.id), { recursive: true });
  fs.writeFileSync(path.join(OUT, "e", d.id, "index.html"), html);
  urls.push(stubUrl);
}

// crawlable index
const byCat = {};
for (const d of DATA) (byCat[d.cat] = byCat[d.cat] || []).push(d);
let idx = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>All organizations — Boston AI Atlas</title>
<meta name="description" content="Every verified organization in the Boston AI Atlas — Greater Boston's AI ecosystem map by The Open Accelerator.">
<link rel="canonical" href="${BASE}e/">
</head><body>
<h1>Boston AI Atlas — all ${DATA.length} organizations</h1>
<p><a href="${BASE}">Open the interactive atlas</a> · dataset: <a href="${BASE}atlas.json">JSON</a> / <a href="${BASE}atlas.csv">CSV</a> (CC BY 4.0)</p>\n`;
for (const [cat, list] of Object.entries(byCat)) {
  idx += `<h2>${esc(CATS[cat].label)}</h2>\n<ul>\n`;
  for (const d of list.sort((a, b) => a.name.localeCompare(b.name)))
    idx += `<li><a href="${d.id}/">${esc(d.name)}</a> — ${esc(clip(d.desc, 160))}</li>\n`;
  idx += `</ul>\n`;
}
idx += `</body></html>\n`;
fs.writeFileSync(path.join(OUT, "e", "index.html"), idx);
urls.push(`${BASE}e/`);

// sitemap
const lastmod = (d) => (d && /^\d{4}-\d{2}$/.test(d) ? `<lastmod>${d}-01</lastmod>` : "");
let sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sm += `<url><loc>${BASE}</loc></url>\n<url><loc>${BASE}e/</loc></url>\n`;
for (const d of DATA)
  sm += `<url><loc>${BASE}e/${d.id}/</loc>${lastmod(d.lastVerified)}</url>\n`;
sm += `</urlset>\n`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sm);

console.log(`site-pages → ${DATA.length} entry stubs + index + sitemap (${urls.length} URLs)`);

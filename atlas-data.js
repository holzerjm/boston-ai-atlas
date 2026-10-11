/* ============================================================
   Mass AI Atlas — shared data loader (browser + Node)
   ------------------------------------------------------------
   Parses data/*.yml and validates each file against its
   data/*.schema.yml. The caller supplies the file texts and the
   js-yaml and Ajv libraries, so the same code runs in index.html
   (fetch + CDN builds) and in scripts/ (fs + npm packages; see
   scripts/load-data.js).
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AtlasData = factory();
})(this, function () {
  // global name → data file stem
  const SETS = { CATS: "categories", STAGES: "stages", DATA: "entities" };
  const FILES = Object.values(SETS).flatMap(f => [f + ".yml", f + ".schema.yml"]);

  // where an error points, e.g. `[csail] /desc` for entities, `/vc/color` for categories
  function where(file, data, path) {
    if (file !== "entities") return path || "/";
    const [, i, ...rest] = path.split("/");
    const d = data[+i];
    return `[${(d && d.id) || "entry " + i}] /${rest.join("/")}`;
  }

  // texts: {filename: text} for every name in FILES → { atlas: {CATS, STAGES, DATA}, errors: [...] }
  function parseAtlas(texts, yaml, Ajv) {
    // CORE_SCHEMA: unquoted dates like 2026-12-01 stay strings
    const load = (name) => yaml.load(texts[name], { schema: yaml.CORE_SCHEMA, filename: name });
    const ajv = new Ajv({ allErrors: true });
    const atlas = {}, errors = [];
    for (const [global, file] of Object.entries(SETS)) {
      const data = load(file + ".yml");
      const validate = ajv.compile(load(file + ".schema.yml"));
      if (!validate(data))
        for (const e of validate.errors) {
          const p = e.params || {};
          const detail = p.additionalProperty ? ` "${p.additionalProperty}"`
                       : p.allowedValues ? ` (${p.allowedValues.join(", ")})` : "";
          errors.push(`  ✗ ${file}.yml ${where(file, data, e.instancePath)}: ${e.message}${detail}`);
        }
      atlas[global] = data;
    }
    return { atlas, errors };
  }

  // Like parseAtlas, but throws if any file fails its schema.
  function loadAtlas(texts, yaml, Ajv) {
    const { atlas, errors } = parseAtlas(texts, yaml, Ajv);
    if (errors.length) throw new Error("Atlas data failed schema validation:\n" + errors.join("\n"));
    return atlas;
  }

  return { FILES, parseAtlas, loadAtlas };
});

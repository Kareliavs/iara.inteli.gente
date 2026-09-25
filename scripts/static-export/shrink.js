// Post-process already-generated city bundles: extract the indicator
// metadata (name/description/sources) that is identical across every
// municipio into a single shared file, and strip it from each per-city
// bundle to shrink the dataset drastically.
const fs = require("fs");
const path = require("path");

const CITIES_DIR = "/home/claude/work/iara_project/IARAInteli.gente/frontend/public/data/cities";
const OUT_DIR = "/home/claude/work/iara_project/IARAInteli.gente/frontend/public/data";

const files = fs.readdirSync(CITIES_DIR).filter((f) => f.endsWith(".json"));
console.log("files:", files.length);

const meta = {}; // indicador_id -> {indicador_nome, indicador_descricao, variavel_fontes}
let processed = 0;

for (const f of files) {
  const p = path.join(CITIES_DIR, f);
  const bundle = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(bundle.indicadores)) continue;

  bundle.indicadores = bundle.indicadores.map((ind) => {
    const { indicador_id, indicador_nome, indicador_descricao, variavel_fontes, ...rest } = ind;
    if (!(indicador_id in meta)) {
      meta[indicador_id] = { indicador_nome, indicador_descricao, variavel_fontes };
    }
    return { indicador_id, ...rest };
  });

  fs.writeFileSync(p, JSON.stringify(bundle));
  processed++;
  if (processed % 1000 === 0) console.log(processed, "/", files.length);
}

fs.writeFileSync(path.join(OUT_DIR, "indicadores-meta.json"), JSON.stringify(meta));
console.log("DONE. meta entries:", Object.keys(meta).length);

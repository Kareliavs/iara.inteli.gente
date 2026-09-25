// Generates static JSON bundles for GitHub Pages deployment by querying
// the real backend (already running locally against the restored DB).
import fs from "node:fs";
import path from "node:path";

const API = "http://127.0.0.1:4000/api";
const OUT_DIR = "/home/claude/work/iara_project/IARAInteli.gente/frontend/public/data";
const CITIES_DIR = path.join(OUT_DIR, "cities");

fs.mkdirSync(CITIES_DIR, { recursive: true });

const toSlug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-");

const ECONOMIC_TOPIC_GROUPS = [
  { topic: "Agua e Esgoto", ids: [3117, 3127, 3141, 3148] },
  { topic: "Infraestrutura de conectividade", ids: [3021, 3022, 3040, 3041, 3134, 4035, 4036, 4065] },
  { topic: "Habitacao", ids: [3020, 4041, 4045] },
  { topic: "Transporte", ids: [3049, 3076, 3124, 4011, 4012, 4031, 4046] },
  { topic: "Inovacao", ids: [4024, 4025, 4032, 4033] },
  { topic: "Servicos On-line da Prefeitura", ids: [3004, 4066] },
  { topic: "Sistemas e Tecnologia para Gestao Urbana", ids: [3016, 4010] },
  { topic: "Resíduos Sólidos", ids: [3122] },
  { topic: "Urbanização das Vias Públicas", ids: [3139, 3145, 4005] },
  { topic: "Dados Abertos", ids: [3033] },
];
const SOCIOCULTURAL_TOPIC_GROUPS = [
  { topic: "Educação", ids: [3003, 3011, 3085, 3086, 3115, 4006, 4020, 4034, 4037, 4048] },
  { topic: "Cultura", ids: [3077, 3107, 3123, 4040] },
  { topic: "Saúde", ids: [3006, 3095, 3096, 3125, 4004, 4021, 4049, 4067] },
  { topic: "Segurança Pública", ids: [3048, 4016, 4017] },
  { topic: "Gestão de Desastres", ids: [3007, 4042, 4068, 4069] },
  { topic: "Inclusão Digital", ids: [3037, 3039] },
  { topic: "Inclusão Social", ids: [4039, 4043, 4044] },
  { topic: "Participação Pública", ids: [3103, 3147] },
];
const ENVIRONMENT_TOPIC_GROUPS = [
  { topic: "Água e Esgoto", ids: [3024, 3028, 3042, 3110, 3128, 4047, 4071] },
  { topic: "Resíduos Sólidos", ids: [4007, 4014] },
  { topic: "Áreas Verdes", ids: [3057, 4030] },
  { topic: "Qualidade do Ar", ids: [3056, 3113] },
  { topic: "Energia", ids: [3043, 3069] },
  { topic: "Gestão de Desastres", ids: [4070] },
];
const INSTITUTIONAL_TOPIC_GROUPS = [
  { topic: "Estratégia", ids: [6003, 6005, 6006] },
  { topic: "Infraestrutura de Hw e Sw", ids: [6021, 6024] },
  { topic: "Serviços e Aplicações", ids: [6044, 6048, 6056] },
  { topic: "Monitoramento", ids: [6009, 6054, 6055] },
  { topic: "Dados Abertos", ids: [6035, 6037, 6038] },
];

const buildRefs = (groups) => Array.from(new Set(groups.flatMap(({ ids }) => ids)));

const DIMENSION_INDICATOR_REFS = {
  d1: [3025, 4056, 4057, 4058, 4059],
  economica: buildRefs(ECONOMIC_TOPIC_GROUPS),
  meio_ambiente: buildRefs(ENVIRONMENT_TOPIC_GROUPS),
  sociocultural: buildRefs(SOCIOCULTURAL_TOPIC_GROUPS),
  capacidades_institucionais: buildRefs(INSTITUTIONAL_TOPIC_GROUPS),
};

const MAIN_DIMENSION_CODES = ["economica", "meio_ambiente", "sociocultural", "capacidades_institucionais"];
const SERIES_SIGLAS = ["GINI", "PIB_AG", "PIB_AP", "PIB_IND", "PIB_SR", "PIB_SRV"];

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// simple concurrency pool
async function pool(items, worker, concurrency = 40, label = "") {
  let idx = 0;
  let done = 0;
  const total = items.length;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < total) {
      const my = idx++;
      await worker(items[my], my);
      done++;
      if (done % 500 === 0 || done === total) {
        process.stdout.write(`[${label}] ${done}/${total}\n`);
      }
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log("Fetching municipios list...");
  const municipiosFull = await getJSON(`${API}/municipios`);
  fs.writeFileSync(path.join(OUT_DIR, "municipios.json"), JSON.stringify(municipiosFull));
  console.log(`municipios.json written: ${municipiosFull.length} entries`);

  let slugIndex = {};
  if (fs.existsSync(path.join(OUT_DIR, "slug-index.json"))) {
    slugIndex = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "slug-index.json"), "utf8"));
  }

  const municipios = municipiosFull.filter(
    (m) => !fs.existsSync(path.join(CITIES_DIR, `${m.municipio_cod_ibge}.json`))
  );
  console.log(`${municipios.length} municipios remaining (of ${municipiosFull.length})`);

  await pool(
    municipios,
    async (m) => {
      const cod = m.municipio_cod_ibge;
      const slug = toSlug(`${m.municipio_nome}-${m.estado_sigla}`);
      slugIndex[slug] = cod;

      const [slugData, indicadoresData] = await Promise.all([
        getJSON(`${API}/municipios/slug/${encodeURIComponent(slug)}`),
        getJSON(`${API}/municipios/${cod}/indicadores`),
      ]);

      const comparativos = {};
      await Promise.all(
        Object.entries(DIMENSION_INDICATOR_REFS).map(async ([key, refs]) => {
          const q = refs.join(",");
          const data = await getJSON(
            `${API}/municipios/${cod}/comparativo-semelhantes?limit=6&indicadores=${q}`
          );
          comparativos[key] = data?.comparativo ?? [];
        })
      );

      const dimensoes = {};
      await Promise.all(
        MAIN_DIMENSION_CODES.map(async (key) => {
          const refs = DIMENSION_INDICATOR_REFS[key];
          const q = refs.join(",");
          const data = await getJSON(
            `${API}/municipios/${cod}/dimensao/resumo-pontuacao?indicadores=${q}`
          );
          dimensoes[key] = data ?? null;
        })
      );

      const series = {};
      await Promise.all(
        SERIES_SIGLAS.map(async (sigla) => {
          const data = await getJSON(`${API}/municipios/${cod}/variaveis/${sigla}/serie`);
          series[sigla] = data?.serie ?? [];
        })
      );

      const bundle = {
        slug: slugData,
        indicadores: indicadoresData?.indicadores ?? [],
        comparativos,
        dimensoes,
        series,
      };

      fs.writeFileSync(path.join(CITIES_DIR, `${cod}.json`), JSON.stringify(bundle));
    },
    50,
    "cities"
  );

  fs.writeFileSync(path.join(OUT_DIR, "slug-index.json"), JSON.stringify(slugIndex));
  console.log("DONE. slug-index entries:", Object.keys(slugIndex).length);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});

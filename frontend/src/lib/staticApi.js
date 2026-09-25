// Static-mode data layer for the GitHub Pages build.
//
// This project's backend needs a live Postgres database, which cannot run
// on GitHub Pages. All *read-only* municipio data was pre-exported (see
// /scripts or the README) into JSON files under /public/data and is served
// from there instead, by intercepting the same fetch("/api/...") calls the
// app already makes — no other code had to change.
//
// Anything that genuinely requires a backend (login, forms, the AI
// assistant, admin) is not covered here: those requests are short-circuited
// with a clear "unavailable in this static demo" error so the existing
// error-handling UI in those screens shows a sensible message instead of
// hanging on a network request that can never succeed.
import { DIMENSION_INDICATOR_REFS } from "./dimensionIndicatorRefs";

const BASE = import.meta.env.BASE_URL || "/";
const dataUrl = (p) => `${BASE}data/${p}`.replace(/([^:])\/\/+/g, "$1/");

let municipiosPromise = null;
let slugIndexPromise = null;
const cityBundleCache = new Map();

function loadJson(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`static data ${url}: HTTP ${res.status}`);
    return res.json();
  });
}

function getMunicipios() {
  if (!municipiosPromise) municipiosPromise = loadJson(dataUrl("municipios.json"));
  return municipiosPromise;
}

function getSlugIndex() {
  if (!slugIndexPromise) slugIndexPromise = loadJson(dataUrl("slug-index.json"));
  return slugIndexPromise;
}

function getCityBundle(cod) {
  const key = String(cod);
  if (!cityBundleCache.has(key)) {
    cityBundleCache.set(key, loadJson(dataUrl(`cities/${key}.json`)));
  }
  return cityBundleCache.get(key);
}

let indicadoresMetaPromise = null;
function getIndicadoresMeta() {
  if (!indicadoresMetaPromise) indicadoresMetaPromise = loadJson(dataUrl("indicadores-meta.json"));
  return indicadoresMetaPromise;
}

// Map an "indicadores=1,2,3" query string back to the dimension key it was
// built from (comparativo-semelhantes and dimensao/resumo-pontuacao always
// query using one of these fixed, known sets — see CitySearchDetails.jsx).
function findDimensionKey(indicadoresParam) {
  if (!indicadoresParam) return null;
  const wanted = indicadoresParam
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));
  const wantedSet = new Set(wanted);
  for (const [key, refs] of Object.entries(DIMENSION_INDICATOR_REFS)) {
    if (refs.length === wantedSet.size && refs.every((id) => wantedSet.has(id))) {
      return key;
    }
  }
  return null;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unavailableResponse() {
  return jsonResponse(
    {
      error:
        "Este recurso depende de um servidor backend com banco de dados e não está disponível nesta versão estática (GitHub Pages).",
      static_demo: true,
    },
    503
  );
}

async function handleStaticApi(pathname, search) {
  const params = new URLSearchParams(search);

  // GET /api/municipios  (and ?calc=... — both return the same list)
  if (pathname === "/api/municipios") {
    return jsonResponse(await getMunicipios());
  }

  // GET /api/municipios/busca?q=...  — should not be hit in static mode
  // (CitySearch.jsx passes availableMunicipios so search stays client-side),
  // but fall back to a simple client-side filter just in case.
  if (pathname === "/api/municipios/busca") {
    const q = (params.get("q") || "").trim().toLowerCase();
    const all = await getMunicipios();
    if (!q) return jsonResponse([]);
    const results = all
      .filter((m) => m.municipio_nome.toLowerCase().includes(q))
      .slice(0, 20);
    return jsonResponse(results);
  }

  // GET /api/municipios/slug/:slug
  let m = pathname.match(/^\/api\/municipios\/slug\/([^/]+)$/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    const slugIndex = await getSlugIndex();
    const cod = slugIndex[slug];
    if (!cod) return jsonResponse({ error: "Município não encontrado." }, 404);
    const bundle = await getCityBundle(cod);
    return jsonResponse(bundle.slug);
  }

  // GET /api/municipios/:cod/indicadores
  m = pathname.match(/^\/api\/municipios\/(\d+)\/indicadores$/);
  if (m) {
    const bundle = await getCityBundle(m[1]);
    const meta = await getIndicadoresMeta();
    const indicadores = (bundle.indicadores || []).map((ind) => ({
      ...meta[ind.indicador_id],
      ...ind,
    }));
    return jsonResponse({ indicadores });
  }

  // GET /api/municipios/:cod/comparativo-semelhantes?limit=&indicadores=
  m = pathname.match(/^\/api\/municipios\/(\d+)\/comparativo-semelhantes$/);
  if (m) {
    const bundle = await getCityBundle(m[1]);
    const key = findDimensionKey(params.get("indicadores")) || "d1";
    const limit = Number(params.get("limit")) || 6;
    const full = bundle.comparativos?.[key] || [];
    return jsonResponse({ comparativo: full.slice(0, limit) });
  }

  // GET /api/municipios/:cod/dimensao/resumo-pontuacao?indicadores=
  m = pathname.match(/^\/api\/municipios\/(\d+)\/dimensao\/resumo-pontuacao$/);
  if (m) {
    const bundle = await getCityBundle(m[1]);
    const key = findDimensionKey(params.get("indicadores"));
    return jsonResponse((key && bundle.dimensoes?.[key]) || null);
  }

  // GET /api/municipios/:cod/variaveis/:sigla/serie
  m = pathname.match(/^\/api\/municipios\/(\d+)\/variaveis\/([^/]+)\/serie$/);
  if (m) {
    const bundle = await getCityBundle(m[1]);
    const serie = bundle.series?.[m[2]] || [];
    return jsonResponse({ serie });
  }

  return null; // not a recognized static-data route
}

export function installStaticApi() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    let pathname = url;
    let search = "";
    try {
      const parsed = new URL(url, window.location.origin);
      pathname = parsed.pathname;
      search = parsed.search;
    } catch {
      // relative/opaque url, keep as-is
    }

    if (!pathname.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    try {
      const handled = await handleStaticApi(pathname, search);
      if (handled) return handled;
    } catch (err) {
      return jsonResponse({ error: String(err?.message || err) }, 500);
    }

    // Any other /api/* call (auth, formularios, assistente, admin, ...)
    // needs a real backend — fail gracefully instead of hanging.
    return unavailableResponse();
  };
}

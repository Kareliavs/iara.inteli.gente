const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const REGIC_FILE_PATH = path.resolve(
  __dirname,
  "../../../database/dados/Tabela_de_hierarquias.xlsx"
);

const HIERARCHY_LABEL_BY_LEVEL = {
  1: "Grande Metrópole Nacional",
  2: "Metrópole Nacional",
  3: "Metrópole",
  4: "Capital Regional A",
  5: "Capital Regional B",
  6: "Capital Regional C",
  7: "Centro Sub-Regional A",
  8: "Centro Sub-Regional B",
  9: "Centro de Zona A",
  10: "Centro de Zona B",
  11: "Centro Local",
};

const FORCE_HIERARCHY_LEVEL_3_CODES = new Set([
  "3550308", // São Paulo
  "3304557", // Rio de Janeiro
  "5300108", // Brasília
]);

let cache = null;

function normalizeCodIbge(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.padStart(7, "0");
}

function normalizeString(value) {
  if (value == null) return null;
  const cleaned = String(value).trim();
  return cleaned.length ? cleaned : null;
}

function normalizeHierarchyLevel(value) {
  const digits = String(value == null ? "" : value).replace(/\D/g, "");
  if (!digits) return null;

  const level = Number(digits);
  if (!Number.isInteger(level) || level < 1 || level > 11) return null;
  return level;
}

function buildCache() {
  if (!fs.existsSync(REGIC_FILE_PATH)) {
    return new Map();
  }

  const workbook = XLSX.readFile(REGIC_FILE_PATH);
  const firstSheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    raw: false,
    defval: "",
  });

  const mapping = new Map();

  rows.forEach((row) => {
    const codIbge = normalizeCodIbge(
      row.COD_CIDADE || row.cod_cidade || row.codmun || row.codigo_ibge || row.municipio_cod_ibge
    );
    if (!codIbge) return;

    const hierarchyLevel = normalizeHierarchyLevel(row[2018] ?? row["2018"] ?? row.hierarquia_2018);
    if (!hierarchyLevel) return;

    const effectiveHierarchyLevel = FORCE_HIERARCHY_LEVEL_3_CODES.has(codIbge)
      ? 3
      : hierarchyLevel;

    mapping.set(codIbge, {
      hierarquia: normalizeString(
        `${HIERARCHY_LABEL_BY_LEVEL[effectiveHierarchyLevel]} (${effectiveHierarchyLevel})`
      ),
      hierarquia2: normalizeString(HIERARCHY_LABEL_BY_LEVEL[effectiveHierarchyLevel]),
      hierarquia3: String(effectiveHierarchyLevel),
    });
  });

  return mapping;
}

function ensureCache() {
  if (!cache) {
    cache = buildCache();
  }

  return cache;
}

function getHierarchyByMunicipioCod(codIbge) {
  const cod = normalizeCodIbge(codIbge);
  if (!cod) return null;

  const data = ensureCache().get(cod);
  return data || null;
}

module.exports = {
  getHierarchyByMunicipioCod,
  normalizeCodIbge,
};

const fs = require("fs");
const path = require("path");

const COORDINATES_FILE_PATH = path.resolve(
  __dirname,
  "../../../database/dados/coordenadas.csv"
);

let cache = null;

function normalizeCodIbge(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.padStart(7, "0");
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildCache() {
  const mapping = new Map();

  if (!fs.existsSync(COORDINATES_FILE_PATH)) {
    return mapping;
  }

  const content = fs.readFileSync(COORDINATES_FILE_PATH, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return mapping;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",");
    const codIbge = normalizeCodIbge(cols[0]);
    if (!codIbge) continue;

    const latitude = toNumber(cols[2]);
    const longitude = toNumber(cols[3]);

    if (latitude == null || longitude == null) continue;

    mapping.set(codIbge, { latitude, longitude });
  }

  return mapping;
}

function ensureCache() {
  if (!cache) {
    cache = buildCache();
  }

  return cache;
}

function getCoordinatesByMunicipioCod(codIbge) {
  const cod = normalizeCodIbge(codIbge);
  if (!cod) return null;

  return ensureCache().get(cod) || null;
}

module.exports = {
  getCoordinatesByMunicipioCod,
};

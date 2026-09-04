const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseIndicadorReferencias,
  parseVariavelSigla,
} = require("../src/controllers/municipiosController");

test("não converte filtro vazio de indicadores no ID zero", () => {
  assert.deepEqual(parseIndicadorReferencias(""), []);
  assert.deepEqual(parseIndicadorReferencias("3025, 4056,3025"), [3025, 4056]);
});

test("preserva siglas canônicas com caixa, acentos e operadores", () => {
  assert.equal(parseVariavelSigla("Acesso_SCM>=12Mbps"), "Acesso_SCM>=12Mbps");
  assert.equal(parseVariavelSigla("QT_MATRÍCULAS"), "QT_MATRÍCULAS");
});

test("rejeita siglas vazias, extensas ou com caracteres fora do catálogo", () => {
  assert.throws(() => parseVariavelSigla(""), /Sigla de variavel invalida/);
  assert.throws(() => parseVariavelSigla("A".repeat(81)), /Sigla de variavel invalida/);
  assert.throws(() => parseVariavelSigla("POP_TOT/DELETE"), /Sigla de variavel invalida/);
});

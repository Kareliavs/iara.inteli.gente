const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CHALLENGE_DIMENSIONS,
  executarConsultaOrientada,
  normalizeIndicators,
} = require("../src/services/assistenteService");

const municipio = {
  municipio_cod_ibge: 3548906,
  municipio_nome: "São Carlos",
  estado_sigla: "SP",
};

const rows = [
  { indicador_referencia: 1001, indicador_nome: "Indicador A", indicador_nivel: 7, indicador_valor: 10, ano: 2024, variavel_fontes: ["IBGE"] },
  { indicador_referencia: 1002, indicador_nome: "Indicador B", indicador_nivel: 2, indicador_valor: 20, ano: 2023, variavel_fontes: ["Fonte B"] },
  { indicador_referencia: 1003, indicador_nome: "Indicador C", indicador_nivel: null, indicador_valor: null, ano: null },
];

const request = (acao, indicatorIds = [1001, 1002, 1003]) => ({
  acao,
  municipio,
  contexto: {
    municipio_cod_ibge: 3548906,
    dimensao_codigo: "economica",
    idioma: "pt",
    indicador_ids: indicatorIds,
  },
});

test("normaliza os indicadores municipais", () => {
  const indicators = normalizeIndicators(rows, [1001, 1002]);
  assert.equal(indicators.length, 2);
  assert.equal(indicators[0].nivel, 7);
});

test("compara municípios semelhantes em seções por dimensão", async () => {
  let receivedCodes = null;
  let receivedIndicators = null;
  const result = await executarConsultaOrientada(request("comparar_municipios"), {
    listarSemelhantes: async () => [
      { municipio_cod_ibge: 3548906, municipio_nome: "São Carlos", estado_sigla: "SP", is_current: true },
      { municipio_cod_ibge: 3509502, municipio_nome: "Campinas", estado_sigla: "SP", is_current: false },
    ],
    listarNiveis: async (codes, indicators) => {
      receivedCodes = codes;
      receivedIndicators = indicators;
      return CHALLENGE_DIMENSIONS.flatMap((dimension, dimensionIndex) => [
        { municipio_cod_ibge: 3548906, indicador_referencia: dimension.ids[0], indicador_nivel: 7 - dimensionIndex },
        { municipio_cod_ibge: 3509502, indicador_referencia: dimension.ids[0], indicador_nivel: 4 + dimensionIndex },
      ]);
    },
  });

  assert.deepEqual(receivedCodes, [3548906, 3509502]);
  assert.equal(receivedIndicators.length, CHALLENGE_DIMENSIONS.flatMap((dimension) => dimension.ids).length);
  assert.match(result.resposta, /resultados separados por dimensão/);
  assert.equal(result.dados.tipo, "comparar_municipios");
  assert.deepEqual(result.dados.secoes.map((section) => section.codigo), ["economica", "sociocultural", "meio_ambiente"]);
  assert.deepEqual(result.dados.secoes.map((section) => section.itens[0].pontuacao), [100, 86, 71]);
  assert.equal(result.dados.secoes[0].itens[0].atual, true);
  assert.deepEqual(result.indicadores_utilizados, []);
});

test("separa cinco desafios em cada dimensão da transformação digital", async () => {
  const challengeRows = CHALLENGE_DIMENSIONS.flatMap((dimension) =>
    dimension.ids.slice(0, 6).map((id, index) => ({
      indicador_referencia: id,
      indicador_nome: `${dimension.codigo} ${id}`,
      indicador_nivel: index + 1,
    })),
  );
  const result = await executarConsultaOrientada(
    request("desafios_oportunidades_transformacao_digital"),
    { listarIndicadores: async () => challengeRows },
  );

  assert.equal(result.dados.secoes.length, 3);
  assert.deepEqual(result.dados.secoes.map((section) => section.itens.length), [5, 5, 5]);
  assert.deepEqual(result.dados.secoes.map((section) => section.codigo), [
    "economica",
    "sociocultural",
    "meio_ambiente",
  ]);
  assert.equal(result.dados.secoes[0].itens[0].nivel, 1);
  assert.equal(result.fontes.length, 0);
});

test("informa indisponibilidade quando os semelhantes não possuem níveis dimensionais", async () => {
  const result = await executarConsultaOrientada(request("comparar_municipios", []), {
    listarSemelhantes: async () => [
      { municipio_cod_ibge: 3548906, municipio_nome: "São Carlos", estado_sigla: "SP", is_current: true },
    ],
    listarNiveis: async () => [],
  });
  assert.match(result.limitacoes[0], /Não há dados suficientes/);
  assert.equal(result.limitacoes.length, 1);
});

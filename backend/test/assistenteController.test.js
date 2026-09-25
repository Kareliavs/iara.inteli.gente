const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createConsultarController,
  validateRequestBody,
} = require("../src/controllers/assistenteController");

function validBody(overrides = {}) {
  return {
    acao: "comparar_municipios",
    contexto: {
      municipio_cod_ibge: 3548906,
      dimensao_codigo: "economica",
      idioma: "pt",
      indicador_ids: [1001, 1002, 1002],
    },
    ...overrides,
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("valida o contrato fechado das consultas orientadas", () => {
  assert.deepEqual(validateRequestBody(validBody()), {
    acao: "comparar_municipios",
    contexto: {
      municipio_cod_ibge: 3548906,
      dimensao_codigo: "economica",
      idioma: "pt",
      indicador_ids: [1001, 1002],
    },
  });

  for (const body of [
    null,
    {},
    validBody({ acao: "pergunta_livre" }),
    validBody({ acao: "comparar_media_regional" }),
    validBody({ campo_extra: true }),
    validBody({ contexto: { municipio_cod_ibge: 42, idioma: "pt", indicador_ids: [] } }),
    validBody({ contexto: { municipio_cod_ibge: 3548906, idioma: "de", indicador_ids: [] } }),
    validBody({ contexto: { municipio_cod_ibge: 3548906, idioma: "pt", indicador_ids: ["1001"] } }),
  ]) assert.throws(() => validateRequestBody(body), (error) => error.status === 400);
});

test("resolve o município canônico e executa apenas a ação validada", async () => {
  let received = null;
  const controller = createConsultarController({
    buscarMunicipio: async () => municipio,
    executarConsulta: async (payload) => {
      received = payload;
      return { resposta: "Resumo determinístico." };
    },
  });
  const municipio = { municipio_cod_ibge: 3548906, municipio_nome: "São Carlos", estado_sigla: "SP", formulario_respondido: true };
  const res = createResponse();

  await controller({ body: validBody() }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(received.acao, "comparar_municipios");
  assert.equal(received.municipio.municipio_nome, "São Carlos");
});

test("retorna 404 quando o município não existe", async () => {
  const controller = createConsultarController({ buscarMunicipio: async () => null });
  const res = createResponse();
  await controller({ body: validBody() }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Município não encontrado" });
});

test("retorna 403 quando o município não respondeu ao formulário", async () => {
  let executed = false;
  const controller = createConsultarController({
    buscarMunicipio: async () => ({
      municipio_cod_ibge: 3548906,
      municipio_nome: "São Carlos",
      estado_sigla: "SP",
      formulario_respondido: false,
    }),
    executarConsulta: async () => { executed = true; },
  });
  const res = createResponse();

  await controller({ body: validBody() }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(executed, false);
  assert.match(res.body.error, /somente para municípios que responderam/i);
});

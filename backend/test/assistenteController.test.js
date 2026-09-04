const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_QUESTION_LENGTH,
  MIN_QUESTION_LENGTH,
  createPerguntarController,
  validateRequestBody,
} = require("../src/controllers/assistenteController");

function createResponse() {
  return {
    body: null,
    statusCode: 200,
    json(body) {
      this.body = body;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
  };
}

function validBody(overrides = {}) {
  return {
    pergunta: "Como está o município?",
    contexto: {
      municipio_cod_ibge: 3548906,
      dimensao_codigo: "economica",
      idioma: "pt",
    },
    ...overrides,
  };
}

test("valida e normaliza o contrato público do assistente", () => {
  assert.deepEqual(validateRequestBody(validBody()), {
    pergunta: "Como está o município?",
    municipioCodIbge: 3548906,
    dimensaoCodigo: "economica",
    idioma: "pt",
  });

  assert.deepEqual(
    validateRequestBody(validBody({
      pergunta: "  Explique os indicadores  ",
      contexto: {
        municipio_cod_ibge: 3548906,
        dimensao_codigo: null,
        idioma: "fr",
      },
    })),
    {
      pergunta: "Explique os indicadores",
      municipioCodIbge: 3548906,
      dimensaoCodigo: null,
      idioma: "fr",
    },
  );
});

test("rejeita campos desconhecidos e valores fora do contrato", () => {
  const invalidBodies = [
    null,
    {},
    validBody({ campo_extra: true }),
    validBody({ pergunta: "   " }),
    validBody({ pergunta: "x".repeat(MIN_QUESTION_LENGTH - 1) }),
    validBody({ pergunta: "x".repeat(MAX_QUESTION_LENGTH + 1) }),
    validBody({ contexto: null }),
    validBody({ contexto: { municipio_cod_ibge: "3548906", idioma: "pt" } }),
    validBody({ contexto: { municipio_cod_ibge: 42, idioma: "pt" } }),
    validBody({ contexto: { municipio_cod_ibge: 3548906, idioma: "de" } }),
    validBody({
      contexto: {
        municipio_cod_ibge: 3548906,
        dimensao_codigo: "dimensao_inexistente",
        idioma: "pt",
      },
    }),
    validBody({
      contexto: {
        municipio_cod_ibge: 3548906,
        idioma: "pt",
        municipio_nome: "Nome enviado pelo cliente",
      },
    }),
  ];

  invalidBodies.forEach((body) => {
    assert.throws(() => validateRequestBody(body), (error) => error.status === 400);
  });
});

test("resolve o município canônico antes de chamar o serviço de IA", async () => {
  let receivedCode = null;
  let receivedPayload = null;
  const controller = createPerguntarController({
    buscarMunicipio: async (codigo) => {
      receivedCode = codigo;
      return {
        municipio_cod_ibge: "3548906",
        municipio_nome: "São Carlos",
        estado_sigla: "SP",
        municipio_regiao: "Sudeste",
      };
    },
    solicitarResposta: async (payload) => {
      receivedPayload = payload;
      return {
        resposta: "Resposta baseada em evidências.",
        municipio: { nome: "Nome incorreto", codigo_ibge: 1, uf: "XX" },
        indicadores_utilizados: ["3077"],
        anos_utilizados: [2024],
        fontes: [{ titulo: "IBGE", referencia: "Indicador 3077" }],
        limitacoes: [],
      };
    },
  });
  const res = createResponse();

  await controller({ body: validBody() }, res);

  assert.equal(receivedCode, 3548906);
  assert.deepEqual(receivedPayload, {
    pergunta: "Como está o município?",
    contexto: {
      municipio_cod_ibge: 3548906,
      municipio_nome: "São Carlos",
      estado_sigla: "SP",
      municipio_regiao: "Sudeste",
      idioma: "pt",
      dimensao_codigo: "economica",
    },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.municipio, {
    nome: "São Carlos",
    codigo_ibge: 3548906,
    uf: "SP",
  });
});

test("omite a dimensão ausente do contexto enviado ao serviço", async () => {
  let receivedPayload = null;
  const controller = createPerguntarController({
    buscarMunicipio: async () => ({
      municipio_cod_ibge: 3548906,
      municipio_nome: "São Carlos",
      estado_sigla: "SP",
      municipio_regiao: null,
    }),
    solicitarResposta: async (payload) => {
      receivedPayload = payload;
      return {
        resposta: "Resposta.",
        municipio: null,
        indicadores_utilizados: [],
        anos_utilizados: [],
        fontes: [],
        limitacoes: [],
      };
    },
  });
  const res = createResponse();

  await controller({
    body: validBody({
      contexto: {
        municipio_cod_ibge: 3548906,
        dimensao_codigo: null,
        idioma: "pt",
      },
    }),
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(Object.hasOwn(receivedPayload.contexto, "dimensao_codigo"), false);
});

test("retorna 404 sem chamar a IA quando o município não existe", async () => {
  let serviceCalled = false;
  const controller = createPerguntarController({
    buscarMunicipio: async () => null,
    solicitarResposta: async () => {
      serviceCalled = true;
    },
  });
  const res = createResponse();

  await controller({ body: validBody() }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Município não encontrado" });
  assert.equal(serviceCalled, false);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  AssistenteServiceError,
  DEFAULT_SERVICE_URL,
  solicitarRespostaAssistente,
} = require("../src/services/assistenteService");

const requestPayload = {
  pergunta: "Como está o município?",
  contexto: {
    municipio_cod_ibge: 3548906,
    municipio_nome: "São Carlos",
    estado_sigla: "SP",
    municipio_regiao: "Sudeste",
    idioma: "pt",
  },
};

function validResponse(overrides = {}) {
  return {
    resposta: "Resposta baseada em evidências.",
    municipio: { nome: "São Carlos", codigo_ibge: 3548906, uf: "SP" },
    indicadores_utilizados: ["3077"],
    anos_utilizados: [2024],
    fontes: [{ titulo: "IBGE", referencia: "Indicador 3077" }],
    limitacoes: [],
    ...overrides,
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("encaminha o payload ao endpoint interno e sanitiza a resposta", async () => {
  let receivedUrl = null;
  let receivedOptions = null;
  const result = await solicitarRespostaAssistente(requestPayload, {
    env: {
      AI_SERVICE_URL: "http://127.0.0.1:8000/",
      AI_SERVICE_TIMEOUT_MS: "1000",
      AI_SERVICE_TOKEN: "token-interno",
    },
    fetchImpl: async (url, options) => {
      receivedUrl = url;
      receivedOptions = options;
      return jsonResponse(validResponse({ campo_interno: "não deve vazar" }));
    },
  });

  assert.equal(receivedUrl, "http://127.0.0.1:8000/v1/assistente/perguntar");
  assert.equal(receivedOptions.method, "POST");
  assert.equal(receivedOptions.headers.Accept, "application/json");
  assert.equal(receivedOptions.headers["X-AI-Service-Token"], "token-interno");
  assert.deepEqual(JSON.parse(receivedOptions.body), requestPayload);
  assert.ok(receivedOptions.signal instanceof AbortSignal);
  assert.equal(Object.hasOwn(result, "campo_interno"), false);
  assert.deepEqual(result, validResponse());
});

test("usa o endpoint local padrão quando a URL interna não está configurada", async () => {
  let receivedUrl = null;
  const result = await solicitarRespostaAssistente(requestPayload, {
    env: {},
    fetchImpl: async (url) => {
      receivedUrl = url;
      return jsonResponse(validResponse());
    },
  });

  assert.equal(receivedUrl, `${DEFAULT_SERVICE_URL}/v1/assistente/perguntar`);
  assert.equal(result.resposta, "Resposta baseada em evidências.");
});

test("rejeita URL interna inválida antes de tentar conexão", async () => {
  let fetchCalled = false;
  await assert.rejects(
    solicitarRespostaAssistente(requestPayload, {
      env: { AI_SERVICE_URL: "ftp://127.0.0.1:8001" },
      fetchImpl: async () => {
        fetchCalled = true;
      },
    }),
    (error) => error instanceof AssistenteServiceError
      && error.status === 503
      && error.code === "AI_SERVICE_INVALID_URL",
  );
  assert.equal(fetchCalled, false);
});

test("mapeia falhas do upstream sem expor seu corpo", async () => {
  await assert.rejects(
    solicitarRespostaAssistente(requestPayload, {
      env: { AI_SERVICE_URL: "http://127.0.0.1:8000" },
      fetchImpl: async () => jsonResponse({ detail: "chave secreta inválida" }, 500),
    }),
    (error) => error instanceof AssistenteServiceError
      && error.status === 502
      && error.message === "Serviço de IA indisponível"
      && !error.message.includes("chave secreta"),
  );
});

test("mapeia serviço fora do ar como indisponível", async () => {
  await assert.rejects(
    solicitarRespostaAssistente(requestPayload, {
      env: { AI_SERVICE_URL: "http://127.0.0.1:8001" },
      fetchImpl: async () => {
        throw new TypeError("connect ECONNREFUSED 127.0.0.1:8001");
      },
    }),
    (error) => error instanceof AssistenteServiceError
      && error.status === 503
      && error.code === "AI_SERVICE_UNAVAILABLE"
      && !error.message.includes("ECONNREFUSED"),
  );
});

test("rejeita JSON de sucesso fora do contrato estruturado", async () => {
  await assert.rejects(
    solicitarRespostaAssistente(requestPayload, {
      env: { AI_SERVICE_URL: "http://127.0.0.1:8000" },
      fetchImpl: async () => jsonResponse({ resposta: "incompleta" }),
    }),
    (error) => error instanceof AssistenteServiceError
      && error.status === 502
      && error.code === "AI_SERVICE_INVALID_RESPONSE",
  );
});

test("cancela a chamada quando o timeout é excedido", async () => {
  const keepEventLoopAlive = setTimeout(() => {}, 100);
  try {
    await assert.rejects(
      solicitarRespostaAssistente(requestPayload, {
        env: {
          AI_SERVICE_URL: "http://127.0.0.1:8000",
          AI_SERVICE_TIMEOUT_MS: "5",
        },
        fetchImpl: async (_url, { signal }) => new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          }, { once: true });
        }),
      }),
      (error) => error instanceof AssistenteServiceError
        && error.status === 504
        && error.code === "AI_SERVICE_TIMEOUT",
    );
  } finally {
    clearTimeout(keepEventLoopAlive);
  }
});

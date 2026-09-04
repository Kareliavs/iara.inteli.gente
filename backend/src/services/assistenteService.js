const DEFAULT_TIMEOUT_MS = 105_000;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_SERVICE_URL = "http://127.0.0.1:8001";

class AssistenteServiceError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = "AssistenteServiceError";
    this.code = code || "AI_SERVICE_ERROR";
    this.status = status || 502;
  }
}

function getServiceEndpoint(env) {
  const baseUrl = String(env.AI_SERVICE_URL || DEFAULT_SERVICE_URL).trim().replace(/\/+$/, "");

  let endpoint;
  try {
    endpoint = new URL(`${baseUrl}/v1/assistente/perguntar`);
  } catch {
    throw new AssistenteServiceError("Serviço de IA não configurado", {
      code: "AI_SERVICE_INVALID_URL",
      status: 503,
    });
  }

  if (!["http:", "https:"].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new AssistenteServiceError("Serviço de IA não configurado", {
      code: "AI_SERVICE_INVALID_URL",
      status: 503,
    });
  }

  return endpoint.toString();
}

function getTimeoutMs(env) {
  const rawValue = String(env.AI_SERVICE_TIMEOUT_MS || "").trim();
  if (!rawValue) return DEFAULT_TIMEOUT_MS;

  const timeoutMs = Number(rawValue);
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMEOUT_MS) {
    throw new AssistenteServiceError("Configuração de timeout do serviço de IA inválida", {
      code: "AI_SERVICE_INVALID_TIMEOUT",
      status: 503,
    });
  }
  return timeoutMs;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function invalidResponse(fieldName = "") {
  const suffix = fieldName ? `: ${fieldName}` : "";
  return new AssistenteServiceError(`Resposta inválida do serviço de IA${suffix}`, {
    code: "AI_SERVICE_INVALID_RESPONSE",
    status: 502,
  });
}

function assertString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidResponse(fieldName);
  }
  return value;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) throw invalidResponse(fieldName);
  return value.map((item) => assertString(item, fieldName));
}

function normalizeResponse(payload) {
  if (!isPlainObject(payload)) throw invalidResponse();

  let municipio = null;
  if (payload.municipio !== null && payload.municipio !== undefined) {
    if (!isPlainObject(payload.municipio)) throw invalidResponse("municipio");
    const codigoIbge = Number(payload.municipio.codigo_ibge);
    if (!Number.isInteger(codigoIbge)) throw invalidResponse("municipio.codigo_ibge");
    municipio = {
      nome: assertString(payload.municipio.nome, "municipio.nome"),
      codigo_ibge: codigoIbge,
      uf: assertString(payload.municipio.uf, "municipio.uf"),
    };
  }

  if (!Array.isArray(payload.indicadores_utilizados)) {
    throw invalidResponse("indicadores_utilizados");
  }
  const indicadoresUtilizados = payload.indicadores_utilizados.map((item) => {
    const indicadorId = assertString(item, "indicadores_utilizados").trim();
    if (!/^\d+$/.test(indicadorId)) throw invalidResponse("indicadores_utilizados");
    return indicadorId;
  });

  if (!Array.isArray(payload.anos_utilizados)) throw invalidResponse("anos_utilizados");
  const anosUtilizados = payload.anos_utilizados.map((item) => {
    const ano = Number(item);
    if (!Number.isInteger(ano)) throw invalidResponse("anos_utilizados");
    return ano;
  });

  if (!Array.isArray(payload.fontes)) throw invalidResponse("fontes");
  const fontes = payload.fontes.map((fonte) => {
    if (!isPlainObject(fonte)) throw invalidResponse("fontes");
    return {
      titulo: assertString(fonte.titulo, "fontes.titulo"),
      referencia: assertString(fonte.referencia, "fontes.referencia"),
    };
  });

  return {
    resposta: assertString(payload.resposta, "resposta"),
    municipio,
    indicadores_utilizados: indicadoresUtilizados,
    anos_utilizados: anosUtilizados,
    fontes,
    limitacoes: normalizeStringArray(payload.limitacoes, "limitacoes"),
  };
}

async function solicitarRespostaAssistente(
  payload,
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== "function") {
    throw new AssistenteServiceError("Serviço de IA indisponível", {
      code: "AI_SERVICE_FETCH_UNAVAILABLE",
      status: 503,
    });
  }

  const endpoint = getServiceEndpoint(env);
  const timeoutMs = getTimeoutMs(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref?.();

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(String(env.AI_SERVICE_TOKEN || "").trim()
          ? { "X-AI-Service-Token": String(env.AI_SERVICE_TOKEN).trim() }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response || typeof response.ok !== "boolean" || typeof response.json !== "function") {
      throw invalidResponse();
    }

    if (!response.ok) {
      const timedOut = response.status === 408 || response.status === 504;
      const unavailable = response.status === 429 || response.status === 503;
      throw new AssistenteServiceError(
        timedOut ? "O serviço de IA excedeu o tempo limite" : "Serviço de IA indisponível",
        {
          code: timedOut
            ? "AI_SERVICE_TIMEOUT"
            : unavailable
              ? "AI_SERVICE_UNAVAILABLE"
              : "AI_SERVICE_UPSTREAM_ERROR",
          status: timedOut ? 504 : unavailable ? 503 : 502,
        },
      );
    }

    let responsePayload;
    try {
      responsePayload = await response.json();
    } catch {
      throw invalidResponse();
    }
    return normalizeResponse(responsePayload);
  } catch (error) {
    if (error instanceof AssistenteServiceError) throw error;
    if (controller.signal.aborted || error?.name === "AbortError") {
      throw new AssistenteServiceError("O serviço de IA excedeu o tempo limite", {
        code: "AI_SERVICE_TIMEOUT",
        status: 504,
      });
    }
    throw new AssistenteServiceError("Serviço de IA indisponível", {
      code: "AI_SERVICE_UNAVAILABLE",
      status: 503,
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  AssistenteServiceError,
  DEFAULT_SERVICE_URL,
  normalizeResponse,
  solicitarRespostaAssistente,
};

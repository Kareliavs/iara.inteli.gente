const {
  buscarMunicipioPorCodigo,
} = require("../repositories/municipiosRepository");
const {
  AssistenteServiceError,
  solicitarRespostaAssistente,
} = require("../services/assistenteService");

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 600;
const DIMENSION_CODES = new Set([
  "d1",
  "economica",
  "meio_ambiente",
  "sociocultural",
  "capacidades_institucionais",
]);
const LANGUAGE_CODES = new Set(["pt", "en", "es", "fr"]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateRequestBody(body) {
  if (!isPlainObject(body) || !hasOnlyKeys(body, new Set(["pergunta", "contexto"]))) {
    throw validationError("Corpo da requisição inválido");
  }

  if (typeof body.pergunta !== "string") {
    throw validationError("Pergunta é obrigatória");
  }
  const pergunta = body.pergunta.trim().replace(/\s+/g, " ");
  if (pergunta.length < MIN_QUESTION_LENGTH) {
    throw validationError(`Pergunta deve possuir ao menos ${MIN_QUESTION_LENGTH} caracteres`);
  }
  if (pergunta.length > MAX_QUESTION_LENGTH) {
    throw validationError(`Pergunta deve possuir no máximo ${MAX_QUESTION_LENGTH} caracteres`);
  }

  if (
    !isPlainObject(body.contexto)
    || !hasOnlyKeys(
      body.contexto,
      new Set(["municipio_cod_ibge", "dimensao_codigo", "idioma"]),
    )
  ) {
    throw validationError("Contexto da requisição inválido");
  }

  const municipioCodIbge = body.contexto.municipio_cod_ibge;
  if (
    !Number.isInteger(municipioCodIbge)
    || municipioCodIbge < 1_000_000
    || municipioCodIbge > 9_999_999
  ) {
    throw validationError("Código IBGE inválido");
  }

  const idioma = body.contexto.idioma;
  if (typeof idioma !== "string" || !LANGUAGE_CODES.has(idioma)) {
    throw validationError("Idioma inválido");
  }

  const dimensaoCodigo = body.contexto.dimensao_codigo;
  if (
    dimensaoCodigo !== undefined
    && dimensaoCodigo !== null
    && (typeof dimensaoCodigo !== "string" || !DIMENSION_CODES.has(dimensaoCodigo))
  ) {
    throw validationError("Dimensão inválida");
  }

  return {
    pergunta,
    municipioCodIbge,
    idioma,
    dimensaoCodigo: dimensaoCodigo || null,
  };
}

function createPerguntarController({
  buscarMunicipio = buscarMunicipioPorCodigo,
  solicitarResposta = solicitarRespostaAssistente,
} = {}) {
  return async function perguntar(req, res) {
    try {
      const input = validateRequestBody(req.body);
      const municipio = await buscarMunicipio(input.municipioCodIbge);
      if (!municipio) {
        return res.status(404).json({ error: "Município não encontrado" });
      }

      const contexto = {
        municipio_cod_ibge: input.municipioCodIbge,
        municipio_nome: municipio.municipio_nome,
        estado_sigla: municipio.estado_sigla,
        municipio_regiao: municipio.municipio_regiao || null,
        idioma: input.idioma,
        ...(input.dimensaoCodigo
          ? { dimensao_codigo: input.dimensaoCodigo }
          : {}),
      };
      const resultado = await solicitarResposta({
        pergunta: input.pergunta,
        contexto,
      });

      return res.json({
        ...resultado,
        municipio: {
          nome: municipio.municipio_nome,
          codigo_ibge: input.municipioCodIbge,
          uf: municipio.estado_sigla,
        },
      });
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof AssistenteServiceError) {
        console.error("Falha controlada no serviço de IA:", error.code);
        return res.status(error.status).json({ error: error.message });
      }
      console.error("Erro ao consultar o assistente municipal:", error);
      return res.status(500).json({ error: "Erro ao consultar o assistente municipal" });
    }
  };
}

const perguntar = createPerguntarController();

module.exports = {
  MAX_QUESTION_LENGTH,
  MIN_QUESTION_LENGTH,
  createPerguntarController,
  perguntar,
  validateRequestBody,
};

const { buscarMunicipioPorCodigo } = require("../repositories/municipiosRepository");
const { ACTIONS, executarConsultaOrientada } = require("../services/assistenteService");

const ACTION_SET = new Set(ACTIONS);
const DIMENSION_CODES = new Set(["d1", "economica", "meio_ambiente", "sociocultural", "capacidades_institucionais"]);
const LANGUAGE_CODES = new Set(["pt", "en", "es", "fr"]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validationError(message) { const error = new Error(message); error.status = 400; return error; }
const hasOnlyKeys = (value, allowedKeys) => Object.keys(value).every((key) => allowedKeys.has(key));

function validateRequestBody(body) {
  if (!isPlainObject(body) || !hasOnlyKeys(body, new Set(["acao", "contexto"]))) throw validationError("Corpo da requisição inválido");
  if (typeof body.acao !== "string" || !ACTION_SET.has(body.acao)) throw validationError("Consulta orientada inválida");
  if (!isPlainObject(body.contexto) || !hasOnlyKeys(body.contexto, new Set(["municipio_cod_ibge", "dimensao_codigo", "idioma", "indicador_ids"]))) throw validationError("Contexto da requisição inválido");
  const municipioCodIbge = body.contexto.municipio_cod_ibge;
  if (!Number.isInteger(municipioCodIbge) || municipioCodIbge < 1_000_000 || municipioCodIbge > 9_999_999) throw validationError("Código IBGE inválido");
  const idioma = body.contexto.idioma;
  if (typeof idioma !== "string" || !LANGUAGE_CODES.has(idioma)) throw validationError("Idioma inválido");
  const dimensaoCodigo = body.contexto.dimensao_codigo;
  if (dimensaoCodigo !== undefined && dimensaoCodigo !== null && (typeof dimensaoCodigo !== "string" || !DIMENSION_CODES.has(dimensaoCodigo))) throw validationError("Dimensão inválida");
  const indicatorIds = body.contexto.indicador_ids;
  if (!Array.isArray(indicatorIds) || indicatorIds.length > 135 || indicatorIds.some((id) => !Number.isInteger(id) || id < 1 || id > 9999)) throw validationError("Lista de indicadores inválida");
  return { acao: body.acao, contexto: { municipio_cod_ibge: municipioCodIbge, dimensao_codigo: dimensaoCodigo || null, idioma, indicador_ids: Array.from(new Set(indicatorIds)) } };
}

function createConsultarController({ buscarMunicipio = buscarMunicipioPorCodigo, executarConsulta = executarConsultaOrientada } = {}) {
  return async function consultar(req, res) {
    try {
      const input = validateRequestBody(req.body);
      const municipio = await buscarMunicipio(input.contexto.municipio_cod_ibge);
      if (!municipio) return res.status(404).json({ error: "Município não encontrado" });
      const formularioRespondido = municipio.formulario_respondido === true
        || municipio.formulario_respondido === "true";
      if (!formularioRespondido) {
        return res.status(403).json({
          error: "O Assistente Municipal está disponível somente para municípios que responderam ao formulário.",
        });
      }
      return res.json(await executarConsulta({ ...input, municipio }));
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ error: error.message });
      console.error("Erro ao executar consulta municipal orientada:", error);
      return res.status(500).json({ error: "Erro ao executar consulta municipal" });
    }
  };
}

const consultar = createConsultarController();
module.exports = { createConsultarController, consultar, validateRequestBody };

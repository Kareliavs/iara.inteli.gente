const {
  listarMunicipios,
  buscarMunicipiosPorNome,
  buscarMunicipioPorSlug,
  listarIndicadoresMunicipio,
  obterResumoPopulacao,
  obterResumoMunicipios,
  listarSerieVariavelMunicipio,
  listarMunicipiosSemelhantes,
  obterResumoPontuacaoDimensao,
} = require("../repositories/municipiosRepository");

const AREA_KM2_BY_STATE = {
  AC: 164173,
  AL: 27778,
  AP: 142471,
  AM: 1559159,
  BA: 564733,
  CE: 148894,
  DF: 5761,
  ES: 46074,
  GO: 340106,
  MA: 331937,
  MG: 586513,
  MS: 357145,
  MT: 903208,
  PA: 1247689,
  PB: 56467,
  PE: 98067,
  PI: 251756,
  PR: 199298,
  RJ: 43750,
  RN: 52797,
  RO: 237590,
  RR: 223644,
  RS: 281730,
  SC: 95736,
  SE: 21938,
  SP: 248220,
  TO: 277423,
};

const MUNICIPIOS_CACHE_TTL_MS = 15 * 60 * 1000;
let municipiosCache = {
  data: null,
  expiresAt: 0,
  promise: null,
};

function parseCodigoIbge(codigoParam) {
  const municipioCodIbge = Number(codigoParam);

  if (!Number.isInteger(municipioCodIbge)) {
    const error = new Error("Codigo IBGE invalido");
    error.status = 400;
    throw error;
  }

  return municipioCodIbge;
}

function toFriendlyName(row) {
  return `${row.municipio_nome}-${row.estado_sigla}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

function handleControllerError(res, error, defaultMessage, logLabel) {
  if (error.status) {
    return res.status(error.status).json({
      error: error.message,
      ...(error.details || {}),
    });
  }

  console.error(logLabel, error);
  return res.status(500).json({ error: defaultMessage });
}

function parseVariavelSigla(siglaParam) {
  const variavelSigla = String(siglaParam || "").trim();

  if (
    variavelSigla.length === 0
    || variavelSigla.length > 80
    || !/^[\p{L}\p{N}_+.>=-]+$/u.test(variavelSigla)
  ) {
    const error = new Error("Sigla de variavel invalida");
    error.status = 400;
    throw error;
  }

  return variavelSigla;
}

function parseIndicadorReferencias(value) {
  return Array.from(new Set(
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number)
      .filter((item) => Number.isInteger(item) && item > 0)
  ));
}

function getNullableQueryString(value) {
  return String(value || "").trim();
}

function normalizeMunicipios(rows) {
  return rows.map((row) => ({
    ...row,
    municipio_area: row.municipio_area == null ? null : Number(row.municipio_area),
    populacao_total: row.populacao_total == null ? null : Number(row.populacao_total),
    municipio_nivel: row.municipio_nivel == null ? null : Number(row.municipio_nivel),
    rede_influencia: row.rede_influencia || null,
    rede_influencia_nivel: row.rede_influencia_nivel == null
      ? null
      : String(row.rede_influencia_nivel),
    formulario_nao_respondido:
      row.formulario_nao_respondido === true || row.formulario_nao_respondido === "true",
  }));
}

async function listarMunicipiosComCache({ forceRefresh = false } = {}) {
  const now = Date.now();

  if (!forceRefresh && municipiosCache.data && municipiosCache.expiresAt > now) {
    return municipiosCache.data;
  }

  if (!forceRefresh && municipiosCache.promise) {
    return municipiosCache.promise;
  }

  const loadPromise = listarMunicipios()
    .then((rows) => {
      const data = normalizeMunicipios(rows);
      municipiosCache = {
        data,
        expiresAt: Date.now() + MUNICIPIOS_CACHE_TTL_MS,
        promise: null,
      };
      return data;
    })
    .catch((error) => {
      municipiosCache.promise = null;
      throw error;
    });

  if (forceRefresh) {
    return loadPromise;
  }

  municipiosCache.promise = loadPromise;
  return municipiosCache.promise;
}

async function getMunicipios(req, res) {
  try {
    const forceRefresh = ["latest-levels-v4", "latest-levels-v5"].includes(req.query.calc);
    const municipios = await listarMunicipiosComCache({ forceRefresh });

    res.set(
      "Cache-Control",
      forceRefresh ? "no-store" : "public, max-age=300, stale-while-revalidate=900"
    );
    return res.json(municipios);
  } catch (error) {
    if (municipiosCache.data) {
      res.set("Cache-Control", "public, max-age=60");
      return res.json(municipiosCache.data);
    }

    return handleControllerError(res, error, "Erro ao buscar municipios", "Erro ao buscar municipios:");
  }
}

async function buscarMunicipios(req, res) {
  const q = (req.query.q || "").trim();

  if (q.length < 2) {
    return res.json([]);
  }

  try {
    const rows = await buscarMunicipiosPorNome(q);
    const cities = rows.map((row) => ({
      municipio_cod_ibge: row.municipio_cod_ibge,
      municipio_nome: row.municipio_nome,
      estado_nome: row.estado_nome,
      estado_sigla: row.estado_sigla,
      municipio_regiao: row.municipio_regiao,
      rede_influencia: row.rede_influencia || null,
      rede_influencia_nivel: row.rede_influencia_nivel == null
        ? null
        : String(row.rede_influencia_nivel),
      result: `${row.municipio_nome} - ${row.estado_sigla}`,
      friendlyName: toFriendlyName(row),
    }));

    return res.json(cities);
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar municipios", "Erro ao buscar municipios:");
  }
}

async function getMunicipioPorSlug(req, res) {
  const cityFriendlyName = (req.params.cityFriendlyName || "").trim().toLowerCase();

  if (!cityFriendlyName) {
    return res.status(400).json({ error: "Slug do municipio e obrigatorio" });
  }

  try {
    const municipio = await buscarMunicipioPorSlug(cityFriendlyName);

    if (!municipio) {
      return res.status(404).json({ error: "Municipio nao encontrado" });
    }

    return res.json({
      ...municipio,
      rede_influencia: municipio.rede_influencia || null,
      rede_influencia_nivel: municipio.rede_influencia_nivel == null
        ? null
        : String(municipio.rede_influencia_nivel),
    });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar municipio", "Erro ao buscar municipio por slug:");
  }
}

async function getIndicadoresMunicipio(req, res) {
  try {
    const municipioCodIbge = parseCodigoIbge(req.params.municipioCodIbge);
    const rows = await listarIndicadoresMunicipio(municipioCodIbge);
    const indicadores = rows.map((row) => ({
      indicador_id: String(row.indicador_referencia),
      indicador_nome: row.indicador_nome || null,
      indicador_descricao: row.indicador_descricao || null,
      variavel_fontes: Array.isArray(row.variavel_fontes) ? row.variavel_fontes : [],
      ano: row.ano == null ? null : Number(row.ano),
      indicador: row.indicador_valor == null ? null : Number(row.indicador_valor),
      indicador_texto: row.indicador_texto || null,
      indicador_valor_textual: row.indicador_valor_textual || null,
      nivel_maturidade: row.indicador_nivel == null ? null : Number(row.indicador_nivel),
      nivel_topico: row.nivel_topico == null ? null : Number(row.nivel_topico),
      dimensao_nivel: row.dimensao_nivel == null ? null : Number(row.dimensao_nivel),
    }));

    return res.json({
      municipio_cod_ibge: municipioCodIbge,
      indicadores,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Erro ao buscar indicadores do municipio",
      "Erro ao buscar indicadores do municipio:"
    );
  }
}

async function getResumoPontuacaoDimensao(req, res) {
  try {
    const municipioCodIbge = parseCodigoIbge(req.params.municipioCodIbge);
    const indicadorReferencias = parseIndicadorReferencias(req.query.indicadores);

    if (indicadorReferencias.length === 0) {
      return res.status(400).json({ error: "Indicadores da dimensao sao obrigatorios" });
    }

    const resumo = await obterResumoPontuacaoDimensao(municipioCodIbge, indicadorReferencias);

    return res.json({
      municipio_cod_ibge: municipioCodIbge,
      indicadores: indicadorReferencias,
      media_regional: resumo?.media_regional == null ? null : Number(resumo.media_regional),
      media_nacional: resumo?.media_nacional == null ? null : Number(resumo.media_nacional),
      municipios_regiao: resumo?.municipios_regiao == null ? 0 : Number(resumo.municipios_regiao),
      municipios_nacional:
        resumo?.municipios_nacional == null ? 0 : Number(resumo.municipios_nacional),
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Erro ao calcular resumo da pontuacao da dimensao",
      "Erro ao calcular resumo da pontuacao da dimensao:"
    );
  }
}

async function getResumoPopulacao(req, res) {
  try {
    const rows = await obterResumoPopulacao();

    const estados = {};
    const regioes = {};
    const areaEstados = {};
    const areaRegioes = {};
    const maturidadeEstados = {};
    const maturidadeRegioes = {};
    const maturidadeContagemEstados = {};
    const maturidadeContagemRegioes = {};
    let brasil = 0;
    let areaBrasil = 0;
    let maturidadeSomaBrasil = 0;
    let maturidadeContagemBrasil = 0;

    rows.forEach((row) => {
      const uf = row.estado_sigla;
      const totalEstado = Number(row.populacao_total) || 0;
      estados[uf] = totalEstado;

      const regiao = row.municipio_regiao || "Sem região";
      regioes[regiao] = (regioes[regiao] || 0) + totalEstado;

      brasil += totalEstado;

      const areaEstado = AREA_KM2_BY_STATE[uf] || 0;
      areaEstados[uf] = areaEstado;
      areaRegioes[regiao] = (areaRegioes[regiao] || 0) + areaEstado;
      areaBrasil += areaEstado;

      const maturidadeSoma = Number(row.maturidade_soma) || 0;
      const maturidadeContagem = Number(row.maturidade_count) || 0;

      if (maturidadeContagem > 0) {
        maturidadeEstados[uf] = maturidadeSoma / maturidadeContagem;
        maturidadeContagemEstados[uf] = maturidadeContagem;

        maturidadeRegioes[regiao] = (maturidadeRegioes[regiao] || 0) + maturidadeSoma;
        maturidadeContagemRegioes[regiao] = (maturidadeContagemRegioes[regiao] || 0) + maturidadeContagem;
        maturidadeSomaBrasil += maturidadeSoma;
        maturidadeContagemBrasil += maturidadeContagem;
      }
    });

    Object.keys(maturidadeRegioes).forEach((regiao) => {
      maturidadeRegioes[regiao] =
        maturidadeRegioes[regiao] / maturidadeContagemRegioes[regiao];
    });

    return res.json({
      brasil,
      estados,
      regioes,
      areas: {
        brasil: areaBrasil,
        estados: areaEstados,
        regioes: areaRegioes,
      },
      maturidade: {
        brasil: maturidadeContagemBrasil > 0
          ? maturidadeSomaBrasil / maturidadeContagemBrasil
          : null,
        estados: maturidadeEstados,
        regioes: maturidadeRegioes,
        contagens: {
          brasil: maturidadeContagemBrasil,
          estados: maturidadeContagemEstados,
          regioes: maturidadeContagemRegioes,
        },
      },
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Erro ao buscar resumo populacional",
      "Erro ao buscar resumo populacional:"
    );
  }
}

async function getResumoMunicipios(req, res) {
  try {
    const estadoSigla = getNullableQueryString(req.query.estado_sigla).toUpperCase();
    const regiao = getNullableQueryString(req.query.regiao);
    const redeInfluencia = getNullableQueryString(req.query.rede_influencia);

    if (estadoSigla && !/^[A-Z]{2}$/.test(estadoSigla)) {
      return res.status(400).json({ error: "Sigla de estado invalida" });
    }

    const row = await obterResumoMunicipios({
      estadoSigla,
      regiao,
      redeInfluencia,
    });
    const maturidadeCount = Number(row?.maturidade_count) || 0;
    const maturidadeSoma = Number(row?.maturidade_soma) || 0;

    return res.json({
      filtros: {
        estado_sigla: estadoSigla || null,
        regiao: regiao || null,
        rede_influencia: redeInfluencia || null,
      },
      estados_total: Number(row?.estados_total) || 0,
      municipios_total: Number(row?.municipios_total) || 0,
      populacao_total: Number(row?.populacao_total) || 0,
      area_total: Number(row?.area_total) || 0,
      maturidade_media: maturidadeCount > 0
        ? maturidadeSoma / maturidadeCount
        : null,
      maturidade_count: maturidadeCount,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Erro ao buscar resumo de municipios",
      "Erro ao buscar resumo de municipios:"
    );
  }
}

async function getSerieVariavelMunicipio(req, res) {
  try {
    const municipioCodIbge = parseCodigoIbge(req.params.municipioCodIbge);
    const variavelSigla = parseVariavelSigla(req.params.variavelSigla);

    const rows = await listarSerieVariavelMunicipio(municipioCodIbge, variavelSigla);

    const serie = rows.map((row) => ({
      ano: Number(row.ano),
      valor: row.variavel_valor == null ? null : Number(row.variavel_valor),
      media_regional: row.media_regional == null ? null : Number(row.media_regional),
      media_nacional: row.media_nacional == null ? null : Number(row.media_nacional),
    }));

    return res.json({
      municipio_cod_ibge: municipioCodIbge,
      variavel_sigla: variavelSigla,
      serie,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Erro ao buscar serie da variavel",
      "Erro ao buscar serie da variavel:"
    );
  }
}

async function getComparativoMunicipiosSemelhantes(req, res) {
  try {
    const municipioCodIbge = parseCodigoIbge(req.params.municipioCodIbge);
    const requestedLimit = Number.parseInt(String(req.query.limit || "6"), 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(3, Math.min(10, requestedLimit))
      : 6;
    const indicadorReferencias = parseIndicadorReferencias(req.query.indicadores);

    const rows = await listarMunicipiosSemelhantes(municipioCodIbge, limit, indicadorReferencias);
    const criterioComparacao = rows[0]?.criterio_aplicado || "hierarquia_regic_indisponivel";
    const recorteGeografico = rows[0]?.recorte_geografico || null;
    const usaDistanciaGeografica = Boolean(rows[0]?.usa_distancia_geografica);
    const usaProximidadePopulacional = Boolean(rows[0]?.usa_proximidade_populacional);
    const usaVariaveisSocioeconomicas = Boolean(rows[0]?.usa_variaveis_socioeconomicas);
    const hierarquia3Referencia = rows[0]?.hierarquia_3_referencia || null;

    const comparativo = rows.map((row) => ({
      municipio_cod_ibge: Number(row.municipio_cod_ibge),
      municipio_nome: row.municipio_nome,
      estado_sigla: row.estado_sigla,
      hierarquia_2: row.hierarquia_2 || null,
      hierarquia_3: row.hierarquia_3 || null,
      distancia_km: row.distancia_km == null ? null : Number(row.distancia_km),
      score: Number(row.score) || 0,
      is_current: Boolean(row.is_current),
      similaridade_score: row.similaridade_score == null ? null : Number(row.similaridade_score),
    }));

    return res.json({
      municipio_cod_ibge: municipioCodIbge,
      criterio_comparacao: criterioComparacao,
      recorte_geografico: recorteGeografico,
      usa_distancia_geografica: usaDistanciaGeografica,
      usa_proximidade_populacional: usaProximidadePopulacional,
      usa_variaveis_socioeconomicas: usaVariaveisSocioeconomicas,
      hierarquia_3_referencia: hierarquia3Referencia,
      comparativo,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Erro ao buscar comparativo de municipios semelhantes",
      "Erro ao buscar comparativo de municipios semelhantes:"
    );
  }
}

module.exports = {
  parseIndicadorReferencias,
  parseVariavelSigla,
  getMunicipios,
  buscarMunicipios,
  getMunicipioPorSlug,
  getIndicadoresMunicipio,
  getResumoPontuacaoDimensao,
  getResumoPopulacao,
  getResumoMunicipios,
  getSerieVariavelMunicipio,
  getComparativoMunicipiosSemelhantes,
};

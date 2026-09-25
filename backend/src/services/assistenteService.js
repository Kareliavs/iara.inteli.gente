const {
  listarIndicadoresMunicipio,
  listarNiveisIndicadoresMunicipios,
  listarMunicipiosSemelhantes,
} = require("../repositories/municipiosRepository");

const ACTIONS = Object.freeze([
  "comparar_municipios",
  "desafios_oportunidades_transformacao_digital",
]);

const CHALLENGE_DIMENSIONS = [
  {
    codigo: "economica",
    ids: [3117, 3127, 3141, 3148, 3021, 3022, 3040, 3041, 3134, 4035, 4036, 4065, 3020, 4041, 4045, 3049, 3076, 3124, 4011, 4012, 4031, 4046, 4024, 4025, 4032, 4033, 3004, 4066, 3016, 4010, 3122, 3139, 3145, 4005, 3033],
  },
  {
    codigo: "sociocultural",
    ids: [3003, 3011, 3085, 3086, 3115, 4006, 4020, 4034, 4037, 4048, 3077, 3107, 3123, 4040, 3006, 3095, 3096, 3125, 4004, 4021, 4049, 4067, 3048, 4016, 4017, 3007, 4042, 4068, 4069, 3037, 3039, 4039, 4043, 4044, 3103, 3147],
  },
  {
    codigo: "meio_ambiente",
    ids: [3024, 3028, 3042, 3110, 3128, 4047, 4071, 4007, 4014, 3057, 4030, 3056, 3113, 3043, 3069, 4070],
  },
];

const COPY = {
  pt: {
    noData: "Não há dados suficientes para esta consulta.",
    similarIntro: (name, count) => `${name} foi comparado com ${count} município(s) semelhante(s), com os resultados separados por dimensão.`,
    challenges: (name) => `Desafios e oportunidades para a transformação digital de ${name}, organizados pelas três dimensões analisadas.`,
    dimensionNames: { economica: "Dimensão Econômica", sociocultural: "Dimensão Sociocultural", meio_ambiente: "Dimensão Meio Ambiente" },
    similarSource: "Comparativo de municípios semelhantes",
  },
  en: {
    noData: "There is not enough data for this query.",
    similarIntro: (name, count) => `${name} was compared with ${count} similar municipality(ies), with results separated by dimension.`,
    challenges: (name) => `Digital transformation challenges and opportunities for ${name}, organized by the three analyzed dimensions.`,
    dimensionNames: { economica: "Economic Dimension", sociocultural: "Sociocultural Dimension", meio_ambiente: "Environment Dimension" },
    similarSource: "Similar municipalities comparison",
  },
  es: {
    noData: "No hay datos suficientes para esta consulta.",
    similarIntro: (name, count) => `${name} fue comparado con ${count} municipio(s) similar(es), con los resultados separados por dimensión.`,
    challenges: (name) => `Desafíos y oportunidades para la transformación digital de ${name}, organizados por las tres dimensiones analizadas.`,
    dimensionNames: { economica: "Dimensión Económica", sociocultural: "Dimensión Sociocultural", meio_ambiente: "Dimensión Medio Ambiente" },
    similarSource: "Comparación de municipios similares",
  },
  fr: {
    noData: "Les données disponibles ne suffisent pas pour cette consultation.",
    similarIntro: (name, count) => `${name} a été comparée à ${count} municipalité(s) similaire(s), avec des résultats séparés par dimension.`,
    challenges: (name) => `Défis et opportunités pour la transformation numérique de ${name}, organisés selon les trois dimensions analysées.`,
    dimensionNames: { economica: "Dimension économique", sociocultural: "Dimension socioculturelle", meio_ambiente: "Dimension environnementale" },
    similarSource: "Comparaison de municipalités similaires",
  },
};

function normalizeIndicators(rows, indicatorIds) {
  const allowedIds = new Set((indicatorIds || []).map(String));
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: String(row.indicador_referencia ?? row.indicador_id ?? ""),
    nome: row.indicador_nome || null,
    ano: row.ano == null ? null : Number(row.ano),
    valor: row.indicador_valor == null ? (row.indicador == null ? null : Number(row.indicador)) : Number(row.indicador_valor),
    valor_textual: row.indicador_valor_textual || row.indicador_texto || null,
    nivel: row.indicador_nivel == null ? (row.nivel_maturidade == null ? null : Number(row.nivel_maturidade)) : Number(row.indicador_nivel),
    fontes: Array.isArray(row.variavel_fontes) ? row.variavel_fontes.filter(Boolean) : [],
  })).filter((item) => item.id && (allowedIds.size === 0 || allowedIds.has(item.id)));
}

const usableIndicators = (indicators) => indicators.filter((item) => Number.isFinite(item.nivel) && item.nivel >= 1 && item.nivel <= 7);

function buildComparisonSections(municipalities, levelRows, copy) {
  const levelsByMunicipality = new Map();
  for (const row of Array.isArray(levelRows) ? levelRows : []) {
    const municipalityCode = Number(row.municipio_cod_ibge);
    const indicatorId = Number(row.indicador_referencia);
    const level = Number(row.indicador_nivel);
    if (!Number.isInteger(municipalityCode) || !Number.isInteger(indicatorId) || !Number.isFinite(level) || level < 1 || level > 7) continue;
    if (!levelsByMunicipality.has(municipalityCode)) levelsByMunicipality.set(municipalityCode, new Map());
    levelsByMunicipality.get(municipalityCode).set(indicatorId, level);
  }

  return CHALLENGE_DIMENSIONS.map((dimension) => ({
    codigo: dimension.codigo,
    titulo: copy.dimensionNames[dimension.codigo],
    itens: municipalities.map((municipality) => {
      const levels = dimension.ids
        .map((indicatorId) => levelsByMunicipality.get(municipality.municipio_cod_ibge)?.get(indicatorId))
        .filter((level) => Number.isFinite(level));
      const score = levels.length === 0
        ? null
        : Math.round((levels.reduce((sum, level) => sum + level, 0) / levels.length / 7) * 100);
      return { ...municipality, pontuacao: score, indicadores_com_nivel: levels.length };
    }),
  }));
}

function baseResponse({ municipio, indicators = [], resposta, fontes = [], limitacoes = [], dados = null }) {
  return {
    resposta,
    municipio: { nome: municipio.municipio_nome, codigo_ibge: Number(municipio.municipio_cod_ibge), uf: municipio.estado_sigla },
    indicadores_utilizados: Array.from(new Set(indicators.map((item) => item.id))).sort(),
    anos_utilizados: Array.from(new Set(indicators.map((item) => item.ano).filter(Number.isInteger))).sort(),
    fontes, limitacoes, dados,
  };
}

async function executarConsultaOrientada(
  { acao, contexto, municipio },
  {
    listarIndicadores = listarIndicadoresMunicipio,
    listarNiveis = listarNiveisIndicadoresMunicipios,
    listarSemelhantes = listarMunicipiosSemelhantes,
  } = {},
) {
  const language = COPY[contexto.idioma] ? contexto.idioma : "pt";
  const copy = COPY[language];
  const code = contexto.municipio_cod_ibge;

  if (acao === "comparar_municipios") {
    const rows = await listarSemelhantes(code, 6, []);
    const municipalities = (Array.isArray(rows) ? rows : []).map((row) => ({
      municipio_cod_ibge: Number(row.municipio_cod_ibge), municipio_nome: row.municipio_nome,
      estado_sigla: row.estado_sigla, atual: Boolean(row.is_current),
    }));
    const indicatorReferences = CHALLENGE_DIMENSIONS.flatMap((dimension) => dimension.ids);
    const levelRows = municipalities.length
      ? await listarNiveis(municipalities.map((item) => item.municipio_cod_ibge), indicatorReferences)
      : [];
    const sections = buildComparisonSections(municipalities, levelRows, copy);
    const comparable = municipalities.filter((item) => !item.atual);
    const hasScores = sections.some((section) => section.itens.some((item) => item.pontuacao !== null));
    return baseResponse({
      municipio,
      resposta: municipalities.length ? copy.similarIntro(municipio.municipio_nome, comparable.length) : copy.noData,
      fontes: [{ titulo: copy.similarSource, referencia: `/api/municipios/${code}/comparativo-semelhantes` }],
      limitacoes: municipalities.length && hasScores ? [] : [copy.noData],
      dados: { tipo: acao, secoes: sections },
    });
  }

  if (acao === "desafios_oportunidades_transformacao_digital") {
    const allIndicators = normalizeIndicators(await listarIndicadores(code), []);
    const sections = CHALLENGE_DIMENSIONS.map((dimension) => {
      const allowedIds = new Set(dimension.ids.map(String));
      const items = usableIndicators(allIndicators)
        .filter((item) => allowedIds.has(item.id))
        .sort((left, right) => left.nivel - right.nivel || left.id.localeCompare(right.id))
        .slice(0, 5)
        .map(({ id, nome, nivel }) => ({ id, nome, nivel }));
      return {
        codigo: dimension.codigo,
        titulo: copy.dimensionNames[dimension.codigo],
        itens: items,
      };
    });
    const selectedIndicators = sections.flatMap((section) => section.itens);
    const emptySections = sections.filter((section) => section.itens.length === 0);
    return baseResponse({
      municipio,
      indicators: selectedIndicators,
      resposta: copy.challenges(municipio.municipio_nome),
      limitacoes: emptySections.length ? [copy.noData] : [],
      dados: { tipo: acao, secoes: sections },
    });
  }

  return baseResponse({ municipio, resposta: copy.noData, limitacoes: [copy.noData] });
}

module.exports = { ACTIONS, CHALLENGE_DIMENSIONS, buildComparisonSections, executarConsultaOrientada, normalizeIndicators };

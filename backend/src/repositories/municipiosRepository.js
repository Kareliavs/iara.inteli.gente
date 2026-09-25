const { pool } = require("../config/db");
const { getHierarchyByMunicipioCod } = require("../services/regicHierarchyService");
const { getCoordinatesByMunicipioCod } = require("../services/municipioCoordinatesService");

const COMPARISON_COMPONENT_WEIGHTS = {
  geo: 0.35,
  pop: 0.2,
  pibPc: 0.2,
  idhm: 0.15,
  gini: 0.1,
};

const REDE_INFLUENCIA_CTE = `
  latest_rede_influencia_ano AS (
    SELECT MAX(ano) AS ano
    FROM bd.municipio_apresenta_indicador
    WHERE indicador_referencia = 4038
      AND indicador_valor IS NOT NULL
  ),
  rede_influencia_indicador AS (
    SELECT DISTINCT ON (mai.municipio_cod_ibge)
      mai.municipio_cod_ibge,
      ROUND(mai.indicador_valor)::int AS rede_influencia_nivel,
      CASE ROUND(mai.indicador_valor)::int
        WHEN 1 THEN 'Grande Metrópole Nacional'
        WHEN 2 THEN 'Metrópole Nacional'
        WHEN 3 THEN 'Metrópole'
        WHEN 4 THEN 'Capital Regional A'
        WHEN 5 THEN 'Capital Regional B'
        WHEN 6 THEN 'Capital Regional C'
        WHEN 7 THEN 'Centro Sub-Regional A'
        WHEN 8 THEN 'Centro Sub-Regional B'
        WHEN 9 THEN 'Centro de Zona A'
        WHEN 10 THEN 'Centro de Zona B'
        WHEN 11 THEN 'Centro Local'
        ELSE NULL
      END AS rede_influencia
    FROM bd.municipio_apresenta_indicador mai
    JOIN latest_rede_influencia_ano latest
      ON latest.ano = mai.ano
    WHERE mai.indicador_referencia = 4038
      AND mai.indicador_valor IS NOT NULL
      AND ROUND(mai.indicador_valor)::int BETWEEN 1 AND 11
    ORDER BY mai.municipio_cod_ibge, mai.ano DESC NULLS LAST
  )
`;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function getDistanceKm(coordsA, coordsB) {
  if (!coordsA || !coordsB) return null;

  const earthRadiusKm = 6371;
  const lat1 = toRadians(coordsA.latitude);
  const lat2 = toRadians(coordsB.latitude);
  const deltaLat = toRadians(coordsB.latitude - coordsA.latitude);
  const deltaLon = toRadians(coordsB.longitude - coordsA.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

async function listarMunicipios() {
  const result = await pool.query(`
    WITH indicador_pesos(dimensao, topico, indicador_referencia, peso) AS (
      VALUES
        ('economica', 'agua_esgoto', 3117, 3),
        ('economica', 'agua_esgoto', 3127, 3),
        ('economica', 'agua_esgoto', 3141, 3),
        ('economica', 'agua_esgoto', 3148, 2),
        ('economica', 'infraestrutura_conectividade', 3021, 3),
        ('economica', 'infraestrutura_conectividade', 3022, 3),
        ('economica', 'infraestrutura_conectividade', 3040, 2),
        ('economica', 'infraestrutura_conectividade', 3041, 2),
        ('economica', 'infraestrutura_conectividade', 3134, 2),
        ('economica', 'infraestrutura_conectividade', 4035, 2),
        ('economica', 'infraestrutura_conectividade', 4036, 1),
        ('economica', 'infraestrutura_conectividade', 4065, 2),
        ('economica', 'habitacao', 3020, 3),
        ('economica', 'habitacao', 4041, 3),
        ('economica', 'habitacao', 4045, 3),
        ('economica', 'transporte', 3049, 1),
        ('economica', 'transporte', 3076, 1),
        ('economica', 'transporte', 3124, 2),
        ('economica', 'transporte', 4011, 1),
        ('economica', 'transporte', 4012, 1),
        ('economica', 'transporte', 4031, 3),
        ('economica', 'transporte', 4046, 2),
        ('economica', 'inovacao', 4024, 3),
        ('economica', 'inovacao', 4025, 3),
        ('economica', 'inovacao', 4032, 3),
        ('economica', 'inovacao', 4033, 3),
        ('economica', 'servicos_online_prefeitura', 3004, 2),
        ('economica', 'servicos_online_prefeitura', 4066, 2),
        ('economica', 'sistemas_tecnologia_gestao_urbana', 3016, 1),
        ('economica', 'sistemas_tecnologia_gestao_urbana', 4010, 2),
        ('economica', 'residuos_solidos', 3122, 1),
        ('economica', 'urbanizacao_vias_publicas', 3139, 3),
        ('economica', 'urbanizacao_vias_publicas', 3145, 3),
        ('economica', 'urbanizacao_vias_publicas', 4005, 3),
        ('economica', 'dados_abertos', 3033, 1),
        ('meio_ambiente', 'agua_esgoto', 3024, 3),
        ('meio_ambiente', 'agua_esgoto', 3028, 2),
        ('meio_ambiente', 'agua_esgoto', 3042, 1),
        ('meio_ambiente', 'agua_esgoto', 3110, 3),
        ('meio_ambiente', 'agua_esgoto', 3128, 3),
        ('meio_ambiente', 'agua_esgoto', 4047, 3),
        ('meio_ambiente', 'agua_esgoto', 4071, 3),
        ('meio_ambiente', 'residuos_solidos', 4007, 3),
        ('meio_ambiente', 'residuos_solidos', 4014, 1),
        ('meio_ambiente', 'areas_verdes', 3057, 2),
        ('meio_ambiente', 'areas_verdes', 4030, 3),
        ('meio_ambiente', 'qualidade_ar', 3056, 1),
        ('meio_ambiente', 'qualidade_ar', 3113, 1),
        ('meio_ambiente', 'energia', 3043, 1),
        ('meio_ambiente', 'energia', 3069, 1),
        ('meio_ambiente', 'gestao_desastres', 4070, 3),
        ('sociocultural', 'educacao', 3003, 2),
        ('sociocultural', 'educacao', 3011, 3),
        ('sociocultural', 'educacao', 3085, 3),
        ('sociocultural', 'educacao', 3086, 3),
        ('sociocultural', 'educacao', 3115, 3),
        ('sociocultural', 'educacao', 4006, 2),
        ('sociocultural', 'educacao', 4020, 3),
        ('sociocultural', 'educacao', 4034, 3),
        ('sociocultural', 'educacao', 4037, 3),
        ('sociocultural', 'educacao', 4048, 3),
        ('sociocultural', 'cultura', 3077, 3),
        ('sociocultural', 'cultura', 3107, 2),
        ('sociocultural', 'cultura', 3123, 1),
        ('sociocultural', 'cultura', 4040, 1),
        ('sociocultural', 'saude', 3006, 1),
        ('sociocultural', 'saude', 3095, 3),
        ('sociocultural', 'saude', 3096, 3),
        ('sociocultural', 'saude', 3125, 1),
        ('sociocultural', 'saude', 4004, 1),
        ('sociocultural', 'saude', 4021, 3),
        ('sociocultural', 'saude', 4049, 3),
        ('sociocultural', 'saude', 4067, 3),
        ('sociocultural', 'seguranca_publica', 3048, 1),
        ('sociocultural', 'seguranca_publica', 4016, 3),
        ('sociocultural', 'seguranca_publica', 4017, 3),
        ('sociocultural', 'gestao_desastres', 3007, 2),
        ('sociocultural', 'gestao_desastres', 4042, 1),
        ('sociocultural', 'gestao_desastres', 4068, 3),
        ('sociocultural', 'gestao_desastres', 4069, 3),
        ('sociocultural', 'inclusao_digital', 3037, 3),
        ('sociocultural', 'inclusao_digital', 3039, 3),
        ('sociocultural', 'inclusao_social', 4039, 2),
        ('sociocultural', 'inclusao_social', 4043, 2),
        ('sociocultural', 'inclusao_social', 4044, 2),
        ('sociocultural', 'participacao_publica', 3103, 2),
        ('sociocultural', 'participacao_publica', 3147, 1),
        ('capacidades_institucionais', 'estrategia', 6003, 3),
        ('capacidades_institucionais', 'estrategia', 6005, 3),
        ('capacidades_institucionais', 'estrategia', 6006, 3),
        ('capacidades_institucionais', 'infraestrutura_hw_sw', 6021, 2),
        ('capacidades_institucionais', 'infraestrutura_hw_sw', 6024, 2),
        ('capacidades_institucionais', 'servicos_aplicacoes', 6044, 3),
        ('capacidades_institucionais', 'servicos_aplicacoes', 6048, 2),
        ('capacidades_institucionais', 'servicos_aplicacoes', 6056, 3),
        ('capacidades_institucionais', 'monitoramento', 6009, 2),
        ('capacidades_institucionais', 'monitoramento', 6054, 2),
        ('capacidades_institucionais', 'monitoramento', 6055, 2),
        ('capacidades_institucionais', 'dados_abertos', 6035, 3),
        ('capacidades_institucionais', 'dados_abertos', 6037, 2),
        ('capacidades_institucionais', 'dados_abertos', 6038, 2)
    ),
    indicadores_recentes AS (
      SELECT DISTINCT ON (mai.municipio_cod_ibge, mai.indicador_referencia)
        mai.municipio_cod_ibge,
        mai.indicador_referencia,
        mai.indicador_nivel::numeric AS indicador_nivel
      FROM bd.municipio_apresenta_indicador mai
      JOIN (SELECT DISTINCT indicador_referencia FROM indicador_pesos) refs
        ON refs.indicador_referencia = mai.indicador_referencia
      ORDER BY
        mai.municipio_cod_ibge,
        mai.indicador_referencia,
        mai.ano DESC NULLS LAST
    ),
    topicos AS (
      SELECT
        ir.municipio_cod_ibge,
        ip.dimensao,
        ip.topico,
        ROUND(SUM(ir.indicador_nivel * ip.peso)::numeric / NULLIF(SUM(ip.peso), 0))::int
          AS topico_nivel
      FROM indicadores_recentes ir
      JOIN indicador_pesos ip
        ON ip.indicador_referencia = ir.indicador_referencia
      WHERE ir.indicador_nivel BETWEEN 1 AND 7
      GROUP BY ir.municipio_cod_ibge, ip.dimensao, ip.topico
    ),
    dimensoes AS (
      SELECT
        municipio_cod_ibge,
        dimensao,
        ROUND(AVG(topico_nivel::numeric))::int AS dimensao_nivel
      FROM topicos
      GROUP BY municipio_cod_ibge, dimensao
    ),
    municipio_niveis AS (
      SELECT
        municipio_cod_ibge,
        ROUND(AVG(dimensao_nivel::numeric))::int AS municipio_nivel
      FROM dimensoes
      GROUP BY municipio_cod_ibge
    ),
    pop_municipio AS (
      SELECT DISTINCT ON (municipio_cod_ibge)
        municipio_cod_ibge,
        variavel_valor::numeric AS pop_tot
      FROM bd.municipio_apresenta_variavel
      WHERE variavel_sigla = 'POP_TOT'
      ORDER BY municipio_cod_ibge, ano DESC NULLS LAST
    ),
    indicadores_formulario_recentes AS (
      SELECT DISTINCT ON (mai.municipio_cod_ibge, mai.indicador_referencia)
        mai.municipio_cod_ibge,
        mai.indicador_referencia,
        mai.indicador_valor_textual
      FROM bd.municipio_apresenta_indicador mai
      WHERE mai.indicador_referencia IN (
        3049, 3076, 4012, 4006, 3123, 4040, 3006, 3125, 4004,
        3048, 3042, 4014, 3056, 3113, 3043, 3069, 6003, 6005,
        6006, 6021, 6024, 6048, 6009, 6054, 6035, 6002, 6011,
        6017, 6019
      )
      ORDER BY
        mai.municipio_cod_ibge,
        mai.indicador_referencia,
        mai.ano DESC NULLS LAST
    ),
    formularios_nao_respondidos AS (
      SELECT
        municipio_cod_ibge,
        COUNT(*) = 29
          AND BOOL_AND(
            COALESCE(
              unaccent(lower(btrim(indicador_valor_textual))) = 'sem resposta do formulario',
              false
            )
          ) AS formulario_nao_respondido
      FROM indicadores_formulario_recentes
      GROUP BY municipio_cod_ibge
    ),
    ${REDE_INFLUENCIA_CTE}
    SELECT
      m.municipio_cod_ibge,
      m.municipio_nome,
      m.estado_nome,
      m.estado_sigla,
      m.municipio_regiao,
      m.municipio_area,
      COALESCE(pm.pop_tot, 0) AS populacao_total,
      mn.municipio_nivel,
      ri.rede_influencia,
      ri.rede_influencia_nivel,
      COALESCE(fnr.formulario_nao_respondido, false) AS formulario_nao_respondido
    FROM bd.municipio m
    LEFT JOIN pop_municipio pm
      ON pm.municipio_cod_ibge = m.municipio_cod_ibge
    LEFT JOIN municipio_niveis mn
      ON mn.municipio_cod_ibge = m.municipio_cod_ibge
    LEFT JOIN rede_influencia_indicador ri
      ON ri.municipio_cod_ibge = m.municipio_cod_ibge
    LEFT JOIN formularios_nao_respondidos fnr
      ON fnr.municipio_cod_ibge = m.municipio_cod_ibge
    ORDER BY m.municipio_nome
  `);

  return result.rows;
}

async function buscarMunicipiosPorNome(nome) {
  const result = await pool.query(
    `
    WITH ${REDE_INFLUENCIA_CTE}
    SELECT
      m.municipio_cod_ibge,
      m.municipio_nome,
      m.estado_nome,
      m.estado_sigla,
      m.municipio_regiao,
      ri.rede_influencia,
      ri.rede_influencia_nivel
    FROM bd.municipio m
    LEFT JOIN rede_influencia_indicador ri
      ON ri.municipio_cod_ibge = m.municipio_cod_ibge
    WHERE unaccent(m.municipio_nome) ILIKE unaccent($1)
    ORDER BY m.municipio_nome
    LIMIT 20
    `,
    [`%${nome}%`]
  );

  return result.rows;
}

async function buscarMunicipioPorSlug(cityFriendlyName) {
  const result = await pool.query(
    `
    WITH ${REDE_INFLUENCIA_CTE}
    SELECT
      m.municipio_cod_ibge,
      m.municipio_nome,
      m.estado_nome,
      m.estado_sigla,
      m.municipio_regiao,
      ri.rede_influencia,
      ri.rede_influencia_nivel
    FROM bd.municipio m
    LEFT JOIN rede_influencia_indicador ri
      ON ri.municipio_cod_ibge = m.municipio_cod_ibge
    WHERE lower(
      regexp_replace(
        replace(unaccent(m.municipio_nome || '-' || m.estado_sigla), '''', ''),
        '\\s+',
        '-',
        'g'
      )
    ) = $1
    LIMIT 1
    `,
    [cityFriendlyName]
  );

  return result.rows[0] || null;
}

async function buscarMunicipioPorCodigo(municipioCodIbge) {
  const result = await pool.query(
    `
    SELECT
      m.municipio_cod_ibge,
      m.municipio_nome,
      m.estado_nome,
      m.estado_sigla,
      m.municipio_regiao,
      EXISTS (
        SELECT 1
        FROM (
          SELECT DISTINCT ON (mai.indicador_referencia)
            mai.indicador_referencia,
            mai.indicador_valor_textual
          FROM bd.municipio_apresenta_indicador mai
          WHERE mai.municipio_cod_ibge = m.municipio_cod_ibge
            AND mai.indicador_referencia IN (
              3049, 3076, 4012, 4006, 3123, 4040, 3006, 3125, 4004,
              3048, 3042, 4014, 3056, 3113, 3043, 3069, 6003, 6005,
              6006, 6021, 6024, 6048, 6009, 6054, 6035, 6002, 6011,
              6017, 6019
            )
          ORDER BY mai.indicador_referencia, mai.ano DESC NULLS LAST
        ) formulario
        WHERE NULLIF(btrim(formulario.indicador_valor_textual), '') IS NOT NULL
          AND unaccent(lower(btrim(formulario.indicador_valor_textual))) <> 'sem resposta do formulario'
      ) AS formulario_respondido
    FROM bd.municipio m
    WHERE m.municipio_cod_ibge = $1
    LIMIT 1
    `,
    [municipioCodIbge]
  );

  return result.rows[0] || null;
}

async function buscarVariaveisMunicipio(municipioCodIbge, siglas) {
  if (!siglas || siglas.length === 0) {
    return {};
  }

  const query = `
    SELECT
      variavel_sigla,
      variavel_valor
    FROM (
      SELECT DISTINCT ON (variavel_sigla)
        variavel_sigla,
        variavel_valor,
        ano
      FROM bd.municipio_apresenta_variavel
      WHERE municipio_cod_ibge = $1
        AND variavel_sigla = ANY($2::text[])
      ORDER BY variavel_sigla, ano DESC NULLS LAST
    ) t
  `;

  const result = await pool.query(query, [municipioCodIbge, siglas]);
  const variaveis = {};

  for (const row of result.rows) {
    variaveis[row.variavel_sigla] = Number(row.variavel_valor);
  }

  return variaveis;
}

async function listarIndicadoresMunicipio(municipioCodIbge) {
  const query = `
    WITH fallback_indicadores(indicador_referencia, indicador_nome) AS (
      VALUES
        (4051, 'Número de empresas em parques tecnológicos'),
        (4052, 'Número de Incubadoras credenciadas - Lei de TIC'),
        (4053, 'Número de Instituições de Ensino e Pesquisa em PD&I - Lei de TIC'),
        (4054, 'Número de Centros e/ou Institutos de PD&I - Lei de TIC'),
        (4055, 'Número de Empresas habilitadas - Lei de TIC'),
        (4060, 'Número de empresas - Lei do Bem PD&I'),
        (4061, 'Número de Unidade de Conservação'),
        (4063, 'Energia Eólica'),
        (4064, 'Número de Mineradoras'),
        (4161, 'Numero de data centers'),
        (6002, 'Incorporação de TICs - Áreas Prioritárias'),
        (6011, 'Governança Tecnológica - Responsáveis'),
        (6017, 'Governança de TI - Responsável'),
        (6019, 'Equipe de TI - Tamanho'),
        (6058, 'Plano Municipal de Gestão Integrada de Resíduos Sólidos'),
        (6059, 'Plano municipal de saneamento básico')
    ),
    indicadores_ordenados AS (
      SELECT
        mai.indicador_referencia,
        i.indicador_nome,
        i.indicador_descricao,
        COALESCE(
          ARRAY_AGG(DISTINCT v.variavel_fonte) FILTER (
            WHERE v.variavel_fonte IS NOT NULL AND btrim(v.variavel_fonte) <> ''
          ),
          ARRAY[]::text[]
        ) AS variavel_fontes,
        mai.ano,
        mai.indicador_valor,
        mai.texto AS indicador_texto,
        mai.indicador_valor_textual,
        mai.indicador_nivel,
        mai.topico_nivel AS nivel_topico,
        mai.dimensao_nivel,
        ROW_NUMBER() OVER (
          PARTITION BY mai.indicador_referencia
          ORDER BY mai.ano DESC NULLS LAST
        ) AS rn
      FROM bd.municipio_apresenta_indicador mai
      LEFT JOIN bd.indicador i
        ON i.indicador_referencia = mai.indicador_referencia
      LEFT JOIN bd.indicador_apresenta_variavel iav
        ON iav.indicador_referencia = mai.indicador_referencia
      LEFT JOIN bd.variavel v
        ON v.variavel_sigla = iav.variavel_sigla
      WHERE mai.municipio_cod_ibge = $1
      GROUP BY
        mai.indicador_referencia,
        i.indicador_nome,
        i.indicador_descricao,
        mai.ano,
        mai.indicador_valor,
        mai.texto,
        mai.indicador_valor_textual,
        mai.indicador_nivel,
        mai.topico_nivel,
        mai.dimensao_nivel
    )
    SELECT
      indicador_referencia,
      indicador_nome,
      indicador_descricao,
      variavel_fontes,
      ano,
      indicador_valor,
      indicador_texto,
      indicador_valor_textual,
      indicador_nivel,
      nivel_topico,
      dimensao_nivel
    FROM indicadores_ordenados
    WHERE rn = 1
    UNION ALL
    SELECT
      f.indicador_referencia,
      COALESCE(i.indicador_nome, f.indicador_nome) AS indicador_nome,
      i.indicador_descricao,
      COALESCE(
        ARRAY_AGG(DISTINCT v.variavel_fonte) FILTER (
          WHERE v.variavel_fonte IS NOT NULL AND btrim(v.variavel_fonte) <> ''
        ),
        ARRAY[]::text[]
      ) AS variavel_fontes,
      NULL::integer AS ano,
      NULL::numeric AS indicador_valor,
      NULL::text AS indicador_texto,
      NULL::text AS indicador_valor_textual,
      NULL::integer AS indicador_nivel,
      NULL::integer AS nivel_topico,
      NULL::integer AS dimensao_nivel
    FROM fallback_indicadores f
    LEFT JOIN bd.indicador i
      ON i.indicador_nome = f.indicador_nome
    LEFT JOIN bd.indicador_apresenta_variavel iav
      ON iav.indicador_referencia = i.indicador_referencia
    LEFT JOIN bd.variavel v
      ON v.variavel_sigla = iav.variavel_sigla
    WHERE NOT EXISTS (
      SELECT 1
      FROM indicadores_ordenados io
      WHERE io.rn = 1
        AND io.indicador_referencia = f.indicador_referencia
    )
    GROUP BY
      f.indicador_referencia,
      f.indicador_nome,
      i.indicador_nome,
      i.indicador_descricao
    ORDER BY indicador_referencia
  `;

  const result = await pool.query(query, [municipioCodIbge]);
  return result.rows;
}

async function listarNiveisIndicadoresMunicipios(municipioCodigos, indicadorReferencias) {
  const codigos = Array.from(new Set((Array.isArray(municipioCodigos) ? municipioCodigos : [])
    .map(Number)
    .filter(Number.isInteger)));
  const referencias = Array.from(new Set((Array.isArray(indicadorReferencias) ? indicadorReferencias : [])
    .map(Number)
    .filter(Number.isInteger)));

  if (codigos.length === 0 || referencias.length === 0) return [];

  const result = await pool.query(
    `
    WITH indicadores_recentes AS (
      SELECT
        municipio_cod_ibge,
        indicador_referencia,
        indicador_nivel,
        ROW_NUMBER() OVER (
          PARTITION BY municipio_cod_ibge, indicador_referencia
          ORDER BY ano DESC NULLS LAST
        ) AS rn
      FROM bd.municipio_apresenta_indicador
      WHERE municipio_cod_ibge = ANY($1::int[])
        AND indicador_referencia = ANY($2::int[])
        AND indicador_nivel BETWEEN 1 AND 7
    )
    SELECT
      municipio_cod_ibge,
      indicador_referencia,
      indicador_nivel
    FROM indicadores_recentes
    WHERE rn = 1
    ORDER BY municipio_cod_ibge, indicador_referencia
    `,
    [codigos, referencias]
  );

  return result.rows;
}

// Perf note: same caching rationale as _getCandidatosPool above — the
// per-municipio score list only depends on the indicator set, not on which
// municipio is being viewed, so it's cached and the target-relative
// aggregation (regional/national average) is computed cheaply per call.
const _municipioScoresCache = new Map();

async function _getMunicipioScores(indicadorReferencias) {
  const cacheKey = JSON.stringify(indicadorReferencias);
  if (_municipioScoresCache.has(cacheKey)) {
    return _municipioScoresCache.get(cacheKey);
  }
  const promise = _computeMunicipioScores(indicadorReferencias);
  _municipioScoresCache.set(cacheKey, promise);
  return promise;
}

async function _computeMunicipioScores(indicadorReferencias) {
  const query = `
    WITH latest AS (
      SELECT DISTINCT ON (mai.municipio_cod_ibge, mai.indicador_referencia)
        mai.municipio_cod_ibge,
        mai.indicador_referencia,
        mai.indicador_nivel::numeric AS indicador_nivel
      FROM bd.municipio_apresenta_indicador mai
      WHERE mai.indicador_referencia = ANY($1::int[])
        AND mai.indicador_nivel IS NOT NULL
      ORDER BY mai.municipio_cod_ibge, mai.indicador_referencia, mai.ano DESC NULLS LAST
    )
    SELECT
      m.municipio_cod_ibge,
      m.municipio_regiao,
      ROUND((AVG(l.indicador_nivel) / 7.0) * 100)::int AS score
    FROM latest l
    JOIN bd.municipio m
      ON m.municipio_cod_ibge = l.municipio_cod_ibge
    WHERE l.indicador_nivel BETWEEN 1 AND 7
    GROUP BY m.municipio_cod_ibge, m.municipio_regiao
  `;
  const result = await pool.query(query, [indicadorReferencias]);
  return result.rows;
}

async function obterResumoPontuacaoDimensao(municipioCodIbge, indicadorReferencias) {
  if (!Array.isArray(indicadorReferencias) || indicadorReferencias.length === 0) {
    return null;
  }

  const [scores, targetRows] = await Promise.all([
    _getMunicipioScores(indicadorReferencias),
    pool.query(
      "SELECT municipio_regiao FROM bd.municipio WHERE municipio_cod_ibge = $1 LIMIT 1",
      [municipioCodIbge]
    ),
  ]);
  const targetRegiao = targetRows.rows[0]?.municipio_regiao ?? null;

  const regiaoScores = scores.filter((s) => s.municipio_regiao === targetRegiao);
  const avg = (arr) => (arr.length ? arr.reduce((sum, s) => sum + s.score, 0) / arr.length : null);
  const media_regional = targetRegiao !== null && regiaoScores.length ? Math.round(avg(regiaoScores)) : null;
  const media_nacional = scores.length ? Math.round(avg(scores)) : null;

  return {
    media_regional,
    municipios_regiao: regiaoScores.length,
    media_nacional,
    municipios_nacional: scores.length,
  };
}

async function obterResumoPopulacao() {
  const query = `
    WITH pop_municipio AS (
      SELECT DISTINCT ON (municipio_cod_ibge)
        municipio_cod_ibge,
        variavel_valor::numeric AS pop_tot
      FROM bd.municipio_apresenta_variavel
      WHERE variavel_sigla = 'POP_TOT'
      ORDER BY municipio_cod_ibge, ano DESC NULLS LAST
    ),
    municipio_niveis AS (
      SELECT DISTINCT ON (municipio_cod_ibge)
        municipio_cod_ibge,
        municipio_nivel::numeric AS municipio_nivel
      FROM bd.municipio_apresenta_indicador
      WHERE municipio_nivel IS NOT NULL
      ORDER BY municipio_cod_ibge, ano DESC NULLS LAST, indicador_referencia DESC
    )
    SELECT
      m.estado_sigla,
      m.municipio_regiao,
      COALESCE(SUM(pm.pop_tot), 0)::bigint AS populacao_total,
      COALESCE(SUM(mn.municipio_nivel), 0)::numeric AS maturidade_soma,
      COUNT(mn.municipio_nivel)::int AS maturidade_count
    FROM bd.municipio m
    LEFT JOIN pop_municipio pm
      ON pm.municipio_cod_ibge = m.municipio_cod_ibge
    LEFT JOIN municipio_niveis mn
      ON mn.municipio_cod_ibge = m.municipio_cod_ibge
    GROUP BY m.estado_sigla, m.municipio_regiao
    ORDER BY m.estado_sigla
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function obterResumoMunicipios({ estadoSigla = "", regiao = "", redeInfluencia = "" } = {}) {
  const query = `
    WITH pop_municipio AS (
      SELECT DISTINCT ON (municipio_cod_ibge)
        municipio_cod_ibge,
        variavel_valor::numeric AS pop_tot
      FROM bd.municipio_apresenta_variavel
      WHERE variavel_sigla = 'POP_TOT'
      ORDER BY municipio_cod_ibge, ano DESC NULLS LAST
    ),
    municipio_niveis AS (
      SELECT DISTINCT ON (municipio_cod_ibge)
        municipio_cod_ibge,
        municipio_nivel::numeric AS municipio_nivel
      FROM bd.municipio_apresenta_indicador
      WHERE municipio_nivel IS NOT NULL
      ORDER BY municipio_cod_ibge, ano DESC NULLS LAST, indicador_referencia DESC
    ),
    ${REDE_INFLUENCIA_CTE},
    municipios_filtrados AS (
      SELECT
        m.municipio_cod_ibge,
        m.estado_sigla,
        m.municipio_regiao,
        COALESCE(pm.pop_tot, 0) AS pop_tot,
        COALESCE(m.municipio_area, 0)::numeric AS municipio_area,
        mn.municipio_nivel,
        ri.rede_influencia
      FROM bd.municipio m
      LEFT JOIN pop_municipio pm
        ON pm.municipio_cod_ibge = m.municipio_cod_ibge
      LEFT JOIN municipio_niveis mn
        ON mn.municipio_cod_ibge = m.municipio_cod_ibge
      LEFT JOIN rede_influencia_indicador ri
        ON ri.municipio_cod_ibge = m.municipio_cod_ibge
      WHERE ($1::text = '' OR m.estado_sigla = $1)
        AND ($2::text = '' OR m.municipio_regiao = $2)
        AND ($3::text = '' OR ri.rede_influencia = $3)
    )
    SELECT
      COUNT(*)::int AS municipios_total,
      COUNT(DISTINCT estado_sigla)::int AS estados_total,
      COALESCE(SUM(pop_tot), 0)::bigint AS populacao_total,
      COALESCE(SUM(municipio_area), 0)::numeric AS area_total,
      COALESCE(SUM(municipio_nivel), 0)::numeric AS maturidade_soma,
      COUNT(municipio_nivel)::int AS maturidade_count
    FROM municipios_filtrados
  `;

  const result = await pool.query(query, [estadoSigla, regiao, redeInfluencia]);
  return result.rows[0] || null;
}

async function listarSerieVariavelMunicipio(municipioCodIbge, variavelSigla) {
  const query = `
    WITH target AS (
      SELECT municipio_regiao
      FROM bd.municipio
      WHERE municipio_cod_ibge = $1
    ),
    municipio AS (
      SELECT
        ano,
        variavel_valor::numeric AS variavel_valor
      FROM bd.municipio_apresenta_variavel
      WHERE municipio_cod_ibge = $1
        AND variavel_sigla = $2
        AND ano IS NOT NULL
        AND variavel_valor IS NOT NULL
    ),
    medias AS (
      SELECT
        mav.ano,
        AVG(mav.variavel_valor::numeric) FILTER (
          WHERE m.municipio_regiao = (SELECT municipio_regiao FROM target)
        ) AS media_regional,
        AVG(mav.variavel_valor::numeric) AS media_nacional
      FROM bd.municipio_apresenta_variavel mav
      JOIN bd.municipio m
        ON m.municipio_cod_ibge = mav.municipio_cod_ibge
      WHERE mav.variavel_sigla = $2
        AND mav.ano IS NOT NULL
        AND mav.variavel_valor IS NOT NULL
      GROUP BY mav.ano
    )
    SELECT
      COALESCE(municipio.ano, medias.ano) AS ano,
      municipio.variavel_valor,
      medias.media_regional,
      medias.media_nacional
    FROM municipio
    FULL JOIN medias
      ON medias.ano = municipio.ano
    ORDER BY ano ASC
  `;

  const result = await pool.query(query, [municipioCodIbge, variavelSigla]);
  return result.rows;
}

// Perf note: the candidate pool (population/PIB/IDHM/GINI/score for every
// municipio) only depends on the indicator filter, not on which municipio is
// being viewed. It is cached per filter so repeated calls (e.g. static-site
// generation across all 5571 municipios) don't recompute the same
// full-table scan thousands of times. Output is identical either way.
const _candidatosPoolCache = new Map();

async function _getCandidatosPool(scoreIndicatorFilter) {
  const cacheKey = JSON.stringify(scoreIndicatorFilter);
  if (_candidatosPoolCache.has(cacheKey)) {
    return _candidatosPoolCache.get(cacheKey);
  }
  const promise = _computeCandidatosPool(scoreIndicatorFilter);
  _candidatosPoolCache.set(cacheKey, promise);
  return promise;
}

async function _computeCandidatosPool(scoreIndicatorFilter) {
  const query = `
    WITH pop_municipio AS (
      SELECT DISTINCT ON (municipio_cod_ibge)
        municipio_cod_ibge,
        variavel_valor::numeric AS pop_tot
      FROM bd.municipio_apresenta_variavel
      WHERE variavel_sigla = 'POP_TOT'
      ORDER BY municipio_cod_ibge, ano DESC NULLS LAST
    ),
    indicadores_valor_latest AS (
      SELECT DISTINCT ON (municipio_cod_ibge, indicador_referencia)
        municipio_cod_ibge,
        indicador_referencia,
        indicador_valor::numeric AS indicador_valor
      FROM bd.municipio_apresenta_indicador
      WHERE indicador_referencia IN (3087, 4001, 3025)
      ORDER BY municipio_cod_ibge, indicador_referencia, ano DESC NULLS LAST
    ),
    variaveis_pivot AS (
      SELECT
        municipio_cod_ibge,
        MAX(CASE WHEN indicador_referencia = 3087 THEN indicador_valor END) AS pib_pc,
        MAX(CASE WHEN indicador_referencia = 4001 THEN indicador_valor END) AS idhm,
        MAX(CASE WHEN indicador_referencia = 3025 THEN indicador_valor END) AS gini
      FROM indicadores_valor_latest
      GROUP BY municipio_cod_ibge
    ),
    indicadores_nivel_latest AS (
      SELECT
        municipio_cod_ibge,
        indicador_referencia,
        indicador_nivel,
        ROW_NUMBER() OVER (
          PARTITION BY municipio_cod_ibge, indicador_referencia
          ORDER BY ano DESC NULLS LAST
        ) AS rn
      FROM bd.municipio_apresenta_indicador
      WHERE (
        cardinality($1::int[]) = 0
        OR indicador_referencia = ANY($1::int[])
      )
    ),
    score_municipio AS (
      SELECT
        municipio_cod_ibge,
        AVG(indicador_nivel)::numeric AS nivel_medio
      FROM indicadores_nivel_latest
      WHERE rn = 1
      GROUP BY municipio_cod_ibge
    )
    SELECT
      m.municipio_cod_ibge,
      m.municipio_nome,
      m.estado_sigla,
      m.municipio_regiao,
      COALESCE(
        NULLIF(to_jsonb(m) ->> 'municipio_rede_influencia', ''),
        NULLIF(to_jsonb(m) ->> 'rede_influencia', ''),
        NULLIF(to_jsonb(m) ->> 'rede_de_influencia', ''),
        NULLIF(to_jsonb(m) ->> 'hierarquia_urbana', ''),
        NULLIF(to_jsonb(m) ->> 'municipio_hierarquia_urbana', '')
      ) AS rede_influencia,
      pm.pop_tot,
      vp.pib_pc,
      vp.idhm,
      vp.gini,
      sm.nivel_medio
    FROM bd.municipio m
    LEFT JOIN pop_municipio pm
      ON pm.municipio_cod_ibge = m.municipio_cod_ibge
    LEFT JOIN variaveis_pivot vp
      ON vp.municipio_cod_ibge = m.municipio_cod_ibge
    LEFT JOIN score_municipio sm
      ON sm.municipio_cod_ibge = m.municipio_cod_ibge
  `;
  const result = await pool.query(query, [scoreIndicatorFilter]);
  return result.rows;
}

async function listarMunicipiosSemelhantes(municipioCodIbge, limit = 6, indicadorReferencias = []) {
  const scoreIndicatorFilter = Array.isArray(indicadorReferencias)
    ? indicadorReferencias.filter((value) => Number.isInteger(Number(value))).map(Number)
    : [];

  const pool_rows = await _getCandidatosPool(scoreIndicatorFilter);
  const targetBase = pool_rows.find(
    (r) => String(r.municipio_cod_ibge) === String(municipioCodIbge)
  );
  const targetPopTot = targetBase?.pop_tot ?? null;
  const targetPibPc = targetBase?.pib_pc ?? null;
  const targetIdhm = targetBase?.idhm ?? null;
  const targetGini = targetBase?.gini ?? null;
  const targetRedeInfluencia = targetBase?.rede_influencia ?? null;

  const distRow = (c) => {
    const isCurrent = String(c.municipio_cod_ibge) === String(municipioCodIbge);
    const numOrNull = (v) => (v === null || v === undefined ? null : Number(v));
    const popTot = numOrNull(c.pop_tot);
    const pibPc = numOrNull(c.pib_pc);
    const idhm = numOrNull(c.idhm);
    const gini = numOrNull(c.gini);
    const tPop = numOrNull(targetPopTot);
    const tPib = numOrNull(targetPibPc);
    const tIdhm = numOrNull(targetIdhm);
    const tGini = numOrNull(targetGini);

    const dist_pop =
      popTot !== null && tPop !== null ? Math.abs(Math.log((popTot + 1) / (tPop + 1))) : null;
    const dist_pib_pc =
      pibPc !== null && tPib !== null ? Math.abs(Math.log((pibPc + 1) / (tPib + 1))) : null;
    const dist_idhm = idhm !== null && tIdhm !== null ? Math.abs(idhm - tIdhm) / 0.2 : null;
    const dist_gini = gini !== null && tGini !== null ? Math.abs(gini - tGini) / 0.2 : null;

    const weightSum =
      (dist_pop !== null ? 0.5 : 0) +
      (dist_pib_pc !== null ? 0.25 : 0) +
      (dist_idhm !== null ? 0.15 : 0) +
      (dist_gini !== null ? 0.1 : 0);
    const weightedDist =
      (dist_pop !== null ? dist_pop * 0.5 : 0) +
      (dist_pib_pc !== null ? dist_pib_pc * 0.25 : 0) +
      (dist_idhm !== null ? dist_idhm * 0.15 : 0) +
      (dist_gini !== null ? dist_gini * 0.1 : 0);
    const ratio = weightSum > 0 ? weightedDist / weightSum : null;
    const similaridade_score =
      ratio === null
        ? null
        : Math.round(
            Math.max(0, Math.min(100, 100 * (1 - Math.min(1, ratio)))) * 100
          ) / 100;

    const nivelMedio = c.nivel_medio === null || c.nivel_medio === undefined ? null : Number(c.nivel_medio);
    const score = Math.round(((nivelMedio || 0) / 7.0) * 100) || 0;

    return {
      municipio_cod_ibge: c.municipio_cod_ibge,
      municipio_nome: c.municipio_nome,
      estado_sigla: c.estado_sigla,
      municipio_regiao: c.municipio_regiao,
      rede_influencia: c.rede_influencia,
      pop_tot: c.pop_tot,
      target_pop_tot: targetPopTot,
      pib_pc: c.pib_pc,
      target_pib_pc: targetPibPc,
      idhm: c.idhm,
      target_idhm: targetIdhm,
      gini: c.gini,
      target_gini: targetGini,
      score,
      is_current: isCurrent,
      rede_influencia_referencia: targetRedeInfluencia,
      criterio_aplicado:
        targetRedeInfluencia !== null ? "somente_rede_influencia" : "rede_influencia_indisponivel",
      nivel_medio: nivelMedio,
      similaridade_score,
    };
  };

  const rows = pool_rows
    .map(distRow)
    .sort((a, b) => {
      const aCur = a.is_current ? 0 : 1;
      const bCur = b.is_current ? 0 : 1;
      if (aCur !== bCur) return aCur - bCur;
      const aSim = a.similaridade_score;
      const bSim = b.similaridade_score;
      if (aSim !== bSim) {
        if (aSim === null) return 1;
        if (bSim === null) return -1;
        return bSim - aSim;
      }
      const aNiv = a.nivel_medio;
      const bNiv = b.nivel_medio;
      if (aNiv !== bNiv) {
        if (aNiv === null) return 1;
        if (bNiv === null) return -1;
        return bNiv - aNiv;
      }
      return String(a.municipio_nome).localeCompare(String(b.municipio_nome));
    });

  const targetHierarchy = getHierarchyByMunicipioCod(municipioCodIbge);
  const targetHierarchy3 = (targetHierarchy?.hierarquia3 || "").trim().toUpperCase();

  if (!targetHierarchy3) {
    return rows.slice(0, limit).map((row) => ({
      ...row,
      criterio_aplicado: "hierarquia_regic_indisponivel",
      recorte_geografico: null,
      hierarquia_3_referencia: null,
      hierarquia_2: null,
      hierarquia_3: null,
    }));
  }

  const filteredRows = rows.filter((row) => {
    if (row.is_current) return true;

    const rowHierarchy = getHierarchyByMunicipioCod(row.municipio_cod_ibge);
    const rowHierarchy3 = (rowHierarchy?.hierarquia3 || "").trim().toUpperCase();
    return rowHierarchy3 && rowHierarchy3 === targetHierarchy3;
  });

  const targetRow = filteredRows.find((row) => row.is_current) || null;
  const targetState = targetRow?.estado_sigla || null;
  const targetRegion = targetRow?.municipio_regiao || null;

  const nonCurrentRows = filteredRows.filter((row) => !row.is_current);
  const targetCoords = getCoordinatesByMunicipioCod(municipioCodIbge);
  const maxPopLogDistance = Math.log(3);
  const maxPibLogDistance = Math.log(3);
  const maxIdhmDistance = 0.2;
  const maxGiniDistance = 0.2;
  const nonCurrentRowsWithDistance = nonCurrentRows.map((row) => {
    const candidateCoords = getCoordinatesByMunicipioCod(row.municipio_cod_ibge);
    const distanceKm = getDistanceKm(targetCoords, candidateCoords);
    const candidatePop = Number(row.pop_tot);
    const targetPop = Number(row.target_pop_tot);
    const candidatePibPc = Number(row.pib_pc);
    const targetPibPc = Number(row.target_pib_pc);
    const candidateIdhm = Number(row.idhm);
    const targetIdhm = Number(row.target_idhm);
    const candidateGini = Number(row.gini);
    const targetGini = Number(row.target_gini);
    const populationDistanceLog =
      Number.isFinite(candidatePop) && Number.isFinite(targetPop)
        ? Math.abs(Math.log((candidatePop + 1) / (targetPop + 1)))
        : null;
    const pibPcDistanceLog =
      Number.isFinite(candidatePibPc) && Number.isFinite(targetPibPc)
        ? Math.abs(Math.log((candidatePibPc + 1) / (targetPibPc + 1)))
        : null;
    const idhmDistance =
      Number.isFinite(candidateIdhm) && Number.isFinite(targetIdhm)
        ? Math.abs(candidateIdhm - targetIdhm)
        : null;
    const giniDistance =
      Number.isFinite(candidateGini) && Number.isFinite(targetGini)
        ? Math.abs(candidateGini - targetGini)
        : null;

    return {
      ...row,
      distancia_km: distanceKm == null ? null : Number(distanceKm.toFixed(2)),
      distancia_pop_log: populationDistanceLog == null ? null : Number(populationDistanceLog.toFixed(6)),
      distancia_pib_pc_log: pibPcDistanceLog == null ? null : Number(pibPcDistanceLog.toFixed(6)),
      distancia_idhm: idhmDistance == null ? null : Number(idhmDistance.toFixed(6)),
      distancia_gini: giniDistance == null ? null : Number(giniDistance.toFixed(6)),
    };
  });

  const sortByCompositeProximity = (rows) => {
    if (!rows.length) return [];

    const maxGeoDistance = rows.reduce((max, row) => {
      if (row.distancia_km == null) return max;
      return row.distancia_km > max ? row.distancia_km : max;
    }, 0);

    const geoScale = maxGeoDistance > 0 ? maxGeoDistance : 1;

    return [...rows].sort((a, b) => {
      const aGeoNorm = a.distancia_km == null ? null : Math.min(1, a.distancia_km / geoScale);
      const bGeoNorm = b.distancia_km == null ? null : Math.min(1, b.distancia_km / geoScale);
      const aPopNorm =
        a.distancia_pop_log == null ? null : Math.min(1, a.distancia_pop_log / maxPopLogDistance);
      const bPopNorm =
        b.distancia_pop_log == null ? null : Math.min(1, b.distancia_pop_log / maxPopLogDistance);

      const aPibNorm =
        a.distancia_pib_pc_log == null ? null : Math.min(1, a.distancia_pib_pc_log / maxPibLogDistance);
      const bPibNorm =
        b.distancia_pib_pc_log == null ? null : Math.min(1, b.distancia_pib_pc_log / maxPibLogDistance);
      const aIdhmNorm =
        a.distancia_idhm == null ? null : Math.min(1, a.distancia_idhm / maxIdhmDistance);
      const bIdhmNorm =
        b.distancia_idhm == null ? null : Math.min(1, b.distancia_idhm / maxIdhmDistance);
      const aGiniNorm =
        a.distancia_gini == null ? null : Math.min(1, a.distancia_gini / maxGiniDistance);
      const bGiniNorm =
        b.distancia_gini == null ? null : Math.min(1, b.distancia_gini / maxGiniDistance);

      const computeComposite = (components) => {
        let weightedSum = 0;
        let usedWeights = 0;

        Object.entries(components).forEach(([key, value]) => {
          if (value == null) return;
          const weight = COMPARISON_COMPONENT_WEIGHTS[key];
          weightedSum += value * weight;
          usedWeights += weight;
        });

        if (usedWeights <= 0) return null;
        return weightedSum / usedWeights;
      };

      const aComposite = computeComposite({
        geo: aGeoNorm,
        pop: aPopNorm,
        pibPc: aPibNorm,
        idhm: aIdhmNorm,
        gini: aGiniNorm,
      });
      const bComposite = computeComposite({
        geo: bGeoNorm,
        pop: bPopNorm,
        pibPc: bPibNorm,
        idhm: bIdhmNorm,
        gini: bGiniNorm,
      });

      if (aComposite == null && bComposite != null) return 1;
      if (aComposite != null && bComposite == null) return -1;
      if (aComposite != null && bComposite != null && aComposite !== bComposite) {
        return aComposite - bComposite;
      }

      const aSimilarity = Number(a.similaridade_score);
      const bSimilarity = Number(b.similaridade_score);

      if (Number.isFinite(aSimilarity) && Number.isFinite(bSimilarity) && aSimilarity !== bSimilarity) {
        return bSimilarity - aSimilarity;
      }

      return String(a.municipio_nome || "").localeCompare(String(b.municipio_nome || ""), "pt-BR");
    });
  };

  const sameStateRows = targetState
    ? nonCurrentRowsWithDistance.filter((row) => row.estado_sigla === targetState)
    : [];
  const sameRegionRows = targetRegion
    ? nonCurrentRowsWithDistance.filter(
      (row) => row.estado_sigla !== targetState && row.municipio_regiao === targetRegion
    )
    : [];
  const otherBrazilRows = nonCurrentRowsWithDistance.filter(
    (row) => row.estado_sigla !== targetState && row.municipio_regiao !== targetRegion
  );

  const sortedSameStateRows = sortByCompositeProximity(sameStateRows);
  const sortedSameRegionRows = sortByCompositeProximity(sameRegionRows);
  const sortedOtherBrazilRows = sortByCompositeProximity(otherBrazilRows);

  const desiredCandidatesCount = Math.max(0, limit - (targetRow ? 1 : 0));
  let scopedRows = [];

  if (desiredCandidatesCount > 0) {
    scopedRows = [
      ...sortedSameStateRows,
      ...sortedSameRegionRows,
      ...sortedOtherBrazilRows,
    ].slice(0, desiredCandidatesCount);
  }

  let criterioAplicado = "hierarquia_3_regic";
  let recorteGeografico = "brasil";

  if (sortedSameStateRows.length >= desiredCandidatesCount && desiredCandidatesCount > 0) {
    criterioAplicado = "hierarquia_3_regic_mesmo_estado";
    recorteGeografico = "mesmo_estado";
  } else if (sortedSameStateRows.length > 0 && desiredCandidatesCount > 0) {
    criterioAplicado = "hierarquia_3_regic_mesmo_estado_complementado";
    recorteGeografico = "mesmo_estado_complementado";
  } else if (sortedSameRegionRows.length >= desiredCandidatesCount && desiredCandidatesCount > 0) {
    criterioAplicado = "hierarquia_3_regic_mesma_regiao";
    recorteGeografico = "mesma_regiao";
  } else if (sortedSameRegionRows.length > 0 && desiredCandidatesCount > 0) {
    criterioAplicado = "hierarquia_3_regic_mesma_regiao_complementada_brasil";
    recorteGeografico = "mesma_regiao_complementada_brasil";
  } else {
    criterioAplicado = "hierarquia_3_regic_brasil";
    recorteGeografico = "brasil";
  }

  const hasAnyGeographicDistance = scopedRows.some((row) => row.distancia_km != null);
  const hasAnyPopulationDistance = scopedRows.some((row) => row.distancia_pop_log != null);
  const hasAnySocioeconomicDistance = scopedRows.some(
    (row) => row.distancia_pib_pc_log != null || row.distancia_idhm != null || row.distancia_gini != null
  );

  const enrichedTargetRow = targetRow
    ? {
        ...targetRow,
        distancia_km: 0,
      }
    : null;

  const finalRows = enrichedTargetRow
    ? [enrichedTargetRow, ...scopedRows]
    : scopedRows;

  return finalRows.slice(0, limit).map((row) => {
    const hierarchy = getHierarchyByMunicipioCod(row.municipio_cod_ibge);

    return {
      ...row,
      criterio_aplicado: criterioAplicado,
      recorte_geografico: recorteGeografico,
      usa_distancia_geografica: hasAnyGeographicDistance,
      usa_proximidade_populacional: hasAnyPopulationDistance,
      usa_variaveis_socioeconomicas: hasAnySocioeconomicDistance,
      hierarquia_3_referencia: targetHierarchy?.hierarquia3 || null,
      hierarquia_2: hierarchy?.hierarquia2 || null,
      hierarquia_3: hierarchy?.hierarquia3 || null,
    };
  });
}

module.exports = {
  listarMunicipios,
  buscarMunicipiosPorNome,
  buscarMunicipioPorCodigo,
  buscarMunicipioPorSlug,
  buscarVariaveisMunicipio,
  listarIndicadoresMunicipio,
  listarNiveisIndicadoresMunicipios,
  obterResumoPontuacaoDimensao,
  obterResumoPopulacao,
  obterResumoMunicipios,
  listarSerieVariavelMunicipio,
  listarMunicipiosSemelhantes,
};

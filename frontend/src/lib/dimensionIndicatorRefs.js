// Shared with src/lib/staticApi.js: the fixed sets of indicator references
// used to query the four maturity dimensions plus the composite "d1"
// dimension, so the static-mode fetch shim can map query strings back to
// the right pre-generated bundle key.
export const ECONOMIC_TOPIC_GROUPS = [
  { topic: "Agua e Esgoto", ids: [3117, 3127, 3141, 3148] },
  { topic: "Infraestrutura de conectividade", ids: [3021, 3022, 3040, 3041, 3134, 4035, 4036, 4065] },
  { topic: "Habitacao", ids: [3020, 4041, 4045] },
  { topic: "Transporte", ids: [3049, 3076, 3124, 4011, 4012, 4031, 4046] },
  { topic: "Inovacao", ids: [4024, 4025, 4032, 4033] },
  { topic: "Servicos On-line da Prefeitura", ids: [3004, 4066] },
  { topic: "Sistemas e Tecnologia para Gestao Urbana", ids: [3016, 4010] },
  { topic: "Resíduos Sólidos", ids: [3122] },
  { topic: "Urbanização das Vias Públicas", ids: [3139, 3145, 4005] },
  { topic: "Dados Abertos", ids: [3033] },
];

export const SOCIOCULTURAL_TOPIC_GROUPS = [
  { topic: "Educação", ids: [3003, 3011, 3085, 3086, 3115, 4006, 4020, 4034, 4037, 4048] },
  { topic: "Cultura", ids: [3077, 3107, 3123, 4040] },
  { topic: "Saúde", ids: [3006, 3095, 3096, 3125, 4004, 4021, 4049, 4067] },
  { topic: "Segurança Pública", ids: [3048, 4016, 4017] },
  { topic: "Gestão de Desastres", ids: [3007, 4042, 4068, 4069] },
  { topic: "Inclusão Digital", ids: [3037, 3039] },
  { topic: "Inclusão Social", ids: [4039, 4043, 4044] },
  { topic: "Participação Pública", ids: [3103, 3147] },
];

export const ENVIRONMENT_TOPIC_GROUPS = [
  { topic: "Água e Esgoto", ids: [3024, 3028, 3042, 3110, 3128, 4047, 4071] },
  { topic: "Resíduos Sólidos", ids: [4007, 4014] },
  { topic: "Áreas Verdes", ids: [3057, 4030] },
  { topic: "Qualidade do Ar", ids: [3056, 3113] },
  { topic: "Energia", ids: [3043, 3069] },
  { topic: "Gestão de Desastres", ids: [4070] },
];

export const INSTITUTIONAL_TOPIC_GROUPS = [
  { topic: "Estratégia", ids: [6003, 6005, 6006] },
  { topic: "Infraestrutura de Hw e Sw", ids: [6021, 6024] },
  { topic: "Serviços e Aplicações", ids: [6044, 6048, 6056] },
  { topic: "Monitoramento", ids: [6009, 6054, 6055] },
  { topic: "Dados Abertos", ids: [6035, 6037, 6038] },
];

export const DIMENSION_TOPIC_GROUPS = {
  economica: ECONOMIC_TOPIC_GROUPS,
  meio_ambiente: ENVIRONMENT_TOPIC_GROUPS,
  sociocultural: SOCIOCULTURAL_TOPIC_GROUPS,
  capacidades_institucionais: INSTITUTIONAL_TOPIC_GROUPS,
};

export const buildDimensionIndicatorRefs = (topicGroups) =>
  Array.from(new Set(topicGroups.flatMap(({ ids }) => ids)));

export const DIMENSION_INDICATOR_REFS = {
  d1: [3025, 4056, 4057, 4058, 4059],
  economica: buildDimensionIndicatorRefs(ECONOMIC_TOPIC_GROUPS),
  meio_ambiente: buildDimensionIndicatorRefs(ENVIRONMENT_TOPIC_GROUPS),
  sociocultural: buildDimensionIndicatorRefs(SOCIOCULTURAL_TOPIC_GROUPS),
  capacidades_institucionais: buildDimensionIndicatorRefs(INSTITUTIONAL_TOPIC_GROUPS),
};

import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import MunicipalityName from "@/components/common/MunicipalityName";
import { MOCK_CITY } from "@/data/mockData";
import IndicatorsTable from "@/components/city/IndicatorsTable";
import MunicipalityMap from "@/components/city/MunicipalityMap";
import MunicipalAssistant from "@/components/city/MunicipalAssistant";
import { AI_ASSISTANT_ENABLED } from "@/config/featureFlags";
import { useI18n } from "@/lib/i18n";

const toDisplayName = (name) =>
  (name || "")
    .toLocaleLowerCase("pt-BR")
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, separator, letter) => `${separator}${letter.toLocaleUpperCase("pt-BR")}`
    );

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "N/D";

  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "N/D";

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const parseNullableNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const formatMobileBroadbandCoverage = (value) => {
  const parsedValue = Number(value);

  if (parsedValue === 1) return "3G";
  if (parsedValue === 2) return "4G";
  if (parsedValue === 3) return "3G e 4G";

  return formatNumber(parsedValue);
};

const getIndicatorName = (indicator, fallback) => indicator?.indicador_nome || fallback;

const getIndicatorSources = (indicator) =>
  Array.isArray(indicator?.variavel_fontes) ? indicator.variavel_fontes : [];

const getUniqueSources = (sources) =>
  Array.from(new Set((Array.isArray(sources) ? sources : []).filter(Boolean)));

const CHARACTERIZATION_TITLE_FALLBACKS = {
  4051: "Número de empresas em parques tecnológicos",
  4052: "Número de Incubadoras credenciadas - Lei de TIC",
  4053: "Número de Instituições de Ensino e Pesquisa em PD&I - Lei de TIC",
  4054: "Número de Centros e/ou Institutos de PD&I - Lei de TIC",
  4055: "Número de Empresas habilitadas - Lei de TIC",
  6002: "Incorporação de TICs - Áreas Prioritárias",
  6011: "Governança Tecnológica - Responsáveis",
  6017: "Governança de TI - Responsável",
  6019: "Equipe de TI - Tamanho",
  4061: "Número de Unidade de Conservação",
  4063: "Energia Eólica",
  4064: "Número de Mineradoras",
  4060: "Número de empresas - Lei do Bem PD&I",
  4161: "Numero de data centers",
  6058: "Plano Municipal de Gestão Integrada de Resíduos Sólidos",
  6059: "Plano municipal de saneamento básico",
};

const enrichIndicatorItem = (item, indicator) => ({
  ...item,
  label: getIndicatorName(indicator, item.label || `Indicador ${item.id || ""}`.trim()),
  description: indicator?.indicador_descricao || null,
  variableSources: getIndicatorSources(indicator),
  topicLevel: indicator?.nivel_topico ?? null,
});

const parseApiLevel = (value) => {
  const level = Number(value);
  if (!Number.isFinite(level)) return undefined;
  if (level < 1 || level > 7) return undefined;
  return level;
};

const INDICADOR_TEXTO_IDS = new Set([
  "3134",
  "4041",
  "3124",
  "4011",
  "4031",
  "4046",
  "4024",
  "4025",
  "4032",
  "4033",
  "3004",
  "4066",
  "3016",
  "4010",
  "3033",
  "4020",
  "3107",
  "4017",
  "3007",
  "3039",
  "4039",
  "4044",
  "3103",
  "3147",
  "3057",
  "4030",
  "6020",
  "6044",
  "6056",
  "6037",
  "6038",
]);

const INDICADOR_VALOR_TEXTUAL_IDS = new Set([
  "3049",
  "3076",
  "4012",
  "4006",
  "3123",
  "4040",
  "3006",
  "3125",
  "4004",
  "3048",
  "3042",
  "4014",
  "3056",
  "3113",
  "3043",
  "3069",
  "6003",
  "6005",
  "6006",
  "6021",
  "6024",
  "6048",
  "6009",
  "6054",
  "6035",
  "6002",
  "6011",
  "6017",
  "6019",
]);

const isTextValueIndicator = (id) => {
  const indicatorId = String(id);
  return INDICADOR_TEXTO_IDS.has(indicatorId) || INDICADOR_VALOR_TEXTUAL_IDS.has(indicatorId);
};

const getIndicatorTextValue = (indicator) => {
  const indicatorId = String(indicator?.indicador_id || "");
  const fieldName = INDICADOR_VALOR_TEXTUAL_IDS.has(indicatorId)
    ? "indicador_valor_textual"
    : INDICADOR_TEXTO_IDS.has(indicatorId)
      ? "indicador_texto"
      : null;

  if (!fieldName) return null;

  const textValue = String(indicator?.[fieldName] || "").trim();
  return textValue || null;
};

const isUnansweredFormValue = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") === "sem resposta do formulario";

export const hasUnansweredFormIndicators = (indicatorsById) =>
  Array.from(INDICADOR_VALOR_TEXTUAL_IDS).every((indicatorId) =>
    isUnansweredFormValue(
      indicatorsById?.[indicatorId]?.indicador_valor_textual
    )
  );

const formatNumericIndicatorFallback = (indicator, formatter = formatNumber) => {
  const value = indicator?.indicador;

  if (value == null || String(value).trim() === "") return "N/D";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "N/D";

  return formatter(numericValue);
};

const formatTextualIndicatorValue = (indicator, fallbackFormatter = formatNumber) =>
  getIndicatorTextValue(indicator) || formatNumericIndicatorFallback(indicator, fallbackFormatter);

const formatBinaryPossessionValue = (value) => {
  const numericValue = Number(value);

  if (numericValue === 1) return "Possui";
  if (numericValue === 0) return "Não Possui";

  return formatNumber(numericValue);
};

const format5gPossessionValue = (value) => {
  const numericValue = Number(value);

  if (numericValue === 3) return "Possui";
  if (numericValue === 0) return "Não Possui";

  return formatNumber(numericValue);
};

const TABLE_INDICATOR_FORMAT_BY_ID = {
  3011: "percent",
  3020: "percent",
  3021: "percent",
  3022: "percent",
  3024: "percent",
  3028: "percent",
  3037: "binary",
  3040: "mobileBroadbandCoverage",
  3041: "binary",
  3086: "percent",
  3110: "percent",
  3117: "percent",
  3122: "percent",
  3127: "percent",
  3139: "percent",
  3141: "percent",
  3145: "percent",
  4005: "percent",
  4007: "percent",
  4016: "percent",
  4021: "percent",
  4034: "percent",
  4035: "percent",
  4037: "percent",
  4047: "percent",
  4065: "5gPossession",
  4070: "percent",
};

const formatConfiguredIndicatorValue = (indicator, format = "number", indicatorId = null) => {
  if (isTextValueIndicator(indicatorId ?? indicator?.indicador_id)) {
    return formatTextualIndicatorValue(indicator);
  }

  if (format === "percent") return formatPercent(Number(indicator?.indicador));
  if (format === "binary") return formatBinaryPossessionValue(indicator?.indicador);
  if (format === "mobileBroadbandCoverage") {
    return formatMobileBroadbandCoverage(indicator?.indicador);
  }
  if (format === "5gPossession") return format5gPossessionValue(indicator?.indicador);

  return formatNumber(Number(indicator?.indicador));
};

const buildConfiguredDimensionIndicators = (topicGroups, indicatorsById, defaultFormat = "number") =>
  topicGroups.flatMap(({ topic, ids, format = defaultFormat }) =>
    ids.flatMap((id) => {
      const indicator = indicatorsById[String(id)];

      if (!indicator) return [];

      return [
        {
          id: String(id),
          topic,
          label: getIndicatorName(indicator, `Indicador ${id}`),
          indicator: `Indicador ${id}`,
          value: formatConfiguredIndicatorValue(
            indicator,
            TABLE_INDICATOR_FORMAT_BY_ID[String(id)] || format,
            id
          ),
          valueIsText:
            isTextValueIndicator(id) && Boolean(getIndicatorTextValue(indicator)),
          level: parseApiLevel(indicator.nivel_maturidade),
          source: "PostgreSQL",
        },
      ];
    })
  );

const getDashboardCardFromIndicator = (item) =>
  item
    ? {
        id: item.id,
        topic: item.topic || "",
        title: item.label || item.indicator || `Indicador ${item.id || ""}`.trim(),
        value: item.value ?? "N/D",
        level: item.level ?? null,
      }
    : null;

export const getDashboardHighlights = (items, limit = 3) => {
  const rankedIndicators = (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      item,
      index,
      level: Number(item?.level),
    }))
    .filter(({ level }) => Number.isFinite(level) && level >= 1 && level <= 7);

  const bestEntries = [...rankedIndicators]
    .sort((left, right) => right.level - left.level || left.index - right.index)
    .slice(0, limit);
  const bestIds = new Set(bestEntries.map(({ item }) => String(item.id)));
  const worstEntries = [...rankedIndicators]
    .sort((left, right) => left.level - right.level || left.index - right.index)
    .filter(
      ({ item }) =>
        !isUnansweredFormValue(item.value) &&
        !bestIds.has(String(item.id))
    )
    .slice(0, limit);

  return {
    best: bestEntries.map(({ item }) => getDashboardCardFromIndicator(item)).filter(Boolean),
    worst: worstEntries.map(({ item }) => getDashboardCardFromIndicator(item)).filter(Boolean),
  };
};

const LEVEL_COLORS = {
  1: "#A00000",
  2: "#E23A23",
  3: "#E27400",
  4: "#3E8ED0",
  5: "#1C4F9C",
  6: "#3F9D00",
  7: "#375623",
};

const getLevelColor = (level) => {
  const safeLevel = Math.max(1, Math.min(7, Math.round(Number(level) || 1)));
  return LEVEL_COLORS[safeLevel];
};

const getMaturityTierLabel = (level) => {
  const parsedLevel = Number(level);

  if (!Number.isFinite(parsedLevel) || parsedLevel < 1 || parsedLevel > 7) {
    return "Tier não disponível";
  }

  return parsedLevel <= 2 ? "Preparação" : "Gestão e Governança";
};

const MaturityTierBadge = ({ level }) => {
  const parsedLevel = Number(level);
  const hasLevel = Number.isFinite(parsedLevel) && parsedLevel >= 1 && parsedLevel <= 7;
  const tierClassName = !hasLevel
    ? "border-[#d7dfe8] bg-[#f6f8fa] text-[#6b7c93]"
    : parsedLevel <= 2
      ? "border-[#efc7c3] bg-[#fff4f2] text-[#b42318]"
      : "border-[#c9dfbd] bg-[#f4faef] text-[#2f7d14]";

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${tierClassName}`}
    >
      {getMaturityTierLabel(level)}
    </span>
  );
};

const MaturityTierBar = ({ level, compact = false, showLabels = true }) => {
  const parsedLevel = Number(level);
  const hasLevel = Number.isFinite(parsedLevel) && parsedLevel >= 1 && parsedLevel <= 7;
  const activeLevel = hasLevel ? Math.round(parsedLevel) : 0;
  const activeColor = hasLevel ? getLevelColor(activeLevel) : "#D8DDE3";

  const renderSegments = (levels) =>
    levels.map((segmentLevel) => (
      <span
        key={segmentLevel}
        aria-hidden="true"
        className={`${compact ? "h-2" : "h-2.5"} flex-1 rounded-sm`}
        style={{
          backgroundColor: segmentLevel <= activeLevel ? activeColor : "#D8DDE3",
        }}
      />
    ));

  return (
    <div className={compact ? "mt-1.5" : "mt-3"}>
      <div
        role="img"
        aria-label={
          hasLevel
            ? `Nível de maturidade ${activeLevel} de 7. Preparação: níveis 1 e 2. Gestão e Governança: níveis 3 a 7.`
            : "Nível de maturidade não disponível. Preparação: níveis 1 e 2. Gestão e Governança: níveis 3 a 7."
        }
        className="flex gap-3"
      >
        <div className="flex flex-[2] gap-1.5">
          {renderSegments([1, 2])}
        </div>
        <div className={`relative flex flex-[5] gap-1.5 before:absolute before:-left-[7px] before:top-1/2 before:w-px before:-translate-y-1/2 before:bg-[#aeb9c7] ${compact ? "before:h-4" : "before:h-5"}`}>
          {renderSegments([3, 4, 5, 6, 7])}
        </div>
      </div>

      {showLabels && (
        <div aria-hidden="true" className="mt-1.5 flex gap-3 text-[12px] leading-tight">
          <span className="flex-[2] text-center font-semibold text-[#5b6f8a]">
            Preparação
          </span>
          <span className="flex-[5] text-center font-semibold text-[#5b6f8a]">
            Gestão e Governança
          </span>
        </div>
      )}
    </div>
  );
};

const getMaturityLevelTextColor = (level) => {
  const parsedLevel = Number(level);

  if (!Number.isFinite(parsedLevel) || parsedLevel < 1 || parsedLevel > 7) {
    return "#1b2940";
  }

  if (parsedLevel <= 2) return "#c2410c";
  if (parsedLevel <= 4) return "#b45309";
  if (parsedLevel <= 5) return "#2563eb";

  return "#15803d";
};

const PIB_SHARE_OPTIONS = [
  { key: "pibAg", label: "Agropecuária", color: "#2AA876" },
  { key: "pibAp", label: "Administração Pública", color: "#4C6EF5" },
  { key: "pibInd", label: "Indústria", color: "#F08C00" },
  { key: "pibSr", label: "Serviços", color: "#D6336C" },
];

const BIOME_LABELS = {
  0: "Desconhecido",
  1: "Amazônia",
  2: "Caatinga",
  3: "Cerrado",
  4: "Mata Atlântica",
  5: "Pampa",
  6: "Pantanal",
  7: "Área Marinha",
};

const INFLUENCE_NETWORK_LABELS = {
  1: "Grande Metrópole Nacional",
  2: "Metrópole Nacional",
  3: "Metrópole",
  4: "Capital Regional A",
  5: "Capital Regional B",
  6: "Capital Regional C",
  7: "Centro Sub-Regional A",
  8: "Centro Sub-Regional B",
  9: "Centro de Zona A",
  10: "Centro de Zona B",
  11: "Centro Local",
};

const ECONOMIC_TOPIC_GROUPS = [
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

const SOCIOCULTURAL_TOPIC_GROUPS = [
  { topic: "Educa\u00e7\u00e3o", ids: [3003, 3011, 3085, 3086, 3115, 4006, 4020, 4034, 4037, 4048] },
  { topic: "Cultura", ids: [3077, 3107, 3123, 4040] },
  { topic: "Sa\u00fade", ids: [3006, 3095, 3096, 3125, 4004, 4021, 4049, 4067] },
  { topic: "Seguran\u00e7a P\u00fablica", ids: [3048, 4016, 4017] },
  { topic: "Gest\u00e3o de Desastres", ids: [3007, 4042, 4068, 4069] },
  { topic: "Inclus\u00e3o Digital", ids: [3037, 3039] },
  { topic: "Inclus\u00e3o Social", ids: [4039, 4043, 4044] },
  { topic: "Participa\u00e7\u00e3o P\u00fablica", ids: [3103, 3147] },
];

const ENVIRONMENT_TOPIC_GROUPS = [
  { topic: "\u00c1gua e Esgoto", ids: [3024, 3028, 3042, 3110, 3128, 4047, 4071] },
  { topic: "Res\u00edduos S\u00f3lidos", ids: [4007, 4014] },
  { topic: "\u00c1reas Verdes", ids: [3057, 4030] },
  { topic: "Qualidade do Ar", ids: [3056, 3113] },
  { topic: "Energia", ids: [3043, 3069] },
  { topic: "Gest\u00e3o de Desastres", ids: [4070] },
];

const INSTITUTIONAL_TOPIC_GROUPS = [
  { topic: "Estrat\u00e9gia", ids: [6003, 6005, 6006] },
  { topic: "Infraestrutura de Hw e Sw", ids: [6021, 6024] },
  { topic: "Servi\u00e7os e Aplica\u00e7\u00f5es", ids: [6044, 6048, 6056] },
  { topic: "Monitoramento", ids: [6009, 6054, 6055] },
  { topic: "Dados Abertos", ids: [6035, 6037, 6038] },
];

const DIMENSION_TOPIC_GROUPS = {
  economica: ECONOMIC_TOPIC_GROUPS,
  meio_ambiente: ENVIRONMENT_TOPIC_GROUPS,
  sociocultural: SOCIOCULTURAL_TOPIC_GROUPS,
  capacidades_institucionais: INSTITUTIONAL_TOPIC_GROUPS,
};

const buildDimensionIndicatorRefs = (topicGroups) =>
  Array.from(new Set(topicGroups.flatMap(({ ids }) => ids)));

const DIMENSION_INDICATOR_REFS = {
  d1: [3025, 4056, 4057, 4058, 4059],
  economica: buildDimensionIndicatorRefs(ECONOMIC_TOPIC_GROUPS),
  meio_ambiente: buildDimensionIndicatorRefs(ENVIRONMENT_TOPIC_GROUPS),
  sociocultural: buildDimensionIndicatorRefs(SOCIOCULTURAL_TOPIC_GROUPS),
  capacidades_institucionais: buildDimensionIndicatorRefs(INSTITUTIONAL_TOPIC_GROUPS),
};

const MAIN_DIMENSION_CODES = [
  "economica",
  "meio_ambiente",
  "sociocultural",
  "capacidades_institucionais",
];

const DIMENSION_TOPIC_INDICATOR_WEIGHTS = {
  economica: {
    3117: 3,
    3127: 3,
    3141: 3,
    3148: 2,
    3033: 1,
    3020: 3,
    4041: 3,
    4045: 3,
    3021: 3,
    3022: 3,
    3040: 2,
    3041: 2,
    3134: 2,
    4035: 2,
    4036: 1,
    4065: 2,
    4024: 3,
    4025: 3,
    4032: 3,
    4033: 3,
    3122: 1,
    3004: 2,
    4066: 2,
    3016: 1,
    4010: 2,
    3049: 1,
    3076: 1,
    3124: 2,
    4011: 1,
    4012: 1,
    4031: 3,
    4046: 2,
    3139: 3,
    3145: 3,
    4005: 3,
  },
  meio_ambiente: {
    3024: 3,
    3028: 2,
    3042: 1,
    3110: 3,
    3128: 3,
    4047: 3,
    4071: 3,
    3057: 2,
    4030: 3,
    3043: 1,
    3069: 1,
    4070: 3,
    3056: 1,
    3113: 1,
    4007: 3,
    4014: 1,
  },
  sociocultural: {
    3003: 2,
    3011: 3,
    3085: 3,
    3086: 3,
    3115: 3,
    4006: 2,
    4020: 3,
    4034: 3,
    4037: 3,
    4048: 3,
    3077: 3,
    3107: 2,
    3123: 1,
    4040: 1,
    3006: 1,
    3095: 3,
    3096: 3,
    3125: 1,
    4004: 1,
    4021: 3,
    4049: 3,
    4067: 3,
    3048: 1,
    4016: 3,
    4017: 3,
    3007: 2,
    4042: 1,
    4068: 3,
    4069: 3,
    3037: 3,
    3039: 3,
    4039: 2,
    4043: 2,
    4044: 2,
    3103: 2,
    3147: 1,
  },
  capacidades_institucionais: {
    6035: 3,
    6037: 2,
    6038: 2,
    6003: 3,
    6005: 3,
    6006: 3,
    6021: 2,
    6024: 2,
    6009: 2,
    6054: 2,
    6055: 2,
    6056: 3,
    6044: 3,
    6048: 2,
  },
};

const calculateWeightedTopicLevel = (indicatorIds, indicatorsById, indicatorWeights = {}) => {
  const weightedLevels = indicatorIds
    .map((indicatorId) => {
      const level = parseApiLevel(indicatorsById[String(indicatorId)]?.nivel_maturidade);
      const weight = Number(indicatorWeights[String(indicatorId)] ?? 1);

      if (!Number.isFinite(level) || !Number.isFinite(weight) || weight <= 0) return null;

      return { level, weight };
    })
    .filter(Boolean);

  if (weightedLevels.length === 0) return null;

  const totalWeight = weightedLevels.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = weightedLevels.reduce((sum, item) => sum + item.level * item.weight, 0);

  return Math.round(weightedSum / totalWeight);
};

const calculateDimensionLevelFromTopicLevels = (dimensionCode, indicatorsById) => {
  const topicGroups = DIMENSION_TOPIC_GROUPS[dimensionCode] || [];
  const indicatorWeights = DIMENSION_TOPIC_INDICATOR_WEIGHTS[dimensionCode] || {};
  const topicLevels = topicGroups
    .map((topicGroup) =>
      calculateWeightedTopicLevel(topicGroup.ids, indicatorsById, indicatorWeights)
    )
    .filter((level) => Number.isFinite(level));

  if (topicLevels.length === 0) return null;

  const averageTopicLevel =
    topicLevels.reduce((sum, level) => sum + level, 0) / topicLevels.length;

  return Math.min(7, Math.max(0, Math.round(averageTopicLevel)));
};

const calculateDimensionScoreFromIndicators = (items) => {
  const levels = items
    .map((item) => Number(item.level))
    .filter((level) => Number.isFinite(level) && level >= 1 && level <= 7);

  if (levels.length === 0) return null;

  const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
  return (averageLevel / 7) * 100;
};

const CitySearchDetails = () => {
  const { cityFriendlyName } = useParams();
  const location = useLocation();
  const { language, t } = useI18n();

  const [cityData, setCityData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState("");
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [detailsView, setDetailsView] = useState("indices");
  const [selectedCharacterization, setSelectedCharacterization] = useState("sociodemografica");
  const [indicatorsById, setIndicatorsById] = useState({});
  const [indicadorDesigualdadeRendaGini, setIndicadorDesigualdadeRendaGini] = useState(null);
  const [indicadorPibAg, setIndicadorPibAg] = useState(null);
  const [indicadorPibInd, setIndicadorPibInd] = useState(null);
  const [indicadorPibSrv, setIndicadorPibSrv] = useState(null);
  const [indicadorPibAp, setIndicadorPibAp] = useState(null);
  const [giniSeries, setGiniSeries] = useState([]);
  const [giniLoading, setGiniLoading] = useState(false);
  const [pibSeries, setPibSeries] = useState([]);
  const [pibLoading, setPibLoading] = useState(false);
  const [selectedPibShareKey, setSelectedPibShareKey] = useState("pibAg");
  const [dimensionScoreSummary, setDimensionScoreSummary] = useState(null);
  const [dimensionComparisonsByKey, setDimensionComparisonsByKey] = useState({});
  const [dimensionComparisonsLoadingByKey, setDimensionComparisonsLoadingByKey] = useState({});

  const clearIndicatorState = () => {
    setIndicatorsById({});
    setIndicadorDesigualdadeRendaGini(null);
    setIndicadorPibAg(null);
    setIndicadorPibInd(null);
    setIndicadorPibSrv(null);
    setIndicadorPibAp(null);
  };

  useEffect(() => {
    if (location.state) return;

    setLoading(true);
    setError("");

    fetch(`/api/municipios/slug/${cityFriendlyName}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Não foi possível carregar os dados do município.");
        }
        return res.json();
      })
      .then((data) => {
        setCityData(data);
      })
      .catch((err) => {
        console.error("Erro ao buscar município:", err);
        setError("Erro ao carregar município.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cityFriendlyName, location.state]);

  useEffect(() => {
    const municipioCodIbge = cityData?.municipio_cod_ibge;

    if (!municipioCodIbge) {
      clearIndicatorState();
      return;
    }

    let cancelled = false;

    fetch(`/api/municipios/${municipioCodIbge}/indicadores`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nao foi possivel carregar os indicadores do municipio.");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const indicadores = Array.isArray(data?.indicadores) ? data.indicadores : [];
        const byId = new Map(indicadores.map((item) => [String(item.indicador_id), item]));
        setIndicatorsById(Object.fromEntries(byId));

        setIndicadorDesigualdadeRendaGini(byId.get("3025") || null);
        setIndicadorPibAg(byId.get("4056") || null);
        setIndicadorPibInd(byId.get("4057") || null);
        setIndicadorPibSrv(byId.get("4058") || null);
        setIndicadorPibAp(byId.get("4059") || null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erro ao buscar indicadores do municipio:", err);
        clearIndicatorState();
      });

    return () => {
      cancelled = true;
    };
  }, [cityData?.municipio_cod_ibge]);

  useEffect(() => {
    const municipioCodIbge = cityData?.municipio_cod_ibge;
    const dimensionEntries = Object.entries(DIMENSION_INDICATOR_REFS).filter(
      ([, indicatorRefs]) => indicatorRefs.length > 0
    );

    if (!municipioCodIbge || dimensionEntries.length === 0) {
      setDimensionComparisonsByKey({});
      setDimensionComparisonsLoadingByKey({});
      return;
    }

    let cancelled = false;

    setDimensionComparisonsByKey({});
    setDimensionComparisonsLoadingByKey(
      Object.fromEntries(dimensionEntries.map(([dimensionKey]) => [dimensionKey, true]))
    );

    dimensionEntries.forEach(([dimensionKey, indicatorRefs]) => {
      const query = indicatorRefs.join(",");

      fetch(`/api/municipios/${municipioCodIbge}/comparativo-semelhantes?limit=6&indicadores=${query}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Nao foi possivel carregar o comparativo regional.");
          }
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;

          const list = Array.isArray(data?.comparativo) ? data.comparativo : [];
          const normalized = list.map((item) => ({
            city: toDisplayName(item.municipio_nome),
            score: Number(item.score) || 0,
            isCurrent: Boolean(item.is_current),
            distanceKm: item.distancia_km == null ? null : Number(item.distancia_km),
            similarityScore:
              item.similaridade_score == null ? null : Number(item.similaridade_score),
          }));

          setDimensionComparisonsByKey((current) => ({
            ...current,
            [dimensionKey]: normalized,
          }));
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("Erro ao buscar comparativo regional:", err);
          setDimensionComparisonsByKey((current) => ({
            ...current,
            [dimensionKey]: [],
          }));
        })
        .finally(() => {
          if (cancelled) return;
          setDimensionComparisonsLoadingByKey((current) => ({
            ...current,
            [dimensionKey]: false,
          }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [cityData?.municipio_cod_ibge]);

  useEffect(() => {
    const municipioCodIbge = cityData?.municipio_cod_ibge;
    const indicatorRefs = selectedDimension
      ? DIMENSION_INDICATOR_REFS[selectedDimension] || []
      : [];

    if (!municipioCodIbge || indicatorRefs.length === 0) {
      setDimensionScoreSummary(null);
      return;
    }

    let cancelled = false;
    const query = indicatorRefs.join(",");

    fetch(`/api/municipios/${municipioCodIbge}/dimensao/resumo-pontuacao?indicadores=${query}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nao foi possivel carregar as medias da dimensao.");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        setDimensionScoreSummary({
          regional: data?.media_regional == null ? null : Number(data.media_regional),
          national: data?.media_nacional == null ? null : Number(data.media_nacional),
          regionalCount: data?.municipios_regiao == null ? 0 : Number(data.municipios_regiao),
          nationalCount: data?.municipios_nacional == null ? 0 : Number(data.municipios_nacional),
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erro ao buscar medias da dimensao:", err);
        setDimensionScoreSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [cityData?.municipio_cod_ibge, selectedDimension]);

  useEffect(() => {
    const municipioCodIbge = cityData?.municipio_cod_ibge;

    if (!municipioCodIbge) {
      setPibSeries([]);
      setPibLoading(false);
      return;
    }

    let cancelled = false;
    setPibLoading(true);

    const fetchSerie = async (sigla) => {
      const response = await fetch(`/api/municipios/${municipioCodIbge}/variaveis/${sigla}/serie`);
      if (!response.ok) {
        throw new Error(`Nao foi possivel carregar a serie ${sigla}.`);
      }
      const data = await response.json();
      return Array.isArray(data?.serie) ? data.serie : [];
    };

    const normalizeSerie = (serie) =>
      serie
        .map((item) => ({
          ano: Number(item.ano),
          valor: parseNullableNumber(item.valor),
          mediaRegional: parseNullableNumber(item.media_regional),
          mediaNacional: parseNullableNumber(item.media_nacional),
        }))
        .filter(
          (item) =>
            Number.isFinite(item.ano) &&
            (Number.isFinite(item.valor) ||
              Number.isFinite(item.mediaRegional) ||
              Number.isFinite(item.mediaNacional))
        );

    Promise.allSettled([
      fetchSerie("PIB_AG"),
      fetchSerie("PIB_AP"),
      fetchSerie("PIB_IND"),
      fetchSerie("PIB_SR"),
    ])
      .then(async ([ag, ap, ind, sr]) => {
        if (cancelled) return;

        // Alguns bancos usam PIB_SRV em vez de PIB_SR.
        let servicosResult = sr;
        if (
          servicosResult.status !== "fulfilled" ||
          !Array.isArray(servicosResult.value) ||
          servicosResult.value.length === 0
        ) {
          try {
            const fallbackSrv = await fetchSerie("PIB_SRV");
            servicosResult = { status: "fulfilled", value: fallbackSrv };
          } catch {
            servicosResult = { status: "rejected", reason: new Error("Serie PIB de servicos indisponivel") };
          }
        }

        const seriesByKey = {
          pibAg: ag.status === "fulfilled" ? normalizeSerie(ag.value) : [],
          pibAp: ap.status === "fulfilled" ? normalizeSerie(ap.value) : [],
          pibInd: ind.status === "fulfilled" ? normalizeSerie(ind.value) : [],
          pibSr: servicosResult.status === "fulfilled" ? normalizeSerie(servicosResult.value) : [],
        };

        const years = new Set();
        Object.values(seriesByKey).forEach((serie) => {
          serie.forEach((item) => years.add(item.ano));
        });

        if (years.size === 0) {
          setPibSeries([]);
          return;
        }

        const mapByYear = new Map();
        [...years]
          .sort((a, b) => a - b)
          .forEach((year) => {
            mapByYear.set(year, {
              ano: String(year),
              pibAg: null,
              pibAgRegional: null,
              pibAgNacional: null,
              pibAp: null,
              pibApRegional: null,
              pibApNacional: null,
              pibInd: null,
              pibIndRegional: null,
              pibIndNacional: null,
              pibSr: null,
              pibSrRegional: null,
              pibSrNacional: null,
            });
          });

        seriesByKey.pibAg.forEach((item) => {
          mapByYear.get(item.ano).pibAg = item.valor;
          mapByYear.get(item.ano).pibAgRegional = item.mediaRegional;
          mapByYear.get(item.ano).pibAgNacional = item.mediaNacional;
        });
        seriesByKey.pibAp.forEach((item) => {
          mapByYear.get(item.ano).pibAp = item.valor;
          mapByYear.get(item.ano).pibApRegional = item.mediaRegional;
          mapByYear.get(item.ano).pibApNacional = item.mediaNacional;
        });
        seriesByKey.pibInd.forEach((item) => {
          mapByYear.get(item.ano).pibInd = item.valor;
          mapByYear.get(item.ano).pibIndRegional = item.mediaRegional;
          mapByYear.get(item.ano).pibIndNacional = item.mediaNacional;
        });
        seriesByKey.pibSr.forEach((item) => {
          mapByYear.get(item.ano).pibSr = item.valor;
          mapByYear.get(item.ano).pibSrRegional = item.mediaRegional;
          mapByYear.get(item.ano).pibSrNacional = item.mediaNacional;
        });

        setPibSeries(Array.from(mapByYear.values()));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erro ao buscar series PIB:", err);
        setPibSeries([]);
      })
      .finally(() => {
        if (cancelled) return;
        setPibLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cityData?.municipio_cod_ibge]);

  const giniDomain = (() => {
    if (!giniSeries.length) return [0, 1];

    const values = giniSeries
      .flatMap((item) => [item.valor, item.mediaRegional, item.mediaNacional])
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) return [0, 1];

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const minSpan = 0.08;
    const padding = 0.02;
    const span = Math.max(maxValue - minValue, minSpan);
    const center = (minValue + maxValue) / 2;

    const lower = Math.max(0, center - span / 2 - padding);
    const upper = Math.min(1, center + span / 2 + padding);

    return [Number(lower.toFixed(3)), Number(upper.toFixed(3))];
  })();

  const selectedPibShareOption =
    PIB_SHARE_OPTIONS.find((option) => option.key === selectedPibShareKey) || PIB_SHARE_OPTIONS[0];
  const selectedPibRegionalKey = `${selectedPibShareOption.key}Regional`;
  const selectedPibNacionalKey = `${selectedPibShareOption.key}Nacional`;

  useEffect(() => {
    const municipioCodIbge = cityData?.municipio_cod_ibge;

    if (!municipioCodIbge) {
      setGiniSeries([]);
      setGiniLoading(false);
      return;
    }

    let cancelled = false;
    setGiniLoading(true);

    fetch(`/api/municipios/${municipioCodIbge}/variaveis/GINI/serie`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nao foi possivel carregar a serie do GINI.");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const serie = Array.isArray(data?.serie) ? data.serie : [];
        const normalized = serie
          .map((item) => ({
            ano: Number(item.ano),
            valor: parseNullableNumber(item.valor),
            mediaRegional: parseNullableNumber(item.media_regional),
            mediaNacional: parseNullableNumber(item.media_nacional),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.ano) &&
              (Number.isFinite(item.valor) ||
                Number.isFinite(item.mediaRegional) ||
                Number.isFinite(item.mediaNacional))
          )
          .sort((a, b) => a.ano - b.ano);

        if (normalized.length <= 1) {
          setGiniSeries(
            normalized.map((item) => ({
              ano: String(item.ano),
              valor: item.valor,
              mediaRegional: item.mediaRegional,
              mediaNacional: item.mediaNacional,
              estimado: false,
            }))
          );
          return;
        }

        const expandedSeries = [];

        for (let i = 0; i < normalized.length - 1; i += 1) {
          const current = normalized[i];
          const next = normalized[i + 1];
          const gap = next.ano - current.ano;

          expandedSeries.push({
            ano: String(current.ano),
            valor: current.valor,
            mediaRegional: current.mediaRegional,
            mediaNacional: current.mediaNacional,
            estimado: false,
          });

          if (gap > 1 && Number.isFinite(current.valor) && Number.isFinite(next.valor)) {
            for (let step = 1; step < gap; step += 1) {
              const ratio = step / gap;
              const interpolatedValue =
                current.valor + (next.valor - current.valor) * ratio;

              expandedSeries.push({
                ano: String(current.ano + step),
                valor: Number(interpolatedValue.toFixed(4)),
                mediaRegional: null,
                mediaNacional: null,
                estimado: true,
              });
            }
          }
        }

        const last = normalized[normalized.length - 1];
        expandedSeries.push({
          ano: String(last.ano),
          valor: last.valor,
          mediaRegional: last.mediaRegional,
          mediaNacional: last.mediaNacional,
          estimado: false,
        });

        setGiniSeries(expandedSeries);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erro ao buscar serie GINI:", err);
        setGiniSeries([]);
      })
      .finally(() => {
        if (cancelled) return;
        setGiniLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cityData?.municipio_cod_ibge]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando município...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!cityData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-red-600">
        Município não encontrado.
      </div>
    );
  }

  const city = {
    ...MOCK_CITY,
    name: cityData.municipio_nome || MOCK_CITY.name,
    stateName: cityData.estado_nome || MOCK_CITY.stateName,
    stateSigla: cityData.estado_sigla || "",
    codIbge: cityData.municipio_cod_ibge || null,
    region: cityData.municipio_regiao || "",
  };

  const indicatorsByDimension = {
    d1: [
      ...(indicadorDesigualdadeRendaGini
        ? [
            {
              id: "3025",
              topic: "Desigualdade de renda",
              label: getIndicatorName(indicadorDesigualdadeRendaGini, "Indicador 3025"),
              indicator: "Indicador = GINI",
              value: formatNumber(Number(indicadorDesigualdadeRendaGini.indicador)),
              level: parseApiLevel(indicadorDesigualdadeRendaGini.nivel_maturidade),
              source: "IBGE · PostgreSQL",
            },
          ]
        : []),
      ...(indicadorPibAg
        ? [
            {
              id: "4056",
              topic: "PIB",
              label: getIndicatorName(indicadorPibAg, "Indicador 4056"),
              indicator: "Indicador = PIB_AG",
              value: formatNumber(Number(indicadorPibAg.indicador)),
              level: parseApiLevel(indicadorPibAg.nivel_maturidade),
              source: "IBGE · PostgreSQL",
            },
          ]
        : []),
      ...(indicadorPibInd
        ? [
            {
              id: "4057",
              topic: "PIB",
              label: getIndicatorName(indicadorPibInd, "Indicador 4057"),
              indicator: "Indicador = PIB_IND",
              value: formatNumber(Number(indicadorPibInd.indicador)),
              level: parseApiLevel(indicadorPibInd.nivel_maturidade),
              source: "IBGE · PostgreSQL",
            },
          ]
        : []),
      ...(indicadorPibSrv
        ? [
            {
              id: "4058",
              topic: "PIB",
              label: getIndicatorName(indicadorPibSrv, "Indicador 4058"),
              indicator: "Indicador = PIB_SRV",
              value: formatNumber(Number(indicadorPibSrv.indicador)),
              level: parseApiLevel(indicadorPibSrv.nivel_maturidade),
              source: "IBGE · PostgreSQL",
            },
          ]
        : []),
      ...(indicadorPibAp
        ? [
            {
              id: "4059",
              topic: "PIB",
              label: getIndicatorName(indicadorPibAp, "Indicador 4059"),
              indicator: "Indicador = PIB_AP",
              value: formatNumber(Number(indicadorPibAp.indicador)),
              level: parseApiLevel(indicadorPibAp.nivel_maturidade),
              source: "IBGE · PostgreSQL",
            },
          ]
        : []),
    ],
    economica: buildConfiguredDimensionIndicators(ECONOMIC_TOPIC_GROUPS, indicatorsById),
    meio_ambiente: buildConfiguredDimensionIndicators(ENVIRONMENT_TOPIC_GROUPS, indicatorsById),
    sociocultural: buildConfiguredDimensionIndicators(SOCIOCULTURAL_TOPIC_GROUPS, indicatorsById),
    capacidades_institucionais: buildConfiguredDimensionIndicators(INSTITUTIONAL_TOPIC_GROUPS, indicatorsById),
  };

  const rawIndicators = selectedDimension
    ? indicatorsByDimension[selectedDimension] || []
    : [];
  const indicators = rawIndicators.map((item) =>
    enrichIndicatorItem(item, indicatorsById[String(item.id)])
  );
  const selectedDimensionScore = calculateDimensionScoreFromIndicators(indicators);
  const pdfIndicators = selectedDimension
    ? indicators
    : [];
  const dashboardHighlights = getDashboardHighlights(indicators);
  const characterizationSections = [
    {
      id: "sociodemografica",
      title: "Caracterização Sociodemográfica",
      rows: [],
    },
    {
      id: "territorio-ambiente",
      title: "Caracterização Território e Ambiente",
      rows: [],
    },
    {
      id: "transformacao-digital",
      title: "Caracterização Transformação Digital",
      rows: [],
    },
    {
      id: "institucional",
      title: "Caracterização Institucional",
      rows: [],
    },
  ];
  const activeCharacterization =
    characterizationSections.find((section) => section.id === selectedCharacterization) ||
    characterizationSections[0];
  const legacyTerritoryEnvironmentCards = [
    { title: "Empregos em turismo", value: "N/D" },
    { title: "Unidades de Conservação", value: "N/D" },
    { title: "Bioma", value: "N/D" },
    { title: "Energia Eólica", value: "N/D" },
    { title: "Número de Mineradoras", value: "N/D" },
  ];
  const legacyDigitalTransformationCards = [
    {
      title: "Número de campus de Institutos e Universidades Federais",
      value: "N/D",
    },
    {
      title: "Número de empresas em parques tecnológicos",
      value: "N/D",
    },
    {
      title: "Número de Incubadoras credenciadas - Lei de TIC",
      value: "N/D",
    },
    {
      title: "Número de Instituições de Ensino e Pesquisa em PD&I - Lei de TIC",
      value: "N/D",
    },
    {
      title: "Número de Centros e/ou Institutos de PD&I - Lei de TIC",
      value: "N/D",
    },
    {
      title: "Número de Empresas habilitadas - Lei de TIC",
      value: "N/D",
    },
    {
      title: "Número de empresas - Lei do Bem PD&I",
      value: "N/D",
    },
    {
      title: "Numero de data centers",
      value: "N/D",
    },
    {
      title: "Empregos em TIC",
      value: "N/D",
    },
    {
      title: "Empresas de TICs no municipio",
      value: "N/D",
    },
  ];
  const legacyInstitutionalCards = [
    { title: "Incorporação de TICs - Áreas Prioritárias", value: "N/D" },
    { title: "Governança Tecnológica - Responsáveis", value: "N/D" },
    { title: "Governança de TI - Responsável", value: "N/D" },
    { title: "Equipe de TI - Tamanho", value: "N/D" },
    { title: "Estrutura Organizacional de TIC", value: "N/D" },
    { title: "Atualização do Plano Diretor", value: "N/D" },
    {
      title: "Plano Municipal de Gestão Integrada de Resíduos Sólidos",
      value: "N/D",
    },
    { title: "Plano municipal de saneamento básico", value: "N/D" },
  ];
  void legacyTerritoryEnvironmentCards;
  void legacyDigitalTransformationCards;
  void legacyInstitutionalCards;

  const getCharacterizationCardById = (id, options = {}) => {
    const indicator = indicatorsById[String(id)];
    const textValue = getIndicatorTextValue(indicator);
    const rawValue = Number(indicator?.indicador);
    const hasIndicatorValue =
      indicator &&
      (indicator.indicador != null || Boolean(textValue));
    const value = options.valueFormatter
      ? options.valueFormatter(rawValue, indicator)
      : hasIndicatorValue
        ? textValue || formatNumber(rawValue)
        : "Dados faltantes";
    const level = parseApiLevel(indicator?.nivel_maturidade);

    return {
      id: String(id),
      title:
        options.title ||
        getIndicatorName(indicator, CHARACTERIZATION_TITLE_FALLBACKS[String(id)] || `Indicador ${id}`),
      value,
      level,
      valueIsText: Boolean(textValue),
      description: indicator?.indicador_descricao || null,
      variableSources: getIndicatorSources(indicator),
    };
  };
  const renderCharacterizationTitle = (item, className = "text-base leading-snug text-[#111827]") => {
    const sources = getUniqueSources(item.variableSources);
    const hasTooltipContent = Boolean(item.description) || sources.length > 0;

    return (
      <div className="flex min-w-0 items-start gap-2">
        <p className={className} title={item.title}>
          {item.title}
        </p>

        {hasTooltipContent && (
          <span className="group relative mt-0.5 inline-flex shrink-0">
            <button
              type="button"
              aria-label={`Informações sobre ${item.title || "indicador"}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#19c2df] transition-colors hover:bg-[#e9f8fc] hover:text-[#0da8c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1"
            >
              <Info className="h-4 w-4" strokeWidth={2.3} />
            </button>
            <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-80 rounded-md border border-[#d7e4f5] bg-white px-3 py-2 text-xs leading-relaxed text-[#425a78] opacity-0 shadow-[0_8px_24px_rgba(23,52,95,0.16)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {item.description && <span className="block">{t(item.description)}</span>}
              {sources.length > 0 && (
                <span className={item.description ? "mt-2 block" : "block"}>
                  <span className="font-semibold text-[#1f2d3d]">{t("Fonte:")}</span>{" "}
                  {sources.join("; ")}
                </span>
              )}
            </span>
          </span>
        )}
      </div>
    );
  };
  const renderCharacterizationCards = (cards, gridClass = "md:grid-cols-2 lg:grid-cols-4") => (
    <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
      {cards.map((card, index) => (
        <article
          key={card.id}
          className="min-h-[148px] rounded-2xl border border-[#e3e9f2] bg-white p-5"
        >
          <div>
            {renderCharacterizationTitle(
              card,
              "line-clamp-2 text-sm font-medium leading-snug text-[#1f2d3d]"
            )}
            <div className="mt-3 h-px w-full bg-[#e1e7ef]" />
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span
              className={`block font-semibold ${
                card.id === "4038"
                  ? "w-full text-[20px] leading-none text-[#0f172a]"
                  : card.valueIsText
                    ? "text-base leading-relaxed text-[#53657d]"
                  : `leading-none ${index === 0 ? "text-4xl" : "text-3xl"}`
              }`}
              style={
                card.id === "4038"
                  ? { whiteSpace: "nowrap" }
                  : card.valueIsText
                    ? undefined
                    : { color: getMaturityLevelTextColor(card.level) }
              }
            >
              {t(card.value)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
  const renderCharacterizationTable = (items) => (
    <div className="divide-y divide-[#edf1f5]">
      {items.map((item) => (
        item.valueIsText ? (
          <div key={item.id} className="grid grid-cols-1 gap-3 px-6 py-4">
            {renderCharacterizationTitle(item)}
            <p className="max-w-full text-justify text-sm leading-relaxed text-[#53657d]">
              {t(item.value || "N/D")}
            </p>
          </div>
        ) : (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center lg:gap-5"
          >
            {renderCharacterizationTitle(item)}
            <p className="text-left text-xl font-semibold leading-none text-[#0f172a] lg:text-right">
              {t(item.value || "N/D")}
            </p>
          </div>
        )
      ))}
    </div>
  );
  const sociodemographicCards = [
    getCharacterizationCardById("3087", { title: "PIB per capita" }),
    getCharacterizationCardById("4001"),
    getCharacterizationCardById("4003", { title: "População total estimada" }),
    getCharacterizationCardById("4038", {
      title: "Rede de influência",
      valueFormatter: (value) =>
        INFLUENCE_NETWORK_LABELS[Math.round(value)] || "Desconhecido",
    }),
  ];
  const territoryEnvironmentCards = [
    getCharacterizationCardById("3058"),
    getCharacterizationCardById("4062", {
      valueFormatter: (value) => t(BIOME_LABELS[Math.round(value)] || "Desconhecido"),
    }),
    getCharacterizationCardById("4061"),
    getCharacterizationCardById("4063"),
    getCharacterizationCardById("4064"),
  ];
  const digitalTransformationCards = [
    getCharacterizationCardById("3060"),
    getCharacterizationCardById("3059"),
    getCharacterizationCardById("4050"),
    ...["4051", "4052", "4053", "4054", "4055", "4060", "4161"].map(
      getCharacterizationCardById
    ),
  ];
  const institutionalCards = [
    getCharacterizationCardById("6020"),
    getCharacterizationCardById("6057"),
    ...["6002", "6011", "6017", "6019", "6058", "6059"].map(
      getCharacterizationCardById
    ),
  ];
  const displayCityName = toDisplayName(city.name);
  const displayStateName = toDisplayName(city.stateName);
  const dimensionsWithComputedLevels = (city.dimensions || []).map((dimension) => ({
    ...dimension,
    computedLevel: calculateDimensionLevelFromTopicLevels(dimension.code, indicatorsById),
  }));
  const mainDimensionsWithComputedLevels = dimensionsWithComputedLevels.filter((dimension) =>
    MAIN_DIMENSION_CODES.includes(dimension.code)
  );
  const validMainDimensionLevels = mainDimensionsWithComputedLevels
    .map((dimension) => dimension.computedLevel)
    .filter((level) => Number.isFinite(level));
  const currentDim = selectedDimension
    ? dimensionsWithComputedLevels.find((dimension) => dimension.code === selectedDimension) || null
    : null;
  const currentDimLevel = Number.isFinite(currentDim?.computedLevel)
    ? Math.min(7, Math.max(0, currentDim.computedLevel))
    : null;
  const hasCurrentDimLevel = Number.isFinite(currentDimLevel);
  const currentDimLevelColor = hasCurrentDimLevel ? getLevelColor(currentDimLevel) : "#D8DDE3";
  const avgLevel = validMainDimensionLevels.length
    ? Math.round(
        validMainDimensionLevels.reduce((sum, level) => sum + level, 0) /
          validMainDimensionLevels.length
      )
    : null;
  const hasAvgLevel = Number.isFinite(avgLevel);
  const avgLevelColor = hasAvgLevel ? getLevelColor(avgLevel) : "#D8DDE3";
  const dimensionScores = MAIN_DIMENSION_CODES.map((dimensionCode) =>
    calculateDimensionScoreFromIndicators(
      (indicatorsByDimension[dimensionCode] || []).map((item) =>
        enrichIndicatorItem(item, indicatorsById[String(item.id)])
      )
    )
  ).filter((score) => Number.isFinite(score));
  const generalScore = dimensionScores.length
    ? dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length
    : null;
  const formattedGeneralScore = Number.isFinite(generalScore)
    ? generalScore.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : "N/D";
  const hasUnansweredForm = hasUnansweredFormIndicators(indicatorsById);

  return (
    <div>
      <section className="city-search-hero-gradient pb-32 pt-16">
        <div className="mx-auto max-w-[1300px] px-6">
          <MunicipalityName
            as="h1"
            className="text-6xl font-extrabold text-white"
          >
            {displayCityName}
          </MunicipalityName>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-3xl text-white">{displayStateName}</span>
            <div className="h-px flex-1 bg-white/50" />
          </div>
        </div>
      </section>

      <section className="-mt-20 pb-8">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            {city.dimensions && city.dimensions.length > 0 && (
              <div className="flex flex-col gap-6">
                {/* Card geral e card da dimensão com transição suave */}
                <div className="relative min-h-[142px]">
                  <div
                    className={`absolute inset-0 transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      selectedDimension
                        ? "pointer-events-none translate-y-[4px] opacity-0"
                        : "translate-y-0 opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-6 rounded-lg border border-[#e0e0e0] bg-white p-6">
                      {/* Número grande em círculo */}
                      <div className="relative h-[90px] w-[90px] flex-shrink-0">
                        <svg
                          viewBox="0 0 120 120"
                          className="h-full w-full"
                        >
                          <circle
                            cx="60"
                            cy="60"
                            r="55"
                            fill="none"
                            stroke="#D8DDE3"
                            strokeWidth="8"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="55"
                            fill="none"
                            stroke={avgLevelColor}
                            strokeWidth="8"
                            strokeDasharray={`${((hasAvgLevel ? avgLevel : 0) / 7) * 2 * Math.PI * 55} ${2 * Math.PI * 55}`}
                          />
                        </svg>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-bold text-[#1f2d3d]">
                            {hasAvgLevel ? avgLevel : "N/D"}
                          </span>
                        </div>
                      </div>

                        {/* Informações do meio */}
                        <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <MunicipalityName
                            as="h3"
                            className="text-2xl font-bold text-[#1f2d3d]"
                          >
                            {displayCityName} - {city.stateSigla}
                          </MunicipalityName>
                          {hasUnansweredForm && (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-[#efc7c3] bg-[#fff4f2] px-2.5 py-1 text-xs font-semibold leading-none text-[#b42318]">
                              Formulário não respondido
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[#4f5d73]">
                          {displayStateName} · {t(`Região ${city.region}`)}
                        </p>

                        <MaturityTierBar level={hasAvgLevel ? avgLevel : null} />
                      </div>

                      {/* Dados à direita */}
                      <div className="flex min-w-[124px] self-stretch items-center text-left">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6b7c93]">
                            Pontuação geral
                          </p>
                          <div
                            aria-label={
                              Number.isFinite(generalScore)
                                ? `Pontuação geral ${formattedGeneralScore} de 100`
                                : "Pontuação geral não disponível"
                            }
                            className="mt-1 inline-flex items-baseline whitespace-nowrap text-[#1f2d3d]"
                          >
                            <span aria-hidden="true" className="text-[27px] font-bold leading-none tracking-tight">
                              {formattedGeneralScore}
                            </span>
                            {Number.isFinite(generalScore) && (
                              <span aria-hidden="true" className="ml-1 text-xs font-semibold text-[#6b7c93]">
                                /100
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`absolute inset-0 transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      selectedDimension && currentDim
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-[4px] opacity-0"
                    }`}
                  >
                    {currentDim && (
                      <button
                        onClick={() => setSelectedDimension(null)}
                        className="flex w-full cursor-pointer items-start gap-6 rounded-lg border border-[#e0e0e0] bg-white p-6 text-left transition-all hover:border-[#29A9DF]"
                      >
                        {/* Círculo com nível */}
                        <div className="relative h-[90px] w-[90px] flex-shrink-0">
                          <svg
                            viewBox="0 0 120 120"
                            className="h-full w-full"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r="55"
                              fill="none"
                              stroke="#D8DDE3"
                              strokeWidth="8"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="55"
                              fill="none"
                              stroke={currentDimLevelColor}
                              strokeWidth="8"
                              strokeDasharray={`${((hasCurrentDimLevel ? currentDimLevel : 0) / 7) * 2 * Math.PI * 55} ${2 * Math.PI * 55}`}
                            />
                          </svg>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-bold text-[#1f2d3d]">
                              {hasCurrentDimLevel ? currentDimLevel : "N/D"}
                            </span>
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-2xl font-bold text-[#1f2d3d]">
                              {currentDim.title}
                            </h4>
                            <MaturityTierBadge level={currentDimLevel} />
                          </div>
                          <p className="mt-1 text-sm text-[#4f5d73]">
                            Nível de maturidade
                          </p>

                          <MaturityTierBar
                            level={hasCurrentDimLevel ? currentDimLevel : null}
                          />
                        </div>

                        {/* Coluna de métricas (igual ao card geral) */}
                        <div className="hidden">
                          <div>
                            <div className="text-2xl font-bold text-[#1f2d3d]">
                              {formattedGeneralScore}
                            </div>
                            <div className="text-xs text-[#4f5d73]">
                              Pontuação geral (0–100)
                            </div>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {AI_ASSISTANT_ENABLED && (
            <MunicipalAssistant
              municipioCodIbge={city.codIbge}
              cityName={displayCityName}
              dimensionCode={selectedDimension}
              dimensionTitle={currentDim?.title || null}
              language={language}
            />
          )}

          {selectedDimension && (
            <div className="mt-8 rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <IndicatorsTable
                indicators={indicators}
                pdfIndicators={pdfIndicators}
                bestIndicators={dashboardHighlights.best}
                worstIndicators={dashboardHighlights.worst}
                stateSigla={city.stateSigla}
                showPdfDownload={Boolean(selectedDimension)}
                cityName={displayCityName}
                dimensionTitle={currentDim?.title || ""}
                dimensionScoreSummary={dimensionScoreSummary}
                comparisonItems={dimensionComparisonsByKey[selectedDimension] || []}
                comparisonLoading={Boolean(dimensionComparisonsLoadingByKey[selectedDimension])}
                topicIndicatorWeights={DIMENSION_TOPIC_INDICATOR_WEIGHTS[selectedDimension] || {}}
                dimensionScore={selectedDimensionScore}
              />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1300px] px-6 pb-12">
        {!selectedDimension && (
          <>
            <div className="mb-3">
              <div className="relative inline-grid grid-cols-2 gap-1 rounded-xl border border-[#dce6f4] bg-[#f4f7fc] p-1">
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-1 top-1 z-0 w-[calc(50%-4px)] rounded-lg border border-[#d6e2f3] bg-white shadow-[0_1px_3px_rgba(23,52,95,0.12)] transition-transform duration-300 ease-out ${
                    detailsView === "indices" ? "translate-x-1" : "translate-x-[calc(100%+2px)]"
                  }`}
                />
                <button
                  type="button"
                  aria-pressed={detailsView === "indices"}
                  onClick={() => setDetailsView("indices")}
                  className={`relative z-10 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 ${
                    detailsView === "indices"
                      ? "text-[#1f2d3d]"
                      : "text-[#5a6f8f] hover:text-[#27466f]"
                  }`}
                >
                  Dimensões
                </button>
                <button
                  type="button"
                  aria-pressed={detailsView === "caracterizacoes"}
                  onClick={() => setDetailsView("caracterizacoes")}
                  className={`relative z-10 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 ${
                    detailsView === "caracterizacoes"
                      ? "text-[#1f2d3d]"
                      : "text-[#5a6f8f] hover:text-[#27466f]"
                  }`}
                >
                  Caracterizações
                </button>
              </div>
            </div>

            {detailsView === "caracterizacoes" && (
              <div className="mb-3 border-b border-[#dce6f4] pb-1">
                <div className="flex gap-1.5 overflow-x-auto">
                  {characterizationSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setSelectedCharacterization(section.id)}
                      aria-pressed={selectedCharacterization === section.id}
                      className={`relative whitespace-nowrap px-3 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 ${
                        selectedCharacterization === section.id
                          ? "text-[#1f2d3d]"
                          : "text-[#5a6f8f] hover:text-[#27466f]"
                      }`}
                    >
                      {section.title.replace("Caracterização ", "")}
                      <span
                        className={`pointer-events-none absolute bottom-0 left-0 h-[2px] w-full bg-[#2d7fd3] transition-transform duration-300 ease-out ${
                          selectedCharacterization === section.id
                            ? "scale-x-100"
                            : "scale-x-0"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {detailsView === "indices" ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="flex h-[520px] min-w-0 min-h-0 flex-col gap-2 overflow-hidden pr-1">
              {dimensionsWithComputedLevels.map((dim) => (
              <button
                key={dim.code}
                onClick={() =>
                  setSelectedDimension((prev) =>
                    prev === dim.code ? null : dim.code
                  )
                }
                className={`w-full min-h-0 flex-1 cursor-pointer rounded-lg border transition-all ${
                  selectedDimension === dim.code
                    ? "border-[#29A9DF] bg-[#f0f7ff] shadow-md"
                    : "border-[#e0e0e0] bg-white hover:bg-[#f9f9f9]"
                } p-4 text-left`}
              >
                <div className="flex h-full items-center gap-4">
                  {/* Círculo com nível */}
                  <div className="relative h-[62px] w-[62px] flex-shrink-0">
                    <svg
                      viewBox="0 0 120 120"
                      className="h-full w-full"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="55"
                        fill="none"
                        stroke="#D8DDE3"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                              r="55"
                              fill="none"
                              stroke={
                                Number.isFinite(dim.computedLevel)
                                  ? getLevelColor(dim.computedLevel)
                                  : "#D8DDE3"
                              }
                              strokeWidth="8"
                              strokeDasharray={`${((Number.isFinite(dim.computedLevel) ? dim.computedLevel : 0) / 7) * 2 * Math.PI * 55} ${2 * Math.PI * 55}`}
                            />
                          </svg>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold leading-none text-[#1f2d3d]">
                              {Number.isFinite(dim.computedLevel) ? dim.computedLevel : "N/D"}
                            </span>
                          </div>
                  </div>

                  {/* Informações */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="min-w-0 truncate text-xl font-bold leading-tight text-[#1f2d3d]">
                        {dim.title}
                      </h4>
                      <MaturityTierBadge level={dim.computedLevel} />
                    </div>
                    <p className="text-sm leading-tight text-[#4f5d73]">
                      Nível de maturidade
                    </p>

                    <MaturityTierBar
                      compact
                      level={dim.computedLevel}
                      showLabels={false}
                    />

                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="min-w-0">
            <div className="sticky top-4 h-[520px] overflow-hidden rounded-lg border border-border bg-muted">
              {city.codIbge && city.stateSigla ? (
                <MunicipalityMap
                  cityCode={city.codIbge}
                  stateSigla={city.stateSigla}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Mapa indisponível.
                </div>
              )}
            </div>
          </div>
        </div>
            ) : (
              <div>
                <article
                  key={activeCharacterization.id}
                  className="overflow-hidden rounded-lg border border-[#dce6f4] bg-white"
                >
                  <header className="border-b border-[#e7edf7] px-6 py-4">
                    <h3 className="text-2xl font-bold leading-tight text-[#1f2d3d] sm:text-xl">
                      {activeCharacterization.title}
                    </h3>
                  </header>

                  <div>
                    {activeCharacterization.id === "sociodemografica" ? (
                        <div className="px-6 py-5">
                          <div className="mb-6">
                            {renderCharacterizationCards(
                              sociodemographicCards,
                              "sm:grid-cols-2 xl:grid-cols-4"
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="h-full rounded-lg border border-[#dce6f4] bg-white p-4">
                              <div className="mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-semibold text-[#1f2d3d]">
                                    Evolução Histórica - Desigualdade de Renda
                                  </h4>
                                  <div className="group relative inline-flex">
                                    <button
                                      type="button"
                                      aria-label="O que é o Índice de GINI"
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#19c2df] transition-colors hover:bg-[#e9f8fc] hover:text-[#0da8c4]"
                                    >
                                      <Info className="h-4 w-4" strokeWidth={2.2} />
                                    </button>
                                    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-md border border-[#d7e4f5] bg-white px-3 py-2 text-xs leading-relaxed text-[#425a78] opacity-0 shadow-[0_6px_20px_rgba(23,52,95,0.14)] transition-opacity group-hover:opacity-100">
                                      O Índice de GINI mede a desigualdade de renda: quanto mais próximo de 0, mais igualitária é a distribuição; quanto mais próximo de 1, maior é a desigualdade.
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-1 h-[10px]" aria-hidden="true" />
                              </div>
                              {giniLoading ? (
                                <div className="flex h-[280px] items-center justify-center text-sm text-[#5b7596]">
                                  Carregando série do GINI...
                                </div>
                              ) : giniSeries.length === 0 ? (
                                <div className="flex h-[280px] items-center justify-center text-sm text-[#5b7596]">
                                  Sem dados históricos de GINI para o município.
                                </div>
                              ) : (
                                <div className="-ml-3 h-[280px] w-[calc(100%+12px)]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                      data={giniSeries}
                                      margin={{ top: 8, right: 28, left: 0, bottom: 4 }}
                                    >
                                      <XAxis
                                        dataKey="ano"
                                        tick={{ fill: "#5b7596", fontSize: 12 }}
                                        axisLine={{ stroke: "#d7e4f5" }}
                                        tickLine={{ stroke: "#d7e4f5" }}
                                        interval={0}
                                        tickFormatter={(value, index) =>
                                          giniSeries[index]?.estimado ? "" : value
                                        }
                                      />
                                      <YAxis
                                        domain={giniDomain}
                                        tick={{ fill: "#5b7596", fontSize: 12 }}
                                        axisLine={{ stroke: "#d7e4f5" }}
                                        tickLine={{ stroke: "#d7e4f5" }}
                                        tickFormatter={(value) =>
                                          Number(value).toLocaleString("pt-BR", {
                                            minimumFractionDigits: 1,
                                            maximumFractionDigits: 2,
                                          })
                                        }
                                      />
                                      <Tooltip
                                        formatter={(value, name) => [
                                          Number(value).toLocaleString("pt-BR", {
                                            minimumFractionDigits: 3,
                                            maximumFractionDigits: 3,
                                          }),
                                          name,
                                        ]}
                                        labelFormatter={(label) => `Ano ${label}`}
                                        contentStyle={{
                                          borderRadius: 8,
                                          border: "1px solid #d7e4f5",
                                          boxShadow: "0 4px 14px rgba(25, 55, 95, 0.12)",
                                        }}
                                      />
                                      <Line
                                        type="monotone"
                                        name="Média regional"
                                        dataKey="mediaRegional"
                                        stroke="#7db5e8"
                                        strokeWidth={2}
                                        strokeOpacity={0.55}
                                        dot={false}
                                        activeDot={false}
                                        connectNulls
                                      />
                                      <Line
                                        type="monotone"
                                        name="Média nacional"
                                        dataKey="mediaNacional"
                                        stroke="#9ca3af"
                                        strokeWidth={2}
                                        strokeOpacity={0.5}
                                        dot={false}
                                        activeDot={false}
                                        connectNulls
                                      />
                                      <Line
                                        type="monotone"
                                        name={displayCityName}
                                        dataKey="valor"
                                        stroke="#1f4e9b"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={false}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>

                            <div className="h-full rounded-lg border border-[#dce6f4] bg-white p-4">
                              <div className="mb-2">
                                <h4 className="text-lg font-semibold text-[#1f2d3d]">
                                  Evolução Histórica do PIB por Setor
                                </h4>
                                <div className="mt-1 h-[10px]" aria-hidden="true" />
                              </div>
                              {pibLoading ? (
                                <div className="flex h-[280px] items-center justify-center text-sm text-[#5b7596]">
                                  Carregando séries do PIB...
                                </div>
                              ) : pibSeries.length === 0 ? (
                                <div className="flex h-[280px] items-center justify-center text-sm text-[#5b7596]">
                                  Sem dados históricos de PIB para o município.
                                </div>
                              ) : (
                                <div className="-ml-3 h-[280px] w-[calc(100%+12px)]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                      data={pibSeries}
                                      margin={{ top: 8, right: 0, left: 0, bottom: 4 }}
                                    >
                                      <XAxis
                                        dataKey="ano"
                                        tick={{ fill: "#5b7596", fontSize: 12 }}
                                        axisLine={{ stroke: "#d7e4f5" }}
                                        tickLine={{ stroke: "#d7e4f5" }}
                                      />
                                      <YAxis
                                        tick={{ fill: "#5b7596", fontSize: 12 }}
                                        axisLine={{ stroke: "#d7e4f5" }}
                                        tickLine={{ stroke: "#d7e4f5" }}
                                        tickFormatter={(value) =>
                                          Number(value).toLocaleString("pt-BR", {
                                            notation: "compact",
                                            maximumFractionDigits: 1,
                                          })
                                        }
                                      />
                                      <Tooltip
                                        formatter={(value) =>
                                          Number(value).toLocaleString("pt-BR", {
                                            maximumFractionDigits: 2,
                                          })
                                        }
                                        labelFormatter={(label) => `Ano ${label}`}
                                        contentStyle={{
                                          borderRadius: 8,
                                          border: "1px solid #d7e4f5",
                                          boxShadow: "0 4px 14px rgba(25, 55, 95, 0.12)",
                                        }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey={selectedPibRegionalKey}
                                        name="Média regional"
                                        stroke="#86c6b0"
                                        strokeWidth={2}
                                        strokeOpacity={0.5}
                                        dot={false}
                                        activeDot={false}
                                        connectNulls
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey={selectedPibNacionalKey}
                                        name="Média nacional"
                                        stroke="#9ca3af"
                                        strokeWidth={2}
                                        strokeOpacity={0.45}
                                        dot={false}
                                        activeDot={false}
                                        connectNulls
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey={selectedPibShareOption.key}
                                        name={displayCityName}
                                        stroke={selectedPibShareOption.color}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={false}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                {PIB_SHARE_OPTIONS.map((option) => {
                                  const isSelected = selectedPibShareKey === option.key;

                                  return (
                                    <button
                                      key={option.key}
                                      type="button"
                                      onClick={() => setSelectedPibShareKey(option.key)}
                                      aria-pressed={isSelected}
                                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                        isSelected
                                          ? "border-transparent text-white"
                                          : "border-[#d7e4f5] bg-white text-[#5b7596] hover:border-[#b9cce6] hover:text-[#1f2d3d]"
                                      }`}
                                      style={isSelected ? { backgroundColor: option.color } : undefined}
                                    >
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                    ) : activeCharacterization.id === "territorio-ambiente" ? (
                      renderCharacterizationTable(territoryEnvironmentCards)
                    ) : activeCharacterization.id === "transformacao-digital" ? (
                      renderCharacterizationTable(digitalTransformationCards)
                    ) : activeCharacterization.id === "institucional" ? (
                      renderCharacterizationTable(institutionalCards)
                    ) : (
                      activeCharacterization.rows.map((row) => (
                          <div
                            key={row.indicator}
                            className="grid grid-cols-[1fr_140px_120px] items-center gap-x-4 border-b border-[#eef3fa] px-6 py-4 last:border-b-0"
                          >
                            <span className="text-sm font-semibold text-[#1f2d3d]">
                              {row.indicator}
                            </span>
                            <span className="text-right text-sm text-[#1f2d3d]">
                              {row.value}
                            </span>
                            <span className="text-right text-sm text-[#5b7596]">
                              {row.unit}
                            </span>
                          </div>
                      ))
                    )}
                  </div>
                </article>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CitySearchDetails;

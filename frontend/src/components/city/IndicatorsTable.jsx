import { FileDown } from "lucide-react";
import { ChevronRight, Info } from "lucide-react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MunicipalityName from "@/components/common/MunicipalityName";
import { exportSectionPdf } from "@/lib/pdf/exportSectionPdf";
import { useI18n } from "@/lib/i18n";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const isValidLevel = (value) => Number.isFinite(value) && value >= 1 && value <= 7;

export const calculateTopicScore = (items, topicIndicatorWeights = {}) => {
  const weightedLevels = items
    .map((item) => {
      const level = Number(item.level);
      const weight = Number(topicIndicatorWeights[String(item.id)] ?? 1);

      if (!isValidLevel(level) || !Number.isFinite(weight) || weight <= 0) return null;

      return { level, weight };
    })
    .filter(Boolean);

  if (weightedLevels.length === 0) return null;

  const totalWeight = weightedLevels.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = weightedLevels.reduce((sum, item) => sum + item.level * item.weight, 0);

  return weightedSum / totalWeight;
};

const calculateTopicLevel = (items, topicIndicatorWeights = {}) => {
  const topicScore = calculateTopicScore(items, topicIndicatorWeights);
  return Number.isFinite(topicScore) ? Math.round(topicScore) : null;
};

const getSubtopicLabel = (topic) => {
  const normalized = (topic || "").trim().toLocaleLowerCase("pt-BR");

  if (normalized === "agua e esgoto") {
    return "Água e Esgoto";
  }

  if (normalized === "infraestrutura de conectividade") {
    return "Infraestrutura de Conectividade";
  }

  if (normalized === "habitacao") {
    return "Habitação";
  }

  if (normalized === "transporte") {
    return "Transporte";
  }

  if (normalized === "inovacao") {
    return "Inovação";
  }

  if (normalized === "sistemas e tecnologia para gestao urbana") {
    return "Sistemas e Tecnologia para Gestão Urbana";
  }

  return topic || "Subtopico nao informado";
};

const getMaturityLevelTextColor = (level) => {
  const parsedLevel = Number(level);

  if (!isValidLevel(parsedLevel)) return "#1b2940";
  if (parsedLevel <= 2) return "#c2410c";
  if (parsedLevel <= 4) return "#b45309";
  if (parsedLevel <= 5) return "#2563eb";

  return "#15803d";
};

const INDICATOR_LEVEL_COLORS = {
  1: "#A00000",
  2: "#E23A23",
  3: "#E27400",
  4: "#3E8ED0",
  5: "#1C4F9C",
  6: "#3F9D00",
  7: "#375623",
};

const getUniqueSources = (sources) =>
  Array.from(
    new Set(
      (Array.isArray(sources) ? sources : [])
        .map((source) => String(source || "").trim())
        .filter(Boolean)
    )
  );

const normalizeText = (value) =>
  String(value || "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getCompactDashboardValue = (value) => {
  const normalizedValue = normalizeText(value);

  if (normalizedValue === "sem resposta do formulario") {
    return { label: "Sem resposta", unavailable: true };
  }

  if (!normalizedValue || normalizedValue === "n/d" || normalizedValue === "nd") {
    return { label: "N/D", unavailable: true };
  }

  return { label: value, unavailable: false };
};

const IndicatorsTable = ({
  indicators,
  pdfIndicators,
  bestIndicators = [],
  worstIndicators = [],
  showPdfDownload = false,
  cityName = "",
  dimensionTitle = "",
  dimensionScoreSummary = null,
  comparisonItems = [],
  comparisonLoading = false,
  topicIndicatorWeights = {},
  dimensionScore = null,
  tableOnly = false,
}) => {
  const { t } = useI18n();
  const [showIndicatorDetails, setShowIndicatorDetails] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedTopicKey, setSelectedTopicKey] = useState(null);
  const [isPreparingTablePdf, setIsPreparingTablePdf] = useState(false);
  const exportContainerRef = useRef(null);
  const effectiveShowIndicatorDetails = tableOnly || showIndicatorDetails;
  const visibleIndicators = indicators || [];
  const hasIndicators = visibleIndicators.length > 0;
  const downloadableIndicators = Array.isArray(pdfIndicators) ? pdfIndicators : [];
  const hasDownloadableIndicators = downloadableIndicators.length > 0;

  const dimensionScoreIndicators = downloadableIndicators.length > 0
    ? downloadableIndicators
    : visibleIndicators;
  const validDimensionLevels = dimensionScoreIndicators
    .map((item) => Number(item.level))
    .filter((level) => isValidLevel(level));
  const fallbackAverageLevel = validDimensionLevels.length
    ? validDimensionLevels.reduce((sum, level) => sum + level, 0) / validDimensionLevels.length
    : null;
  const renderedDimensionScore = Number.isFinite(Number(dimensionScore))
    ? Number(dimensionScore)
    : fallbackAverageLevel == null
      ? null
      : Math.round((fallbackAverageLevel / 7) * 100);
  const waitForNextPaint = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

  const handleDownloadPdf = async (variant) => {
    if (!hasDownloadableIndicators || !exportContainerRef.current) return;

    const shouldShowTable = tableOnly || variant === "table";
    const previousView = showIndicatorDetails;

    flushSync(() => {
      setIsExportMenuOpen(false);
      setShowIndicatorDetails(shouldShowTable);
      setIsPreparingTablePdf(shouldShowTable);
    });

    try {
      await waitForNextPaint();
      await exportSectionPdf({
        element: exportContainerRef.current,
        cityName,
        dimensionTitle,
        variant: shouldShowTable ? "tabela" : "dashboard",
      });
    } finally {
      flushSync(() => {
        setIsPreparingTablePdf(false);

        if (previousView !== shouldShowTable) {
          setShowIndicatorDetails(previousView);
        }
      });
    }
  };

  const dashboardSections = [
    {
      key: "best",
      title: "Pontos Positivos",
      indicators: Array.isArray(bestIndicators) ? bestIndicators.slice(0, 3) : [],
      accentClass: "bg-[#eaf7ef] text-[#15803d]",
    },
    {
      key: "worst",
      title: "Pontos Negativos",
      indicators: Array.isArray(worstIndicators) ? worstIndicators.slice(0, 3) : [],
      accentClass: "bg-[#fff1ed] text-[#c2410c]",
    },
  ].filter((section) => section.indicators.length > 0);
  const topicChartData = Array.from(
    visibleIndicators.reduce((topics, item) => {
      const topic = getSubtopicLabel(item.topic);
      const currentItems = topics.get(topic) || [];
      currentItems.push(item);
      topics.set(topic, currentItems);
      return topics;
    }, new Map())
  )
    .map(([topic, items]) => ({
      topic: t(topic),
      score: calculateTopicScore(items, topicIndicatorWeights),
      indicatorCount: items.filter((item) => isValidLevel(Number(item.level))).length,
    }))
    .filter((item) => Number.isFinite(item.score))
    .sort((left, right) => right.score - left.score || left.topic.localeCompare(right.topic, "pt-BR"));
  const topicChartAverage = topicChartData.length
    ? topicChartData.reduce((sum, item) => sum + item.score, 0) / topicChartData.length
    : null;
  const topicChartHeight = Math.max(180, topicChartData.length * 24 + 32);
  const hasDashboardHighlights = dashboardSections.length > 0;
  const indicatorsForList = hasDashboardHighlights && !effectiveShowIndicatorDetails
    ? []
    : visibleIndicators.map((item, index) => ({ ...item, _originalIndex: index }));
  const groupedIndicators = indicatorsForList
    .reduce((groups, item) => {
      const topic = item.topic || "";
      const lastGroup = groups[groups.length - 1];

      if (lastGroup?.topic === topic) {
        lastGroup.items.push(item);
        return groups;
      }

      groups.push({
        topic,
        items: [item],
      });
      return groups;
    }, [])
    .map((group, index) => {
      const dimensionKey = normalizeText(dimensionTitle).replace(/[^a-z0-9]+/g, "-");
      const topicKey = normalizeText(group.topic).replace(/[^a-z0-9]+/g, "-");
      const contentId = `dimension-${dimensionKey || "indicadores"}-topic-${topicKey || "sem-topico"}-${index}`;

      return {
        ...group,
        contentId,
        topicLevel: calculateTopicLevel(group.items, topicIndicatorWeights),
      };
    });
  const selectedGroup =
    groupedIndicators.find((group) => group.contentId === selectedTopicKey) ||
    groupedIndicators[0] ||
    null;
  const groupsToRender = isPreparingTablePdf
    ? groupedIndicators
    : selectedGroup
      ? [selectedGroup]
      : [];
  return (
    <div
      ref={exportContainerRef}
      data-pdf-export-root
      className="w-full rounded-xl border border-[#dfe4ea] bg-white"
    >
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-3xl font-medium leading-none text-[#3d84d8]">
            {renderedDimensionScore == null
              ? "N/D"
              : Number(renderedDimensionScore).toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}
          </span>
          <div>
            <p className="text-xl text-[#1f2d3d]">{t("Pontuação da dimensão (base 100)")}</p>
            <p className="text-xs text-[#7a8aa0]">
              {t("Média regional")}: {dimensionScoreSummary?.regional ?? "N/D"} · {t("Média nacional")}:{" "}
              {dimensionScoreSummary?.national ?? "N/D"}
            </p>
          </div>
          {showPdfDownload && (
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((current) => !current)}
                disabled={!hasDownloadableIndicators}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#cfd6e0] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileDown size={16} />
                Exportar PDF
              </button>
              {isExportMenuOpen && hasDownloadableIndicators && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[170px] rounded-[12px] border border-[#d9e2ec] bg-white p-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
                  {!tableOnly && (
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf("dashboard")}
                      className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm font-medium text-[#1f2d3d] transition hover:bg-[#f4f7fb]"
                    >
                      Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf("table")}
                    className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm font-medium text-[#1f2d3d] transition hover:bg-[#f4f7fb]"
                  >
                    Indicadores
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {hasDashboardHighlights && !tableOnly && (
          <div className="mt-4 flex flex-wrap gap-6 border-b border-[#dce6f4]">
            <button
              type="button"
              onClick={() => setShowIndicatorDetails(false)}
              aria-pressed={!showIndicatorDetails}
              className={`relative pb-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 ${
                !showIndicatorDetails
                  ? "text-[#1f2d3d] after:absolute after:bottom-[-1px] after:left-0 after:h-[2px] after:w-full after:bg-[#3d84d8]"
                  : "text-[#5a6f8f] hover:text-[#27466f]"
              }`}
            >
              Resumo
            </button>
            <button
              type="button"
              onClick={() => setShowIndicatorDetails(true)}
              aria-pressed={showIndicatorDetails}
              className={`relative pb-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 ${
                showIndicatorDetails
                  ? "text-[#1f2d3d] after:absolute after:bottom-[-1px] after:left-0 after:h-[2px] after:w-full after:bg-[#3d84d8]"
                  : "text-[#5a6f8f] hover:text-[#27466f]"
              }`}
            >
              Indicadores
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pb-2 pt-0">
        {!hasIndicators && (
          <div className="py-8 text-center text-sm text-[#7a8aa0]">
            Nenhum indicador calculado para esta dimensao ate o momento.
          </div>
        )}

        {hasDashboardHighlights && !effectiveShowIndicatorDetails && (
          <div className="border-b border-[#edf1f5] pb-4 pt-2">
            <div className="rounded-2xl border border-[#e2e8f2] bg-[#f4f7fb] p-4">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboardSections.map((section) => (
                    <section
                      key={section.key}
                      data-pdf-block
                      aria-labelledby={`dashboard-${section.key}`}
                      className="rounded-2xl border border-[#e3e9f2] bg-white p-4"
                    >
                      <h3
                        id={`dashboard-${section.key}`}
                        className="text-base font-semibold text-[#1f2d3d]"
                      >
                        {t(section.title)}
                      </h3>

                      <ol className="mt-2 divide-y divide-[#e7ecf2]">
                        {section.indicators.map((card, index) => {
                          const valueDisplay = getCompactDashboardValue(card.value);
                          const indicatorTitle = t(card.title || `Indicador ${card.id}`);

                          return (
                            <li key={`${section.key}-${card.id}`} className="py-3 first:pt-2 last:pb-0">
                              <article className="flex min-w-0 items-start gap-3">
                                <span
                                  className={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${section.accentClass}`}
                                  aria-label={`${index + 1}º lugar`}
                                >
                                  {index + 1}º
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-start gap-2">
                                    <p
                                      className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-[#1f2d3d]"
                                      title={indicatorTitle}
                                    >
                                      {indicatorTitle}
                                    </p>
                                    <span
                                      className="shrink-0 rounded-full bg-[#f4f7fb] px-2 py-0.5 text-[11px] font-semibold"
                                      style={{ color: getMaturityLevelTextColor(card.level) }}
                                    >
                                      {card.level}/7
                                    </span>
                                  </div>

                                  <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
                                    <p
                                      className="min-w-0 flex-1 truncate text-xs text-[#7a8aa0]"
                                      title={card.topic ? t(card.topic) : undefined}
                                    >
                                      {card.topic ? t(card.topic) : t("Indicador")}
                                    </p>
                                    {valueDisplay.unavailable ? (
                                      <span className="shrink-0 rounded-full bg-[#fff1ed] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">
                                        {t(valueDisplay.label)}
                                      </span>
                                    ) : (
                                      <span
                                        className="max-w-[45%] shrink-0 truncate text-sm font-semibold"
                                        style={{ color: getMaturityLevelTextColor(card.level) }}
                                        title={String(valueDisplay.label)}
                                      >
                                        {t(valueDisplay.label)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </article>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  ))}
                </div>

                <div className="grid items-start gap-4 xl:grid-cols-2">
                  <section
                    data-pdf-block
                    aria-labelledby="dashboard-topics-title"
                    className="min-w-0 rounded-2xl border border-[#e3e9f2] bg-white p-3"
                  >
                    <h3
                      id="dashboard-topics-title"
                      className="text-sm font-semibold tracking-wide text-[#2d4c7a]"
                    >
                      {t("Desempenho dos tópicos")}
                    </h3>

                    {topicChartData.length > 0 ? (
                      <div className="mt-1.5 w-full" style={{ height: topicChartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topicChartData}
                            layout="vertical"
                            margin={{ top: 14, right: 30, left: 0, bottom: 0 }}
                            barCategoryGap="18%"
                          >
                            <XAxis
                              type="number"
                              domain={[0, 7]}
                              hide
                            />
                            <YAxis
                              type="category"
                              dataKey="topic"
                              width={140}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#34445a", fontSize: 10 }}
                              tickFormatter={(value) =>
                                value.length > 22 ? `${value.slice(0, 21)}…` : value
                              }
                            />
                            <Tooltip
                              cursor={{ fill: "rgba(61,132,216,0.06)" }}
                              formatter={(value, _name, item) => [
                                `${Number(value).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}/7`,
                                `${t("Nível médio")} · ${item?.payload?.indicatorCount || 0} ${t("Indicadores").toLocaleLowerCase()}`,
                              ]}
                              labelFormatter={(label) => label}
                            />
                            {Number.isFinite(topicChartAverage) && (
                              <ReferenceLine
                                x={topicChartAverage}
                                stroke="#3d84d8"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                label={{
                                  value: topicChartAverage.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  }),
                                  position: "top",
                                  fill: "#2d7fd3",
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              />
                            )}
                            <Bar dataKey="score" radius={[0, 5, 5, 0]} maxBarSize={12}>
                              {topicChartData.map((entry) => (
                                <Cell
                                  key={`topic-${entry.topic}`}
                                  fill={getMaturityLevelTextColor(entry.score)}
                                />
                              ))}
                              <LabelList
                                dataKey="score"
                                position="right"
                                fill="#34445a"
                                fontSize={9}
                                formatter={(value) =>
                                  Number(value).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  })
                                }
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[#5b7596]">
                        {t("Sem dados de tópicos para exibição.")}
                      </p>
                    )}
                  </section>

                <div
                  data-pdf-block
                  className="min-w-0 self-start rounded-2xl border border-[#e3e9f2] bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-semibold tracking-wide text-[#2d4c7a]">
                      Comparativo - Cidades de Porte Similar
                    </p>
                    <p className="mt-0.5 text-xs text-[#3d587d]">Pontuação geral · base 100</p>
                  </div>

                  <div className="mt-3 grid gap-2.5">
                    {comparisonLoading ? (
                      <p className="text-sm text-[#5b7596]">Carregando municípios semelhantes...</p>
                    ) : comparisonItems.length === 0 ? (
                      <p className="text-sm text-[#5b7596]">
                        Sem dados de municípios semelhantes para comparação.
                      </p>
                    ) : (
                      comparisonItems.map((item) => {
                        const width = `${clamp(Number(item.score) || 0, 0, 100)}%`;

                        return (
                          <div
                            key={item.city}
                            className="grid grid-cols-[minmax(80px,0.8fr)_minmax(90px,1fr)_32px] items-center gap-3"
                          >
                            <MunicipalityName
                              as="p"
                              className={`truncate text-xs ${
                                item.isCurrent
                                  ? "font-semibold text-[#1f4e9b]"
                                  : "text-[#0f172a]"
                              }`}
                              title={
                                Number.isFinite(item.similarityScore)
                                  ? `${Number.isFinite(item.distanceKm)
                                      ? `Distância: ${item.distanceKm.toLocaleString("pt-BR", {
                                          minimumFractionDigits: 1,
                                          maximumFractionDigits: 1,
                                        })} km · `
                                      : ""
                                    }Similaridade: ${item.similarityScore.toLocaleString("pt-BR", {
                                      minimumFractionDigits: 1,
                                      maximumFractionDigits: 1,
                                    })}%`
                                  : undefined
                              }
                            >
                              {item.city}
                            </MunicipalityName>

                            <div className="h-2 rounded-full bg-[#d6d3d1]">
                              <div
                                className={`h-2 rounded-full ${
                                  item.isCurrent ? "bg-[#3d84d8]" : "bg-[#a8a29e]"
                                }`}
                                style={{ width }}
                              />
                            </div>

                            <p className="text-right text-xs text-[#4f5d73]">{item.score}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {groupedIndicators.length > 0 && (
          <div
            className={
              isPreparingTablePdf
                ? ""
                : "xl:grid xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start xl:gap-7"
            }
          >
            {!isPreparingTablePdf && (
              <aside className="hidden min-w-0 xl:block">
                <nav
                  aria-label={t("Navegação pelos tópicos")}
                  className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto bg-white"
                >
                  <div className="divide-y divide-[#dce5f1]">
                    {groupedIndicators.map((group) => {
                      const isSelected = group.contentId === selectedGroup?.contentId;
                      const hasTopicLevel = isValidLevel(Number(group.topicLevel));
                      const topicLevelValue = hasTopicLevel ? Number(group.topicLevel) : "—";

                      return (
                        <button
                          id={`${group.contentId}-navigation`}
                          key={group.contentId}
                          type="button"
                          onClick={() => setSelectedTopicKey(group.contentId)}
                          aria-controls={group.contentId}
                          aria-current={isSelected ? "true" : undefined}
                          className={`relative grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 overflow-hidden bg-white py-3 pl-3 pr-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7fb6ff] ${
                            isSelected
                              ? "bg-white"
                              : "hover:bg-[#f8fafc]"
                          }`}
                        >
                          {isSelected && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#3d84d8]"
                            />
                          )}
                          <span className="min-w-0">
                            <span
                              className={`block text-sm leading-snug ${
                                isSelected
                                  ? "font-semibold text-[#1f4e9b]"
                                  : "font-medium text-[#334967]"
                              }`}
                            >
                              {t(getSubtopicLabel(group.topic))}
                            </span>
                          </span>
                          <span
                            aria-label={
                              hasTopicLevel
                                ? `Nível do tópico ${topicLevelValue} de 7`
                                : "Nível do tópico não disponível"
                            }
                            className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${
                              isSelected
                                ? "bg-[#e7f0ff] text-[#245fae]"
                                : "bg-[#e9eef5] text-[#53657d]"
                            }`}
                          >
                            <span aria-hidden="true">{topicLevelValue}</span>
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-4 w-4 transition-transform ${
                              isSelected ? "translate-x-0.5 text-[#3d84d8]" : "text-[#8a9ab0]"
                            }`}
                            strokeWidth={2.3}
                          />
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </aside>
            )}

            <div className="min-w-0">
              {!isPreparingTablePdf && selectedGroup && (
                <>
                  <div className="mb-4 xl:hidden">
                    <label
                      htmlFor={`${selectedGroup.contentId}-mobile-selector`}
                      className="mb-2 block text-sm font-semibold text-[#334967]"
                    >
                      {t("Seção da dimensão")}
                    </label>
                    <select
                      id={`${selectedGroup.contentId}-mobile-selector`}
                      value={selectedGroup.contentId}
                      onChange={(event) => setSelectedTopicKey(event.target.value)}
                      className="h-11 w-full rounded-[10px] border border-[#cfd9e7] bg-white px-3 text-sm font-medium text-[#1f2d3d] outline-none transition focus:border-[#6aa4e5] focus:ring-2 focus:ring-[#b9d6f7]"
                    >
                      {groupedIndicators.map((group) => (
                        <option key={group.contentId} value={group.contentId}>
                          {t(getSubtopicLabel(group.topic))} · {isValidLevel(Number(group.topicLevel)) ? Number(group.topicLevel) : "N/D"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="sr-only" aria-live="polite">
                    {t("Exibindo tópico")}: {t(getSubtopicLabel(selectedGroup.topic))}
                  </p>

                  <div
                    aria-hidden="true"
                    className="hidden border-b border-[#dce6f4] pb-3 xl:grid xl:grid-cols-[minmax(0,1fr)_112px] xl:gap-5"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7c93]">
                      {t("Indicador")}
                    </span>
                    <span className="text-right text-xs font-semibold uppercase tracking-wide text-[#6b7c93]">
                      {t("Nível")}
                    </span>
                  </div>
                </>
              )}

              {groupsToRender.map((group) => (
                <section
                  id={group.contentId}
                  key={group.contentId}
                  aria-labelledby={`${group.contentId}-heading`}
                  data-pdf-block
                  className={isPreparingTablePdf ? "mt-7 first:mt-0" : ""}
                >
                  <header
                    className={`border-b border-[#dce6f4] pb-2 ${
                      isPreparingTablePdf ? "" : "xl:sr-only"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h4
                        id={`${group.contentId}-heading`}
                        className="text-base font-semibold text-[#1f2d3d]"
                      >
                        {t(getSubtopicLabel(group.topic))}
                      </h4>
                      <span
                        aria-label={
                          isValidLevel(Number(group.topicLevel))
                            ? `Nível do tópico ${Number(group.topicLevel)} de 7`
                            : "Nível do tópico não disponível"
                        }
                        className="shrink-0 rounded-full bg-[#e7f0ff] px-3 py-1 text-xs font-semibold text-[#245fae]"
                      >
                        <span aria-hidden="true">
                          {isValidLevel(Number(group.topicLevel))
                            ? Number(group.topicLevel)
                            : "—"}
                        </span>
                      </span>
                    </div>
                  </header>

            <div className="divide-y divide-[#edf1f5]">
              {group.items.map((item) => {
                const originalIndex = item._originalIndex;
                const level = Number(item.level);
                const hasLevel = isValidLevel(level);
                const safeLevel = hasLevel ? Math.round(level) : 0;
                const levelCardColor = hasLevel ? INDICATOR_LEVEL_COLORS[safeLevel] : null;
                const sources = getUniqueSources(item.variableSources);
                const hasTooltipContent = Boolean(item.description) || sources.length > 0;
                const isTextValue = Boolean(item.valueIsText);

                return (
                  <div
                    key={`${item.topic || ""}-${item.label || item.indicator || ""}-${originalIndex}`}
                    data-pdf-block
                    className="py-3.5"
                  >
                    {isTextValue ? (
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_112px] lg:items-start lg:gap-5">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start gap-2">
                            <p
                              className="text-base leading-snug text-[#111827]"
                              title={item.label || item.indicator || "Indicador"}
                            >
                              {item.label || item.indicator || "Indicador"}
                            </p>

                            {hasTooltipContent && (
                              <span className="group relative mt-0.5 inline-flex shrink-0">
                                <button
                                  type="button"
                                  aria-label={`Informações sobre ${item.label || "indicador"}`}
                                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#19c2df] transition-colors hover:bg-[#e9f8fc] hover:text-[#0da8c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1"
                                >
                                  <Info className="h-4 w-4" strokeWidth={2.3} />
                                </button>
                                <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-md border border-[#d7e4f5] bg-white px-3 py-2 text-xs leading-relaxed text-[#425a78] opacity-0 shadow-[0_8px_24px_rgba(23,52,95,0.16)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:left-0 sm:right-auto">
                                  {item.description && (
                                    <span className="block">{t(item.description)}</span>
                                  )}
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
                          <p className="mt-3 max-w-full text-justify text-sm leading-relaxed text-[#53657d]">
                            {t(item.value || "N/D")}
                          </p>
                        </div>

                        <div className="flex items-start lg:justify-end">
                          <span
                            aria-label={hasLevel ? `Nível de maturidade ${safeLevel} de 7` : "Nível de maturidade não disponível"}
                            className={`inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-[14px] border bg-white px-3 text-xl font-semibold leading-none shadow-[0_1px_3px_rgba(30,64,105,0.08)] ${hasLevel ? "" : "border-[#d6dee8] text-[#6b7c93]"}`}
                            style={
                              hasLevel
                                ? {
                                    borderColor: `${levelCardColor}66`,
                                    color: levelCardColor,
                                  }
                                : undefined
                            }
                          >
                            <span aria-hidden="true">{hasLevel ? safeLevel : "—"}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_112px] lg:items-start lg:gap-5">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start gap-2">
                            <p className="text-base leading-snug text-[#111827]" title={item.label || item.indicator || "Indicador"}>
                              {item.label || item.indicator || "Indicador"}
                            </p>

                            {hasTooltipContent && (
                              <span className="group relative mt-0.5 inline-flex shrink-0">
                                <button
                                  type="button"
                                  aria-label={`Informações sobre ${item.label || "indicador"}`}
                                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#19c2df] transition-colors hover:bg-[#e9f8fc] hover:text-[#0da8c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1"
                                >
                                  <Info className="h-4 w-4" strokeWidth={2.3} />
                                </button>
                                <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-md border border-[#d7e4f5] bg-white px-3 py-2 text-xs leading-relaxed text-[#425a78] opacity-0 shadow-[0_8px_24px_rgba(23,52,95,0.16)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:left-0 sm:right-auto">
                                  {item.description && (
                                    <span className="block">{t(item.description)}</span>
                                  )}
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
                          <p className="mt-3 text-sm leading-relaxed text-[#53657d]">
                            {t(item.value || "N/D")}
                          </p>
                        </div>

                        <div className="flex items-start lg:justify-end">
                          <span
                            aria-label={hasLevel ? `Nível de maturidade ${safeLevel} de 7` : "Nível de maturidade não disponível"}
                            className={`inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-[14px] border bg-white px-3 text-xl font-semibold leading-none shadow-[0_1px_3px_rgba(30,64,105,0.08)] ${hasLevel ? "" : "border-[#d6dee8] text-[#6b7c93]"}`}
                            style={
                              hasLevel
                                ? {
                                    borderColor: `${levelCardColor}66`,
                                    color: levelCardColor,
                                  }
                                : undefined
                            }
                          >
                            <span aria-hidden="true">{hasLevel ? safeLevel : "—"}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndicatorsTable;

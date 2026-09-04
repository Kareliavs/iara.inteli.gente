import { useMemo } from "react";
import MunicipalityName from "@/components/common/MunicipalityName";
import { useI18n } from "@/lib/i18n";

const MATURITY_COLORS = {
  1: "#A50003",
  2: "#E33A23",
  3: "#E17304",
  4: "#3F8ED1",
  5: "#1F4E9B",
  6: "#419B01",
  7: "#395427",
};

const MATURITY_LABELS = {
  1: "Ades\u00e3o",
  2: "Engajamento",
  3: "Planejamento",
  4: "Alinhamento",
  5: "Desenvolvimento",
  6: "Integra\u00e7\u00e3o",
  7: "Otimiza\u00e7\u00e3o",
};

const SELECTED_STATE_NAMES = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amap\u00e1",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Cear\u00e1",
  DF: "Distrito Federal",
  ES: "Esp\u00edrito Santo",
  GO: "Goi\u00e1s",
  MA: "Maranh\u00e3o",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Par\u00e1",
  PB: "Para\u00edba",
  PR: "Paran\u00e1",
  PE: "Pernambuco",
  PI: "Piau\u00ed",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rond\u00f4nia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "S\u00e3o Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const toNullableNumber = (value) => {
  if (value == null || value === "") return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatInteger = (value) => {
  if (!Number.isFinite(value)) return "N/D";
  return Math.round(value).toLocaleString("pt-BR");
};

const formatAverageLevel = (value) => {
  const numericValue = toNullableNumber(value);

  if (numericValue == null) return "N/D";

  return numericValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const formatPopulation = (value) => formatInteger(value);

const formatMunicipioTitle = (value) => {
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s|-)(\p{L})/gu, (match, separator, letter) =>
      `${separator}${letter.toLocaleUpperCase("pt-BR")}`
    );
};

const formatArea = (value, language = "pt") => {
  if (!Number.isFinite(value) || value <= 0) return "N/D";

  if (value >= 1000000) {
    const unit = language === "pt" ? "mi" : "M";

    return `${(value / 1000000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${unit} km\u00b2`;
  }

  if (value >= 1000) {
    const unit = language === "en" ? "k" : "mil";

    return `${Math.round(value / 1000).toLocaleString("pt-BR")} ${unit} km\u00b2`;
  }

  return `${Math.round(value).toLocaleString("pt-BR")} km\u00b2`;
};

const getAverageLabel = (value) => {
  const numericValue = toNullableNumber(value);

  if (numericValue == null) return "N/D";

  const level = Math.max(1, Math.min(7, Math.round(numericValue)));
  return MATURITY_LABELS[level] || "N/D";
};

const buildSummary = (rows) => {
  const states = new Set();
  let populationTotal = 0;
  let areaTotal = 0;
  let maturitySum = 0;
  let maturityCount = 0;

  rows.forEach((item) => {
    if (item?.estado_sigla) {
      states.add(item.estado_sigla);
    }

    const population = Number(item?.populacao_total);
    if (Number.isFinite(population)) {
      populationTotal += population;
    }

    const area = Number(item?.municipio_area);
    if (Number.isFinite(area)) {
      areaTotal += area;
    }

    const maturity = Number(item?.municipio_nivel);
    if (Number.isFinite(maturity) && maturity >= 1 && maturity <= 7) {
      maturitySum += maturity;
      maturityCount += 1;
    }
  });

  return {
    estados_total: states.size,
    municipios_total: rows.length,
    populacao_total: populationTotal,
    area_total: areaTotal,
    maturidade_media: maturityCount > 0 ? maturitySum / maturityCount : null,
    maturidade_count: maturityCount,
  };
};

const renderDetailedSection = (summary) => {
  const averageLevelText = String(summary.averageLevel ?? "N/D");
  const normalizedLevel = Number(averageLevelText.replace(",", "."));
  const hasAverageLevel = Number.isFinite(normalizedLevel);
  const wholeBars = hasAverageLevel
    ? Math.max(0, Math.min(7, Math.floor(normalizedLevel)))
    : 0;
  const decimalPart = hasAverageLevel
    ? Math.max(0, normalizedLevel - Math.floor(normalizedLevel))
    : 0;
  const hasDecimalPart = decimalPart > 0 && wholeBars < 7;
  const decimalBarOpacity = hasDecimalPart
    ? Math.max(0.1, Math.min(0.95, decimalPart))
    : 1;
  const filledBars = hasAverageLevel
    ? Math.max(1, Math.min(7, Math.round(normalizedLevel)))
    : null;
  const levelColor = MATURITY_COLORS[filledBars] || "#3F8ED1";

  return (
    <>
      {summary.titleIsMunicipality ? (
        <MunicipalityName
          as="p"
          className="mt-2 text-base font-bold text-foreground"
        >
          {summary.title}
        </MunicipalityName>
      ) : (
        <p className="mt-2 text-base font-bold text-foreground">{summary.title}</p>
      )}
      <p className="text-sm text-muted-foreground">{summary.subtitle}</p>

      <div className="mt-4 space-y-1 text-sm text-foreground">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-muted-foreground">{"Popula\u00e7\u00e3o total"}</span>
          <span className="notranslate font-semibold" translate="no">
            {summary.population}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-muted-foreground">{"Munic\u00edpios"}</span>
          <span className="notranslate font-semibold" translate="no">
            {summary.municipalities}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-muted-foreground">{"\u00c1rea total"}</span>
          <span className="notranslate font-semibold" translate="no">
            {summary.area}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-muted-foreground">{"N\u00edvel m\u00e9dio"}</span>
          <span className="font-semibold text-foreground">
            <span className="notranslate" translate="no">
              {averageLevelText}
            </span>{" "}
            - {summary.averageLabel}
          </span>
        </div>
      </div>

      <div className="my-3 border-t border-border" />

      <p className="text-xs tracking-wide text-muted-foreground">
        {"N\u00cdVEL M\u00c9DIO DE MATURIDADE"}
      </p>

      <div className="mt-1.5 flex items-center gap-3">
        {[0, 2].map((startIndex) => (
          <div
            key={startIndex}
            className={`flex gap-1.5 ${
              startIndex === 0
                ? "flex-[2]"
                : "relative flex-[5] before:absolute before:-left-[7px] before:top-1/2 before:h-5 before:w-px before:-translate-y-1/2 before:bg-[#AEB9C7]"
            }`}
          >
            {Array.from({ length: startIndex === 0 ? 2 : 5 }).map((_, offset) => {
              const idx = startIndex + offset;

              return (
                <span
                  key={idx}
                  className="h-2.5 flex-1 rounded-full"
                  style={
                    idx < wholeBars
                      ? { backgroundColor: levelColor, opacity: 1 }
                      : hasDecimalPart && idx === wholeBars
                      ? { backgroundColor: levelColor, opacity: decimalBarOpacity }
                      : { backgroundColor: "#D9DEE7" }
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex gap-3 text-xs leading-tight text-muted-foreground">
        <span className="flex-[2] text-center font-semibold">Preparação</span>
        <span className="flex-[5] text-center font-semibold">Gestão e Governança</span>
      </div>
    </>
  );
};

const StateHoverInfoCard = ({
  stateInfo,
  municipioInfo,
  municipiosData = [],
  loading = false,
  selectedRegion,
  selectedState,
  selectedInfluence,
}) => {
  const { language } = useI18n();
  const effectiveState = municipioInfo
    ? ""
    : stateInfo?.sigla || selectedState || "";
  const effectiveRegion = effectiveState ? "" : selectedRegion;

  const filteredRows = useMemo(() => {
    if (!Array.isArray(municipiosData) || municipiosData.length === 0) {
      return [];
    }

    if (municipioInfo) {
      const municipioCode = String(municipioInfo.municipio_cod_ibge || "");
      return municipiosData.filter(
        (item) => String(item?.municipio_cod_ibge || "") === municipioCode
      );
    }

    return municipiosData.filter((item) => {
      const matchesState =
        !effectiveState || item?.estado_sigla === effectiveState;
      const matchesRegion =
        !effectiveRegion || item?.municipio_regiao === effectiveRegion;
      const matchesInfluence =
        !selectedInfluence || item?.rede_influencia === selectedInfluence;

      return matchesState && matchesRegion && matchesInfluence;
    });
  }, [
    municipioInfo,
    municipiosData,
    effectiveState,
    effectiveRegion,
    selectedInfluence,
  ]);

  const summary = useMemo(() => buildSummary(filteredRows), [filteredRows]);
  const scope = useMemo(() => {
    if (municipioInfo) {
      const regionLabel = municipioInfo.municipio_regiao
        ? `Regi\u00e3o ${municipioInfo.municipio_regiao}`
        : "";
      const subtitleParts = [
        regionLabel,
        municipioInfo.rede_influencia,
      ].filter(Boolean);

      return {
        title: formatMunicipioTitle(municipioInfo.municipio_nome) || "Munic\u00edpio",
        titleIsMunicipality: true,
        subtitle: subtitleParts.join(" - ") || "Munic\u00edpio em destaque",
      };
    }

    const stateName =
      stateInfo?.estadoNome ||
      SELECTED_STATE_NAMES[selectedState] ||
      selectedState ||
      "";
    const statesCount = formatInteger(Number(summary.estados_total));

    if (selectedInfluence) {
      const geography = stateName
        ? stateName
        : effectiveRegion
        ? `Regi\u00e3o ${effectiveRegion}`
        : "Brasil";

      return {
        title: selectedInfluence,
        subtitle: `${geography} - Rede de influ\u00eancia`,
      };
    }

    if (stateInfo || selectedState) {
      return {
        title: stateName,
        subtitle: stateInfo?.region
          ? `Regi\u00e3o ${stateInfo.region}`
          : effectiveRegion
          ? `Regi\u00e3o ${effectiveRegion}`
          : "Regi\u00e3o n\u00e3o informada",
      };
    }

    if (effectiveRegion) {
      return {
        title: `Regi\u00e3o ${effectiveRegion}`,
        subtitle: `${statesCount} estados`,
      };
    }

    return {
      title: "Brasil",
      subtitle: `${statesCount} estados`,
    };
  }, [
    municipioInfo,
    selectedInfluence,
    effectiveRegion,
    selectedState,
    stateInfo,
    summary.estados_total,
  ]);

  const municipioRow = filteredRows[0] || municipioInfo || null;
  const averageLevel = municipioInfo
    ? toNullableNumber(municipioRow?.municipio_nivel)
    : summary.maturidade_media;
  const populationValue = municipioInfo
    ? Number(municipioRow?.populacao_total)
    : summary.populacao_total;
  const areaValue = municipioInfo
    ? Number(municipioRow?.municipio_area)
    : summary.area_total;
  const municipalitiesValue = municipioInfo ? 1 : summary.municipios_total;

  if (loading && filteredRows.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-background p-4 shadow-sm">
        <p className="text-sm font-semibold text-brand-cyan">
          {"Informa\u00e7\u00f5es do Mapa selecionado"}
        </p>
        <p className="mt-2 text-base font-bold text-foreground">Brasil</p>
        <p className="text-sm text-muted-foreground">Carregando dados...</p>

        <div className="mt-5 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-4 rounded-full bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold text-brand-cyan">
        {"Informa\u00e7\u00f5es do Mapa selecionado"}
      </p>
      {renderDetailedSection({
        title: scope.title,
        subtitle: scope.subtitle,
        population: formatPopulation(populationValue),
        municipalities: formatInteger(municipalitiesValue),
        area: formatArea(areaValue, language),
        averageLevel: formatAverageLevel(averageLevel),
        averageLabel: getAverageLabel(averageLevel),
      })}
    </div>
  );
};

export default StateHoverInfoCard;

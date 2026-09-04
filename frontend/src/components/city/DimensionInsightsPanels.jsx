import { useEffect, useMemo, useState } from "react";
import MunicipalityName from "@/components/common/MunicipalityName";

const CHART_SERIES_BY_RANGE = {
  5: {
    city: [2, 2, 3, 3, 4, 4],
    regional: [2, 2, 2, 3, 3, 3],
  },
  10: {
    city: [1, 2, 2, 3, 4, 4],
    regional: [1, 2, 2, 2, 3, 3],
  },
  25: {
    city: [1, 1, 2, 3, 4, 4],
    regional: [1, 1, 2, 2, 3, 3],
  },
};

const toChartY = (value) => {
  const minY = 170;
  const maxY = 60;
  const normalized = (value - 1) / 6;
  return minY - (minY - maxY) * normalized;
};

const toChartX = (index) => 70 + index * 82;

const buildPolylinePoints = (values) =>
  values.map((value, index) => `${toChartX(index)},${toChartY(value)}`).join(" ");

const toDisplayName = (name) =>
  (name || "")
    .toLocaleLowerCase("pt-BR")
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, separator, letter) => `${separator}${letter.toLocaleUpperCase("pt-BR")}`
    );

const DimensionInsightsPanels = ({ cityName = "Campinas", municipioCodIbge = null }) => {
  const displayCityName = toDisplayName(cityName);
  const [rangeYears, setRangeYears] = useState(5);
  const [comparisons, setComparisons] = useState([]);
  const [comparisonsLoading, setComparisonsLoading] = useState(false);

  const evolutionYears = useMemo(() => {
    const pointsCount = 6;
    const endYear = 2025;
    const startYear = endYear - rangeYears;
    const step = rangeYears / (pointsCount - 1);

    return Array.from({ length: pointsCount }, (_, index) =>
      Math.round(startYear + step * index)
    );
  }, [rangeYears]);

  const citySeries = CHART_SERIES_BY_RANGE[rangeYears]?.city || CHART_SERIES_BY_RANGE[5].city;
  const regionalSeries = CHART_SERIES_BY_RANGE[rangeYears]?.regional || CHART_SERIES_BY_RANGE[5].regional;
  useEffect(() => {
    if (!municipioCodIbge) {
      setComparisons([]);
      setComparisonsLoading(false);
      return;
    }

    let cancelled = false;
    setComparisonsLoading(true);

    fetch(`/api/municipios/${municipioCodIbge}/comparativo-semelhantes?limit=6`)
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

        setComparisons(normalized);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erro ao buscar comparativo regional:", err);
        setComparisons([]);
      })
      .finally(() => {
        if (cancelled) return;
        setComparisonsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [municipioCodIbge]);

  const cityPoints = buildPolylinePoints(citySeries);
  const regionalPoints = buildPolylinePoints(regionalSeries);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-semibold tracking-[0.04em] text-[#445b78]">
            EVOLUÇÃO HISTÓRICA — NÍVEL DE MATURIDADE
          </p>

          <div className="flex items-center gap-2">
            {[5, 10, 25].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRangeYears(option)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  rangeYears === option
                    ? "bg-[#3d84d8] text-white"
                    : "bg-[#edf2f7] text-[#4f5d73] hover:bg-[#dfe8f2]"
                }`}
              >
                {option} anos
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1">
          <svg viewBox="0 0 560 220" className="h-[220px] w-full">
            {[0, 1, 2, 3, 4].map((line) => (
              <line
                key={line}
                x1="70"
                y1={40 + line * 30}
                x2="500"
                y2={40 + line * 30}
                stroke="#e8edf3"
                strokeWidth="1"
              />
            ))}

            {[2, 3, 4, 5].map((level) => (
              <text
                key={level}
                x="56"
                y={toChartY(level) + 4}
                fontSize="12"
                fill="#7a8aa0"
              >
                {level}
              </text>
            ))}

            <polyline
              fill="none"
              stroke="#a8a29e"
              strokeWidth="2"
              strokeDasharray="6 4"
              points={regionalPoints}
            />
            <polyline
              fill="none"
              stroke="#3d84d8"
              strokeWidth="3"
              points={cityPoints}
            />

            {citySeries.map((value, index) => (
              <circle
                key={`city-${index}`}
                cx={toChartX(index)}
                cy={toChartY(value)}
                r="4"
                fill="#3d84d8"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}

            {regionalSeries.map((value, index) => (
              <circle
                key={`regional-${index}`}
                cx={toChartX(index)}
                cy={toChartY(value)}
                r="3"
                fill="#a8a29e"
              />
            ))}

            {evolutionYears.map((year, index) => (
              <text
                key={year}
                x={toChartX(index)}
                y="206"
                fontSize="12"
                textAnchor="middle"
                fill="#7a8aa0"
              >
                {year}
              </text>
            ))}
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#4f5d73]">
          <div className="flex items-center gap-2">
            <span className="h-[3px] w-8 rounded bg-[#3d84d8]" />
            <MunicipalityName>{displayCityName}</MunicipalityName>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0 w-8 border-t-2 border-dashed border-[#a8a29e]" />
            <span>Média regional</span>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
        <p className="text-base font-semibold tracking-[0.04em] text-[#445b78]">
          Comparativo - Cidades de Porte Similar
        </p>
        <p className="mt-2 text-base text-[#4f5d73]">Pontuação geral · base 100</p>

        <div className="mt-4 space-y-4">
          {comparisonsLoading ? (
            <p className="text-sm text-[#5b7596]">Carregando municípios semelhantes...</p>
          ) : comparisons.length === 0 ? (
            <p className="text-sm text-[#5b7596]">Sem dados de municípios semelhantes para comparação.</p>
          ) : (
            comparisons.map((item) => {
            const width = `${(item.score / 100) * 100}%`;
            return (
              <div
                key={item.city}
                className="grid grid-cols-[1fr_180px_52px] items-center gap-4"
              >
                <MunicipalityName
                  as="p"
                  className={`text-base ${
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

                <div className="h-2.5 rounded-full bg-[#d6d3d1]">
                  <div
                    className={`h-2.5 rounded-full ${
                      item.isCurrent ? "bg-[#3d84d8]" : "bg-[#a8a29e]"
                    }`}
                    style={{ width }}
                  />
                </div>

                <p className="text-right text-base text-[#4f5d73]">{item.score}</p>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DimensionInsightsPanels;

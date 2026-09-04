import MunicipalityName from "@/components/common/MunicipalityName";

const LEVEL_LABELS = {
  1: "Adesão",
  2: "Engajamento",
  3: "Estruturação",
  4: "Alinhamento",
  5: "Integração",
  6: "Aprimoramento",
  7: "Otimização",
};

const levelColors = {
  1: "#9CA3AF",
  2: "#60A5FA",
  3: "#3B82F6",
  4: "#2F7DD1",
  5: "#1D4ED8",
  6: "#1E40AF",
  7: "#173A8A",
};

const CityMaturitySummary = ({
  cityName,
  stateName,
  region,
  populationLabel,
  level = 4,
  score = 59.8,
  yearlyVariation = "+3,4 pts",
  regionalRank = "3º lugar",
  updatedAt = "dez/2025",
  aboveRegionalAverage = true,
  onExportPdf,
}) => {
  const activeColor = levelColors[level] || "#2F7DD1";

  return (
    <section className="mx-auto max-w-[1300px] px-6">
      <div className="rounded-[20px] border border-[#d8dde6] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[170px_minmax(0,1fr)_220px]">
          <div className="flex flex-col items-center justify-center rounded-[18px] border border-[#d8dde6] bg-[#f8fafc] px-4 py-6 text-center">
            <div
              className="text-[72px] font-bold leading-none"
              style={{ color: activeColor }}
            >
              {level}
            </div>
            <div className="mt-3 text-[30px] leading-none text-[#0f172a]">—</div>
            <div className="mt-3 text-[32px] font-semibold leading-none text-[#0f172a]">
              {level}
            </div>
            <div className="mt-3 text-[18px] font-semibold text-[#111827]">
              {LEVEL_LABELS[level]}
            </div>
            <div className="mt-2 text-[14px] text-[#64748b]">
              Nível de maturidade
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-[26px] font-bold leading-tight text-[#0f172a]">
              <MunicipalityName>{cityName} - {stateName}</MunicipalityName>
            </h2>

            <p className="mt-2 text-[15px] text-[#64748b]">
              {stateName} • {region} •{" "}
              <span className="notranslate" translate="no">
                {populationLabel}
              </span>
            </p>

            <div className="mt-5">
              <div className="grid grid-cols-7 gap-[6px]">
                {Array.from({ length: 7 }, (_, index) => {
                  const step = index + 1;
                  const isActive = step <= level;

                  return (
                    <div
                      key={step}
                      className="h-[8px] rounded-full"
                      style={{
                        backgroundColor: isActive ? activeColor : "#D7DCE3",
                        opacity: isActive ? 1 : 1,
                      }}
                    />
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between text-[13px] text-[#64748b]">
                <span>1 · {LEVEL_LABELS[1]}</span>
                <span>
                  {level} · {LEVEL_LABELS[level]}
                </span>
                <span>7 · {LEVEL_LABELS[7]}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {aboveRegionalAverage && (
                <span className="inline-flex items-center rounded-full bg-[#dbe7cb] px-4 py-2 text-[14px] font-semibold text-[#335b00]">
                  ↑ Acima da média regional
                </span>
              )}

              <span className="inline-flex items-center rounded-full bg-[#ead8b8] px-4 py-2 text-[14px] font-semibold text-[#8a5a00]">
                Atualizado: {updatedAt}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between text-right">
            <div className="space-y-3">
              <div>
                <div className="text-[34px] font-bold leading-none text-[#0f172a]">
                  {String(score).replace(".", ",")}
                </div>
                <div className="mt-1 text-[14px] text-[#64748b]">
                  Pontuação geral (0–100)
                </div>
              </div>

              <div>
                <div className="text-[30px] font-bold leading-none text-[#0f172a]">
                  {yearlyVariation}
                </div>
                <div className="mt-1 text-[14px] text-[#64748b]">
                  vs. ano anterior
                </div>
              </div>

              <div>
                <div className="text-[30px] font-bold leading-none text-[#0f172a]">
                  {regionalRank}
                </div>
                <div className="mt-1 text-[14px] text-[#64748b]">
                  Ranking regional
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onExportPdf}
              className="mt-6 rounded-[14px] border border-[#cfd6e0] bg-white px-5 py-3 text-[15px] font-medium text-[#0f172a] transition hover:bg-[#f8fafc]"
            >
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CityMaturitySummary;

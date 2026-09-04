import { DIMENSION_SUMMARY } from "@/data/mockData";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const levelColorClasses = {
  1: "bg-level-1",
  2: "bg-level-2",
  3: "bg-level-3",
  4: "bg-level-4",
  5: "bg-level-5",
  6: "bg-level-6",
  7: "bg-level-7",
};

const dimensionIcons = {
  economica: "📈",
  meio_ambiente: "🌿",
  sociocultural: "🌱",
  capacidades_institucionais: "⚙️",
};

const DimensionSummaryCards = () => {
  return (
    <div className="space-y-10">
      {DIMENSION_SUMMARY.map((dim) => (
        <DimensionCard key={dim.code} dimension={dim} />
      ))}
    </div>
  );
};

const DimensionCard = ({ dimension }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl text-brand-cyan">{dimensionIcons[dimension.code]}</span>
        <h3 className="text-xl font-semibold text-foreground">{dimension.title}</h3>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="w-36 text-sm text-muted-foreground">NÃ­vel de maturidade</span>
        <div className="flex flex-1 items-center gap-1">
          <div className="hidden h-px flex-1 bg-border sm:block" />
          {dimension.values.map((v) => (
            <div
              key={v.level}
              className={`${levelColorClasses[v.level]} flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground md:h-12 md:w-12 md:text-base`}
            >
              {v.level}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-36 text-sm text-muted-foreground">NÂº de MunicÃ­pios</span>
        <div className="flex flex-1 items-center gap-1">
          <div className="hidden flex-1 sm:block" />
          {dimension.values.map((v) => (
            <div
              key={v.level}
              className="w-10 text-center text-xs text-muted-foreground md:w-12"
            >
              {v.quantity.toLocaleString("pt-BR")}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-brand-cyan px-4 py-3 text-sm font-semibold text-brand-cyan transition-colors hover:bg-muted/50"
      >
        Mais informaÃ§Ãµes
        <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          Detalhes dos tÃ³picos e indicadores desta dimensÃ£o serÃ£o exibidos aqui quando conectados Ã  API.
        </div>
      )}
    </div>
  );
};

export default DimensionSummaryCards;

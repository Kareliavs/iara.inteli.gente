import React from "react";

const levelColors = {
  1: "#A00000",
  2: "#E23A23",
  3: "#E27400",
  4: "#3E8ED0",
  5: "#1C4F9C",
  6: "#3F9D00",
  7: "#375623",
};

const TRACK_COLOR = "#D8DDE3";
const ICON_COLOR = "#22C7DD";

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

function DimensionIcon({ code }) {
  const common = {
    stroke: ICON_COLOR,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  };

  switch (code) {
    case "economica":
      return (
        <img src="/i_econ.png" alt="icone Economica" className="h-[35px] w-auto object-contain" />
      );
    case "meio_ambiente":
      return (
        <img src="/i_ambi.png" alt="icone Meio Ambiente" className="h-[35px] w-auto object-contain" />
      );
    case "sociocultural":
      return (
        <img src="/i_socio.png" alt="icone Socioeconômico" className="h-[35px] w-auto object-contain" />
      );
    case "capacidades_institucionais":
    case "d9":
      return (
        <img src="/i_capac.png" alt="icone Capacidades Institucionais" className="h-[35px] w-auto object-contain" />
      );
    default:
      return (
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
          <circle cx="16" cy="16" r="9" {...common} />
        </svg>
      );
  }
}

const ScoreGauge = ({ level, title, dimensionCode, className = "" }) => {
  const safeLevel = Math.max(0, Math.min(7, level));
  const color = levelColors[safeLevel] || "#999999";

  // Criar barra com 7 segmentos
  const segments = Array.from({ length: 7 }, (_, i) => i + 1);
  const progress = (safeLevel / 7) * 100;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Número do nível em círculo */}
        <div className="relative h-[70px] w-[70px] flex-shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke={TRACK_COLOR}
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={`${(safeLevel / 7) * 2 * Math.PI * 55} ${2 * Math.PI * 55}`}
              strokeDashoffset="0"
              pathLength="1"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-black">{safeLevel}</span>
            <span className="text-[12px] text-[#4f5d73]">/7</span>
          </div>
        </div>

        {/* Informações à direita */}
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <div className="text-[14px] font-semibold text-[#1f2d3d]">{title}</div>
            <div className="text-[12px] text-[#4f5d73]">Nível de maturidade</div>
          </div>

          {/* Barra de progresso horizontal com segmentos */}
          <div className="flex gap-1">
            {segments.map((seg) => (
              <div
                key={seg}
                className="h-2 flex-1 rounded-sm"
                style={{
                  backgroundColor: seg <= safeLevel ? color : TRACK_COLOR,
                }}
              />
            ))}
          </div>

          {/* Informações adicionais */}
          <div className="flex gap-3 text-[12px] text-[#4f5d73]">
            <span className="rounded bg-green-50 px-2 py-1 text-green-700">
              1 · Acima da média regional
            </span>
            <span className="text-gray-600">Atualizado: dez/2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;

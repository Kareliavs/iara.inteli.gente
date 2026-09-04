import { describe, expect, it } from "vitest";
import {
  getDashboardHighlights,
  hasUnansweredFormIndicators,
} from "./CitySearchDetails";

describe("getDashboardHighlights", () => {
  it("selects the three highest and three lowest maturity levels without overlap", () => {
    const indicators = [
      { id: "a", label: "Indicador A", value: "10%", level: 4 },
      { id: "b", label: "Indicador B", value: "20%", level: 7 },
      { id: "c", label: "Indicador C", value: "30%", level: 1 },
      { id: "d", label: "Indicador D", value: "40%", level: 6 },
      { id: "e", label: "Indicador E", value: "50%", level: 2 },
      { id: "f", label: "Indicador F", value: "60%", level: 5 },
      { id: "g", label: "Indicador G", value: "70%", level: 3 },
    ];

    const highlights = getDashboardHighlights(indicators);

    expect(highlights.best.map((item) => item.id)).toEqual(["b", "d", "f"]);
    expect(highlights.worst.map((item) => item.id)).toEqual(["c", "e", "g"]);
  });

  it("ignores indicators without a valid maturity level", () => {
    const indicators = [
      { id: "valid", label: "Válido", value: 0, level: 7 },
      { id: "missing", label: "Sem nível", value: "50%", level: null },
      { id: "outside", label: "Fora da escala", value: "90%", level: 8 },
    ];

    const highlights = getDashboardHighlights(indicators);

    expect(highlights.best).toEqual([
      expect.objectContaining({ id: "valid", value: 0, level: 7 }),
    ]);
    expect(highlights.worst).toEqual([]);
  });

  it("excludes unanswered form indicators from the worst ranking", () => {
    const indicators = [
      { id: "best-1", value: "90%", level: 7 },
      { id: "best-2", value: "80%", level: 6 },
      { id: "best-3", value: "70%", level: 5 },
      { id: "unanswered", value: "Sem resposta do formulário", level: 1 },
      { id: "worst-1", value: "10%", level: 1 },
      { id: "worst-2", value: "20%", level: 2 },
      { id: "worst-3", value: "30%", level: 3 },
    ];

    const highlights = getDashboardHighlights(indicators);

    expect(highlights.worst.map((item) => item.id)).toEqual([
      "worst-1",
      "worst-2",
      "worst-3",
    ]);
    expect(highlights.worst.map((item) => item.id)).not.toContain("unanswered");
  });
});

describe("hasUnansweredFormIndicators", () => {
  const textualValueIndicatorIds = [
    3049, 3076, 4012, 4006, 3123, 4040, 3006, 3125, 4004, 3048,
    3042, 4014, 3056, 3113, 3043, 3069, 6003, 6005, 6006, 6021,
    6024, 6048, 6009, 6054, 6035, 6002, 6011, 6017, 6019,
  ];

  const buildIndicators = (value = "Sem resposta do formulário") =>
    Object.fromEntries(
      textualValueIndicatorIds.map((indicatorId) => [
        indicatorId,
        {
          indicador_id: indicatorId,
          indicador_valor_textual: value,
        },
      ])
    );

  it("identifies an unanswered form when all textual-value indicators are unanswered", () => {
    expect(hasUnansweredFormIndicators(buildIndicators())).toBe(true);
  });

  it("does not identify an unanswered form when one indicator has an answer", () => {
    const indicators = buildIndicators();
    indicators[3049].indicador_valor_textual = "Sim";

    expect(hasUnansweredFormIndicators(indicators)).toBe(false);
  });

  it("does not identify an unanswered form when one indicator is missing", () => {
    const indicators = buildIndicators();
    delete indicators[3049];

    expect(hasUnansweredFormIndicators(indicators)).toBe(false);
  });
});

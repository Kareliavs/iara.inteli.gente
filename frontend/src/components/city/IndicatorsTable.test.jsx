import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/lib/i18n";
import IndicatorsTable, { calculateTopicScore } from "./IndicatorsTable";

const indicators = [
  {
    id: "3117",
    topic: "Agua e Esgoto",
    label: "Atendimento com rede de água",
    value: "98,08%",
    level: 6,
  },
  {
    id: "3021",
    topic: "Infraestrutura de conectividade",
    label: "Acesso à banda larga",
    value: "82,50%",
    level: 5,
  },
];

const renderTable = () =>
  render(
    <I18nProvider>
      <IndicatorsTable
        indicators={indicators}
        dimensionTitle="Econômica"
        tableOnly
      />
    </I18nProvider>
  );

describe("IndicatorsTable topic navigation", () => {
  it("shows one topic at a time and identifies the selected navigation item", () => {
    renderTable();

    const waterButton = screen.getByRole("button", { name: /Água e Esgoto/i });
    const connectivityButton = screen.getByRole("button", {
      name: /Infraestrutura de Conectividade/i,
    });

    expect(waterButton).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("region", { name: /Água e Esgoto/i })
    ).toBeInTheDocument();

    fireEvent.click(connectivityButton);

    expect(connectivityButton).toHaveAttribute("aria-current", "true");
    expect(waterButton).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("region", { name: /Infraestrutura de Conectividade/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /Água e Esgoto/i })
    ).not.toBeInTheDocument();
  });

  it("keeps the compact selector synchronized with the selected topic", () => {
    renderTable();

    const selector = screen.getByLabelText("Seção da dimensão");
    const connectivityOption = screen.getByRole("option", {
      name: /Infraestrutura de Conectividade/i,
    });

    fireEvent.change(selector, { target: { value: connectivityOption.value } });

    expect(selector).toHaveValue(connectivityOption.value);
    expect(
      screen.getByRole("region", { name: /Infraestrutura de Conectividade/i })
    ).toBeInTheDocument();
  });
});

describe("IndicatorsTable compact dashboard", () => {
  it("renders compact best and worst lists and shortens unavailable values", () => {
    const bestIndicators = [
      { id: "best-1", title: "Melhor indicador 1", topic: "Água", value: "100%", level: 7 },
      { id: "best-2", title: "Melhor indicador 2", topic: "Água", value: "98%", level: 6 },
      { id: "best-3", title: "Melhor indicador 3", topic: "Água", value: "95%", level: 6 },
    ];
    const worstIndicators = [
      {
        id: "worst-1",
        title: "Pior indicador 1",
        topic: "Transporte",
        value: "Sem resposta do formulário",
        level: 1,
      },
      { id: "worst-2", title: "Pior indicador 2", topic: "Transporte", value: "10%", level: 2 },
      { id: "worst-3", title: "Pior indicador 3", topic: "Transporte", value: "20%", level: 2 },
    ];

    render(
      <I18nProvider>
        <IndicatorsTable
          indicators={[...bestIndicators, ...worstIndicators]}
          bestIndicators={bestIndicators}
          worstIndicators={worstIndicators}
          comparisonItems={[
            { city: "São Carlos", score: 66, isCurrent: true },
            { city: "Araraquara", score: 67, isCurrent: false },
            { city: "Marília", score: 59, isCurrent: false },
          ]}
        />
      </I18nProvider>
    );

    expect(screen.getByRole("heading", { name: "Melhores indicadores" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Piores indicadores" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Desempenho dos tópicos" })).toBeInTheDocument();
    expect(screen.queryByText("Escala 1–7")).not.toBeInTheDocument();
    expect(screen.getByText("Sem resposta")).toBeInTheDocument();
    expect(screen.queryByText("Sem resposta do formulário")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("1º lugar")).toHaveLength(2);

    expect(screen.queryByRole("region", { name: "Resumo comparativo" })).not.toBeInTheDocument();
  });
});

describe("calculateTopicScore", () => {
  it("calculates the weighted average on the 1 to 7 maturity scale", () => {
    const score = calculateTopicScore(
      [
        { id: "high", level: 7 },
        { id: "low", level: 1 },
        { id: "invalid", level: null },
      ],
      { high: 3, low: 1, invalid: 10 }
    );

    expect(score).toBe(5.5);
  });
});

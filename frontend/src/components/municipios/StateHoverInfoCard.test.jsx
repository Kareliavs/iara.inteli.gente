import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/lib/i18n";
import StateHoverInfoCard from "./StateHoverInfoCard";

const municipios = [
  {
    municipio_cod_ibge: 1,
    estado_sigla: "SP",
    municipio_regiao: "Sudeste",
    formulario_nao_respondido: true,
  },
  {
    municipio_cod_ibge: 2,
    estado_sigla: "SP",
    municipio_regiao: "Sudeste",
    formulario_nao_respondido: false,
  },
  {
    municipio_cod_ibge: 3,
    estado_sigla: "MG",
    municipio_regiao: "Sudeste",
    formulario_nao_respondido: true,
  },
  {
    municipio_cod_ibge: 4,
    estado_sigla: "PR",
    municipio_regiao: "Sul",
    formulario_nao_respondido: true,
  },
];

const renderCard = ({
  selectedState = "",
  selectedRegion = "",
  municipioInfo = null,
} = {}) =>
  render(
    <I18nProvider>
      <StateHoverInfoCard
        stateInfo={null}
        municipioInfo={municipioInfo}
        municipiosData={municipios}
        selectedRegion={selectedRegion}
        selectedState={selectedState}
        selectedInfluence=""
      />
    </I18nProvider>
  );

const getAnsweredFormsValue = () =>
  screen.getByText("Formul\u00e1rios respondidos").parentElement.textContent;

describe("StateHoverInfoCard answered forms summary", () => {
  it("counts all answered municipalities on the Brazil map", () => {
    renderCard();

    expect(getAnsweredFormsValue()).toContain("1");
  });

  it("counts only answered municipalities from the selected state", () => {
    renderCard({ selectedState: "SP" });

    expect(getAnsweredFormsValue()).toContain("1");
  });

  it("counts only answered municipalities from the selected region", () => {
    renderCard({ selectedRegion: "Sudeste" });

    expect(getAnsweredFormsValue()).toContain("1");
  });

  it("keeps the answered forms row when hovering an answered municipality", () => {
    renderCard({
      municipioInfo: {
        municipio_cod_ibge: 2,
        municipio_nome: "Município respondente",
        estado_sigla: "SP",
        municipio_regiao: "Sudeste",
      },
    });

    expect(getAnsweredFormsValue()).toContain("1");
  });
});

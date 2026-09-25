import { describe, expect, it } from "vitest";
import { getRespondedMunicipios } from "./CitySearch";

describe("getRespondedMunicipios", () => {
  it("mantém somente municípios com formulário respondido", () => {
    const municipios = [
      { municipio_cod_ibge: 1, formulario_nao_respondido: false },
      { municipio_cod_ibge: 2, formulario_nao_respondido: true },
      { municipio_cod_ibge: 3 },
    ];

    expect(getRespondedMunicipios(municipios)).toEqual([municipios[0]]);
  });

  it("aceita valores ausentes ou inválidos", () => {
    expect(getRespondedMunicipios()).toEqual([]);
    expect(getRespondedMunicipios(null)).toEqual([]);
  });
});

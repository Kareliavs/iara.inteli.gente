import { useEffect, useMemo, useState } from "react";
import InputSearchCity from "@/components/municipios/InputSearchCity";
import SearchFilters from "@/components/municipios/SearchFilters";
import StateHoverInfoCard from "@/components/municipios/StateHoverInfoCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrazilMap from "../components/municipios/BrazilMap";

const stateNames = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const MUNICIPIOS_CACHE_KEY = "inteligente:municipios:v5";
const MUNICIPIOS_CACHE_TTL_MS = 30 * 60 * 1000;
const CITY_SCOPE_ALL = "todos";
const CITY_SCOPE_RESPONDED = "respondentes";

export const getRespondedMunicipios = (municipios) =>
  (Array.isArray(municipios) ? municipios : []).filter(
    (item) => item?.formulario_nao_respondido === false
  );

const hasValidMunicipioLevels = (items) =>
  Array.isArray(items) &&
  items.some((item) => {
    const level = Number(item?.municipio_nivel);
    return Number.isFinite(level) && level >= 1 && level <= 7;
  });

const readCachedMunicipios = () => {
  if (typeof window === "undefined") return [];

  try {
    const cached = window.sessionStorage.getItem(MUNICIPIOS_CACHE_KEY);
    if (!cached) return [];

    const parsed = JSON.parse(cached);
    if (
      !Array.isArray(parsed?.data) ||
      !Number.isFinite(parsed?.savedAt) ||
      Date.now() - parsed.savedAt > MUNICIPIOS_CACHE_TTL_MS
    ) {
      return [];
    }

    if (!hasValidMunicipioLevels(parsed.data)) {
      return [];
    }

    return parsed.data;
  } catch {
    return [];
  }
};

const writeCachedMunicipios = (data) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      MUNICIPIOS_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
  } catch {
    // O cache do navegador e apenas uma otimizacao.
  }
};

const buildFilterOptions = (municipios) => {
  const uniqueInfluences = new Map();
  const uniqueRegions = new Set();
  const list = Array.isArray(municipios) ? municipios : [];

  list.forEach((item) => {
    const influenceLabel = String(item?.rede_influencia || "").trim();
    const influenceLevel = Number(item?.rede_influencia_nivel);
    const regionLabel = String(item?.municipio_regiao || "").trim();

    if (influenceLabel) {
      uniqueInfluences.set(
        influenceLabel,
        Number.isFinite(influenceLevel) ? influenceLevel : 99
      );
    }

    if (regionLabel) {
      uniqueRegions.add(regionLabel);
    }
  });

  return {
    influenceOptions: Array.from(uniqueInfluences.entries())
      .sort(([labelA, levelA], [labelB, levelB]) =>
        levelA === levelB
          ? labelA.localeCompare(labelB, "pt-BR")
          : levelA - levelB
      )
      .map(([label]) => ({ label, value: label })),
    regionOptions: Array.from(uniqueRegions)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((label) => ({ label, value: label })),
  };
};

const CitySearch = () => {
  const [cityScope, setCityScope] = useState(CITY_SCOPE_ALL);
  const [selectedState, setSelectedState] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedInfluence, setSelectedInfluence] = useState("");
  const [hoveredStateInfo, setHoveredStateInfo] = useState(null);
  const [hoveredMunicipioInfo, setHoveredMunicipioInfo] = useState(null);
  const [municipiosData, setMunicipiosData] = useState(readCachedMunicipios);
  const [municipiosLoading, setMunicipiosLoading] = useState(
    () => !hasValidMunicipioLevels(readCachedMunicipios())
  );
  const respondedMunicipiosData = useMemo(
    () => getRespondedMunicipios(municipiosData),
    [municipiosData]
  );
  const visibleMunicipiosData =
    cityScope === CITY_SCOPE_RESPONDED
      ? respondedMunicipiosData
      : municipiosData;
  const { regionOptions, influenceOptions } = useMemo(
    () => buildFilterOptions(visibleMunicipiosData),
    [visibleMunicipiosData]
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/municipios?calc=latest-levels-v5", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nao foi possivel carregar redes de influencia.");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];

        setMunicipiosData(list);
        setMunicipiosLoading(false);
        if (hasValidMunicipioLevels(list)) {
          writeCachedMunicipios(list);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setMunicipiosLoading(false);
        console.error("Erro ao carregar redes de influencia:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const baseMapTitle = selectedInfluence
    ? `Rede de influência - ${selectedInfluence}`
    : selectedState
    ? `Estado - ${stateNames[selectedState] || selectedState}`
    : selectedRegion
    ? `Região - ${selectedRegion}`
    : "Brasil";
  const mapTitle =
    cityScope === CITY_SCOPE_RESPONDED
      ? `${baseMapTitle} — municípios respondentes`
      : baseMapTitle;

  const handleCityScopeChange = (value) => {
    setCityScope(value);
    setSelectedState("");
    setSelectedRegion("");
    setSelectedInfluence("");
    setHoveredStateInfo(null);
    setHoveredMunicipioInfo(null);
  };

  const handleStateChange = (value) => {
    setSelectedState(value);
    setSelectedRegion("");
    setHoveredStateInfo(null);
    setHoveredMunicipioInfo(null);
  };

  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    setSelectedState("");
    setHoveredStateInfo(null);
    setHoveredMunicipioInfo(null);
  };

  const handleInfluenceChange = (value) => {
    setSelectedInfluence(value);
    setHoveredMunicipioInfo(null);
  };

  return (
    <div>
      <div className="city-search-hero-gradient text-hero-foreground py-14 md:py-[4.5rem] lg:py-28">
        <div className="container">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-start">
              <h1
                className="mb-4 max-w-[720px] text-3xl font-bold md:text-4xl lg:text-[44px]"
                style={{ lineHeight: 1.05 }}
              >
                Conheça o nível de maturidade da sua cidade
              </h1>

              <p className="mb-2 max-w-[720px] text-base font-medium italic text-hero-foreground/90 md:text-lg">
                Tecnologia de ponta com olhar granular para
                quem decide o amanhã
              </p>

              <div className="mt-2">
                <InputSearchCity
                  joined
                  availableMunicipios={visibleMunicipiosData}
                />
                <SearchFilters
                  joined
                  selectedState={selectedState}
                  selectedRegion={selectedRegion}
                  selectedInfluence={selectedInfluence}
                  onStateChange={handleStateChange}
                  onRegionChange={handleRegionChange}
                  onInfluenceChange={handleInfluenceChange}
                  regionOptions={regionOptions}
                  influenceOptions={influenceOptions}
                />
                <StateHoverInfoCard
                  stateInfo={hoveredStateInfo}
                  municipioInfo={hoveredMunicipioInfo}
                  municipiosData={visibleMunicipiosData}
                  loading={municipiosLoading}
                  selectedRegion={selectedRegion}
                  selectedState={selectedState}
                  selectedInfluence={selectedInfluence}
                />
              </div>
            </div>

            <div className="flex min-h-[600px] flex-col rounded-xl bg-background p-6 lg:min-h-[620px] lg:p-8">
              <div className="mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-brand-cyan">
                    Mapa selecionado
                  </p>

                  <Tabs
                    value={cityScope}
                    onValueChange={handleCityScopeChange}
                    className="shrink-0"
                  >
                    <TabsList
                      aria-label="Escopo dos municípios exibidos no mapa"
                      className="h-8 w-auto justify-start gap-0.5 rounded-lg bg-muted/50 p-1"
                    >
                      <TabsTrigger
                        value={CITY_SCOPE_ALL}
                        className="h-6 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan data-[state=active]:shadow-none"
                      >
                        Todos
                      </TabsTrigger>
                      <TabsTrigger
                        value={CITY_SCOPE_RESPONDED}
                        className="h-6 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan data-[state=active]:shadow-none"
                      >
                        Respondentes
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <h2 className="mt-2 text-2xl font-bold text-foreground">
                  {mapTitle}
                </h2>
              </div>

              <div className="min-h-[520px] flex-1">
                <BrazilMap
                  key={cityScope}
                  selectedState={selectedState}
                  selectedRegion={selectedRegion}
                  selectedInfluence={selectedInfluence}
                  municipiosData={visibleMunicipiosData}
                  referenceMunicipiosData={municipiosData}
                  restrictToProvidedMunicipios={
                    cityScope === CITY_SCOPE_RESPONDED
                  }
                  showMunicipalitiesForGeographicFilter={
                    cityScope === CITY_SCOPE_RESPONDED
                  }
                  highlightProvidedMunicipios={
                    cityScope === CITY_SCOPE_RESPONDED
                  }
                  onHoverStateChange={setHoveredStateInfo}
                  onHoverMunicipioChange={setHoveredMunicipioInfo}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitySearch;

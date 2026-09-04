import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { geoMercator, geoCentroid, geoPath } from "d3-geo";
import { Info } from "lucide-react";

const WIDTH = 800;
const HEIGHT = 520;
const MAP_ZOOM_FACTOR = 1.50;
const MIN_INTERACTIVE_ZOOM = 1;
const MAX_INTERACTIVE_ZOOM = 4;
const INTERACTIVE_ZOOM_STEP = 0.5;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getPanBounds = (zoom, contentBounds) => {
  if (!contentBounds) {
    return {
      minX: -(WIDTH * (zoom - 1)) / 2,
      maxX: (WIDTH * (zoom - 1)) / 2,
      minY: -(HEIGHT * (zoom - 1)) / 2,
      maxY: (HEIGHT * (zoom - 1)) / 2,
    };
  }

  const [[x0, y0], [x1, y1]] = contentBounds;
  const left = WIDTH / 2 + zoom * (x0 - WIDTH / 2);
  const right = WIDTH / 2 + zoom * (x1 - WIDTH / 2);
  const top = HEIGHT / 2 + zoom * (y0 - HEIGHT / 2);
  const bottom = HEIGHT / 2 + zoom * (y1 - HEIGHT / 2);

  return {
    minX: Math.min(0, WIDTH - right),
    maxX: Math.max(0, -left),
    minY: Math.min(0, HEIGHT - bottom),
    maxY: Math.max(0, -top),
  };
};

const clampPan = (pan, zoom, contentBounds) => {
  const bounds = getPanBounds(zoom, contentBounds);

  return {
    x: clamp(pan.x, bounds.minX, bounds.maxX),
    y: clamp(pan.y, bounds.minY, bounds.maxY),
  };
};

const maturityColors = {
  1: "#A50003",
  2: "#E33A23",
  3: "#E17304",
  4: "#3F8ED1",
  5: "#1F4E9B",
  6: "#419B01",
  7: "#395427",
};

const maturityLegendLabels = {
  1: "Funda\u00e7\u00e3o",
  2: "Engajamento",
  3: "N\u00edvel 1",
  4: "N\u00edvel 2",
  5: "N\u00edvel 3",
  6: "N\u00edvel 4",
  7: "N\u00edvel 5",
};

const maturityLabels = {
  1: "Adesao",
  2: "Engajamento",
  3: "Planejamento",
  4: "Alinhamento",
  5: "Desenvolvimento",
  6: "Integracao",
  7: "Otimizacao",
};

const stateCapitals = {
  AC: "Rio Branco",
  AL: "Maceió",
  AP: "Macapá",
  AM: "Manaus",
  BA: "Salvador",
  CE: "Fortaleza",
  DF: "Brasília",
  ES: "Vitória",
  GO: "Goiânia",
  MA: "São Luís",
  MT: "Cuiabá",
  MS: "Campo Grande",
  MG: "Belo Horizonte",
  PA: "Belém",
  PB: "João Pessoa",
  PR: "Curitiba",
  PE: "Recife",
  PI: "Teresina",
  RJ: "Rio de Janeiro",
  RN: "Natal",
  RS: "Porto Alegre",
  RO: "Porto Velho",
  RR: "Boa Vista",
  SC: "Florianópolis",
  SP: "São Paulo",
  SE: "Aracaju",
  TO: "Palmas",
};

const stateLevels = {
  AC: "Nível 4 — Alinhamento",
  AL: "Nível 4 — Alinhamento",
  AP: "Nível 4 — Alinhamento",
  AM: "Nível 4 — Alinhamento",
  BA: "Nível 4 — Alinhamento",
  CE: "Nível 4 — Alinhamento",
  DF: "Nível 4 — Alinhamento",
  ES: "Nível 4 — Alinhamento",
  GO: "Nível 4 — Alinhamento",
  MA: "Nível 4 — Alinhamento",
  MT: "Nível 4 — Alinhamento",
  MS: "Nível 4 — Alinhamento",
  MG: "Nível 4 — Alinhamento",
  PA: "Nível 4 — Alinhamento",
  PB: "Nível 4 — Alinhamento",
  PR: "Nível 4 — Alinhamento",
  PE: "Nível 4 — Alinhamento",
  PI: "Nível 4 — Alinhamento",
  RJ: "Nível 4 — Alinhamento",
  RN: "Nível 4 — Alinhamento",
  RS: "Nível 4 — Alinhamento",
  RO: "Nível 4 — Alinhamento",
  RR: "Nível 4 — Alinhamento",
  SC: "Nível 4 — Alinhamento",
  SP: "Nível 4 — Alinhamento",
  SE: "Nível 4 — Alinhamento",
  TO: "Nível 4 — Alinhamento",
};

const BrazilMap = ({
  selectedState,
  selectedRegion,
  selectedInfluence,
  municipiosData = [],
  onHoverStateChange,
  onHoverMunicipioChange,
  onSelectCity,
}) => {
  const [municipiosGeo, setMunicipiosGeo] = useState(null);
  const [estadosGeo, setEstadosGeo] = useState(null);
  const [municipiosDb, setMunicipiosDb] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedMaturityLevel, setSelectedMaturityLevel] = useState(null);
  const [maturityFocusedState, setMaturityFocusedState] = useState(null);
  const [interactiveZoom, setInteractiveZoom] = useState(MIN_INTERACTIVE_ZOOM);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [error, setError] = useState("");
  const dragStateRef = useRef(null);
  const hasDraggedMapRef = useRef(false);

  useEffect(() => {
    return () => {
      onHoverStateChange?.(null);
      onHoverMunicipioChange?.(null);
    };
  }, [onHoverStateChange, onHoverMunicipioChange]);

  useEffect(() => {
    onHoverMunicipioChange?.(null);
  }, [selectedState, selectedRegion, selectedInfluence, onHoverMunicipioChange]);

  useEffect(() => {
    setMaturityFocusedState(null);
  }, [selectedState, selectedRegion, selectedInfluence]);

  useEffect(() => {
    setInteractiveZoom(MIN_INTERACTIVE_ZOOM);
    setMapPan({ x: 0, y: 0 });
    setIsDraggingMap(false);
    dragStateRef.current = null;
  }, [
    selectedState,
    selectedRegion,
    selectedInfluence,
    selectedMaturityLevel,
    maturityFocusedState,
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/geo/brasil-municipios.geojson").then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar GeoJSON de municípios");
        return res.json();
      }),
      fetch("/geo/brasil-estados.geojson").then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar GeoJSON de estados");
        return res.json();
      }),
    ])
      .then(([municipiosGeoData, estadosData]) => {
        if (typeof window !== "undefined") {
          window.__INTELIGENTE_MUNICIPIOS_GEO = municipiosGeoData;
        }
        setMunicipiosGeo(municipiosGeoData);
        setEstadosGeo(estadosData);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar o mapa.");
      });
  }, []);

  useEffect(() => {
    setMunicipiosDb(Array.isArray(municipiosData) ? municipiosData : []);
  }, [municipiosData]);

  const municipiosByCode = useMemo(() => {
    const map = new Map();
    municipiosDb.forEach((item) => {
      map.set(String(item.municipio_cod_ibge), item);
    });
    return map;
  }, [municipiosDb]);

  const hasState = Boolean(selectedState);
  const hasRegion = Boolean(selectedRegion) && !hasState;
  const hasInfluence = Boolean(selectedInfluence);
  const showMunicipiosInfluenceMap = hasInfluence;
  const showMunicipiosMaturityMap = selectedMaturityLevel != null;
  const showMaturityStateDetail =
    showMunicipiosMaturityMap && maturityFocusedState != null;
  const showMaturityMunicipiosMap =
    showMunicipiosMaturityMap &&
    (maturityFocusedState != null || hasState || hasRegion);
  const showRegionalStateMap =
    !showMaturityMunicipiosMap &&
    (showMunicipiosMaturityMap || !showMunicipiosInfluenceMap);

  const baseMunicipiosGeo = useMemo(() => {
    if (!municipiosGeo) return null;
    if (!hasState && !hasRegion) return municipiosGeo;

    return {
      ...municipiosGeo,
      features: municipiosGeo.features.filter((feature) => {
        const cityId = String(feature.properties.id || "");
        const municipio = municipiosByCode.get(cityId);

        if (!municipio) return false;

        const matchesState =
          !hasState || municipio.estado_sigla === selectedState;
        const matchesRegion =
          !hasRegion || municipio.municipio_regiao === selectedRegion;

        return matchesState && matchesRegion;
      }),
    };
  }, [
    municipiosGeo,
    hasState,
    hasRegion,
    selectedState,
    selectedRegion,
    municipiosByCode,
  ]);

  const highlightedMunicipioIds = useMemo(() => {
    if (!hasInfluence || !baseMunicipiosGeo) return new Set();

    const ids = new Set();

    baseMunicipiosGeo.features.forEach((feature) => {
      const cityId = String(feature.properties.id || "");
      const municipio = municipiosByCode.get(cityId);

      if (municipio?.rede_influencia === selectedInfluence) {
        ids.add(cityId);
      }
    });

    return ids;
  }, [hasInfluence, selectedInfluence, baseMunicipiosGeo, municipiosByCode]);

  const allowedUfByCurrentMunicipioFilter = useMemo(() => {
    if (!baseMunicipiosGeo) return null;

    const allowedUf = new Set();
    baseMunicipiosGeo.features.forEach((feature) => {
      const cityId = String(feature.properties.id || "");
      const municipio = municipiosByCode.get(cityId);
      if (municipio?.estado_sigla) {
        allowedUf.add(municipio.estado_sigla);
      }
    });

    return allowedUf;
  }, [baseMunicipiosGeo, municipiosByCode]);

  const statesWithSelectedMaturityLevel = useMemo(() => {
    if (selectedMaturityLevel == null) return null;

    const matchingStates = new Set();

    municipiosDb.forEach((municipio) => {
      const maturityLevel = Number(municipio?.municipio_nivel);
      const matchesLevel = maturityLevel === selectedMaturityLevel;
      const matchesState =
        !hasState || municipio?.estado_sigla === selectedState;
      const matchesRegion =
        !hasRegion || municipio?.municipio_regiao === selectedRegion;
      const matchesInfluence =
        !hasInfluence || municipio?.rede_influencia === selectedInfluence;

      if (
        matchesLevel &&
        matchesState &&
        matchesRegion &&
        matchesInfluence &&
        municipio?.estado_sigla
      ) {
        matchingStates.add(municipio.estado_sigla);
      }
    });

    return matchingStates;
  }, [
    selectedMaturityLevel,
    municipiosDb,
    hasState,
    selectedState,
    hasRegion,
    selectedRegion,
    hasInfluence,
    selectedInfluence,
  ]);

  const displayedMunicipiosGeo = useMemo(() => {
    if (!baseMunicipiosGeo || !maturityFocusedState) {
      return baseMunicipiosGeo;
    }

    return {
      ...baseMunicipiosGeo,
      features: baseMunicipiosGeo.features.filter((feature) => {
        const cityId = String(feature.properties.id || "");
        const municipio = municipiosByCode.get(cityId);
        return municipio?.estado_sigla === maturityFocusedState;
      }),
    };
  }, [baseMunicipiosGeo, maturityFocusedState, municipiosByCode]);

  const estadosWithRegion = useMemo(() => {
    if (!estadosGeo || !municipiosDb.length) return null;

    const infoByUf = {};

    municipiosDb.forEach((item) => {
      const uf = item.estado_sigla;

      if (!infoByUf[uf]) {
        infoByUf[uf] = {
          estadoNome: item.estado_nome,
          region: item.municipio_regiao,
          municipiosCount: 0,
          maturitySum: 0,
          maturityCount: 0,
        };
      }

      infoByUf[uf].municipiosCount += 1;

      const municipioNivel = Number(item.municipio_nivel);
      if (Number.isFinite(municipioNivel) && municipioNivel >= 1 && municipioNivel <= 7) {
        infoByUf[uf].maturitySum += municipioNivel;
        infoByUf[uf].maturityCount += 1;
      }
    });

    return {
      ...estadosGeo,
      features: estadosGeo.features.map((feature) => {
        const sigla =
          feature.properties.SIGLA ||
          feature.properties.sigla ||
          feature.properties.UF ||
          feature.properties.uf ||
          "";
        const maturityCount = infoByUf[sigla]?.maturityCount || 0;
        const maturityAverage = maturityCount
          ? infoByUf[sigla].maturitySum / maturityCount
          : null;
        const maturityLevel = maturityAverage == null
          ? null
          : Math.max(1, Math.min(7, Math.round(maturityAverage)));

        return {
          ...feature,
          properties: {
            ...feature.properties,
            estadoNome:
              infoByUf[sigla]?.estadoNome ||
              feature.properties.Estado ||
              feature.properties.estado ||
              "",
            region: infoByUf[sigla]?.region || "",
            municipiosCount: infoByUf[sigla]?.municipiosCount || 0,
            maturityAverage,
            maturityLevel,
            maturityCount,
            capital: stateCapitals[sigla] || "",
          },
        };
      }),
    };
  }, [estadosGeo, municipiosDb]);

  const filteredEstadosGeo = useMemo(() => {
    if (!estadosWithRegion) return null;
    if (!hasRegion && !hasState && !hasInfluence) return estadosWithRegion;

    return {
      ...estadosWithRegion,
      features: estadosWithRegion.features.filter((feature) => {
        const sigla =
          feature.properties.SIGLA ||
          feature.properties.sigla ||
          feature.properties.UF ||
          feature.properties.uf ||
          "";
        const matchesRegion =
          !hasRegion || feature.properties.region === selectedRegion;
        const matchesState = !hasState || sigla === selectedState;
        const matchesInfluence =
          !hasInfluence || (allowedUfByCurrentMunicipioFilter?.has(sigla) ?? false);

        return matchesRegion && matchesState && matchesInfluence;
      }),
    };
  }, [
    estadosWithRegion,
    hasRegion,
    selectedRegion,
    hasState,
    selectedState,
    hasInfluence,
    allowedUfByCurrentMunicipioFilter,
  ]);

  const stateLabels = useMemo(() => {
    if (!filteredEstadosGeo) return [];

    return filteredEstadosGeo.features.map((feature) => {
      const sigla =
        feature.properties.SIGLA ||
        feature.properties.sigla ||
        feature.properties.UF ||
        feature.properties.uf ||
        "";

      let coordinates =
        feature.properties.centroid ||
        feature.properties.labelCentroid ||
        feature.properties.CENTER ||
        null;

      if (!coordinates) {
        try {
          coordinates = geoCentroid(feature);
        } catch {
          coordinates = null;
        }
      }

      return {
        sigla,
        coordinates,
        label: hasState ? feature.properties.estadoNome || sigla : sigla,
      };
    });
  }, [filteredEstadosGeo, hasState]);

  const stateMaturityLevels = useMemo(() => {
    const levels = {};
    if (!estadosWithRegion) return levels;

    estadosWithRegion.features.forEach((feature) => {
      const sigla =
        feature.properties.SIGLA ||
        feature.properties.sigla ||
        feature.properties.UF ||
        feature.properties.uf ||
        "";

      if (sigla && feature.properties.maturityLevel != null) {
        levels[sigla] = feature.properties.maturityLevel;
      }
    });

    return levels;
  }, [estadosWithRegion]);

  const buildStateInfo = (feature) => {
    if (!feature) return null;

    const sigla =
      feature.properties.SIGLA ||
      feature.properties.sigla ||
      feature.properties.UF ||
      feature.properties.uf ||
      "";
    const estadoNome = feature.properties.estadoNome || "";
    const region = feature.properties.region || "";
    const municipiosCount = feature.properties.municipiosCount || 0;
    const capital = feature.properties.capital || "";
    const maturityAverage = feature.properties.maturityAverage ?? null;
    const maturityLevel = feature.properties.maturityLevel ?? null;
    const maturityLabel = maturityLevel == null ? "" : maturityLabels[maturityLevel] || stateLevels[sigla] || "";

    return {
      sigla,
      estadoNome,
      region,
      capital,
      municipiosCount,
      maturityAverage,
      maturityLevel,
      maturityCount: feature.properties.maturityCount || 0,
      averageLevel: maturityAverage == null ? null : Number(maturityAverage.toFixed(1)),
      averageLabel: maturityLabel,
      levelLabel: maturityLevel == null ? "" : `Nivel ${maturityLevel} - ${maturityLabel}`,
    };
  };

  useEffect(() => {
    if (!onHoverStateChange) return;

    if (hasState && filteredEstadosGeo?.features?.length) {
      const selectedStateInfo = buildStateInfo(filteredEstadosGeo.features[0]);
      setHoveredState(selectedStateInfo);
      onHoverStateChange(selectedStateInfo);
      return;
    }

    if (!hasState) {
      setHoveredState(null);
      onHoverStateChange(null);
    }
  }, [hasState, filteredEstadosGeo, onHoverStateChange]);

  const projection = useMemo(() => {
    const proj = geoMercator();

    const applyZoom = (projection) => {
      const [tx, ty] = projection.translate();
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;

      projection.scale(projection.scale() * MAP_ZOOM_FACTOR);
      projection.translate([
        cx + MAP_ZOOM_FACTOR * (tx - cx),
        cy + MAP_ZOOM_FACTOR * (ty - cy),
      ]);

      return projection;
    };

    if (showRegionalStateMap) {
      if (!filteredEstadosGeo || !filteredEstadosGeo.features.length) {
        return applyZoom(
          proj
          .center([-54, -15])
          .scale(950)
          .translate([WIDTH / 2, HEIGHT / 2])
        );
      }

      // Regiao ou estado filtrado nao devem receber zoom extra para evitar recorte.
      if (hasRegion || hasState) {
        return proj.fitExtent(
          [
            [24, 24],
            [WIDTH - 24, HEIGHT - 24],
          ],
          filteredEstadosGeo
        );
      }

      return applyZoom(
        proj.fitExtent(
          [
            [20, 20],
            [WIDTH - 20, HEIGHT - 40],
          ],
          filteredEstadosGeo
        )
      );
    }

    if (!displayedMunicipiosGeo || !displayedMunicipiosGeo.features.length) {
      return proj
        .center([-54, -15])
        .scale(950)
        .translate([WIDTH / 2, HEIGHT / 2]);
    }

    return proj.fitExtent(
      [
        [20, 20],
        [WIDTH - 20, HEIGHT - 20],
      ],
      displayedMunicipiosGeo
    );
  }, [
    showRegionalStateMap,
    filteredEstadosGeo,
    displayedMunicipiosGeo,
    hasRegion,
    hasState,
  ]);

  const activeMapGeo = showRegionalStateMap
    ? filteredEstadosGeo
    : displayedMunicipiosGeo;
  const contentBounds = useMemo(() => {
    if (!activeMapGeo) return null;

    try {
      return geoPath(projection).bounds(activeMapGeo);
    } catch {
      return null;
    }
  }, [activeMapGeo, projection]);

  const zoomTransform = useMemo(() => {
    return `translate(${WIDTH / 2 + mapPan.x} ${HEIGHT / 2 + mapPan.y}) scale(${interactiveZoom}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`;
  }, [interactiveZoom, mapPan]);

  const canZoomOut = interactiveZoom > MIN_INTERACTIVE_ZOOM;
  const canZoomIn = interactiveZoom < MAX_INTERACTIVE_ZOOM;
  const handleZoomIn = () => {
    setInteractiveZoom((currentZoom) => {
      const nextZoom = Math.min(
        MAX_INTERACTIVE_ZOOM,
        currentZoom + INTERACTIVE_ZOOM_STEP
      );
      setMapPan((currentPan) => clampPan(currentPan, nextZoom, contentBounds));
      return nextZoom;
    });
  };
  const handleZoomOut = () => {
    setInteractiveZoom((currentZoom) => {
      const nextZoom = Math.max(
        MIN_INTERACTIVE_ZOOM,
        currentZoom - INTERACTIVE_ZOOM_STEP
      );
      setMapPan((currentPan) => clampPan(currentPan, nextZoom, contentBounds));
      return nextZoom;
    });
  };

  const handleMapPointerDown = (event) => {
    if (interactiveZoom <= MIN_INTERACTIVE_ZOOM || event.button !== 0) return;
    if (event.target.closest?.("button")) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPan: mapPan,
      svgScaleX: WIDTH / bounds.width,
      svgScaleY: HEIGHT / bounds.height,
    };
    hasDraggedMapRef.current = false;
    setIsDraggingMap(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMapPointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = (event.clientX - dragState.startX) * dragState.svgScaleX;
    const deltaY = (event.clientY - dragState.startY) * dragState.svgScaleY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      hasDraggedMapRef.current = true;
    }

    setMapPan(
      clampPan(
        {
          x: dragState.startPan.x + deltaX,
          y: dragState.startPan.y + deltaY,
        },
        interactiveZoom,
        contentBounds
      )
    );
  };

  const finishMapDrag = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDraggingMap(false);
  };

  const handleMaturityLegendClick = (level) => {
    setSelectedMaturityLevel(
      selectedMaturityLevel === level ? null : level
    );
    setMaturityFocusedState(null);
    setHovered(null);
    setHoveredState(null);
    setSelectedCity(null);
    onHoverStateChange?.(null);
    onHoverMunicipioChange?.(null);
  };

  const handleMaturityStateClick = (stateInfo) => {
    if (!showMunicipiosMaturityMap || !stateInfo?.sigla) return;
    if (hasDraggedMapRef.current) {
      hasDraggedMapRef.current = false;
      return;
    }

    setMaturityFocusedState(stateInfo.sigla);
    setHoveredState(stateInfo);
    setSelectedCity(null);
    onHoverStateChange?.(stateInfo);
    onHoverMunicipioChange?.(null);
  };

  const handleMaturityStateBack = () => {
    setMaturityFocusedState(null);
    setHovered(null);
    setHoveredState(null);
    setSelectedCity(null);
    onHoverStateChange?.(null);
    onHoverMunicipioChange?.(null);
  };

  if (error) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-xl bg-white text-red-600">
        {error}
      </div>
    );
  }

  if (
    (showRegionalStateMap && !filteredEstadosGeo) ||
    (!showRegionalStateMap && !displayedMunicipiosGeo)
  ) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-xl bg-white text-muted-foreground">
        Carregando mapa...
      </div>
    );
  }

  return (
    <div
      className="relative h-full min-h-[520px] w-full overflow-hidden rounded-xl bg-white"
      onPointerDown={handleMapPointerDown}
      onPointerMove={handleMapPointerMove}
      onPointerUp={finishMapDrag}
      onPointerCancel={finishMapDrag}
      style={{
        cursor:
          interactiveZoom > MIN_INTERACTIVE_ZOOM
            ? isDraggingMap
              ? "grabbing"
              : "grab"
            : "default",
      }}
    >
      <ComposableMap
        width={WIDTH}
        height={HEIGHT}
        projection={projection}
        style={{ width: "100%", height: "100%" }}
      >
        <g transform={zoomTransform}>
        {showRegionalStateMap ? (
          <>
            <Geographies geography={filteredEstadosGeo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateInfo = buildStateInfo(geo);
                  const sigla = stateInfo?.sigla || "";
                  const maturityLevel = stateMaturityLevels[sigla];

                  if (
                    statesWithSelectedMaturityLevel &&
                    !statesWithSelectedMaturityLevel.has(sigla)
                  ) {
                    return null;
                  }

                  const fillColor = showMunicipiosMaturityMap
                    ? maturityColors[selectedMaturityLevel]
                    : maturityColors[maturityLevel] || "#D9E6F2";
                  const isHovered = hoveredState?.sigla === sigla;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      role={showMunicipiosMaturityMap ? "button" : undefined}
                      tabIndex={showMunicipiosMaturityMap ? 0 : undefined}
                      aria-label={
                        showMunicipiosMaturityMap
                          ? `Ver municípios de ${stateInfo?.estadoNome || sigla}`
                          : undefined
                      }
                      onMouseEnter={() => {
                        setHoveredState(stateInfo);
                        onHoverStateChange?.(stateInfo);
                      }}
                      onMouseLeave={() => {
                        if (hasState) return;
                        setHoveredState(null);
                        onHoverStateChange?.(null);
                      }}
                      onClick={() => handleMaturityStateClick(stateInfo)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleMaturityStateClick(stateInfo);
                        }
                      }}
                      style={{
                        default: {
                          fill: fillColor,
                          stroke: "#FFFFFF",
                          strokeWidth: isHovered ? 2 : 1.2,
                          outline: "none",
                          filter: isHovered
                            ? "brightness(0.9) saturate(1.05)"
                            : "none",
                        },
                        hover: {
                          fill: fillColor,
                          stroke: "#FFFFFF",
                          strokeWidth: 2,
                          outline: "none",
                          cursor: showMunicipiosMaturityMap
                            ? "pointer"
                            : "default",
                          filter: "brightness(0.9) saturate(1.05)",
                        },
                        pressed: {
                          fill: fillColor,
                          stroke: "#FFFFFF",
                          strokeWidth: 2,
                          outline: "none",
                          filter: "brightness(0.9) saturate(1.05)",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {stateLabels.map((item) => {
              if (!item.coordinates) return null;
              if (
                statesWithSelectedMaturityLevel &&
                !statesWithSelectedMaturityLevel.has(item.sigla)
              ) {
                return null;
              }

              return (
                <Marker key={`label-${item.sigla}`} coordinates={item.coordinates}>
                  <text
                    textAnchor="middle"
                    style={{
                      fontSize: hasState ? "18px" : "11px",
                      fill: "#FFFFFF",
                      fontWeight: 700,
                      pointerEvents: "none",
                    }}
                  >
                    {item.label}
                  </text>
                </Marker>
              );
            })}
          </>
        ) : (
          <Geographies geography={displayedMunicipiosGeo}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const cityId = String(geo.properties.id || "");
                const municipio = municipiosByCode.get(cityId);

                const cityName =
                  municipio?.municipio_nome ||
                  geo.properties.name ||
                  geo.properties.description ||
                  "Município";

                const stateSigla = municipio?.estado_sigla || "";
                const region = municipio?.municipio_regiao || "";
                const municipioInfo = {
                  municipio_cod_ibge: cityId,
                  municipio_nome: cityName,
                  estado_nome: municipio?.estado_nome || "",
                  estado_sigla: stateSigla,
                  municipio_regiao: region,
                  municipio_area: municipio?.municipio_area ?? null,
                  populacao_total: municipio?.populacao_total ?? null,
                  municipio_nivel: municipio?.municipio_nivel ?? null,
                  rede_influencia: municipio?.rede_influencia || null,
                  rede_influencia_nivel: municipio?.rede_influencia_nivel ?? null,
                };
                const isSelected = selectedCity === cityId;
                const isHighlightedByInfluence = !showMunicipiosInfluenceMap
                  ? true
                  : highlightedMunicipioIds.has(cityId);
                const municipioMaturityLevel = Number(municipio?.municipio_nivel);
                const hasMunicipioMaturityLevel =
                  Number.isFinite(municipioMaturityLevel) &&
                  municipioMaturityLevel >= 1 &&
                  municipioMaturityLevel <= 7;
                const isHighlightedByMaturity =
                  !showMaturityMunicipiosMap ||
                  (municipioMaturityLevel === selectedMaturityLevel &&
                    (!showMunicipiosInfluenceMap || isHighlightedByInfluence));

                const municipioMaturityColor = hasMunicipioMaturityLevel
                  ? maturityColors[municipioMaturityLevel]
                  : "#D7DEE9";

                const municipioFill = showMaturityMunicipiosMap
                  ? isHighlightedByMaturity
                    ? maturityColors[selectedMaturityLevel]
                    : "#D7DEE9"
                  : showMunicipiosInfluenceMap
                  ? isHighlightedByInfluence
                    ? municipioMaturityColor
                    : "#D7DEE9"
                  : "#3F8ED1";
                const selectedStroke =
                  isSelected &&
                  isHighlightedByInfluence &&
                  isHighlightedByMaturity
                  ? "#009A69"
                  : "#FFFFFF";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setHovered({
                        cityName,
                        stateSigla,
                        region,
                      });
                      onHoverMunicipioChange?.(municipioInfo);
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      onHoverMunicipioChange?.(null);
                    }}
                    onClick={() => {
                      if (hasDraggedMapRef.current) {
                        hasDraggedMapRef.current = false;
                        return;
                      }
                      if (
                        (showMunicipiosInfluenceMap && !isHighlightedByInfluence) ||
                        !isHighlightedByMaturity
                      ) {
                        return;
                      }
                      setSelectedCity(cityId);
                      onSelectCity?.(cityName, municipio || geo.properties);
                    }}
                    style={{
                      default: {
                        fill: municipioFill,
                        stroke: selectedStroke,
                        strokeWidth: isSelected ? 0.45 : 0.1,
                        outline: "none",
                      },
                      hover: {
                        fill: municipioFill,
                        stroke: selectedStroke,
                        strokeWidth: isSelected ? 0.55 : 0.15,
                        outline: "none",
                        cursor:
                          (showMunicipiosInfluenceMap && !isHighlightedByInfluence) ||
                          !isHighlightedByMaturity
                            ? "default"
                            : "pointer",
                        filter: "brightness(0.92)",
                      },
                      pressed: {
                        fill: municipioFill,
                        stroke: selectedStroke,
                        strokeWidth: isSelected ? 0.55 : 0.15,
                        outline: "none",
                        filter: "brightness(0.92)",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        )}
        </g>
      </ComposableMap>

      {showMaturityStateDetail && (
        <button
          type="button"
          onClick={handleMaturityStateBack}
          className="absolute left-4 top-4 z-20 rounded-md border border-border bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
        >
          ← Voltar
        </button>
      )}

      <div className="absolute right-4 top-4 z-20 flex flex-col overflow-hidden rounded-md border border-border bg-white/95 shadow">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center border-b border-border text-lg font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
        >
          +
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
        >
          -
        </button>
      </div>

      {!showRegionalStateMap && hovered && (
        <div
          className={`absolute left-4 rounded-md bg-black/75 px-3 py-1 text-sm text-white shadow ${
            showMaturityStateDetail ? "top-14" : "top-4"
          }`}
        >
          <div className="notranslate" translate="no" lang="pt-BR">
            {hovered.cityName}
          </div>
          {hovered.stateSigla && <div>UF: {hovered.stateSigla}</div>}
          {hovered.region && <div>Região: {hovered.region}</div>}
        </div>
      )}

      <div className="absolute bottom-1 left-1/2 z-20 w-[94%] max-w-[680px] -translate-x-1/2 rounded-lg border border-border bg-white/95 p-2.5 shadow">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 whitespace-nowrap">
            {Object.entries(maturityColors).map(([level, color]) => {
              const numericLevel = Number(level);
              const isSelected = selectedMaturityLevel === numericLevel;
              const label = maturityLegendLabels[level];

              return (
                <button
                  key={level}
                  type="button"
                  aria-label={`${label}: ${
                    isSelected ? "remover filtro" : "filtrar mapa"
                  }`}
                  aria-pressed={isSelected}
                  title={isSelected ? "Remover filtro" : `Filtrar por ${label}`}
                  onClick={() => handleMaturityLegendClick(numericLevel)}
                  className={`inline-flex min-w-0 items-center gap-1.5 rounded px-0.5 py-0.5 text-[10px] text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan ${
                    isSelected
                      ? "bg-muted font-semibold ring-1 ring-border"
                      : selectedMaturityLevel != null
                      ? "opacity-45 hover:opacity-100"
                      : "hover:bg-muted"
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="group relative shrink-0">
            <button
              type="button"
              aria-label="Como usar os filtros por nível"
              className="flex h-5 w-5 items-center justify-center rounded-full text-brand-cyan transition hover:bg-brand-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-56 whitespace-normal rounded-md bg-[#1f2d3d] px-3 py-2 text-left text-[11px] leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
            >
              Selecione um nível para filtrar o mapa. Clique novamente no
              nível selecionado para remover o filtro.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrazilMap;

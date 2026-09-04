import { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON, useMap, Marker } from "react-leaflet";
import L from "leaflet";

const maturityColors = {
  1: "#A50003",
  2: "#E33A23",
  3: "#E17304",
  4: "#3F8ED1",
  5: "#1F4E9B",
  6: "#419B01",
  7: "#395427",
};

const MUNICIPIOS_CACHE_KEY = "inteligente:municipios:v4";
const MUNICIPIOS_CACHE_TTL_MS = 30 * 60 * 1000;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

let municipiosPromise = null;
let municipiosCache = null;
let municipiosCacheSavedAt = 0;
let geoJsonPromise = null;
let geoJsonCache = null;

const getMunicipioMaturityColor = (municipio, fallback = "#D2DBE8") => {
  const level = Number(municipio?.municipio_nivel);

  if (!Number.isFinite(level) || level < 1 || level > 7) {
    return fallback;
  }

  return maturityColors[level] || fallback;
};

const hasValidMunicipioLevels = (items) =>
  Array.isArray(items) &&
  items.some((item) => {
    const level = Number(item?.municipio_nivel);
    return Number.isFinite(level) && level >= 1 && level <= 7;
  });

const readCachedMunicipios = () => {
  if (municipiosCache && Date.now() - municipiosCacheSavedAt < MUNICIPIOS_CACHE_TTL_MS) {
    return municipiosCache;
  }

  if (typeof window === "undefined") return [];

  try {
    const cached = window.sessionStorage.getItem(MUNICIPIOS_CACHE_KEY);
    if (!cached) return [];

    const parsed = JSON.parse(cached);
    if (
      !Array.isArray(parsed?.data) ||
      !Number.isFinite(parsed?.savedAt) ||
      Date.now() - parsed.savedAt > MUNICIPIOS_CACHE_TTL_MS ||
      !hasValidMunicipioLevels(parsed.data)
    ) {
      return [];
    }

    municipiosCache = parsed.data;
    municipiosCacheSavedAt = parsed.savedAt;
    return parsed.data;
  } catch {
    return [];
  }
};

const writeCachedMunicipios = (data) => {
  municipiosCache = data;
  municipiosCacheSavedAt = Date.now();

  if (typeof window === "undefined" || !hasValidMunicipioLevels(data)) return;

  try {
    window.sessionStorage.setItem(
      MUNICIPIOS_CACHE_KEY,
      JSON.stringify({
        savedAt: municipiosCacheSavedAt,
        data,
      })
    );
  } catch {
    // O cache do navegador e apenas uma otimizacao.
  }
};

const loadMunicipios = () => {
  const cached = readCachedMunicipios();
  if (cached.length) return Promise.resolve(cached);

  if (!municipiosPromise) {
    municipiosPromise = fetch("/api/municipios")
      .then((res) => {
        if (!res.ok) throw new Error("Nao foi possivel carregar os municipios.");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        writeCachedMunicipios(list);
        municipiosPromise = null;
        return list;
      })
      .catch((error) => {
        municipiosPromise = null;
        throw error;
      });
  }

  return municipiosPromise;
};

const loadMunicipiosGeoJson = () => {
  if (geoJsonCache) return Promise.resolve(geoJsonCache);

  if (typeof window !== "undefined" && window.__INTELIGENTE_MUNICIPIOS_GEO) {
    geoJsonCache = window.__INTELIGENTE_MUNICIPIOS_GEO;
    return Promise.resolve(geoJsonCache);
  }

  if (!geoJsonPromise) {
    geoJsonPromise = fetch("/geo/brasil-municipios.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Nao foi possivel carregar o GeoJSON.");
        return res.json();
      })
      .then((data) => {
        geoJsonCache = data;
        if (typeof window !== "undefined") {
          window.__INTELIGENTE_MUNICIPIOS_GEO = data;
        }
        geoJsonPromise = null;
        return data;
      })
      .catch((error) => {
        geoJsonPromise = null;
        throw error;
      });
  }

  return geoJsonPromise;
};

function FitBounds({ geoJsonData }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) return;

    try {
      const layer = L.geoJSON(geoJsonData);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        const padding = L.point(20, 20);
        const fittedZoom = map.getBoundsZoom(bounds, false, padding);
        const boundedArea = bounds.pad(0.15);

        map.fitBounds(bounds, {
          padding: [20, 20],
          animate: false,
        });

        // Limita o arraste para manter a geometria do estado sempre no enquadramento.
        map.setMaxBounds(boundedArea);

        // Mantem o enquadramento inicial como limite minimo de zoom out.
        map.setMinZoom(fittedZoom);
      }
    } catch (error) {
      console.error("Erro ao ajustar bounds do mapa:", error);
    }
  }, [geoJsonData, map]);

  return null;
}

const MunicipalityMap = ({ cityCode, stateSigla }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [municipiosDb, setMunicipiosDb] = useState(readCachedMunicipios);
  const [sameHierarchyMunicipioIds, setSameHierarchyMunicipioIds] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityCode || !stateSigla) {
      setGeoJsonData(null);
      setSameHierarchyMunicipioIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setGeoJsonData(null);

    Promise.all([loadMunicipiosGeoJson(), loadMunicipios()]) /*
      fetch("/geo/brasil-municipios.geojson").then((res) => {
        if (!res.ok) throw new Error("Não foi possível carregar o GeoJSON.");
        return res.json();
      }),
      fetch("/api/municipios", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Não foi possível carregar os municípios.");
        return res.json();
      }),
    */
      .then(([mapData, dbData]) => {
        setMunicipiosDb(dbData);

        const normalizeHierarchy = (value) =>
          String(value || "")
            .trim()
            .toLocaleLowerCase("pt-BR");

        const selectedMunicipio = dbData.find(
          (item) => String(item.municipio_cod_ibge) === String(cityCode)
        );
        const selectedHierarchyLevel = normalizeHierarchy(
          selectedMunicipio?.rede_influencia_nivel
        );

        const sameHierarchyIds = selectedHierarchyLevel
          ? dbData
              .filter((item) => item.estado_sigla === stateSigla)
              .filter(
                (item) =>
                  normalizeHierarchy(item.rede_influencia_nivel) === selectedHierarchyLevel
              )
              .map((item) => String(item.municipio_cod_ibge))
          : [];

        setSameHierarchyMunicipioIds(sameHierarchyIds);

        const codigosDoEstado = new Set(
          dbData
            .filter((item) => item.estado_sigla === stateSigla)
            .map((item) => String(item.municipio_cod_ibge))
        );

        const featuresDoEstado = mapData.features.filter((feature) =>
          codigosDoEstado.has(String(feature.properties.id))
        );

        if (!featuresDoEstado.length) {
          throw new Error("Nenhuma geometria encontrada para este estado.");
        }

        setGeoJsonData({
          type: "FeatureCollection",
          features: featuresDoEstado,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar o mapa do estado.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cityCode, stateSigla]);

  const municipiosByCode = useMemo(() => {
    const map = new Map();
    municipiosDb.forEach((item) => {
      map.set(String(item.municipio_cod_ibge), item);
    });
    return map;
  }, [municipiosDb]);

  const similarIdsSet = useMemo(
    () => new Set(sameHierarchyMunicipioIds.map((id) => String(id))),
    [sameHierarchyMunicipioIds]
  );

  const selectedLabel = useMemo(() => {
    if (!geoJsonData) return null;

    try {
      const selectedFeature = geoJsonData.features.find(
        (feature) => String(feature.properties.id) === String(cityCode)
      );

      if (!selectedFeature) return null;

      const center = L.geoJSON(selectedFeature).getBounds().getCenter();
      const dbMunicipio = municipiosByCode.get(String(cityCode));

      return {
        id: String(cityCode),
        name:
          dbMunicipio?.municipio_nome ||
          selectedFeature.properties.name ||
          selectedFeature.properties.description ||
          "Município",
        center,
      };
    } catch (error) {
      console.error("Erro ao calcular label selecionado:", error);
      return null;
    }
  }, [geoJsonData, cityCode, municipiosByCode]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">
        Carregando mapa...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!geoJsonData) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">
        Geometria não encontrada.
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#f3f5f8]">
      <MapContainer
        key={`${stateSigla}-${cityCode}`}
        center={[-14.235, -51.9253]}
        zoom={5}
        zoomControl={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        dragging={true}
        maxBoundsViscosity={1.0}
        attributionControl={false}
        className="h-full w-full rounded-lg"
        style={{ height: "100%", width: "100%", background: "#f3f5f8" }}
      >
        <GeoJSON
          data={geoJsonData}
          onEachFeature={(feature, layer) => {
            const featureId = String(feature?.properties?.id);
            const isSelected = featureId === String(cityCode);
            const isSameHierarchy = !isSelected && similarIdsSet.has(featureId);

            if (!isSelected && !isSameHierarchy) return;

            const municipioName =
              municipiosByCode.get(featureId)?.municipio_nome ||
              feature?.properties?.name ||
              feature?.properties?.description ||
              "Município";

            layer.bindTooltip(
              `<span class="notranslate" translate="no" lang="pt-BR">${escapeHtml(
                municipioName
              )}</span>`,
              {
              sticky: true,
              direction: "top",
              offset: [0, -4],
              opacity: 0.95,
              className: "municipality-hover-tooltip",
              }
            );
          }}
          style={(feature) => {
            const featureId = String(feature?.properties?.id);
            const isSelected = featureId === String(cityCode);
            const isSameHierarchy = !isSelected && similarIdsSet.has(featureId);
            const municipio = municipiosByCode.get(featureId);
            const maturityColor = getMunicipioMaturityColor(municipio);

            return {
              color: isSelected ? "#0D47A1" : isSameHierarchy ? maturityColor : "#C7D2E2",
              weight: isSelected ? 3 : isSameHierarchy ? 1.8 : 0.9,
              fillColor: isSelected
                ? maturityColor
                : isSameHierarchy
                  ? maturityColor
                  : "#D2DBE8",
              fillOpacity: isSelected ? 0.94 : isSameHierarchy ? 0.96 : 1,
            };
          }}
        />

        {selectedLabel && (
          <Marker
            position={selectedLabel.center}
            icon={L.divIcon({
              className: "municipality-label-selected-icon",
              html: `<div class="notranslate" translate="no" lang="pt-BR" style="
                font-size: 16px;
                color: #0D47A1;
                font-weight: 800;
                white-space: nowrap;
                text-shadow: 0 0 3px #fff, 0 0 6px #fff, 0 0 2px rgba(13, 71, 161, 0.3);
                transform: translate(22px, -24px);
                letter-spacing: 0.5px;
              ">${escapeHtml(selectedLabel.name.toLocaleUpperCase("pt-BR"))}</div>`,
            })}
          />
        )}

        <FitBounds geoJsonData={geoJsonData} />
      </MapContainer>
    </div>
  );
};

export default MunicipalityMap;

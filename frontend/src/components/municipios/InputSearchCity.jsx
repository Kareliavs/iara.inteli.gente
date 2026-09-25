import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import MunicipalityName from "@/components/common/MunicipalityName";

const toSlug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-");

const normalizeSearchText = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const InputSearchCity = ({ joined = false, availableMunicipios = null }) => {
  const [term, setTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const query = term.trim();

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      setLoading(true);

      if (Array.isArray(availableMunicipios)) {
        const normalizedQuery = normalizeSearchText(query);
        const matches = availableMunicipios
          .filter((city) =>
            normalizeSearchText(city?.municipio_nome).includes(normalizedQuery)
          )
          .sort((a, b) =>
            String(a?.municipio_nome || "").localeCompare(
              String(b?.municipio_nome || ""),
              "pt-BR"
            )
          )
          .slice(0, 20)
          .map((city) => ({
            ...city,
            result: `${city.municipio_nome} - ${city.estado_sigla}`,
            friendlyName: toSlug(
              `${city.municipio_nome}-${city.estado_sigla}`
            ),
          }));

        setSuggestions(matches);
        setLoading(false);
        return;
      }

      fetch(`/api/municipios/busca?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Erro ao buscar municípios.");
          }
          return res.json();
        })
        .then((data) => {
          setSuggestions(data);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error(err);
            setSuggestions([]);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [term, availableMunicipios]);

  const handleSelect = (city) => {
    setShowSuggestions(false);
    setTerm("");

    const slug = city.friendlyName || toSlug(`${city.municipio_nome}-${city.estado_sigla}`);

    navigate(`/municipios/${slug}`, {
      state: {
        municipio_cod_ibge: city.municipio_cod_ibge,
        municipio_nome: city.municipio_nome,
        estado_nome: city.estado_nome,
        estado_sigla: city.estado_sigla,
        municipio_regiao: city.municipio_regiao,
      },
    });
  };

  return (
    <div
      className={
        joined
          ? "rounded-t-xl bg-brand-navy/90 p-6"
          : "rounded-xl bg-brand-navy/90 p-6"
      }
    >
      <h3 className="mb-3 text-lg font-bold text-primary-foreground">
        Encontre o município de interesse
      </h3>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>

        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Digite o nome do município"
          className="w-full rounded-xl border-0 bg-background py-3 pl-10 pr-4 text-foreground outline-none placeholder:text-muted-foreground"
        />

        {showSuggestions && (suggestions.length > 0 || loading) && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-border bg-background shadow-lg">
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Buscando municípios...
              </div>
            ) : (
              suggestions.map((city) => (
                <button
                  key={city.municipio_cod_ibge}
                  onClick={() => handleSelect(city)}
                  className="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <MunicipalityName>{city.result}</MunicipalityName>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSearchCity;

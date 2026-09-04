import { ChevronDown } from "lucide-react";
import { FILTER_OPTIONS } from "@/data/mockData";

const SearchFilters = ({
  selectedState = "",
  selectedRegion = "",
  selectedInfluence = "",
  onStateChange,
  onRegionChange,
  onInfluenceChange,
  regionOptions,
  influenceOptions,
  joined = false,
}) => {
  const filters = [
    {
      key: "estado",
      label: "Estado",
      options: FILTER_OPTIONS.estados,
      onChange: onStateChange,
      value: selectedState,
    },
    {
      key: "regiao",
      label: "Região",
      options:
        Array.isArray(regionOptions) && regionOptions.length
          ? regionOptions
          : FILTER_OPTIONS.regioes,
      onChange: onRegionChange,
      value: selectedRegion,
      disabled: Boolean(selectedState),
    },
    {
      key: "rede_influencia",
      label: "Rede de influência",
      options:
        Array.isArray(influenceOptions) && influenceOptions.length
          ? influenceOptions
          : FILTER_OPTIONS.redesInfluencia,
      onChange: onInfluenceChange,
      value: selectedInfluence,
    },
  ];

  return (
    <div
      className={
        joined
          ? "space-y-2 rounded-b-xl border border-border bg-background p-4 shadow-sm"
          : "space-y-2 rounded-xl border border-border bg-background p-4 shadow-sm"
      }
    >
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            value={filter.value}
            disabled={filter.disabled}
            onChange={(e) => filter.onChange?.(e.target.value)}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value ?? opt} value={opt.value ?? opt}>
                {opt.label ?? opt}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
};

export default SearchFilters;

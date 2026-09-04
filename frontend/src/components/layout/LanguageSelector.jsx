import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, getLanguageConfig, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FlagIcon = ({ country }) => {
  if (country === "br") {
    return (
      <svg viewBox="0 0 36 24" className="h-4 w-6 rounded-sm shadow-sm" aria-hidden="true">
        <rect width="36" height="24" fill="#159B45" />
        <path d="M18 3.2 32 12 18 20.8 4 12Z" fill="#FEDF00" />
        <circle cx="18" cy="12" r="5" fill="#002776" />
        <path d="M13.6 10.4c3.4-.8 6.4-.1 9 2" stroke="#fff" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }

  if (country === "us") {
    return (
      <svg viewBox="0 0 36 24" className="h-4 w-6 rounded-sm shadow-sm" aria-hidden="true">
        <rect width="36" height="24" fill="#fff" />
        {Array.from({ length: 7 }).map((_, index) => (
          <rect key={index} y={index * 3.7} width="36" height="1.85" fill="#B22234" />
        ))}
        <rect width="15.6" height="12.9" fill="#3C3B6E" />
        {Array.from({ length: 9 }).map((_, index) => (
          <circle
            key={index}
            cx={2.5 + (index % 3) * 4.8}
            cy={2.3 + Math.floor(index / 3) * 3.8}
            r="0.55"
            fill="#fff"
          />
        ))}
      </svg>
    );
  }

  if (country === "fr") {
    return (
      <svg viewBox="0 0 36 24" className="h-4 w-6 rounded-sm shadow-sm" aria-hidden="true">
        <rect width="12" height="24" fill="#0055A4" />
        <rect x="12" width="12" height="24" fill="#fff" />
        <rect x="24" width="12" height="24" fill="#EF4135" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 24" className="h-4 w-6 rounded-sm shadow-sm" aria-hidden="true">
      <rect width="36" height="24" fill="#AA151B" />
      <rect y="6" width="36" height="12" fill="#F1BF00" />
      <rect x="9" y="9" width="3" height="6" rx="0.6" fill="#AA151B" />
    </svg>
  );
};

const LanguageSelector = () => {
  const { language, setLanguage, t } = useI18n();
  const activeLanguage = getLanguageConfig(language);

  return (
    <div id="language-selector" className="notranslate" translate="no">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-md border-[#c8d7f0] px-3 text-[#1f4e9b] hover:bg-[#eef4ff] hover:text-[#1f4e9b]"
            aria-label={`${t("Selecionar idioma")}: ${activeLanguage.label}`}
          >
            <FlagIcon country={activeLanguage.country} />
            <span className="text-sm font-bold uppercase">{activeLanguage.code}</span>
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="notranslate w-44 border-[#c8d7f0]"
          translate="no"
        >
          <DropdownMenuGroup>
            {LANGUAGES.map((option) => {
              const isSelected = option.code === language;

              return (
                <DropdownMenuItem
                  key={option.code}
                  className="gap-2 text-[#1f4e9b] focus:bg-[#eef4ff] focus:text-[#1f4e9b]"
                  onSelect={() => setLanguage(option.code)}
                >
                  <FlagIcon country={option.country} />
                  <span className="flex-1 text-sm font-semibold">{option.label}</span>
                  <span className="text-xs font-bold uppercase text-[#4f6f9f]">
                    {option.code}
                  </span>
                  <Check
                    className={cn("ml-1", isSelected ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSelector;

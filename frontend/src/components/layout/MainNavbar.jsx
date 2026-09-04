import { Link } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";

const MainNavbar = () => {
  return (
    <header className="w-full border-b border-[#e5e5e5] bg-white">
      <div className="mx-auto grid h-[88px] max-w-[1920px] grid-cols-[auto_1fr_auto] items-center px-14">
        <Link to="/municipios" className="flex items-center">
          <img
            src="/logo_iara.png"
            alt="logo IARA"
            className="h-[45px] w-auto object-contain"
          />
        </Link>
        <Link to="/municipios" className="flex items-center">
          <img
            src="/logo_inteli.gente.png"
            alt="inteli.gente MCTI"
            className="h-[72px] w-auto object-contain"
          />
        </Link>
        <div className="justify-self-end flex items-center gap-3">
          <LanguageSelector />

          <div className="relative group">
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              className="flex h-12 w-12 items-center justify-center rounded-md border border-[#c8d7f0] bg-white text-[#1f4e9b] transition-colors hover:bg-[#eef4ff] focus:outline-none focus:ring-2 focus:ring-[#3f8ed1]/50"
            >
              <span className="sr-only">Menu</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>

            <div className="invisible absolute right-0 top-[calc(100%+10px)] z-30 min-w-[260px] rounded-lg border border-[#c8d7f0] bg-white p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <Link
                to="/metodologias"
                className="block rounded-md px-3 py-2 text-[16px] font-semibold text-[#1f4e9b] hover:bg-[#eef4ff]"
              >
                Metodologias
              </Link>
              <Link
                to="/indicadores"
                className="mt-1 block rounded-md px-3 py-2 text-[16px] font-semibold text-[#1f4e9b] hover:bg-[#eef4ff]"
              >
                Indicadores
              </Link>
              <Link
                to="/prefeitura"
                className="mt-1 block rounded-md px-3 py-2 text-[16px] font-semibold text-[#1f4e9b] hover:bg-[#eef4ff]"
              >
                Área da Prefeitura
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;

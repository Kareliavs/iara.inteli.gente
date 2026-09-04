import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="w-full px-12 md:px-16 lg:px-20 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr_1fr] gap-10 items-start">
          <div className="flex items-start">
            <img
              src="/logo_inteli.gente_w.png"
              alt="inteli.gente MCTI white"
              className="h-[120px] md:h-[145px] w-auto object-contain"
            />
          </div>

          <nav className="flex flex-col gap-4 text-[15px] md:text-[16px] leading-none pt-2">
            <Link to="/municipios" className="hover:underline">
              Encontre um município
            </Link>
            <a href="#" className="hover:underline">
              Sobre a plataforma
            </a>
            <a href="#" className="hover:underline">
              Metodologias
            </a>
            <a href="#" className="hover:underline">
              Cidades Inteligentes Sustentáveis na mídia
            </a>
          </nav>

          <nav className="flex flex-col gap-4 text-[15px] md:text-[16px] leading-none pt-2">
            <a href="#" className="hover:underline">
              Fale conosco
            </a>
            <a href="#" className="hover:underline">
              Área da prefeitura
            </a>
            <a href="#" className="hover:underline">
              🔒 Área restrita
            </a>
          </nav>
        </div>

        <div className="mt-10 flex justify-end">
          <p className="text-sm italic text-brand-cyan">
            Versão: <span className="font-bold text-brand-green">1.4.0</span> / API{" "}
            <span className="font-bold text-brand-green">1.4.4</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
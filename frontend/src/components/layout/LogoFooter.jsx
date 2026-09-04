const LogoFooter = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-[#f3f7fc] py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 sm:px-8">
        <section className="flex flex-col items-center gap-3" aria-labelledby="main-logos-title">
          <h2
            id="main-logos-title"
            className="text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-navy/75"
          >
            Realização
          </h2>

          <div className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-5 sm:grid-cols-3">
            <div className="flex h-20 w-full max-w-[220px] items-center justify-center">
              <img src="/logo_icmc.png" alt="logo ICMC" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="flex h-20 w-full max-w-[220px] items-center justify-center">
              <img src="/logo_iara.png" alt="logo IARA" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="flex h-20 w-full max-w-[220px] items-center justify-center">
              <img src="/logo_inteli.gente.png" alt="inteli.gente MCTI" className="max-h-16 max-w-full object-contain" />
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-3" aria-labelledby="support-logos-title">
          <h2
            id="support-logos-title"
            className="text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-navy/60"
          >
            Apoio
          </h2>

          <div className="grid w-full max-w-2xl grid-cols-1 justify-items-center gap-x-8 gap-y-4 min-[480px]:grid-cols-3">
            <div className="flex h-9 w-full max-w-[150px] items-center justify-center opacity-65">
              <img src="/logo_rnp.png" alt="logo RNP" className="max-h-7 max-w-full object-contain" />
            </div>
            <div className="flex h-9 w-full max-w-[150px] items-center justify-center opacity-65">
              <img src="/logo_ctira.png" alt="logo CTIRA" className="max-h-7 max-w-full object-contain" />
            </div>
            <div className="flex h-9 w-full max-w-[150px] items-center justify-center opacity-65">
              <img src="/logo_mcti.png" alt="logo MCTI" className="max-h-7 max-w-full object-contain" />
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
};
export default LogoFooter;

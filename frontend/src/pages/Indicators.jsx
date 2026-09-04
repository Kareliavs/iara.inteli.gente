import { useState } from "react";
import { UsersRound, Leaf, Building2, Network } from "lucide-react";

const indicatorTopics = [
  {
    id: "economica",
    label: "Econômica",
    iconSrc: "/i_econ.png",
    icon: Building2,
    title: "Indicadores Econômicos",
    paragraphs: [
      "Avaliam a dinâmica econômica municipal, com foco em geração de renda, formalização do trabalho, produtividade e capacidade de investimento local.",
      "Esses indicadores apoiam o entendimento sobre competitividade territorial e sustentabilidade financeira para viabilizar políticas públicas de longo prazo.",
    ],
  },
  {
    id: "sociocultural",
    label: "Sociocultural",
    iconSrc: "/i_socio.png",
    icon: UsersRound,
    title: "Indicadores Socioculturais",
    paragraphs: [
      "Mensuram aspectos de inclusão, educação, saúde, participação social e acesso a serviços essenciais, evidenciando a qualidade de vida da população.",
      "Também permitem acompanhar desigualdades e orientar decisões voltadas à equidade e ao desenvolvimento humano no território.",
    ],
  },
  {
    id: "meio-ambiente",
    label: "Meio Ambiente",
    iconSrc: "/i_ambi.png",
    icon: Leaf,
    title: "Indicadores de Meio Ambiente",
    paragraphs: [
      "Observam desempenho ambiental urbano, incluindo saneamento, gestão de resíduos, recursos hídricos, emissões e preservação ambiental.",
      "A análise contribui para monitorar resiliência climática e apoiar estratégias de sustentabilidade alinhadas ao contexto local.",
    ],
  },
  {
    id: "capacidades-institucionais",
    label: "Capacidades Institucionais",
    iconSrc: "/i_capac.png",
    icon: Building2,
    title: "Indicadores de Capacidades Institucionais",
    paragraphs: [
      "Medem a capacidade do município de planejar, executar e monitorar políticas públicas com governança, integração e uso qualificado de dados.",
      "Esses indicadores refletem maturidade administrativa e coordenação institucional para sustentar iniciativas de cidade inteligente.",
    ],
  },
];

const Indicators = () => {
  const [selectedTopicId, setSelectedTopicId] = useState(indicatorTopics[0].id);

  const selectedTopic =
    indicatorTopics.find((topic) => topic.id === selectedTopicId) ||
    indicatorTopics[0];

  return (
    <div>
      <section className="city-search-hero-gradient py-16 md:py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">
            Indicadores
          </h1>
          <p className="mt-4 text-base text-white/90 md:text-lg md:whitespace-nowrap">
            Nesta página você encontra os indicadores utilizados no diagnóstico,
            incluindo critérios de análise, fontes de dados e forma de cálculo.
          </p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[180px_1fr]">
            <aside className="rounded-none bg-transparent p-4">
              <div className="space-y-3">
                {indicatorTopics.map((topic) => {
                  const isSelected = topic.id === selectedTopicId;
                  const Icon = topic.icon;

                  return (
                    <div key={topic.id} className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTopicId(topic.id)}
                        aria-label={topic.label}
                        title={topic.label}
                        className={`peer flex h-16 w-16 items-center justify-center rounded-2xl border transition-all ${
                          isSelected
                            ? "border-[#1f4e9b] bg-[#1f4e9b] text-white shadow-sm"
                            : "border-[#e2e8f5] bg-white text-[#8a8f99] hover:border-[#1f4e9b] hover:text-[#1f4e9b]"
                        }`}
                      >
                        {topic.iconSrc ? (
                          <img
                            src={topic.iconSrc}
                            alt=""
                            className="h-6 w-6 object-contain"
                            aria-hidden="true"
                          />
                        ) : (
                          <Icon className="h-6 w-6" strokeWidth={2.2} />
                        )}
                      </button>

                      <span className="pointer-events-none absolute left-[78px] rounded-md bg-[#1f4e9b] px-2 py-1 text-xs font-semibold tracking-wide text-white opacity-0 transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
                        {topic.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <article className="pt-2">
              <h2 className="text-4xl font-extrabold leading-tight text-[#2ca1d8] md:text-5xl">
                {selectedTopic.title}
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-relaxed text-[#4f5d73] md:text-xl">
                {selectedTopic.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Indicators;

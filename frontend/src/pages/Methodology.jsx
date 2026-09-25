import { useState } from "react";
import {
  Info,
  Grid2X2,
  BarChart3,
  Building2,
  Leaf,
  ScanText,
  FileCheck2,
  Landmark,
} from "lucide-react";

const topics = [
  {
    id: "sobre-nos",
    label: "Sobre nós",
    icon: Info,
    title: "Sobre nós",
    paragraphs: [
      {
        subtitle: "IARAinteli.gente: Recriando ambientes, impulsionando municípios.",
        text: [
          "Para a nova IARAinteli.gente, inovação e propósito caminham juntos para transformar a gestão pública. Combinando o poder da Inteligência Artificial Recriando Ambientes (IARA) a uma metodologia analítica avançada (inteli.gente), levamos a transformação digital e o desenvolvimento sustentável ao ambiente onde a vida realmente acontece: os municípios.",
          "Grandes estratégias costumam falhar quando ignoram a diversidade local. A IARAinteli.gente inova neste cenário ao oferecer uma visão com granularidade em nível municipal, identificando com precisão e predição o grau de maturidade digital e sustentável de cada cidade brasileira.",
        ],
      },
      {
        subtitle: "Colaboramos com:",
        text: "Diagnóstico de Precisão e Predição Territorial: Mapeamento detalhado das capacidades tecnológicas, infraestrutura e governança de cada município. Decisões públicas de alto impacto não aceitam soluções genéricas. Identificamos a maturidade digital e sustentável exata do seu município para direcionar investimentos onde eles trazem maior retorno.",
        bullets: [
          "Cenários Recriados por IA: Simulação de ambientes e políticas públicas para otimizar a tomada de decisão com dados reais e preditivos. Simulação e Planejamento Preditivo com a aplicação de IA para recriar ambientes e simular cenários antes da aplicação de recursos públicos. Menos margem para erro, mais eficiência na gestão do orçamento.",
          "Customização: Respeito à identidade local, traçando rotas de evolução tecnológica acessíveis para pequenos, médios e grandes centros urbanos. Simulação e Planejamento Preditivo: Aplicamos IA para recriar ambientes e simular cenários para aplicação de recursos públicos.",
          "Alinhamento com Recomendações Y 4904 ITU-T, ODS e ISOs 37120,37122,37123 e 37125, integração direta de metas globais de sustentabilidade às rotinas e indicadores da administração pública local.",
        ],
      },
      {
        subtitle: "Acreditamos que:",
        text: [
          "A transformação digital não é privilégio de grandes metrópoles. Nossa metodologia adapta a tecnologia de ponta à escala da sua cidade, respeitando a realidade orçamentária e operacional local.",
          "Entregamos a clareza que o gestor público precisa com um panorama granular que demonstra onde o seu município está na transformação digital e, onde pode chegar recomendando ações para aprimorar a tomada de decisões, contribuindo com a gestão e governança das políticas públicas.",
          "Sabemos que a inteligência artificial só é verdadeiramente inteligente quando é humana, inclusiva e aplicável. Ao aproximar tecnologia de ponta e análise territorial granular, a IARAinteli.gente capacita gestores públicos a liderarem cidades mais eficientes, transparentes e sustentáveis.",
        ],
      },
      {
        subtitle: "Contexto institucional",
        text: "Fundamentado no Decreto nº 9.854, de 25 de junho de 2019, que instituiu o Plano Nacional de Internet das Coisas, o Ministério da Ciência, Tecnologia e Inovação (MCTI) lançou em 2019 a Câmara das Cidades 4.0, em parceria com o Ministério do Desenvolvimento Regional (MDR - atual Ministério das Cidades - MCID). A Câmara das Cidades 4.0 foi criada com objetivo de ser um fórum técnico e colaborativo para ampliar e discutir a política pública de cidades inteligentes no Brasil e conta com a colaboração da academia, do setor privado, de entidades representativas dos Estados e Municípios e da Sociedade Civil Organizada.",
      },
      {
        subtitle: "Origem da plataforma",
        text: "Um dos trabalhos desenvolvidos no âmbito da Câmara das Cidades 4.0, e que está ancorado nas diretrizes da Carta Brasileira para Cidades Inteligentes, foi a plataforma inteli.gente, que diagnostica o nível de maturidade em transformação digital e desenvolvimento urbano sustentável das cidades brasileiras.",
      },
      {
        subtitle: "Apoio aos municípios",
        text: "O projeto inteli.gente foi desenvolvido para apoiar municípios na jornada de transformação digital e sustentabilidade, com foco em decisões baseadas em evidências.",
      },
      {
        subtitle: "Nossa proposta",
        text: "Nossa proposta integra metodologia, dados públicos e visualizações para orientar diagnósticos, priorizar ações e fortalecer políticas voltadas a cidades inteligentes sustentáveis.",
      },
    ],
  },
  {
    id: "dimensoes",
    label: "Dimensões",
    icon: Grid2X2,
    title: "Dimensões",
    paragraphs: [
      "Meio Ambiente: Avalia a proteção do acesso aos recursos do ambiente natural e construído, no presente e no futuro. Tem foco no fomento à produção e ao consumo consciente e equilibrado entre recursos naturais, TICs e sociedade, com respeito, preservação e recuperação do ambiente natural.",
      "Econômica: Avalia o potencial de gerar renda e emprego para a subsistência das pessoas e o desenvolvimento inclusivo da economia urbana local. Tem foco no acesso à infraestrutura urbana e de TIC, a geração de oportunidades econômicas pelo uso das TICs nas cidades e a promoção da economia criativa e compartilhada.",
      "Sociocultural: Avalia a proteção do bem-estar das pessoas de maneira equitativa, com redução das desigualdades socioespaciais, acesso à informação, inclusão e letramento digital, bens e serviços urbanos essenciais. Tem foco no respeitar à identidade e à diversidade sociocultural local.",
      "Capacidades Institucionais: Avalia as capacidades institucionais para a transformação da cidade levando em conta ações-chave da administração pública municipal nos âmbitos de estratégia, infraestrutura de Hardware eSoftware, dados abertos, serviços e aplicações e monitoramento."
    ],
  },
  {
    id: "niveis",
    label: "Níveis de Maturidade",
    icon: BarChart3,
    title: "Níveis de Maturidade",
    paragraphs: [
      "A plataforma inteli.gente apresenta um diagnóstico do nível de maturidade para subsidiar a construção de políticas públicas em todas as cidades do país. A plataforma possui sete níveis de maturidade, sendo o número sete o mais elevado. Os níveis 1 (Adesão) e 2 (Engajamento) são resultados de uma ampliação para o Brasil, a partir do SSC-MM da União Internacional de Telecomunicações (ITU) que recomenda cinco níveis de maturidade.",
      "Cada nível tem seus próprios objetivos, indicadores-chave de performance da cidade e práticas esperadas, apresentando um caminho evolutivo. O nível de maturidade não é voltado para o ranqueamento da cidade, e sim para fornecer um diagnóstico sobre o desenvolvimento urbano sustentável e a transformação digital de forma integrada.",
      "Os níveis de maturidade oferecem um guia para as cidades que buscam seu próprio desenvolvimento em curto, médio e longo prazos, entendendo que elas são complexas, diversas e estão em constante transformação. O conjunto de objetivos, indicadores e práticas delineiam caminhos de políticas públicas, federais, estaduais e municipais em direção às cidades tornarem-se inteligentes e sustentáveis.",
      "Primeiro Nível: Adesão - Neste nível a cidade reconhece alguns de seus problemas-chave e entende o tipo de desafio pertinente a tornar-se uma cidade inteligente sustentável. Ainda não há plano formal ou estratégia consolidada para a transformação digital, inexistindo integração entre os setores e secretarias, e forte assimetria territorial de infraestrutura para a oferta de serviços públicos. Os processos não estão padronizados e apresenta baixo grau de digitalização dos serviços oferecidos. As cidades neste nível apresentam os menores resultados para os indicadores, o que expressa necessidade de melhoria nos aspectos econômicos, ambientais, socioculturais e de capacidade institucional.",
      "Segundo Nível: Engajamento - Em uma cidade neste nível, as ações de transformação começam a se articular, com definições das metas setoriais para incorporação de tecnologia, mesmo não tendo um plano formal ou estratégia consolidada para a gestão da cidade. Há identificação das áreas prioritárias de investimentos em infraestrutura básica para a diminuição de assimetrias territoriais, para a padronização dos processos e para a digitalização de serviços públicos municipais. Nos indicadores da cidade, persistem defasagens infraestruturais afetando ainda a oferta de serviços e a qualidade de vida das pessoas.",
      "Terceiro Nível: Planejamento - A cidade apresenta planejamento e estratégia de transformação digital, incluindo planos e políticas de dados, e acompanhamento por indicadores e metas. Existe uma liderança no processo de articulação com diversos atores envolvidos. Os planos de ampliação da infraestrutura urbana e de TIC reconhecem a necessidade de oferecimento de serviços on-line. A produção e uso de dados indicam a necessidade de interoperabilidade entre os setores e secretarias. A identificação de áreas prioritárias de políticas públicas de gestão por processos de acompanhamento e monitoramento já podem estar disponíveis on-line no portal da cidade. Os resultados dos indicadores apontam que há condições infraestruturais para se avançar em direção à cidade inteligente sustentável.",
      "Quarto Nível: Alinhamento - Há ações implementadas para melhoria e uso de TICs em serviços e soluções. Existe participação de atores diversos nas decisões sobre a transformação digital da cidade. A captura e organização dos dados estão implementadas permitindo que os serviços atendam à maioria da população, ainda que não integrados. A cidade está preparada para ações de inclusão digital, monitoramento periódico de políticas e pesquisas de satisfação. A infraestrutura urbana e de TICs permite disponibilizar serviços urbanos e aplicações com uso de TICs para melhorar a qualidade de vida do cidadão.",
      "Quinto Nível: Desenvolvimento - Neste nível, a cidade busca o desenvolvimento por meio da utilização de tecnologia, entre outras ações. As tomadas de decisão em relação à cidade inteligente sustentável têm a participação dos munícipes em diversos arranjos e atores institucionais. Os serviços públicos oferecidos atendem à maioria da população de modo integrado e por multicanais digitais. As pesquisas de satisfação e sua disponibilização apontam para infraestruturas urbanas e de TIC implantadas, permitindo a ampliação da oferta de serviços públicos com uso de TIC e com interoperabilidade. Os dados são adequadamente armazenados, processados e geridos em sistemas e plataformas digitais públicas.",
      "Sexto Nível: Integração - As estratégias neste nível de maturidade estão consolidadas, a cidade visa integrar tecnologicamente sistemas e o território com demais municípios. Existe um portal de dados abertos com uso de ferramentas de TICs avançadas e preditivas, para o subsídio de serviços e soluções inteligentes, em tempo real. Os sistemas de gestão e governança pública estão interoperáveis, e com forte participação social. As pesquisas de satisfação com as partes interessadas contribuem para o aperfeiçoamento das políticas públicas, em um processo sistemático de avaliação contínua.",
      "Sétimo Nível: Otimização - A cidade neste nível está integrada, sustentável, inclusiva e diversa, oferecendo acesso pleno à infraestrutura urbana e de TICs. As avaliações de satisfação e qualidade são sistemáticas, periódicas, quantitativas e qualitativas, com indicadores e dados populacionais, que subsidiam políticas públicas e direcionam à melhoria contínua do município. Há institucionalidade, governança colaborativa e participação social. A tecnologia implantada tem função de melhorar continuamente serviços, aplicações e infraestruturas. A automatização e a internalização das TICs avançadas, com grandes volumes de dados coletados e analisados, permitem previsões para a eficiência na entrega dos serviços em tempo real."
    ],
  },
  {
    id: "capacidades",
    label: "Capacidades Institucionais",
    icon: Building2,
    title: "Capacidades Institucionais",
    paragraphs: [
      "Os tópicos desta dimensão avaliam a maturidade da gestão municipal em relação a estratégia, infraestrutura de Hardware e Software, dados abertos, serviços e aplicações e monitoramento, de maneira que a cidade estruture melhores condições para alcançar e se sustentar como uma cidade inteligente.",
      "Os Indicadores de Capacidade Institucional foram normalizados e parametrizados por serem provenientes de diferentes fontes e escalas sendo necessário converter os dados para um mesmo padrão de medição, ou seja, em faixas de valores (intervalos), com critérios de metrificação dos indicadores para auferir o nível de maturidade (1 a 7).",
    ],
  },
  {
    id: "desenvolvimento",
    label: "Desenvolvimento Sustentável e TICs",
    icon: Leaf,
    title: "Desenvolvimento Sustentável e TICs",
    paragraphs: [
      "Os Indicadores de Desenvolvimento Sustentável e TICs foram normalizados e parametrizados por serem provenientes de diferentes fontes e escalas sendo necessário converter os dados para um mesmo padrão de medição, ou seja, em faixas de valores (intervalos), com critérios de metrificação dos indicadores para auferir o nível de maturidade (1 a 7).",
    ],
  },
  {
    id: "caracterizacoes",
    label: "Caracterizações",
    icon: ScanText,
    title: "Caracterizações",
    paragraphs: [
      "Um conjunto de indicadores distribuídos em tópicos são utilizados para descrição dos perfis sociodemográfico, transformação digital e institucional da cidade. Estes indicadores são chamados de caracterização, e não são utilizados para atribuir um nível de maturidade. Abaixo são apresentados os tópicos das Caracterizações.",
    ],
  },
  {
    id: "publicacao",
    label: "Processo de Publicação",
    icon: FileCheck2,
    title: "Processo de Publicação",
    paragraphs: [
      "A publicação do diagnóstico do nível de maturidade é disponibilizada por meio de uma estimativa, tem como referência os indicadores de bases secundárias. As cidades podem aprimorar o nível de maturidade estimado, toda vez que preencherem os formulários de Desenvolvimento Sustentável e TICs e de Capacidade Institucional, de forma dinâmica, na área restrita da prefeitura.",
    ],
  },
  {
    id: "cadastro",
    label: "Cadastro da Prefeitura",
    icon: Landmark,
    title: "Cadastro da Prefeitura",
    paragraphs: [
      "Para ter acesso à plataforma, aos formulários auto declaratórios e ao painel de resultados, o Prefeito da cidade realiza o cadastro em https://inteligente.mcti.gov.br, pelo Gov.br, inserindo as informações solicitadas. A equipe de suporte valida o cadastro e libera o primeiro acesso, a partir daí o Prefeito pode cadastrar mais cinco assessores para auxiliar no gerenciamento da área exclusiva da Prefeitura.",
    ],
  },
];

const Methodology = () => {
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0].id);

  const selectedTopic =
    topics.find((topic) => topic.id === selectedTopicId) || topics[0];

  return (
    <div>
      <section className="city-search-hero-gradient py-16 md:py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">
            Metodologias
          </h1>
          <p className="mt-4 text-base text-white/90 md:text-lg md:whitespace-nowrap">
            Nesta página você encontra os critérios, fontes e regras de cálculo
            utilizados para compor os níveis de maturidade dos municípios.
          </p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[180px_1fr]">
            <aside className="rounded-none bg-transparent p-4">
              <div className="space-y-3">
                {topics.map((topic) => {
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
                            ? "border-[#1f4e9b] bg-[#1f4e9b] text-[#11c5df] shadow-sm"
                            : "border-[#e2e8f5] bg-white text-[#11c5df] hover:border-[#1f4e9b] hover:text-[#11c5df]"
                        }`}
                      >
                        <Icon className="h-6 w-6" strokeWidth={2.2} />
                      </button>

                      <span
                        className="pointer-events-none absolute left-[78px] rounded-md bg-[#1f4e9b] px-2 py-1 text-xs font-semibold tracking-wide text-white opacity-0 transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100"
                      >
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
                {selectedTopic.paragraphs.map((paragraph, index) => {
                  if (typeof paragraph === "string") {
                    return <p key={index}>{paragraph}</p>;
                  }

                  const texts = Array.isArray(paragraph.text)
                    ? paragraph.text
                    : [paragraph.text];

                  return (
                    <section key={paragraph.subtitle} className="space-y-3">
                      <h3 className="text-2xl font-bold text-[#1f4e9b]">
                        {paragraph.subtitle}
                      </h3>
                      {texts.map((text, textIndex) => (
                        <p key={`${paragraph.subtitle}-${textIndex}`}>{text}</p>
                      ))}

                      {paragraph.bullets && (
                        <ul className="list-disc space-y-2 pl-6 marker:text-[#1f4e9b]">
                          {paragraph.bullets.map((bullet, bulletIndex) => (
                            <li key={`${paragraph.subtitle}-bullet-${bulletIndex}`}>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}

            {selectedTopic.id === "dimensoes" && (
            <div className="mt-8">
                <img
                src="/art_dimensoes.png"
                alt="Ilustração das dimensões da metodologia"
              className="mx-auto w-full max-w-[1020px] rounded-2xl border border-[#e2e8f5]"
                loading="lazy"
                />
            </div>
            )}

            {selectedTopic.id === "niveis" && (
            <div className="mt-8">
                <img
                src="/art_piramide_maturidade.png"
                alt="Ilustração das dimensões da metodologia"
              className="mx-auto w-full max-w-[400px] rounded-2xl border border-[#e2e8f5]"
                loading="lazy"
                />
            </div>
            )}
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Methodology;

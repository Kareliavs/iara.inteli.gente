import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  FileText,
  ListOrdered,
  LockKeyhole,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";

const COPY = {
  pt: {
    htmlLanguage: "pt-BR",
    dimensionNames: { d1: "Caracterização", economica: "Econômica", meio_ambiente: "Meio Ambiente", sociocultural: "Sociocultural", capacidades_institucionais: "Capacidades Institucionais" },
    title: "Assistente municipal",
    open: "Abrir assistente municipal",
    close: "Fechar assistente municipal",
    badge: "Dados oficiais",
    description: (city, dimension) => `Consulte análises prontas de ${city || "este município"}${dimension ? ` na dimensão ${dimension}` : ""}.`,
    questionsTitle: "O que você deseja consultar?",
    questionsInstruction: "Escolha uma pergunta. A resposta é calculada diretamente com os dados da plataforma, sem IA generativa.",
    questions: {
      comparar_municipios: "Como este município se compara a municípios semelhantes?",
      desafios_oportunidades_transformacao_digital: "Desafios e Oportunidades para Transformação Digital",
    },
    consulting: "Consultando dados municipais...",
    answer: "Resposta",
    level: "nível",
    levelLabels: { 1: "Nível Fundação", 2: "Nível Engajamento", 3: "Nível 1", 4: "Nível 2", 5: "Nível 3", 6: "Nível 4", 7: "Nível 5" },
    points: "pontos",
    currentMunicipality: "Município selecionado",
    noScore: "Pontuação indisponível",
    limitations: "Limitações",
    error: "Não foi possível executar a consulta.",
    invalid: "A consulta retornou uma resposta inválida.",
    unavailableOpen: "Assistente municipal indisponível",
    unavailableTitle: "Funcionalidade exclusiva para municípios respondentes",
    unavailableDescription: "O Assistente Municipal está disponível somente para municípios que responderam ao formulário da plataforma.",
    unavailableAction: "Ir para a Área da Prefeitura",
  },
  en: {
    htmlLanguage: "en",
    dimensionNames: { d1: "Characterization", economica: "Economic", meio_ambiente: "Environment", sociocultural: "Sociocultural", capacidades_institucionais: "Institutional Capabilities" },
    title: "Municipal assistant", open: "Open municipal assistant", close: "Close municipal assistant", badge: "Official data",
    description: (city, dimension) => `Explore prepared analyses for ${city || "this municipality"}${dimension ? ` in the ${dimension} dimension` : ""}.`,
    questionsTitle: "What would you like to see?",
    questionsInstruction: "Choose a question. The answer is calculated directly from platform data, without generative AI.",
    questions: {
      comparar_municipios: "How does this municipality compare with similar municipalities?",
      desafios_oportunidades_transformacao_digital: "Digital Transformation Challenges and Opportunities",
    },
    consulting: "Consulting municipal data...", answer: "Answer", level: "level", points: "points",
    levelLabels: { 1: "Foundation", 2: "Engagement", 3: "Level 1", 4: "Level 2", 5: "Level 3", 6: "Level 4", 7: "Level 5" },
    currentMunicipality: "Selected municipality", noScore: "Score unavailable", limitations: "Limitations",
    error: "The query could not be completed.", invalid: "The query returned an invalid response.",
    unavailableOpen: "Municipal assistant unavailable", unavailableTitle: "Feature available to participating municipalities",
    unavailableDescription: "The Municipal Assistant is available only to municipalities that have completed the platform questionnaire.",
    unavailableAction: "Go to the City Hall Area",
  },
  es: {
    htmlLanguage: "es",
    dimensionNames: { d1: "Caracterización", economica: "Económica", meio_ambiente: "Medio Ambiente", sociocultural: "Sociocultural", capacidades_institucionais: "Capacidades Institucionales" },
    title: "Asistente municipal", open: "Abrir asistente municipal", close: "Cerrar asistente municipal", badge: "Datos oficiales",
    description: (city, dimension) => `Consulte análisis preparados de ${city || "este municipio"}${dimension ? ` en la dimensión ${dimension}` : ""}.`,
    questionsTitle: "¿Qué desea consultar?",
    questionsInstruction: "Elija una pregunta. La respuesta se calcula directamente con los datos de la plataforma, sin IA generativa.",
    questions: {
      comparar_municipios: "¿Cómo se compara este municipio con municipios similares?",
      desafios_oportunidades_transformacao_digital: "Desafíos y Oportunidades para la Transformación Digital",
    },
    consulting: "Consultando datos municipales...", answer: "Respuesta", level: "nivel", points: "puntos",
    levelLabels: { 1: "Fundación", 2: "Compromiso", 3: "Nivel 1", 4: "Nivel 2", 5: "Nivel 3", 6: "Nivel 4", 7: "Nivel 5" },
    currentMunicipality: "Municipio seleccionado", noScore: "Puntuación no disponible", limitations: "Limitaciones",
    error: "No se pudo completar la consulta.", invalid: "La consulta devolvió una respuesta no válida.",
    unavailableOpen: "Asistente municipal no disponible", unavailableTitle: "Función exclusiva para municipios participantes",
    unavailableDescription: "El Asistente Municipal está disponible solo para los municipios que respondieron el formulario de la plataforma.",
    unavailableAction: "Ir al Área del Ayuntamiento",
  },
  fr: {
    htmlLanguage: "fr",
    dimensionNames: { d1: "Caractérisation", economica: "Économique", meio_ambiente: "Environnement", sociocultural: "Socioculturelle", capacidades_institucionais: "Capacités institutionnelles" },
    title: "Assistant municipal", open: "Ouvrir l'assistant municipal", close: "Fermer l'assistant municipal", badge: "Données officielles",
    description: (city, dimension) => `Consultez des analyses préparées pour ${city || "cette municipalité"}${dimension ? ` dans la dimension ${dimension}` : ""}.`,
    questionsTitle: "Que souhaitez-vous consulter ?",
    questionsInstruction: "Choisissez une question. La réponse est calculée directement à partir des données de la plateforme, sans IA générative.",
    questions: {
      comparar_municipios: "Comment cette municipalité se compare-t-elle à des municipalités similaires ?",
      desafios_oportunidades_transformacao_digital: "Défis et opportunités pour la transformation numérique",
    },
    consulting: "Consultation des données municipales...", answer: "Réponse", level: "niveau", points: "points",
    levelLabels: { 1: "Fondation", 2: "Engagement", 3: "Niveau 1", 4: "Niveau 2", 5: "Niveau 3", 6: "Niveau 4", 7: "Niveau 5" },
    currentMunicipality: "Municipalité sélectionnée", noScore: "Score indisponible", limitations: "Limites",
    error: "La consultation n'a pas pu être effectuée.", invalid: "La consultation a renvoyé une réponse non valide.",
    unavailableOpen: "Assistant municipal indisponible", unavailableTitle: "Fonction réservée aux municipalités participantes",
    unavailableDescription: "L'Assistant municipal est disponible uniquement pour les municipalités ayant répondu au questionnaire de la plateforme.",
    unavailableAction: "Accéder à l'espace de la mairie",
  },
};

const ACTIONS = [
  { id: "comparar_municipios", icon: Building2, requiresDimension: false },
  { id: "desafios_oportunidades_transformacao_digital", icon: ListOrdered, requiresDimension: false },
];

const MunicipalAssistant = ({
  municipioCodIbge,
  cityName,
  dimensionCode = null,
  dimensionTitle = null,
  indicatorIds = [],
  language = "pt",
  isAvailable = true,
}) => {
  const resolvedLanguage = Object.prototype.hasOwnProperty.call(COPY, language) ? language : "pt";
  const copy = COPY[resolvedLanguage];
  const localizedDimensionTitle = copy.dimensionNames[dimensionCode] || dimensionTitle;
  const normalizedIndicatorIds = useMemo(
    () => Array.from(new Set((Array.isArray(indicatorIds) ? indicatorIds : []).map(Number).filter(Number.isInteger))),
    [indicatorIds],
  );
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const requestControllerRef = useRef(null);

  useEffect(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setAnswer(null);
    setError("");
    setIsLoading(false);
    setActiveAction(null);
  }, [municipioCodIbge, dimensionCode, resolvedLanguage]);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  const executeAction = async (action) => {
    if (!isAvailable || !municipioCodIbge || isLoading || (action.requiresDimension && normalizedIndicatorIds.length === 0)) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setActiveAction(action.id);
    setError("");
    setAnswer(null);

    try {
      const response = await fetch("/api/assistente/consultar", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: action.id,
          contexto: {
            municipio_cod_ibge: municipioCodIbge,
            dimensao_codigo: dimensionCode || null,
            idioma: resolvedLanguage,
            indicador_ids: normalizedIndicatorIds,
          },
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (controller.signal.aborted || requestControllerRef.current !== controller) return;
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : copy.error);
      if (typeof data?.resposta !== "string" || !data.resposta.trim()) throw new Error(copy.invalid);
      setAnswer(data);
    } catch (requestError) {
      if (requestError?.name !== "AbortError") setError(requestError?.message || copy.error);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const limitations = Array.isArray(answer?.limitacoes) ? answer.limitacoes : [];
  const challengeSections = answer?.dados?.tipo === "desafios_oportunidades_transformacao_digital"
    && Array.isArray(answer?.dados?.secoes)
    ? answer.dados.secoes
    : [];
  const comparisonSections = answer?.dados?.tipo === "comparar_municipios"
    && Array.isArray(answer?.dados?.secoes)
    ? answer.dados.secoes
    : [];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          lang={copy.htmlLanguage}
          aria-label={isAvailable ? copy.open : copy.unavailableOpen}
          title={isAvailable ? copy.open : copy.unavailableDescription}
          className={`notranslate fixed bottom-5 right-5 z-[145] inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8cc8f4] focus-visible:ring-offset-2 active:scale-95 sm:bottom-7 sm:right-7 ${
            isAvailable
              ? "bg-[#247dc5] shadow-[0_8px_28px_rgba(20,71,113,0.38)] hover:scale-105 hover:bg-[#1c68a6]"
              : "bg-[#7890a8] opacity-60 grayscale shadow-[0_8px_22px_rgba(44,62,80,0.24)] hover:opacity-75"
          }`}
        >
          <Bot className="h-8 w-8" aria-hidden="true" />
          <span className="absolute right-0 top-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#f4b740] text-[#18324d]">
            {isAvailable ? <Sparkles className="h-3 w-3" aria-hidden="true" /> : <LockKeyhole className="h-3 w-3" aria-hidden="true" />}
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[150] bg-[#10243d]/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          lang={copy.htmlLanguage}
          className="notranslate fixed left-1/2 top-1/2 z-[151] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-[#dce6f4] bg-white shadow-[0_24px_80px_rgba(9,30,54,0.3)] focus:outline-none"
        >
          <header className="border-b border-[#e3eaf4] bg-gradient-to-r from-[#f2f8ff] to-[#f4fbfd] px-6 py-5 sm:px-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#247dc5] text-white shadow-sm">
                <Bot className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogPrimitive.Title className="pr-8 text-xl font-bold text-[#1f2d3d] sm:text-2xl">{copy.title}</DialogPrimitive.Title>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#bed8ef] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#286da8]">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />{copy.badge}
                  </span>
                </div>
                <DialogPrimitive.Description className="mt-1 pr-8 text-sm leading-relaxed text-[#526782]">
                  {copy.description(cityName, localizedDimensionTitle)}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close aria-label={copy.close} title={copy.close} className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#526782] transition-colors hover:bg-white hover:text-[#1f2d3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] sm:right-7">
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          {!isAvailable ? (
            <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-y-auto p-6 sm:p-8">
              <div className="max-w-xl rounded-2xl border border-[#d8e1ea] bg-[#f7f9fb] p-8 text-center shadow-inner">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e4eaf0] text-[#526782]">
                  <LockKeyhole className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-[#26394f]">{copy.unavailableTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-[#526782]">{copy.unavailableDescription}</p>
                <a
                  href="/prefeitura"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#247dc5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1c68a6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-2"
                >
                  {copy.unavailableAction}
                </a>
              </div>
            </div>
          ) : (
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 sm:p-8 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
            <aside aria-labelledby="municipal-assistant-questions-title">
              <h3 id="municipal-assistant-questions-title" className="text-sm font-bold uppercase tracking-[0.06em] text-[#405979]">{copy.questionsTitle}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6b7c93]">{copy.questionsInstruction}</p>
              <div className="mt-4 flex flex-col gap-2">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const disabled = isLoading || !municipioCodIbge || (action.requiresDimension && normalizedIndicatorIds.length === 0);
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => executeAction(action)}
                      disabled={disabled}
                      title={copy.questions[action.id]}
                      className="flex items-center gap-3 rounded-xl border border-[#dce6f4] bg-[#fbfdff] px-4 py-3 text-left text-sm font-medium leading-relaxed text-[#334967] transition-colors hover:border-[#a9c8e7] hover:bg-[#f2f8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading && activeAction === action.id ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-[#247dc5]" aria-hidden="true" /> : <Icon className="h-5 w-5 shrink-0 text-[#247dc5]" aria-hidden="true" />}
                      <span>{copy.questions[action.id]}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="min-w-0" aria-live="polite">
              {isLoading && (
                <div role="status" className="flex items-center gap-3 rounded-xl border border-[#d7e4f5] bg-[#f7fbff] px-4 py-3 text-sm text-[#425a78]">
                  <LoaderCircle className="h-5 w-5 animate-spin text-[#247dc5]" aria-hidden="true" />{copy.consulting}
                </div>
              )}
              {error && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#f0c4be] bg-[#fff5f3] px-4 py-3 text-sm leading-relaxed text-[#9f2d20]">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><span>{error}</span>
                </div>
              )}
              {!isLoading && !error && !answer && (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbdced] bg-[#fbfdff] px-6 text-center text-[#60748e]">
                  <BarChart3 className="mb-3 h-9 w-9 text-[#79a9d2]" aria-hidden="true" />
                  <p className="max-w-md text-sm leading-relaxed">{copy.questionsInstruction}</p>
                </div>
              )}
              {answer && (
                <article aria-labelledby="municipal-assistant-answer-title" className="rounded-2xl border border-[#dce6f4] bg-[#fbfdff] p-5">
                  <h3 id="municipal-assistant-answer-title" className="flex items-center gap-2 text-lg font-bold text-[#1f2d3d]">
                    <Sparkles className="h-5 w-5 text-[#247dc5]" aria-hidden="true" />{copy.answer}
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334967]">{answer.resposta}</p>

                  {comparisonSections.length > 0 && (
                    <div className="mt-5 grid gap-4">
                      {comparisonSections.map((section) => (
                        <section
                          key={section.codigo}
                          aria-labelledby={`municipal-assistant-comparison-${section.codigo}`}
                          className="rounded-xl border border-[#dce6f4] bg-white p-4"
                        >
                          <h4 id={`municipal-assistant-comparison-${section.codigo}`} className="text-sm font-bold uppercase tracking-[0.05em] text-[#315f8d]">
                            {section.titulo}
                          </h4>
                          <ul className="mt-3 space-y-2">
                            {(Array.isArray(section.itens) ? section.itens : []).map((item) => (
                              <li key={`${section.codigo}-${item.municipio_cod_ibge}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f7faff] px-3 py-2 text-sm text-[#334967]">
                                <span className="flex flex-wrap items-center gap-2">
                                  <strong>{item.municipio_nome}/{item.estado_sigla}</strong>
                                  {item.atual && <span className="rounded-full bg-[#dceefe] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#24679f]">{copy.currentMunicipality}</span>}
                                </span>
                                <span className="font-semibold text-[#315f8d]">
                                  {Number.isFinite(item.pontuacao) ? `${item.pontuacao} ${copy.points}` : copy.noScore}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  )}

                  {challengeSections.length > 0 && (
                    <div className="mt-5 grid gap-4">
                      {challengeSections.map((section) => (
                        <section
                          key={section.codigo}
                          aria-labelledby={`municipal-assistant-${section.codigo}`}
                          className="rounded-xl border border-[#dce6f4] bg-white p-4"
                        >
                          <h4 id={`municipal-assistant-${section.codigo}`} className="text-sm font-bold uppercase tracking-[0.05em] text-[#315f8d]">
                            {section.titulo}
                          </h4>
                          <ol className="mt-3 space-y-2">
                            {(Array.isArray(section.itens) ? section.itens : []).map((item, index) => (
                              <li key={`${section.codigo}-${item.id}`} className="flex items-start gap-3 text-sm leading-relaxed text-[#334967]">
                                <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#eef5fc] text-xs font-bold text-[#247dc5]">
                                  {index + 1}
                                </span>
                                <span>
                                  <strong>{item.nome || `Indicador ${item.id}`}</strong>
                                  {` — ${copy.levelLabels[Number(item.nivel)] || `${copy.level} ${item.nivel}/7`}.`}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </section>
                      ))}
                    </div>
                  )}

                  {limitations.length > 0 && (
                    <section aria-labelledby="municipal-assistant-limitations-title" className="mt-5 rounded-xl border border-[#eadfbd] bg-[#fffaf0] p-4">
                      <h4 id="municipal-assistant-limitations-title" className="flex items-center gap-2 text-sm font-bold text-[#71571f]"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{copy.limitations}</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#715f3b]">{limitations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                    </section>
                  )}
                </article>
              )}
            </div>
          </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default MunicipalAssistant;

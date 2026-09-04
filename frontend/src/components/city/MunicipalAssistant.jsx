import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  FileText,
  LoaderCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ASSISTANT_COPY = {
  pt: {
    htmlLanguage: "pt-BR",
    dimensionNames: {
      d1: "Caracterização",
      economica: "Econômica",
      meio_ambiente: "Meio Ambiente",
      sociocultural: "Sociocultural",
      capacidades_institucionais: "Capacidades Institucionais",
    },
    assistantTitle: "Assistente municipal",
    openAssistant: "Abrir assistente municipal",
    closeAssistant: "Fechar assistente municipal",
    experimentalBadge: "IA experimental",
    description: (city, dimension) =>
      `Pergunte sobre os indicadores de ${city || "este município"}${
        dimension ? ` na dimensão ${dimension}` : ""
      }.`,
    suggestionsTitle: "Perguntas sugeridas",
    suggestionsInstruction:
      "Selecione uma sugestão para preencher o campo. O envio só ocorre ao confirmar.",
    dimensionSuggestion: (dimension) =>
      `Explique a metodologia dos indicadores da dimensão ${dimension}.`,
    generalMethodologySuggestion: "Explique como os indicadores municipais são calculados.",
    evidenceSuggestion: "Quais dados e anos sustentam o diagnóstico deste município?",
    comparisonSuggestion: "Como este município se compara a municípios semelhantes?",
    questionLabel: "Sua pergunta",
    questionPlaceholder: "Ex.: Como este município se compara a municípios semelhantes?",
    officialDataNotice: "Os dados numéricos vêm das fontes oficiais da plataforma.",
    privacyNotice: "Não inclua dados pessoais ou informações sensíveis na pergunta.",
    consulting: "Consultando...",
    submit: "Perguntar",
    analyzing: "Analisando os dados e a metodologia...",
    answerTitle: "Resposta",
    indicatorsUsed: "Indicadores utilizados",
    yearsUsed: "Anos utilizados",
    sourcesTitle: "Fontes",
    limitationsTitle: "Limitações",
    sourceFallback: "Fonte consultada",
    requestError: "Não foi possível consultar o assistente.",
    invalidResponse: "O assistente retornou uma resposta inválida.",
  },
  en: {
    htmlLanguage: "en",
    dimensionNames: {
      d1: "Characterization",
      economica: "Economic",
      meio_ambiente: "Environment",
      sociocultural: "Sociocultural",
      capacidades_institucionais: "Institutional Capacities",
    },
    assistantTitle: "Municipal assistant",
    openAssistant: "Open municipal assistant",
    closeAssistant: "Close municipal assistant",
    experimentalBadge: "Experimental AI",
    description: (city, dimension) =>
      `Ask about the indicators for ${city || "this municipality"}${
        dimension ? ` in the ${dimension} dimension` : ""
      }.`,
    suggestionsTitle: "Suggested questions",
    suggestionsInstruction:
      "Select a suggestion to fill in the field. It will only be sent when you confirm.",
    dimensionSuggestion: (dimension) =>
      `Explain the methodology for the indicators in the ${dimension} dimension.`,
    generalMethodologySuggestion: "Explain how municipal indicators are calculated.",
    evidenceSuggestion: "Which data and years support this municipality's diagnosis?",
    comparisonSuggestion: "How does this municipality compare with similar municipalities?",
    questionLabel: "Your question",
    questionPlaceholder: "E.g.: How does this municipality compare with similar municipalities?",
    officialDataNotice: "Numerical data comes from the platform's official sources.",
    privacyNotice: "Do not include personal data or sensitive information in your question.",
    consulting: "Consulting...",
    submit: "Ask",
    analyzing: "Analyzing the data and methodology...",
    answerTitle: "Answer",
    indicatorsUsed: "Indicators used",
    yearsUsed: "Years used",
    sourcesTitle: "Sources",
    limitationsTitle: "Limitations",
    sourceFallback: "Source consulted",
    requestError: "The assistant could not be reached.",
    invalidResponse: "The assistant returned an invalid response.",
  },
  es: {
    htmlLanguage: "es",
    dimensionNames: {
      d1: "Caracterización",
      economica: "Económica",
      meio_ambiente: "Medio Ambiente",
      sociocultural: "Sociocultural",
      capacidades_institucionais: "Capacidades Institucionales",
    },
    assistantTitle: "Asistente municipal",
    openAssistant: "Abrir asistente municipal",
    closeAssistant: "Cerrar asistente municipal",
    experimentalBadge: "IA experimental",
    description: (city, dimension) =>
      `Pregunta sobre los indicadores de ${city || "este municipio"}${
        dimension ? ` en la dimensión ${dimension}` : ""
      }.`,
    suggestionsTitle: "Preguntas sugeridas",
    suggestionsInstruction:
      "Selecciona una sugerencia para completar el campo. Solo se enviará cuando confirmes.",
    dimensionSuggestion: (dimension) =>
      `Explica la metodología de los indicadores de la dimensión ${dimension}.`,
    generalMethodologySuggestion: "Explica cómo se calculan los indicadores municipales.",
    evidenceSuggestion: "¿Qué datos y años respaldan el diagnóstico de este municipio?",
    comparisonSuggestion: "¿Cómo se compara este municipio con municipios similares?",
    questionLabel: "Tu pregunta",
    questionPlaceholder: "Ej.: ¿Cómo se compara este municipio con municipios similares?",
    officialDataNotice: "Los datos numéricos provienen de las fuentes oficiales de la plataforma.",
    privacyNotice: "No incluyas datos personales ni información sensible en tu pregunta.",
    consulting: "Consultando...",
    submit: "Preguntar",
    analyzing: "Analizando los datos y la metodología...",
    answerTitle: "Respuesta",
    indicatorsUsed: "Indicadores utilizados",
    yearsUsed: "Años utilizados",
    sourcesTitle: "Fuentes",
    limitationsTitle: "Limitaciones",
    sourceFallback: "Fuente consultada",
    requestError: "No se pudo consultar al asistente.",
    invalidResponse: "El asistente devolvió una respuesta no válida.",
  },
  fr: {
    htmlLanguage: "fr",
    dimensionNames: {
      d1: "Caractérisation",
      economica: "Économique",
      meio_ambiente: "Environnement",
      sociocultural: "Socioculturelle",
      capacidades_institucionais: "Capacités institutionnelles",
    },
    assistantTitle: "Assistant municipal",
    openAssistant: "Ouvrir l'assistant municipal",
    closeAssistant: "Fermer l'assistant municipal",
    experimentalBadge: "IA expérimentale",
    description: (city, dimension) =>
      `Posez une question sur les indicateurs de ${city || "cette municipalité"}${
        dimension ? ` dans la dimension ${dimension}` : ""
      }.`,
    suggestionsTitle: "Questions suggérées",
    suggestionsInstruction:
      "Sélectionnez une suggestion pour remplir le champ. Elle ne sera envoyée qu'après confirmation.",
    dimensionSuggestion: (dimension) =>
      `Expliquez la méthodologie des indicateurs de la dimension ${dimension}.`,
    generalMethodologySuggestion: "Expliquez comment les indicateurs municipaux sont calculés.",
    evidenceSuggestion: "Quelles données et quelles années étayent le diagnostic de cette municipalité ?",
    comparisonSuggestion: "Comment cette municipalité se compare-t-elle à des municipalités similaires ?",
    questionLabel: "Votre question",
    questionPlaceholder:
      "Ex. : Comment cette municipalité se compare-t-elle à des municipalités similaires ?",
    officialDataNotice: "Les données numériques proviennent des sources officielles de la plateforme.",
    privacyNotice: "N'incluez pas de données personnelles ni d'informations sensibles dans votre question.",
    consulting: "Consultation en cours...",
    submit: "Poser la question",
    analyzing: "Analyse des données et de la méthodologie...",
    answerTitle: "Réponse",
    indicatorsUsed: "Indicateurs utilisés",
    yearsUsed: "Années utilisées",
    sourcesTitle: "Sources",
    limitationsTitle: "Limites",
    sourceFallback: "Source consultée",
    requestError: "Impossible de consulter l'assistant.",
    invalidResponse: "L'assistant a renvoyé une réponse non valide.",
  },
};

const buildSuggestedQuestions = (copy, dimensionTitle) => [
  dimensionTitle
    ? copy.dimensionSuggestion(dimensionTitle)
    : copy.generalMethodologySuggestion,
  copy.evidenceSuggestion,
  copy.comparisonSuggestion,
];

const getSourceData = (source, fallbackTitle) => {
  if (typeof source === "string") {
    return { title: source, reference: "" };
  }

  return {
    title: String(source?.titulo || source?.referencia || fallbackTitle),
    reference: String(source?.referencia || ""),
  };
};

const isExternalUrl = (value) => /^https?:\/\//i.test(value);

const MunicipalAssistant = ({
  municipioCodIbge,
  cityName,
  dimensionCode = null,
  dimensionTitle = null,
  language = "pt",
}) => {
  const resolvedLanguage = Object.prototype.hasOwnProperty.call(ASSISTANT_COPY, language)
    ? language
    : "pt";
  const copy = ASSISTANT_COPY[resolvedLanguage];
  const localizedDimensionTitle = copy.dimensionNames[dimensionCode] || dimensionTitle;
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const requestControllerRef = useRef(null);
  const suggestedQuestions = buildSuggestedQuestions(copy, localizedDimensionTitle);

  useEffect(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setQuestion("");
    setAnswer(null);
    setError("");
    setIsLoading(false);
  }, [municipioCodIbge, dimensionCode, resolvedLanguage]);

  useEffect(
    () => () => {
      requestControllerRef.current?.abort();
    },
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3 || !municipioCodIbge || isLoading) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    setIsLoading(true);
    setError("");
    setAnswer(null);

    try {
      const response = await fetch("/api/assistente/perguntar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta: trimmedQuestion,
          contexto: {
            municipio_cod_ibge: municipioCodIbge,
            dimensao_codigo: dimensionCode || null,
            idioma: resolvedLanguage,
          },
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (controller.signal.aborted || requestControllerRef.current !== controller) {
        return;
      }

      if (!response.ok) {
        const backendError = typeof data?.error === "string" && data.error.trim()
          ? data.error
          : copy.requestError;
        throw new Error(backendError);
      }

      if (typeof data?.resposta !== "string" || !data.resposta.trim()) {
        throw new Error(copy.invalidResponse);
      }

      setAnswer(data);
    } catch (requestError) {
      if (requestError?.name === "AbortError") return;
      setError(requestError?.message || copy.requestError);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const indicators = Array.isArray(answer?.indicadores_utilizados)
    ? answer.indicadores_utilizados
    : [];
  const years = Array.isArray(answer?.anos_utilizados) ? answer.anos_utilizados : [];
  const sources = Array.isArray(answer?.fontes) ? answer.fontes : [];
  const limitations = Array.isArray(answer?.limitacoes) ? answer.limitacoes : [];
  const canSubmit = Boolean(question.trim().length >= 3 && municipioCodIbge && !isLoading);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          lang={copy.htmlLanguage}
          aria-label={copy.openAssistant}
          title={copy.openAssistant}
          className="notranslate fixed bottom-5 right-5 z-[145] inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#247dc5] text-white shadow-[0_8px_28px_rgba(20,71,113,0.38)] transition hover:scale-105 hover:bg-[#1c68a6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8cc8f4] focus-visible:ring-offset-2 active:scale-95 sm:bottom-7 sm:right-7"
        >
          <Bot className="h-8 w-8" aria-hidden="true" />
          <span className="absolute right-0 top-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#f4b740] text-[#18324d]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[150] bg-[#10243d]/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          lang={copy.htmlLanguage}
          className="notranslate fixed left-1/2 top-1/2 z-[151] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-[#dce6f4] bg-white shadow-[0_24px_80px_rgba(9,30,54,0.3)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
      <header className="border-b border-[#e3eaf4] bg-gradient-to-r from-[#f2f8ff] to-[#f4fbfd] px-6 py-5 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#247dc5] text-white shadow-sm">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DialogPrimitive.Title
                className="pr-8 text-xl font-bold text-[#1f2d3d] sm:text-2xl"
              >
                {copy.assistantTitle}
              </DialogPrimitive.Title>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#bed8ef] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#286da8]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.experimentalBadge}
              </span>
            </div>
            <DialogPrimitive.Description className="mt-1 pr-8 text-sm leading-relaxed text-[#526782]">
              {copy.description(cityName, localizedDimensionTitle)}
            </DialogPrimitive.Description>
          </div>
        </div>
        <DialogPrimitive.Close
          aria-label={copy.closeAssistant}
          title={copy.closeAssistant}
          className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#526782] transition-colors hover:bg-white hover:text-[#1f2d3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] sm:right-7"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 sm:p-8 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.28fr)]">
        <aside aria-labelledby="municipal-assistant-suggestions-title">
          <h3
            id="municipal-assistant-suggestions-title"
            className="text-sm font-bold uppercase tracking-[0.06em] text-[#405979]"
          >
            {copy.suggestionsTitle}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#6b7c93]">
            {copy.suggestionsInstruction}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {suggestedQuestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuestion(suggestion)}
                disabled={isLoading}
                className="rounded-xl border border-[#dce6f4] bg-[#fbfdff] px-4 py-3 text-left text-sm font-medium leading-relaxed text-[#334967] transition-colors hover:border-[#a9c8e7] hover:bg-[#f2f8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb6ff] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <form onSubmit={handleSubmit} aria-busy={isLoading}>
            <label
              htmlFor="municipal-assistant-question"
              className="text-sm font-semibold text-[#1f2d3d]"
            >
              {copy.questionLabel}
            </label>
            <Textarea
              id="municipal-assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              minLength={3}
              maxLength={600}
              placeholder={copy.questionPlaceholder}
              disabled={isLoading || !municipioCodIbge}
              className="mt-2 min-h-[112px] resize-y border-[#cfdceb] bg-white text-[#1f2d3d] focus-visible:ring-[#3d84d8]"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-xs leading-relaxed text-[#6b7c93]">
                <p>{copy.officialDataNotice}</p>
                <p>{copy.privacyNotice}</p>
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="bg-[#247dc5] text-white hover:bg-[#1c68a6]"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    {copy.consulting}
                  </>
                ) : (
                  <>
                    <Send aria-hidden="true" />
                    {copy.submit}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-5" aria-live="polite">
            {isLoading && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-xl border border-[#d7e4f5] bg-[#f7fbff] px-4 py-3 text-sm text-[#425a78]"
              >
                <LoaderCircle className="h-5 w-5 animate-spin text-[#247dc5]" aria-hidden="true" />
                {copy.analyzing}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-[#f0c4be] bg-[#fff5f3] px-4 py-3 text-sm leading-relaxed text-[#9f2d20]"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {answer && (
              <article
                aria-labelledby="municipal-assistant-answer-title"
                className="rounded-2xl border border-[#dce6f4] bg-[#fbfdff] p-5"
              >
                <h3
                  id="municipal-assistant-answer-title"
                  className="flex items-center gap-2 text-lg font-bold text-[#1f2d3d]"
                >
                  <Sparkles className="h-5 w-5 text-[#247dc5]" aria-hidden="true" />
                  {copy.answerTitle}
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334967]">
                  {answer.resposta}
                </p>

                {(indicators.length > 0 || years.length > 0) && (
                  <dl className="mt-5 grid gap-4 border-t border-[#e2eaf3] pt-4 sm:grid-cols-2">
                    {indicators.length > 0 && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.05em] text-[#60748e]">
                          {copy.indicatorsUsed}
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {indicators.map((indicator) => (
                            <span
                              key={String(indicator)}
                              className="rounded-full border border-[#c9dcef] bg-white px-2.5 py-1 text-xs font-semibold text-[#315f8d]"
                            >
                              {String(indicator)}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {years.length > 0 && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.05em] text-[#60748e]">
                          {copy.yearsUsed}
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {years.map((year) => (
                            <span
                              key={String(year)}
                              className="rounded-full border border-[#c9dcef] bg-white px-2.5 py-1 text-xs font-semibold text-[#315f8d]"
                            >
                              {String(year)}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                {sources.length > 0 && (
                  <section aria-labelledby="municipal-assistant-sources-title" className="mt-5">
                    <h4
                      id="municipal-assistant-sources-title"
                      className="flex items-center gap-2 text-sm font-bold text-[#1f2d3d]"
                    >
                      <FileText className="h-4 w-4 text-[#247dc5]" aria-hidden="true" />
                      {copy.sourcesTitle}
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {sources.map((source, index) => {
                        const { title, reference } = getSourceData(source, copy.sourceFallback);

                        return (
                          <li
                            key={`${title}-${reference}-${index}`}
                            className="rounded-lg border border-[#e1e9f2] bg-white px-3 py-2 text-sm text-[#425a78]"
                          >
                            {isExternalUrl(reference) ? (
                              <a
                                href={reference}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-[#236da9] underline-offset-2 hover:underline"
                              >
                                {title}
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              </a>
                            ) : (
                              <>
                                <span className="font-semibold text-[#334967]">{title}</span>
                                {reference && <span className="mt-0.5 block text-xs">{reference}</span>}
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {limitations.length > 0 && (
                  <section
                    aria-labelledby="municipal-assistant-limitations-title"
                    className="mt-5 rounded-xl border border-[#ead9ae] bg-[#fffbef] px-4 py-3"
                  >
                    <h4
                      id="municipal-assistant-limitations-title"
                      className="flex items-center gap-2 text-sm font-bold text-[#72571b]"
                    >
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      {copy.limitationsTitle}
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#725f32]">
                      {limitations.map((limitation, index) => (
                        <li key={`${String(limitation)}-${index}`}>{String(limitation)}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </article>
            )}
          </div>
        </div>
      </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default MunicipalAssistant;

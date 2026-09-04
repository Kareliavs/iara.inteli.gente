import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, FilePenLine, LoaderCircle, LogOut, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearCityHallAuth, logoutCityHall } from "@/lib/cityHallAuth";

const questionSourceSections = [
  {
    id: 1,
    title: "Saúde e infraestrutura",
    description: "Telemedicina, água e energia",
    questions: [
      {
        id: 1,
        text: "O município disponibiliza serviços de telemedicina ou telessaúde?",
        options: [
          "Educação a distância em saúde",
          "Atividades de pesquisa a distância",
          "Monitoramento remoto de pacientes",
          "Serviços de teleconsultoria",
          "Serviços de segunda opinião formativa",
          "Serviços de telediagnóstico",
        ],
      },
      {
        id: 2,
        text: "Há no município soluções em tecnologia para gestão da distribuição e do consumo de água?",
        options: [
          "Central de gerenciamento da telemedição",
          "Sistema de detecção de vazamento de água",
          "Aplicativo para acompanhamento do consumo de água",
        ],
      },
      {
        id: 3,
        text: "Há no município soluções em tecnologia para gestão da distribuição e do consumo de energia?",
        options: [
          "Central de gerenciamento da telemedição",
          "Sistema de detecção de perda de energia",
          "Aplicativo para acompanhamento do consumo de energia",
          "Sistema de iluminação conectado a uma rede de comunicação (alteração da intensidade da luz a distância)",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Segurança, mobilidade e ambiente",
    description: "Monitoramento e soluções urbanas",
    questions: [
      {
        id: 4,
        text: "Há no município soluções de monitoramento voltadas à segurança pública?",
        options: [
          "Sistema de videomonitoramento (câmera de monitoramento, câmera inteligente ou câmera OCR para análise de imagem)",
          "Sistema de monitoramento por sensores (sensores de ruído de tiro ou sensor de invasão)",
          "Sistemas de videomonitoramento integrado",
          "Sistemas de monitoramento por GPS (localização de viaturas etc.)",
          "Drones",
        ],
      },
      {
        id: 5,
        text: "Há no município serviços disponibilizados para o compartilhamento de viagens?",
        options: [
          "Serviços de compartilhamento de bicicletas",
          "Serviços de compartilhamento de veículos",
          "Serviços de compartilhamento de veículos elétricos",
          "Aplicativos de compartilhamento oferecidos por iniciativas privadas",
        ],
      },
      {
        id: 6,
        text: "Há no município soluções para o monitoramento da quantidade de emissões de gases de efeito estufa e da qualidade do ar?",
        options: [
          "Para medir Partículas Totais em Suspensão (PTS)",
          "Para medir Partículas Inaláveis < 10 µm (PM10)",
          "Para medir Partículas Inaláveis < 2,5 µm (PM2,5)",
          "Para medir Monóxido de Carbono (CO)",
          "Para medir Dióxido de Enxofre (SO2)",
          "Para medir Óxidos de Nitrogênio (NOx)",
          "Para medição de Monóxido de Nitrogênio (NO)",
          "Para medição de Dióxido de Nitrogênio (NO2)",
          "Para medição de Ozônio (O3)",
          "Para medição de Hidrocarbonetos Totais (HCT)",
          "Para medição de Hidrocarbonetos, exceto Metano (HCnM)",
          "Para medição de Metano (CH4)",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Serviços e monitoramento",
    description: "Iluminação, transporte e qualidade do ar",
    questions: [
      {
        id: 7,
        text: "O município disponibiliza soluções em telegestão para iluminação pública?",
        options: [
          "Possui iluminação pública por telegestão e atende parte da cidade",
          "Possui iluminação pública por telegestão e atende toda a cidade",
        ],
      },
      {
        id: 8,
        text: "O município disponibiliza informações sobre o transporte público em tempo real?",
        options: [
          "Site da prefeitura",
          "Por meio de aplicativo próprio",
          "Painel de informação em pontos de ônibus e/ou terminal",
          "Por parceiros (Moovit, Google e outros)",
        ],
      },
      {
        id: 9,
        text: "Quais ações o município realiza para o monitoramento da qualidade do ar?",
        options: [
          "Monitora as informações e medições de fumaça",
          "Monitora as informações sobre direção e velocidade do vento",
          "Monitora as informações sobre a temperatura do ar",
          "Monitora as informações sobre precipitação pluviométrica",
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Cultura e saúde digital",
    description: "Serviços culturais e de saúde",
    questions: [
      {
        id: 10,
        text: "Quais são os serviços culturais on-line disponibilizados pela prefeitura para as instituições, promotores e fazedores de cultura?",
        options: [
          "Serviços para informações sobre editais de captação de recursos culturais governamentais",
          "Serviços para participar de editais de captação de recursos culturais governamentais",
          "Serviços de prestação de contas de projetos culturais com o governo",
          "Serviços para informações e inscrições em conferências e audiências públicas sobre cultura",
          "Serviços para informações ou obtenção de licenças e permissões culturais",
          "Serviços para cadastrar a instituição em sistemas de informação ou mapeamento cultural",
        ],
      },
      {
        id: 11,
        text: "O município disponibiliza, nos estabelecimentos de saúde, informações clínicas e cadastrais de pacientes em prontuários de formato eletrônico?",
        options: [
          "Disponibiliza em parte dos estabelecimentos de saúde",
          "Disponibiliza em todos os estabelecimentos de saúde",
        ],
      },
      {
        id: 12,
        text: "Quais serviços são oferecidos aos pacientes, via internet, nos estabelecimentos de saúde do município?",
        options: [
          "Agendamento de consultas",
          "Agendamento de exames",
          "Visualização de resultados de exames",
          "Visualização de prontuários",
          "Interação com equipe médica",
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Capacitação e cidade inteligente",
    description: "Formação, plataforma e resíduos",
    questions: [
      {
        id: 13,
        text: "A prefeitura disponibiliza espaços para capacitação tecnológica?",
        options: [
          "Espaços de formação para informática básica",
          "Espaços de formação para economia criativa",
          "Espaços de formação para tecnologia da informação",
          "Espaços de formação para robótica e programação",
          "Espaços de formação para trabalho e empreendedorismo",
          "Espaços de formação com parcerias público-privadas",
          "Espaços de formação via telecentro",
        ],
      },
      {
        id: 14,
        text: "Existe na prefeitura plataforma integrada para cidade inteligente?",
        options: [
          "Sim, existe na prefeitura plataforma integrada para cidade inteligente em planejamento",
          "Sim, existe na prefeitura plataforma integrada para cidade inteligente em implementação",
          "Sim, existe na prefeitura plataforma integrada para cidade inteligente implementada",
        ],
      },
      {
        id: 15,
        text: "Existem soluções para otimização da coleta de resíduos no município?",
        options: [
          "Existe sistema de monitoramento de rejeitos em lixeiras públicas",
          "Existe sistema de acompanhamento das rotas para coleta via GPS",
          "Existem sistemas de gestão da coleta de resíduos",
          "Existem aplicativos para informações sobre descarte e fluxo de resíduos",
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Serviços e prioridades",
    description: "Cultura e áreas prioritárias",
    questions: [
      {
        id: 16,
        text: "Quais serviços culturais on-line são oferecidos pela prefeitura?",
        options: [
          "Oferece programação das atividades culturais",
          "Oferece informações sobre as atividades culturais",
          "Oferece divulgação de notícias sobre cultura",
          "Oferece publicações e estudos",
          "Oferece catálogos de acervos (biblioteca)",
          "Disponibiliza ferramenta de transmissão de vídeos ao vivo/streaming",
          "Disponibiliza visita virtual aos equipamentos e acervos culturais",
          "Disponibiliza recurso de acessibilidade digital",
        ],
      },
      {
        id: 17,
        text: "Em relação às tecnologias de informação e comunicação na gestão municipal, quais são as áreas em que a incorporação de tecnologia é considerada prioridade para a atual gestão municipal?",
        options: [
          "Assistência Social",
          "Cultura",
          "Desenvolvimento Econômico e Inovação",
          "Educação",
          "Gestão",
          "Meio Ambiente",
          "Obras e Infraestrutura",
          "Planejamento Urbano",
          "Saúde",
          "Segurança",
          "Transporte",
          "Turismo",
        ],
      },
    ],
  },
  {
    id: 7,
    title: "Planejamento de TIC",
    description: "Documentos e infraestrutura",
    questions: [
      {
        id: 18,
        text: "Quais são os documentos existentes na prefeitura que apresentam ações de incorporação de tecnologias de informação e comunicação na gestão municipal para a transformação digital?",
        options: [
          "Plano diretor",
          "Plano diretor de tecnologia da informação",
          "Leis orçamentárias (PPA, LDO, LOA)",
          "Lei de Acesso à Informação (LAI)",
          "Plano estratégico para cidades inteligentes",
          "Não há ações previstas em instrumentos de planejamento",
        ],
      },
      {
        id: 19,
        text: "Quais atividades de planejamento foram realizadas pela prefeitura para o planejamento da infraestrutura de TIC?",
        options: [
          "Levantamento das prioridades, por área, para investimento em TIC",
          "Identificação da infraestrutura e dos recursos de TI necessários para expansão",
          "Planejamento do uso de tecnologias avançadas, como IoT, IA, Machine Learning e Big Data",
          "Participação de outros atores no mercado de oferta de soluções tecnológicas",
          "Não realiza atividades",
        ],
      },
    ],
  },
  {
    id: 8,
    title: "Governança digital",
    description: "Acompanhamento e responsáveis",
    questions: [
      {
        id: 20,
        text: "Quem são os envolvidos no planejamento e acompanhamento de ações para uso de tecnologias de informação e comunicação na gestão municipal?",
        options: [
          "Governo Municipal",
          "Governo Estadual",
          "Governo Federal",
          "Setor privado",
          "Sociedade civil organizada",
          "Cidadãos (indivíduos)",
          "Universidades e institutos de pesquisa",
          "Câmara dos Vereadores",
          "Ecossistema de inovação local",
          "Agências de fomento públicas",
          "Financiadores privados",
          "Organismos internacionais",
          "Consultoria privada contratada",
          "Não existe",
        ],
      },
      {
        id: 21,
        text: "Como é feito o acompanhamento da incorporação de tecnologias da informação e comunicação na gestão municipal?",
        options: [
          "Por meio de processo de formulação dos planos e/ou metas",
          "Por meio de processos digitalizados disponíveis",
          "Com dados de planejamento disponíveis e indicadores de implementação",
          "Há uma avaliação dos resultados do processo de formulação dos planos e/ou metas",
          "Não há acompanhamento da incorporação de TICs",
        ],
      },
      {
        id: 22,
        text: "Quem são os responsáveis pela governança das tecnologias de informação e comunicação incorporadas à gestão municipal?",
        options: [
          "Secretaria ou departamento da gestão municipal",
          "Conselho da cidade",
          "Comitê específico constituído",
          "Consultoria privada e/ou terceirizada",
          "Não há responsável",
        ],
      },
    ],
  },
  {
    id: 9,
    title: "Estrutura e governança de TI",
    description: "Equipe, infraestrutura e práticas",
    questions: [
      {
        id: 23,
        text: "Como é a infraestrutura de TI no município?",
        options: [
          "Existe pelo menos uma pessoa articulando a elaboração de planos de TI",
          "Existe pessoal técnico qualificado, em alguma área da prefeitura, para elaborar planos de TI",
          "Existe departamento, setor ou área responsável pela infraestrutura de TI no município",
          "Não existe",
        ],
      },
      {
        id: 24,
        text: "Qual é o tamanho da equipe de TI na prefeitura?",
        options: [
          "De 1 a 5 funcionários",
          "De 6 a 10 funcionários",
          "De 11 a 15 funcionários",
          "Acima de 16 funcionários",
          "Não existe equipe de TI",
        ],
      },
      {
        id: 25,
        text: "Quais práticas de governança de TI são adotadas pela prefeitura?",
        options: [
          "Existem práticas comuns em relação ao uso da TI nas áreas da prefeitura",
          "As práticas comuns são padronizadas em relação ao uso da TI nas áreas da prefeitura",
          "Os processos são formalizados para contratação e gestão de serviços de TI",
          "Há acordos de nível de serviço com usuários internos e com fornecedores externos",
          "A área de TI aprimora continuamente seus processos de gestão, desenvolvimento e padronização e busca atualizar a tecnologia e incorporá-la a seus serviços",
          "Não adota nenhuma prática",
        ],
      },
    ],
  },
  {
    id: 10,
    title: "Dados e segurança",
    description: "Armazenamento e proteção",
    questions: [
      {
        id: 26,
        text: "Onde ficam armazenados os dados e sistemas da prefeitura?",
        options: [
          "Data center próprio",
          "Nuvem (própria, terceirizada ou híbrida)",
          "Servidor próprio",
          "Armazenados em computadores da prefeitura conectados em rede",
          "Armazenados em computadores da prefeitura não conectados em rede",
          "Armazenados em computadores pessoais",
          "Dados estão em arquivo físico em papel",
          "Não existem sistemas de armazenagem de dados",
        ],
      },
      {
        id: 27,
        text: "Quais são as práticas de segurança dos dados do município?",
        options: [
          "Assinatura eletrônica ou digital em documentos",
          "Certificados digitais para transações ou pagamentos",
          "Suprimento de energia aos servidores centrais",
          "Backup",
          "Programas para identificação de invasões, vírus e spam",
          "Controle dos softwares instalados nas estações de trabalho dos usuários",
          "Senha para acesso à rede e aplicações",
          "Restrição de acesso físico aos servidores centrais",
          "Nenhuma prática",
        ],
      },
    ],
  },
  {
    id: 11,
    title: "Integração e transparência",
    description: "Gestão da informação e monitoramento",
    questions: [
      {
        id: 28,
        text: "Como é a gestão integrada de informação na prefeitura?",
        options: [
          "Há sistemas que operam de forma vertical em todas as secretarias da prefeitura",
          "Há sistemas que operam de forma vertical em uma ou mais secretarias da prefeitura",
          "Há compartilhamento e integração de sistemas entre as secretarias da prefeitura, que permitem prestação de serviços em conjunto",
          "Há sistemas que operam de forma interoperável e transversal entre secretarias, que permitem prestação de serviços em conjunto",
          "Há uma plataforma que integra os sistemas e funciona como facilitadora de soluções colaborativas e participativas entre a gestão municipal e os munícipes",
          "Não existe integração de serviços entre as secretarias",
        ],
      },
      {
        id: 29,
        text: "Como as informações de monitoramento são disponibilizadas?",
        options: [
          "Os resultados do monitoramento e da avaliação são parcialmente disponibilizados ao público em portal ou outro meio digital pela prefeitura",
          "Os resultados do monitoramento e da avaliação são totalmente disponibilizados ao público em portal ou outro meio digital pela prefeitura",
          "Os resultados do monitoramento e da avaliação são totalmente disponibilizados ao público em portal ou outro meio digital pela prefeitura, em tempo real, de modo aberto e que permita o acompanhamento pelo cidadão",
          "Não são disponibilizados ao público",
        ],
      },
    ],
  },
];

const questionsById = new Map(
  questionSourceSections
    .flatMap((section) => section.questions)
    .map((question) => [question.id, question]),
);

const sectionDefinitions = [
  {
    id: 1,
    title: "Econômica",
    questionIds: [5, 8, 14],
  },
  {
    id: 2,
    title: "Sociocultural",
    questionIds: [13, 10, 16, 1, 11, 12, 4],
  },
  {
    id: 3,
    title: "Meio Ambiente",
    questionIds: [2, 15, 6, 9, 3, 7],
  },
  {
    id: 4,
    title: "Capacidades Institucionais",
    questionIds: [18, 19, 20, 25, 26, 28, 21, 29, 27],
  },
  {
    id: 5,
    title: "Caracterização Institucional",
    questionIds: [17, 22, 23, 24],
  },
];

const formSections = sectionDefinitions.map(({ questionIds, ...section }) => ({
  ...section,
  questions: questionIds.map((questionId) => questionsById.get(questionId)),
}));

const singleChoiceQuestionIds = new Set([7, 11, 14, 23, 24, 28, 29]);

const totalQuestions = formSections.reduce(
  (total, section) => total + section.questions.length,
  0,
);

const CityHallPostLogin = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [navigationDirection, setNavigationDirection] = useState("forward");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [annualSubmission, setAnnualSubmission] = useState(null);
  const [isCheckingAnnualSubmission, setIsCheckingAnnualSubmission] = useState(true);
  const [annualSubmissionError, setAnnualSubmissionError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const scrollAnimationFrame = useRef(null);

  const activeSection = formSections[currentSection - 1];
  const activeQuestion = activeSection.questions[currentQuestionIndex];
  const isFirstQuestion = currentSection === 1 && currentQuestionIndex === 0;
  const isLastQuestion =
    currentSection === formSections.length &&
    currentQuestionIndex === activeSection.questions.length - 1;
  const activeSelectedOptions = answers[activeQuestion.id] || [];
  const isActiveQuestionSingleChoice = singleChoiceQuestionIds.has(
    activeQuestion.id,
  );
  const answeredQuestions = Object.values(answers).filter(
    (selectedOptions) => selectedOptions.length > 0,
  ).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const getAnsweredQuestionsInSection = (section) =>
    section.questions.filter((question) => (answers[question.id] || []).length > 0)
      .length;

  const loadAnnualSubmission = useCallback(async () => {
    setIsCheckingAnnualSubmission(true);
    setAnnualSubmissionError("");
    try {
      const response = await fetch("/api/formularios/autodeclaracao/atual", {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        clearCityHallAuth();
        navigate("/prefeitura", { replace: true });
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível consultar o formulário deste ano.");
      }
      setAnnualSubmission(data.status === "NAO_PREENCHIDO" ? null : data);
    } catch (error) {
      setAnnualSubmissionError(
        error.message || "Não foi possível consultar o formulário deste ano.",
      );
    } finally {
      setIsCheckingAnnualSubmission(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAnnualSubmission();
  }, [loadAnnualSubmission]);

  useEffect(
    () => () => {
      if (scrollAnimationFrame.current) {
        window.cancelAnimationFrame(scrollAnimationFrame.current);
      }
    },
    [],
  );

  const scrollToQuestionCard = () => {
    if (scrollAnimationFrame.current) {
      window.cancelAnimationFrame(scrollAnimationFrame.current);
    }

    scrollAnimationFrame.current = window.requestAnimationFrame(() => {
      const questionCard = document.getElementById("active-question-card");
      if (!questionCard) {
        scrollAnimationFrame.current = null;
        return;
      }

      const cardTop = questionCard.getBoundingClientRect().top;
      const comfortableViewportLimit = window.innerHeight * 0.35;

      if (cardTop >= 24 && cardTop <= comfortableViewportLimit) {
        scrollAnimationFrame.current = null;
        return;
      }

      const startPosition = window.scrollY;
      const targetPosition = Math.max(0, startPosition + cardTop - 24);
      const distance = targetPosition - startPosition;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, targetPosition);
        scrollAnimationFrame.current = null;
        return;
      }

      const duration = 700;
      const startTime = window.performance.now();

      const animateScroll = (currentTime) => {
        const elapsed = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress =
          elapsed < 0.5
            ? 4 * elapsed * elapsed * elapsed
            : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;

        window.scrollTo(0, startPosition + distance * easedProgress);

        if (elapsed < 1) {
          scrollAnimationFrame.current = window.requestAnimationFrame(animateScroll);
        } else {
          scrollAnimationFrame.current = null;
        }
      };

      scrollAnimationFrame.current = window.requestAnimationFrame(animateScroll);
    });
  };

  const goToSection = (sectionId) => {
    setNavigationDirection(sectionId >= currentSection ? "forward" : "backward");
    setCurrentSection(sectionId);
    setCurrentQuestionIndex(0);
    scrollToQuestionCard();
  };

  const goToQuestion = (questionIndex) => {
    setNavigationDirection(
      questionIndex >= currentQuestionIndex ? "forward" : "backward",
    );
    setCurrentQuestionIndex(questionIndex);
    scrollToQuestionCard();
  };

  const goToNextQuestion = () => {
    setNavigationDirection("forward");

    if (currentQuestionIndex < activeSection.questions.length - 1) {
      setCurrentQuestionIndex((questionIndex) => questionIndex + 1);
    } else if (currentSection < formSections.length) {
      setCurrentSection((section) => section + 1);
      setCurrentQuestionIndex(0);
    }

    scrollToQuestionCard();
  };

  const goToPreviousQuestion = () => {
    setNavigationDirection("backward");

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((questionIndex) => questionIndex - 1);
    } else if (currentSection > 1) {
      const previousSection = formSections[currentSection - 2];
      setCurrentSection((section) => section - 1);
      setCurrentQuestionIndex(previousSection.questions.length - 1);
    }

    scrollToQuestionCard();
  };

  const toggleOption = (questionId, option) => {
    setAnswers((currentAnswers) => {
      if (singleChoiceQuestionIds.has(questionId)) {
        return {
          ...currentAnswers,
          [questionId]: [option],
        };
      }

      const selectedOptions = currentAnswers[questionId] || [];
      const isSelected = selectedOptions.includes(option);

      return {
        ...currentAnswers,
        [questionId]: isSelected
          ? selectedOptions.filter((selectedOption) => selectedOption !== option)
          : [...selectedOptions, option],
      };
    });
  };

  const startEditing = () => {
    const restoredAnswers = {};
    for (const answer of annualSubmission?.respostas || []) {
      const question = questionsById.get(Number(answer.pergunta_id));
      if (!question) continue;
      restoredAnswers[question.id] = (answer.opcoes_selecionadas || [])
        .map((optionIndex) => question.options[Number(optionIndex)])
        .filter(Boolean);
    }
    setAnswers(restoredAnswers);
    setCurrentSection(1);
    setCurrentQuestionIndex(0);
    setNavigationDirection("forward");
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmissionError("");
    setSubmissionResult(null);
    setIsConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    const respostas = formSections.flatMap((section) =>
      section.questions.map((question) => ({
        pergunta_id: question.id,
        opcoes_selecionadas: (answers[question.id] || []).map((option) =>
          question.options.indexOf(option),
        ),
      })),
    );

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/formularios/autodeclaracao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          respostas,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          clearCityHallAuth();
          navigate("/prefeitura", { replace: true });
        }
        throw new Error(data.error || "Não foi possível enviar o formulário.");
      }

      setSubmissionResult(data);
    } catch (error) {
      setSubmissionError(error.message || "Não foi possível enviar o formulário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmationOpenChange = (open) => {
    if (isSubmitting && !open) return;
    setIsConfirmationOpen(open);

    if (!open) {
      const shouldRefreshStatus = Boolean(submissionResult);
      setSubmissionError("");
      setSubmissionResult(null);
      if (shouldRefreshStatus) {
        setIsEditing(false);
        loadAnnualSubmission();
      }
    }
  };

  const handleLogout = async () => {
    await logoutCityHall();
    navigate("/prefeitura", { replace: true });
  };

  if (isCheckingAnnualSubmission) {
    return <AnnualSubmissionLoading onLogout={handleLogout} />;
  }
  if (annualSubmissionError) {
    return (
      <AnnualSubmissionError
        message={annualSubmissionError}
        onLogout={handleLogout}
        onRetry={loadAnnualSubmission}
      />
    );
  }
  if (annualSubmission && !isEditing) {
    return (
      <AnnualSubmissionStatus
        submission={annualSubmission}
        onEdit={startEditing}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="bg-[#f5f8fc]">
      <section className="city-search-hero-gradient py-12 md:py-16">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
              Área da Prefeitura
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-white md:text-5xl">
              {isEditing ? "Editar formulário anual" : "Formulário de autodeclaração"}
            </h1>
            <p className="mt-4 max-w-[780px] text-base leading-relaxed text-white/90 md:text-lg">
              {isEditing
                ? `Revise as respostas de ${annualSubmission.ano} e envie uma nova versão.`
                : "Responda às perguntas de acordo com a realidade do seu município."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/45 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 md:self-end"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
        {isEditing && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#cfe0f7] bg-[#edf4ff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#2f66d0]">
                {annualSubmission.status === "APROVADA"
                  ? "Editando respostas já validadas"
                  : "Corrigindo respostas rejeitadas"}
              </p>
              <p className="mt-1 text-sm text-[#5c6b80]">
                {annualSubmission.status === "APROVADA"
                  ? "Os dados atuais continuam publicados até que a nova versão seja aprovada."
                  : "A nova versão será enviada novamente para validação administrativa."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm font-bold text-[#405169] transition hover:text-[#2f66d0] hover:underline"
            >
              Cancelar edição
            </button>
          </div>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-[0_8px_25px_rgba(39,72,125,0.06)] lg:sticky lg:top-6">
            <div className="border-b border-[#e1e8f2] pb-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2f66d0]">
                    Seu progresso
                  </p>
                  <p className="mt-1 text-sm text-[#6b788c]">
                    {answeredQuestions} de {totalQuestions} respondidas
                  </p>
                </div>
                <span className="text-xl font-extrabold text-[#26364d]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8eef7]"
                role="progressbar"
                aria-label="Progresso do formulário"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="h-full rounded-full bg-[#2f66d0] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <nav aria-label="Etapas do formulário" className="pt-5">
              <ol className="relative space-y-1 before:absolute before:bottom-5 before:left-[15px] before:top-5 before:w-px before:bg-[#d9e3ef]">
                {formSections.map((section) => {
                  const isCurrent = section.id === currentSection;
                  const answeredInSection = getAnsweredQuestionsInSection(section);
                  const isComplete = answeredInSection === section.questions.length;

                  return (
                    <li key={section.id} className="relative">
                      <button
                        type="button"
                        onClick={() => goToSection(section.id)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`group flex w-full items-start gap-3 rounded-xl px-1 py-2 text-left transition-colors ${
                          isCurrent ? "bg-[#f2f7ff]" : "hover:bg-[#f7f9fc]"
                        }`}
                      >
                        <span
                          className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-colors ${
                            isComplete
                              ? "border-[#218653] bg-[#218653] text-white"
                              : isCurrent
                                ? "border-[#2f66d0] bg-[#2f66d0] text-white shadow-[0_0_0_4px_rgba(47,102,208,0.12)]"
                                : "border-[#c8d3e2] bg-white text-[#68778b] group-hover:border-[#8eacd4]"
                          }`}
                        >
                          {isComplete ? (
                            <Check className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            section.id
                          )}
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span
                            className={`block text-sm font-bold leading-snug ${
                              isCurrent ? "text-[#26364d]" : "text-[#536279]"
                            }`}
                          >
                            {section.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-[#7a8799]">
                            {answeredInSection}/{section.questions.length} respondidas
                          </span>
                        </span>
                      </button>

                      {isCurrent && (
                        <ol className="ml-[15px] border-l border-[#9fbaea] pb-2 pl-[30px] pt-1">
                          {section.questions.map((question, questionIndex) => {
                            const isAnswered = (answers[question.id] || []).length > 0;
                            const isActiveQuestion = questionIndex === currentQuestionIndex;

                            return (
                              <li key={question.id} className="relative">
                                <span
                                  aria-hidden="true"
                                  className={`absolute -left-[34px] top-[15px] h-2 w-2 rounded-full border-2 border-white ${
                                    isActiveQuestion
                                      ? "bg-[#2f66d0]"
                                      : isAnswered
                                        ? "bg-[#218653]"
                                        : "bg-[#9ba9bc]"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => goToQuestion(questionIndex)}
                                  aria-current={isActiveQuestion ? "location" : undefined}
                                  className={`w-full rounded-lg px-1 py-1.5 text-left text-xs font-semibold transition ${
                                    isActiveQuestion
                                      ? "bg-[#edf4ff] text-[#2f66d0]"
                                      : "text-[#65748a] hover:bg-[#f5f8fc] hover:text-[#2f66d0]"
                                  }`}
                                >
                                  Pergunta {questionIndex + 1}
                                  <span className="sr-only">
                                    {isAnswered ? " respondida" : " não respondida"}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="mb-6">
              <h2 className="mt-1 text-2xl font-extrabold text-[#26364d] md:text-3xl">
                {activeSection.title}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
                <fieldset
                  key={`${currentSection}-${activeQuestion.id}`}
                  id="active-question-card"
                  className={`scroll-mt-6 rounded-2xl border border-[#dbe5f1] bg-white p-6 shadow-[0_8px_25px_rgba(39,72,125,0.06)] md:p-8 ${
                    navigationDirection === "forward"
                      ? "animate-in fade-in slide-in-from-right-1 duration-500 ease-out motion-reduce:animate-none"
                      : "animate-in fade-in slide-in-from-left-1 duration-500 ease-out motion-reduce:animate-none"
                  }`}
                >
                  <legend className="sr-only">Pergunta {activeQuestion.id}</legend>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-sm font-extrabold text-[#2f66d0]">
                      {activeQuestion.id}
                    </span>
                    <div>
                      <h3 className="text-base font-bold leading-relaxed text-[#2f3e53] md:text-lg">
                        {activeQuestion.text}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-[#7a8799]">
                        {isActiveQuestionSingleChoice
                          ? "Selecione uma única opção."
                          : "Selecione todas as opções aplicáveis."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 md:ml-11">
                    {activeQuestion.options.map((option, optionIndex) => {
                      const optionId = `question-${activeQuestion.id}-option-${optionIndex}`;
                      const isChecked = activeSelectedOptions.includes(option);

                      return (
                        <label
                          key={option}
                          htmlFor={optionId}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition ${
                            isChecked
                              ? "border-[#78a4ee] bg-[#f1f6ff]"
                              : "border-[#dce4ef] bg-white hover:border-[#adc4e6] hover:bg-[#fafcff]"
                          }`}
                        >
                          <input
                            id={optionId}
                            type={isActiveQuestionSingleChoice ? "radio" : "checkbox"}
                            name={
                              isActiveQuestionSingleChoice
                                ? `question-${activeQuestion.id}`
                                : undefined
                            }
                            checked={isChecked}
                            onChange={() => toggleOption(activeQuestion.id, option)}
                            className={`mt-0.5 h-5 w-5 shrink-0 border-[#aebdd0] text-[#2f66d0] focus:ring-[#2f66d0] ${
                              isActiveQuestionSingleChoice ? "rounded-full" : "rounded"
                            }`}
                          />
                          <span className="leading-relaxed text-[#46566c]">
                            <span className="mr-2 font-bold text-[#2f66d0]">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

              <div className="flex flex-col-reverse gap-3 px-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goToPreviousQuestion}
                  disabled={isFirstQuestion}
                  className="inline-flex items-center justify-center px-2 py-2 text-sm font-semibold text-[#68778b] transition-colors hover:text-[#2f66d0] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  &lt; Anterior
                </button>

                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  {isLastQuestion ? (
                    <button
                      type="submit"
                      disabled={answeredQuestions !== totalQuestions}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#218653] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#176d43] focus:outline-none focus:ring-4 focus:ring-[#218653]/20 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Enviar formulário
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      disabled={activeSelectedOptions.length === 0}
                      className="inline-flex items-center justify-center px-2 py-2 text-sm font-semibold text-[#2f66d0] transition-colors hover:text-[#2556b4] focus:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:text-[#9aa7b8]"
                    >
                      Avançar &gt;
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Dialog open={isConfirmationOpen} onOpenChange={handleConfirmationOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-3xl border-[#dbe5f1] bg-white p-0 shadow-[0_24px_70px_rgba(23,48,87,0.24)] sm:max-w-[460px]">
          <div className="p-6 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7f0] text-[#218653]">
              <Check className="h-6 w-6" aria-hidden="true" />
            </div>

            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold leading-snug text-[#26364d] md:text-2xl">
                {submissionResult
                  ? "Formulário enviado com sucesso"
                  : "Confirmar envio do formulário?"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-[#6b788c]">
                {submissionResult ? (
                  <>
                    As respostas foram salvas e aguardam validação administrativa. Protocolo:{" "}
                    <span className="font-bold text-[#405169]">
                      {submissionResult.submissao_id}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Você respondeu {answeredQuestions} de {totalQuestions} perguntas.
                    Após confirmar, elas serão enviadas para análise da equipe administrativa.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {submissionError && (
              <p
                className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-700"
                role="alert"
              >
                {submissionError}
              </p>
            )}

            <DialogFooter className="mt-7 gap-3 sm:space-x-0">
              {submissionResult ? (
                <button
                  type="button"
                  onClick={() => handleConfirmationOpenChange(false)}
                  className="inline-flex items-center justify-center rounded-full bg-[#2f66d0] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2556b4]"
                >
                  Concluir
                </button>
              ) : (
                <>
                  <DialogClose asChild>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-full border border-[#cbd7e6] bg-white px-5 py-3 text-sm font-bold text-[#536279] transition hover:bg-[#f5f8fc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Voltar e revisar
                    </button>
                  </DialogClose>
                  <button
                    type="button"
                    onClick={confirmSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-[#218653] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#176d43] focus:outline-none focus:ring-4 focus:ring-[#218653]/20 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSubmitting ? "Enviando…" : "Confirmar envio"}
                  </button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AnnualHero = ({ description, onLogout, title }) => (
  <section className="city-search-hero-gradient py-12 md:py-16">
    <div className="mx-auto flex max-w-[1300px] flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
          Área da Prefeitura
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-white md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-[780px] text-base leading-relaxed text-white/90 md:text-lg">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/45 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 md:self-end"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair
      </button>
    </div>
  </section>
);

const AnnualSubmissionLoading = ({ onLogout }) => (
  <div className="min-h-screen bg-[#f5f8fc]">
    <AnnualHero
      title="Formulário de autodeclaração"
      description="Consultando a situação do formulário deste ano."
      onLogout={onLogout}
    />
    <div className="flex min-h-[360px] items-center justify-center text-[#2f66d0]">
      <LoaderCircle className="h-9 w-9 animate-spin" aria-label="Consultando formulário anual" />
    </div>
  </div>
);

const AnnualSubmissionError = ({ message, onLogout, onRetry }) => (
  <div className="min-h-screen bg-[#f5f8fc]">
    <AnnualHero
      title="Formulário de autodeclaração"
      description="Não foi possível consultar a situação do formulário."
      onLogout={onLogout}
    />
    <main className="mx-auto max-w-[620px] px-6 py-12 text-center">
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-[0_12px_35px_rgba(39,72,125,0.08)]">
        <XCircle className="mx-auto h-12 w-12 text-red-500" aria-hidden="true" />
        <p className="mt-5 font-semibold text-red-700" role="alert">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2f66d0] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2556b4]"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  </div>
);

const AnnualSubmissionStatus = ({ onEdit, onLogout, submission }) => {
  const statusConfig = {
    APROVADA: {
      description: "As respostas foram validadas e registradas na base definitiva.",
      icon: Check,
      iconStyle: "bg-[#eaf7f0] text-[#218653]",
      title: `O formulário de ${submission.ano} já foi preenchido`,
    },
    PENDENTE: {
      description: "As respostas estão na staging e aguardam a análise de um administrador.",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-600",
      title: `O formulário de ${submission.ano} aguarda validação`,
    },
    REJEITADA: {
      description: "A equipe administrativa solicitou correções antes da publicação.",
      icon: XCircle,
      iconStyle: "bg-red-50 text-red-600",
      title: `O formulário de ${submission.ano} precisa ser corrigido`,
    },
  };
  const config = statusConfig[submission.status];
  const Icon = config.icon;
  const canEdit = submission.status === "APROVADA" || submission.status === "REJEITADA";

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <AnnualHero
        title="Formulário anual"
        description="Acompanhe a situação das informações declaradas pelo município."
        onLogout={onLogout}
      />
      <main className="mx-auto max-w-[720px] px-6 py-12 md:py-16">
        <section className="rounded-3xl border border-[#dbe5f1] bg-white p-7 text-center shadow-[0_12px_35px_rgba(39,72,125,0.08)] md:p-10">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${config.iconStyle}`}>
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-[#26364d] md:text-3xl">{config.title}</h2>
          <p className="mx-auto mt-3 max-w-[540px] text-sm leading-relaxed text-[#6b788c] md:text-base">
            {config.description}
          </p>

          <div className="mt-6 rounded-2xl bg-[#f6f9fe] px-5 py-4 text-left text-sm text-[#5c6b80]">
            <p><strong className="text-[#405169]">Protocolo:</strong> {submission.submissao_id}</p>
            {submission.validado_em && (
              <p className="mt-2">
                <strong className="text-[#405169]">Validado em:</strong>{" "}
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(submission.validado_em))}
              </p>
            )}
            {submission.motivo_rejeicao && (
              <p className="mt-2 text-red-700">
                <strong>Motivo:</strong> {submission.motivo_rejeicao}
              </p>
            )}
          </div>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#2f66d0] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#2556b4]"
              >
                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                Editar respostas
              </button>
              {submission.status === "APROVADA" && (
                <p className="mt-3 text-xs leading-relaxed text-[#7a8799]">
                  A versão publicada continuará válida até a aprovação das alterações.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default CityHallPostLogin;

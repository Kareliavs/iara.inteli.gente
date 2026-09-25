import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MunicipalAssistant from "./MunicipalAssistant";

const defaultProps = {
  municipioCodIbge: 3548906,
  cityName: "São Carlos",
  dimensionCode: "economica",
  dimensionTitle: "Econômica",
  indicatorIds: [1001, 1002],
  language: "pt",
};

const successfulResponse = {
  resposta: "São Carlos foi comparado com 1 município semelhante, com os resultados separados por dimensão.",
  municipio: { nome: "São Carlos", codigo_ibge: 3548906, uf: "SP" },
  indicadores_utilizados: [],
  anos_utilizados: [],
  fontes: [],
  limitacoes: [],
  dados: {
    tipo: "comparar_municipios",
    secoes: [
      {
        codigo: "economica",
        titulo: "Dimensão Econômica",
        itens: [
          { municipio_cod_ibge: 3548906, municipio_nome: "São Carlos", estado_sigla: "SP", pontuacao: 64, atual: true },
          { municipio_cod_ibge: 3509502, municipio_nome: "Campinas", estado_sigla: "SP", pontuacao: 71, atual: false },
        ],
      },
      { codigo: "sociocultural", titulo: "Dimensão Sociocultural", itens: [{ municipio_cod_ibge: 3548906, municipio_nome: "São Carlos", estado_sigla: "SP", pontuacao: 57, atual: true }] },
      { codigo: "meio_ambiente", titulo: "Dimensão Meio Ambiente", itens: [{ municipio_cod_ibge: 3548906, municipio_nome: "São Carlos", estado_sigla: "SP", pontuacao: 43, atual: true }] },
    ],
  },
};

const challengesResponse = {
  ...successfulResponse,
  resposta: "Desafios e oportunidades para a transformação digital de São Carlos.",
  dados: {
    tipo: "desafios_oportunidades_transformacao_digital",
    secoes: [
      { codigo: "economica", titulo: "Dimensão Econômica", itens: [{ id: "3049", nome: "Transporte inteligente", nivel: 1 }] },
      { codigo: "sociocultural", titulo: "Dimensão Sociocultural", itens: [{ id: "3003", nome: "Educação digital", nivel: 2 }] },
      { codigo: "meio_ambiente", titulo: "Dimensão Meio Ambiente", itens: [{ id: "3024", nome: "Saneamento", nivel: 3 }] },
    ],
  },
};

const mockJsonResponse = (data, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(data) });

const openAssistant = (language = "pt") => fireEvent.click(screen.getByRole("button", {
  name: language === "en" ? "Open municipal assistant" : "Abrir assistente municipal",
}));

describe("MunicipalAssistant", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("mantém o ícone flutuante e abre o modal centralizado", () => {
    render(<MunicipalAssistant {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Abrir assistente municipal" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    openAssistant();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assistente municipal" })).toBeInTheDocument();
    expect(screen.getByText("Dados oficiais")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar assistente municipal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ofusca o assistente e direciona municípios não respondentes para a Área da Prefeitura", () => {
    render(<MunicipalAssistant {...defaultProps} isAvailable={false} />);

    const trigger = screen.getByRole("button", { name: "Assistente municipal indisponível" });
    expect(trigger).toHaveClass("opacity-60", "grayscale");
    fireEvent.click(trigger);

    expect(screen.getByText(/somente para municípios que responderam ao formulário/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para a Área da Prefeitura" })).toHaveAttribute("href", "/prefeitura");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("mostra as duas perguntas possíveis e envia a comparação de municípios", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();

    expect(screen.getByRole("button", { name: "Desafios e Oportunidades para Transformação Digital" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Qual é o resumo da dimensão selecionada?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quais são os melhores indicadores?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Como este município se compara à média regional?" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Como este município se compara a municípios semelhantes?" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("/api/assistente/consultar");
    expect(options.credentials).toBe("omit");
    expect(JSON.parse(options.body)).toEqual({
      acao: "comparar_municipios",
      contexto: {
        municipio_cod_ibge: 3548906,
        dimensao_codigo: "economica",
        idioma: "pt",
        indicador_ids: [1001, 1002],
      },
    });
    expect(await screen.findByText(successfulResponse.resposta)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dimensão Econômica" })).toBeInTheDocument();
    expect(screen.getByText("Campinas/SP").closest("li")).toHaveTextContent("71 pontos");
    expect(screen.getAllByText("Município selecionado")).toHaveLength(3);
    expect(screen.queryByText("Indicadores utilizados")).not.toBeInTheDocument();
    expect(screen.queryByText("Anos utilizados")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Fontes" })).not.toBeInTheDocument();
  });

  it("mantém as duas perguntas habilitadas sem dimensão selecionada", () => {
    render(<MunicipalAssistant {...defaultProps} dimensionCode={null} dimensionTitle={null} indicatorIds={[]} />);
    openAssistant();
    expect(screen.getByRole("button", { name: "Como este município se compara a municípios semelhantes?" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Desafios e Oportunidades para Transformação Digital" })).toBeEnabled();
  });

  it("localiza a interface e envia o idioma canônico", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    render(<MunicipalAssistant {...defaultProps} language="en" />);
    openAssistant("en");
    expect(screen.getByText("Official data")).toBeInTheDocument();
    expect(screen.getAllByText(/without generative AI/i)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "How does this municipality compare with similar municipalities?" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetch.mock.calls[0][1].body).contexto.idioma).toBe("en");
  });

  it("exibe erro do backend como alerta", async () => {
    fetch.mockResolvedValue(mockJsonResponse({ error: "Consulta indisponível." }, false));
    render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();
    fireEvent.click(screen.getByRole("button", { name: "Desafios e Oportunidades para Transformação Digital" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Consulta indisponível.");
  });

  it("renderiza os desafios em três seções sem metadados e fontes", async () => {
    fetch.mockResolvedValue(mockJsonResponse(challengesResponse));
    render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();
    fireEvent.click(screen.getByRole("button", { name: "Desafios e Oportunidades para Transformação Digital" }));

    expect(await screen.findByRole("heading", { name: "Dimensão Econômica" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dimensão Sociocultural" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dimensão Meio Ambiente" })).toBeInTheDocument();
    const transportItem = screen.getByText(/Transporte inteligente/).closest("li");
    expect(transportItem).toHaveTextContent("Nível Fundação");
    expect(transportItem).not.toHaveTextContent("nível 1/7");
    expect(transportItem).not.toHaveTextContent("3049");
    expect(screen.getByText(/Educação digital/).closest("li")).toHaveTextContent("Nível Engajamento");
    expect(screen.getByText(/Saneamento/).closest("li")).toHaveTextContent("Nível 1");
    expect(screen.queryByText("Indicadores utilizados")).not.toBeInTheDocument();
    expect(screen.queryByText("Anos utilizados")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Fontes" })).not.toBeInTheDocument();
    expect(JSON.parse(fetch.mock.calls[0][1].body).acao).toBe("desafios_oportunidades_transformacao_digital");
  });

  it("limpa a resposta quando o município muda", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    const { rerender } = render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();
    fireEvent.click(screen.getByRole("button", { name: "Como este município se compara a municípios semelhantes?" }));
    expect(await screen.findByText(successfulResponse.resposta)).toBeInTheDocument();
    rerender(<MunicipalAssistant {...defaultProps} municipioCodIbge={3550308} cityName="São Paulo" />);
    await waitFor(() => expect(screen.queryByText(successfulResponse.resposta)).not.toBeInTheDocument());
  });
});

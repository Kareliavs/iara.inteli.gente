import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MunicipalAssistant from "./MunicipalAssistant";

const defaultProps = {
  municipioCodIbge: 3548906,
  cityName: "São Carlos",
  dimensionCode: "economica",
  dimensionTitle: "Econômica",
  language: "pt",
};

const successfulResponse = {
  resposta: "O município apresenta nível intermediário nesta dimensão.",
  municipio: { nome: "São Carlos", codigo_ibge: 3548906, uf: "SP" },
  indicadores_utilizados: ["3025", "4056"],
  anos_utilizados: [2022, 2023],
  fontes: [
    { titulo: "Metodologia do indicador 3025", referencia: "Documento metodológico" },
    { titulo: "IBGE", referencia: "https://www.ibge.gov.br/" },
  ],
  limitacoes: ["O ano de referência varia entre os indicadores."],
};

const mockJsonResponse = (data, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
});

const openAssistant = (language = "pt") => {
  fireEvent.click(
    screen.getByRole("button", {
      name: language === "en" ? "Open municipal assistant" : "Abrir assistente municipal",
    })
  );
};

describe("MunicipalAssistant", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows only the floating trigger until the centered assistant is opened", () => {
    render(<MunicipalAssistant {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Abrir assistente municipal" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openAssistant();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assistente municipal" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar assistente municipal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fills the question from a suggestion without sending it", () => {
    render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Como este município se compara a municípios semelhantes?",
      })
    );

    expect(screen.getByLabelText("Sua pergunta")).toHaveValue(
      "Como este município se compara a municípios semelhantes?"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not enable submission below the API minimum length", () => {
    render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();

    fireEvent.change(screen.getByLabelText("Sua pergunta"), {
      target: { value: "Oi" },
    });

    expect(screen.getByRole("button", { name: "Perguntar" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("localizes the interface and sends the canonical language in English", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    render(<MunicipalAssistant {...defaultProps} language="en" />);
    openAssistant("en");

    expect(screen.getByRole("heading", { name: "Municipal assistant" })).toBeInTheDocument();
    expect(screen.getByText("Experimental AI")).toBeInTheDocument();
    expect(
      screen.getByText("Ask about the indicators for São Carlos in the Economic dimension.")
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suggested questions" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Explain the methodology for the indicators in the Economic dimension.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Do not include personal data or sensitive information in your question.")
    ).toBeInTheDocument();

    const question = screen.getByLabelText("Your question");
    expect(question).toHaveAttribute(
      "placeholder",
      "E.g.: How does this municipality compare with similar municipalities?"
    );
    fireEvent.change(question, { target: { value: "Explain these results." } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByRole("heading", { name: "Answer" })).toBeInTheDocument();
    expect(screen.getByText("Indicators used")).toBeInTheDocument();
    expect(screen.getByText("Years used")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sources" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Limitations" })).toBeInTheDocument();
    expect(screen.getByText(successfulResponse.resposta)).toBeInTheDocument();
    expect(JSON.parse(fetch.mock.calls[0][1].body).contexto.idioma).toBe("en");
  });

  it("sends the canonical municipality context and renders the structured response", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();

    fireEvent.change(screen.getByLabelText("Sua pergunta"), {
      target: { value: "  Quais são os resultados?  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe("/api/assistente/perguntar");
    expect(options).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: expect.any(AbortSignal),
      })
    );
    expect(JSON.parse(options.body)).toEqual({
      pergunta: "Quais são os resultados?",
      contexto: {
        municipio_cod_ibge: 3548906,
        dimensao_codigo: "economica",
        idioma: "pt",
      },
    });

    expect(await screen.findByText(successfulResponse.resposta)).toBeInTheDocument();
    expect(screen.getByText("3025")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "IBGE" })).toHaveAttribute(
      "href",
      "https://www.ibge.gov.br/"
    );
    expect(screen.getByText(successfulResponse.limitacoes[0])).toBeInTheDocument();
  });

  it("sends a null dimension when the page is in the municipal overview", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    render(
      <MunicipalAssistant
        {...defaultProps}
        dimensionCode={null}
        dimensionTitle={null}
      />
    );
    openAssistant();

    fireEvent.change(screen.getByLabelText("Sua pergunta"), {
      target: { value: "Faça um diagnóstico geral." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetch.mock.calls[0][1].body).contexto).toEqual({
      municipio_cod_ibge: 3548906,
      dimensao_codigo: null,
      idioma: "pt",
    });
  });

  it("shows the backend error and makes it available as an alert", async () => {
    fetch.mockResolvedValue(
      mockJsonResponse({ error: "O serviço de IA está indisponível." }, false)
    );
    render(<MunicipalAssistant {...defaultProps} language="en" />);
    openAssistant("en");

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "Explain this result." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O serviço de IA está indisponível."
    );
  });

  it("disables submission while a request is in progress", async () => {
    fetch.mockImplementation(() => new Promise(() => {}));
    render(<MunicipalAssistant {...defaultProps} language="en" />);
    openAssistant("en");

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "Compare the indicators." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Analyzing the data and methodology..."
    );
    expect(screen.getByRole("button", { name: "Consulting..." })).toBeDisabled();
    expect(screen.getByLabelText("Your question")).toBeDisabled();
  });

  it("clears the question and response when the municipality context changes", async () => {
    fetch.mockResolvedValue(mockJsonResponse(successfulResponse));
    const { rerender } = render(<MunicipalAssistant {...defaultProps} />);
    openAssistant();

    fireEvent.change(screen.getByLabelText("Sua pergunta"), {
      target: { value: "Mostre o diagnóstico." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));
    expect(await screen.findByText(successfulResponse.resposta)).toBeInTheDocument();

    rerender(
      <MunicipalAssistant
        {...defaultProps}
        municipioCodIbge={3550308}
        cityName="São Paulo"
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Sua pergunta")).toHaveValue("");
      expect(screen.queryByText(successfulResponse.resposta)).not.toBeInTheDocument();
    });
  });
});

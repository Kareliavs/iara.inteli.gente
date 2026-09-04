import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const isValidLevel = (value) => Number.isFinite(value) && value >= 1 && value <= 7;

const getSubtopicLabelForPdf = (topic) => {
  const normalized = (topic || "").trim().toLocaleLowerCase("pt-BR");

  if (normalized === "infraestrutura de conectividade") {
    return "Infraestrutura e Conectividade";
  }

  if (normalized === "transporte") {
    return "Transporte";
  }

  return topic || "Subtopico nao informado";
};

const getTrendTextForPdf = (level) => {
  const delta = level - 4;

  if (delta > 0) return `+${delta}%`;
  if (delta < 0) return `${delta}%`;
  return "~ 0%";
};

const normalizeTextForPdf = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeTextForFileName = (value) =>
  normalizeTextForPdf(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildPdfRows = (indicators) =>
  indicators.map((item) => {
    const level = Number(item.level);
    const hasLevel = isValidLevel(level);
    const safeLevel = hasLevel ? level : 0;
    const trendText = hasLevel ? getTrendTextForPdf(safeLevel) : "ND";

    return [
      normalizeTextForPdf(getSubtopicLabelForPdf(item.topic || "")),
      normalizeTextForPdf(item.label || item.indicator || "Indicador"),
      hasLevel ? `${safeLevel}/7` : "ND",
      normalizeTextForPdf(item.value || "ND"),
      trendText,
      normalizeTextForPdf(item.source || "Fonte nao informada"),
    ];
  });

export const exportIndicatorsDimensionPdf = ({
  indicators = [],
  cityName = "",
  dimensionTitle = "",
  dimensionScore = 0,
}) => {
  if (!Array.isArray(indicators) || indicators.length === 0) return;

  const safeDimensionTitle = dimensionTitle || "Dimensao Economica";
  const safeCityName = cityName || "Nao informado";
  const generatedAt = new Date().toLocaleDateString("pt-BR");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text(
    `Relatorio de indicadores - ${normalizeTextForPdf(safeDimensionTitle)}`,
    40,
    40
  );

  doc.setFontSize(10);
  doc.text(`Municipio: ${normalizeTextForPdf(safeCityName)}`, 40, 60);
  doc.text(`Pontuacao da dimensao: ${dimensionScore}`, 40, 75);
  doc.text(`Gerado em: ${generatedAt}`, 40, 90);

  autoTable(doc, {
    startY: 105,
    head: [["Subtopico", "Indicador", "Nivel", "Valor", "Variacao", "Fonte"]],
    body: buildPdfRows(indicators),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 5,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [61, 132, 216],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 250 },
      2: { cellWidth: 55, halign: "center" },
      3: { cellWidth: 90, halign: "right" },
      4: { cellWidth: 70, halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  const fileDimension = normalizeTextForFileName(safeDimensionTitle || "dimensao");
  const fileCity = normalizeTextForFileName(safeCityName || "municipio");
  doc.save(`indicadores-${fileDimension}-${fileCity}.pdf`);
};

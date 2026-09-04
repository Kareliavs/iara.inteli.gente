import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const normalizeTextForFileName = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getPdfBlocks = (element) => {
  const rootRect = element.getBoundingClientRect();

  return Array.from(element.querySelectorAll("[data-pdf-block]"))
    .map((node) => {
      const rect = node.getBoundingClientRect();

      return {
        top: Math.max(0, rect.top - rootRect.top),
        bottom: Math.max(0, rect.bottom - rootRect.top),
      };
    })
    .filter((block) => block.bottom - block.top > 12)
    .sort((a, b) => a.top - b.top);
};

const getPageSlices = (element, pageCssHeight) => {
  const totalHeight = Math.ceil(element.scrollHeight || element.getBoundingClientRect().height);
  const blocks = getPdfBlocks(element);
  const slices = [];
  let sourceY = 0;

  while (sourceY < totalHeight) {
    const pageLimit = Math.min(totalHeight, sourceY + pageCssHeight);
    let sliceEnd = pageLimit;

    if (pageLimit < totalHeight) {
      const crossingBlock = blocks.find(
        (block) =>
          block.top > sourceY + 40 &&
          block.top < pageLimit &&
          block.bottom > pageLimit
      );

      if (crossingBlock) {
        sliceEnd = crossingBlock.top - 8;
      } else {
        const previousBlock = blocks
          .filter(
            (block) =>
              block.top > sourceY + pageCssHeight * 0.55 &&
              block.top < pageLimit - 8
          )
          .at(-1);

        if (previousBlock) {
          sliceEnd = previousBlock.top - 8;
        }
      }
    }

    if (sliceEnd <= sourceY + 120) {
      sliceEnd = pageLimit;
    }

    slices.push({
      y: sourceY,
      height: Math.max(1, Math.ceil(sliceEnd - sourceY)),
    });
    sourceY = sliceEnd;
  }

  return slices;
};

const renderElementSlice = async ({ element, sourceY, sliceHeight, width }) => {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-100000px";
  wrapper.style.top = "0";
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${sliceHeight}px`;
  wrapper.style.overflow = "hidden";
  wrapper.style.background = "#ffffff";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-1";

  const clone = element.cloneNode(true);
  clone.style.width = `${width}px`;
  clone.style.maxWidth = "none";
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.transform = `translateY(-${sourceY}px)`;
  clone.style.transformOrigin = "top left";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    return await html2canvas(wrapper, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      width,
      height: sliceHeight,
      windowWidth: width,
      windowHeight: sliceHeight,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const exportSectionPdf = async ({
  element,
  cityName = "",
  dimensionTitle = "",
  variant = "dashboard",
}) => {
  if (!element) return;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const exportWidth = Math.ceil(element.getBoundingClientRect().width || element.clientWidth);
  const pageCssHeight = Math.floor((usableHeight * exportWidth) / usableWidth);
  const slices = getPageSlices(element, pageCssHeight);

  for (const [pageIndex, slice] of slices.entries()) {
    const canvas = await renderElementSlice({
      element,
      sourceY: slice.y,
      sliceHeight: slice.height,
      width: exportWidth,
    });

    if (pageIndex !== 0) {
      pdf.addPage();
    }

    const slicePdfHeight = (slice.height * usableWidth) / exportWidth;
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      usableWidth,
      slicePdfHeight
    );
  }

  const fileVariant = normalizeTextForFileName(variant || "exportacao");
  const fileDimension = normalizeTextForFileName(dimensionTitle || "dimensao");
  const fileCity = normalizeTextForFileName(cityName || "municipio");
  pdf.save(`${fileVariant}-${fileDimension}-${fileCity}.pdf`);
};

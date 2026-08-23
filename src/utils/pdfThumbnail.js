import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const getPdfThumbnailUrl = async (fileOrUrl) => {
  try {
    let source;
    if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      const arrayBuffer = await fileOrUrl.arrayBuffer();
      source = { data: arrayBuffer };
    } else if (typeof fileOrUrl === "string" && fileOrUrl.length > 0 && fileOrUrl !== "#") {
      source = { url: fileOrUrl };
    } else {
      return null;
    }

    const loadingTask = pdfjsLib.getDocument(source);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Failed to generate PDF thumbnail:", err);
    return null;
  }
};

export default getPdfThumbnailUrl;

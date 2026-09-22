import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

let pdfjsLibPromise = null;

const loadPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
      return pdfjsLib;
    })();
  }
  return pdfjsLibPromise;
};

const getPdfThumbnailUrl = async (fileOrUrl) => {
  let objectUrl = null;
  try {
    let source;
    if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      objectUrl = URL.createObjectURL(fileOrUrl);
      source = { url: objectUrl };
    } else if (typeof fileOrUrl === "string" && fileOrUrl.length > 0 && fileOrUrl !== "#") {
      source = { url: fileOrUrl };
    } else {
      return 'error';
    }

    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument(source);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Failed to generate PDF thumbnail:", err);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return 'error';
  }
};

export const getPdfFullPreviewUrl = async (fileOrUrl, scale = 1.5) => {
  let objectUrl = null;
  try {
    let source;
    if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      objectUrl = URL.createObjectURL(fileOrUrl);
      source = { url: objectUrl };
    } else if (typeof fileOrUrl === "string" && fileOrUrl.length > 0 && fileOrUrl !== "#") {
      source = { url: fileOrUrl };
    } else {
      return 'error';
    }

    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument(source);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Failed to generate PDF full preview:", err);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return 'error';
  }
};

export default getPdfThumbnailUrl;

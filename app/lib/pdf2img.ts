// pdfUtils.ts
export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

// Option A (Vite / bundlers that support ?url):
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;
  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module typed as ESM for TS
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    // Use the worker imported above (Option A)
    lib.GlobalWorkerOptions.workerSrc = pdfWorker;

    // Tell PDF.js where to find standard fonts (we copied them to /public/standard_fonts)
    lib.GlobalWorkerOptions.standardFontDataUrl = "/standard_fonts/";

    pdfjsLib = lib;
    isLoading = false;
    return lib;
  });

  return loadPromise;
}

/* 
If you used Option B (copied worker into /public), replace the inside of the .then((lib) => { ... })
with:
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  lib.GlobalWorkerOptions.standardFontDataUrl = "/standard_fonts/";
*/

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // scale: reduce if you hit memory problems (4 -> 2 or 1.5)
    const viewport = page.getViewport({ scale: 2 }); // changed to 2 to be safer
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    if (!context) {
      return { imageUrl: "", file: null, error: "Failed to get 2D canvas context" };
    }

    context.imageSmoothingEnabled = true;
    // @ts-ignore
    context.imageSmoothingQuality = "high";

    await page.render({ canvasContext: context, viewport }).promise;

    return await new Promise<PdfConversionResult>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0
      );
    });
  } catch (err: any) {
    console.error("convertPdfToImage error:", err);
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err?.message ?? String(err)}`,
    };
  }
}

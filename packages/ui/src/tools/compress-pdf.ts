/**
 * Shrink a PDF to a target size in the browser: render each page with pdf.js,
 * re-encode it as JPEG, rebuild with pdf-lib. Tries quality levels from best to
 * smallest and keeps the first that fits. Text becomes an image (not selectable).
 * Libraries load only when this runs, so the page itself stays light.
 */

export interface Level {
  dpi: number;
  quality: number;
}

/** From sharp to smallest; the last stays legible for typical A4/Carta documents. */
export const LEVELS: Level[] = [
  { dpi: 150, quality: 0.8 },
  { dpi: 150, quality: 0.65 },
  { dpi: 120, quality: 0.6 },
  { dpi: 100, quality: 0.55 },
  { dpi: 90, quality: 0.45 },
  { dpi: 72, quality: 0.4 },
];

export interface CompressResult {
  bytes: Uint8Array;
  level: Level;
  fits: boolean;
  pages: number;
}

type Progress = (page: number, pages: number, attempt: number) => void;

let libs: Promise<{ pdfjs: typeof import("pdfjs-dist"); PDFDocument: typeof import("pdf-lib").PDFDocument }> | null = null;

/** Start downloading the libraries early (call when a file is chosen). */
export function loadLibs() {
  libs ??= (async () => {
    const [pdfjs, { PDFDocument }, worker] = await Promise.all([
      import("pdfjs-dist"),
      import("pdf-lib"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return { pdfjs, PDFDocument };
  })();
  return libs;
}

const toBlob = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", q));

export async function compressPdf(file: ArrayBuffer, targetBytes: number, onProgress?: Progress): Promise<CompressResult> {
  const { pdfjs, PDFDocument } = await loadLibs();
  const task = pdfjs.getDocument({ data: new Uint8Array(file.slice(0)) });
  const src = await task.promise;
  const pages = src.numPages;
  let best: CompressResult | null = null;

  for (let attempt = 0; attempt < LEVELS.length; attempt++) {
    const level = LEVELS[attempt];
    const out = await PDFDocument.create();
    for (let i = 1; i <= pages; i++) {
      onProgress?.(i, pages, attempt);
      const page = await src.getPage(i);
      const base = page.getViewport({ scale: 1 }); // PDF points (1/72 in)
      const vp = page.getViewport({ scale: level.dpi / 72 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
      const jpg = new Uint8Array(await (await toBlob(canvas, level.quality)).arrayBuffer());
      const img = await out.embedJpg(jpg);
      const p = out.addPage([base.width, base.height]);
      p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
      page.cleanup();
      canvas.width = canvas.height = 0;
    }
    const bytes = await out.save({ useObjectStreams: true });
    best = { bytes, level, fits: bytes.byteLength <= targetBytes, pages };
    if (best.fits) break;
  }
  await task.destroy().catch(() => {});
  return best!;
}

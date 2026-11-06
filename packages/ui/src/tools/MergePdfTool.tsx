/**
 * Merge PDFs (and JPG/PNG photos, one per A4 page) in the browser with pdf-lib.
 * Files can be reordered before merging. Nothing is uploaded.
 */
import { useState } from "preact/hooks";

export interface MergeStrings {
  choose: string;
  drop: string;
  add: string;
  pages: string;
  /** Singular of `pages`. */
  page?: string;
  up: string;
  down: string;
  remove: string;
  merge: string;
  working: string;
  download: string;
  result: string;
  needTwo: string;
  privacy: string;
  error: string;
  images: string;
}

interface Item {
  id: number;
  file: File;
  kind: "pdf" | "jpg" | "png";
  pages: number | null;
}

const MB = 1024 * 1024;
let nextId = 1;
let lib: Promise<typeof import("pdf-lib")> | null = null;
const loadLib = () => (lib ??= import("pdf-lib"));

const kindOf = (f: File): Item["kind"] | null => {
  const n = f.name.toLowerCase();
  if (f.type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (f.type === "image/jpeg" || /\.jpe?g$/.test(n)) return "jpg";
  if (f.type === "image/png" || n.endsWith(".png")) return "png";
  return null;
};

// A4 in PDF points.
const A4 = { w: 595.28, h: 841.89, margin: 28 };

export default function MergePdfTool({ t, outputName = "documentos-unidos.pdf", locale = "pt-BR" }: { t: MergeStrings; outputName?: string; locale?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [out, setOut] = useState<Uint8Array | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const size = (b: number) => (b >= MB ? `${nf.format(b / MB)} MB` : `${nf.format(b / 1024)} KB`);

  const add = async (files: FileList | null | undefined) => {
    if (!files) return;
    const fresh: Item[] = [];
    for (const file of Array.from(files)) {
      const kind = kindOf(file);
      if (kind) fresh.push({ id: nextId++, file, kind, pages: kind === "pdf" ? null : 1 });
    }
    if (!fresh.length) return;
    setOut(null);
    setStatus("idle");
    setItems((prev) => [...prev, ...fresh]);
    const { PDFDocument } = await loadLib();
    for (const it of fresh.filter((i) => i.kind === "pdf")) {
      try {
        const doc = await PDFDocument.load(await it.file.arrayBuffer(), { ignoreEncryption: true });
        const n = doc.getPageCount();
        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, pages: n } : p)));
      } catch {
        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, pages: -1 } : p)));
      }
    }
  };

  const move = (i: number, d: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const merge = async () => {
    if (items.length < 2) return;
    setStatus("working");
    setOut(null);
    try {
      const { PDFDocument } = await loadLib();
      const doc = await PDFDocument.create();
      for (const it of items) {
        const bytes = await it.file.arrayBuffer();
        if (it.kind === "pdf") {
          const src = await PDFDocument.load(bytes);
          const pages = await doc.copyPages(src, src.getPageIndices());
          pages.forEach((p) => doc.addPage(p));
        } else {
          const img = it.kind === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
          const portrait = img.height >= img.width;
          const pw = portrait ? A4.w : A4.h;
          const ph = portrait ? A4.h : A4.w;
          const s = Math.min((pw - 2 * A4.margin) / img.width, (ph - 2 * A4.margin) / img.height, 1);
          const w = img.width * s;
          const h = img.height * s;
          doc.addPage([pw, ph]).drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        }
      }
      setOut(await doc.save({ useObjectStreams: true }));
      setStatus("done");
    } catch (e) {
      console.warn(e);
      setStatus("error");
    }
  };

  const download = () => {
    if (!out) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([out], { type: "application/pdf" }));
    a.download = outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  const input = (
    <input
      type="file"
      multiple
      accept="application/pdf,.pdf,image/jpeg,image/png"
      class="sr-only"
      onChange={(e) => {
        void add(e.currentTarget.files);
        e.currentTarget.value = "";
      }}
    />
  );

  const dropZone = (big: boolean) => (
    <label
      class={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center ${big ? "p-10" : "p-4"} ${dragOver ? "border-teal-700 bg-teal-50" : "border-stone-300"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void add(e.dataTransfer?.files);
      }}
    >
      <span class={big ? "rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white" : "text-sm font-semibold text-teal-800"}>
        {big ? t.choose : `+ ${t.add}`}
      </span>
      {big && <span class="mt-2 text-sm text-stone-500">{t.drop}</span>}
      {input}
    </label>
  );

  return (
    <div class="grid gap-4">
      {items.length === 0 ? (
        dropZone(true)
      ) : (
        <>
          <ol class="grid gap-2">
            {items.map((it, i) => (
              <li class="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
                <span class="w-6 text-center text-sm font-semibold text-stone-400">{i + 1}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold">{it.file.name}</span>
                  <span class={`block text-xs ${it.pages === -1 ? "text-red-700" : "text-stone-500"}`}>
                    {it.pages === -1 ? t.error : `${it.pages ?? "…"} ${it.pages === 1 ? (t.page ?? t.pages) : t.pages} · ${size(it.file.size)}`}
                  </span>
                </span>
                <button type="button" aria-label={t.up} title={t.up} disabled={i === 0} onClick={() => move(i, -1)} class="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30">
                  ↑
                </button>
                <button type="button" aria-label={t.down} title={t.down} disabled={i === items.length - 1} onClick={() => move(i, 1)} class="rounded p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30">
                  ↓
                </button>
                <button type="button" aria-label={t.remove} title={t.remove} onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} class="rounded p-1.5 text-stone-500 hover:bg-stone-100">
                  ✕
                </button>
              </li>
            ))}
          </ol>
          {dropZone(false)}
          {items.length < 2 && <p class="text-sm text-stone-500">{t.needTwo}</p>}
          <div>
            <button
              type="button"
              onClick={merge}
              disabled={items.length < 2 || status === "working" || items.some((i) => i.pages === -1)}
              class="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {status === "working" ? t.working : t.merge}
            </button>
          </div>
        </>
      )}
      {status === "error" && <p class="text-sm text-red-700">{t.error}</p>}
      {status === "done" && out && (
        <output class="block rounded-lg bg-teal-50 p-4" aria-live="polite">
          <span class="block text-sm text-teal-900">{t.result}</span>
          <span class="block text-2xl font-semibold text-teal-900">
            {items.reduce((s, i) => s + (i.pages ?? 0), 0)} {t.pages} · {size(out.byteLength)}
          </span>
          <button type="button" onClick={download} class="mt-3 rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800">
            {t.download}
          </button>
        </output>
      )}
      <p class="text-xs text-stone-500">{t.images}</p>
      <p class="text-xs text-stone-500">{t.privacy}</p>
    </div>
  );
}

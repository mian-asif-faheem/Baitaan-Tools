import { useState } from "preact/hooks";
import { compressPdf, loadLibs, type CompressResult } from "./compress-pdf";

export interface PdfStrings {
  choose: string;
  drop: string;
  target: string;
  custom: string;
  compress: string;
  working: string;
  of: string;
  original: string;
  result: string;
  download: string;
  another: string;
  privacy: string;
  note: string;
  already: string;
  tooBig: string;
  error: string;
}

interface Props {
  t: PdfStrings;
  /** Preset targets in MB. */
  targets?: number[];
  defaultTarget?: number;
  locale?: string;
}

const MB = 1024 * 1024;

export default function PdfCompressTool({ t, targets = [0.5, 1, 2, 5], defaultTarget = 1, locale = "es" }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState(String(defaultTarget));
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ page: 0, pages: 0 });
  const [result, setResult] = useState<CompressResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const size = (b: number) => (b >= MB ? `${nf.format(b / MB)} MB` : `${nf.format(b / 1024)} KB`);
  const targetMb = target === "custom" ? Number(custom) : Number(target);

  const pick = (f: File | undefined) => {
    if (!f) return;
    void loadLibs().catch(() => {});
    setFile(f);
    setResult(null);
    setStatus("idle");
  };

  const run = async () => {
    if (!file || !(targetMb > 0)) return;
    setStatus("working");
    setResult(null);
    try {
      const r = await compressPdf(await file.arrayBuffer(), targetMb * MB, (page, pages) => setProgress({ page, pages }));
      setResult(r);
      setStatus("done");
    } catch (e) {
      console.warn(e);
      setStatus("error");
    }
  };

  const download = () => {
    if (!result || !file) return;
    const blob = new Blob([result.bytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace(/\.pdf$/i, "") + "-comprimido.pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  const alreadySmall = file && targetMb > 0 && file.size <= targetMb * MB;
  const fileInput = (
    <input type="file" accept="application/pdf,.pdf" class="sr-only" onChange={(e) => pick(e.currentTarget.files?.[0])} />
  );

  if (!file)
    return (
      <div class="grid gap-3">
        <label
          class={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center ${dragOver ? "border-teal-700 bg-teal-50" : "border-stone-300"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer?.files?.[0]);
          }}
        >
          <span class="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white">{t.choose}</span>
          <span class="mt-2 text-sm text-stone-500">{t.drop}</span>
          {fileInput}
        </label>
        <p class="text-xs text-stone-500">{t.privacy}</p>
      </div>
    );

  return (
    <div class="grid gap-4">
      <p class="truncate text-sm">
        <span class="font-semibold">{file.name}</span>
        <span class="text-stone-500"> · {t.original}: {size(file.size)}</span>
      </p>

      <fieldset>
        <legend class="text-sm font-semibold">{t.target}</legend>
        <div class="mt-2 flex flex-wrap gap-1">
          {[...targets.map(String), "custom"].map((v) => (
            <button
              type="button"
              aria-pressed={target === v}
              onClick={() => setTarget(v)}
              class={`rounded-md border px-3 py-1.5 text-sm ${target === v ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 text-stone-600 hover:bg-stone-100"}`}
            >
              {v === "custom" ? t.custom : `${nf.format(Number(v))} MB`}
            </button>
          ))}
        </div>
        {target === "custom" && (
          <input
            class="mt-2 w-40 rounded-lg border border-stone-300 px-3 py-2"
            type="number"
            min="0.1"
            step="0.1"
            inputMode="decimal"
            value={custom}
            placeholder="MB"
            onInput={(e) => setCustom(e.currentTarget.value)}
          />
        )}
      </fieldset>

      {alreadySmall && status !== "done" && <p class="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{t.already}</p>}

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={run}
          disabled={status === "working" || !(targetMb > 0)}
          class="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {t.compress}
        </button>
        <label class="cursor-pointer rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
          {t.another}
          {fileInput}
        </label>
      </div>

      {status === "working" && (
        <div aria-live="polite">
          <p class="text-sm text-stone-600">
            {t.working} {progress.page} {t.of} {progress.pages}
          </p>
          <div class="mt-2 h-2 overflow-hidden rounded bg-stone-200">
            <div class="h-full bg-teal-700 transition-all" style={{ width: `${progress.pages ? (progress.page / progress.pages) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {status === "error" && <p class="text-sm text-red-700">{t.error}</p>}

      {status === "done" && result && (
        <output class="block rounded-lg bg-teal-50 p-4" aria-live="polite">
          <span class="block text-sm text-teal-900">{t.result}</span>
          <span class="block text-3xl font-semibold tabular-nums text-teal-900">{size(result.bytes.byteLength)}</span>
          <span class="mt-1 block text-sm text-stone-600">
            {t.original}: {size(file.size)} · −{Math.max(0, Math.round((1 - result.bytes.byteLength / file.size) * 100))}%
          </span>
          {!result.fits && <p class="mt-2 text-sm text-amber-800">{t.tooBig}</p>}
          <button type="button" onClick={download} class="mt-3 rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800">
            {t.download}
          </button>
        </output>
      )}

      <p class="text-xs text-stone-500">{t.note}</p>
      <p class="text-xs text-stone-500">{t.privacy}</p>
    </div>
  );
}

import Svg from "../fx/Svg";
import { checkCircle, downloadSimple, filePdf, info, lockSimple, uploadSimple } from "../icons";
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

  const privacy = (
    <p class="bt-note text-muted">
      <Svg d={lockSimple} size={16} class="mt-px flex-none" />
      <span>{t.privacy}</span>
    </p>
  );

  if (!file)
    return (
      <div class="bt-tool">
        <label
          class={`bt-drop cursor-pointer ${dragOver ? "is-over" : ""}`}
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
          <span class="bt-file-icon"><Svg d={filePdf} size={26} /></span>
          <span class="bt-btn bt-btn--sm">
            <Svg d={uploadSimple} size={18} />
            {t.choose}
          </span>
          <span class="text-[15px] text-muted">{t.drop}</span>
          {fileInput}
        </label>
        {privacy}
      </div>
    );

  const saved = Math.max(0, Math.round((1 - (result?.bytes.byteLength ?? 0) / file.size) * 100));
  const pct = progress.pages ? Math.round((progress.page / progress.pages) * 100) : 0;

  return (
    <div class="bt-tool">
      <div class="bt-panel flex flex-col gap-6">
        <div class="flex min-w-0 items-center gap-3">
          <span class="bt-file-icon size-11 rounded-[14px]"><Svg d={filePdf} size={22} /></span>
          <span class="flex min-w-0 flex-col">
            <span class="truncate font-semibold">{file.name}</span>
            <span class="text-[13px] text-muted">{t.original}: {size(file.size)}</span>
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="bt-label">{t.target}</span>
          <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.target}>
            {[...targets.map(String), "custom"].map((v) => (
              <button
                type="button"
                role="radio"
                aria-checked={target === v}
                onClick={() => setTarget(v)}
                class={`bt-tab cursor-pointer border-0 ${target === v ? "!bg-primary !text-on-primary font-semibold" : ""}`}
              >
                {v === "custom" ? t.custom : `${nf.format(Number(v))} MB`}
              </button>
            ))}
          </div>
          {target === "custom" && (
            <input
              class="bt-input mt-1 max-w-40"
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              value={custom}
              placeholder="MB"
              aria-label={t.custom}
              onInput={(e) => setCustom(e.currentTarget.value)}
            />
          )}
        </div>

        {alreadySmall && status !== "done" && <p class="m-0 rounded-2xl bg-result p-3 text-sm text-result-ink">{t.already}</p>}

        {status === "working" ? (
          <div class="flex flex-col gap-2" aria-live="polite">
            <div class="bt-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div class="flex justify-between text-sm">
              <span>
                {t.working} {progress.page} {t.of} {progress.pages}
              </span>
              <span class="font-semibold tabular-nums">{pct}%</span>
            </div>
          </div>
        ) : (
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" onClick={run} disabled={!(targetMb > 0)} class="bt-btn grow">
              {t.compress}
            </button>
            <label class="bt-btn bt-btn--ghost cursor-pointer">
              {t.another}
              {fileInput}
            </label>
          </div>
        )}
        {status === "error" && <p class="m-0 text-sm text-err">{t.error}</p>}
      </div>

      {status === "done" && result && (
        <output class="bt-done" aria-live="polite">
          <span class="flex items-center gap-2 font-semibold">
            <Svg d={checkCircle} size={20} />
            {t.result} · −{saved}%
          </span>
          <div class="bt-bars">
            <div>
              <span class="text-muted">{t.original}</span>
              <span class="bt-bar" />
              <span>{size(file.size)}</span>
            </div>
            <div>
              <span class="text-muted">{t.result}</span>
              <span class="bt-bar bt-bar--after" style={{ width: `${Math.max(3, 100 - saved)}%` }} />
              <span class="font-semibold">{size(result.bytes.byteLength)}</span>
            </div>
          </div>
          {!result.fits && <p class="m-0 text-sm">{t.tooBig}</p>}
          <button type="button" onClick={download} class="bt-btn">
            <Svg d={downloadSimple} size={18} />
            {t.download}
          </button>
        </output>
      )}

      <p class="bt-note text-muted">
        <Svg d={info} size={16} class="mt-px flex-none" />
        <span>{t.note}</span>
      </p>
      {privacy}
    </div>
  );
}

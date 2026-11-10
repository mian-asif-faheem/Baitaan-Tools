/**
 * Document photo cropper: pick a size, drag and zoom, download one photo or a print sheet.
 * Everything runs in the browser with Canvas; nothing is uploaded.
 */
import { useEffect, useRef, useState } from "preact/hooks";
import { DPI, SHEETS, bestLayout, cmToPx, type PhotoPreset } from "./photo-presets";

export interface PhotoStrings {
  choose: string;
  drop: string;
  size: string;
  zoom: string;
  dragHint: string;
  sheet: string;
  sheetNone: string;
  copies: string;
  download: string;
  another: string;
  privacy: string;
  printNote: string;
  error: string;
}

interface Props {
  presets: PhotoPreset[];
  t: PhotoStrings;
  /** Sheet ids to offer, in order. */
  sheets?: string[];
  filePrefix?: string;
}

const FRAME_MAX = 260; // on-screen frame height in CSS px

export default function PhotoTool({ presets, t, sheets = ["10x15", "carta", "a4"], filePrefix = "foto" }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState(false);
  const [presetId, setPresetId] = useState(presets[0].id);
  const [sheetId, setSheetId] = useState<string>(sheets[0] ?? "none");
  const [zoom, setZoom] = useState(1); // 1 = image just covers the frame
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // image centre offset from frame centre, frame px
  const [dragOver, setDragOver] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const preset = presets.find((p) => p.id === presetId) ?? presets[0];
  const frameH = FRAME_MAX;
  const frameW = (FRAME_MAX * preset.w) / preset.h;

  // Scale (image px → frame px) that makes the image cover the frame.
  const cover = img ? Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) : 1;
  const scale = cover * zoom;
  const dispW = img ? img.naturalWidth * scale : 0;
  const dispH = img ? img.naturalHeight * scale : 0;

  // Keep the frame fully covered.
  const clamp = (o: { x: number; y: number }) => {
    const mx = Math.max(0, (dispW - frameW) / 2);
    const my = Math.max(0, (dispH - frameH) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  };

  useEffect(() => setOffset((o) => clamp(o)), [zoom, presetId, img]);

  const load = (file: File | undefined) => {
    if (!file) return;
    setError(false);
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      setError(true);
    };
    im.src = url;
  };

  /** Render the cropped photo at print resolution. */
  const renderPhoto = (): HTMLCanvasElement | null => {
    if (!img) return null;
    const outW = cmToPx(preset.w);
    const outH = cmToPx(preset.h);
    const k = outW / frameW;
    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingQuality = "high";
    const left = frameW / 2 + offset.x - dispW / 2;
    const top = frameH / 2 + offset.y - dispH / 2;
    ctx.drawImage(img, left * k, top * k, dispW * k, dispH * k);
    return c;
  };

  const sheet = SHEETS.find((s) => s.id === sheetId);
  const grid = sheet ? bestLayout(sheet.w, sheet.h, preset.w, preset.h) : null;

  const renderSheet = (photo: HTMLCanvasElement): HTMLCanvasElement => {
    if (!sheet || !grid) return photo;
    const c = document.createElement("canvas");
    c.width = cmToPx(grid.sheetW);
    c.height = cmToPx(grid.sheetH);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#cfcfcf";
    ctx.lineWidth = 1;
    for (let r = 0; r < grid.rows; r++)
      for (let col = 0; col < grid.cols; col++) {
        const x = cmToPx(grid.x0 + col * (preset.w + grid.gap));
        const y = cmToPx(grid.y0 + r * (preset.h + grid.gap));
        ctx.drawImage(photo, x, y, photo.width, photo.height);
        ctx.strokeRect(x - 0.5, y - 0.5, photo.width + 1, photo.height + 1);
      }
    return c;
  };

  // Small live preview of the sheet.
  useEffect(() => {
    const out = previewRef.current;
    if (!out || !img) return;
    const photo = renderPhoto();
    if (!photo) return;
    const full = renderSheet(photo);
    const w = 280;
    out.width = w;
    out.height = Math.round((full.height / full.width) * w);
    out.getContext("2d")!.drawImage(full, 0, 0, out.width, out.height);
  });

  const download = () => {
    const photo = renderPhoto();
    if (!photo) return;
    const canvas = renderSheet(photo);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${filePrefix}-${preset.id}${sheet ? `-${sheet.id}` : ""}.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      },
      "image/jpeg",
      0.95,
    );
  };

  const fileInput = (
    <input type="file" accept="image/*" class="sr-only" onChange={(e) => load(e.currentTarget.files?.[0])} />
  );

  if (!img)
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
            load(e.dataTransfer?.files?.[0]);
          }}
        >
          <span class="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white">{t.choose}</span>
          <span class="mt-2 text-sm text-stone-500">{t.drop}</span>
          {fileInput}
        </label>
        {error && <p class="text-sm text-red-700">{t.error}</p>}
        <p class="text-xs text-stone-500">{t.privacy}</p>
      </div>
    );

  return (
    <div class="grid gap-5 sm:grid-cols-[auto_1fr]">
      <div class="grid justify-items-center gap-2">
        <div
          class="relative touch-none select-none overflow-hidden rounded border border-stone-300 bg-stone-100"
          style={{ width: `${frameW}px`, height: `${frameH}px`, cursor: "grab" }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) setOffset(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => {
            e.preventDefault();
            setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)));
          }}
        >
          <img
            src={img.src}
            alt=""
            draggable={false}
            class="pointer-events-none absolute max-w-none"
            style={{
              width: `${dispW}px`,
              height: `${dispH}px`,
              left: `${frameW / 2 + offset.x - dispW / 2}px`,
              top: `${frameH / 2 + offset.y - dispH / 2}px`,
            }}
          />
          {/* Face guide: a soft oval where the head should sit. */}
          <div
            class="pointer-events-none absolute rounded-[50%] border-2 border-dashed border-white/80"
            style={{ left: "22%", right: "22%", top: "12%", bottom: "28%" }}
          />
        </div>
        <p class="max-w-[260px] text-center text-xs text-stone-500">{t.dragHint}</p>
      </div>

      <div class="grid content-start gap-4">
        <label class="text-sm font-semibold">
          {t.size}
          <select
            class="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={presetId}
            onChange={(e) => setPresetId(e.currentTarget.value)}
          >
            {presets.map((p) => (
              <option value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label class="text-sm font-semibold">
          {t.zoom}
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            class="mt-2 w-full accent-teal-700"
            onInput={(e) => setZoom(Number(e.currentTarget.value))}
          />
        </label>
        <label class="text-sm font-semibold">
          {t.sheet}
          <select
            class="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={sheetId}
            onChange={(e) => setSheetId(e.currentTarget.value)}
          >
            <option value="none">{t.sheetNone}</option>
            {SHEETS.filter((s) => sheets.includes(s.id)).map((s) => (
              <option value={s.id}>
                {s.label}
                {` · ${bestLayout(s.w, s.h, preset.w, preset.h).count} ${t.copies}`}
              </option>
            ))}
          </select>
        </label>
        <canvas ref={previewRef} class="w-full max-w-[280px] rounded border border-stone-200 bg-white" />
        <div class="flex flex-wrap gap-2">
          <button type="button" onClick={download} class="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800">
            {t.download}
          </button>
          <label class="cursor-pointer rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
            {t.another}
            {fileInput}
          </label>
        </div>
        <p class="text-xs text-stone-500">
          {t.printNote} {DPI} dpi.
        </p>
        <p class="text-xs text-stone-500">{t.privacy}</p>
      </div>
    </div>
  );
}

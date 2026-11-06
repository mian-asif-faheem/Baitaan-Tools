/** Document photo sizes in centimetres (width × height). */
export interface PhotoPreset {
  id: string;
  label: string;
  w: number;
  h: number;
}

export const PRESETS_MX_ES: PhotoPreset[] = [
  { id: "infantil", label: "Infantil (2.5 × 3 cm)", w: 2.5, h: 3 },
  { id: "pasaporte", label: "Tamaño pasaporte (3.5 × 4.5 cm)", w: 3.5, h: 4.5 },
  { id: "credencial", label: "Credencial (3.5 × 5 cm)", w: 3.5, h: 5 },
  { id: "titulo", label: "Título / cédula (6 × 9 cm)", w: 6, h: 9 },
  { id: "dni-es", label: "DNI y pasaporte España (2.6 × 3.2 cm)", w: 2.6, h: 3.2 },
  { id: "visa-us", label: "Visa de EE. UU. (5 × 5 cm)", w: 5.08, h: 5.08 },
];

export const PRESETS_BR: PhotoPreset[] = [
  { id: "3x4", label: "3 × 4 cm (RG, CNH, carteira)", w: 3, h: 4 },
  { id: "5x7", label: "5 × 7 cm", w: 5, h: 7 },
  { id: "visa-us", label: "Visto americano (5 × 5 cm)", w: 5.08, h: 5.08 },
];

export const PRESETS_AR: PhotoPreset[] = [
  { id: "4x6", label: "4 × 6 سم", w: 4, h: 6 },
  { id: "3.5x4.5", label: "3.5 × 4.5 سم", w: 3.5, h: 4.5 },
  { id: "visa-us", label: "التأشيرة الأمريكية 5 × 5 سم", w: 5.08, h: 5.08 },
];

/** Print sheets in centimetres (landscape where it fits more photos). */
export const SHEETS = [
  { id: "10x15", label: "10 × 15 cm", w: 15, h: 10 },
  { id: "carta", label: "Carta", w: 21.59, h: 27.94 },
  { id: "a4", label: "A4", w: 21, h: 29.7 },
] as const;

export const DPI = 300;
export const cmToPx = (cm: number) => Math.round((cm / 2.54) * DPI);

/** How many photos of w × h fit on a sheet with a gap (all in cm). */
export function layout(sheetW: number, sheetH: number, w: number, h: number, gap = 0.3, margin = 0.4) {
  const cols = Math.max(0, Math.floor((sheetW - 2 * margin + gap) / (w + gap)));
  const rows = Math.max(0, Math.floor((sheetH - 2 * margin + gap) / (h + gap)));
  const usedW = cols * w + (cols - 1) * gap;
  const usedH = rows * h + (rows - 1) * gap;
  return { cols, rows, count: cols * rows, x0: (sheetW - usedW) / 2, y0: (sheetH - usedH) / 2, gap };
}

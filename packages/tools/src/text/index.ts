/**
 * Text statistics that handle Arabic properly: words, characters with and without
 * spaces and diacritics (tashkeel), sentences and paragraphs. Works for any language.
 */

/** Arabic diacritics: tanween, fatha, damma, kasra, shadda, sukun, superscript alef, Quranic marks, tatweel. */
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

export function textStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/u).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  const chars = [...text].length;
  const noSpaces = [...text.replace(/\s/gu, "")].length;
  const diacritics = (text.match(DIACRITICS) ?? []).length;
  const sentences = trimmed ? trimmed.split(/[.!?؟。]+|\n+/u).filter((s) => /[\p{L}\p{N}]/u.test(s)).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/u).filter((p) => p.trim()).length : 0;
  const arabicLetters = (text.match(/[ء-يٱ-ۓ]/g) ?? []).length;
  return {
    words,
    chars,
    charsNoSpaces: noSpaces,
    charsNoDiacritics: chars - diacritics,
    diacritics,
    sentences,
    paragraphs,
    arabicLetters,
  };
}

/** Remove Arabic diacritics and tatweel. */
export const stripDiacritics = (text: string) => text.replace(DIACRITICS, "");

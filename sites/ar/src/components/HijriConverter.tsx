import { useMemo, useState } from "preact/hooks";
import { hijriMonthLength, toGregorian, toHijri } from "@bt/tools/hijri";
import { getT, type Lang } from "../i18n";
import { hijriMonths, hijriText } from "./form";

const field = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-lg focus:border-teal-700 focus:outline-none";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function HijriConverter({ lang = "ar" }: { lang?: Lang }) {
  const L = getT(lang).conv;
  const weekdayFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar", { weekday: "long", timeZone: "UTC" });
  const gregFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const [mode, setMode] = useState<"toHijri" | "toGregorian">("toHijri");
  const [greg, setGreg] = useState(todayIso());
  const todayH = toHijri(new Date());
  const [hy, setHy] = useState(String(todayH.year));
  const [hm, setHm] = useState(String(todayH.month));
  const [hd, setHd] = useState(String(todayH.day));

  const result = useMemo(() => {
    try {
      if (mode === "toHijri") {
        if (!greg) return null;
        const d = new Date(`${greg}T00:00:00Z`);
        const h = toHijri(d);
        return { main: hijriText(h, lang), weekday: weekdayFmt.format(d) };
      }
      const d = toGregorian({ year: Number(hy), month: Number(hm), day: Number(hd) });
      return { main: `${gregFmt.format(d)} ${L.gregorianSuffix}`, weekday: weekdayFmt.format(d) };
    } catch {
      return { error: L.error };
    }
  }, [mode, greg, hy, hm, hd]);

  const maxDay = mode === "toGregorian" && Number(hy) > 0 ? hijriMonthLength(Number(hy), Number(hm)) : 30;

  return (
    <form class="grid gap-4" onSubmit={(e) => e.preventDefault()}>
      <div class="inline-flex w-fit rounded-lg border border-stone-300 p-1">
        {(["toHijri", "toGregorian"] as const).map((m) => (
          <button
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            class={`rounded-md px-4 py-1.5 text-sm ${mode === m ? "bg-teal-700 text-white" : "text-stone-600"}`}
          >
            {L[m]}
          </button>
        ))}
      </div>

      {mode === "toHijri" ? (
        <label class="text-sm font-semibold">
          {L.gregorianDate}
          <input class={field} type="date" value={greg} onInput={(e) => setGreg(e.currentTarget.value)} />
        </label>
      ) : (
        <div class="grid grid-cols-3 gap-3">
          <label class="text-sm font-semibold">
            {L.day}
            <input class={field} type="number" inputMode="numeric" min="1" max={maxDay} value={hd} onInput={(e) => setHd(e.currentTarget.value)} />
          </label>
          <label class="text-sm font-semibold">
            {L.month}
            <select class={field} value={hm} onChange={(e) => setHm(e.currentTarget.value)}>
              {hijriMonths(lang).map((name, i) => <option value={String(i + 1)}>{name}</option>)}
            </select>
          </label>
          <label class="text-sm font-semibold">
            {L.year}
            <input class={field} type="number" inputMode="numeric" min="1343" max="1500" value={hy} onInput={(e) => setHy(e.currentTarget.value)} />
          </label>
        </div>
      )}

      <output class="rounded-lg bg-teal-50 p-4" aria-live="polite">
        <span class="block text-sm text-teal-900">{L.result}</span>
        {result && "error" in result ? (
          <span class="block text-lg text-red-700">{result.error}</span>
        ) : result ? (
          <>
            <span class="block text-3xl font-semibold text-teal-900">{result.main}</span>
            <span class="mt-1 block text-sm text-stone-600">{result.weekday}</span>
          </>
        ) : (
          <span class="text-sm text-stone-500">—</span>
        )}
      </output>
      <p class="text-xs text-stone-500">{L.note}</p>
    </form>
  );
}

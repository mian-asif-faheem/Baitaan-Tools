import { useMemo, useState } from "preact/hooks";
import { hijriMonthLength, toGregorian, toHijri } from "@bt/tools/hijri";
import { getT, type Lang } from "../i18n";
import { fieldClass, hijriMonths, hijriText, Note, Result, Toggle } from "./form";


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
    <div class="bt-tool">
      <form class="bt-panel grid gap-6" onSubmit={(e) => e.preventDefault()}>
        <Toggle
          legend={L.direction}
          value={mode}
          onChange={setMode}
          variant="segmented"
          options={[
            { value: "toHijri", label: L.toHijri },
            { value: "toGregorian", label: L.toGregorian },
          ]}
        />
        {mode === "toHijri" ? (
          <label class="bt-label flex flex-col">
            {L.gregorianDate}
            <input class={fieldClass} type="date" value={greg} onInput={(e) => setGreg(e.currentTarget.value)} />
          </label>
        ) : (
          <div class="grid grid-cols-[72px_minmax(0,1fr)_88px] gap-2">
            <label class="bt-label flex flex-col">
              {L.day}
              <input class={`${fieldClass} text-center`} type="number" inputMode="numeric" min="1" max={maxDay} value={hd} onInput={(e) => setHd(e.currentTarget.value)} />
            </label>
            <label class="bt-label flex min-w-0 flex-col">
              {L.month}
              <select class={fieldClass} value={hm} onChange={(e) => setHm(e.currentTarget.value)}>
                {hijriMonths(lang).map((name, i) => <option value={String(i + 1)}>{name}</option>)}
              </select>
            </label>
            <label class="bt-label flex flex-col">
              {L.year}
              <input class={`${fieldClass} text-center`} type="number" inputMode="numeric" min="1343" max="1500" value={hy} onInput={(e) => setHy(e.currentTarget.value)} />
            </label>
          </div>
        )}
      </form>
      {result && "error" in result ? (
        <Result label={L.result} amount="—" sub={result.error} />
      ) : result ? (
        <Result label={L.result} amount={result.main} sub={result.weekday} />
      ) : (
        <Result label={L.result} amount="—" />
      )}
      <Note>{L.note}</Note>
    </div>
  );
}

import { useMemo, useState } from "preact/hooks";
import { toGregorian, toHijri } from "@bt/tools/hijri";
import { dateDiff, hijriDiff, workingDays } from "@bt/tools/hijri-dates";
import { getT, type Lang } from "../i18n";
import { Check, HijriDateInput, Result, Rows, Toggle, count, durationText, fieldClass, joinParts, numFmt } from "./form";

const todayIso = () => new Date().toISOString().slice(0, 10);
const hToStr = (d: Date) => {
  const h = toHijri(d);
  return { year: String(h.year), month: String(h.month), day: String(h.day) };
};

export default function DateDiffCalc({ lang = "ar" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.diff;
  const C = t.common;
  const num = numFmt(lang);
  const [cal, setCal] = useState<"g" | "h">("g");
  const [a, setA] = useState(todayIso());
  const [b, setB] = useState(`${new Date().getUTCFullYear() + 1}-01-01`);
  const [ha, setHa] = useState(hToStr(new Date()));
  const [hb, setHb] = useState(() => {
    const h = toHijri(new Date());
    return { year: String(h.year + 1), month: "1", day: "1" };
  });
  const [includeEnd, setIncludeEnd] = useState(false);
  // Saudi Arabia and most of the Gulf rest on Friday and Saturday; the UAE on Saturday and Sunday.
  const [weekend, setWeekend] = useState<"fs" | "ss">("fs");

  const r = useMemo(() => {
    try {
      const da = cal === "g" ? new Date(`${a}T00:00:00Z`) : toGregorian({ year: +ha.year, month: +ha.month, day: +ha.day });
      const db = cal === "g" ? new Date(`${b}T00:00:00Z`) : toGregorian({ year: +hb.year, month: +hb.month, day: +hb.day });
      if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
      return { g: dateDiff(da, db, includeEnd), h: hijriDiff(da, db), w: workingDays(da, db, weekend === "fs" ? [5, 6] : [6, 0], includeEnd) };
    } catch {
      return "error" as const;
    }
  }, [cal, a, b, ha, hb, includeEnd, weekend]);

  return (
    <div class="bt-tool">
    <form class="bt-panel grid gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Toggle
        class="sm:col-span-2"
        legend={C.calendar}
        value={cal}
        onChange={setCal}
        options={[
          { value: "g", label: C.gregorian },
          { value: "h", label: C.hijri },
        ]}
      />
      {cal === "g" ? (
        <>
          <label class="bt-label flex flex-col">
            {L.from}
            <input class={fieldClass} type="date" value={a} onInput={(e) => setA(e.currentTarget.value)} />
          </label>
          <label class="bt-label flex flex-col">
            {L.to}
            <input class={fieldClass} type="date" value={b} onInput={(e) => setB(e.currentTarget.value)} />
          </label>
        </>
      ) : (
        <>
          <HijriDateInput lang={lang} label={L.from} value={ha} onChange={setHa} />
          <HijriDateInput lang={lang} label={L.to} value={hb} onChange={setHb} />
        </>
      )}
      <Toggle
        class="sm:col-span-2"
        legend={L.weekend}
        value={weekend}
        onChange={setWeekend}
        options={[
          { value: "fs", label: L.weekendFriSat },
          { value: "ss", label: L.weekendSatSun },
        ]}
      />
      <Check class="sm:col-span-2" label={L.includeEnd} checked={includeEnd} onChange={setIncludeEnd} />

      </form>
      {r && r !== "error" ? (
        <Result class="sm:col-span-2" label={L.totalDays} amount={count(r.g.totalDays, "days", lang)}>
          <Rows
            rows={[
              { label: L.gregorianDiff, value: durationText(r.g.years, r.g.months, r.g.days, lang) },
              { label: L.hijriDiff, value: durationText(r.h.years, r.h.months, r.h.days, lang) },
              { label: L.weeks, value: r.g.weeks === 0 ? count(r.g.weekDays || 0, "days", lang) : joinParts([count(r.g.weeks, "weeks", lang), ...(r.g.weekDays ? [count(r.g.weekDays, "days", lang)] : [])], lang) },
              { label: L.workDays, value: num.format(r.w) },
            ]}
          />
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—">
          {r === "error" && <p class="mt-2 text-sm text-err">{L.error}</p>}
        </Result>
      )}
    </div>
  );
}

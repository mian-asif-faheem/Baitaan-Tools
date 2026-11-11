import { useMemo, useState } from "preact/hooks";
import { hijriAge, toGregorian, toHijri } from "@bt/tools/hijri";
import { dateDiff, nextHijriOccurrence } from "@bt/tools/hijri-dates";
import { getT, type Lang } from "../i18n";
import { HijriDateInput, Result, Rows, Toggle, count, durationText, fieldClass, gregLongFmt, hijriText } from "./form";


export default function HijriAgeCalc({ lang = "ar" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.age;
  const C = t.common;
  const gregLong = gregLongFmt(lang);
  const [cal, setCal] = useState<"g" | "h">("g");
  const [g, setG] = useState("1995-06-15");
  const [h, setH] = useState({ year: "1416", month: "1", day: "17" });

  const r = useMemo(() => {
    try {
      const birth = cal === "g" ? new Date(`${g}T00:00:00Z`) : toGregorian({ year: +h.year, month: +h.month, day: +h.day });
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (Number.isNaN(birth.getTime()) || birth >= today) return null;
      const bh = toHijri(birth);
      // A birthday on 30 of a month falls on 29 when that month has 29 days.
      let next;
      try {
        next = nextHijriOccurrence(bh.month, bh.day, today);
      } catch {
        next = nextHijriOccurrence(bh.month, Math.min(bh.day, 29), today);
      }
      return {
        hijri: hijriAge(birth, today),
        greg: dateDiff(birth, today),
        bh,
        birth,
        nextDays: next.daysLeft,
      };
    } catch {
      return null;
    }
  }, [cal, g, h]);

  return (
    <div class="bt-tool">
    <form class="bt-panel grid gap-6" onSubmit={(e) => e.preventDefault()}>
      <Toggle
        legend={C.calendar}
        value={cal}
        onChange={setCal}
        options={[
          { value: "g", label: C.gregorian },
          { value: "h", label: C.hijri },
        ]}
      />
      {cal === "g" ? (
        <label class="bt-label flex flex-col">
          {L.birth}
          <input class={fieldClass} type="date" value={g} onInput={(e) => setG(e.currentTarget.value)} />
        </label>
      ) : (
        <HijriDateInput lang={lang} label={L.birth} value={h} onChange={setH} />
      )}

      </form>
      {r ? (
        <Result label={L.result} amount={durationText(r.hijri.years, r.hijri.months, r.hijri.days, lang)}>
          <Rows
            rows={[
              { label: L.gregorianAge, value: durationText(r.greg.years, r.greg.months, r.greg.days, lang) },
              { label: L.birthHijri, value: hijriText(r.bh, lang) },
              { label: L.birthGregorian, value: gregLong.format(r.birth) },
              { label: L.totalDays, value: count(r.greg.totalDays, "days", lang), muted: true },
              { label: L.next, value: r.nextDays === 0 ? L.today : count(r.nextDays, "days", lang), muted: true },
            ]}
          />
        </Result>
      ) : (
        <Result label={L.result} amount="—">
          <p class="mt-2 text-sm text-muted">{L.error}</p>
        </Result>
      )}
    </div>
  );
}

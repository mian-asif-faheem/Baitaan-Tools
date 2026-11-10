import { useMemo, useState } from "preact/hooks";
import { HIJRI_MONTHS_AR, hijriAge, toGregorian, toHijri } from "@bt/tools/hijri";
import { dateDiff, nextHijriOccurrence } from "@bt/tools/hijri-dates";
import t from "../i18n/ar.json";
import { HijriDateInput, Result, Rows, Toggle, count, durationText, fieldClass, gregLong } from "./form";

const L = t.age;
const C = t.common;

export default function HijriAgeCalc() {
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
    <form class="grid gap-5" onSubmit={(e) => e.preventDefault()}>
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
        <label class="text-sm font-semibold">
          {L.birth}
          <input class={fieldClass} type="date" value={g} onInput={(e) => setG(e.currentTarget.value)} />
        </label>
      ) : (
        <HijriDateInput label={L.birth} value={h} onChange={setH} />
      )}

      {r ? (
        <Result label={L.result} amount={durationText(r.hijri.years, r.hijri.months, r.hijri.days)}>
          <Rows
            rows={[
              { label: L.gregorianAge, value: durationText(r.greg.years, r.greg.months, r.greg.days) },
              { label: L.birthHijri, value: `${r.bh.day} ${HIJRI_MONTHS_AR[r.bh.month - 1]} ${r.bh.year} ${t.conv.hijriSuffix}` },
              { label: L.birthGregorian, value: gregLong.format(r.birth) },
              { label: L.totalDays, value: count(r.greg.totalDays, "days"), muted: true },
              { label: L.next, value: r.nextDays === 0 ? "اليوم" : count(r.nextDays, "days"), muted: true },
            ]}
          />
        </Result>
      ) : (
        <Result label={L.result} amount="—">
          <p class="mt-2 text-sm text-stone-600">{L.error}</p>
        </Result>
      )}
    </form>
  );
}

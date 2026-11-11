/**
 * Live countdown to the next occurrence of a Hijri month/day (Umm al-Qura),
 * counting to midnight Makkah time (UTC+3).
 */
import { useEffect, useState } from "preact/hooks";
import { nextHijriOccurrence } from "@bt/tools/hijri-dates";
import { dirOf, getT, type Lang } from "../i18n";
import { gregLongFmt, hijriText, numFmt } from "./form";

const MAKKAH_OFFSET = 3 * 3600_000;

/** Today in Makkah, as a UTC-midnight Date. */
const makkahToday = (now: number) => {
  const m = new Date(now + MAKKAH_OFFSET);
  return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate()));
};

export default function Countdown({ month, day, name, lang = "ar" }: { month: number; day: number; name: string; lang?: Lang }) {
  const L = getT(lang).countdown;
  const num = numFmt(lang);
  const gregLong = gregLongFmt(lang);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Before hydration, render from the build date so the page has real content for search engines.
  const ref = now ?? Date.now();
  const next = nextHijriOccurrence(month, day, makkahToday(ref));
  const targetMs = next.gregorian.getTime() - MAKKAH_OFFSET; // midnight in Makkah
  const left = Math.max(0, targetMs - ref);
  const d = Math.floor(left / 86_400_000);
  const hh = Math.floor((left % 86_400_000) / 3_600_000);
  const mm = Math.floor((left % 3_600_000) / 60_000);
  const ss = Math.floor((left % 60_000) / 1000);
  const isToday = next.daysLeft === 0;

  const cell = (value: number, label: string) => (
    <div class="rounded-lg bg-white px-2 py-3 text-center shadow-sm">
      <span class="block text-3xl font-semibold tabular-nums text-teal-900 sm:text-4xl">{num.format(value)}</span>
      <span class="mt-1 block text-xs text-stone-500">{label}</span>
    </div>
  );

  return (
    <div class="grid gap-4">
      <output class="block rounded-xl bg-teal-50 p-4" aria-live="off">
        {isToday ? (
          <span class="block text-center text-3xl font-semibold text-teal-900">
            {name}: {L.today}
          </span>
        ) : (
          <>
            <span class="block text-sm text-teal-900">
              {L.left} {name}
            </span>
            <div class="mt-3 grid grid-cols-4 gap-2" dir={dirOf(lang)}>
              {cell(d, L.days)}
              {cell(hh, L.hours)}
              {cell(mm, L.minutes)}
              {cell(ss, L.seconds)}
            </div>
          </>
        )}
        <p class="mt-4 text-sm text-stone-700">
          {L.expected}: <strong>{gregLong.format(next.gregorian)}</strong> · {hijriText(next.hijri, lang)}
        </p>
      </output>
      <p class="text-xs text-stone-500">{L.note}</p>
    </div>
  );
}

/**
 * Live countdown to the next occurrence of a Hijri month/day (Umm al-Qura),
 * counting to midnight Makkah time (UTC+3).
 */
import { useEffect, useState } from "preact/hooks";
import Counter from "@bt/ui/fx/Counter";
import { nextHijriOccurrence } from "@bt/tools/hijri-dates";
import { dirOf, getT, type Lang } from "../i18n";
import { gregLongFmt, hijriText, numFmt, Note, Result } from "./form";

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

  // Digits roll down like a departure board as time passes (fx/Counter, from React Bits).
  const tile = (value: number, label: string) => (
    <div class="flex flex-col items-center gap-0.5 overflow-hidden rounded-2xl border border-hair bg-card px-1 pt-4 pb-3">
      <Counter
        text={num.format(value)}
        direction="down"
        class="font-['IBM_Plex_Sans_Variable',sans-serif] text-[clamp(28px,9vw,44px)] py-[0.075em] font-[650] tracking-[-0.02em]"
      />
      <span class="text-sm text-muted">{label}</span>
    </div>
  );

  return (
    <div class="bt-tool">
      {isToday ? (
        <Result label={name} amount={L.today} />
      ) : (
        <div class="flex flex-col gap-3">
          <span class="bt-label">
            {L.left} {name}
          </span>
          <div role="timer" aria-live="off" class="grid grid-cols-4 gap-2" dir={dirOf(lang)}>
            {tile(d, L.days)}
            {tile(hh, L.hours)}
            {tile(mm, L.minutes)}
            {tile(ss, L.seconds)}
          </div>
        </div>
      )}
      <div class="bt-result">
        <span class="bt-result__label">{L.expected}</span>
        <span class="text-2xl font-[650] leading-snug">{gregLong.format(next.gregorian)}</span>
        <span class="bt-result__sub">{hijriText(next.hijri, lang)}</span>
      </div>
      <Note>{L.note}</Note>
    </div>
  );
}

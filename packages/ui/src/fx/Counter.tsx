/*
 * Rolling-digit counter, ported from React Bits' Counter
 * (https://github.com/DavidHDev/react-bits, commit 9d9c687) to Preact.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Changes from the original: it takes an already formatted string (`text`), so the sites keep
 * their own number formats ("R$ 13.392,64", "SAR 36,000", Arabic-Indic digits); no intro spin;
 * the screen-reader copy uses `sr-only`; numerals are CSS-generated so they stay out of the page text. The spring physics, stagger, width morphing and
 * motion blur are the original's. Under "reduce motion" digits change instantly.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";

export interface CounterProps {
  /** The value as it should read, e.g. "$66,596.72". Every digit in it rolls; other characters fade. */
  text: string;
  /** "auto" rolls up when the number grows and down when it shrinks; a countdown wants "down". */
  direction?: "auto" | "up" | "down" | "shortest";
  /** Seconds for one digit to settle. */
  duration?: number;
  bounce?: number;
  /** Seconds between neighbouring digits starting. */
  stagger?: number;
  motionBlur?: boolean;
  /** Height of the soft fade at the top and bottom of each digit window, in em. */
  fade?: number;
  class?: string;
}

interface Slot {
  key: string;
  kind: "digit" | "symbol";
  digit: number;
  text: string;
  rank: number;
}

interface ListSlot extends Slot {
  start: number;
}

interface Item {
  kind: "digit" | "symbol";
  rank: number;
  pos: number;
  vel: number;
  target: number;
  shown: number;
  shownVel: number;
  shownTarget: number;
  wait: number;
  exiting: boolean;
  natural: number;
  el: HTMLElement | null;
  numerals: HTMLElement[] | null;
  strip: HTMLElement | null;
  blur: SVGFEGaussianBlurElement | null;
  filter: string;
  blurred: boolean;
}

interface Engine {
  items: Map<string, Item>;
  raf: number;
  last: number;
  ready: boolean;
  value: string;
  widths: number[];
  em: number;
}

const ROOT = "relative inline-flex items-baseline leading-none whitespace-nowrap [direction:ltr] [unicode-bidi:isolate] tabular-nums";
const ROW = "inline-flex items-baseline select-none";
const DIGIT = "relative box-content inline-block opacity-[var(--counter-shown,1)] text-center leading-[1em]";
const SIZER = "invisible";
const WINDOW =
  "pointer-events-none absolute top-[calc(var(--counter-fade,0em)*-1)] right-0 bottom-[calc(var(--counter-fade,0em)*-1)] left-0 overflow-hidden";
const STRIP = "absolute inset-0";
// Numerals are drawn with CSS `content`, so the page text (search engines, copy and paste) holds only the value.
const NUMERAL = "absolute inset-0 flex items-center justify-center will-change-transform before:content-[attr(data-n)]";
const SYMBOL = "relative inline-flex justify-center opacity-[var(--counter-shown,1)] [clip-path:inset(-0.5em_0)]";
const SYMBOL_TEXT = "inline-block whitespace-pre";
const BLUR = "absolute h-0 w-0 overflow-hidden";
const MEASURE = "pointer-events-none invisible absolute top-0 left-0 h-0 overflow-hidden whitespace-nowrap *:inline-block";

const TAU = Math.PI * 2;
const MASK =
  "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.0355) calc(var(--counter-fade, 0em) * 0.1667), rgba(0, 0, 0, 0.2099) calc(var(--counter-fade, 0em) * 0.3333), rgba(0, 0, 0, 0.5) calc(var(--counter-fade, 0em) * 0.5), rgba(0, 0, 0, 0.7901) calc(var(--counter-fade, 0em) * 0.6667), rgba(0, 0, 0, 0.9645) calc(var(--counter-fade, 0em) * 0.8333), #000 var(--counter-fade, 0em), #000 calc(100% - var(--counter-fade, 0em)), rgba(0, 0, 0, 0.9645) calc(100% - var(--counter-fade, 0em) * 0.8333), rgba(0, 0, 0, 0.7901) calc(100% - var(--counter-fade, 0em) * 0.6667), rgba(0, 0, 0, 0.5) calc(100% - var(--counter-fade, 0em) * 0.5), rgba(0, 0, 0, 0.2099) calc(100% - var(--counter-fade, 0em) * 0.3333), rgba(0, 0, 0, 0.0355) calc(100% - var(--counter-fade, 0em) * 0.1667), rgba(0, 0, 0, 0) 100%)";

/** Zero of each digit set the sites print: Western, Arabic-Indic, Eastern Arabic-Indic (Persian). */
const ZEROS = [0x30, 0x660, 0x6f0];

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mod = (value: number, base: number) => ((value % base) + base) % base;
const wrap = (offset: number) => mod(offset + 5, 10) - 5;
const prefersReduced = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

const stepBetween = (from: number, to: number, direction: string) => {
  const up = mod(to - from, 10);
  if (direction === "up") return up;
  if (direction === "down") return up === 0 ? 0 : up - 10;
  return up > 5 ? up - 10 : up;
};

const digitOf = (ch: string) => {
  const c = ch.charCodeAt(0);
  for (const z of ZEROS) if (c >= z && c <= z + 9) return { digit: c - z, zero: z };
  return null;
};

/**
 * Splits a formatted string into slots. Digits are keyed by their place counted from the
 * right, so "9,500" → "12,000" rolls the existing places and adds one on the left. Characters
 * before the first digit (a currency) and after the last one keep their own keys.
 */
const slotsFor = (text: string): { slots: Slot[]; zero: number } => {
  const chars = [...text];
  const idx = chars.map(digitOf);
  const first = idx.findIndex(Boolean);
  const last = idx.length - 1 - [...idx].reverse().findIndex(Boolean);
  const zero = first >= 0 ? idx[first]!.zero : 0x30;
  const slots: Slot[] = [];
  let right = idx.filter(Boolean).length;
  const seen: Record<string, number> = {};
  chars.forEach((ch, i) => {
    const d = idx[i];
    if (d) {
      right -= 1;
      slots.push({ key: `i${right}`, kind: "digit", digit: d.digit, text: "", rank: -2 * right });
      return;
    }
    let name: string;
    let rank: number;
    if (first < 0 || i < first) {
      name = `p${i}`;
      rank = -10000 + i;
    } else if (i > last) {
      name = `s${chars.length - i}`;
      rank = 10000 - (chars.length - i);
    } else {
      name = `g${right}`;
      rank = -2 * right + 1; // between place `right` (left of it) and place `right - 1`
    }
    seen[name] = (seen[name] || 0) + 1;
    slots.push({ key: seen[name] > 1 ? `${name}-${seen[name]}` : name, kind: "symbol", digit: 0, text: ch, rank: rank + seen[name] * 0.01 });
  });
  return { slots, zero };
};

/** Compares the digits only, to tell whether the number grew. */
const magnitude = (text: string) => [...text].map(digitOf).filter(Boolean).map((d) => d!.digit).join("").replace(/^0+/, "");
const compare = (a: string, b: string) => (a.length !== b.length ? a.length - b.length : a < b ? -1 : a > b ? 1 : 0);

const makeItem = (slot: Slot, position: number, shown: number): Item => ({
  kind: slot.kind,
  rank: slot.rank,
  pos: position,
  vel: 0,
  target: position,
  shown,
  shownVel: 0,
  shownTarget: shown,
  wait: 0,
  exiting: false,
  natural: 0,
  el: null,
  numerals: null,
  strip: null,
  blur: null,
  filter: "",
  blurred: false,
});

export default function Counter({
  text,
  direction = "auto",
  duration = 0.6,
  bounce = 0.15,
  stagger = 0.03,
  motionBlur = true,
  fade = 0.2,
  class: className = "",
}: CounterProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const blurId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const { slots, zero } = useMemo(() => slotsFor(text), [text]);
  const digits = useMemo(() => Array.from({ length: 10 }, (_, n) => String.fromCharCode(zero + n)), [zero]);
  const [list, setList] = useState<ListSlot[]>(() => slots.map((slot) => ({ ...slot, start: slot.kind === "digit" ? slot.digit : 0 })));

  const engine = useRef<Engine>({ items: new Map(), raf: 0, last: 0, ready: false, value: text, widths: [], em: 16 });
  const settingsRef = useRef({ direction, duration, bounce, stagger, motionBlur });
  settingsRef.current = {
    direction,
    duration: Math.max(0.05, duration),
    bounce: clamp(bounce, 0, 0.9),
    stagger: Math.max(0, stagger),
    motionBlur,
  };

  const paint = (item: Item) => {
    const el = item.el;
    if (!el) return;
    const e = engine.current;
    const s = settingsRef.current;
    const shown = clamp(item.shown, 0, 1);
    if (item.kind === "digit") {
      item.numerals?.forEach((numeral, n) => {
        numeral.style.transform = `translateY(${(wrap(n - item.pos) * 100).toFixed(3)}%)`;
      });
      if (shown >= 1) {
        el.style.width = "";
      } else {
        const at = mod(item.pos, 10);
        const low = Math.floor(at);
        const from = e.widths[low % 10] ?? 0;
        const to = e.widths[(low + 1) % 10] ?? from;
        el.style.width = `${((from + (to - from) * (at - low)) * shown).toFixed(2)}px`;
      }
      if (item.blur && item.strip) {
        const radius = s.motionBlur ? clamp((Math.abs(item.vel) - 3) * 0.006, 0, 0.09) * e.em : 0;
        if (radius > 0.25) {
          item.blur.setAttribute("stdDeviation", `0 ${radius.toFixed(2)}`);
          if (!item.blurred) {
            item.strip.style.filter = `url(#${item.filter})`;
            item.blurred = true;
          }
        } else if (item.blurred) {
          item.strip.style.filter = "";
          item.blurred = false;
        }
      }
    } else {
      el.style.width = shown >= 1 ? "" : `${(item.natural * shown).toFixed(2)}px`;
    }
    el.style.setProperty("--counter-shown", shown >= 1 ? "" : shown.toFixed(3));
  };

  const frame = (now: number) => {
    const e = engine.current;
    e.raf = 0;
    const s = settingsRef.current;
    const elapsed = clamp((now - e.last) / 1000, 0, 1 / 20);
    e.last = now;
    const reduced = prefersReduced();
    const omega = TAU / s.duration;
    const zeta = 1 - s.bounce;
    const presence = TAU / (s.duration * 0.85);
    const done: string[] = [];
    let busy = false;
    e.items.forEach((item, key) => {
      if (reduced) {
        item.wait = 0;
        item.pos = item.target;
        item.vel = 0;
        item.shown = item.shownTarget;
        item.shownVel = 0;
      } else {
        let left = elapsed;
        if (item.wait > 0) {
          const used = Math.min(item.wait, left);
          item.wait -= used;
          left -= used;
        }
        if (left > 0) {
          const steps = Math.ceil(left * 240);
          const dt = left / steps;
          for (let i = 0; i < steps; i++) {
            item.vel += (-omega * omega * (item.pos - item.target) - 2 * zeta * omega * item.vel) * dt;
            item.pos += item.vel * dt;
            item.shownVel += (-presence * presence * (item.shown - item.shownTarget) - 2 * presence * item.shownVel) * dt;
            item.shown += item.shownVel * dt;
          }
        }
      }
      const settled =
        item.wait <= 0 &&
        Math.abs(item.pos - item.target) < 0.002 &&
        Math.abs(item.vel) < 0.02 &&
        Math.abs(item.shown - item.shownTarget) < 0.002 &&
        Math.abs(item.shownVel) < 0.02;
      if (settled) {
        item.target = mod(Math.round(item.target), 10);
        item.pos = item.target;
        item.vel = 0;
        item.shown = item.shownTarget;
        item.shownVel = 0;
        if (item.exiting) done.push(key);
      } else {
        busy = true;
      }
      paint(item);
    });
    if (done.length) {
      done.forEach((key) => e.items.delete(key));
      setList((previous) => previous.filter((slot) => !done.includes(slot.key)));
    }
    if (busy) e.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const e = engine.current;
    if (e.raf || typeof window === "undefined") return;
    e.last = performance.now();
    e.raf = requestAnimationFrame(frame);
  };

  // A new value: aim each digit at its new numeral and fade places in or out.
  useIsoLayoutEffect(() => {
    const e = engine.current;
    const s = settingsRef.current;
    if (!e.ready) {
      slots.forEach((slot) => e.items.set(slot.key, makeItem(slot, slot.kind === "digit" ? slot.digit : 0, 1)));
      e.ready = true;
      e.value = text;
      return;
    }
    const previous = e.value;
    e.value = text;
    const grew = compare(magnitude(text), magnitude(previous));
    const trend = s.direction !== "auto" ? s.direction : grew > 0 ? "up" : grew < 0 ? "down" : "shortest";
    const next = new Set(slots.map((slot) => slot.key));
    const moving: Item[] = [];
    slots.forEach((slot) => {
      let item = e.items.get(slot.key);
      if (!item) {
        item = makeItem(slot, 0, 0);
        e.items.set(slot.key, item);
      }
      item.exiting = false;
      item.shownTarget = 1;
      item.rank = slot.rank;
      if (slot.kind !== "digit") return;
      const step = stepBetween(mod(Math.round(item.target), 10), slot.digit, trend);
      if (step !== 0 || item.shown < 1) {
        item.target += step;
        moving.push(item);
      }
    });
    e.items.forEach((item, key) => {
      if (next.has(key) || item.exiting) return;
      item.exiting = true;
      item.shownTarget = 0;
      if (item.kind !== "digit") return;
      item.target += stepBetween(mod(Math.round(item.target), 10), 0, trend);
      moving.push(item);
    });
    // The rightmost digit moves first, like an odometer.
    moving.sort((a, b) => b.rank - a.rank).forEach((item, order) => (item.wait = order * s.stagger));
    setList((prev) => {
      const known = new Map(prev.map((slot) => [slot.key, slot]));
      const merged: ListSlot[] = slots.map((slot) => ({ ...slot, start: known.get(slot.key)?.start ?? 0 }));
      prev.forEach((slot) => {
        if (!next.has(slot.key)) merged.push(slot);
      });
      merged.sort((a, b) => a.rank - b.rank);
      const same =
        merged.length === prev.length &&
        merged.every((slot, i) => slot.key === prev[i].key && slot.digit === prev[i].digit && slot.text === prev[i].text);
      return same ? prev : merged;
    });
    kick();
  }, [slots]);

  // After each render, hand the engine the elements it animates.
  useIsoLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const e = engine.current;
    row.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
      const item = e.items.get(el.dataset.slot ?? "");
      if (!item) return;
      item.el = el;
      if (item.kind === "digit") {
        item.numerals = [...el.querySelectorAll<HTMLElement>("[data-numeral]")];
        item.strip = el.querySelector<HTMLElement>("[data-strip]");
        item.blur = el.querySelector("feGaussianBlur");
        item.filter = el.querySelector("filter")?.id ?? "";
        if (!item.blur && item.strip) item.strip.style.filter = "";
        item.blurred = Boolean(item.blur && item.strip?.style.filter);
      } else if (item.shown < 1 || item.shownTarget < 1) {
        item.natural = el.firstElementChild?.getBoundingClientRect().width ?? 0;
      }
      paint(item);
    });
  }, [list, motionBlur]);

  // Digit widths, so a place that appears or leaves grows or shrinks smoothly.
  useIsoLayoutEffect(() => {
    const row = measureRef.current;
    const root = rootRef.current;
    if (!row || !root) return undefined;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const e = engine.current;
      e.widths = [...row.children].map((child) => child.getBoundingClientRect().width);
      e.em = parseFloat(getComputedStyle(root).fontSize) || 16;
    };
    measure();
    document.fonts?.ready?.then(measure).catch(() => {});
    if (typeof ResizeObserver === "undefined") return () => (alive = false);
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const e = engine.current;
    return () => cancelAnimationFrame(e.raf);
  }, []);

  return (
    <span ref={rootRef} class={`${ROOT} ${className}`} style={{ "--counter-fade": `${Math.max(0, fade)}em` }}>
      <span class="sr-only">{text}</span>
      <span ref={rowRef} class={ROW} aria-hidden="true">
        {list.map((slot) =>
          slot.kind === "digit" ? (
            <span key={slot.key} data-slot={slot.key} class={DIGIT}>
              <span class={SIZER}>{digits[slot.digit]}</span>
              <span class={WINDOW} style={{ maskImage: MASK, WebkitMaskImage: MASK }}>
                <span class={STRIP} data-strip="">
                  {digits.map((char, n) => (
                    <span
                      key={n}
                      class={NUMERAL}
                      data-numeral=""
                      data-n={char}
                      style={{ transform: `translateY(${wrap(n - slot.start) * 100}%)` }}
                    />
                  ))}
                </span>
              </span>
              {motionBlur && (
                <svg class={BLUR} aria-hidden="true">
                  <filter id={`${blurId}-${slot.key}`} x="-10%" y="-50%" width="120%" height="200%" color-interpolation-filters="sRGB">
                    <feGaussianBlur stdDeviation="0 0" />
                  </filter>
                </svg>
              )}
            </span>
          ) : (
            <span key={slot.key} data-slot={slot.key} class={SYMBOL}>
              <span class={SYMBOL_TEXT}>{slot.text}</span>
            </span>
          ),
        )}
      </span>
      <span ref={measureRef} class={MEASURE} aria-hidden="true">
        {digits.map((char, n) => (
          <span key={n}>{char}</span>
        ))}
      </span>
    </span>
  );
}

/*
 * Magnetic call-to-action buttons, ported from React Bits' Magnet
 * (https://github.com/DavidHDev/react-bits, Animations/Magnet) to plain DOM.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Kept: the shared pointer field where only the nearest magnet moves ("exclusive"), the pull
 * that fades out over the outer half of the padding (smoothstep), the spring (stiffness 170,
 * damping 16, mass 1) and resting when settled. Changed: it moves the element itself (no
 * wrapper), so its measured box has the current offset taken out; gentler defaults for
 * buttons (padding 80px, strength 4, at most 12px). Off for touch and "reduce motion".
 *
 * Use: data-magnet on the element.
 */

type Entry = {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  raf: number;
  last: number;
};

const PADDING = 80;
const STRENGTH = 4;
const MAX = 12;
const SPRING = { stiffness: 170, damping: 16, mass: 1 };

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function magnetAll(root: ParentNode = document) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const entries: Entry[] = [...root.querySelectorAll<HTMLElement>("[data-magnet]")].map((el) => ({
    el,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    raf: 0,
    last: 0,
  }));
  if (!entries.length) return;
  let pointer: { x: number; y: number } | null = null;
  let owner: Entry | null = null;

  // The element's box without the offset the magnet has already given it.
  const box = (e: Entry) => {
    const r = e.el.getBoundingClientRect();
    return { left: r.left - e.x, top: r.top - e.y, width: r.width, height: r.height };
  };
  const reach = (e: Entry) => {
    const r = box(e);
    const dx = pointer!.x - (r.left + r.width / 2);
    const dy = pointer!.y - (r.top + r.height / 2);
    const outside = Math.hypot(Math.max(0, Math.abs(dx) - r.width / 2), Math.max(0, Math.abs(dy) - r.height / 2));
    return { dx, dy, outside };
  };

  const target = (e: Entry) => {
    if (!pointer || owner !== e) return { x: 0, y: 0 };
    const { dx, dy, outside } = reach(e);
    if (outside > PADDING) return { x: 0, y: 0 };
    const pull = 1 - smoothstep(PADDING * 0.5, PADDING, outside);
    let x = (dx / STRENGTH) * pull;
    let y = (dy / STRENGTH) * pull;
    const len = Math.hypot(x, y);
    if (len > MAX) {
      x *= MAX / len;
      y *= MAX / len;
    }
    return { x, y };
  };

  const frame = (e: Entry) => (now: number) => {
    e.raf = 0;
    const dt = e.last ? Math.min((now - e.last) / 1000, 1 / 30) : 1 / 60;
    e.last = now;
    const t = target(e);
    const steps = Math.ceil(dt / (1 / 120));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      e.vx += ((SPRING.stiffness * (t.x - e.x) - SPRING.damping * e.vx) / SPRING.mass) * h;
      e.vy += ((SPRING.stiffness * (t.y - e.y) - SPRING.damping * e.vy) / SPRING.mass) * h;
      e.x += e.vx * h;
      e.y += e.vy * h;
    }
    const resting = Math.abs(t.x - e.x) < 0.05 && Math.abs(t.y - e.y) < 0.05 && Math.abs(e.vx) < 0.05 && Math.abs(e.vy) < 0.05;
    if (resting) {
      e.x = t.x;
      e.y = t.y;
      e.vx = e.vy = 0;
      e.last = 0;
    }
    e.el.style.translate = e.x || e.y ? `${e.x.toFixed(2)}px ${e.y.toFixed(2)}px` : "";
    if (!resting) e.raf = requestAnimationFrame(frame(e));
  };
  const wake = (e: Entry) => {
    if (!e.raf) e.raf = requestAnimationFrame(frame(e));
  };

  // The nearest magnet within reach owns the pointer; the previous owner springs back.
  const arbitrate = () => {
    let winner: Entry | null = null;
    let nearest = Infinity;
    if (pointer) {
      for (const e of entries) {
        const { outside } = reach(e);
        if (outside <= PADDING && outside < nearest) {
          winner = e;
          nearest = outside;
        }
      }
    }
    const previous = owner;
    owner = winner;
    if (previous && previous !== winner) wake(previous);
    if (winner) wake(winner);
  };

  addEventListener(
    "pointermove",
    (ev) => {
      if (ev.pointerType === "touch") return;
      pointer = { x: ev.clientX, y: ev.clientY };
      arbitrate();
    },
    { passive: true },
  );
  addEventListener("scroll", arbitrate, { passive: true, capture: true });
  document.documentElement.addEventListener("pointerleave", () => {
    pointer = null;
    arbitrate();
  });
  addEventListener("blur", () => {
    pointer = null;
    arbitrate();
  });
}

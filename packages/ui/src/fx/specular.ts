/*
 * Specular rim light on cards, after React Bits' SpecularButton
 * (https://github.com/DavidHDev/react-bits, Components/SpecularButton).
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Kept from the original: a bright band of light on the border (shineSize 10°, fade 34°) plus
 * a fainter one opposite it (0.45), resting at the top-left corner, sliding round to the side
 * nearest the pointer, brightening from the idle 0.35 to full as the pointer comes within
 * 250px, a brief flare on press, and easing toward its targets (rate 8 for the spot, 7 for the
 * brightness, press decay 5).
 * Changed: the original draws with one WebGL canvas per button; a page here has up to ~15
 * cards and browsers allow about 16 WebGL canvases, so the light is a CSS conic gradient on a
 * masked border ring instead (design.css .bt-specular). Off for "reduce motion" (rests lit).
 *
 * Use: data-specular on a card (position: relative; border-radius set).
 */

type Card = { el: HTMLElement; ring: HTMLElement; angle: number; level: number; press: number; seen: boolean };

const IDLE = 0.35;
const PROXIMITY = 250;
const REST = -45; // degrees from the top, clockwise: the top-left corner

const wrapDeg = (d: number) => ((d % 360) + 540) % 360 - 180;

export function specularAll(root: ParentNode = document) {
  const cards: Card[] = [...root.querySelectorAll<HTMLElement>("[data-specular]")].map((el) => {
    const ring = document.createElement("span");
    ring.className = "bt-specular";
    ring.setAttribute("aria-hidden", "true");
    el.append(ring);
    ring.style.setProperty("--sp-angle", `${REST}deg`);
    ring.style.setProperty("--sp-level", String(IDLE));
    return { el, ring, angle: REST, level: IDLE, press: 0, seen: true };
  });
  if (!cards.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let pointer: { x: number; y: number } | null = null;
  let raf = 0;
  let last = 0;

  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver((seen) =>
      seen.forEach((s) => {
        const c = cards.find((k) => k.el === s.target);
        if (c) c.seen = s.isIntersecting;
      }),
    );
    cards.forEach((c) => io.observe(c.el));
  }

  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    let busy = false;
    for (const c of cards) {
      if (!c.seen) continue;
      let goalAngle = REST;
      let goalLevel = IDLE;
      if (pointer) {
        const r = c.el.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        const gap = Math.hypot(Math.max(Math.abs(dx) - r.width / 2, 0), Math.max(Math.abs(dy) - r.height / 2, 0));
        const t = Math.min(1, Math.max(0, 1 - gap / PROXIMITY));
        const near = t * t * (3 - 2 * t);
        if (near > 0) {
          // Direction from the centre, scaled to the card's shape so corners land on corners.
          goalAngle = (Math.atan2(dx / (r.width / 2), -dy / (r.height / 2)) * 180) / Math.PI;
          goalLevel = IDLE + (1 - IDLE) * near;
        }
      }
      const da = wrapDeg(goalAngle - c.angle);
      c.angle = wrapDeg(c.angle + da * (1 - Math.exp(-dt * 8)));
      c.level += (goalLevel - c.level) * (1 - Math.exp(-dt * 7));
      c.press *= Math.exp(-dt * 5);
      c.ring.style.setProperty("--sp-angle", `${c.angle.toFixed(2)}deg`);
      c.ring.style.setProperty("--sp-level", Math.min(1, c.level + c.press * 0.8).toFixed(3));
      if (Math.abs(da) > 0.1 || Math.abs(goalLevel - c.level) > 0.002 || c.press > 0.002) busy = true;
    }
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
      wake();
    },
    { passive: true },
  );
  addEventListener("scroll", wake, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    pointer = null;
    wake();
  });
  cards.forEach((c) =>
    c.el.addEventListener("pointerdown", () => {
      c.press = 1;
      wake();
    }),
  );
}

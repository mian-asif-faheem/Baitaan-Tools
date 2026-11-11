/*
 * Spotlight hover effect, ported from React Bits' SpotlightCard
 * (https://github.com/DavidHDev/react-bits, commit 9d9c687) to plain DOM so one script serves every card.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Usage: give cards `data-spotlight` and the classes `relative isolate overflow-hidden`,
 * then call spotlightAll(). The light colour is the site's accent (--primary).
 */

type Opts = { intensity: number; size: number; softness: number; borderGlow: number; proximity: number; smoothing: number };
const DEFAULTS: Opts = { intensity: 0.22, size: 220, softness: 0.7, borderGlow: 0.7, proximity: 60, smoothing: 0.3 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const falloff = (color: string, softness: number) => {
  const soft = clamp(softness, 0, 1);
  const core = (1 - soft) ** 1.5 * 0.85;
  const stop = (alpha: number, at: number) => `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`;
  const list = [stop(1, 0)];
  for (let i = 0; i <= 14; i++) {
    const t = core + ((1 - core) * i) / 14;
    const g = (t - core) / (1 - core);
    const smooth = 1 - g * g * (3 - 2 * g);
    const glow = Math.exp(-4.6 * g * g) * (1 - g ** 6);
    list.push(stop(smooth + (glow - smooth) * soft, t));
  }
  return list.join(", ");
};

const MASK = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)";

function layer(root: HTMLElement, edge: boolean) {
  const el = document.createElement("span");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "absolute", inset: "0", borderRadius: "inherit", pointerEvents: "none", opacity: "0",
    zIndex: edge ? "1" : "-1",
  });
  if (edge) {
    el.style.padding = "1px";
    el.style.mask = MASK;
    el.style.setProperty("-webkit-mask", "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)");
    el.style.setProperty("-webkit-mask-composite", "xor");
  }
  root.appendChild(el);
  return el;
}

export function attachSpotlight(root: HTMLElement, opts: Partial<Opts> = {}) {
  const o = { ...DEFAULTS, ...opts };
  const light = layer(root, false);
  const edge = layer(root, true);
  const reduce = matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const state = { x: 0, y: 0, presence: 0, flare: 0, pressed: false };
  const pointer = { x: 0, y: 0, active: false };
  let focus: Element | null = null;
  let raf = 0;
  let last = 0;
  let color = "";
  let fills = { fill: "", edge: "" };

  const theme = () => {
    const dark = document.documentElement.classList.contains("dark");
    const c = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#0f766e";
    if (c !== color) {
      color = c;
      fills = { fill: falloff(c, o.softness), edge: falloff(c, 1) };
    }
    // As in the original: a softer light on light backgrounds.
    return dark ? { fill: 1, edge: 1 } : { fill: 0.45, edge: 0.8 };
  };

  const paint = () => {
    const t = theme();
    const size = o.size * (1 + 0.2 * state.flare);
    const boost = 1 + 0.7 * state.flare;
    light.style.background = `radial-gradient(circle ${size.toFixed(1)}px at ${state.x.toFixed(1)}px ${state.y.toFixed(1)}px, ${fills.fill})`;
    edge.style.background = `radial-gradient(circle ${(size * 0.6).toFixed(1)}px at ${state.x.toFixed(1)}px ${state.y.toFixed(1)}px, ${fills.edge})`;
    light.style.opacity = String(Math.min(1, state.presence * o.intensity * t.fill * boost));
    edge.style.opacity = String(Math.min(1, state.presence * o.borderGlow * t.edge * boost));
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const rect = root.getBoundingClientRect();
    let tx = state.x;
    let ty = state.y;
    let target = 0;
    if (focus && root.contains(focus)) {
      const box = focus.getBoundingClientRect();
      tx = box.left + box.width / 2 - rect.left;
      ty = box.top + box.height / 2 - rect.top;
      target = 1;
    } else if (pointer.active) {
      tx = pointer.x - rect.left;
      ty = pointer.y - rect.top;
      const gap = Math.hypot(Math.max(0, -tx, tx - rect.width), Math.max(0, -ty, ty - rect.height));
      if (gap === 0) target = 1;
      else if (o.proximity > 0) target = Math.max(0, 1 - gap / o.proximity) ** 2;
    }
    if (state.presence < 0.02 && target > 0) {
      state.x = tx;
      state.y = ty;
    }
    const follow = reduce || o.smoothing === 0 ? 1 : 1 - Math.exp(-dt / (0.015 + o.smoothing * 0.22));
    state.x += (tx - state.x) * follow;
    state.y += (ty - state.y) * follow;
    const fade = reduce ? 1 : 1 - Math.exp(-dt / (target > state.presence ? 0.1 : 0.32));
    state.presence += (target - state.presence) * fade;
    if (Math.abs(target - state.presence) < 0.002) state.presence = target;
    const press = state.pressed && !reduce ? 1 : 0;
    state.flare += (press - state.flare) * (1 - Math.exp(-dt / (press ? 0.05 : 0.28)));
    if (Math.abs(press - state.flare) < 0.002) state.flare = press;
    paint();
    const moving = Math.abs(tx - state.x) > 0.1 || Math.abs(ty - state.y) > 0.1;
    if (moving || state.presence !== target || state.flare !== press) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  return {
    move(x: number, y: number, active: boolean) {
      pointer.x = x;
      pointer.y = y;
      pointer.active = active;
      const rect = root.getBoundingClientRect();
      const near = x > rect.left - o.proximity && x < rect.right + o.proximity && y > rect.top - o.proximity && y < rect.bottom + o.proximity;
      if (near || state.presence > 0) wake();
    },
    press(down: boolean) {
      state.pressed = down;
      wake();
    },
    focus(el: Element | null) {
      focus = el;
      wake();
    },
    wake,
  };
}

/** Attaches the effect to every `[data-spotlight]` element with one set of listeners. */
export function spotlightAll(opts: Partial<Opts> = {}) {
  const cards = [...document.querySelectorAll<HTMLElement>("[data-spotlight]")].map((el) => ({ el, fx: attachSpotlight(el, opts) }));
  if (!cards.length) return;
  addEventListener("pointermove", (e) => cards.forEach((c) => c.fx.move(e.clientX, e.clientY, true)), { passive: true });
  document.addEventListener("pointerout", (e) => {
    if (!e.relatedTarget) cards.forEach((c) => c.fx.move(e.clientX, e.clientY, false));
  });
  addEventListener("pointerup", (e) =>
    cards.forEach((c) => {
      c.fx.press(false);
      if (e.pointerType !== "mouse") c.fx.move(e.clientX, e.clientY, false);
    }),
  );
  addEventListener("scroll", () => cards.forEach((c) => c.fx.wake()), { passive: true, capture: true });
  for (const { el, fx } of cards) {
    el.addEventListener("pointerdown", (e) => {
      fx.move(e.clientX, e.clientY, true);
      fx.press(true);
    });
    el.addEventListener("focusin", (e) => {
      if (e.target instanceof Element && e.target.matches(":focus-visible")) fx.focus(e.target);
    });
    el.addEventListener("focusout", (e) => {
      if (!el.contains(e.relatedTarget as Node | null)) fx.focus(null);
    });
  }
}

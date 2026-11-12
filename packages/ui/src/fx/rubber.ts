/*
 * Rubber thumb for segmented controls and menus, ported from React Bits' RubberSegment
 * (https://github.com/DavidHDev/react-bits, Micro/RubberSegment, added 2026-09-18) to plain DOM,
 * replacing the `motion` library with a small spring so it costs no extra download.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * How it looks: the highlight stretches across to the new item, then its leading edge lands
 * and the trailing edge squashes in a few pixels before settling. The highlight is a
 * clip-path over a second copy of the labels, so the text changes colour exactly at its edge.
 * Dragging the thumb (in the original) is left out: here it is a menu and a click control.
 *
 * Markup: a track holding `[data-rs-item]` elements and one `[data-rs-thumb]` (absolutely
 * positioned over the items, with a copy of each label laid out the same way).
 */

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 4); // close to cubic-bezier(.23, 1, .32, 1)
const DILATE = 0.19; // seconds the highlight takes to stretch over both items
const HANDOFF = 0.15; // seconds before the edges start landing
const STRETCH = 1; // how far it stretches: 1 = all the way to cover both items
const SQUASH = 3; // px the trailing edge overshoots

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

type Spring = { to: number; omega: number; zeta: number; done?: () => void };
type Tween = { from: number; to: number; t0: number; dur: number };
type Edge = { x: number; v: number; spring?: Spring; tween?: Tween };

export interface Rubber {
  /** Move the highlight to item `i` (-1 hides it). */
  go(i: number, animate?: boolean): void;
  measure(): void;
  destroy(): void;
}

export function rubber(track: HTMLElement, opts: { radius?: number } = {}): Rubber {
  const thumb = track.querySelector<HTMLElement>("[data-rs-thumb]")!;
  const items = () => [...track.querySelectorAll<HTMLElement>(":scope > [data-rs-item]")];
  const radius = opts.radius ?? 999;
  let slots: { l: number; r: number }[] = [];
  let width = 0;
  let current = -1;
  let raf = 0;
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let gen = 0;
  const L: Edge = { x: 0, v: 0 };
  const R: Edge = { x: 0, v: 0 };

  const paint = () => {
    const l = Math.max(0, L.x);
    const r = Math.max(0, width - R.x);
    const hidden = R.x - L.x < 0.5;
    thumb.style.clipPath = `inset(0 ${r.toFixed(2)}px 0 ${l.toFixed(2)}px round ${radius}px)`;
    thumb.style.visibility = hidden ? "hidden" : "";
  };

  const step = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let busy = false;
    for (const e of [L, R]) {
      if (e.tween) {
        const tw = e.tween;
        const p = Math.min(1, (now - tw.t0) / (tw.dur * 1000));
        const x = tw.from + (tw.to - tw.from) * EASE_OUT(p);
        e.v = dt > 0 ? (x - e.x) / dt : 0;
        e.x = x;
        if (p >= 1) e.tween = undefined;
        else busy = true;
      } else if (e.spring) {
        const s = e.spring;
        const n = Math.max(1, Math.ceil(dt * 240));
        const h = dt / n;
        for (let k = 0; k < n; k++) {
          e.v += (-s.omega * s.omega * (e.x - s.to) - 2 * s.zeta * s.omega * e.v) * h;
          e.x += e.v * h;
        }
        if (Math.abs(e.x - s.to) < 0.05 && Math.abs(e.v) < 1) {
          e.x = s.to;
          e.v = 0;
          e.spring = undefined;
          s.done?.();
        }
        if (e.spring || e.tween) busy = true;
      }
    }
    paint();
    if (busy) raf = requestAnimationFrame(step);
  };

  const kick = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(step);
  };

  // Motion's `{ type: "spring", duration, bounce }`, as stiffness and damping.
  const spring = (e: Edge, to: number, duration: number, bounce: number, done?: () => void) => {
    e.tween = undefined;
    e.spring = { to, omega: (2 * Math.PI) / duration, zeta: 1 - bounce, done };
    kick();
  };
  const tween = (e: Edge, to: number, dur: number) => {
    e.spring = undefined;
    e.tween = { from: e.x, to, t0: performance.now(), dur };
    kick();
  };

  const jump = (i: number) => {
    clearTimeout(timer);
    gen++;
    L.spring = R.spring = L.tween = R.tween = undefined;
    L.v = R.v = 0;
    const s = slots[i];
    if (s) {
      L.x = s.l;
      R.x = s.r;
    } else {
      L.x = R.x = 0;
    }
    paint();
  };

  const land = (to: number) => {
    const b = slots[to];
    if (!b) return;
    const g = ++gen;
    const dir = Math.sign((b.l + b.r) / 2 - (L.x + R.x) / 2) || 1;
    const [lead, leadTo, trail, trailTo] = dir > 0 ? [R, b.r, L, b.l] : [L, b.l, R, b.r];
    spring(lead, leadTo, 0.3, 0);
    spring(trail, trailTo + dir * SQUASH, 0.3, 0, () => {
      if (gen === g) spring(trail, trailTo, 0.16, 0);
    });
  };

  const measure = () => {
    const box = thumb.getBoundingClientRect();
    width = box.width;
    slots = items().map((el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left - box.left, r: r.right - box.left };
    });
    jump(current);
  };

  const go = (i: number, animate = true) => {
    const from = current;
    current = i;
    if (i === from) return;
    const a = slots[from];
    const b = slots[i];
    if (!animate || !b || reduced()) return jump(i);
    clearTimeout(timer);
    gen++;
    if (!a) {
      // Nothing was highlighted: grow out from the middle of the new item.
      const mid = (b.l + b.r) / 2;
      L.x = R.x = mid;
      L.v = R.v = 0;
      land(i);
      return;
    }
    tween(L, b.l + (Math.min(a.l, b.l) - b.l) * STRETCH, DILATE);
    tween(R, b.r + (Math.max(a.r, b.r) - b.r) * STRETCH, DILATE);
    timer = setTimeout(() => land(i), HANDOFF * 1000);
  };

  current = items().findIndex((el) => el.getAttribute("aria-current") === "page" || el.getAttribute("aria-checked") === "true");
  measure();
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
  ro?.observe(track);
  document.fonts?.ready.then(measure).catch(() => {});

  return {
    go,
    measure,
    destroy() {
      ro?.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    },
  };
}

/**
 * Menus of links (`nav[data-rs-nav]`): clicking a link sends the highlight over to it, and
 * the page changes as it lands. Modified clicks (new tab) are left alone.
 */
export function rubberNavAll(root: ParentNode = document) {
  // The header's height, so a hero band can run up behind it (design.css).
  const header = document.querySelector<HTMLElement>(".bt-header");
  if (header && typeof ResizeObserver === "function") {
    new ResizeObserver(() => document.documentElement.style.setProperty("--hh", `${header.offsetHeight}px`)).observe(header);
  }
  root.querySelectorAll<HTMLElement>("[data-rs-nav]").forEach((track) => {
    const r = rubber(track);
    const links = [...track.querySelectorAll<HTMLAnchorElement>(":scope > a[data-rs-item]")];
    // On narrow screens the menu scrolls sideways: bring this page's link into view.
    const cur = links.find((l) => l.getAttribute("aria-current") === "page");
    const scroller = track.parentElement;
    if (cur && scroller && scroller.scrollWidth > scroller.clientWidth) {
      const a = cur.getBoundingClientRect();
      const b = scroller.getBoundingClientRect();
      scroller.scrollLeft += a.left + a.width / 2 - (b.left + b.width / 2);
    }
    links.forEach((a, i) => {
      a.addEventListener("click", (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.getAttribute("aria-current") === "page") return;
        e.preventDefault();
        links.forEach((l) => l.removeAttribute("aria-current"));
        a.setAttribute("aria-current", "page");
        r.go(i);
        setTimeout(() => location.assign(a.href), reduced() ? 0 : 260);
      });
    });
    // Back/forward from the cache: put the highlight back on this page's link.
    addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      const here = links.findIndex((l) => new URL(l.href).pathname === location.pathname);
      links.forEach((l, k) => (k === here ? l.setAttribute("aria-current", "page") : l.removeAttribute("aria-current")));
      r.go(here, false);
    });
  });
}

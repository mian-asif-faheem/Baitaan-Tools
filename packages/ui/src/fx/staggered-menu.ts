/*
 * Small-screen menu, ported from React Bits' StaggeredMenu
 * (https://github.com/DavidHDev/react-bits, Components/StaggeredMenu) to plain DOM.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Kept: coloured layers that sweep in one after another (0.07s apart, 0.5s, power4.out), the
 * panel after them (0.65s), big labels rising from 140% with a 10° tilt (1s, 0.1s stagger),
 * numbers fading in, the extra links rising 25px, and the quick close (0.32s, power3.in).
 * Changed: the browser's own animations replace GSAP; an icon-only button whose three lines turn
 * into a "×" (CSS, on aria-expanded) replaces the "Menu"/"Close" label; the colours come from the site's palette;
 * it slides in from the end side (right, or left in Arabic); it acts as a dialog (Escape closes,
 * focus stays inside, the page behind is inert and does not scroll). "Reduce motion": no movement.
 *
 * Markup: [data-sm-toggle] button and [data-sm] overlay
 * (with .bt-sm__layer elements and a [data-sm-panel]).
 */

const OUT4 = "cubic-bezier(0.165, 0.84, 0.44, 1)"; // power4.out
const OUT3 = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // power3.out
const OUT2 = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"; // power2.out
const IN3 = "cubic-bezier(0.55, 0.055, 0.675, 0.19)"; // power3.in

export function staggeredMenu() {
  const btn = document.querySelector<HTMLButtonElement>("[data-sm-toggle]");
  const root = document.querySelector<HTMLElement>("[data-sm]");
  if (!btn || !root) return;
  const panel = root.querySelector<HTMLElement>("[data-sm-panel]")!;
  const layers = [...root.querySelectorAll<HTMLElement>(".bt-sm__layer")];
  const [openLabel, closeLabel] = [btn.dataset.open ?? "Menu", btn.dataset.close ?? "Close"];
  const rtl = document.documentElement.dir === "rtl";
  const off = rtl ? "-100%" : "100%";
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let open = false;
  let running: Animation[] = [];
  let returnFocus: HTMLElement | null = null;

  const stop = () => {
    running.forEach((a) => a.cancel());
    running = [];
  };
  const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, { fill: "both", ...opts });
    running.push(a);
    return a;
  };
  const behind = () => [...document.body.children].filter((el) => el !== root && !el.contains(btn)) as HTMLElement[];

  const show = () => {
    stop();
    open = true;
    returnFocus = document.activeElement as HTMLElement | null;
    root.hidden = false;
    root.dataset.open = "";
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", closeLabel);
    document.documentElement.classList.add("bt-sm-lock");
    behind().forEach((el) => el.setAttribute("inert", ""));
    const labels = [...panel.querySelectorAll<HTMLElement>(".bt-sm__label")];
    const nums = [...panel.querySelectorAll<HTMLElement>(".bt-sm__num")];
    const extras = [...panel.querySelectorAll<HTMLElement>(".bt-sm__extra > *")];
    if (still()) {
      panel.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
      return;
    }
    layers.forEach((l, i) => play(l, [{ transform: `translateX(${off})` }, { transform: "none" }], { duration: 500, delay: i * 70, easing: OUT4 }));
    const panelAt = (layers.length - 1) * 70 + 80;
    play(panel, [{ transform: `translateX(${off})` }, { transform: "none" }], { duration: 650, delay: panelAt, easing: OUT4 });
    const itemsAt = panelAt + 650 * 0.15;
    labels.forEach((l, i) =>
      play(l, [{ transform: "translateY(140%) rotate(10deg)" }, { transform: "none" }], { duration: 1000, delay: itemsAt + i * 100, easing: OUT4 }),
    );
    nums.forEach((n, i) => play(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: itemsAt + 100 + i * 80, easing: OUT2 }));
    extras.forEach((x, i) =>
      play(x, [{ opacity: 0, transform: "translateY(25px)" }, { opacity: 1, transform: "none" }], { duration: 550, delay: panelAt + 260 + i * 80, easing: OUT3 }),
    );
    setTimeout(() => open && panel.querySelector<HTMLElement>("a")?.focus({ preventScroll: true }), panelAt + 200);
  };

  const hide = (refocus = true) => {
    if (!open) return;
    open = false;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", openLabel);
    delete root.dataset.open;
    document.documentElement.classList.remove("bt-sm-lock");
    behind().forEach((el) => el.removeAttribute("inert"));
    const done = () => {
      if (open) return;
      stop();
      root.hidden = true;
    };
    if (refocus) (returnFocus && document.contains(returnFocus) ? returnFocus : btn).focus({ preventScroll: true });
    if (still()) {
      done();
      return;
    }
    const all = [...layers, panel];
    const anims = all.map((el) =>
      el.animate([{ transform: getComputedStyle(el).transform === "none" ? "none" : getComputedStyle(el).transform }, { transform: `translateX(${off})` }], {
        duration: 320,
        easing: IN3,
        fill: "forwards",
      }),
    );
    running.push(...anims);
    anims[anims.length - 1].onfinish = done;
  };

  btn.addEventListener("click", () => (open ? hide() : show()));
  root.addEventListener("click", (e) => {
    if (e.target === root) hide();
    else if ((e.target as Element).closest("a")) hide(false);
  });
  addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
      return;
    }
    if (e.key !== "Tab") return;
    // Keep focus in the menu and its button.
    const stops = [btn, ...panel.querySelectorAll<HTMLElement>("a[href], button")];
    const i = stops.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) {
      e.preventDefault();
      stops[stops.length - 1].focus();
    } else if (!e.shiftKey && i === stops.length - 1) {
      e.preventDefault();
      stops[0].focus();
    }
  });
  // Close if the window grows to the desktop menu, or when coming back to a page from history.
  matchMedia("(min-width: 1024px)").addEventListener("change", (m) => m.matches && hide(false));
  addEventListener("pageshow", () => hide(false));
}

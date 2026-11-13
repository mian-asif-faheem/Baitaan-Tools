/*
 * Content that slides and fades in as it scrolls into view, ported from React Bits'
 * AnimatedContent (https://github.com/DavidHDev/react-bits, Animations/AnimatedContent).
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Kept: vertical slide plus fade from opacity 0, the power3.out ease, threshold 0.1, once,
 * and the per-child stagger. Changed: the browser's own animations replace GSAP and
 * ScrollTrigger (nothing extra to download); a shorter 40px slide and 0.7s duration suit
 * content better than the 100px default. Content that is already on screen when the page
 * loads is left alone, so nothing above the fold flickers. Without JavaScript, or with
 * "reduce motion", everything simply shows.
 *
 * Use: data-animate on a block. data-animate="stagger" animates its children one after another.
 */

const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // GSAP power3.out
const DISTANCE = 40;
const DURATION = 700;
const STAGGER = 80;

export function animateContentAll(root: ParentNode = document) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver !== "function") return;
  const blocks = [...root.querySelectorAll<HTMLElement>("[data-animate]")];
  const below = blocks.filter((el) => el.getBoundingClientRect().top > innerHeight * 0.95);
  if (!below.length) return;

  const targets = (el: HTMLElement) =>
    el.dataset.animate === "stagger" && el.children.length ? ([...el.children] as HTMLElement[]) : [el];

  // Hide only what will animate in.
  below.forEach((el) => targets(el).forEach((t) => (t.style.opacity = "0")));

  const io = new IntersectionObserver(
    (seen) => {
      seen.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        targets(entry.target as HTMLElement).forEach((t, i) => {
          const run = t.animate(
            [
              { opacity: 0, transform: `translateY(${DISTANCE}px)` },
              { opacity: 1, transform: "none" },
            ],
            { duration: DURATION, delay: i * STAGGER, easing: EASE, fill: "both" },
          );
          run.onfinish = () => {
            t.style.opacity = "";
            run.cancel();
          };
        });
      });
    },
    { threshold: 0.1 },
  );
  below.forEach((el) => io.observe(el));
}

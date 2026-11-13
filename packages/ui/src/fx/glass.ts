/*
 * Liquid-glass header, ported from React Bits' GlassSurface
 * (https://github.com/DavidHDev/react-bits, Components/GlassSurface) to plain DOM.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use as part of this website; the component itself may not be sold or redistributed.
 * Full licence: packages/ui/src/fx/LICENSE-react-bits.md
 *
 * Kept from the original: the SVG displacement map (red/blue edge gradients, soft grey centre),
 * the three displaced colour channels blended back together (the slight colour split at the
 * edges), the sheen and rim layers of the frosted fallback, and the browser check (Chromium
 * only; Safari and Firefox can't use an SVG filter in backdrop-filter).
 * Left out: the WebGL renderer and shape tracing. Changed: a blur and a light tint are added
 * inside the glass (design.css), so the menu text stays readable over any content.
 *
 * Markup (BaseLayout, `glass` prop): the bar carries data-bt-glass, an <svg> with the filter
 * #bt-glass-filter, and the sheen/rim spans.
 */

const SETTINGS = {
  borderWidth: 0.07,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  distortionScale: -130, // original -180; softer so text passing under the edges stays calm
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20,
  xChannel: "R",
  yChannel: "G",
  mixBlendMode: "difference",
};

/** Same test as the original: Chromium with SVG filters in backdrop-filter. */
const supportsSvgBackdrop = (filterId: string) => {
  const ua = navigator.userAgent;
  if ((/Safari/.test(ua) && !/Chrome/.test(ua)) || /Firefox/.test(ua)) return false;
  const div = document.createElement("div");
  div.style.backdropFilter = `url(#${filterId})`;
  return div.style.backdropFilter !== "";
};

/** The displacement map: red across, blue down, a blurred mid-grey centre (no shift there). */
const displacementMap = (w: number, h: number, radius: number) => {
  const s = SETTINGS;
  const edge = Math.min(w, h) * (s.borderWidth * 0.5);
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
      <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
      <filter id="s" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${s.blur}"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="black"/>
    <rect width="${w}" height="${h}" rx="${radius}" fill="url(#r)"/>
    <rect width="${w}" height="${h}" rx="${radius}" fill="url(#b)" style="mix-blend-mode:${s.mixBlendMode}"/>
    <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${radius}" fill="hsl(0 0% ${s.brightness}% / ${s.opacity})" filter="url(#s)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export function glassAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-bt-glass]").forEach((bar) => {
    const filter = bar.querySelector<SVGFilterElement>("filter");
    if (!filter || !supportsSvgBackdrop(filter.id)) return; // stays on the frosted fallback
    const image = filter.querySelector("feImage");
    const s = SETTINGS;
    filter.querySelectorAll<SVGFEDisplacementMapElement>("feDisplacementMap").forEach((d, i) => {
      d.setAttribute("scale", String(s.distortionScale + [s.redOffset, s.greenOffset, s.blueOffset][i]));
      d.setAttribute("xChannelSelector", s.xChannel);
      d.setAttribute("yChannelSelector", s.yChannel);
    });
    const update = () => {
      const r = bar.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const radius = parseFloat(getComputedStyle(bar).borderTopLeftRadius) || 18;
      image?.setAttribute("href", displacementMap(Math.round(r.width), Math.round(r.height), radius));
    };
    update();
    if (typeof ResizeObserver === "function") new ResizeObserver(update).observe(bar);
    bar.classList.add("is-refractive");
  });
}

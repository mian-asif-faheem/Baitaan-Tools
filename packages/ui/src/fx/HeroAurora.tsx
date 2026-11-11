import { useEffect, useState } from "preact/hooks";
import Aurora from "./Aurora";

/** Reads the hero colours from the site's palette (CSS variables) for the current theme. */
function readTheme() {
  const doc = document.documentElement;
  const css = getComputedStyle(doc);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    dark: doc.classList.contains("dark"),
    stops: [v("--hero-1", "#0f766e"), v("--hero-2", "#5eead4"), v("--hero-3", "#0f766e")],
  };
}

/**
 * Animated aurora behind the home-page heading. Only loads on browsers with WebGL2,
 * pauses off-screen, stays still for "reduce motion", and follows the light/dark switch.
 */
export default function HeroAurora() {
  const [theme, setTheme] = useState<ReturnType<typeof readTheme> | null>(null);
  useEffect(() => {
    const update = () => setTheme(readTheme());
    update();
    const watch = new MutationObserver(update);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);
  if (!theme) return null;
  return (
    <Aurora
      colorStops={theme.stops}
      lightMode={!theme.dark}
      amplitude={1.1}
      blend={0.75}
      speed={0.5}
      height={0.8}
      glow={theme.dark ? 0.7 : 0.45}
      opacity={theme.dark ? 0.9 : 0.75}
      mouseInteraction={false}
      dpr={1}
    />
  );
}

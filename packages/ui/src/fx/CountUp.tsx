import { useEffect, useRef, useState } from "preact/hooks";

const reduceMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Shows `value` formatted, counting up from the previous value (from 0 the first time).
 * Screen readers get only the final value, never the in-between numbers.
 */
export default function CountUp({ value, format, duration = 650 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (reduceMotion() || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const n = start + (value - start) * eased;
      from.current = n;
      setShown(t === 1 ? value : n);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span class="sr-only">{format(value)}</span>
    </>
  );
}

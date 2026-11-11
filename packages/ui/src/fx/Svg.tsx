/** Inline Phosphor icon for Preact islands. Pass a path from ../icons. */
export default function Svg({ d, size = 18, class: cls }: { d: string; size?: number; class?: string }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" class={cls}>
      <path d={d} />
    </svg>
  );
}

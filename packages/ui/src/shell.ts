import type { ShellContext } from "./BaseLayout.astro";

/** Reads what BaseLayout shared for this page (labels, nav, direction). */
export function shell(locals: unknown): ShellContext {
  const bt = (locals as { bt?: ShellContext }).bt;
  if (!bt) throw new Error("Render this component inside BaseLayout.");
  return bt;
}

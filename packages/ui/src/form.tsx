import Counter from "./fx/Counter";
import type { ComponentChildren } from "preact";
import { useEffect, useId, useRef } from "preact/hooks";
import { rubber, type Rubber } from "./fx/rubber";

/** Class for any text, number, date input or select (52px tall, 16px radius). */
export const fieldClass = "bt-input mt-1.5";

const Info = () => (
  <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true" class="mt-px flex-none">
    <path d="M128 24a104 104 0 1 0 104 104A104.1 104.1 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88 88.1 88.1 0 0 1-88 88Zm16-40a8 8 0 0 1-8 8 16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16 16 16 0 0 1 16 16v40a8 8 0 0 1 8 8Zm-32-92a12 12 0 1 1 12 12 12 12 0 0 1-12-12Z" />
  </svg>
);

export function NumberField(props: {
  label: string;
  value: string;
  onInput: (v: string) => void;
  hint?: string;
  /** Shown inside the field before the number, e.g. "$" or "R$". */
  prefix?: string;
  min?: number;
  max?: number;
  step?: string;
  class?: string;
}) {
  return (
    <label class={`flex flex-col ${props.class ?? ""}`}>
      <span class="bt-label">{props.label}</span>
      <span class="relative mt-1.5 block">
        {props.prefix && (
          <span class="bt-prefix" aria-hidden="true">
            {props.prefix}
          </span>
        )}
        <input
          class={`bt-input ${props.prefix ? "bt-input--prefixed" : ""}`}
          type="number"
          inputMode="decimal"
          min={props.min}
          max={props.max}
          step={props.step ?? "any"}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
        />
      </span>
      {props.hint && <span class="bt-hint mt-1.5">{props.hint}</span>}
    </label>
  );
}

/**
 * A choice between options. Two or three short options become a sliding segmented
 * toggle; longer or more options become large selectable rows (radio cards).
 */
export function Toggle<T extends string>(props: {
  legend: string;
  value: T;
  options: { value: T; label: string; sub?: string }[];
  onChange: (v: T) => void;
  class?: string;
  /** Force a layout instead of choosing by label length. */
  variant?: "segmented" | "rows";
}) {
  const name = useId();
  const n = props.options.length;
  const segmented =
    props.variant === "segmented" ||
    (props.variant !== "rows" && n <= 3 && props.options.every((o) => !o.sub && o.label.length <= 14));
  const i = Math.max(0, props.options.findIndex((o) => o.value === props.value));

  if (segmented) return <Segmented {...props} name={name} i={i} />;

  return (
    <fieldset class={`m-0 flex min-w-0 flex-col gap-2 border-0 p-0 ${props.class ?? ""}`}>
      <legend class="bt-label mb-2.5 p-0">{props.legend}</legend>
      {props.options.map((o) => (
        <label class="bt-radio">
          <input type="radio" name={name} checked={props.value === o.value} onChange={() => props.onChange(o.value)} />
          <span class="bt-dot" aria-hidden="true" />
          <span class="flex min-w-0 flex-col">
            <span class="text-base font-medium leading-snug">{o.label}</span>
            {o.sub && <span class="text-[13px] leading-snug text-muted">{o.sub}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** Two or three options with the rubber highlight from React Bits' RubberSegment (fx/rubber.ts). */
function Segmented<T extends string>(props: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  class?: string;
  name: string;
  i: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const r = useRef<Rubber | null>(null);
  useEffect(() => {
    r.current = rubber(track.current!);
    return () => r.current?.destroy();
  }, []);
  useEffect(() => r.current?.go(props.i), [props.i]);
  const keys = (e: KeyboardEvent) => {
    const n = props.options.length;
    const rtl = getComputedStyle(e.currentTarget as Element).direction === "rtl";
    const fwd = e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    if (!fwd && !back) return;
    e.preventDefault();
    const next = (props.i + (fwd ? 1 : n - 1)) % n;
    props.onChange(props.options[next].value);
    (track.current?.querySelectorAll<HTMLElement>("[data-rs-item]")[next])?.focus();
  };
  return (
    <div class={`flex flex-col gap-2 ${props.class ?? ""}`}>
      <span class="bt-label" id={`${props.name}-l`}>
        {props.legend}
      </span>
      <div class="bt-seg" role="radiogroup" aria-labelledby={`${props.name}-l`} ref={track} onKeyDown={keys}>
        {props.options.map((o) => (
          <button
            type="button"
            role="radio"
            data-rs-item
            aria-checked={props.value === o.value}
            tabIndex={props.value === o.value ? 0 : -1}
            onClick={() => props.onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
        <span class="bt-seg__thumb" data-rs-thumb aria-hidden="true">
          {props.options.map((o) => (
            <span>{o.label}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

export function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void; class?: string }) {
  return (
    <label class={`bt-check ${props.class ?? ""}`}>
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.currentTarget.checked)} />
      <span class="pt-px">{props.label}</span>
    </label>
  );
}

/**
 * The answer card. Pass `value` and `format` (instead of a fixed `amount`) to have the
 * digits roll to each new answer (fx/Counter, from React Bits). Children (breakdown rows, notes) go below the number.
 */
export function Result(props: {
  label: string;
  amount?: string;
  value?: number;
  format?: (n: number) => string;
  /** One line under the number, e.g. "3 años y 9 meses trabajados". */
  sub?: string;
  /** Text direction of the value. Numbers and amounts stay "ltr" (the default); a value that is
   *  words, such as an Arabic date, needs "rtl" or "auto" so its parts keep their order. */
  valueDir?: "ltr" | "rtl" | "auto";
  children?: ComponentChildren;
  class?: string;
}) {
  return (
    <output class={`bt-result ${props.class ?? ""}`} aria-live="polite">
      <span class="bt-result__label">{props.label}</span>
      <bdi dir={props.valueDir ?? "ltr"} class="bt-result__value">
        {props.value !== undefined && props.format ? <Counter text={props.format(props.value)} /> : props.amount}
      </bdi>
      {props.sub && <span class="bt-result__sub">{props.sub}</span>}
      {props.children}
    </output>
  );
}

/** Breakdown table inside the result card. `strong` marks the total row. */
export function Rows(props: { rows: { label: string; value: string; muted?: boolean; strong?: boolean }[] }) {
  return (
    <div class="bt-rows">
      {props.rows.map((r) => (
        <div class={r.strong ? "is-total" : r.muted ? "is-muted" : ""}>
          <span class="min-w-0">{r.label}</span>
          <bdi dir="ltr">{r.value}</bdi>
        </div>
      ))}
    </div>
  );
}

/** Small print with an info icon, under a result. */
export function Note(props: { children: ComponentChildren; class?: string }) {
  return (
    <p class={`bt-note text-muted ${props.class ?? ""}`}>
      <Info />
      <span>{props.children}</span>
    </p>
  );
}

import type { ComponentChildren } from "preact";

export const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-lg font-normal focus:border-teal-700 focus:outline-none";

export const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function NumberField(props: {
  label: string;
  value: string;
  onInput: (v: string) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: string;
  class?: string;
}) {
  return (
    <label class={`text-sm font-semibold ${props.class ?? ""}`}>
      {props.label}
      <input
        class={fieldClass}
        type="number"
        inputMode="decimal"
        min={props.min}
        max={props.max}
        step={props.step ?? "any"}
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
      />
      {props.hint && <span class="mt-1 block text-xs font-normal text-stone-500">{props.hint}</span>}
    </label>
  );
}

export function Toggle<T extends string>(props: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  class?: string;
}) {
  return (
    <fieldset class={props.class}>
      <legend class="text-sm font-semibold">{props.legend}</legend>
      <div class="mt-2 inline-flex flex-wrap gap-1 rounded-lg border border-stone-300 p-1">
        {props.options.map((o) => (
          <button
            type="button"
            aria-pressed={props.value === o.value}
            onClick={() => props.onChange(o.value)}
            class={`rounded-md px-3 py-1.5 text-sm ${props.value === o.value ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void; class?: string }) {
  return (
    <label class={`flex items-start gap-2 text-sm ${props.class ?? ""}`}>
      <input
        type="checkbox"
        class="mt-0.5 size-4 accent-teal-700"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

export function Result(props: { label: string; amount: string; children?: ComponentChildren; class?: string }) {
  return (
    <output class={`block rounded-lg bg-teal-50 p-4 ${props.class ?? ""}`} aria-live="polite">
      <span class="block text-sm text-teal-900">{props.label}</span>
      <span class="block text-3xl font-semibold tabular-nums text-teal-900">{props.amount}</span>
      {props.children}
    </output>
  );
}

export function Rows(props: { rows: { label: string; value: string; muted?: boolean; strong?: boolean }[] }) {
  return (
    <table class="mt-3 w-full text-sm">
      <tbody>
        {props.rows.map((r) => (
          <tr class="border-t border-teal-100">
            <td class={`py-1.5 pe-3 ${r.muted ? "text-stone-500" : "text-stone-700"} ${r.strong ? "font-semibold" : ""}`}>{r.label}</td>
            <td class={`py-1.5 text-end tabular-nums ${r.muted ? "text-stone-500" : "text-stone-800"} ${r.strong ? "font-semibold" : ""}`}>
              {r.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

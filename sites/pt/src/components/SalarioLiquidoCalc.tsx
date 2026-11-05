import { useMemo, useState } from "preact/hooks";
import { netSalary } from "@bt/tools/br";
import t from "../i18n/pt.json";

const L = t.net;
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const field = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-lg focus:border-teal-700 focus:outline-none";

export default function SalarioLiquidoCalc() {
  const [gross, setGross] = useState("5000");
  const [deps, setDeps] = useState("0");
  const [other, setOther] = useState("0");

  const r = useMemo(() => {
    const g = Number(gross);
    if (!(g > 0)) return null;
    return netSalary({ gross: g, dependents: Math.max(0, Math.floor(Number(deps) || 0)), otherDeductions: Math.max(0, Number(other) || 0) });
  }, [gross, deps, other]);

  const rows: [string, number, boolean?][] = r
    ? [
        [L.inss, -r.inss],
        [`${L.irBase}${r.usedSimplifiedDiscount ? ` (${L.simplified})` : ""}`, r.irBase, true],
        [L.irTable, r.irTable, true],
        [L.irReduction, -r.irReduction, true],
        [L.irrf, -r.irrf],
        ...(r.otherDeductions > 0 ? [[L.otherLine, -r.otherDeductions] as [string, number]] : []),
      ]
    : [];

  return (
    <form class="grid gap-4 sm:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
      <label class="text-sm font-semibold">
        {L.gross}
        <input class={field} type="number" inputMode="decimal" min="0" value={gross} onInput={(e) => setGross(e.currentTarget.value)} />
      </label>
      <label class="text-sm font-semibold">
        {L.dependents}
        <input class={field} type="number" inputMode="numeric" min="0" value={deps} onInput={(e) => setDeps(e.currentTarget.value)} />
      </label>
      <label class="text-sm font-semibold">
        {L.other}
        <input class={field} type="number" inputMode="decimal" min="0" value={other} onInput={(e) => setOther(e.currentTarget.value)} />
        <span class="mt-1 block text-xs font-normal text-stone-500">{L.otherHint}</span>
      </label>

      <output class="rounded-lg bg-teal-50 p-4 sm:col-span-3" aria-live="polite">
        {r ? (
          <>
            <span class="block text-sm text-teal-900">{L.result}</span>
            <span class="block text-3xl font-semibold text-teal-900">{brl.format(r.net)}</span>
            <table class="mt-3 w-full text-sm">
              <tbody>
                {rows.map(([label, value, info]) => (
                  <tr class="border-t border-teal-100">
                    <td class={`py-1.5 ${info ? "text-stone-500" : "text-stone-700"}`}>{label}</td>
                    <td class={`py-1.5 text-end tabular-nums ${info ? "text-stone-500" : "text-stone-800"}`}>{brl.format(value === 0 ? 0 : value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <span class="text-sm text-stone-500">—</span>
        )}
      </output>
      <p class="text-xs text-stone-500 sm:col-span-3">{L.disclaimer}</p>
    </form>
  );
}

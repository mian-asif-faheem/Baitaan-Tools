import { useMemo, useState } from "preact/hooks";
import { aguinaldo, monthlyToDaily } from "@bt/tools/mx";
import t from "../i18n/es.json";

const L = t.aguinaldo;
const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const field = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-lg focus:border-teal-700 focus:outline-none";

export default function AguinaldoCalc() {
  const [mode, setMode] = useState<"monthly" | "daily">("monthly");
  const [salary, setSalary] = useState("12000");
  const [days, setDays] = useState("365");
  const [agDays, setAgDays] = useState("15");

  const result = useMemo(() => {
    const s = Number(salary);
    const d = Number(days);
    if (!(s > 0) || !(d > 0 && d <= 365)) return null;
    const dailySalary = mode === "monthly" ? monthlyToDaily(s) : s;
    return { dailySalary, ...aguinaldo({ dailySalary, daysWorked: d, aguinaldoDays: Number(agDays) || 15 }) };
  }, [mode, salary, days, agDays]);

  return (
    <form class="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <fieldset class="sm:col-span-2">
        <legend class="text-sm font-semibold">{L.salaryType}</legend>
        <div class="mt-2 inline-flex rounded-lg border border-stone-300 p-1">
          {(["monthly", "daily"] as const).map((m) => (
            <button
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              class={`rounded-md px-4 py-1.5 text-sm ${mode === m ? "bg-teal-700 text-white" : "text-stone-600"}`}
            >
              {L[m]}
            </button>
          ))}
        </div>
      </fieldset>
      <label class="text-sm font-semibold">
        {L.salary}
        <input class={field} type="number" inputMode="decimal" min="0" value={salary} onInput={(e) => setSalary(e.currentTarget.value)} />
      </label>
      <label class="text-sm font-semibold">
        {L.daysWorked}
        <input class={field} type="number" inputMode="numeric" min="1" max="365" value={days} onInput={(e) => setDays(e.currentTarget.value)} />
      </label>
      <label class="text-sm font-semibold sm:col-span-2">
        {L.aguinaldoDays}
        <input class={field} type="number" inputMode="numeric" min="15" value={agDays} onInput={(e) => setAgDays(e.currentTarget.value)} />
        <span class="mt-1 block text-xs font-normal text-stone-500">{L.minNote}</span>
      </label>

      <output class="rounded-lg bg-teal-50 p-4 sm:col-span-2" aria-live="polite">
        {result ? (
          <>
            <span class="block text-sm text-teal-900">{L.result}</span>
            <span class="block text-3xl font-semibold text-teal-900">{mxn.format(result.proportionalAmount)}</span>
            <span class="mt-2 block text-sm text-stone-600">
              {L.fullYear}: {mxn.format(result.fullYearAmount)} · {L.dailyUsed}: {mxn.format(result.dailySalary)}
            </span>
          </>
        ) : (
          <span class="text-sm text-stone-500">—</span>
        )}
      </output>
      <p class="text-xs text-stone-500 sm:col-span-2">{L.disclaimer}</p>
    </form>
  );
}

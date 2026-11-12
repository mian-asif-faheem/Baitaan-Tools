import { useMemo, useState } from "preact/hooks";
import { monthlyToDaily, vacaciones, vacationTable } from "@bt/tools/mx";
import { getT, locale, type Lang } from "../i18n";
import { NumberField, Result, Rows, Toggle, money, Note } from "./form";

const table = vacationTable(35);
// Compress years with the same entitlement into ranges: 6–10, 11–15…
const ranges = table.reduce<{ from: number; to: number; days: number }[]>((acc, r) => {
  const last = acc.at(-1);
  if (last && last.days === r.days) last.to = r.year;
  else acc.push({ from: r.year, to: r.year, days: r.days });
  return acc;
}, []);

export default function VacacionesCalc({ lang = "es" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.vacaciones;
  const C = t.common;
  const mxn = money(lang);
  const [mode, setMode] = useState<"monthly" | "daily">("monthly");
  const [salary, setSalary] = useState("15000");
  const [years, setYears] = useState("1");
  const [prima, setPrima] = useState("25");

  const r = useMemo(() => {
    const s = Number(salary);
    const y = Number(years);
    if (!(s > 0) || !(y >= 0)) return null;
    return vacaciones({
      dailySalary: mode === "monthly" ? monthlyToDaily(s) : s,
      completedYears: Math.floor(y),
      primaPercent: Number(prima) || 25,
    });
  }, [mode, salary, years, prima]);

  return (
    <div class="bt-tool">
    <form class="bt-panel grid gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Toggle
        class="sm:col-span-2"
        legend={C.salaryType}
        value={mode}
        onChange={setMode}
        options={[
          { value: "monthly", label: C.monthly },
          { value: "daily", label: C.daily },
        ]}
      />
      <NumberField class="sm:col-span-2" label={C.salaryMxn} value={salary} onInput={setSalary} min={0} />
      <NumberField label={L.completed} value={years} onInput={setYears} min={0} step="1" />
      <NumberField label={L.prima} value={prima} onInput={setPrima} min={25} step="1" />

      </form>
      {r ? (
        <Result class="sm:col-span-2" label={L.result} amount={`${r.days} ${L.days}`}>
          <Rows
            rows={[
              { label: L.pay, value: mxn.format(r.vacationPay) },
              { label: L.prima2, value: mxn.format(r.primaVacacional) },
              { label: L.total, value: mxn.format(r.total), strong: true },
            ]}
          />
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—" />
      )}

      <div class="sm:col-span-2">
        <h2 class="text-sm font-semibold">{L.table}</h2>
        <table class="mt-2 w-full max-w-sm text-sm">
          <tbody>
            {ranges.slice(0, 10).map((g) => {
              const current = r && r.serviceYear >= g.from && r.serviceYear <= g.to;
              return (
                <tr class={`border-t border-hair ${current ? "bg-result font-semibold text-result-ink" : ""}`}>
                  <td class="py-1.5 ps-2">
                    {L.year} {g.from === g.to ? g.from : `${g.from}–${g.to}`}
                  </td>
                  <td class="py-1.5 pe-2 text-end tabular-nums">
                    {g.days} {L.daysShort}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Note>{L.disclaimer}</Note>
    </div>
  );
}

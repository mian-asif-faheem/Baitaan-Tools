import { useMemo, useState } from "preact/hooks";
import { salarioProporcional } from "@bt/tools/br";
import { getT, type Lang } from "../i18n";
import { NumberField, Result, Rows, money } from "./form";


export default function ProporcionalCalc({ lang = "pt" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.proporcional;
  const C = t.common;
  const brl = money(lang);
  const [salary, setSalary] = useState("3000");
  const [days, setDays] = useState("15");
  const [abs, setAbs] = useState("0");
  const [weeks, setWeeks] = useState("0");

  const r = useMemo(() => {
    const s = Number(salary);
    const d = Number(days);
    if (!(s > 0) || !(d >= 0 && d <= 30)) return null;
    return salarioProporcional({
      monthlySalary: s,
      daysWorked: d,
      absences: Math.max(0, Number(abs) || 0),
      weeksWithAbsence: Math.max(0, Math.floor(Number(weeks) || 0)),
    });
  }, [salary, days, abs, weeks]);

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <NumberField label={C.salary} value={salary} onInput={setSalary} min={0} />
      <NumberField label={L.days} hint={L.daysHint} value={days} onInput={setDays} min={0} max={30} step="1" />
      <NumberField label={L.absences} value={abs} onInput={setAbs} min={0} step="1" />
      <NumberField label={L.weeks} value={weeks} onInput={setWeeks} min={0} max={5} step="1" />
      {r ? (
        <Result class="sm:col-span-2" label={L.result} amount={brl.format(r.total)}>
          <Rows
            rows={[
              { label: L.daily, value: brl.format(r.daily), muted: true },
              { label: `${L.base} · ${days} ${C.days}`, value: brl.format(r.base) },
              ...(r.absenceDeduction > 0 ? [{ label: L.absenceLine, value: brl.format(-r.absenceDeduction) }] : []),
              ...(r.dsrDeduction > 0 ? [{ label: L.dsrLine, value: brl.format(-r.dsrDeduction) }] : []),
              { label: L.result, value: brl.format(r.total), strong: true },
            ]}
          />
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—" />
      )}
      <p class="text-xs text-stone-500 sm:col-span-2">{L.disclaimer}</p>
    </form>
  );
}

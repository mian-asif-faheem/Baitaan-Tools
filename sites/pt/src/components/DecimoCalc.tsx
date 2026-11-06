import { useMemo, useState } from "preact/hooks";
import { decimoTerceiro } from "@bt/tools/br";
import t from "../i18n/pt.json";
import { NumberField, Result, Rows, brl } from "./form";

const L = t.decimo;
const C = t.common;

export default function DecimoCalc() {
  const [salary, setSalary] = useState("3000");
  const [months, setMonths] = useState("12");
  const [extras, setExtras] = useState("0");
  const [deps, setDeps] = useState("0");

  const r = useMemo(() => {
    const s = Number(salary);
    const m = Math.floor(Number(months));
    if (!(s > 0) || !(m >= 1 && m <= 12)) return null;
    return decimoTerceiro({
      monthlySalary: s,
      monthsWorked: m,
      averageExtras: Math.max(0, Number(extras) || 0),
      dependents: Math.max(0, Math.floor(Number(deps) || 0)),
    });
  }, [salary, months, extras, deps]);

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <NumberField label={C.salary} value={salary} onInput={setSalary} min={0} />
      <NumberField label={L.months} hint={L.monthsHint} value={months} onInput={setMonths} min={1} max={12} step="1" />
      <NumberField label={C.extras} value={extras} onInput={setExtras} min={0} />
      <NumberField label={C.dependents} value={deps} onInput={setDeps} min={0} step="1" />

      {r ? (
        <Result class="sm:col-span-2" label={L.result} amount={brl.format(r.net)}>
          <Rows
            rows={[
              { label: L.gross, value: brl.format(r.gross), muted: true },
              { label: L.first, value: brl.format(r.firstInstallment), strong: true },
              { label: C.inss, value: brl.format(-r.inss) },
              { label: C.irTable, value: brl.format(r.irTable), muted: true },
              ...(r.irReduction > 0 ? [{ label: C.irReduction, value: brl.format(-r.irReduction), muted: true }] : []),
              { label: C.irrf, value: brl.format(-r.irrf) },
              { label: L.second, value: brl.format(r.secondInstallment), strong: true },
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

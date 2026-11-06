import { useMemo, useState } from "preact/hooks";
import { ferias } from "@bt/tools/br";
import t from "../i18n/pt.json";
import { Check, NumberField, Result, Rows, brl } from "./form";

const L = t.ferias;
const C = t.common;

export default function FeriasCalc() {
  const [salary, setSalary] = useState("3000");
  const [extras, setExtras] = useState("0");
  const [absences, setAbsences] = useState("0");
  const [sold, setSold] = useState("0");
  const [deps, setDeps] = useState("0");
  const [reduction, setReduction] = useState(true);

  const r = useMemo(() => {
    const s = Number(salary);
    if (!(s > 0)) return null;
    return ferias({
      monthlySalary: s,
      averageExtras: Math.max(0, Number(extras) || 0),
      absences: Math.max(0, Number(absences) || 0),
      daysSold: Math.max(0, Number(sold) || 0),
      dependents: Math.max(0, Math.floor(Number(deps) || 0)),
      applyReduction: reduction,
    });
  }, [salary, extras, absences, sold, deps, reduction]);

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <NumberField class="sm:col-span-2" label={C.salary} value={salary} onInput={setSalary} min={0} />
      <NumberField label={L.absences} value={absences} onInput={setAbsences} min={0} step="1" />
      <NumberField label={L.sold} hint={L.soldHint} value={sold} onInput={setSold} min={0} max={10} step="1" />
      <NumberField label={C.extras} hint={C.extrasHint} value={extras} onInput={setExtras} min={0} />
      <NumberField label={C.dependents} value={deps} onInput={setDeps} min={0} step="1" />
      <Check class="sm:col-span-2" label={L.reduction} checked={reduction} onChange={setReduction} />

      {r ? (
        <Result class="sm:col-span-2" label={L.result} amount={brl.format(r.net)}>
          <span class="mt-1 block text-sm text-stone-600">
            {L.entitled} {r.entitlement} {C.days}
            {r.daysSold > 0 && ` · ${r.restDays} ${C.days} de descanso + ${r.daysSold} vendidos`}
          </span>
          {r.entitlement > 0 && (
            <Rows
              rows={[
                { label: `${L.lines.feriasPay} · ${r.restDays} ${C.days}`, value: brl.format(r.feriasPay) },
                { label: L.lines.tercoFerias, value: brl.format(r.tercoFerias) },
                ...(r.abono > 0
                  ? [
                      { label: `${L.lines.abono} · ${r.daysSold} ${C.days}`, value: brl.format(r.abono) },
                      { label: L.lines.tercoAbono, value: brl.format(r.tercoAbono) },
                    ]
                  : []),
                { label: C.gross, value: brl.format(r.gross), strong: true },
                { label: C.inss, value: brl.format(-r.inss) },
                { label: C.irTable, value: brl.format(r.irTable), muted: true },
                ...(r.irReduction > 0 ? [{ label: C.irReduction, value: brl.format(-r.irReduction), muted: true }] : []),
                { label: C.irrf, value: brl.format(-r.irrf) },
                { label: L.result, value: brl.format(r.net), strong: true },
              ]}
            />
          )}
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—" />
      )}
      <p class="text-xs text-stone-500 sm:col-span-2">{L.disclaimer}</p>
    </form>
  );
}

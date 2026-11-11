import { useMemo, useState } from "preact/hooks";
import { finiquito, monthlyToDaily, type Motivo } from "@bt/tools/mx";
import { getT, locale, type Lang } from "../i18n";
import { Check, NumberField, Result, Rows, Toggle, fieldClass, money } from "./form";


const today = () => new Date().toISOString().slice(0, 10);

export default function FiniquitoCalc({ lang = "es" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.finiquito;
  const C = t.common;
  const mxn = money(lang);
  const [motivo, setMotivo] = useState<Motivo>("renuncia");
  const [mode, setMode] = useState<"monthly" | "daily">("monthly");
  const [salary, setSalary] = useState("15000");
  const [start, setStart] = useState("2024-03-01");
  const [end, setEnd] = useState(today());
  const [unpaid, setUnpaid] = useState("0");
  const [pendingVac, setPendingVac] = useState("0");
  const [agDays, setAgDays] = useState("15");
  const [prima, setPrima] = useState("25");
  const [veinte, setVeinte] = useState(false);
  const [frontera, setFrontera] = useState(false);

  const r = useMemo(() => {
    const s = Number(salary);
    if (!(s > 0) || !start || !end) return null;
    try {
      return finiquito({
        dailySalary: mode === "monthly" ? monthlyToDaily(s) : s,
        startDate: start,
        endDate: end,
        motivo,
        unpaidDays: Math.max(0, Number(unpaid) || 0),
        pendingVacationDays: Math.max(0, Number(pendingVac) || 0),
        aguinaldoDays: Number(agDays) || 15,
        primaVacacionalPercent: Number(prima) || 25,
        include20DiasPorAnio: veinte,
        frontera,
      });
    } catch {
      return null;
    }
  }, [motivo, mode, salary, start, end, unpaid, pendingVac, agDays, prima, veinte, frontera]);

  const line = (l: { key: string; days: number; amount: number }) => ({
    label: `${L.lines[l.key as keyof typeof L.lines]}${l.key === "salarioPendiente" || l.days === 0 ? "" : ` · ${l.days.toLocaleString(locale(lang))} ${L.days}`}`,
    value: mxn.format(l.amount),
  });

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Toggle
        class="sm:col-span-2"
        legend={L.motivo}
        value={motivo}
        onChange={setMotivo}
        options={[
          { value: "renuncia", label: L.renuncia },
          { value: "despidoInjustificado", label: L.despidoInjustificado },
          { value: "despidoJustificado", label: L.despidoJustificado },
        ]}
      />
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
      <label class="text-sm font-semibold">
        {L.start}
        <input class={fieldClass} type="date" value={start} onInput={(e) => setStart(e.currentTarget.value)} />
      </label>
      <label class="text-sm font-semibold">
        {L.end}
        <input class={fieldClass} type="date" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
      </label>
      <NumberField label={L.unpaid} value={unpaid} onInput={setUnpaid} min={0} step="1" />
      <NumberField label={L.pendingVac} value={pendingVac} onInput={setPendingVac} min={0} step="1" />

      <details class="sm:col-span-2 rounded-lg border border-stone-200 p-3">
        <summary class="cursor-pointer text-sm font-semibold text-stone-700">{L.benefits}</summary>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <NumberField label={L.aguinaldoDays} value={agDays} onInput={setAgDays} min={15} step="1" />
          <NumberField label={L.prima} value={prima} onInput={setPrima} min={25} step="1" />
          <Check class="sm:col-span-2" label={C.frontera} checked={frontera} onChange={setFrontera} />
        </div>
      </details>

      {motivo === "despidoInjustificado" && (
        <Check class="sm:col-span-2" label={L.veinte} checked={veinte} onChange={setVeinte} />
      )}

      {r ? (
        <Result class="sm:col-span-2" label={L.resultTotal} value={r.total} format={mxn.format}>
          <span class="mt-1 block text-sm text-stone-600">
            {L.service}: {r.yearsOfService.toLocaleString(locale(lang))} {L.years}
            {r.liquidacion.length > 0 && ` · ${L.sdi}: ${mxn.format(r.sdi)}`}
          </span>
          <h3 class="mt-4 text-sm font-semibold text-teal-900">{L.finiquitoTitle}</h3>
          <Rows rows={[...r.finiquito.filter((l) => l.amount > 0).map(line), { label: L.finiquitoTitle, value: mxn.format(r.totalFiniquito), strong: true }]} />
          {r.liquidacion.length > 0 ? (
            <>
              <h3 class="mt-4 text-sm font-semibold text-teal-900">{L.liquidacionTitle}</h3>
              <Rows rows={[...r.liquidacion.map(line), { label: L.liquidacionTitle, value: mxn.format(r.totalLiquidacion), strong: true }]} />
            </>
          ) : (
            motivo === "renuncia" && <p class="mt-3 text-sm text-stone-600">{L.noLiquidacion}</p>
          )}
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.resultTotal} amount="—" />
      )}
      <p class="text-xs text-stone-500 sm:col-span-2">{L.disclaimer}</p>
    </form>
  );
}

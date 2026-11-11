import { useMemo, useState } from "preact/hooks";
import { horasExtras } from "@bt/tools/br";
import { getT, locale, type Lang } from "../i18n";
import { NumberField, Result, Rows, Toggle, money } from "./form";

type Divisor = "220" | "200" | "180" | "150";

export default function HorasExtrasCalc({ lang = "pt" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.horas;
  const C = t.common;
  const brl = money(lang);
  const [salary, setSalary] = useState("2200");
  const [divisor, setDivisor] = useState<Divisor>("220");
  const [h50, setH50] = useState("10");
  const [pct, setPct] = useState("50");
  const [h100, setH100] = useState("0");
  const [night, setNight] = useState("0");
  const [wd, setWd] = useState("25");
  const [rd, setRd] = useState("5");

  const r = useMemo(() => {
    const s = Number(salary);
    if (!(s > 0)) return null;
    return horasExtras({
      monthlySalary: s,
      divisor: Number(divisor),
      hours50: Math.max(0, Number(h50) || 0),
      overtimePercent: Number(pct) || 50,
      hours100: Math.max(0, Number(h100) || 0),
      nightClockHours: Math.max(0, Number(night) || 0),
      workingDays: Math.max(1, Number(wd) || 25),
      restDays: Math.max(0, Number(rd) || 0),
    });
  }, [salary, divisor, h50, pct, h100, night, wd, rd]);

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <NumberField class="sm:col-span-2" label={C.salary} value={salary} onInput={setSalary} min={0} />
      <Toggle
        class="sm:col-span-2"
        legend={L.jornada}
        value={divisor}
        onChange={setDivisor}
        options={[
          { value: "220", label: L.j44 },
          { value: "200", label: L.j40 },
          { value: "180", label: L.j36 },
          { value: "150", label: L.j30 },
        ]}
      />
      <NumberField label={L.h50} value={h50} onInput={setH50} min={0} />
      <NumberField label={L.pct} hint={L.pctHint} value={pct} onInput={setPct} min={50} step="1" />
      <NumberField label={L.h100} value={h100} onInput={setH100} min={0} />
      <NumberField label={L.night} hint={L.nightHint} value={night} onInput={setNight} min={0} />
      <NumberField label={L.workingDays} value={wd} onInput={setWd} min={1} max={31} step="1" />
      <NumberField label={L.restDays} value={rd} onInput={setRd} min={0} max={15} step="1" />

      {r ? (
        <Result class="sm:col-span-2" label={L.result} amount={brl.format(r.total)}>
          <span class="mt-1 block text-sm text-stone-600">
            {L.hourly}: {brl.format(r.hourly)} · {L.lines.he50}: {brl.format(r.overtimeRate)}/h
          </span>
          <Rows
            rows={[
              ...(r.he50 > 0 ? [{ label: `${L.lines.he50} (${Math.max(50, Number(pct) || 50)}%)`, value: brl.format(r.he50) }] : []),
              ...(r.he100 > 0 ? [{ label: L.lines.he100, value: brl.format(r.he100) }] : []),
              ...(r.night > 0 ? [{ label: `${L.lines.night} · ${r.nightPaidHours.toLocaleString(locale(lang))} h`, value: brl.format(r.night) }] : []),
              { label: L.lines.dsr, value: brl.format(r.dsr) },
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

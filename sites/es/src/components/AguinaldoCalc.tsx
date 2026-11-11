import { useMemo, useState } from "preact/hooks";
import { aguinaldo, monthlyToDaily } from "@bt/tools/mx";
import { getT, locale, type Lang } from "../i18n";
import { money, NumberField, Note, Result, Rows, Toggle } from "./form";


export default function AguinaldoCalc({ lang = "es" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.aguinaldo;
  const mxn = money(lang);
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
    <div class="bt-tool">
      <form class="bt-panel grid gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <Toggle
          class="sm:col-span-2"
          legend={L.salaryType}
          value={mode}
          onChange={setMode}
          options={[
            { value: "monthly", label: L.monthly },
            { value: "daily", label: L.daily },
          ]}
        />
        <NumberField label={L.salary} value={salary} onInput={setSalary} min={0} />
        <NumberField label={L.daysWorked} value={days} onInput={setDays} min={1} max={365} step="1" />
        <NumberField class="sm:col-span-2" label={L.aguinaldoDays} hint={L.minNote} value={agDays} onInput={setAgDays} min={15} step="1" />
      </form>
      {result ? (
        <Result label={L.result} value={result.proportionalAmount} format={mxn.format}>
          <Rows
            rows={[
              { label: L.fullYear, value: mxn.format(result.fullYearAmount), muted: true },
              { label: L.dailyUsed, value: mxn.format(result.dailySalary), muted: true },
            ]}
          />
        </Result>
      ) : (
        <Result label={L.result} amount="—" />
      )}
      <Note>{L.disclaimer}</Note>
    </div>
  );
}

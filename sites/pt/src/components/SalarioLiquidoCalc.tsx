import { useMemo, useState } from "preact/hooks";
import { netSalary } from "@bt/tools/br";
import { getT, type Lang } from "../i18n";
import { money, NumberField, Note, Result, Rows } from "./form";


export default function SalarioLiquidoCalc({ lang = "pt" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.net;
  const brl = money(lang);
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
    <div class="bt-tool">
      <form class="bt-panel grid gap-6 sm:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
        <NumberField label={L.gross} value={gross} onInput={setGross} min={0} />
        <NumberField label={L.dependents} value={deps} onInput={setDeps} min={0} step="1" />
        <NumberField label={L.other} hint={L.otherHint} value={other} onInput={setOther} min={0} />
      </form>
      {r ? (
        <Result label={L.result} value={r.net} format={brl.format}>
          <Rows rows={rows.map(([label, value, info]) => ({ label, value: brl.format(value === 0 ? 0 : value), muted: !!info }))} />
        </Result>
      ) : (
        <Result label={L.result} amount="—" />
      )}
      <Note>{L.disclaimer}</Note>
    </div>
  );
}

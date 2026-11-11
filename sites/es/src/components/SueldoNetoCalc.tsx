import { useMemo, useState } from "preact/hooks";
import { factorIntegracion, sueldoNeto } from "@bt/tools/mx";
import { getT, locale, type Lang } from "../i18n";
import { Check, NumberField, Result, Rows, money, Note } from "./form";


export default function SueldoNetoCalc({ lang = "es" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.neto;
  const C = t.common;
  const mxn = money(lang);
  const [gross, setGross] = useState("15000");
  const [factor, setFactor] = useState(factorIntegracion().toFixed(4));
  const [other, setOther] = useState("0");
  const [frontera, setFrontera] = useState(false);

  const r = useMemo(() => {
    const g = Number(gross);
    if (!(g > 0)) return null;
    const f = Number(factor);
    return sueldoNeto({
      monthlyGross: g,
      factor: f >= 1 && f < 2 ? f : factorIntegracion(),
      frontera,
      otherDeductions: Math.max(0, Number(other) || 0),
    });
  }, [gross, factor, other, frontera]);

  return (
    <div class="bt-tool">
    <form class="bt-panel grid gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <NumberField class="sm:col-span-2" label={L.gross} value={gross} onInput={setGross} min={0} />
      <NumberField label={L.other} hint={L.otherHint} value={other} onInput={setOther} min={0} />
      <NumberField label={L.factor} hint={L.factorHint} value={factor} onInput={setFactor} min={1} max={2} step="0.0001" />
      <Check class="sm:col-span-2" label={C.frontera} checked={frontera} onChange={setFrontera} />

      </form>
      {r ? (
        <Result class="sm:col-span-2" label={L.result} value={r.net} format={mxn.format}>
          <span class="bt-result__sub">
            {L.perQuincena}: {mxn.format(r.net / 2)}
          </span>
          {r.minimumWageExempt && <p class="mt-3 text-sm">{L.minWage}</p>}
          <Rows
            rows={[
              { label: L.isrBefore, value: mxn.format(r.isrBeforeSubsidio), muted: true },
              ...(r.subsidio > 0 ? [{ label: L.subsidio, value: mxn.format(-r.subsidio), muted: true }] : []),
              { label: L.isr, value: mxn.format(-r.isr) },
              { label: L.imss, value: mxn.format(-r.imss) },
              ...(r.otherDeductions > 0 ? [{ label: L.otherLine, value: mxn.format(-r.otherDeductions) }] : []),
              { label: L.result, value: mxn.format(r.net), strong: true },
            ]}
          />
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—" />
      )}
      <Note>{L.disclaimer}</Note>
    </div>
  );
}

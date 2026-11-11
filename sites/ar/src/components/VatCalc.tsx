import { useMemo, useState } from "preact/hooks";
import { VAT_RATES, vat, type VatCountry } from "@bt/tools/gulf";
import { getT, type Lang } from "../i18n";
import { NumberField, Result, Rows, Toggle, numFmt } from "./form";

type Choice = VatCountry | "custom";

export default function VatCalc({ initial = "sa" as Choice, lang = "ar" }: { initial?: Choice; lang?: Lang }) {
  const L = getT(lang).vat;
  const num = numFmt(lang);
  const [country, setCountry] = useState<Choice>(initial);
  const [custom, setCustom] = useState("15");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("1000");

  const rate = country === "custom" ? Number(custom) : VAT_RATES[country];
  const r = useMemo(() => {
    const a = Number(amount);
    if (!(a >= 0) || !(rate >= 0)) return null;
    return vat(a, rate, mode);
  }, [amount, rate, mode]);

  return (
    <div class="bt-tool">
    <form class="bt-panel grid gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Toggle
        class="sm:col-span-2"
        legend={L.country}
        value={country}
        onChange={setCountry}
        options={[
          { value: "sa", label: L.sa },
          { value: "ae", label: L.ae },
          { value: "bh", label: L.bh },
          { value: "om", label: L.om },
          { value: "custom", label: L.custom },
        ]}
      />
      {country === "custom" && <NumberField class="sm:col-span-2" label={L.rate} value={custom} onInput={setCustom} min={0} max={100} />}
      <Toggle
        class="sm:col-span-2"
        legend={L.mode}
        value={mode}
        onChange={setMode}
        options={[
          { value: "add", label: L.add },
          { value: "remove", label: L.remove },
        ]}
      />
      <NumberField class="sm:col-span-2" label={L.amount} value={amount} onInput={setAmount} min={0} />
      </form>
      {r ? (
        <Result class="sm:col-span-2" label={mode === "add" ? L.gross : L.net} value={mode === "add" ? r.gross : r.net} format={num.format}>
          <Rows
            rows={[
              { label: L.net, value: num.format(r.net) },
              { label: `${L.vat} (${num.format(rate)}%)`, value: num.format(r.vat) },
              { label: L.gross, value: num.format(r.gross), strong: true },
            ]}
          />
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.gross} amount="—" />
      )}
    </div>
  );
}

import { useMemo, useState } from "preact/hooks";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, zakat } from "@bt/tools/gulf";
import { getT, type Lang } from "../i18n";
import { NumberField, Result, Rows, Toggle, numFmt } from "./form";


export default function ZakatCalc({ lang = "ar" }: { lang?: Lang }) {
  const L = getT(lang).zakat;
  const num = numFmt(lang);
  const [v, setV] = useState({ cash: "60000", gold: "0", silver: "0", investments: "0", trade: "0", receivables: "0", debts: "0" });
  const [basis, setBasis] = useState<"gold" | "silver">("gold");
  const [goldPrice, setGoldPrice] = useState("");
  const [silverPrice, setSilverPrice] = useState("");
  const set = (k: keyof typeof v) => (x: string) => setV((p) => ({ ...p, [k]: x }));

  const r = useMemo(
    () =>
      zakat({
        cash: Number(v.cash),
        goldValue: Number(v.gold),
        silverValue: Number(v.silver),
        investments: Number(v.investments),
        tradeGoods: Number(v.trade),
        receivables: Number(v.receivables),
        debts: Number(v.debts),
        goldPricePerGram: Number(goldPrice),
        silverPricePerGram: Number(silverPrice),
        nisabBasis: basis,
      }),
    [v, basis, goldPrice, silverPrice],
  );

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <NumberField label={L.cash} value={v.cash} onInput={set("cash")} min={0} />
      <NumberField label={L.gold} value={v.gold} onInput={set("gold")} min={0} />
      <NumberField label={L.silver} value={v.silver} onInput={set("silver")} min={0} />
      <NumberField label={L.investments} value={v.investments} onInput={set("investments")} min={0} />
      <NumberField label={L.trade} value={v.trade} onInput={set("trade")} min={0} />
      <NumberField label={L.receivables} value={v.receivables} onInput={set("receivables")} min={0} />
      <NumberField class="sm:col-span-2" label={L.debts} value={v.debts} onInput={set("debts")} min={0} />
      <Toggle
        class="sm:col-span-2"
        legend={L.nisabBasis}
        value={basis}
        onChange={setBasis}
        options={[
          { value: "gold", label: L.nisabGold },
          { value: "silver", label: L.nisabSilver },
        ]}
      />
      {basis === "gold" ? (
        <NumberField class="sm:col-span-2" label={L.goldPrice} hint={L.priceHint} value={goldPrice} onInput={setGoldPrice} min={0} />
      ) : (
        <NumberField class="sm:col-span-2" label={L.silverPrice} hint={L.priceHint} value={silverPrice} onInput={setSilverPrice} min={0} />
      )}

      <Result class="sm:col-span-2" label={L.result} {...(r.nisabKnown ? { value: r.zakat, format: num.format } : { amount: "—" })}>
        <Rows
          rows={[
            { label: L.net, value: num.format(r.net) },
            {
              label: `${L.nisab} (${basis === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS} ${L.gram})`,
              value: r.nisabKnown ? num.format(r.nisab) : "—",
              muted: true,
            },
            ...(r.due ? [{ label: `${L.result} (2.5%)`, value: num.format(r.zakat), strong: true }] : []),
          ]}
        />
        {!r.nisabKnown && <p class="mt-3 text-sm text-stone-600">{L.needPrice}</p>}
        {r.nisabKnown && !r.due && <p class="mt-3 text-sm text-stone-600">{L.notDue}</p>}
      </Result>
      <p class="text-xs text-stone-500 sm:col-span-2">{L.disclaimer}</p>
    </form>
  );
}

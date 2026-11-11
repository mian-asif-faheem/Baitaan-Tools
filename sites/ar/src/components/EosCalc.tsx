import { useMemo, useState } from "preact/hooks";
import { saudiEos, serviceLength, uaeGratuity, type SaudiReason } from "@bt/tools/gulf";
import { getT, type Lang } from "../i18n";
import { NumberField, Result, Rows, Toggle, count, durationText, fieldClass, money, numFmt, Note } from "./form";

const today = () => new Date().toISOString().slice(0, 10);

export default function EosCalc({ country, lang = "ar" }: { country: "sa" | "ae"; lang?: Lang }) {
  const t = getT(lang);
  const L = t.eos;
  const C = t.common;
  const num = numFmt(lang);
  const cur = money(country === "sa" ? "SAR" : "AED", lang);
  const [wage, setWage] = useState(country === "sa" ? "8000" : "5000");
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState(today());
  const [unpaid, setUnpaid] = useState("0");
  const [reason, setReason] = useState<SaudiReason>("employer");
  const [basis, setBasis] = useState<"30" | "365">("30");

  const r = useMemo(() => {
    const w = Number(wage);
    if (!(w > 0) || !start || !end) return null;
    try {
      const s = serviceLength(start, end, country === "ae" ? Number(unpaid) || 0 : 0);
      if (country === "sa") return { s, sa: saudiEos({ monthlyWage: w, years: s.decimal, reason }) };
      return { s, ae: uaeGratuity({ basicWage: w, years: s.decimal, dailyBasis: basis }) };
    } catch {
      return null;
    }
  }, [country, wage, start, end, unpaid, reason, basis]);

  const shareText = (x: number) => (x === 1 ? L.shareFull : x === 0 ? L.shareNone : x < 0.5 ? L.shareThird : L.shareTwoThirds);

  return (
    <div class="bt-tool">
    <form class="bt-panel grid gap-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      {country === "sa" && (
        <Toggle
          class="sm:col-span-2"
          legend={L.reason}
          value={reason}
          onChange={setReason}
          options={[
            { value: "employer", label: L.employer },
            { value: "resignation", label: L.resignation },
            { value: "fullResignation", label: L.fullResignation },
            { value: "art80", label: L.art80 },
          ]}
        />
      )}
      {country === "sa" && reason === "fullResignation" && <Note>{L.fullResignationHint}</Note>}
      <NumberField
        class="sm:col-span-2"
        label={country === "sa" ? L.wageSa : L.wageAe}
        hint={country === "sa" ? L.wageSaHint : L.wageAeHint}
        value={wage}
        onInput={setWage}
        min={0}
      />
      <label class="bt-label flex flex-col">
        {C.start}
        <input class={fieldClass} type="date" value={start} onInput={(e) => setStart(e.currentTarget.value)} />
      </label>
      <label class="bt-label flex flex-col">
        {C.end}
        <input class={fieldClass} type="date" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
      </label>
      {country === "ae" && (
        <>
          <NumberField label={L.unpaid} value={unpaid} onInput={setUnpaid} min={0} step="1" />
          <Toggle
            legend={L.dailyBasis}
            value={basis}
            onChange={setBasis}
            options={[
              { value: "30", label: L.basis30 },
              { value: "365", label: L.basis365 },
            ]}
          />
        </>
      )}

      </form>
      {r ? (
        <Result
          class="sm:col-span-2"
          label={L.result}
          value={r.sa ? r.sa.award : r.ae!.gratuity} format={cur.format}
        >
          <span class="bt-result__sub">
            {C.service}: {durationText(r.s.years, r.s.months, r.s.days, lang)}
          </span>
          {r.sa && (
            <>
              <Rows
                rows={[
                  { label: `${L.firstPart} · ${num.format(r.sa.firstYears)}`, value: cur.format(r.sa.firstPart) },
                  ...(r.sa.laterYears > 0 ? [{ label: `${L.restPart} · ${num.format(r.sa.laterYears)}`, value: cur.format(r.sa.restPart) }] : []),
                  { label: L.fullAward, value: cur.format(r.sa.fullAward), strong: r.sa.share === 1 },
                  ...(reason === "resignation" ? [{ label: `${L.share}: ${shareText(r.sa.share)}`, value: cur.format(r.sa.award), strong: true }] : []),
                ]}
              />
              {reason === "resignation" && r.sa.share === 0 && <p class="mt-3 text-sm opacity-85">{L.lessThanTwo}</p>}
              {reason === "art80" && <p class="mt-3 text-sm opacity-85">{L.noneArt80}</p>}
            </>
          )}
          {r.ae && (
            <>
              {!r.ae.eligible ? (
                <p class="mt-3 text-sm opacity-85">{L.lessThanYear}</p>
              ) : (
                <Rows
                  rows={[
                    { label: L.daily, value: cur.format(r.ae.daily), muted: true },
                    { label: L.daysLine, value: Number.isInteger(r.ae.days) ? count(r.ae.days, "days", lang) : `${num.format(r.ae.days)} ${C.days}` },
                    { label: L.cap, value: cur.format(r.ae.cap), muted: true },
                    { label: L.result, value: cur.format(r.ae.gratuity), strong: true },
                  ]}
                />
              )}
              {r.ae.capped && <p class="mt-3 text-sm opacity-85">{L.capped}</p>}
            </>
          )}
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—" />
      )}
      <Note>{country === "sa" ? L.disclaimerSa : L.disclaimerAe}</Note>
    </div>
  );
}

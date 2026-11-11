import { useMemo, useState } from "preact/hooks";
import { rescisao, type TipoRescisao } from "@bt/tools/br";
import { getT, type Lang } from "../i18n";
import { Check, NumberField, Result, Rows, Toggle, money, fieldClass } from "./form";

const today = () => new Date().toISOString().slice(0, 10);

export default function RescisaoCalc({ lang = "pt" }: { lang?: Lang }) {
  const t = getT(lang);
  const L = t.rescisao;
  const C = t.common;
  const brl = money(lang);
  const [tipo, setTipo] = useState<TipoRescisao>("semJustaCausa");
  const [salary, setSalary] = useState("3000");
  const [start, setStart] = useState("2024-03-01");
  const [end, setEnd] = useState(today());
  const [indenizado, setIndenizado] = useState(true);
  const [naoCumprido, setNaoCumprido] = useState(false);
  const [vencidas, setVencidas] = useState("0");
  const [fgts, setFgts] = useState("");
  const [extras, setExtras] = useState("0");
  const [deps, setDeps] = useState("0");

  const r = useMemo(() => {
    const s = Number(salary);
    if (!(s > 0) || !start || !end) return null;
    try {
      return rescisao({
        monthlySalary: s,
        startDate: start,
        endDate: end,
        tipo,
        avisoIndenizado: tipo === "pedidoDemissao" ? naoCumprido : indenizado,
        feriasVencidas: Math.max(0, Math.floor(Number(vencidas) || 0)),
        fgtsBalance: fgts.trim() === "" ? undefined : Number(fgts),
        averageExtras: Math.max(0, Number(extras) || 0),
        dependents: Math.max(0, Math.floor(Number(deps) || 0)),
      });
    } catch {
      return null;
    }
  }, [tipo, salary, start, end, indenizado, naoCumprido, vencidas, fgts, extras, deps]);

  const lineLabel = (key: string, detail?: string) => {
    const name = L.lines[key as keyof typeof L.lines];
    if (!detail) return name;
    if (key === "saldo" || key === "aviso") return `${name} · ${detail} ${C.days}`;
    if (key === "feriasVencidas") return `${name} · ${detail}`;
    return `${name} · ${detail}`;
  };

  return (
    <form class="grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Toggle
        class="sm:col-span-2"
        legend={L.tipo}
        value={tipo}
        onChange={setTipo}
        options={[
          { value: "semJustaCausa", label: L.semJustaCausa },
          { value: "pedidoDemissao", label: L.pedidoDemissao },
          { value: "acordo", label: L.acordo },
          { value: "justaCausa", label: L.justaCausa },
        ]}
      />
      <NumberField class="sm:col-span-2" label={C.salary} value={salary} onInput={setSalary} min={0} />
      <label class="text-sm font-semibold">
        {L.start}
        <input class={fieldClass} type="date" value={start} onInput={(e) => setStart(e.currentTarget.value)} />
      </label>
      <label class="text-sm font-semibold">
        {L.end}
        <input class={fieldClass} type="date" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
      </label>
      {(tipo === "semJustaCausa" || tipo === "acordo") && (
        <Check class="sm:col-span-2" label={L.avisoIndenizado} checked={indenizado} onChange={setIndenizado} />
      )}
      {tipo === "pedidoDemissao" && <Check class="sm:col-span-2" label={L.avisoNaoCumprido} checked={naoCumprido} onChange={setNaoCumprido} />}
      <NumberField label={L.vencidas} value={vencidas} onInput={setVencidas} min={0} step="1" />
      {(tipo === "semJustaCausa" || tipo === "acordo") && <NumberField label={L.fgts} hint={L.fgtsHint} value={fgts} onInput={setFgts} min={0} />}

      <details class="rounded-lg border border-stone-200 p-3 sm:col-span-2">
        <summary class="cursor-pointer text-sm font-semibold text-stone-700">{L.extrasSummary}</summary>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <NumberField label={C.extras} hint={C.extrasHint} value={extras} onInput={setExtras} min={0} />
          <NumberField label={C.dependents} value={deps} onInput={setDeps} min={0} step="1" />
        </div>
      </details>

      {r ? (
        <Result class="sm:col-span-2" label={L.result} value={r.net} format={brl.format}>
          <span class="mt-1 block text-sm text-stone-600">
            {L.service}: {r.yearsOfService} {L.years}
            {r.avisoDays > 0 && ` · ${L.avisoDays}: ${r.avisoDays} ${C.days}`}
          </span>
          <h3 class="mt-4 text-sm font-semibold text-teal-900">{L.verbas}</h3>
          <Rows
            rows={[
              ...r.lines.filter((l) => l.amount > 0).map((l) => ({ label: lineLabel(l.key, l.detail), value: brl.format(l.amount) })),
              { label: C.gross, value: brl.format(r.gross), strong: true },
            ]}
          />
          {r.totalDeductions > 0 && (
            <>
              <h3 class="mt-4 text-sm font-semibold text-teal-900">{L.descontos}</h3>
              <Rows
                rows={r.deductions
                  .filter((d) => d.amount > 0)
                  .map((d) => ({ label: L.lines[d.key as keyof typeof L.lines], value: brl.format(-d.amount) }))}
              />
            </>
          )}
          {r.fgts.fineRate > 0 ? (
            <>
              <h3 class="mt-4 text-sm font-semibold text-teal-900">{L.fgtsTitle}</h3>
              <Rows
                rows={[
                  { label: `${L.fgtsBalance}${r.fgts.estimated ? ` (${L.fgtsEstimated})` : ""}`, value: brl.format(r.fgts.balance), muted: true },
                  { label: `${L.fgtsFine} (${r.fgts.fineRate * 100}%)`, value: brl.format(r.fgts.fine) },
                  { label: `${L.fgtsWithdraw} (${r.fgts.withdrawRate * 100}%)`, value: brl.format(r.fgts.withdrawable), muted: true },
                  { label: L.totalWithFine, value: brl.format(r.totalWithFine), strong: true },
                ]}
              />
            </>
          ) : (
            <p class="mt-3 text-sm text-stone-600">{L.fgtsNoWithdraw}</p>
          )}
          <p class="mt-3 text-sm text-stone-600">{r.seguroDesemprego ? L.seguro : L.noSeguro}</p>
        </Result>
      ) : (
        <Result class="sm:col-span-2" label={L.result} amount="—" />
      )}
      <p class="text-xs text-stone-500 sm:col-span-2">{L.disclaimer}</p>
    </form>
  );
}

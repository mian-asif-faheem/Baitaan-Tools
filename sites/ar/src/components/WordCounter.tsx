import { useMemo, useState } from "preact/hooks";
import { stripDiacritics, textStats } from "@bt/tools/text";
import { getT, type Lang } from "../i18n";
import { numFmt, Note } from "./form";


export default function WordCounter({ lang = "ar" }: { lang?: Lang }) {
  const L = getT(lang).words;
  const num = numFmt(lang);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const s = useMemo(() => textStats(text), [text]);

  const stat = (value: number, label: string, big = false) => (
    <div class={`rounded-[20px] p-4 text-center ${big ? "bg-result text-result-ink" : "border border-hair bg-card shadow-elev"}`}>
      <bdi dir="ltr" class={`block font-[650] tabular-nums tracking-[-0.02em] ${big ? "text-4xl" : "text-2xl"}`}>{num.format(value)}</bdi>
      <span class={`block text-[13px] ${big ? "opacity-85" : "text-muted"}`}>{label}</span>
    </div>
  );

  return (
    <div class="bt-tool">
      <textarea
        class="bt-input min-h-56 py-4 text-lg leading-loose"
        placeholder={L.placeholder}
        value={text}
        dir="auto"
        aria-label={L.placeholder}
        onInput={(e) => setText(e.currentTarget.value)}
      />
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
        {stat(s.words, L.words, true)}
        {stat(s.chars, L.chars, true)}
        {stat(s.charsNoSpaces, L.charsNoSpaces)}
        {stat(s.charsNoDiacritics, L.charsNoDiacritics)}
        {stat(s.diacritics, L.diacritics)}
        {stat(s.sentences, L.sentences)}
        {stat(s.paragraphs, L.paragraphs)}
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!s.diacritics}
          onClick={() => setText(stripDiacritics(text))}
          class="bt-btn bt-btn--ghost"
        >
          {L.strip}
        </button>
        <button
          type="button"
          disabled={!text}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          class="bt-btn bt-btn--ghost"
        >
          {copied ? L.copied : L.copy}
        </button>
        <button type="button" disabled={!text} onClick={() => setText("")} class="bt-btn bt-btn--ghost">
          {L.clear}
        </button>
      </div>
      <Note>{L.privacy}</Note>
    </div>
  );
}

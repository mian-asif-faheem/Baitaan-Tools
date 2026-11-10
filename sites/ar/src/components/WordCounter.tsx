import { useMemo, useState } from "preact/hooks";
import { stripDiacritics, textStats } from "@bt/tools/text";
import t from "../i18n/ar.json";
import { num } from "./form";

const L = t.words;

export default function WordCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const s = useMemo(() => textStats(text), [text]);

  const stat = (value: number, label: string, big = false) => (
    <div class={`rounded-lg p-3 text-center ${big ? "bg-teal-50" : "bg-stone-50"}`}>
      <span class={`block font-semibold tabular-nums ${big ? "text-3xl text-teal-900" : "text-xl text-stone-800"}`}>{num.format(value)}</span>
      <span class="block text-xs text-stone-500">{label}</span>
    </div>
  );

  return (
    <div class="grid gap-4">
      <textarea
        class="min-h-48 w-full rounded-lg border border-stone-300 p-3 text-lg leading-loose focus:border-teal-700 focus:outline-none"
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
          class="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-40"
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
          class="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-40"
        >
          {copied ? L.copied : L.copy}
        </button>
        <button type="button" disabled={!text} onClick={() => setText("")} class="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-40">
          {L.clear}
        </button>
      </div>
      <p class="text-xs text-stone-500">{L.privacy}</p>
    </div>
  );
}

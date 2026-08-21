import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { WORDS, Word, CATEGORY_META, Category } from "../data/words";
import { Modal, ProgressBar } from "../components/ui";
import { speak } from "../lib/tts";

function StrengthBar({ wordId }: { wordId: string }) {
  const { state } = useStore();
  const card = state.cards[wordId];
  if (!card?.introducedAt) return <span className="text-xs font-extrabold text-hare uppercase">New</span>;
  const color = card.strength >= 80 ? "#58CC02" : card.strength >= 40 ? "#FFC800" : "#FF9600";
  return (
    <div className="w-24">
      <ProgressBar value={card.strength} color={color} height={8} />
      <div className="text-[10px] font-extrabold uppercase text-wolf mt-1">
        {card.strength >= 80 ? "Mastered" : card.strength >= 40 ? "Learning" : "New-ish"}
      </div>
    </div>
  );
}

export function Words() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [selected, setSelected] = useState<Word | null>(null);

  const filtered = useMemo(
    () =>
      WORDS.filter(
        (w) =>
          (cat === "all" || w.category === cat) &&
          (w.word.toLowerCase().includes(query.toLowerCase()) ||
            w.meaning.toLowerCase().includes(query.toLowerCase()))
      ),
    [query, cat]
  );

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-3xl font-black mb-4">Word Bank</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search words…"
        className="w-full border-2 border-swan rounded-2xl px-4 py-3 font-bold outline-none focus:border-macaw mb-3"
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setCat("all")}
          className={`px-4 py-2 rounded-full font-extrabold text-sm whitespace-nowrap border-2 border-b-4 ${
            cat === "all" ? "bg-eel text-white border-black" : "bg-snow border-swan hover:bg-polar"
          }`}
        >
          All · {WORDS.length}
        </button>
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-full font-extrabold text-sm whitespace-nowrap border-2 border-b-4 ${
              cat === c ? "bg-eel text-white border-black" : "bg-snow border-swan hover:bg-polar"
            }`}
          >
            {CATEGORY_META[c].icon} {CATEGORY_META[c].label.split(" (")[0]} ·{" "}
            {WORDS.filter((w) => w.category === c).length}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((w) => {
          const card = state.cards[w.id];
          return (
            <button
              key={w.id}
              onClick={() => setSelected(w)}
              className="card w-full !py-3 flex items-center gap-3 text-left hover:bg-polar transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-lg">{w.word}</div>
                <div className="text-sm text-wolf font-bold truncate">{w.meaning}</div>
              </div>
              <StrengthBar wordId={w.id} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  speak(w);
                }}
                className="w-10 h-10 shrink-0 rounded-full bg-macaw/10 text-macaw flex items-center justify-center text-lg hover:bg-macaw/20"
              >
                🔊
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-wolf font-bold py-10">No words match "{query}"</p>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-4xl font-black">{selected.word}</h2>
                <p className="text-hare italic font-bold mt-1">
                  {selected.phonetic} · {selected.pos}
                </p>
              </div>
              <button
                onClick={() => speak(selected)}
                className="w-14 h-14 rounded-full bg-macaw text-white text-2xl active:scale-95 shadow-lg"
              >
                🔊
              </button>
            </div>

            <div className="mt-4 bg-polar rounded-2xl p-4">
              <div className="font-extrabold">{selected.meaning}</div>
              <div className="text-wolf font-semibold mt-2 italic">"{selected.example}"</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="border-2 border-swan rounded-2xl p-4">
                <div className="text-xs font-extrabold uppercase text-bee tracking-wide">🧠 Mnemonic</div>
                <div className="font-bold text-sm mt-1">{selected.mnemonic}</div>
              </div>
              <div className="border-2 border-swan rounded-2xl p-4">
                <div className="text-xs font-extrabold uppercase text-beetle tracking-wide">📜 Etymology</div>
                <div className="font-bold text-sm mt-1">{selected.etymology}</div>
              </div>
              <div className="border-2 border-swan rounded-2xl p-4">
                <div className="text-xs font-extrabold uppercase text-feather tracking-wide">✅ Synonyms</div>
                <div className="font-bold text-sm mt-1">
                  {selected.synonyms.length ? selected.synonyms.join(" · ") : "—"}
                </div>
              </div>
              <div className="border-2 border-swan rounded-2xl p-4">
                <div className="text-xs font-extrabold uppercase text-cardinal tracking-wide">❌ Antonyms</div>
                <div className="font-bold text-sm mt-1">
                  {selected.antonyms.length ? selected.antonyms.join(" · ") : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-extrabold uppercase text-wolf tracking-wide mb-2">
                Memory strength
              </div>
              <StrengthBar wordId={selected.id} />
            </div>

            <button className="btn-blue w-full mt-6 py-3" onClick={() => setSelected(null)}>
              Got it
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

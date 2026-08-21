import React, { useEffect, useState } from "react";
import { WORDS } from "../data/words";
import { useStore } from "../lib/store";
import { speak } from "../lib/tts";

export function MicroSessionToast({ onOpenSession }: { onOpenSession: () => void }) {
  const { state } = useStore();
  const [visible, setVisible] = useState(false);
  const [word, setWord] = useState(WORDS[0]);

  useEffect(() => {
    if (!state.notifEnabled || !state.onboarded) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const pool = WORDS.filter((w) => !state.cards[w.id]?.introducedAt);
        setWord((pool.length ? pool : WORDS)[Math.floor(Math.random() * (pool.length || WORDS.length))]);
        setVisible(true);
        setTimeout(() => setVisible(false), 15000);
        schedule();
      }, Math.max(1, state.notifIntervalMin) * 60 * 1000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [state.notifEnabled, state.notifIntervalMin, state.onboarded]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] w-[340px] max-w-[calc(100vw-2rem)] animate-slide-up">
      <div
        className="bg-eel/95 backdrop-blur text-white rounded-2xl p-4 shadow-2xl cursor-pointer border border-white/10 hover:bg-eel transition-colors"
        onClick={() => {
          setVisible(false);
          onOpenSession();
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-hare">
            🦉 VocabBoost · Quick boost!
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
            }}
            className="text-hare hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-3xl">📖</div>
          <div className="min-w-0">
            <div className="font-extrabold text-lg">{word.word}</div>
            <div className="text-xs text-hare italic">{word.phonetic} · {word.pos}</div>
            <div className="text-sm mt-1 line-clamp-2">{word.meaning}</div>
            <div className="text-xs text-hare mt-1 italic line-clamp-1">"{word.example}"</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              speak(word);
            }}
            className="shrink-0 w-9 h-9 rounded-full bg-macaw text-white active:scale-95"
          >
            🔊
          </button>
        </div>
        <div className="mt-3 text-center text-xs font-extrabold uppercase tracking-widest text-mask">
          Tap to start a 1-min session →
        </div>
      </div>
    </div>
  );
}

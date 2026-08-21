import React, { useMemo, useState } from "react";
import { Word, WORDS, confusablePartner } from "../data/words";
import { useStore } from "../lib/store";
import { speak } from "../lib/tts";
import { Mascot } from "./Mascot";
import { Confetti, ProgressBar } from "./ui";

type ExKind = "mcq" | "reverse" | "flashcard" | "fillblank" | "listen" | "discriminative";

interface Exercise {
  kind: ExKind;
  word: Word;
  options: string[];
  answer: string;
  promptSentence?: string;
  partner?: Word;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExercises(pool: Word[], count: number): Exercise[] {
  const exs: Exercise[] = [];
  const kinds: ExKind[] = ["mcq", "reverse", "fillblank", "listen", "mcq", "discriminative"];
  for (let i = 0; i < count; i++) {
    const word = pool[i % pool.length];
    let kind = kinds[i % kinds.length];
    if (kind === "discriminative" && !confusablePartner(word.id)) {
      kind = "fillblank";
    }
    const others = shuffle(WORDS.filter((w) => w.id !== word.id)).slice(0, 3);
    if (kind === "mcq" || kind === "listen") {
      const options = shuffle([word.meaning, ...others.map((w) => w.meaning)]);
      exs.push({ kind, word, options, answer: word.meaning });
    } else if (kind === "discriminative") {
      const partner = confusablePartner(word.id)!;
      const blanked = word.example.replace(
        new RegExp(word.word.split(/\s|,/)[0], "i"),
        "______"
      );
      exs.push({
        kind,
        word,
        options: shuffle([word.word, partner.word]),
        answer: word.word,
        promptSentence: blanked,
        partner,
      });
    } else if (kind === "reverse") {
      const options = shuffle([word.word, ...others.map((w) => w.word)]);
      exs.push({ kind, word, options, answer: word.word });
    } else if (kind === "fillblank") {
      const blanked = word.example.replace(
        new RegExp(word.word.split(/\s|,/)[0], "i"),
        "______"
      );
      const distractors = others.map((w) => w.word.toLowerCase());
      const options = shuffle([word.word.toLowerCase(), ...distractors]);
      exs.push({ kind, word, options, answer: word.word.toLowerCase(), promptSentence: blanked });
    }
  }
  return exs;
}

export function LessonPlayer({
  pool,
  onExit,
  onDone,
}: {
  pool: Word[];
  onExit: () => void;
  onDone: () => void;
}) {
  const { state, dispatch } = useStore();
  const [queue] = useState(() => {
    const due = pool.filter((w) => state.cards[w.id]?.introducedAt).slice(0, 4);
    const fresh = pool.filter((w) => !state.cards[w.id]?.introducedAt).slice(0, 3);
    const combined = [...due, ...fresh];
    if (combined.length < 5) {
      combined.push(...pool.filter((w) => !combined.includes(w)).slice(0, 5 - combined.length));
    }
    return combined.slice(0, 7);
  });
  const [exercises] = useState(() =>
    buildExercises(queue.length ? queue : pool.slice(0, 5), Math.max(6, queue.length * 2))
  );
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const ex = exercises[idx];
  const total = exercises.length;
  const xpEarned = useMemo(() => correctCount * 10 + (correctCount === total ? 10 : 0), [correctCount, total]);

  if (!ex && !finished) {
    setFinished(true);
    return null;
  }

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
    const isCorrect = selected === ex.answer;
    if (isCorrect) setCorrectCount((c) => c + 1);
    dispatch({ type: "gradeWord", wordId: ex.word.id, grade: isCorrect ? 4 : 2 });
    dispatch({ type: "introduceWord", wordId: ex.word.id });
    if (!isCorrect) dispatch({ type: "loseHeart" });
  }

  function handleNext() {
    if (idx + 1 >= total) {
      const perfect = correctCount === total;
      dispatch({ type: "finishSession", xpEarned, perfect });
      setFinished(true);
      onDone();
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setChecked(false);
      setFlipped(false);
    }
  }

  if (finished) {
    const perfect = correctCount === total;
    return (
      <div className="min-h-screen bg-polar flex flex-col">
        {perfect && <Confetti />}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pop">
          <Mascot size={160} mood="cheer" />
          <h1 className={`text-3xl font-extrabold mt-4 ${perfect ? "text-bee" : "text-feather"}`}>
            {perfect ? "PERFECT SESSION!" : "SESSION COMPLETE!"}
          </h1>
          <div className="card mt-6 w-full max-w-sm grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-bee font-extrabold text-xl uppercase">Total XP</div>
              <div className="text-2xl font-extrabold text-bee">⚡{xpEarned}</div>
            </div>
            <div>
              <div className="text-macaw font-extrabold text-xl uppercase">Accuracy</div>
              <div className="text-2xl font-extrabold text-macaw">
                {Math.round((correctCount / total) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-fox font-extrabold text-xl uppercase">Streak</div>
              <div className="text-2xl font-extrabold text-fox">{state.streak}🔥</div>
            </div>
          </div>
          <button className="btn-green mt-8 px-12 py-3 text-lg" onClick={onExit}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selected === ex.answer;

  return (
    <div className="min-h-screen bg-snow flex flex-col">
      <header className="max-w-2xl w-full mx-auto px-4 pt-4 flex items-center gap-4">
        <button onClick={onExit} className="text-hare text-2xl font-black hover:text-wolf" title="Exit">
          ✕
        </button>
        <ProgressBar value={(idx / total) * 100} />
        <span className="text-cardinal font-extrabold whitespace-nowrap">❤️ {state.hearts}</span>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-eel mb-8">
          {ex.kind === "mcq" && `What does “${ex.word.word}” mean?`}
          {ex.kind === "reverse" && `Which word means: “${ex.word.meaning}”?`}
          {ex.kind === "listen" && "Listen and pick the meaning"}
          {ex.kind === "fillblank" && "Fill in the blank:"}
          {ex.kind === "discriminative" && `⚔️ Word battle: ${ex.word.word} vs ${ex.partner?.word}`}
          {ex.kind === "flashcard" && "Flashcard"}
        </h1>

        {(ex.kind === "listen" || ex.kind === "mcq") && (
          <div className="mb-6 flex items-center gap-4">
            {ex.kind === "listen" && (
              <button
                onClick={() => speak(ex.word)}
                className="w-20 h-20 rounded-2xl bg-macaw border-b-4 border-macawDark text-white text-3xl active:translate-y-1 active:border-b-0 transition-all"
                title="Play pronunciation"
              >
                🔊
              </button>
            )}
            {ex.kind === "mcq" && (
              <div className="animate-pop text-4xl font-black text-eel tracking-wide">{ex.word.word}</div>
            )}
            {ex.kind === "mcq" && (
              <button onClick={() => speak(ex.word)} className="btn-blue px-4 py-2 text-xs">
                🔊 Listen
              </button>
            )}
          </div>
        )}

        {(ex.kind === "fillblank" || ex.kind === "discriminative") && (
          <p className="text-2xl font-bold mb-8 leading-relaxed bg-polar rounded-2xl p-6 border-2 border-swan">
            {ex.promptSentence?.split("______").map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    className={`inline-block min-w-[120px] border-b-4 mx-1 text-center ${
                      checked
                        ? isCorrect
                          ? "text-feather border-mask"
                          : "text-cardinal border-cardinal"
                        : "text-macaw border-macaw"
                    }`}
                  >
                    {checked ? selected : "…"}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>
        )}

        <div className={`grid gap-3 ${ex.kind === "fillblank" || ex.kind === "reverse" ? "" : ""}`}>
          {ex.options.map((opt) => {
            let cls = "option-tile";
            if (checked && opt === ex.answer) cls += " correct";
            else if (checked && opt === selected) cls += " wrong";
            else if (!checked && opt === selected) cls += " selected";
            return (
              <button
                key={opt}
                className={cls}
                disabled={checked}
                onClick={() => setSelected(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {checked && (
          <div
            className={`fixed bottom-0 left-0 right-0 border-t-2 animate-slide-up ${
              isCorrect ? "bg-[#d7ffb8] border-mask" : "bg-[#ffdfe0] border-cardinal"
            }`}
          >
            <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
              <Mascot size={72} mood={isCorrect ? "cheer" : "sad"} />
              <div className="flex-1">
                <div className={`font-extrabold text-xl ${isCorrect ? "text-featherDark" : "text-cardinal"}`}>
                  {isCorrect ? "Nice! +10 XP ⚡" : "Not quite…"}
                </div>
                {!isCorrect && (
                  <div className="text-eel font-bold text-sm mt-1">
                    Correct: <b>{ex.answer}</b> — {ex.word.example}
                  </div>
                )}
                {isCorrect && (
                  <div className="text-eel font-bold text-sm mt-1">
                    💡 {ex.word.mnemonic}
                  </div>
                )}
              </div>
              <button
                className={`${isCorrect ? "btn-green" : "btn-red"} px-8 py-3 shrink-0`}
                onClick={handleNext}
              >
                {idx + 1 >= total ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        )}
      </main>

      {!checked && (
        <footer className="sticky bottom-0 max-w-2xl w-full mx-auto px-4 pb-6">
          <button
            className={`w-full py-4 text-lg ${selected !== null ? "btn-green" : "btn3d bg-swan border-hare text-hare cursor-not-allowed"}`}
            disabled={selected === null}
            onClick={handleCheck}
          >
            Check
          </button>
        </footer>
      )}
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { WORDS, CATEGORY_META } from "../data/words";
import { Mascot } from "../components/Mascot";
import { Leaderboard } from "../components/Leaderboard";
import { ProgressBar, SectionTitle, StatChip } from "../components/ui";
import { LessonPlayer } from "../components/LessonPlayer";

export function Home() {
  const { state, dueWords, learningWords, masteredWords, freshUnseen } = useStore();
  const [inSession, setInSession] = useState(false);
  const [sessionPool, setSessionPool] = useState<string>("due");

  const due = dueWords();
  const learning = learningWords();
  const mastered = masteredWords();
  const unseen = freshUnseen();

  const wordOfDay = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % WORDS.length;
    return WORDS[dayIndex];
  }, []);

  const todayXp = state.dailyXpLog[new Date().toISOString().slice(0, 10)] ?? 0;
  const dailyTarget = state.dailyGoal * 10;
  const goalWordCount = { test: 5, work: 5, chat: 4 }[state.goal];

  if (inSession) {
    const pool =
      sessionPool === "due"
        ? [...due, ...unseen].length
          ? [...due, ...unseen]
          : WORDS
        : WORDS.filter((w) => w.category === sessionPool);
    return (
      <LessonPlayer
        pool={pool}
        onExit={() => setInSession(false)}
        onDone={() => {}}
      />
    );
  }

  function startSession(pool: string) {
    setSessionPool(pool);
    setInSession(true);
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      {/* Hero */}
      <div className="card flex items-center gap-4 !p-6 bg-gradient-to-br from-[#f0fff0] to-snow">
        <div className="animate-float shrink-0">
          <Mascot size={96} mood={due.length > 0 ? "happy" : "wink"} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black leading-tight">
            Hey {state.name || "learner"}! 👋
          </h1>
          <p className="text-wolf font-bold text-sm mt-1">
            {due.length > 0
              ? `${due.length} words are ready for review — right before you'd forget them.`
              : "You're all caught up. Brilliant work!"}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm font-extrabold">
            <StatChip icon="🔥" value={state.streak} color="#FF9600" />
            <StatChip icon="⚡" value={state.xp} color="#FFC800" />
            <StatChip icon="💎" value={state.gems} color="#1CB0F6" />
            <StatChip icon="❤️" value={state.hearts} color="#FF4B4B" />
          </div>
        </div>
      </div>

      {/* Daily goal ring */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Today's plan</SectionTitle>
          <span className="text-wolf font-extrabold text-sm">
            ⚡{todayXp}/{dailyTarget} XP
          </span>
        </div>
        <ProgressBar value={(todayXp / dailyTarget) * 100} />
        <button
          className={`w-full mt-4 py-4 text-lg ${due.length + unseen.length > 0 ? "btn-green animate-ring" : "btn-blue"}`}
          onClick={() => startSession("due")}
        >
          {due.length > 0
            ? `Start review · ${due.length} words`
            : unseen.length > 0
            ? `Learn new words · ${Math.min(goalWordCount, unseen.length)} waiting`
            : "Practice anything"}
        </button>
      </div>

      {/* Category quick-start */}
      <div>
        <SectionTitle>Quick sessions</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((cat) => (
            <button
              key={cat}
              onClick={() => startSession(cat)}
              className="card text-left hover:scale-[1.02] transition-transform"
            >
              <div className="text-3xl">{CATEGORY_META[cat].icon}</div>
              <div className="font-extrabold mt-2">{CATEGORY_META[cat].label.split(" (")[0]}</div>
              <div className="text-xs text-wolf font-bold mt-1">
                {WORDS.filter((w) => w.category === cat).length} words
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Word of the day */}
      <div className="card border-bee !border-b-4">
        <div className="flex items-center justify-between">
          <SectionTitle>🌟 Word of the Day</SectionTitle>
        </div>
        <div className="text-3xl font-black text-eel">{wordOfDay.word}</div>
        <div className="text-hare italic font-bold text-sm">{wordOfDay.phonetic} · {wordOfDay.pos}</div>
        <p className="font-bold mt-2">{wordOfDay.meaning}</p>
        <p className="text-wolf font-semibold text-sm mt-2 italic">"{wordOfDay.example}"</p>
      </div>

      {/* Daily quests */}
      <div>
        <SectionTitle>🎯 Daily Quests</SectionTitle>
        <div className="space-y-2">
          {[
            { done: state.questSessionDone, label: "Complete 1 session", reward: "+10 XP", icon: "📚" },
            { done: state.questPerfectDone, label: "Get a perfect session", reward: "+20 XP", icon: "💯" },
            { done: state.questChatDone, label: "Use a new word in Tutor Chat", reward: "+15 XP", icon: "💬" },
          ].map((q) => (
            <div key={q.label} className={`card flex items-center gap-3 !py-3 ${q.done ? "opacity-60" : ""}`}>
              <span className="text-2xl">{q.icon}</span>
              <span className={`flex-1 font-extrabold ${q.done ? "line-through text-wolf" : ""}`}>{q.label}</span>
              {q.done ? (
                <span className="text-feather font-black">✓ DONE</span>
              ) : (
                <span className="text-bee font-black">{q.reward}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* League */}
      <div>
        <SectionTitle>🏆 Ruby League</SectionTitle>
        <Leaderboard />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card !p-4">
          <div className="text-2xl font-black text-feather">{learning.length}</div>
          <div className="text-xs font-extrabold uppercase text-wolf">Learning</div>
        </div>
        <div className="card !p-4">
          <div className="text-2xl font-black text-macaw">{mastered.length}</div>
          <div className="text-xs font-extrabold uppercase text-wolf">Mastered</div>
        </div>
        <div className="card !p-4">
          <div className="text-2xl font-black text-bee">{state.sessionsCompleted}</div>
          <div className="text-xs font-extrabold uppercase text-wolf">Sessions</div>
        </div>
      </div>
    </div>
  );
}


import React, { useMemo } from "react";
import { useStore } from "../lib/store";
import { BADGES } from "../data/badges";
import { Badge, ProgressBar, SectionTitle } from "../components/ui";
import { Leaderboard } from "../components/Leaderboard";

export function Progress() {
  const { state, masteredWords, learningWords } = useStore();
  const mastered = masteredWords().length;
  const learning = learningWords().length;

  const last7 = useMemo(() => {
    const days: { label: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
        xp: state.dailyXpLog[key] ?? 0,
      });
    }
    return days;
  }, [state.dailyXpLog]);

  const maxXp = Math.max(50, ...last7.map((d) => d.xp));
  const retentionSeries = useMemo(
    () =>
      Object.values(state.cards)
        .filter((c) => c.introducedAt)
        .map((c) => c.strength),
    [state.cards]
  );
  const avgRetention = retentionSeries.length
    ? Math.round(retentionSeries.reduce((a, b) => a + b, 0) / retentionSeries.length)
    : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
      <h1 className="text-3xl font-black">Your Progress</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="card !p-4">
          <div className="text-3xl font-black text-fox">{state.streak}</div>
          <div className="text-xs font-extrabold uppercase text-wolf">🔥 Streak</div>
        </div>
        <div className="card !p-4">
          <div className="text-3xl font-black text-bee">{state.xp}</div>
          <div className="text-xs font-extrabold uppercase text-wolf">⚡ Total XP</div>
        </div>
        <div className="card !p-4">
          <div className="text-3xl font-black text-feather">{mastered}</div>
          <div className="text-xs font-extrabold uppercase text-wolf">📚 Mastered</div>
        </div>
        <div className="card !p-4">
          <div className="text-3xl font-black text-macaw">{avgRetention}%</div>
          <div className="text-xs font-extrabold uppercase text-wolf">🧠 Retention</div>
        </div>
      </div>

      <div className="card">
        <SectionTitle>⚡ Weekly XP</SectionTitle>
        <div className="flex items-end justify-between gap-2 h-40 mt-4">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-extrabold text-wolf">{d.xp || ""}</span>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max(4, (d.xp / maxXp) * 100)}%`,
                  background: d.xp > 0 ? "#58CC02" : "#E5E5E5",
                }}
              />
              <span className="text-xs font-extrabold text-wolf">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <SectionTitle>🧠 Vocabulary health</SectionTitle>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm font-extrabold mb-1">
              <span>Mastered words</span>
              <span>{mastered} / {Object.keys(state.cards).length}</span>
            </div>
            <ProgressBar value={(mastered / Object.keys(state.cards).length) * 100} />
          </div>
          <div>
            <div className="flex justify-between text-sm font-extrabold mb-1">
              <span>In active learning</span>
              <span>{learning}</span>
            </div>
            <ProgressBar value={(learning / Object.keys(state.cards).length) * 100} color="#FFC800" />
          </div>
          <div>
            <div className="flex justify-between text-sm font-extrabold mb-1">
              <span>Average memory strength</span>
              <span>{avgRetention}%</span>
            </div>
            <ProgressBar value={avgRetention} color="#1CB0F6" />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>🏅 Badges</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {BADGES.map((b) => (
            <Badge
              key={b.id}
              icon={b.icon}
              name={b.name}
              desc={b.desc}
              unlocked={state.badges.includes(b.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>🏆 League standing</SectionTitle>
        <Leaderboard showStreak />
      </div>
    </div>
  );
}

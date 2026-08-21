import React, { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { fetchLeaderboard, LeaderRow } from "../lib/cloudSync";
import { isCloudConfigured } from "../lib/supabase";
import { DEMO_USERS, demoLeaderboard } from "../data/demoUsers";

export function Leaderboard({ showStreak = false }: { showStreak?: boolean }) {
  const { state } = useStore();
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        if (!state.demoMode && state.userId && user && isCloudConfigured) {
          const r = await fetchLeaderboard(state.userId, state.name, state.xp);
          if (alive) setRows(r);
        } else {
          const r = demoLeaderboard(state.name, state.xp);
          if (alive) setRows(r);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [state.demoMode, state.userId, state.xp, state.name, user]);

  const medalColor = (i: number) =>
    i === 0 ? "text-bee" : i === 1 ? "text-hare" : i === 2 ? "text-fox" : "text-wolf";

  if (loading && !rows.length) {
    return (
      <div className="card !py-8 text-center text-wolf font-bold text-sm">Loading league…</div>
    );
  }

  return (
    <div className="card !p-0 overflow-hidden">
      {rows.map((u, i) => {
        const demo = !state.demoMode ? undefined : DEMO_USERS.find((d) => d.name === u.name);
        return (
          <div
            key={u.name + i}
            className={`flex items-center gap-3 px-4 py-3 ${u.isMe ? "bg-[#ddf4ff]" : ""} ${
              i > 0 ? "border-t-2 border-polar" : ""
            }`}
          >
            <span className={`w-6 font-black ${medalColor(i)}`}>{i + 1}</span>
            <span className="text-2xl">{u.avatar}</span>
            <span className={`flex-1 font-extrabold truncate ${u.isMe ? "text-macaw" : ""}`}>
              {u.name}
              {u.isMe ? " (You)" : ""}
            </span>
            {showStreak && demo && <span className="text-fox font-bold text-sm mr-2">🔥{demo.streak}</span>}
            <span className="font-extrabold text-wolf">{u.xp} XP</span>
          </div>
        );
      })}
      {state.demoMode && (
        <div className="px-4 py-2 bg-polar text-xs text-wolf font-bold text-center border-t-2 border-swan">
          Demo community — sign in to compete for real
        </div>
      )}
    </div>
  );
}

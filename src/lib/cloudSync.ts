import { WORDS } from "../data/words";
import { AppState, initialState } from "./store";
import { newCard } from "./srs";
import { supabase } from "./supabase";

const dirtyCards = new Set<string>();

export function markCardDirty(wordId: string) {
  dirtyCards.add(wordId);
}

function toProfileRow(s: AppState) {
  return {
    id: s.userId!,
    display_name: s.name || "Learner",
    goal: s.goal,
    level: s.level,
    daily_goal: s.dailyGoal,
    ui_lang: s.uiLang,
    xp: s.xp,
    gems: s.gems,
    hearts: s.hearts,
    streak: s.streak,
    onboarded: s.onboarded,
    sessions_completed: s.sessionsCompleted,
    perfect_sessions: s.perfectSessions,
    chat_messages: s.chatMessages,
    badges: s.badges,
    daily_xp_log: s.dailyXpLog,
    quests: {
      session: stateQuest(s, "session"),
      perfect: stateQuest(s, "perfect"),
      chat: stateQuest(s, "chat"),
    },
    chat_history: s.chatHistory.slice(-50),
    last_active_day: s.lastActiveDay,
  };
}

function stateQuest(s: AppState, key: string): boolean {
  return key === "session" ? s.questSessionDone : key === "perfect" ? s.questPerfectDone : s.questChatDone;
}

export async function pushProfile(s: AppState): Promise<void> {
  if (!s.userId) return;
  await supabase.from("profiles").upsert(toProfileRow(s));
}

export async function pushDirtyCards(s: AppState): Promise<void> {
  if (!s.userId || dirtyCards.size === 0) return;
  const rows = Array.from(dirtyCards)
    .filter((id) => s.cards[id])
    .map((wordId) => ({ user_id: s.userId, word_id: wordId, ...s.cards[wordId] }));
  dirtyCards.clear();
  if (!rows.length) return;
  await supabase.from("srs_cards").upsert(rows, { onConflict: "user_id,word_id" });
}

export async function pullCloudState(userId: string): Promise<Partial<AppState>> {
  const [profileRes, cardsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("srs_cards").select("*").eq("user_id", userId),
  ]);

  const base = initialState();
  const p = profileRes.data;
  const merged: Partial<AppState> = {};

  if (p) {
    Object.assign(merged, {
      name: p.display_name ?? base.name,
      goal: p.goal,
      level: p.level,
      dailyGoal: p.daily_goal,
      uiLang: p.ui_lang,
      xp: p.xp,
      gems: p.gems,
      hearts: p.hearts,
      streak: p.streak,
      onboarded: p.onboarded,
      sessionsCompleted: p.sessions_completed,
      perfectSessions: p.perfect_sessions,
      chatMessages: p.chat_messages,
      badges: Array.isArray(p.badges) ? p.badges : [],
      dailyXpLog: p.daily_xp_log ?? {},
      questSessionDone: Boolean(p.quests?.session),
      questPerfectDone: Boolean(p.quests?.perfect),
      questChatDone: Boolean(p.quests?.chat),
      chatHistory: Array.isArray(p.chat_history) ? p.chat_history : [],
      lastActiveDay: p.last_active_day,
    });
  }

  const cards: Record<string, import("./srs").SrsCard> = {};
  for (const w of WORDS) cards[w.id] = newCard(w.id);
  for (const row of cardsRes.data ?? []) {
    if (!cards[row.word_id]) continue;
    cards[row.word_id] = {
      wordId: row.word_id,
      easeFactor: row.ease_factor,
      intervalDays: row.interval_days,
      repetitions: row.repetitions,
      lapses: row.lapses,
      strength: row.strength,
      dueAt: new Date(row.due_at).getTime(),
      introducedAt: row.introduced_at ? new Date(row.introduced_at).getTime() : null,
    };
  }
  merged.cards = cards;

  return merged;
}

export interface LeaderRow {
  name: string;
  avatar: string;
  xp: number;
  isMe?: boolean;
}

export async function fetchLeaderboard(meId: string | null, myName: string, myXp: number): Promise<LeaderRow[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, xp")
    .order("xp", { ascending: false })
    .limit(10);

  const rows: LeaderRow[] = (data ?? []).map((r: { id: string; display_name: string; xp: number }) => ({
    name: r.display_name || "Learner",
    avatar: r.id === meId ? "🦉" : "🦁",
    xp: r.xp,
    isMe: r.id === meId,
  }));

  const mine = { name: myName || "You", avatar: "🦉", xp: myXp, isMe: true };
  if (!rows.some((r) => r.isMe)) rows.push(mine);
  return rows.sort((a, b) => b.xp - a.xp).slice(0, 11);
}

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (s: { xp: number; streak: number; masteredCount: number; sessions: number; chatMessages: number }) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first_session", name: "First Flight", desc: "Complete your first session", icon: "🐣", check: (s) => s.sessions >= 1 },
  { id: "xp_100", name: "XP Rookie", desc: "Earn 100 XP", icon: "⭐", check: (s) => s.xp >= 100 },
  { id: "xp_500", name: "XP Champion", desc: "Earn 500 XP", icon: "🌟", check: (s) => s.xp >= 500 },
  { id: "streak_3", name: "Warm Flame", desc: "3-day streak", icon: "🔥", check: (s) => s.streak >= 3 },
  { id: "streak_7", name: "Blazing Streak", desc: "7-day streak", icon: "🌋", check: (s) => s.streak >= 7 },
  { id: "mastered_5", name: "Word Collector", desc: "Master 5 words", icon: "📚", check: (s) => s.masteredCount >= 5 },
  { id: "mastered_15", name: "Lexicon Legend", desc: "Master 15 words", icon: "👑", check: (s) => s.masteredCount >= 15 },
  { id: "sessions_10", name: "Marathoner", desc: "Complete 10 sessions", icon: "🏃", check: (s) => s.sessions >= 10 },
  { id: "chat_5", name: "Chatterbox", desc: "Send 5 chat messages", icon: "💬", check: (s) => s.chatMessages >= 5 },
];

export const LEAGUE_BOTS = [
  { name: "Maria", avatar: "🦊", xp: 640 },
  { name: "Kenji", avatar: "🐼", xp: 520 },
  { name: "Amara", avatar: "🦁", xp: 470 },
  { name: "Diego", avatar: "🐨", xp: 380 },
  { name: "Priya", avatar: "🐯", xp: 310 },
  { name: "Lucas", avatar: "🐸", xp: 240 },
  { name: "Yuki", avatar: "🐧", xp: 180 },
];

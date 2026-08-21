import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { WORDS, Word, Category } from "../data/words";
import { BADGES } from "../data/badges";
import { SrsCard, newCard, applySm2, Grade, isDue, isMastered } from "./srs";
import { markCardDirty, pushProfile, pushDirtyCards } from "./cloudSync";
import { UiLang } from "../i18n/translations";
import { AiProvider, PROVIDER_META } from "./ai";

export type Goal = "test" | "work" | "chat";
export type Level = "beginner" | "intermediate" | "advanced";
export type DailyGoal = 5 | 10 | 20;

export interface ChatMsg {
  role: "user" | "assistant" | "system-feedback";
  text: string;
  ts: number;
}

export interface AppState {
  onboarded: boolean;
  name: string;
  goal: Goal;
  level: Level;
  dailyGoal: DailyGoal;
  uiLang: UiLang;
  cards: Record<string, SrsCard>;
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  lastActiveDay: string | null;
  sessionsCompleted: number;
  perfectSessions: number;
  chatMessages: number;
  chatHistory: ChatMsg[];
  badges: string[];
  dailyXpLog: Record<string, number>;
  questSessionDone: boolean;
  questPerfectDone: boolean;
  questChatDone: boolean;
  notifEnabled: boolean;
  notifIntervalMin: number;
  aiProvider: AiProvider;
  aiKey: string;
  userId: string | null;
  demoMode: boolean;
}

const STORAGE_KEY = "vocabboost_state_v1";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function initialState(): AppState {
  const cards: Record<string, SrsCard> = {};
  for (const w of WORDS) cards[w.id] = newCard(w.id);
  return {
    onboarded: false,
    name: "",
    goal: "test",
    level: "intermediate",
    dailyGoal: 10,
    uiLang: "en",
    cards,
    xp: 0,
    gems: 0,
    hearts: 5,
    streak: 0,
    lastActiveDay: null,
    sessionsCompleted: 0,
    perfectSessions: 0,
    chatMessages: 0,
    chatHistory: [],
    badges: [],
    dailyXpLog: {},
    questSessionDone: false,
    questPerfectDone: false,
    questChatDone: false,
    notifEnabled: true,
    notifIntervalMin: 30,
    aiProvider: (import.meta.env.VITE_AI_PROVIDER as AiProvider) || "openrouter",
    aiKey: import.meta.env.VITE_OPENROUTER_KEY || "",
    userId: null,
    demoMode: false,
  };
}

type Action =
  | { type: "completeOnboarding"; payload: Partial<AppState> }
  | { type: "gradeWord"; wordId: string; grade: Grade }
  | { type: "introduceWord"; wordId: string }
  | { type: "finishSession"; xpEarned: number; perfect: boolean }
  | { type: "addChatMessage"; msg: ChatMsg }
  | { type: "markQuestChat" }
  | { type: "loseHeart" }
  | { type: "refillHearts" }
  | { type: "updateSettings"; payload: Partial<AppState> }
  | { type: "hydrateCloud"; payload: Partial<AppState>; userId: string }
  | { type: "setDemoMode"; enabled: boolean }
  | { type: "reset" }
  | { type: "hydrate"; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "completeOnboarding":
      return { ...state, ...action.payload, onboarded: true };
    case "introduceWord": {
      const c = state.cards[action.wordId];
      if (!c || c.introducedAt) return state;
      return {
        ...state,
        cards: { ...state.cards, [action.wordId]: { ...c, introducedAt: Date.now() } },
        gems: state.gems + 1,
      };
    }
    case "gradeWord": {
      const card = state.cards[action.wordId];
      if (!card) return state;
      const updated = applySm2(card, action.grade);
      return { ...state, cards: { ...state.cards, [action.wordId]: updated } };
    }
    case "finishSession": {
      const today = todayStr();
      let streak = state.streak;
      if (state.lastActiveDay !== today) {
        streak =
          state.lastActiveDay && daysBetween(state.lastActiveDay, today) === 1
            ? state.streak + 1
            : 1;
      }
      const dailyXpLog = { ...state.dailyXpLog };
      dailyXpLog[today] = (dailyXpLog[today] ?? 0) + action.xpEarned;
      let next: AppState = {
        ...state,
        xp: state.xp + action.xpEarned,
        gems: state.gems + Math.max(1, Math.round(action.xpEarned / 10)),
        streak,
        lastActiveDay: today,
        sessionsCompleted: state.sessionsCompleted + 1,
        perfectSessions: state.perfectSessions + (action.perfect ? 1 : 0),
        dailyXpLog,
        questSessionDone: true,
        questPerfectDone: state.questPerfectDone || action.perfect,
      };
      const earned = BADGES.filter(
        (b) =>
          !next.badges.includes(b.id) &&
          b.check({
            xp: next.xp,
            streak: next.streak,
            masteredCount: Object.values(next.cards).filter(isMastered).length,
            sessions: next.sessionsCompleted,
            chatMessages: next.chatMessages,
          })
      ).map((b) => b.id);
      if (earned.length) next = { ...next, badges: [...next.badges, ...earned] };
      return next;
    }
    case "addChatMessage": {
      let next: AppState = {
        ...state,
        chatMessages:
          action.msg.role === "user" ? state.chatMessages + 1 : state.chatMessages,
        chatHistory: [...state.chatHistory.slice(-100), action.msg],
        questChatDone:
          state.questChatDone ||
          (action.msg.role === "user" && usesLearningWord(action.msg.text, state.cards)),
      };
      const earned = BADGES.filter(
        (b) =>
          !next.badges.includes(b.id) &&
          b.check({
            xp: next.xp,
            streak: next.streak,
            masteredCount: Object.values(next.cards).filter(isMastered).length,
            sessions: next.sessionsCompleted,
            chatMessages: next.chatMessages,
          })
      ).map((b) => b.id);
      if (earned.length) next = { ...next, badges: [...next.badges, ...earned] };
      return next;
    }
    case "markQuestChat":
      return { ...state, questChatDone: true };
    case "loseHeart":
      return { ...state, hearts: Math.max(0, state.hearts - 1) };
    case "refillHearts":
      return { ...state, hearts: 5 };
    case "updateSettings":
      return { ...state, ...action.payload };
    case "hydrateCloud": {
      const { aiKey, notifEnabled, notifIntervalMin, demoMode, ...cloud } = action.payload;
      return {
        ...state,
        ...cloud,
        userId: action.userId,
        cards: { ...state.cards, ...(action.payload.cards ?? {}) },
      };
    }
    case "setDemoMode":
      return {
        ...state,
        demoMode: action.enabled,
        onboarded: action.enabled ? true : state.onboarded,
        name: action.enabled && !state.name ? "Guest" : state.name,
      };
    case "reset":
      return initialState();
    default:
      return state;
  }
}

export function usesLearningWord(text: string, cards: Record<string, SrsCard>): boolean {
  const lower = text.toLowerCase();
  return Object.entries(cards).some(([id, c]) => {
    const w = WORDS.find((x) => x.id === id);
    return w && c.introducedAt && !isMastered(c) && lower.includes(w.word.toLowerCase());
  });
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  t: (key: string) => string;
  dueWords: () => Word[];
  learningWords: () => Word[];
  masteredWords: () => Word[];
  freshUnseen: () => Word[];
}

const StoreContext = createContext<Ctx | null>(null);

function isDemoStorageKey() {
  return "vocabboost_demo_mode";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const rawReducer = useReducer(reducer, undefined as unknown as AppState, () => {
    try {
      const demo = localStorage.getItem(isDemoStorageKey());
      const raw = localStorage.getItem(STORAGE_KEY);
      let saved: AppState | null = null;
      if (raw) {
        saved = JSON.parse(raw) as AppState;
        const base = initialState();
        for (const w of WORDS) if (!saved!.cards?.[w.id]) saved!.cards[w.id] = newCard(w.id);
        return { ...base, ...saved };
      }
      if (demo === "1") {
        const base = initialState();
        return {
          ...base,
          demoMode: true,
          onboarded: true,
          name: base.name || "Guest",
        };
      }
    } catch {}
    return initialState();
  });
  const [state, rawDispatch] = rawReducer;

  const dispatch: React.Dispatch<Action> = React.useCallback(
    (action: Action) => {
      if (action.type === "gradeWord" || action.type === "introduceWord") markCardDirty(action.wordId);
      rawDispatch(action);
    },
    [rawDispatch]
  );

  useEffect(() => {
    if (!state.demoMode) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(isDemoStorageKey(), state.demoMode ? "1" : "0");
  }, [state]);

  // Debounced cloud sync — pushes profile stats + dirty SRS cards after activity settles.
  useEffect(() => {
    if (!state.userId || state.demoMode) return;
    const timer = setTimeout(() => {
      void pushProfile(state).catch(console.error);
      void pushDirtyCards(state).catch(console.error);
    }, 1500);
    return () => clearTimeout(timer);
  }, [state]);

  // Streak decay check
  useEffect(() => {
    const today = todayStr();
    if (state.lastActiveDay && daysBetween(state.lastActiveDay, today) > 1) {
      dispatch({ type: "updateSettings", payload: { streak: 0 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<Ctx>(() => {
    const byDifficulty = (w: Word) => {
      const order = { beginner: [1, 2, 3], intermediate: [2, 3, 1], advanced: [3, 2, 1] };
      return order[state.level].indexOf(w.difficulty);
    };
    const goalToCategory: Record<Goal, Category> = {
      test: "academic",
      work: "business",
      chat: "casual",
    };
    return {
      state,
      dispatch,
      t: (key: string) => key,
      dueWords: () =>
        WORDS.filter((w) => state.cards[w.id]?.introducedAt && isDue(state.cards[w.id])),
      learningWords: () =>
        WORDS.filter(
          (w) => state.cards[w.id]?.introducedAt && !isMastered(state.cards[w.id])
        ),
      masteredWords: () =>
        WORDS.filter((w) => state.cards[w.id] && isMastered(state.cards[w.id])),
      freshUnseen: () =>
        WORDS.filter((w) => !state.cards[w.id]?.introducedAt).sort(
          (a, b) =>
            (a.category === goalToCategory[state.goal] ? -1 : 1) -
              (b.category === goalToCategory[state.goal] ? -1 : 1) ||
            byDifficulty(a) - byDifficulty(b)
        ),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

import React, { useState } from "react";
import { useStore } from "./lib/store";
import { useAuth } from "./lib/auth";
import { Onboarding } from "./screens/Onboarding";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Words } from "./screens/Words";
import { Progress } from "./screens/Progress";
import { Profile } from "./screens/Profile";
import { ChatTutor } from "./components/ChatTutor";
import { MicroSessionToast } from "./components/MicroSessionToast";
import { CloudGate } from "./components/CloudGate";

type Tab = "home" | "words" | "chat" | "progress" | "profile";

const NAV: { id: Tab; icon: string; labelKey: string }[] = [
  { id: "home", icon: "🏠", labelKey: "Home" },
  { id: "words", icon: "📖", labelKey: "Words" },
  { id: "chat", icon: "💬", labelKey: "Tutor Chat" },
  { id: "progress", icon: "📊", labelKey: "Progress" },
  { id: "profile", icon: "🦉", labelKey: "Profile" },
];

export default function App() {
  const { state, dispatch } = useStore();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("home");

  // Shareable demo link: /?demo=1
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      dispatch({ type: "setDemoMode", enabled: true });
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo banner strip shown at top when in demo mode
  const DemoBanner = state.demoMode ? (
    <div className="bg-bee text-eel text-xs font-extrabold uppercase tracking-wide text-center py-1.5 px-4">
      👀 Demo mode — seeded community data ·{" "}
      <button
        className="underline"
        onClick={() => dispatch({ type: "setDemoMode", enabled: false })}
      >
        exit
      </button>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-swan border-t-feather rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CloudGate>
      {!state.demoMode && !user ? (
        <Login />
      ) : !state.onboarded ? (
        <Onboarding />
      ) : (
        <div className="min-h-screen bg-snow">
          {DemoBanner}
          {/* Top bar */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-swan">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="text-2xl font-black tracking-tight">
                <span className="text-feather">vocab</span>
                <span className="text-macaw">boost</span>
              </div>
              <div className="flex items-center gap-4 font-extrabold text-sm">
                <span className="text-fox">🔥 {state.streak}</span>
                <span className="text-bee">⚡ {state.xp}</span>
                <span className="text-macaw">💎 {state.gems}</span>
              </div>
            </div>
          </header>

          <main className={tab === "chat" ? "h-[calc(100vh-3.5rem-4.5rem)]" : ""}>
            {tab === "home" && <Home />}
            {tab === "words" && <Words />}
            {tab === "chat" && <ChatTutor />}
            {tab === "progress" && <Progress />}
            {tab === "profile" && <Profile />}
          </main>

          {/* Bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-swan">
            <div className="max-w-2xl mx-auto flex justify-around py-1.5">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wide transition-colors ${
                    tab === n.id ? "text-macaw bg-[#ddf4ff]" : "text-hare hover:text-wolf"
                  }`}
                >
                  <span className={`text-2xl ${tab === n.id ? "" : "grayscale opacity-60"}`}>{n.icon}</span>
                  {n.labelKey}
                </button>
              ))}
            </div>
          </nav>

          <MicroSessionToast onOpenSession={() => setTab("home")} />
        </div>
      )}
    </CloudGate>
  );
}

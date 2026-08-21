import React, { useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { UI_LANGS, UiLang } from "../i18n/translations";
import { PROVIDER_META } from "../lib/ai";
import { Mascot } from "../components/Mascot";
import { Modal, SectionTitle } from "../components/ui";

export function Profile() {
  const { state, dispatch } = useStore();
  const { user, signOut } = useAuth();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function save(patch: Partial<typeof state>) {
    dispatch({ type: "updateSettings", payload: patch });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
      <div className="card flex items-center gap-4 !p-6">
        <div className="w-20 h-20 rounded-full bg-feather flex items-center justify-center text-4xl shrink-0">
          🦉
        </div>
        <div>
          <h1 className="text-2xl font-black">{state.name || "Learner"}</h1>
          <p className="text-wolf font-bold text-sm capitalize">{state.level} · joined recently</p>
          <div className="flex gap-3 mt-2 text-sm font-extrabold">
            <span className="text-fox">🔥 {state.streak}</span>
            <span className="text-bee">⚡ {state.xp}</span>
            <span className="text-macaw">💎 {state.gems}</span>
          </div>
        </div>
      </div>

      <div className="card space-y-5">
        <SectionTitle>⚙️ Settings</SectionTitle>

        <div>
          <label className="text-sm font-extrabold uppercase text-wolf tracking-wide block mb-2">
            Interface language
          </label>
          <div className="flex flex-wrap gap-2">
            {UI_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => save({ uiLang: l.code as UiLang })}
                className={`px-4 py-2 rounded-xl font-extrabold border-2 border-b-4 text-sm ${
                  state.uiLang === l.code
                    ? "bg-macaw text-white border-macawDark"
                    : "bg-snow border-swan hover:bg-polar"
                }`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-extrabold">Lock-screen micro-sessions</div>
            <div className="text-sm text-wolf font-bold">Pop-up word nudges while you browse</div>
          </div>
          <button
            onClick={() => save({ notifEnabled: !state.notifEnabled })}
            className={`w-14 h-8 rounded-full relative transition-colors ${
              state.notifEnabled ? "bg-feather" : "bg-swan"
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                state.notifEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {state.notifEnabled && (
          <div>
            <label className="text-sm font-extrabold uppercase text-wolf tracking-wide block mb-2">
              Remind me every
            </label>
            <div className="flex gap-2">
              {[15, 30, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => save({ notifIntervalMin: m })}
                  className={`px-5 py-2 rounded-xl font-extrabold border-2 border-b-4 ${
                    state.notifIntervalMin === m
                      ? "bg-feather text-white border-featherDark"
                      : "bg-snow border-swan hover:bg-polar"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-extrabold uppercase text-wolf tracking-wide block mb-2">
            AI tutor provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(PROVIDER_META) as (keyof typeof PROVIDER_META)[]).map((p) => (
              <button
                key={p}
                onClick={() => save({ aiProvider: p })}
                className={`px-3 py-2 rounded-xl font-extrabold border-2 border-b-4 text-sm text-left ${
                  state.aiProvider === p
                    ? "bg-feather text-white border-featherDark"
                    : "bg-snow border-swan hover:bg-polar"
                }`}
              >
                {PROVIDER_META[p].label}
                <div className={`text-[10px] font-bold ${state.aiProvider === p ? "text-white/80" : "text-hare"}`}>
                  {PROVIDER_META[p].note}
                </div>
              </button>
            ))}
          </div>
          {state.aiProvider !== "offline" && (
            <>
              <input
                type="password"
                value={state.aiKey}
                onChange={(e) => save({ aiKey: e.target.value })}
                placeholder="Paste your API key…"
                className="w-full mt-3 border-2 border-swan rounded-2xl px-4 py-3 font-bold outline-none focus:border-macaw"
              />
              <p className="text-xs text-hare font-bold mt-1">
                Free key:{" "}
                <a
                  href={PROVIDER_META[state.aiProvider].keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-macaw underline"
                >
                  {PROVIDER_META[state.aiProvider].keyUrl}
                </a>{" "}
                · stored only in your browser, never sent anywhere except the provider.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-green px-6 py-3" onClick={() => save({})}>
            Save settings
          </button>
          {saved && <span className="text-feather font-extrabold animate-pop">✓ Saved!</span>}
        </div>
      </div>

      <div className="card">
        <SectionTitle>🧪 Danger zone</SectionTitle>
        <button className="btn-red px-6 py-3" onClick={() => setConfirmReset(true)}>
          Reset all progress
        </button>
      </div>

      <div className="card space-y-4">
        <SectionTitle>👀 Demo mode</SectionTitle>
        <p className="text-wolf font-bold text-sm -mt-2">
          Preview the app with a seeded, thriving community — leaderboards, streaks and rivalries —
          without affecting your real progress.
        </p>
        {state.demoMode ? (
          <button
            className="btn-green w-full py-3"
            onClick={() => dispatch({ type: "setDemoMode", enabled: false })}
          >
            Exit demo mode
          </button>
        ) : (
          <button
            className="btn-yellow w-full py-3"
            onClick={() => dispatch({ type: "setDemoMode", enabled: true })}
          >
            Enter demo mode
          </button>
        )}
      </div>

      <div className="card space-y-4">
        <SectionTitle>🔐 Account</SectionTitle>
        {user ? (
          <>
            <div className="flex items-center gap-3 bg-polar rounded-2xl p-4">
              <div className="w-10 h-10 rounded-full bg-macaw text-white flex items-center justify-center font-black">
                {(user.email ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold truncate">{state.name || user.email}</div>
                <div className="text-xs text-wolf font-bold truncate">{user.email}</div>
              </div>
            </div>
            <p className="text-xs text-hare font-bold">Progress syncs automatically to your account.</p>
            <button className="btn-ghost w-full py-3" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <p className="text-wolf font-bold text-sm">
            You're exploring as a guest. Sign in to save your streak across devices.
          </p>
        )}
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="p-6 text-center">
          <Mascot size={100} mood="sad" />
          <h2 className="text-2xl font-black mt-2">Reset ALL progress?</h2>
          <p className="text-wolf font-bold mt-2">This cannot be undone.</p>
          <div className="flex gap-3 mt-6">
            <button className="btn-ghost flex-1 py-3" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              className="btn-red flex-1 py-3"
              onClick={() => {
                dispatch({ type: "reset" });
                setConfirmReset(false);
              }}
            >
              Yes, reset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState } from "react";
import { useStore, Goal, Level, DailyGoal } from "../lib/store";
import { UI_LANGS, UiLang } from "../i18n/translations";
import { Mascot } from "../components/Mascot";

function OptionCard({
  selected,
  onClick,
  emoji,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  title: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 border-b-4 p-4 font-extrabold transition-all duration-75 ${
        selected
          ? "border-macaw bg-[#ddf4ff] text-macaw"
          : "border-swan bg-snow text-eel hover:bg-polar"
      }`}
    >
      <span className="mr-2">{emoji}</span>
      {title}
      {sub && <div className="text-sm font-bold opacity-70 mt-0.5">{sub}</div>}
    </button>
  );
}

export function Onboarding() {
  const { dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [uiLang, setUiLang] = useState<UiLang>("en");
  const [goal, setGoal] = useState<Goal>("test");
  const [level, setLevel] = useState<Level>("intermediate");
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(10);
  const [name, setName] = useState("");

  const steps = 5;

  return (
    <div className="min-h-screen bg-snow flex flex-col">
      <header className="max-w-xl w-full mx-auto px-6 pt-6">
        <div className="flex items-center justify-between">
          <button
            className={`text-hare text-2xl font-black ${step === 0 ? "invisible" : ""}`}
            onClick={() => setStep((s) => s - 1)}
          >
            ←
          </button>
          <div className="text-3xl font-black tracking-tight">
            <span className="text-feather">vocab</span>
            <span className="text-macaw">boost</span>
          </div>
          <span className="text-wolf font-extrabold">{step + 1}/{steps}</span>
        </div>
        <div className="progress-track mt-4" style={{ height: 12 }}>
          <div className="progress-fill" style={{ width: `${((step + 1) / steps) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-10">
        {step === 0 && (
          <div className="animate-pop text-center">
            <div className="animate-float inline-block">
              <Mascot size={180} mood="wink" />
            </div>
            <h1 className="text-4xl font-black mt-4 leading-tight">
              Learn a word.
              <br />
              <span className="text-feather">Keep it for life.</span>
            </h1>
            <p className="text-wolf font-bold mt-4 text-lg">
              Bite-sized vocabulary sessions, AI conversation practice and smart spaced repetition —
              all in 5 minutes a day.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="mt-8 w-full border-2 border-swan rounded-2xl px-5 py-4 font-bold outline-none focus:border-feather text-lg"
            />
          </div>
        )}

        {step === 1 && (
          <div className="animate-slide-up">
            <h1 className="text-3xl font-black mb-8">What's your main goal?</h1>
            <div className="space-y-3">
              <OptionCard selected={goal === "test"} onClick={() => setGoal("test")} emoji="🎓" title="Ace a standardized test" sub="GRE · SAT · IELTS · TOEFL" />
              <OptionCard selected={goal === "work"} onClick={() => setGoal("work")} emoji="💼" title="Boost my career" sub="Business English & professional polish" />
              <OptionCard selected={goal === "chat"} onClick={() => setGoal("chat")} emoji="💬" title="Chat confidently" sub="Everyday words for real conversations" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h1 className="text-3xl font-black mb-8">How strong is your vocabulary?</h1>
            <div className="space-y-3">
              <OptionCard selected={level === "beginner"} onClick={() => setLevel("beginner")} emoji="🌱" title="Beginner" sub="Building the basics" />
              <OptionCard selected={level === "intermediate"} onClick={() => setLevel("intermediate")} emoji="🌿" title="Intermediate" sub="I know the common words" />
              <OptionCard selected={level === "advanced"} onClick={() => setLevel("advanced")} emoji="🌳" title="Advanced" sub="Hunting rare gems" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h1 className="text-3xl font-black mb-8">Pick your daily goal</h1>
            <p className="text-wolf font-bold -mt-5 mb-6">No pressure — you can change it anytime.</p>
            <div className="space-y-3">
              <OptionCard selected={dailyGoal === 5} onClick={() => setDailyGoal(5)} emoji="🤍" title="Casual" sub="5 min / day" />
              <OptionCard selected={dailyGoal === 10} onClick={() => setDailyGoal(10)} emoji="🔥" title="Regular" sub="10 min / day" />
              <OptionCard selected={dailyGoal === 20} onClick={() => setDailyGoal(20)} emoji="⚡" title="Serious" sub="20 min / day" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up">
            <h1 className="text-3xl font-black mb-8">Choose your interface language</h1>
            <div className="space-y-3">
              {UI_LANGS.map((l) => (
                <OptionCard
                  key={l.code}
                  selected={uiLang === l.code}
                  onClick={() => setUiLang(l.code)}
                  emoji={l.flag}
                  title={l.label}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 bg-snow border-t-2 border-swan p-4">
        <div className="max-w-xl mx-auto">
          <button
            className={`w-full py-4 text-lg ${step === 0 && !name.trim() ? "btn3d bg-swan border-hare text-hare cursor-not-allowed" : "btn-green"}`}
            disabled={step === 0 && !name.trim()}
            onClick={() => {
              if (step < steps - 1) setStep((s) => s + 1);
              else
                dispatch({
                  type: "completeOnboarding",
                  payload: { name: name.trim(), goal, level, dailyGoal, uiLang },
                });
            }}
          >
            {step < steps - 1 ? "Continue" : "Start learning!"}
          </button>
        </div>
      </footer>
    </div>
  );
}

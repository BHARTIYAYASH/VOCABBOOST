import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { getTutorResponse, PROVIDER_META } from "../lib/ai";

export function ChatTutor() {
  const { state, dispatch } = useStore();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<{ ts: number; text: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chatHistory.length, typing]);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    dispatch({ type: "addChatMessage", msg: { role: "user", text, ts: Date.now() } });
    setTyping(true);
    try {
      const learningIds = Object.entries(state.cards)
        .filter(([, c]) => c.introducedAt)
        .map(([id]) => id);
      const res = await getTutorResponse({
        text,
        history: state.chatHistory,
        provider: state.aiProvider,
        apiKey: state.aiKey,
        learningWordIds: learningIds,
      });
      dispatch({
        type: "addChatMessage",
        msg: { role: "assistant", text: res.reply, ts: Date.now() },
      });
      if (res.feedback) setFeedbackFor({ ts: Date.now(), text: res.feedback });
      else setFeedbackFor(null);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-polar border-b-2 border-swan px-4 py-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-feather flex items-center justify-center text-2xl">🦉</div>
        <div>
          <div className="font-extrabold">Boosty</div>
          <div className="text-xs text-wolf font-bold">
            {state.aiProvider === "offline" || !state.aiKey
              ? "Offline tutor · pick an AI provider in Profile for live AI"
              : `${PROVIDER_META[state.aiProvider].label} · online`}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.chatHistory.length === 0 && (
          <div className="flex gap-3 animate-pop">
            <div className="w-10 h-10 rounded-full bg-feather flex items-center justify-center text-xl shrink-0">🦉</div>
            <div className="card !p-4 max-w-[80%] text-sm font-bold leading-relaxed">
              Hi! I'm Boosty, your AI tutor. 🎉 Practice your new words with me — I'll check usage,
              grammar and give instant feedback. Try using one of your learning words in a sentence!
            </div>
          </div>
        )}
        {state.chatHistory.map((m) =>
          m.role === "user" ? (
            <div key={m.ts} className="flex justify-end animate-slide-up">
              <div className="bg-macaw text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%] font-bold text-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.ts} className="flex gap-3 animate-slide-up">
              <div className="w-10 h-10 rounded-full bg-feather flex items-center justify-center text-xl shrink-0">🦉</div>
              <div className="card !p-4 max-w-[80%] text-sm font-bold leading-relaxed">{m.text}</div>
            </div>
          )
        )}
        {typing && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-feather flex items-center justify-center text-xl shrink-0">🦉</div>
            <div className="card !p-4 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-hare rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        {feedbackFor && (
          <div className="mx-auto max-w-[90%] bg-[#ddf4ff] border-2 border-macaw rounded-2xl p-4 text-sm font-bold text-macaw whitespace-pre-line animate-pop">
            <span className="font-extrabold uppercase text-xs tracking-wide block mb-1">
              ✍️ Tutor Feedback
            </span>
            {feedbackFor.text}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t-2 border-swan p-3 flex gap-2 bg-snow">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a sentence using a new word…"
          className="flex-1 border-2 border-swan rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-macaw"
        />
        <button onClick={send} disabled={!input.trim() || typing} className="btn-green px-6 py-3 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}

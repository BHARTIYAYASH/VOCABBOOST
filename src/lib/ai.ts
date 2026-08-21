import { WORDS, Word } from "../data/words";
import { ChatMsg } from "./store";

export type AiProvider = "openrouter" | "gemini" | "groq" | "openai" | "offline";

export const PROVIDER_META: Record<
  AiProvider,
  { label: string; keyUrl: string; defaultModel: string; free: boolean; note: string }
> = {
  openrouter: {
    label: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    free: true,
    note: "Free Llama 3.3 70B — recommended",
  },
  gemini: {
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.0-flash",
    free: true,
    note: "Free tier, fast and smart",
  },
  groq: {
    label: "Groq",
    keyUrl: "https://console.groq.com/keys",
    defaultModel: "llama-3.3-70b-versatile",
    free: true,
    note: "Free tier, blazing fast",
  },
  openai: {
    label: "OpenAI GPT-4o-mini",
    keyUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    free: false,
    note: "Paid — highest quality",
  },
  offline: {
    label: "Offline tutor (no key)",
    keyUrl: "",
    defaultModel: "",
    free: true,
    note: "Built-in rules-based tutor",
  },
};

const GREETINGS = ["hi", "hello", "hey", "hola", "namaste", "bonjour"];

function findWordsInText(text: string): Word[] {
  const lower = text.toLowerCase().replace(/[^a-z\s']/g, " ");
  return WORDS.filter((w) => new RegExp(`\\b${w.word.toLowerCase()}\\b`).test(lower));
}

function grammarHints(text: string): string[] {
  const hints: string[] = [];
  if (text.trim() && !/[.!?]$/.test(text.trim())) hints.push("End your sentence with punctuation.");
  if (/\bshould of\b|\bwould of\b|\bcould of\b/i.test(text))
    hints.push('Use "should have / would have / could have" — not "of".');
  if (/\b(he|she|it)\s+are\b/i.test(text)) hints.push('Use "is" with he/she/it.');
  if (/\ba\s+[aeiou]/i.test(text) && !/\ban hour/i.test(text))
    hints.push('Use "an" before vowel sounds (e.g., "an idea").');
  return hints;
}

function offlineReply(text: string, learningWordIds: string[]): { reply: string; feedback?: string } {
  const used = findWordsInText(text);
  const learningUsed = used.filter((w) => learningWordIds.includes(w.id));
  const lower = text.toLowerCase().trim();
  const hints = grammarHints(text);

  let reply: string;
  if (!text.trim()) {
    reply = "Type a sentence and I'll give you feedback!";
  } else if (GREETINGS.some((g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + "!"))) {
    reply =
      "Hello there! 👋 Wonderful to see you. Let's practice — tell me about your day and try to slip in one of your new words. For example: \"Today was absolutely chaotic!\"";
  } else if (learningUsed.length > 0) {
    const w = learningUsed[0];
    reply = `Excellent! You just used "${w.word}" (${w.pos}) naturally. 🎉 ${
      learningUsed.length > 1 ? `And "${learningUsed[1].word}" too — impressive range! ` : ""
    }Tell me more — could you use it in a different context? Maybe at work or with friends?`;
  } else {
    const suggestion = WORDS.find((w) => learningWordIds.includes(w.id));
    reply = `Good sentence! Now let's level up: try weaving in the word "${
      suggestion?.word ?? "resilient"
    }" — e.g., "${suggestion ? suggestion.example.replace(/\.$/, "") : "Our team stayed resilient under pressure"}." Your turn!`;
  }

  const fbParts: string[] = [];
  if (learningUsed.length > 0)
    fbParts.push(
      `✅ Great word choice: ${learningUsed.map((w) => w.word).join(", ")} — used correctly in context.`
    );
  for (const h of hints) fbParts.push(`✏️ ${h}`);
  if (text.split(/\s+/).length < 4 && text.trim())
    fbParts.push("✏️ Try writing longer sentences to practice flow.");

  return { reply, feedback: fbParts.length ? fbParts.join("\n") : undefined };
}

function buildSystemPrompt(learningWordIds: string[]): string {
  const learningWords = WORDS.filter((w) => learningWordIds.includes(w.id))
    .slice(0, 8)
    .map((w) => w.word)
    .join(", ");
  return `You are Boosty, an enthusiastic vocabulary tutor inside the VocabBoost app. The user is practicing English vocabulary. Their current learning words: ${learningWords}. For every user message respond with STRICT JSON only: {"reply": "<a warm, encouraging conversational response that keeps the dialogue going and nudges them to use their learning words>", "feedback": "<brief feedback on their usage, grammar, and word choice; empty string if flawless>"}. Keep replies under 60 words.`;
}

async function callChatCompletions(
  baseUrl: string,
  apiKey: string,
  model: string,
  history: ChatMsg[],
  text: string,
  systemPrompt: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ reply: string; feedback?: string }> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-10).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content);
    return { reply: parsed.reply ?? content, feedback: parsed.feedback || undefined };
  } catch {
    return { reply: content };
  }
}

async function callGemini(
  apiKey: string,
  model: string,
  history: ChatMsg[],
  text: string,
  systemPrompt: string
): Promise<{ reply: string; feedback?: string }> {
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text }] },
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const parsed = JSON.parse(content);
    return { reply: parsed.reply ?? content, feedback: parsed.feedback || undefined };
  } catch {
    return { reply: content };
  }
}

export async function getTutorResponse(opts: {
  text: string;
  history: ChatMsg[];
  provider: AiProvider;
  apiKey: string;
  learningWordIds: string[];
}): Promise<{ reply: string; feedback?: string; engine: AiProvider }> {
  const { provider, apiKey, text, history, learningWordIds } = opts;

  if (provider !== "offline" && apiKey.trim()) {
    const meta = PROVIDER_META[provider];
    const systemPrompt = buildSystemPrompt(learningWordIds);
    try {
      let result: { reply: string; feedback?: string };
      if (provider === "gemini") {
        result = await callGemini(apiKey.trim(), meta.defaultModel, history, text, systemPrompt);
      } else if (provider === "groq") {
        result = await callChatCompletions(
          "https://api.groq.com/openai/v1/chat/completions",
          apiKey.trim(),
          meta.defaultModel,
          history,
          text,
          systemPrompt
        );
      } else if (provider === "openrouter") {
        result = await callChatCompletions(
          "https://openrouter.ai/api/v1/chat/completions",
          apiKey.trim(),
          meta.defaultModel,
          history,
          text,
          systemPrompt,
          { "X-Title": "VocabBoost" }
        );
      } else {
        result = await callChatCompletions(
          "https://api.openai.com/v1/chat/completions",
          apiKey.trim(),
          meta.defaultModel,
          history,
          text,
          systemPrompt
        );
      }
      return { ...result, engine: provider };
    } catch {
      const r = offlineReply(text, learningWordIds);
      return { ...r, engine: "offline" };
    }
  }

  await new Promise((r) => setTimeout(r, 600 + Math.random() * 700));
  const r = offlineReply(text, learningWordIds);
  return { ...r, engine: "offline" };
}

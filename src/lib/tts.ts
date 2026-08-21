import { Word } from "../data/words";

export function speak(word: Word) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word.word);
  u.rate = 0.85;
  u.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find((v) => v.lang.startsWith("en"));
  if (en) u.voice = en;
  window.speechSynthesis.speak(u);
}

export function speakSentence(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

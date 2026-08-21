export function Mascot({ size = 120, mood = "happy" }: { size?: number; mood?: "happy" | "cheer" | "sad" | "wink" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="drop-shadow-md">
      <ellipse cx="100" cy="185" rx="55" ry="8" fill="#E5E5E5" />
      <path d="M40 95 Q35 30 100 28 Q165 30 160 95 Q158 150 100 168 Q42 150 40 95Z" fill="#58CC02" />
      <path d="M40 95 Q38 45 75 33 Q60 70 62 110 Q50 130 48 118 Q42 108 40 95Z" fill="#89E219" opacity="0.7" />
      <circle cx="72" cy="85" r="26" fill="#fff" />
      <circle cx="128" cy="85" r="26" fill="#fff" />
      {mood === "wink" ? (
        <>
          <circle cx="74" cy="87" r="10" fill="#4B4B4B" />
          <circle cx="77" cy="84" r="3.5" fill="#fff" />
          <path d="M118 88 q9 -9 18 0" stroke="#4B4B4B" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : mood === "sad" ? (
        <>
          <circle cx="72" cy="92" r="10" fill="#4B4B4B" />
          <circle cx="128" cy="92" r="10" fill="#4B4B4B" />
          <path d="M82 125 q18 -12 36 0" stroke="#4B4B4B" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="72" cy="87" r="10" fill="#4B4B4B" />
          <circle cx="128" cy="87" r="10" fill="#4B4B4B" />
          <circle cx="76" cy="83" r="3.5" fill="#fff" />
          <circle cx="132" cy="83" r="3.5" fill="#fff" />
          <path d="M86 112 q14 12 28 0" stroke="#4B4B4B" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      <path d="M92 98 L108 98 L100 112 Z" fill="#FFC800" stroke="#E6A100" strokeWidth="2" />
      {mood === "cheer" && (
        <>
          <path d="M30 60 L12 40 M170 60 L188 40" stroke="#58CC02" strokeWidth="10" strokeLinecap="round" />
          <text x="150" y="30" fontSize="22">✨</text>
          <text x="30" y="25" fontSize="22">⭐</text>
        </>
      )}
    </svg>
  );
}

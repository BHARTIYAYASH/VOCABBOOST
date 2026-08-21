import React, { useEffect, useState } from "react";

export function ProgressBar({ value, color = "#58CC02", height = 16 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="progress-track" style={{ height }}>
      <div
        className="progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

const CONFETTI_COLORS = ["#58CC02", "#1CB0F6", "#FFC800", "#FF4B4B", "#CE82FF", "#FF9600"];

export function Confetti({ count = 80 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
    }))
  );
  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size * 1.6,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}

export function StatChip({ icon, value, label, color = "#FF9600" }: { icon: string; value: string | number; label?: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 font-extrabold" title={label}>
      <span className="text-xl leading-none">{icon}</span>
      <span style={{ color }} className="text-lg">{value}</span>
      {label && <span className="text-wolf text-sm hidden sm:inline">{label}</span>}
    </div>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-snow rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-extrabold text-eel mb-3">{children}</h2>;
}

export function Badge({ icon, name, desc, unlocked }: { icon: string; name: string; desc: string; unlocked: boolean }) {
  return (
    <div className={`card text-center ${unlocked ? "" : "opacity-45 grayscale"}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-extrabold text-sm">{name}</div>
      <div className="text-xs text-wolf mt-1">{desc}</div>
      <div className={`mt-2 text-[11px] font-extrabold uppercase ${unlocked ? "text-feather" : "text-hare"}`}>
        {unlocked ? "Unlocked" : "Locked"}
      </div>
    </div>
  );
}

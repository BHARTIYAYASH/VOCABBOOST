export interface SrsCard {
  wordId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
  lapses: number;
  strength: number;
  introducedAt: number | null;
}

export function newCard(wordId: string): SrsCard {
  return {
    wordId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: Date.now(),
    lapses: 0,
    strength: 0,
    introducedAt: null,
  };
}

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2 algorithm (SuperMemo-2) — the industry-standard spaced repetition model.
 * grade: 0-2 = fail (lapse), 3 = hard, 4 = good, 5 = easy
 */
export function applySm2(card: SrsCard, grade: Grade): SrsCard {
  const next = { ...card };
  const now = Date.now();

  if (grade < 3) {
    next.repetitions = 0;
    next.lapses += 1;
    next.intervalDays = 0;
    next.easeFactor = Math.max(1.3, next.easeFactor - 0.2);
    next.dueAt = now + 10 * 60 * 1000;
    next.strength = Math.max(0, next.strength - 25);
  } else {
    next.repetitions += 1;
    if (next.repetitions === 1) {
      next.intervalDays = 1;
    } else if (next.repetitions === 2) {
      next.intervalDays = 6;
    } else {
      const mult = grade === 3 ? 1.2 : grade === 4 ? next.easeFactor : next.easeFactor * 1.3;
      next.intervalDays = Math.max(1, Math.round(next.intervalDays * mult));
    }
    next.easeFactor = Math.max(
      1.3,
      next.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    );
    next.dueAt = now + next.intervalDays * 24 * 60 * 60 * 1000;
    next.strength = Math.min(100, next.strength + (grade === 5 ? 30 : grade === 4 ? 22 : 12));
  }

  return next;
}

export function isMastered(card: SrsCard): boolean {
  return card.repetitions >= 4 && card.strength >= 80 && card.easeFactor >= 2.2;
}

export function isDue(card: SrsCard): boolean {
  return card.dueAt <= Date.now();
}

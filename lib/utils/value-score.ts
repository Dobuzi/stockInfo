import type { OverviewData } from '@/lib/transformers/overview';

export interface ValueScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    pe: number | null;
    peg: number | null;
    pb: number | null;
  };
}

interface MetricSpec {
  value: number | null;
  weight: number;
  best: number;
  worst: number;
}

function subScore(value: number, best: number, worst: number): number {
  if (best === worst) return 5;
  const raw = ((value - worst) / (best - worst)) * 10;
  return Math.max(0, Math.min(10, raw));
}

function toGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 8) return 'A';
  if (score >= 6) return 'B';
  if (score >= 4) return 'C';
  return 'D';
}

export function computeValueScore(overview: OverviewData): ValueScore | null {
  // Non-positive P/E (loss-making company, or zero) has no valuation meaning — treat as null
  const pe = overview.peRatio !== null && overview.peRatio > 0 ? overview.peRatio : null;

  const specs: MetricSpec[] = [
    { value: pe,                   weight: 50, best: 15,  worst: 40  },
    { value: overview.pegRatio,    weight: 30, best: 1.0, worst: 3.0 },
    { value: overview.priceToBook, weight: 20, best: 1.5, worst: 5.0 },
  ];

  const present = specs.filter(s => s.value !== null && s.value !== undefined);
  if (present.length < 2) return null;

  const totalWeight = present.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = present.reduce(
    (sum, s) => sum + subScore(s.value!, s.best, s.worst) * s.weight, 0
  );

  const score = Math.round((weightedSum / totalWeight) * 10) / 10;

  return {
    score,
    grade: toGrade(score),
    breakdown: {
      pe:  pe !== null                   ? subScore(pe,                  15,  40  ) : null,
      peg: overview.pegRatio !== null    ? subScore(overview.pegRatio,   1.0, 3.0 ) : null,
      pb:  overview.priceToBook !== null ? subScore(overview.priceToBook, 1.5, 5.0) : null,
    },
  };
}

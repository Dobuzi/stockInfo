import type { OverviewData } from '@/lib/transformers/overview';

export interface BuffettScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    roe: number | null;
    profitMargin: number | null;
    operatingMargin: number | null;
    earningsGrowth: number | null;
    debtToEquity: number | null;
    revenueGrowth: number | null;
    priceToBook: number | null;
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

export const FINANCIAL_SECTORS = ['Financial Services', 'Banking', 'Insurance'];

export function computeBuffettScore(overview: OverviewData): BuffettScore | null {
  const isFinancial = FINANCIAL_SECTORS.some(s => overview.sector === s);

  const specs: MetricSpec[] = [
    { value: overview.returnOnEquity,          weight: 25, best: 15,  worst: 5   },
    { value: overview.profitMargin,            weight: 20, best: 20,  worst: 5   },
    { value: overview.operatingMargin,         weight: 15, best: 15,  worst: 3   },
    { value: overview.quarterlyEarningsGrowth, weight: 15, best: 15,  worst: 0   },
    { value: isFinancial ? null : overview.debtToEquity, weight: 15, best: 0.3, worst: 2.0 },
    { value: overview.quarterlyRevenueGrowth,  weight: 5,  best: 10,  worst: 0   },
    { value: overview.priceToBook,             weight: 5,  best: 1.5, worst: 5.0 },
  ];

  const present = specs.filter(s => s.value !== null && s.value !== undefined);
  if (present.length < 3) return null;

  const totalWeight = present.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum  = present.reduce(
    (sum, s) => sum + subScore(s.value!, s.best, s.worst) * s.weight, 0
  );

  const score = Math.round((weightedSum / totalWeight) * 10) / 10;

  return {
    score,
    grade: toGrade(score),
    breakdown: {
      roe:           overview.returnOnEquity          !== null ? subScore(overview.returnOnEquity,          15,  5  ) : null,
      profitMargin:  overview.profitMargin            !== null ? subScore(overview.profitMargin,            20,  5  ) : null,
      operatingMargin: overview.operatingMargin       !== null ? subScore(overview.operatingMargin,         15,  3  ) : null,
      earningsGrowth:  overview.quarterlyEarningsGrowth !== null ? subScore(overview.quarterlyEarningsGrowth, 15, 0 ) : null,
      debtToEquity:  (!isFinancial && overview.debtToEquity !== null) ? subScore(overview.debtToEquity,     0.3, 2.0) : null,
      revenueGrowth: overview.quarterlyRevenueGrowth  !== null ? subScore(overview.quarterlyRevenueGrowth,  10,  0  ) : null,
      priceToBook:   overview.priceToBook             !== null ? subScore(overview.priceToBook,             1.5, 5.0) : null,
    },
  };
}

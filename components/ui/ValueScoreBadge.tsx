'use client';

import { computeValueScore } from '@/lib/utils/value-score';
import type { OverviewData } from '@/lib/transformers/overview';

interface ValueScoreBadgeProps {
  overview: OverviewData | null;
}

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  B: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  C: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
} as const;

export function ValueScoreBadge({ overview }: ValueScoreBadgeProps) {
  if (!overview) return null;
  const result = computeValueScore(overview);
  if (!result) return null;

  return (
    <span
      className={`text-xs font-bold px-1.5 py-0.5 rounded ${GRADE_COLORS[result.grade]}`}
      title={`Value Score: ${result.score.toFixed(1)}/10`}
    >
      V:{result.grade} {result.score.toFixed(1)}
    </span>
  );
}

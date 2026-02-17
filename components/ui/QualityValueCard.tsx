'use client';

import { useState } from 'react';
import { computeBuffettScore, FINANCIAL_SECTORS } from '@/lib/utils/buffett-score';
import { computeValueScore } from '@/lib/utils/value-score';
import type { OverviewData } from '@/lib/transformers/overview';

interface QualityValueCardProps {
  overview: OverviewData;
}

const GRADE_COLORS = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-yellow-600 dark:text-yellow-400',
  C: 'text-orange-600 dark:text-orange-400',
  D: 'text-red-600 dark:text-red-400',
} as const;

const QUALITY_ROWS = [
  { key: 'roe',             label: 'Return on Equity',  weight: 25, field: 'returnOnEquity',         fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'profitMargin',    label: 'Profit Margin',      weight: 20, field: 'profitMargin',            fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'operatingMargin', label: 'Operating Margin',   weight: 15, field: 'operatingMargin',         fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'earningsGrowth',  label: 'Earnings Growth',    weight: 15, field: 'quarterlyEarningsGrowth', fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'debtToEquity',    label: 'Debt-to-Equity',     weight: 15, field: 'debtToEquity',            fmt: (v: number) => v.toFixed(2) },
  { key: 'revenueGrowth',   label: 'Revenue Growth',     weight: 5,  field: 'quarterlyRevenueGrowth',  fmt: (v: number) => `${v.toFixed(1)}%` },
  { key: 'priceToBook',     label: 'Price-to-Book',      weight: 5,  field: 'priceToBook',             fmt: (v: number) => v.toFixed(2) },
] as const;

const VALUE_ROWS = [
  { key: 'pe',  label: 'P/E Ratio',     weight: 50, field: 'peRatio',     fmt: (v: number) => v.toFixed(1) },
  { key: 'peg', label: 'PEG Ratio',     weight: 30, field: 'pegRatio',    fmt: (v: number) => v.toFixed(2) },
  { key: 'pb',  label: 'Price-to-Book', weight: 20, field: 'priceToBook', fmt: (v: number) => v.toFixed(2) },
] as const;

function BreakdownTable({
  rows,
  overview,
  breakdown,
  isFinancial,
}: {
  rows: readonly { key: string; label: string; weight: number; field: string; fmt: (v: number) => string }[];
  overview: OverviewData;
  breakdown: Record<string, number | null>;
  isFinancial?: boolean;
}) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
          <th className="pb-2 pr-4">Metric</th>
          <th className="pb-2 pr-4 text-right">Value</th>
          <th className="pb-2 pr-4 text-right">Score</th>
          <th className="pb-2">Quality</th>
          <th className="pb-2 text-right">Weight</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {rows
          .filter(({ key }) => !(key === 'debtToEquity' && isFinancial))
          .map(({ key, label, weight, field, fmt }) => {
            const rawValue = overview[field as keyof OverviewData] as number | null;
            const score = breakdown[key] ?? null;
            return (
              <tr key={key}>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{label}</td>
                <td className="py-2 pr-4 text-right font-mono text-gray-900 dark:text-gray-100">
                  {rawValue !== null ? fmt(rawValue) : '—'}
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                  {score !== null ? score.toFixed(1) : '—'}
                </td>
                <td className="py-2 pr-4 w-32">
                  {score !== null && (
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  )}
                </td>
                <td className="py-2 text-right text-gray-500 dark:text-gray-400">{weight}%</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

export function QualityValueCard({ overview }: QualityValueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const quality = computeBuffettScore(overview);
  const value = computeValueScore(overview);

  if (!quality && !value) return null;

  const isFinancial = FINANCIAL_SECTORS.some(s => overview.sector === s);

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between"
        aria-expanded={expanded}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Buffett Score
        </h2>
        <div className="flex items-center gap-4">
          {quality && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">Quality</span>
              <span className={`text-xl font-bold ${GRADE_COLORS[quality.grade]}`}>
                {quality.grade}
              </span>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {quality.score.toFixed(1)}<span className="text-xs font-normal text-gray-500">/10</span>
              </span>
            </div>
          )}
          {value && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">Value</span>
              <span className={`text-xl font-bold ${GRADE_COLORS[value.grade]}`}>
                {value.grade}
              </span>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {value.score.toFixed(1)}<span className="text-xs font-normal text-gray-500">/10</span>
              </span>
            </div>
          )}
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-6 overflow-x-auto">
          {quality && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Quality Metrics
              </h3>
              <BreakdownTable
                rows={QUALITY_ROWS}
                overview={overview}
                breakdown={quality.breakdown as unknown as Record<string, number | null>}
                isFinancial={isFinancial}
              />
            </div>
          )}
          {value && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Valuation Metrics
              </h3>
              <BreakdownTable
                rows={VALUE_ROWS}
                overview={overview}
                breakdown={value.breakdown as unknown as Record<string, number | null>}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

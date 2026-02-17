'use client';

import { useQueries } from '@tanstack/react-query';
import { MetricRow } from './MetricRow';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { formatLargeNumber } from '@/lib/utils/formatting';
import { computeBuffettScore } from '@/lib/utils/buffett-score';
import { computeValueScore } from '@/lib/utils/value-score';

interface ComparisonTableProps {
  tickers: string[];
}

export function ComparisonTable({ tickers }: ComparisonTableProps) {
  // useQueries handles a dynamic number of queries without violating Rules of Hooks
  const queries = useQueries({
    queries: tickers.map(ticker => ({
      queryKey: ['overview', ticker],
      queryFn: async () => {
        const response = await fetch(`/api/overview?ticker=${encodeURIComponent(ticker)}`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch overview');
        }
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
    })),
  });

  const isLoading = queries.some(q => q.isLoading);
  const hasError = queries.some(q => q.error);

  if (isLoading) {
    return <LoadingSkeleton className="h-96" />;
  }

  if (hasError && queries.every(q => q.error)) {
    return <ErrorPanel error="Failed to load comparison data" />;
  }

  const data = queries.map(q => q.data?.data || null);
  const scores = data.map(d => (d ? computeBuffettScore(d) : null));
  const valueScores = data.map(d => (d ? computeValueScore(d) : null));

  const GRADE_COLORS = {
    A: 'text-green-600 dark:text-green-400',
    B: 'text-yellow-600 dark:text-yellow-400',
    C: 'text-orange-600 dark:text-orange-400',
    D: 'text-red-600 dark:text-red-400',
  } as const;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-800">
              Metric
            </th>
            {tickers.map((ticker, idx) => (
              <th
                key={ticker}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {ticker}
                {queries[idx].error && (
                  <span className="ml-2 text-red-500">(Error)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr className="bg-blue-50 dark:bg-blue-900/20">
            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/20">
              Buffett Score
            </td>
            {scores.map((score, idx) => (
              <td key={tickers[idx]} className="px-4 py-3 text-right">
                {score ? (
                  <span className={`font-bold text-base ${GRADE_COLORS[score.grade]}`}>
                    {score.grade} {score.score.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            ))}
          </tr>
          <tr className="bg-purple-50 dark:bg-purple-900/20">
            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-purple-50 dark:bg-purple-900/20">
              Value Score
            </td>
            {valueScores.map((score, idx) => (
              <td key={tickers[idx]} className="px-4 py-3 text-right">
                {score ? (
                  <span className={`font-bold text-base ${GRADE_COLORS[score.grade]}`}>
                    {score.grade} {score.score.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            ))}
          </tr>
          {/* Company Info Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Company Information
            </td>
          </tr>
          <MetricRow
            label="Name"
            values={data.map(d => d?.name || null)}
          />
          <MetricRow
            label="Sector"
            values={data.map(d => d?.sector || null)}
          />
          <MetricRow
            label="Industry"
            values={data.map(d => d?.industry || null)}
          />
          <MetricRow
            label="Market Cap"
            values={data.map(d => d?.marketCap ? formatLargeNumber(d.marketCap) : null)}
          />
          <MetricRow
            label="52-Week High"
            values={data.map(d => d?.fiftyTwoWeekHigh || null)}
            type="currency"
          />
          <MetricRow
            label="52-Week Low"
            values={data.map(d => d?.fiftyTwoWeekLow || null)}
            type="currency"
          />

          {/* Valuation Metrics Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Valuation Metrics
            </td>
          </tr>
          <MetricRow
            label="P/E Ratio"
            values={data.map(d => d?.peRatio || null)}
            type="number"
          />
          <MetricRow
            label="Forward P/E"
            values={data.map(d => d?.forwardPE || null)}
            type="number"
          />
          <MetricRow
            label="PEG Ratio"
            values={data.map(d => d?.pegRatio || null)}
            type="number"
          />
          <MetricRow
            label="Price-to-Book"
            values={data.map(d => d?.priceToBook || null)}
            type="number"
          />
          <MetricRow
            label="Price-to-Sales"
            values={data.map(d => d?.priceToSales || null)}
            type="number"
          />
          <MetricRow
            label="EV/EBITDA"
            values={data.map(d => d?.evToEbitda || null)}
            type="number"
          />

          {/* Profitability Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Profitability
            </td>
          </tr>
          <MetricRow
            label="Profit Margin"
            values={data.map(d => d?.profitMargin || null)}
            type="percent"
          />
          <MetricRow
            label="Operating Margin"
            values={data.map(d => d?.operatingMargin || null)}
            type="percent"
          />
          <MetricRow
            label="Return on Equity (ROE)"
            values={data.map(d => d?.returnOnEquity || null)}
            type="percent"
          />
          <MetricRow
            label="Return on Assets (ROA)"
            values={data.map(d => d?.returnOnAssets || null)}
            type="percent"
          />

          {/* Growth Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Growth
            </td>
          </tr>
          <MetricRow
            label="Revenue (TTM)"
            values={data.map(d => d?.revenue ? formatLargeNumber(d.revenue) : null)}
          />
          <MetricRow
            label="Quarterly Revenue Growth"
            values={data.map(d => d?.quarterlyRevenueGrowth || null)}
            type="percent"
          />
          <MetricRow
            label="Quarterly Earnings Growth"
            values={data.map(d => d?.quarterlyEarningsGrowth || null)}
            type="percent"
          />
          <MetricRow
            label="EPS (Diluted TTM)"
            values={data.map(d => d?.eps || null)}
            type="currency"
          />

          {/* Financial Health Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Financial Health
            </td>
          </tr>
          <MetricRow
            label="Debt-to-Equity"
            values={data.map(d => d?.debtToEquity || null)}
            type="number"
          />
          <MetricRow
            label="Current Ratio"
            values={data.map(d => d?.currentRatio || null)}
            type="number"
          />
          <MetricRow
            label="Quick Ratio"
            values={data.map(d => d?.quickRatio || null)}
            type="number"
          />
          <MetricRow
            label="Book Value Per Share"
            values={data.map(d => d?.bookValue || null)}
            type="currency"
          />

          {/* Dividends Section */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            <td colSpan={tickers.length + 1} className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
              Dividends
            </td>
          </tr>
          <MetricRow
            label="Dividend Yield"
            values={data.map(d => d?.dividendYield || null)}
            type="percent"
          />
          <MetricRow
            label="Dividend Per Share"
            values={data.map(d => d?.dividendPerShare || null)}
            type="currency"
          />
          <MetricRow
            label="Payout Ratio"
            values={data.map(d => d?.payoutRatio || null)}
            type="percent"
          />
        </tbody>
      </table>
    </div>
  );
}

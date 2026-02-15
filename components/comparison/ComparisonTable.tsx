'use client';

import { useOverview } from '@/lib/hooks/useOverview';
import { MetricRow } from './MetricRow';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { formatLargeNumber } from '@/lib/utils/formatting';

interface ComparisonTableProps {
  tickers: string[];
}

export function ComparisonTable({ tickers }: ComparisonTableProps) {
  // Fetch overview data for all tickers in parallel
  const queries = tickers.map(ticker => useOverview(ticker));

  const isLoading = queries.some(q => q.isLoading);
  const hasError = queries.some(q => q.error);

  if (isLoading) {
    return <LoadingSkeleton className="h-96" />;
  }

  if (hasError && queries.every(q => q.error)) {
    return <ErrorPanel error="Failed to load comparison data" />;
  }

  const data = queries.map(q => q.data?.data || null);

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

          {/* Valuation Section - will add in next task */}
        </tbody>
      </table>
    </div>
  );
}

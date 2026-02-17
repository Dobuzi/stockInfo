'use client';

import { useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTickers } from '@/lib/hooks/useTickers';
import { usePrices } from '@/lib/hooks/usePrices';
import { useFinancials } from '@/lib/hooks/useFinancials';
import { useNews } from '@/lib/hooks/useNews';
import { TickerInput } from '@/components/ticker/TickerInput';
import { TickerChips } from '@/components/ticker/TickerChips';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { PriceChart } from '@/components/charts/PriceChart';
import { RangeSelector } from '@/components/charts/RangeSelector';
import { FinancialTabs } from '@/components/financials/FinancialTabs';
import { FinancialTable } from '@/components/financials/FinancialTable';
import { MetricsPanel } from '@/components/financials/MetricsPanel';
import { NewsList } from '@/components/news/NewsList';
import { NewsFilters } from '@/components/news/NewsFilters';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { PortfolioTab } from '@/components/portfolio/PortfolioTab';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useOverview } from '@/lib/hooks/useOverview';
import { BuffettScoreCard } from '@/components/ui/BuffettScoreCard';
import { TimeRange } from '@/lib/providers/interfaces';
import type { OverviewData } from '@/lib/transformers/overview';

export default function DashboardPage() {
  const { tickers, addTicker, removeTicker } = useTickers();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('1M');
  const [statement, setStatement] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [newsWindow, setNewsWindow] = useState<'24h' | '7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'watchlist' | 'portfolio'>('watchlist');

  // View decision logic
  const showComparison = tickers.length >= 2 && !selectedTicker;
  const showDetail = tickers.length >= 1 && selectedTicker;
  const showEmpty = tickers.length === 0;

  // Auto-select first ticker when added
  useEffect(() => {
    if (tickers.length === 1 && !selectedTicker) {
      setSelectedTicker(tickers[0]);
    }
  }, [tickers, selectedTicker]);

  // Clear selection when we have 2+ tickers (auto-switch to comparison)
  useEffect(() => {
    if (tickers.length >= 2 && selectedTicker) {
      setSelectedTicker(null);
    }
  }, [tickers.length]);

  const activeTicker = selectedTicker || tickers[0] || '';

  // Fetch overviews for all tickers so chips can show Buffett scores.
  // React Query deduplicates: ComparisonTable hits the same cache keys.
  const overviewQueries = useQueries({
    queries: tickers.map(ticker => ({
      queryKey: ['overview', ticker],
      queryFn: async () => {
        const res = await fetch(`/api/overview?ticker=${encodeURIComponent(ticker)}`);
        if (!res.ok) return null;
        return res.json() as Promise<{ ticker: string; provider: string; data: OverviewData } | null>;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      enabled: tickers.length > 0,
    })),
  });

  const overviewsByTicker: Record<string, OverviewData | null> = {};
  tickers.forEach((ticker, i) => {
    overviewsByTicker[ticker] = overviewQueries[i]?.data?.data ?? null;
  });

  const { data: priceData, isLoading: pricesLoading, error: pricesError } = usePrices(
    showDetail ? selectedTicker! : '',
    range
  );
  const { data: financialData, isLoading: financialsLoading, error: financialsError } = useFinancials(
    showDetail ? selectedTicker! : '',
    statement
  );
  const { data: newsData, isLoading: newsLoading, error: newsError } = useNews(
    showDetail ? selectedTicker! : '',
    newsWindow
  );
  const { data: overviewData } = useOverview(showDetail ? selectedTicker! : '');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Dashboard</h1>
          <DarkModeToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'watchlist'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'portfolio'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Portfolio
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <ErrorBoundary>
        {activeTab === 'watchlist' && (
          <>
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickers</h2>
              <TickerInput onAdd={addTicker} />
              <div className="mt-4">
                <TickerChips
                  tickers={tickers}
                  onRemove={removeTicker}
                  selectedTicker={selectedTicker || activeTicker}
                  onSelect={(ticker) => {
                    if (selectedTicker === ticker && tickers.length >= 2) {
                      setSelectedTicker(null); // Deselect → back to comparison
                    } else {
                      setSelectedTicker(ticker); // Select → show detail
                    }
                  }}
                  overviews={overviewsByTicker}
                />
              </div>
            </section>

            {showEmpty && (
              <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No tickers added yet. Add one above to get started.
                </p>
              </section>
            )}

            {showComparison && (
              <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Comparison View
                </h2>
                <ComparisonTable tickers={tickers} />
              </section>
            )}

            {showDetail && (
              <>
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedTicker} - Price Chart
                    </h2>
                    <RangeSelector selected={range} onChange={setRange} />
                  </div>
                  {pricesLoading && <LoadingSkeleton className="h-96" />}
                  {pricesError && <ErrorPanel error={pricesError.message} />}
                  {priceData && (
                    <div>
                      <div className="flex gap-4 mb-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Current: <span className="font-semibold">${priceData.meta.currentPrice.toFixed(2)}</span>
                        </span>
                        <span className={priceData.meta.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Day: {priceData.meta.dayChange >= 0 ? '+' : ''}{priceData.meta.dayChange.toFixed(2)}%
                        </span>
                        <span className={priceData.meta.periodChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Period: {priceData.meta.periodChange >= 0 ? '+' : ''}{priceData.meta.periodChange.toFixed(2)}%
                        </span>
                      </div>
                      <PriceChart data={priceData.data} />
                    </div>
                  )}
                </section>

                {overviewData?.data && (
                  <BuffettScoreCard overview={overviewData.data} />
                )}

                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Financial Statements</h2>
                  <FinancialTabs onTabChange={setStatement} />
                  <div className="mt-4">
                    {financialsLoading && <LoadingSkeleton className="h-64" />}
                    {financialsError && <ErrorPanel error={financialsError.message} />}
                    {financialData && (
                      <>
                        <FinancialTable data={financialData.data} />
                        <div className="mt-4">
                          <MetricsPanel metrics={financialData.metrics} />
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">News</h2>
                    <NewsFilters selectedWindow={newsWindow} onWindowChange={setNewsWindow} />
                  </div>
                  {newsLoading && <LoadingSkeleton className="h-64" />}
                  {newsError && <ErrorPanel error={newsError.message} />}
                  {newsData && <NewsList articles={newsData.articles} />}
                </section>
              </>
            )}
          </>
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab />
        )}
        </ErrorBoundary>
      </main>
    </div>
  );
}

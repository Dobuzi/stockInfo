'use client';

import { useState } from 'react';
import { useTickers } from '@/lib/hooks/useTickers';
import { usePrices } from '@/lib/hooks/usePrices';
import { useFinancials } from '@/lib/hooks/useFinancials';
import { useNews } from '@/lib/hooks/useNews';
import { TickerInput } from '@/components/ticker/TickerInput';
import { TickerChips } from '@/components/ticker/TickerChips';
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
import { TimeRange } from '@/lib/providers/interfaces';

export default function DashboardPage() {
  const { tickers, addTicker, removeTicker } = useTickers();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [range, setRange] = useState<TimeRange>('1M');
  const [statement, setStatement] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [newsWindow, setNewsWindow] = useState<'24h' | '7d' | '30d'>('7d');

  const activeTicker = selectedTicker || tickers[0] || '';

  const { data: priceData, isLoading: pricesLoading, error: pricesError } = usePrices(activeTicker, range);
  const { data: financialData, isLoading: financialsLoading, error: financialsError } = useFinancials(activeTicker, statement);
  const { data: newsData, isLoading: newsLoading, error: newsError } = useNews(activeTicker, newsWindow);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Dashboard</h1>
          <DarkModeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickers</h2>
          <TickerInput onAdd={addTicker} />
          <div className="mt-4">
            <TickerChips
              tickers={tickers}
              onRemove={removeTicker}
              selectedTicker={activeTicker}
              onSelect={setSelectedTicker}
            />
          </div>
        </section>

        {activeTicker && (
          <>
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeTicker} - Price Chart
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
      </main>
    </div>
  );
}

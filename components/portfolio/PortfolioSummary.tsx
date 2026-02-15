import { SummaryCard } from './SummaryCard';
import type { PortfolioTotals } from '@/lib/utils/portfolio';

interface PortfolioSummaryProps {
  totals: PortfolioTotals;
  isLoading?: boolean;
}

export function PortfolioSummary({ totals, isLoading }: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const gainLossColor = totals.totalGainLoss >= 0 ? 'green' : 'red';
  const arrow = totals.totalGainLoss >= 0 ? '↑' : '↓';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <SummaryCard
        label="Total Value"
        value={formatCurrency(totals.totalValue)}
      />
      <SummaryCard
        label="Total Gain/Loss"
        value={formatCurrency(totals.totalGainLoss)}
        valueColor={gainLossColor}
        icon={arrow}
      />
      <SummaryCard
        label="Portfolio Return"
        value={formatPercent(totals.portfolioReturn)}
        valueColor={gainLossColor}
        icon={arrow}
      />
    </div>
  );
}

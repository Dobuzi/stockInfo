'use client';

import { formatPercentage } from '@/lib/utils/formatting';

interface Metric {
  label: string;
  value: number;
  format?: 'percentage' | 'ratio';
}

interface MetricsPanelProps {
  metrics: Record<string, number>;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const metricConfigs: Record<string, { label: string; format?: 'percentage' | 'ratio' }> = {
    grossMargin: { label: 'Gross Margin', format: 'percentage' },
    operatingMargin: { label: 'Operating Margin', format: 'percentage' },
    netMargin: { label: 'Net Margin', format: 'percentage' },
    revenueGrowthYoY: { label: 'Revenue Growth YoY', format: 'percentage' },
    currentRatio: { label: 'Current Ratio', format: 'ratio' },
    debtToEquity: { label: 'Debt/Equity', format: 'ratio' },
    freeCashFlow: { label: 'Free Cash Flow' },
    fcfMargin: { label: 'FCF Margin', format: 'percentage' },
  };

  const formatValue = (value: number, format?: 'percentage' | 'ratio') => {
    if (format === 'percentage') {
      return formatPercentage(value / 100);
    }
    if (format === 'ratio') {
      return value.toFixed(2);
    }
    return value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {Object.entries(metrics).map(([key, value]) => {
        const config = metricConfigs[key];
        if (!config) return null;

        const isPositive = value > 0;
        const colorClass = isPositive
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400';

        return (
          <div key={key} className="space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">{config.label}</p>
            <p className={`text-lg font-semibold ${colorClass}`}>
              {formatValue(value, config.format)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

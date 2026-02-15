import type { Holding } from '@/lib/types/portfolio';
import type { HoldingPnLResult } from '@/lib/utils/portfolio';

interface HoldingRowProps {
  holding: Holding;
  currentPrice: number | null;
  pnl: HoldingPnLResult | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HoldingRow({ holding, currentPrice, pnl, onEdit, onDelete }: HoldingRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(value);
  };

  const gainLossColor = pnl && pnl.gainLoss >= 0
    ? 'text-green-600 dark:text-green-500'
    : 'text-red-600 dark:text-red-500';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
        {holding.ticker}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {formatNumber(holding.quantity)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {formatCurrency(holding.avgCost)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {currentPrice !== null ? formatCurrency(currentPrice) : 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
        {pnl ? formatCurrency(pnl.currentValue) : 'N/A'}
      </td>
      <td className={`px-4 py-3 text-sm text-right font-medium ${gainLossColor}`}>
        {pnl ? (
          <div>
            <div>{formatCurrency(pnl.gainLoss)}</div>
            <div className="text-xs">
              {pnl.gainLossPercent >= 0 ? '+' : ''}
              {pnl.gainLossPercent.toFixed(2)}%
            </div>
          </div>
        ) : (
          'N/A'
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        <button
          onClick={() => onEdit(holding.id)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 mr-3"
          aria-label={`Edit ${holding.ticker}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(holding.id)}
          className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
          aria-label={`Delete ${holding.ticker}`}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

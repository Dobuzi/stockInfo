'use client';

interface TickerChipsProps {
  tickers: string[];
  onRemove: (ticker: string) => void;
  selectedTicker?: string;
  onSelect?: (ticker: string) => void;
}

export function TickerChips({ tickers, onRemove, selectedTicker, onSelect }: TickerChipsProps) {
  if (tickers.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        No tickers added yet. Add one above to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tickers.map((ticker) => (
        <div key={ticker} className="flex items-center gap-2">
          <button
            onClick={() => onSelect?.(ticker)}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition-all
              ${selectedTicker === ticker
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {ticker}
          </button>
          <button
            onClick={() => onRemove(ticker)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xl font-bold"
            aria-label={`Remove ${ticker}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

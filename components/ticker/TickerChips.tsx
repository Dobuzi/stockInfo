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
        <div
          key={ticker}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            selectedTicker === ticker
              ? 'bg-blue-100 dark:bg-blue-900 border-blue-500'
              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
          } cursor-pointer`}
          onClick={() => onSelect?.(ticker)}
        >
          <span className="font-medium">{ticker}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(ticker);
            }}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

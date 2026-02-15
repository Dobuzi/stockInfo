'use client';

type TimeWindow = '24h' | '7d' | '30d';

interface NewsFiltersProps {
  selectedWindow: TimeWindow;
  onWindowChange: (window: TimeWindow) => void;
}

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

export function NewsFilters({ selectedWindow, onWindowChange }: NewsFiltersProps) {
  return (
    <div className="flex gap-2">
      {WINDOWS.map((window) => (
        <button
          key={window.value}
          onClick={() => onWindowChange(window.value)}
          className={`px-3 py-1 rounded ${
            selectedWindow === window.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {window.label}
        </button>
      ))}
    </div>
  );
}

'use client';

import { TimeRange } from '@/lib/providers/interfaces';

interface RangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

export function RangeSelector({ selected, onChange }: RangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-3 py-1 rounded ${
            selected === range
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

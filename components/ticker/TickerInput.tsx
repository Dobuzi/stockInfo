'use client';

import { useState } from 'react';
import { validateTicker } from '@/lib/utils/validation';

interface TickerInputProps {
  onAdd: (ticker: string) => void;
}

export function TickerInput({ onAdd }: TickerInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = input.trim().toUpperCase();

    if (!validateTicker(ticker)) {
      setError('Invalid ticker symbol');
      return;
    }

    onAdd(ticker);
    setInput('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter ticker (e.g., AAPL)"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
    </form>
  );
}

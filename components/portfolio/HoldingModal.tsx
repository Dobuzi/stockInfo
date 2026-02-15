'use client';

import { useState, useEffect } from 'react';
import { validateTicker, normalizeTicker } from '@/lib/utils/validation';
import type { Holding } from '@/lib/types/portfolio';

interface HoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holding: Omit<Holding, 'id'>) => void;
  editingHolding?: Holding | null;
}

export function HoldingModal({ isOpen, onClose, onSave, editingHolding }: HoldingModalProps) {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [addedDate, setAddedDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingHolding) {
      setTicker(editingHolding.ticker);
      setQuantity(editingHolding.quantity.toString());
      setAvgCost(editingHolding.avgCost.toString());
      setAddedDate(editingHolding.addedDate);
    } else {
      // Reset form for new holding
      setTicker('');
      setQuantity('');
      setAvgCost('');
      setAddedDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [editingHolding, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedTicker = normalizeTicker(ticker);

    // Validation
    if (!validateTicker(normalizedTicker)) {
      setError('Invalid ticker symbol');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const cost = parseFloat(avgCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Average cost must be greater than 0');
      return;
    }

    try {
      onSave({
        ticker: normalizedTicker,
        quantity: qty,
        avgCost: cost,
        addedDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save holding');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {editingHolding ? 'Edit Holding' : 'Add Holding'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticker
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="AAPL"
              required
              disabled={!!editingHolding}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="10.5"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Average Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="150.25"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Added
            </label>
            <input
              type="date"
              value={addedDate}
              onChange={(e) => setAddedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingHolding ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

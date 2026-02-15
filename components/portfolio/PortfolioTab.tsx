'use client';

import { useState, useMemo } from 'react';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { usePrices } from '@/lib/hooks/usePrices';
import { calculateHoldingPnL, calculatePortfolioTotals, calculateAllocation } from '@/lib/utils/portfolio';
import { PortfolioSummary } from './PortfolioSummary';
import { HoldingsTable } from './HoldingsTable';
import { HoldingModal } from './HoldingModal';
import { AllocationChart } from './AllocationChart';
import type { Holding } from '@/lib/types/portfolio';

export function PortfolioTab() {
  const { holdings, addHolding, updateHolding, removeHolding } = usePortfolio();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch current prices for all holdings
  const priceQueries = holdings.map(holding =>
    usePrices(holding.ticker, '1D')
  );

  const isLoadingPrices = priceQueries.some(q => q.isLoading);

  // Build price map
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((holding, index) => {
      const query = priceQueries[index];
      if (query.data && query.data.data.length > 0) {
        map.set(holding.ticker, query.data.data[0].close);
      }
    });
    return map;
  }, [holdings, priceQueries]);

  // Calculate P/L for each holding
  const pnlMap = useMemo(() => {
    const map = new Map();
    holdings.forEach(holding => {
      const currentPrice = priceMap.get(holding.ticker);
      if (currentPrice !== undefined) {
        const pnl = calculateHoldingPnL({
          quantity: holding.quantity,
          avgCost: holding.avgCost,
          currentPrice,
        });
        map.set(holding.id, pnl);
      }
    });
    return map;
  }, [holdings, priceMap]);

  // Calculate portfolio totals
  const totals = useMemo(() => {
    const holdingsWithPrices = holdings
      .map(h => ({
        quantity: h.quantity,
        avgCost: h.avgCost,
        currentPrice: priceMap.get(h.ticker) ?? h.avgCost,
      }))
      .filter(h => h.currentPrice !== undefined);

    return calculatePortfolioTotals(holdingsWithPrices);
  }, [holdings, priceMap]);

  // Calculate allocation
  const allocationData = useMemo(() => {
    const allocations = calculateAllocation(
      holdings.map(h => ({
        currentValue: pnlMap.get(h.id)?.currentValue ?? 0,
      })),
      totals.totalValue
    );

    return holdings.map((h, i) => ({
      ticker: h.ticker,
      value: pnlMap.get(h.id)?.currentValue ?? 0,
      percentage: allocations[i] ?? 0,
    }));
  }, [holdings, pnlMap, totals.totalValue]);

  const handleAddHolding = () => {
    setEditingHolding(null);
    setIsModalOpen(true);
  };

  const handleEditHolding = (id: string) => {
    const holding = holdings.find(h => h.id === id);
    if (holding) {
      setEditingHolding(holding);
      setIsModalOpen(true);
    }
  };

  const handleDeleteHolding = (id: string) => {
    if (deleteConfirm === id) {
      removeHolding(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleSaveHolding = (holdingData: Omit<Holding, 'id'>) => {
    if (editingHolding) {
      updateHolding(editingHolding.id, holdingData);
    } else {
      addHolding(holdingData);
    }
  };

  return (
    <div>
      <PortfolioSummary totals={totals} isLoading={isLoadingPrices} />

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {holdings.length} {holdings.length === 1 ? 'Holding' : 'Holdings'}
        </span>
        <button
          onClick={handleAddHolding}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Holding
        </button>
      </div>

      <HoldingsTable
        holdings={holdings}
        prices={priceMap}
        pnlData={pnlMap}
        onEdit={handleEditHolding}
        onDelete={handleDeleteHolding}
      />

      {holdings.length > 0 && (
        <AllocationChart data={allocationData} />
      )}

      <HoldingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHolding}
        editingHolding={editingHolding}
      />
    </div>
  );
}

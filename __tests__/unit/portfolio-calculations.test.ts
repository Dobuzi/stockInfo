import { describe, it, expect } from 'vitest';
import {
  calculateHoldingPnL,
  calculatePortfolioTotals,
  calculateAllocation,
} from '@/lib/utils/portfolio';

describe('calculateHoldingPnL', () => {
  it('should calculate cost basis correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.costBasis).toBe(1500);
  });

  it('should calculate current value correctly', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.currentValue).toBe(1800);
  });

  it('should calculate gain/loss dollar amount', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.gainLoss).toBe(300);
  });

  it('should calculate gain/loss percentage', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 150,
      currentPrice: 180,
    });

    expect(result.gainLossPercent).toBeCloseTo(20, 1);
  });

  it('should handle fractional shares', () => {
    const result = calculateHoldingPnL({
      quantity: 5.5,
      avgCost: 100,
      currentPrice: 120,
    });

    expect(result.costBasis).toBe(550);
    expect(result.currentValue).toBe(660);
    expect(result.gainLoss).toBe(110);
    expect(result.gainLossPercent).toBeCloseTo(20, 1);
  });

  it('should handle losses', () => {
    const result = calculateHoldingPnL({
      quantity: 10,
      avgCost: 200,
      currentPrice: 150,
    });

    expect(result.gainLoss).toBe(-500);
    expect(result.gainLossPercent).toBeCloseTo(-25, 1);
  });
});

describe('calculatePortfolioTotals', () => {
  it('should sum multiple holdings correctly', () => {
    const holdings = [
      { quantity: 10, avgCost: 150, currentPrice: 180 },
      { quantity: 5, avgCost: 200, currentPrice: 220 },
    ];

    const totals = calculatePortfolioTotals(holdings);

    expect(totals.totalCost).toBe(2500); // (10*150) + (5*200)
    expect(totals.totalValue).toBe(2900); // (10*180) + (5*220)
    expect(totals.totalGainLoss).toBe(400);
    expect(totals.portfolioReturn).toBeCloseTo(16, 1);
  });

  it('should handle zero holdings', () => {
    const totals = calculatePortfolioTotals([]);

    expect(totals.totalCost).toBe(0);
    expect(totals.totalValue).toBe(0);
    expect(totals.totalGainLoss).toBe(0);
    expect(totals.portfolioReturn).toBe(0);
  });
});

describe('calculateAllocation', () => {
  it('should calculate percentages that sum to 100', () => {
    const holdings = [
      { currentValue: 1800 },
      { currentValue: 1100 },
    ];

    const allocations = calculateAllocation(holdings, 2900);

    expect(allocations[0]).toBeCloseTo(62.07, 1);
    expect(allocations[1]).toBeCloseTo(37.93, 1);

    const sum = allocations.reduce((acc, val) => acc + val, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it('should handle single holding as 100%', () => {
    const holdings = [{ currentValue: 1000 }];
    const allocations = calculateAllocation(holdings, 1000);

    expect(allocations[0]).toBe(100);
  });
});

import { describe, it, expect } from 'vitest';
import { computeIncomeMetrics, computeBalanceMetrics, computeCashFlowMetrics } from '@/lib/transformers/financials';
import { FinancialStatement } from '@/lib/providers/interfaces';

describe('computeIncomeMetrics', () => {
  const statements: FinancialStatement[] = [
    {
      ticker: 'AAPL',
      fiscalDateEnding: '2025-09-30',
      reportedCurrency: 'USD',
      totalRevenue: 394328000000,
      grossProfit: 174000000000,
      operatingIncome: 120000000000,
      netIncome: 96995000000,
    },
    {
      ticker: 'AAPL',
      fiscalDateEnding: '2024-09-30',
      reportedCurrency: 'USD',
      totalRevenue: 365817000000,
      grossProfit: 160000000000,
      operatingIncome: 110000000000,
      netIncome: 90000000000,
    },
  ];

  it('calculates gross margin', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.grossMargin).toBeCloseTo(44.1, 1); // (174B / 394.3B) * 100
  });

  it('calculates operating margin', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.operatingMargin).toBeCloseTo(30.4, 1); // (120B / 394.3B) * 100
  });

  it('calculates net margin', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.netMargin).toBeCloseTo(24.6, 1); // (97B / 394.3B) * 100
  });

  it('calculates revenue growth YoY', () => {
    const metrics = computeIncomeMetrics(statements);
    expect(metrics.revenueGrowthYoY).toBeCloseTo(7.8, 1); // ((394.3 - 365.8) / 365.8) * 100
  });
});

describe('computeBalanceMetrics', () => {
  const statements: FinancialStatement[] = [
    {
      ticker: 'AAPL',
      fiscalDateEnding: '2025-09-30',
      reportedCurrency: 'USD',
      totalAssets: 365000000000,
      totalCurrentAssets: 135000000000,
      totalLiabilities: 265000000000,
      totalCurrentLiabilities: 125000000000,
      totalShareholderEquity: 100000000000,
    },
  ];

  it('calculates current ratio', () => {
    const metrics = computeBalanceMetrics(statements);
    expect(metrics.currentRatio).toBeCloseTo(1.08, 2); // 135B / 125B
  });

  it('calculates debt to equity', () => {
    const metrics = computeBalanceMetrics(statements);
    expect(metrics.debtToEquity).toBeCloseTo(2.65, 2); // 265B / 100B
  });
});

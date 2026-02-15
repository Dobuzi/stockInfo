import { FinancialStatement } from '@/lib/providers/interfaces';

export interface IncomeMetrics {
  grossMargin: number; // Percentage
  operatingMargin: number; // Percentage
  netMargin: number; // Percentage
  revenueGrowthYoY: number; // Percentage
}

export interface BalanceMetrics {
  currentRatio: number;
  debtToEquity: number;
}

export interface CashFlowMetrics {
  freeCashFlow: number; // Absolute value
  fcfMargin: number; // Percentage (FCF / Revenue)
}

export function computeIncomeMetrics(statements: FinancialStatement[]): IncomeMetrics {
  if (statements.length === 0) {
    throw new Error('No income statement data');
  }

  const latest = statements[0];
  const revenue = Number(latest.totalRevenue) || 0;
  const grossProfit = Number(latest.grossProfit) || 0;
  const operatingIncome = Number(latest.operatingIncome) || 0;
  const netIncome = Number(latest.netIncome) || 0;

  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  let revenueGrowthYoY = 0;
  if (statements.length > 1) {
    const prior = statements[1];
    const priorRevenue = Number(prior.totalRevenue) || 0;
    if (priorRevenue > 0) {
      revenueGrowthYoY = ((revenue - priorRevenue) / priorRevenue) * 100;
    }
  }

  return {
    grossMargin,
    operatingMargin,
    netMargin,
    revenueGrowthYoY,
  };
}

export function computeBalanceMetrics(statements: FinancialStatement[]): BalanceMetrics {
  if (statements.length === 0) {
    throw new Error('No balance sheet data');
  }

  const latest = statements[0];
  const currentAssets = Number(latest.totalCurrentAssets) || 0;
  const currentLiabilities = Number(latest.totalCurrentLiabilities) || 0;
  const totalLiabilities = Number(latest.totalLiabilities) || 0;
  const equity = Number(latest.totalShareholderEquity) || 0;

  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const debtToEquity = equity > 0 ? totalLiabilities / equity : 0;

  return {
    currentRatio,
    debtToEquity,
  };
}

export function computeCashFlowMetrics(
  cashFlowStatements: FinancialStatement[],
  incomeStatements: FinancialStatement[]
): CashFlowMetrics {
  if (cashFlowStatements.length === 0) {
    throw new Error('No cash flow data');
  }

  const latest = cashFlowStatements[0];
  const operatingCashflow = Number(latest.operatingCashflow) || 0;
  const capex = Math.abs(Number(latest.capitalExpenditures) || 0);
  const freeCashFlow = operatingCashflow - capex;

  let fcfMargin = 0;
  if (incomeStatements.length > 0) {
    const revenue = Number(incomeStatements[0].totalRevenue) || 0;
    if (revenue > 0) {
      fcfMargin = (freeCashFlow / revenue) * 100;
    }
  }

  return {
    freeCashFlow,
    fcfMargin,
  };
}

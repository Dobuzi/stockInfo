export interface HoldingPnLInput {
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface HoldingPnLResult {
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export function calculateHoldingPnL(input: HoldingPnLInput): HoldingPnLResult {
  const { quantity, avgCost, currentPrice } = input;

  const costBasis = quantity * avgCost;
  const currentValue = quantity * currentPrice;
  const gainLoss = currentValue - costBasis;
  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

  return {
    costBasis,
    currentValue,
    gainLoss,
    gainLossPercent,
  };
}

export interface PortfolioHolding {
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface PortfolioTotals {
  totalCost: number;
  totalValue: number;
  totalGainLoss: number;
  portfolioReturn: number;
}

export function calculatePortfolioTotals(
  holdings: PortfolioHolding[]
): PortfolioTotals {
  if (holdings.length === 0) {
    return {
      totalCost: 0,
      totalValue: 0,
      totalGainLoss: 0,
      portfolioReturn: 0,
    };
  }

  let totalCost = 0;
  let totalValue = 0;

  for (const holding of holdings) {
    totalCost += holding.quantity * holding.avgCost;
    totalValue += holding.quantity * holding.currentPrice;
  }

  const totalGainLoss = totalValue - totalCost;
  const portfolioReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    totalCost,
    totalValue,
    totalGainLoss,
    portfolioReturn,
  };
}

export interface AllocationHolding {
  currentValue: number;
}

export function calculateAllocation(
  holdings: AllocationHolding[],
  totalValue: number
): number[] {
  if (totalValue === 0) {
    return holdings.map(() => 0);
  }

  return holdings.map((holding) => (holding.currentValue / totalValue) * 100);
}

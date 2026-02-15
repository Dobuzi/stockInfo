export interface OverviewData {
  name: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  averageVolume: number | null;
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  revenue: number | null;
  quarterlyRevenueGrowth: number | null;
  quarterlyEarningsGrowth: number | null;
  eps: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  bookValue: number | null;
  dividendYield: number | null;
  dividendPerShare: number | null;
  payoutRatio: number | null;
}

export function formatMetric(
  value: string | undefined,
  type: 'number' | 'percent' | 'currency'
): number | null {
  if (!value || value === 'None' || value === '-') {
    return null;
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return null;
  }

  if (type === 'percent') {
    // Round to avoid floating point precision issues
    return Math.round(num * 100 * 100) / 100;
  }

  return num;
}

export function transformOverview(raw: any): OverviewData {
  return {
    name: raw.Name || null,
    sector: raw.Sector === 'None' ? null : raw.Sector || null,
    industry: raw.Industry === 'None' ? null : raw.Industry || null,
    marketCap: formatMetric(raw.MarketCapitalization, 'number'),
    fiftyTwoWeekHigh: formatMetric(raw['52WeekHigh'], 'number'),
    fiftyTwoWeekLow: formatMetric(raw['52WeekLow'], 'number'),
    averageVolume: formatMetric(raw.Volume, 'number'),
    peRatio: formatMetric(raw.PERatio, 'number'),
    forwardPE: formatMetric(raw.ForwardPE, 'number'),
    pegRatio: formatMetric(raw.PEGRatio, 'number'),
    priceToBook: formatMetric(raw.PriceToBookRatio, 'number'),
    priceToSales: formatMetric(raw.PriceToSalesRatioTTM, 'number'),
    evToEbitda: formatMetric(raw.EVToEBITDA, 'number'),
    profitMargin: formatMetric(raw.ProfitMargin, 'percent'),
    operatingMargin: formatMetric(raw.OperatingMarginTTM, 'percent'),
    returnOnEquity: formatMetric(raw.ReturnOnEquityTTM, 'percent'),
    returnOnAssets: formatMetric(raw.ReturnOnAssetsTTM, 'percent'),
    revenue: formatMetric(raw.RevenueTTM, 'number'),
    quarterlyRevenueGrowth: formatMetric(raw.QuarterlyRevenueGrowthYOY, 'percent'),
    quarterlyEarningsGrowth: formatMetric(raw.QuarterlyEarningsGrowthYOY, 'percent'),
    eps: formatMetric(raw.DilutedEPSTTM, 'number'),
    debtToEquity: formatMetric(raw.DebtToEquity, 'number'),
    currentRatio: formatMetric(raw.CurrentRatio, 'number'),
    quickRatio: formatMetric(raw.QuickRatio, 'number'),
    bookValue: formatMetric(raw.BookValue, 'number'),
    dividendYield: formatMetric(raw.DividendYield, 'percent'),
    dividendPerShare: formatMetric(raw.DividendPerShare, 'number'),
    payoutRatio: formatMetric(raw.PayoutRatio, 'percent'),
  };
}

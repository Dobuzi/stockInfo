'use client';

import { useQuery } from '@tanstack/react-query';

type StatementType = 'income' | 'balance' | 'cashflow';
type Period = 'annual' | 'quarterly';

export function useFinancials(
  ticker: string,
  statement: StatementType = 'income',
  period: Period = 'annual'
) {
  return useQuery({
    queryKey: ['financials', ticker, statement, period],
    queryFn: async () => {
      const response = await fetch(
        `/api/financials?ticker=${encodeURIComponent(ticker)}&statement=${statement}&period=${period}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch financials');
      }
      return response.json();
    },
    enabled: !!ticker,
  });
}

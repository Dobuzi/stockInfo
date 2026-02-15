'use client';

import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@/lib/providers/interfaces';

interface PriceResponse {
  ticker: string;
  range: string;
  data: any[];
  meta: {
    currentPrice: number;
    dayChange: number;
    periodChange: number;
  };
}

export function usePrices(ticker: string, range: TimeRange = '1M') {
  return useQuery<PriceResponse>({
    queryKey: ['prices', ticker, range],
    queryFn: async () => {
      const response = await fetch(`/api/prices?ticker=${ticker}&range=${range}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch prices');
      }
      return response.json();
    },
    enabled: !!ticker,
  });
}

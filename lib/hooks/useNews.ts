'use client';

import { useQuery } from '@tanstack/react-query';

type TimeWindow = '24h' | '7d' | '30d';

export function useNews(ticker: string, window: TimeWindow = '7d') {
  return useQuery({
    queryKey: ['news', ticker, window],
    queryFn: async () => {
      const response = await fetch(`/api/news?ticker=${ticker}&window=${window}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch news');
      }
      return response.json();
    },
    enabled: !!ticker,
  });
}

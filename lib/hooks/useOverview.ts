import { useQuery } from '@tanstack/react-query';
import type { OverviewData } from '@/lib/transformers/overview';

interface OverviewResponse {
  ticker: string;
  data: OverviewData;
}

export function useOverview(ticker: string) {
  return useQuery<OverviewResponse>({
    queryKey: ['overview', ticker],
    queryFn: async () => {
      const response = await fetch(`/api/overview?ticker=${encodeURIComponent(ticker)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch overview');
      }

      return response.json();
    },
    enabled: !!ticker && ticker.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 2,
  });
}

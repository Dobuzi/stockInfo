'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { normalizePrices } from '@/lib/transformers/prices';
import { PriceData } from '@/lib/providers/interfaces';

interface CompareChartProps {
  datasets: Array<{ ticker: string; data: PriceData[] }>;
  height?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export function CompareChart({ datasets, height = 400 }: CompareChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || datasets.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1f2937' : '#ffffff' },
        textColor: isDark ? '#d1d5db' : '#1f2937',
      },
      grid: {
        vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
        horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
      },
    });

    datasets.forEach((dataset, index) => {
      const normalized = normalizePrices(dataset.data);
      const lineSeries = chart.addLineSeries({
        color: COLORS[index % COLORS.length],
        lineWidth: 2,
        title: dataset.ticker,
      });

      const chartData = dataset.data.map((d, i) => ({
        time: d.date,
        value: normalized[i],
      }));

      lineSeries.setData(chartData);
    });

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [datasets, height]);

  return (
    <div className="space-y-2">
      <div ref={chartContainerRef} className="w-full" />
      <div className="flex flex-wrap gap-3">
        {datasets.map((dataset, index) => (
          <div key={dataset.ticker} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm font-medium">{dataset.ticker}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

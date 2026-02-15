'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { PriceData } from '@/lib/providers/interfaces';
import { calculateSMA, type IndicatorPoint } from '@/lib/utils/indicators';

interface PriceChartProps {
  data: PriceData[];
  height?: number;
  showVolume?: boolean;  // Optional: default true
  showSMAs?: boolean;    // Optional: default true
}

export function PriceChart({
  data,
  height = 550,  // Changed from 400 to 550 to accommodate volume pane
  showVolume = true,
  showSMAs = true
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const volumeData = useMemo(() => {
    if (!showVolume) return [];

    return data.map(d => ({
      time: d.date,
      value: d.volume,
      color: d.close >= d.open ? '#10b981' : '#ef4444', // green up, red down
    }));
  }, [data, showVolume]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

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

    const candlestick = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const chartData = data.map(d => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestick.setData(chartData);
    chart.timeScale().fitContent();

    // Add volume histogram in separate pane
    if (showVolume && volumeData.length > 0) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7, // Volume takes bottom 30% of chart
          bottom: 0,
        },
      });

      volumeSeries.setData(volumeData);
    }

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
  }, [data, height, showVolume, volumeData]);

  return <div ref={chartContainerRef} className="w-full" />;
}

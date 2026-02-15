'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
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

  const smaData = useMemo(() => {
    if (!showSMAs) {
      return { sma20: [], sma50: [], sma200: [] };
    }

    return {
      sma20: calculateSMA(data, 20),
      sma50: calculateSMA(data, 50),
      sma200: calculateSMA(data, 200),
    };
  }, [data, showSMAs]);

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
      const volumeSeries = chart.addSeries(HistogramSeries, {
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

    // Add SMA line series
    if (showSMAs) {
      if (smaData.sma20.length > 0) {
        const sma20Series = chart.addSeries(LineSeries, {
          color: '#3b82f6', // blue
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true,
        });
        sma20Series.setData(smaData.sma20);
      }

      if (smaData.sma50.length > 0) {
        const sma50Series = chart.addSeries(LineSeries, {
          color: '#f97316', // orange
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true,
        });
        sma50Series.setData(smaData.sma50);
      }

      if (smaData.sma200.length > 0) {
        const sma200Series = chart.addSeries(LineSeries, {
          color: '#a855f7', // purple
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true,
        });
        sma200Series.setData(smaData.sma200);
      }
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
  }, [data, height, showVolume, volumeData, showSMAs, smaData]);

  return (
    <div className="w-full relative">
      <div ref={chartContainerRef} className="w-full" />
      {showSMAs && (smaData.sma20.length > 0 || smaData.sma50.length > 0 || smaData.sma200.length > 0) && (
        <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 rounded px-3 py-2 text-xs backdrop-blur-sm hidden sm:block">
          {smaData.sma20.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-3 h-0.5 bg-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">SMA 20</span>
            </div>
          )}
          {smaData.sma50.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-3 h-0.5 bg-orange-500" />
              <span className="text-gray-700 dark:text-gray-300">SMA 50</span>
            </div>
          )}
          {smaData.sma200.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-purple-500" />
              <span className="text-gray-700 dark:text-gray-300">SMA 200</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

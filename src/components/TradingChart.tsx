import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { Candle, Pattern } from '@/utils/patternDetection';

interface TradingChartProps {
  data: Candle[];
  patterns: Pattern[];
}

export const TradingChart = ({ data, patterns }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'hsl(217, 33%, 14%)' },
        textColor: 'hsl(210, 40%, 98%)',
      },
      grid: {
        vertLines: { color: 'hsl(217, 33%, 25%)' },
        horzLines: { color: 'hsl(217, 33%, 25%)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addSeries('Candlestick' as any, {
      upColor: 'hsl(142, 76%, 36%)',
      downColor: 'hsl(0, 84%, 60%)',
      borderUpColor: 'hsl(142, 76%, 36%)',
      borderDownColor: 'hsl(0, 84%, 60%)',
      wickUpColor: 'hsl(142, 76%, 36%)',
      wickDownColor: 'hsl(0, 84%, 60%)',
    });

    candleSeriesRef.current = candleSeries;
    candleSeries.setData(data.map(c => ({ ...c, time: c.time as Time })));

    // Add markers for patterns
    const markers = patterns.map(pattern => ({
      time: pattern.time as Time,
      position: pattern.signal === 'bullish' ? 'belowBar' as const : 'aboveBar' as const,
      color: pattern.signal === 'bullish' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)',
      shape: pattern.signal === 'bullish' ? 'arrowUp' as const : 'arrowDown' as const,
      text: pattern.type,
    }));

    (candleSeries as any).setMarkers(markers);

    // Handle resize
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
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (candleSeriesRef.current && data.length > 0) {
      candleSeriesRef.current.setData(data.map(c => ({ ...c, time: c.time as Time })));
      
      // Update markers
      const markers = patterns.map(pattern => ({
        time: pattern.time as Time,
        position: pattern.signal === 'bullish' ? 'belowBar' as const : 'aboveBar' as const,
        color: pattern.signal === 'bullish' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)',
        shape: pattern.signal === 'bullish' ? 'arrowUp' as const : 'arrowDown' as const,
        text: pattern.type,
      }));
      
      (candleSeriesRef.current as any).setMarkers(markers);
    }
  }, [data, patterns]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full rounded-lg overflow-hidden border border-border"
    />
  );
};

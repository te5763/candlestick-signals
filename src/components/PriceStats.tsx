import { Candle } from '@/utils/patternDetection';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceStatsProps {
  data: Candle[];
  symbol: string;
}

export const PriceStats = ({ data, symbol }: PriceStatsProps) => {
  if (data.length === 0) {
    return null;
  }

  const latestCandle = data[data.length - 1];
  const firstCandle = data[0];
  const currentPrice = latestCandle.close;
  const priceChange = currentPrice - firstCandle.close;
  const priceChangePercent = (priceChange / firstCandle.close) * 100;
  
  const high24h = Math.max(...data.map(c => c.high));
  const low24h = Math.min(...data.map(c => c.low));
  
  const volume = data.reduce((sum, c) => sum + (c.high - c.low), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Current Price</span>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            ${currentPrice.toFixed(2)}
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              priceChange >= 0 ? 'text-bullish' : 'text-bearish'
            }`}
          >
            {priceChange >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {priceChange >= 0 ? '+' : ''}
            {priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">24h High</span>
          <TrendingUp className="h-4 w-4 text-bullish" />
        </div>
        <div className="text-2xl font-bold text-bullish">
          ${high24h.toFixed(2)}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">24h Low</span>
          <TrendingDown className="h-4 w-4 text-bearish" />
        </div>
        <div className="text-2xl font-bold text-bearish">
          ${low24h.toFixed(2)}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Symbol</span>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">
          {symbol}
        </div>
      </Card>
    </div>
  );
};

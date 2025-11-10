import { useState, useEffect } from 'react';
import { TradingChart } from '@/components/TradingChart';
import { TickerSearch } from '@/components/TickerSearch';
import { PatternSignals } from '@/components/PatternSignals';
import { PriceStats } from '@/components/PriceStats';
import { OptionsAnalysis } from '@/components/OptionsAnalysis';
import { Candle, Pattern, detectPatterns } from '@/utils/patternDetection';
import { getPriceData, generateNewCandle } from '@/utils/priceData';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Activity } from 'lucide-react';

const Index = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const { toast } = useToast();

  const loadData = async (newSymbol: string) => {
    setIsLoading(true);
    setIsUsingDemoData(false);
    try {
      console.log(`Loading data for ${newSymbol}...`);
      const data = await getPriceData(newSymbol);
      setCandles(data);
      const detectedPatterns = detectPatterns(data);
      setPatterns(detectedPatterns);
      setSymbol(newSymbol);

      // Check if we got demo data (demo data has exactly 100 candles)
      const isDemoData = data.length === 100;
      setIsUsingDemoData(isDemoData);
      
      console.log(`Loaded ${data.length} candles. Demo data: ${isDemoData}`);

      if (detectedPatterns.length > 0) {
        const latestPattern = detectedPatterns[detectedPatterns.length - 1];
        toast({
          title: `${latestPattern.signal === 'bullish' ? '🟢' : '🔴'} ${latestPattern.type} Detected`,
          description: latestPattern.description,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setIsUsingDemoData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData('BTCUSDT'); // Start with crypto for better reliability
  }, []);

  // Simulate live updates every 5 seconds
  useEffect(() => {
    if (candles.length === 0) return;

    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const newCandle = generateNewCandle(prev[prev.length - 1]);
        const updated = [...prev.slice(1), newCandle];
        
        // Re-detect patterns with new data
        const newPatterns = detectPatterns(updated);
        
        // Check if there are new patterns
        if (newPatterns.length > patterns.length) {
          const latestPattern = newPatterns[newPatterns.length - 1];
          toast({
            title: `${latestPattern.signal === 'bullish' ? '🟢' : '🔴'} ${latestPattern.type} Detected`,
            description: `${latestPattern.signal === 'bullish' ? 'BUY' : 'SELL'} signal at $${latestPattern.price.toFixed(2)}`,
          });
        }
        
        setPatterns(newPatterns);
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [candles.length, patterns.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Live Trading Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time candlestick pattern detection & signals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-bullish animate-pulse" />
              <span className="text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <TickerSearch onSearch={loadData} isLoading={isLoading} />

        {/* Demo Data Warning */}
        {isUsingDemoData && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm">
            <strong className="text-foreground">Note:</strong>{' '}
            <span className="text-muted-foreground">
              Displaying simulated data for {symbol}. Live API sources may be rate-limited.
            </span>
          </div>
        )}

        {/* Price Stats */}
        <PriceStats data={candles} symbol={symbol} />

        {/* Chart and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TradingChart data={candles} patterns={patterns} />
            
            {/* Pattern Signals */}
            <PatternSignals patterns={patterns} />
          </div>
          
          {/* Options Analysis */}
          <div>
            <OptionsAnalysis 
              data={candles} 
              currentPrice={candles.length > 0 ? candles[candles.length - 1].close : 0}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Pattern Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-bullish mb-1">Bullish Patterns (Buy Signals)</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Bullish Engulfing</li>
                <li>• Morning Star</li>
                <li>• Hammer</li>
                <li>• Piercing Line</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-bearish mb-1">Bearish Patterns (Sell Signals)</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Bearish Engulfing</li>
                <li>• Evening Star</li>
                <li>• Shooting Star</li>
                <li>• Dark Cloud Cover</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Neutral Patterns</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Doji (Indecision)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

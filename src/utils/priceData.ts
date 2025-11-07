import { Candle } from './patternDetection';

// Generate realistic candlestick data for demo purposes
export const generateDemoData = (symbol: string, count: number = 100): Candle[] => {
  const candles: Candle[] = [];
  let basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2500 : 150;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * 60000; // 1 minute intervals
    
    // Add some realistic price movement
    const trend = Math.sin(i / 10) * 0.02;
    const volatility = (Math.random() - 0.5) * 0.03;
    const change = trend + volatility;
    
    const open = basePrice;
    const close = basePrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    candles.push({
      time: Math.floor(time / 1000),
      open,
      high,
      low,
      close
    });
    
    basePrice = close;
  }
  
  return candles;
};

// Fetch real cryptocurrency data from Binance (no API key required)
export const fetchBinanceData = async (symbol: string): Promise<Candle[]> => {
  try {
    // Convert symbol format (e.g., BTC-USD to BTCUSDT)
    const binanceSymbol = symbol.replace('-', '').replace('USD', 'USDT');
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&limit=100`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    
    return data.map((item: any[]) => ({
      time: Math.floor(item[0] / 1000),
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4])
    }));
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    // Fallback to demo data
    return generateDemoData(symbol);
  }
};

// Main function to get price data
export const getPriceData = async (symbol: string): Promise<Candle[]> => {
  // Check if it's a crypto symbol
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('BNB')) {
    return fetchBinanceData(symbol);
  }
  
  // For stocks, use demo data (you can integrate Alpha Vantage or other APIs later)
  return generateDemoData(symbol);
};

// Generate new candle for live updates
export const generateNewCandle = (lastCandle: Candle): Candle => {
  const change = (Math.random() - 0.5) * 0.005; // 0.5% max change
  const open = lastCandle.close;
  const close = open * (1 + change);
  const high = Math.max(open, close) * (1 + Math.random() * 0.002);
  const low = Math.min(open, close) * (1 - Math.random() * 0.002);
  
  return {
    time: lastCandle.time + 60,
    open,
    high,
    low,
    close
  };
};

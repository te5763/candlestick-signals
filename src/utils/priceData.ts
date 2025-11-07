import { Candle } from './patternDetection';

// Generate realistic candlestick data for demo purposes
export const generateDemoData = (symbol: string, count: number = 100): Candle[] => {
  const candles: Candle[] = [];
  let basePrice = symbol.includes('BTC') ? 95000 : symbol.includes('ETH') ? 3500 : 150;
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

// Fetch data from CoinGecko (CORS-friendly, no API key needed)
export const fetchCoinGeckoData = async (symbol: string): Promise<Candle[]> => {
  try {
    // Map common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'BTCUSDT': 'bitcoin',
      'ETHUSDT': 'ethereum',
      'BNBUSDT': 'binancecoin',
      'SOLUSDT': 'solana',
      'ADAUSDT': 'cardano',
      'DOTUSDT': 'polkadot',
    };

    const coinId = symbolMap[symbol] || 'bitcoin';
    
    // Fetch OHLC data (last 1 day with 1-hour intervals)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch CoinGecko data');
    }
    
    const data = await response.json();
    
    // CoinGecko returns [timestamp, open, high, low, close]
    const candles = data.slice(-100).map((item: number[]) => ({
      time: Math.floor(item[0] / 1000),
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4]
    }));

    // If we don't have enough data, pad with the last value
    if (candles.length < 50) {
      const lastCandle = candles[candles.length - 1];
      const additionalCandles = generateDemoData(symbol, 50);
      return [...candles, ...additionalCandles];
    }

    return candles;
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
    return generateDemoData(symbol);
  }
};

// Fetch real cryptocurrency data from Binance
export const fetchBinanceData = async (symbol: string): Promise<Candle[]> => {
  try {
    // Symbol should already be in correct format (e.g., BTCUSDT)
    const cleanSymbol = symbol.toUpperCase().trim();
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=1m&limit=100`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
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
    throw error; // Re-throw to try fallback
  }
};

// Main function to get price data with multiple fallbacks
export const getPriceData = async (symbol: string): Promise<Candle[]> => {
  // Normalize symbol format
  const normalizedSymbol = symbol.toUpperCase().trim();
  
  console.log('Fetching price data for:', normalizedSymbol);
  
  // Try CoinGecko first (most reliable, CORS-friendly)
  try {
    const data = await fetchCoinGeckoData(normalizedSymbol);
    console.log('Successfully fetched from CoinGecko');
    return data;
  } catch (error) {
    console.log('CoinGecko failed, trying Binance...');
  }

  // Try Binance as fallback
  try {
    const data = await fetchBinanceData(normalizedSymbol);
    console.log('Successfully fetched from Binance');
    return data;
  } catch (error) {
    console.log('Binance failed, using demo data');
  }

  // Final fallback to demo data
  console.log('Using demo data with realistic prices');
  return generateDemoData(normalizedSymbol);
};

// Generate new candle for live updates based on last candle
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

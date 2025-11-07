export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Pattern {
  type: string;
  signal: 'bullish' | 'bearish';
  time: number;
  price: number;
  description: string;
}

// Helper function to check if candle is bullish
const isBullish = (candle: Candle) => candle.close > candle.open;

// Helper function to check if candle is bearish
const isBearish = (candle: Candle) => candle.close < candle.open;

// Helper function to get candle body size
const getBodySize = (candle: Candle) => Math.abs(candle.close - candle.open);

// Helper function to get upper shadow
const getUpperShadow = (candle: Candle) => 
  candle.high - Math.max(candle.open, candle.close);

// Helper function to get lower shadow
const getLowerShadow = (candle: Candle) => 
  Math.min(candle.open, candle.close) - candle.low;

// Bullish Engulfing Pattern
const isBullishEngulfing = (prev: Candle, curr: Candle): boolean => {
  return (
    isBearish(prev) &&
    isBullish(curr) &&
    curr.open < prev.close &&
    curr.close > prev.open &&
    getBodySize(curr) > getBodySize(prev)
  );
};

// Bearish Engulfing Pattern
const isBearishEngulfing = (prev: Candle, curr: Candle): boolean => {
  return (
    isBullish(prev) &&
    isBearish(curr) &&
    curr.open > prev.close &&
    curr.close < prev.open &&
    getBodySize(curr) > getBodySize(prev)
  );
};

// Hammer Pattern
const isHammer = (candle: Candle): boolean => {
  const body = getBodySize(candle);
  const lowerShadow = getLowerShadow(candle);
  const upperShadow = getUpperShadow(candle);
  
  return (
    lowerShadow > body * 2 &&
    upperShadow < body * 0.5 &&
    body > 0
  );
};

// Shooting Star Pattern
const isShootingStar = (candle: Candle): boolean => {
  const body = getBodySize(candle);
  const lowerShadow = getLowerShadow(candle);
  const upperShadow = getUpperShadow(candle);
  
  return (
    upperShadow > body * 2 &&
    lowerShadow < body * 0.5 &&
    body > 0
  );
};

// Doji Pattern
const isDoji = (candle: Candle): boolean => {
  const body = getBodySize(candle);
  const totalRange = candle.high - candle.low;
  
  return body < totalRange * 0.1 && totalRange > 0;
};

// Morning Star Pattern (3 candle pattern)
const isMorningStar = (candle1: Candle, candle2: Candle, candle3: Candle): boolean => {
  return (
    isBearish(candle1) &&
    getBodySize(candle2) < getBodySize(candle1) * 0.5 &&
    isBullish(candle3) &&
    candle3.close > (candle1.open + candle1.close) / 2
  );
};

// Evening Star Pattern (3 candle pattern)
const isEveningStar = (candle1: Candle, candle2: Candle, candle3: Candle): boolean => {
  return (
    isBullish(candle1) &&
    getBodySize(candle2) < getBodySize(candle1) * 0.5 &&
    isBearish(candle3) &&
    candle3.close < (candle1.open + candle1.close) / 2
  );
};

// Piercing Line Pattern
const isPiercingLine = (prev: Candle, curr: Candle): boolean => {
  return (
    isBearish(prev) &&
    isBullish(curr) &&
    curr.open < prev.low &&
    curr.close > (prev.open + prev.close) / 2 &&
    curr.close < prev.open
  );
};

// Dark Cloud Cover Pattern
const isDarkCloudCover = (prev: Candle, curr: Candle): boolean => {
  return (
    isBullish(prev) &&
    isBearish(curr) &&
    curr.open > prev.high &&
    curr.close < (prev.open + prev.close) / 2 &&
    curr.close > prev.open
  );
};

export const detectPatterns = (candles: Candle[]): Pattern[] => {
  const patterns: Pattern[] = [];
  
  if (candles.length < 2) return patterns;

  for (let i = 2; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prevPrev = candles[i - 2];

    // Check 3-candle patterns first
    if (isMorningStar(prevPrev, prev, curr)) {
      patterns.push({
        type: 'Morning Star',
        signal: 'bullish',
        time: curr.time,
        price: curr.close,
        description: 'Bullish reversal pattern indicating potential uptrend'
      });
    }

    if (isEveningStar(prevPrev, prev, curr)) {
      patterns.push({
        type: 'Evening Star',
        signal: 'bearish',
        time: curr.time,
        price: curr.close,
        description: 'Bearish reversal pattern indicating potential downtrend'
      });
    }

    // Check 2-candle patterns
    if (isBullishEngulfing(prev, curr)) {
      patterns.push({
        type: 'Bullish Engulfing',
        signal: 'bullish',
        time: curr.time,
        price: curr.close,
        description: 'Strong bullish reversal - current candle engulfs previous bearish candle'
      });
    }

    if (isBearishEngulfing(prev, curr)) {
      patterns.push({
        type: 'Bearish Engulfing',
        signal: 'bearish',
        time: curr.time,
        price: curr.close,
        description: 'Strong bearish reversal - current candle engulfs previous bullish candle'
      });
    }

    if (isPiercingLine(prev, curr)) {
      patterns.push({
        type: 'Piercing Line',
        signal: 'bullish',
        time: curr.time,
        price: curr.close,
        description: 'Bullish reversal - buying pressure pushing price up'
      });
    }

    if (isDarkCloudCover(prev, curr)) {
      patterns.push({
        type: 'Dark Cloud Cover',
        signal: 'bearish',
        time: curr.time,
        price: curr.close,
        description: 'Bearish reversal - selling pressure pushing price down'
      });
    }

    // Check single-candle patterns
    if (isHammer(curr)) {
      patterns.push({
        type: 'Hammer',
        signal: 'bullish',
        time: curr.time,
        price: curr.close,
        description: 'Bullish reversal with long lower shadow - buyers rejecting lower prices'
      });
    }

    if (isShootingStar(curr)) {
      patterns.push({
        type: 'Shooting Star',
        signal: 'bearish',
        time: curr.time,
        price: curr.close,
        description: 'Bearish reversal with long upper shadow - sellers rejecting higher prices'
      });
    }

    if (isDoji(curr)) {
      patterns.push({
        type: 'Doji',
        signal: 'bullish', // Neutral but we'll mark as bullish for display
        time: curr.time,
        price: curr.close,
        description: 'Indecision in market - potential trend reversal'
      });
    }
  }

  return patterns;
};

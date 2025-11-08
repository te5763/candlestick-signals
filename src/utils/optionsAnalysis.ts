import { Candle } from './patternDetection';

export interface OptionRecommendation {
  type: 'CE' | 'PE';
  strike: number;
  probability: number;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface StopLossData {
  stopLoss: number;
  target: number;
  riskRewardRatio: number;
  atr: number;
}

// Calculate RSI (Relative Strength Index)
export const calculateRSI = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Calculate EMA (Exponential Moving Average)
const calculateEMA = (candles: Candle[], period: number): number => {
  if (candles.length < period) return candles[candles.length - 1].close;
  
  const multiplier = 2 / (period + 1);
  let ema = candles.slice(-period).reduce((sum, c) => sum + c.close, 0) / period;
  
  for (let i = candles.length - period; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema;
  }
  
  return ema;
};

// Calculate ATR (Average True Range) for stop loss
export const calculateATR = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 0;

  let atrSum = 0;
  
  for (let i = candles.length - period; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    atrSum += tr;
  }
  
  return atrSum / period;
};

// Analyze options and provide recommendations
export const analyzeOptions = (candles: Candle[]): {
  recommendations: OptionRecommendation[];
  stopLoss: StopLossData;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  strength: number;
} => {
  if (candles.length < 20) {
    const currentPrice = candles[candles.length - 1].close;
    return {
      recommendations: [{
        type: 'CE',
        strike: currentPrice * 1.02,
        probability: 50,
        confidence: 'Low',
        reasoning: 'Insufficient data for analysis'
      }],
      stopLoss: {
        stopLoss: currentPrice * 0.98,
        target: currentPrice * 1.04,
        riskRewardRatio: 2,
        atr: currentPrice * 0.01
      },
      trend: 'Neutral',
      strength: 0
    };
  }

  const currentPrice = candles[candles.length - 1].close;
  const rsi = calculateRSI(candles);
  const ema9 = calculateEMA(candles, 9);
  const ema21 = calculateEMA(candles, 21);
  const atr = calculateATR(candles);
  
  // Calculate recent momentum
  const recentCandles = candles.slice(-10);
  const bullishCandles = recentCandles.filter(c => c.close > c.open).length;
  const momentum = (bullishCandles / recentCandles.length) * 100;
  
  // Determine trend
  let trend: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  let ceProbability = 50;
  let peProbability = 50;
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
  
  // Multi-factor analysis
  const factors = {
    rsi: 0,
    ema: 0,
    momentum: 0,
    priceAction: 0
  };
  
  // RSI Analysis
  if (rsi < 30) {
    factors.rsi = 20; // Oversold - bullish
  } else if (rsi > 70) {
    factors.rsi = -20; // Overbought - bearish
  } else if (rsi > 50) {
    factors.rsi = 10;
  } else {
    factors.rsi = -10;
  }
  
  // EMA Analysis
  if (ema9 > ema21) {
    factors.ema = 15; // Bullish crossover
  } else {
    factors.ema = -15; // Bearish crossover
  }
  
  // Momentum Analysis
  if (momentum > 65) {
    factors.momentum = 20;
  } else if (momentum < 35) {
    factors.momentum = -20;
  }
  
  // Price Action
  const lastCandle = candles[candles.length - 1];
  if (lastCandle.close > lastCandle.open) {
    factors.priceAction = 10;
  } else {
    factors.priceAction = -10;
  }
  
  const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
  
  // Determine probabilities
  if (totalScore > 25) {
    trend = 'Bullish';
    ceProbability = Math.min(75 + (totalScore - 25) / 2, 85);
    peProbability = 100 - ceProbability;
    confidence = totalScore > 40 ? 'High' : 'Medium';
  } else if (totalScore < -25) {
    trend = 'Bearish';
    peProbability = Math.min(75 + Math.abs(totalScore + 25) / 2, 85);
    ceProbability = 100 - peProbability;
    confidence = totalScore < -40 ? 'High' : 'Medium';
  } else {
    trend = 'Neutral';
    ceProbability = 50 + totalScore / 2;
    peProbability = 100 - ceProbability;
    confidence = 'Low';
  }
  
  // Generate strike recommendations
  const recommendations: OptionRecommendation[] = [];
  
  if (trend === 'Bullish') {
    // ATM Call
    recommendations.push({
      type: 'CE',
      strike: Math.round(currentPrice / 50) * 50, // Round to nearest 50
      probability: ceProbability,
      confidence,
      reasoning: `Strong bullish indicators: RSI ${rsi.toFixed(1)}, EMA crossover, ${momentum.toFixed(0)}% bullish momentum`
    });
    
    // OTM Call
    recommendations.push({
      type: 'CE',
      strike: Math.round((currentPrice * 1.02) / 50) * 50,
      probability: ceProbability * 0.85,
      confidence: confidence === 'High' ? 'Medium' : 'Low',
      reasoning: 'Higher reward OTM option for aggressive traders'
    });
  } else if (trend === 'Bearish') {
    // ATM Put
    recommendations.push({
      type: 'PE',
      strike: Math.round(currentPrice / 50) * 50,
      probability: peProbability,
      confidence,
      reasoning: `Strong bearish indicators: RSI ${rsi.toFixed(1)}, bearish EMA, ${(100-momentum).toFixed(0)}% bearish pressure`
    });
    
    // OTM Put
    recommendations.push({
      type: 'PE',
      strike: Math.round((currentPrice * 0.98) / 50) * 50,
      probability: peProbability * 0.85,
      confidence: confidence === 'High' ? 'Medium' : 'Low',
      reasoning: 'Higher reward OTM option for aggressive traders'
    });
  } else {
    // Neutral - suggest both
    recommendations.push({
      type: 'CE',
      strike: Math.round(currentPrice / 50) * 50,
      probability: ceProbability,
      confidence: 'Low',
      reasoning: `Neutral market: RSI ${rsi.toFixed(1)}, mixed signals. Proceed with caution.`
    });
    
    recommendations.push({
      type: 'PE',
      strike: Math.round(currentPrice / 50) * 50,
      probability: peProbability,
      confidence: 'Low',
      reasoning: 'Alternative for neutral market - wait for clear direction'
    });
  }
  
  // Calculate stop loss using ATR
  const atrMultiplier = 2; // 2x ATR for stop loss
  const stopLoss = trend === 'Bullish' 
    ? currentPrice - (atr * atrMultiplier)
    : currentPrice + (atr * atrMultiplier);
  
  const target = trend === 'Bullish'
    ? currentPrice + (atr * atrMultiplier * 2)
    : currentPrice - (atr * atrMultiplier * 2);
  
  return {
    recommendations,
    stopLoss: {
      stopLoss: Math.round(stopLoss * 100) / 100,
      target: Math.round(target * 100) / 100,
      riskRewardRatio: 2,
      atr: Math.round(atr * 100) / 100
    },
    trend,
    strength: Math.abs(totalScore)
  };
};

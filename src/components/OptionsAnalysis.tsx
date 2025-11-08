import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { analyzeOptions } from '@/utils/optionsAnalysis';
import { Candle } from '@/utils/patternDetection';

interface OptionsAnalysisProps {
  data: Candle[];
  currentPrice: number;
}

export const OptionsAnalysis = ({ data, currentPrice }: OptionsAnalysisProps) => {
  if (data.length === 0) return null;

  const analysis = analyzeOptions(data);
  const { recommendations, stopLoss, trend, strength } = analysis;

  const getTrendColor = () => {
    if (trend === 'Bullish') return 'text-bullish';
    if (trend === 'Bearish') return 'text-bearish';
    return 'text-muted-foreground';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'High') return 'bg-bullish/20 text-bullish';
    if (confidence === 'Medium') return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Market Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trend === 'Bullish' ? (
              <TrendingUp className="h-5 w-5 text-bullish" />
            ) : trend === 'Bearish' ? (
              <TrendingDown className="h-5 w-5 text-bearish" />
            ) : (
              <Target className="h-5 w-5" />
            )}
            Market Trend
          </CardTitle>
          <CardDescription>Technical analysis based trend direction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Direction</span>
              <span className={`font-semibold ${getTrendColor()}`}>{trend}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Strength</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${trend === 'Bullish' ? 'bg-bullish' : trend === 'Bearish' ? 'bg-bearish' : 'bg-muted-foreground'}`}
                    style={{ width: `${Math.min(strength * 1.5, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{strength.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Option Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Option Chain Recommendations</CardTitle>
          <CardDescription>Best strikes based on technical analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-lg border ${
                rec.type === 'CE' 
                  ? 'bg-bullish/5 border-bullish/20' 
                  : 'bg-bearish/5 border-bearish/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={rec.type === 'CE' ? 'default' : 'destructive'}
                    className={rec.type === 'CE' ? 'bg-bullish hover:bg-bullish/90' : 'bg-bearish hover:bg-bearish/90'}
                  >
                    {rec.type}
                  </Badge>
                  <span className="font-semibold">${rec.strike.toLocaleString()}</span>
                </div>
                <Badge variant="outline" className={getConfidenceColor(rec.confidence)}>
                  {rec.confidence}
                </Badge>
              </div>
              
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Probability</span>
                  <span className="font-semibold">{rec.probability.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={rec.type === 'CE' ? 'bg-bullish h-full' : 'bg-bearish h-full'}
                    style={{ width: `${rec.probability}%` }}
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
              
              {idx === 0 && (
                <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20">
                  ⭐ Best Pick
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stop Loss & Target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Risk Management
          </CardTitle>
          <CardDescription>Recommended stop loss and target levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-bearish/5 border border-bearish/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Stop Loss</span>
              <span className="text-lg font-bold text-bearish">
                ${stopLoss.stopLoss.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Risk: ${Math.abs(currentPrice - stopLoss.stopLoss).toFixed(2)} 
              ({((Math.abs(currentPrice - stopLoss.stopLoss) / currentPrice) * 100).toFixed(2)}%)
            </div>
          </div>

          <div className="p-3 bg-bullish/5 border border-bullish/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Target</span>
              <span className="text-lg font-bold text-bullish">
                ${stopLoss.target.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Reward: ${Math.abs(stopLoss.target - currentPrice).toFixed(2)}
              ({((Math.abs(stopLoss.target - currentPrice) / currentPrice) * 100).toFixed(2)}%)
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Risk:Reward Ratio</span>
            <span className="font-semibold">1:{stopLoss.riskRewardRatio}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">ATR (Volatility)</span>
            <span className="font-semibold">${stopLoss.atr.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

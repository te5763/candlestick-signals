import { Pattern } from '@/utils/patternDetection';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PatternSignalsProps {
  patterns: Pattern[];
}

export const PatternSignals = ({ patterns }: PatternSignalsProps) => {
  // Get last 5 patterns
  const recentPatterns = patterns.slice(-5).reverse();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Detected Patterns</h3>
        <Badge variant="secondary">{patterns.length} Total</Badge>
      </div>

      {recentPatterns.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No patterns detected yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentPatterns.map((pattern, index) => (
            <div
              key={`${pattern.time}-${index}`}
              className="p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {pattern.signal === 'bullish' ? (
                    <TrendingUp className="h-5 w-5 text-bullish" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-bearish" />
                  )}
                  <span className="font-semibold">{pattern.type}</span>
                </div>
                <Badge
                  variant={pattern.signal === 'bullish' ? 'default' : 'destructive'}
                  className={
                    pattern.signal === 'bullish'
                      ? 'bg-bullish hover:bg-bullish/80'
                      : 'bg-bearish hover:bg-bearish/80'
                  }
                >
                  {pattern.signal === 'bullish' ? 'BUY' : 'SELL'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {pattern.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Price: ${pattern.price.toFixed(2)}</span>
                <span>{new Date(pattern.time * 1000).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

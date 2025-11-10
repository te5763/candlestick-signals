import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TickerSearchProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

const popularSymbols = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
];

export const TickerSearch = ({ onSearch, isLoading }: TickerSearchProps) => {
  const [symbol, setSymbol] = useState('BTCUSDT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.toUpperCase());
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Enter ticker symbol (e.g., AAPL, TSLA, GOOGL, BTCUSDT)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Search'}
        </Button>
      </form>

      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Popular:</span>
        {popularSymbols.map((item) => (
          <button
            key={item.symbol}
            onClick={() => {
              setSymbol(item.symbol);
              onSearch(item.symbol);
            }}
            className="text-sm px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            disabled={isLoading}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

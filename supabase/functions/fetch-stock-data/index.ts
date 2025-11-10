import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    const apiKey = Deno.env.get('FINNHUB_API_KEY');

    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    // Get current timestamp and calculate timestamps for last 5 days
    const now = Math.floor(Date.now() / 1000);
    const fiveDaysAgo = now - (5 * 24 * 60 * 60);

    // Fetch candle data from Finnhub (15-minute resolution)
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=15&from=${fiveDaysAgo}&to=${now}&token=${apiKey}`;
    
    console.log(`Fetching from Finnhub: ${url.replace(apiKey, 'HIDDEN')}`);
    
    const response = await fetch(url);
    const data = await response.json();

    console.log(`Finnhub response status: ${data.s}`);

    if (data.s === 'no_data' || !data.t || data.t.length === 0) {
      console.log('No data available from Finnhub');
      return new Response(
        JSON.stringify({ error: 'No data available for this symbol' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform Finnhub data to our Candle format
    const candles: Candle[] = data.t.map((timestamp: number, index: number) => ({
      time: timestamp * 1000, // Convert to milliseconds
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index],
    }));

    console.log(`Successfully fetched ${candles.length} candles`);

    return new Response(
      JSON.stringify({ candles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-stock-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

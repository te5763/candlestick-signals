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

    // Get current timestamp and calculate timestamps for last 30 days to ensure data
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    // Fetch candle data from Finnhub (D = daily resolution for more reliable data)
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${thirtyDaysAgo}&to=${now}&token=${apiKey}`;
    
    console.log(`Fetching from Finnhub: ${url.replace(apiKey, 'HIDDEN')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`Finnhub API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`Finnhub response:`, JSON.stringify(data).substring(0, 200));

    if (data.s === 'no_data' || !data.t || data.t.length === 0) {
      console.log('No data available from Finnhub for this symbol');
      throw new Error('No data available for this symbol');
    }
    
    if (data.s === 'error') {
      console.error('Finnhub returned error:', data);
      throw new Error(data.msg || 'Finnhub API error');
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

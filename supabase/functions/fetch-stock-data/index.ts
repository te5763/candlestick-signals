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
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    // Fetch intraday data from Alpha Vantage (15min interval)
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=15min&outputsize=full&apikey=${apiKey}`;
    
    console.log(`Fetching from Alpha Vantage: ${url.replace(apiKey, 'HIDDEN')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`Alpha Vantage API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`Alpha Vantage response keys:`, Object.keys(data));

    // Check for API errors and information messages
    if (data['Information']) {
      console.error('Alpha Vantage information:', data['Information']);
      throw new Error(`Alpha Vantage: ${data['Information']}`);
    }

    if (data['Error Message']) {
      console.error('Alpha Vantage error:', data['Error Message']);
      throw new Error(data['Error Message']);
    }

    if (data['Note']) {
      console.error('Alpha Vantage rate limit:', data['Note']);
      throw new Error('API rate limit reached. Please try again later.');
    }

    // Get the time series data
    const timeSeriesKey = 'Time Series (15min)';
    const timeSeries = data[timeSeriesKey];

    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      console.log('No data available from Alpha Vantage for this symbol');
      throw new Error('No data available for this symbol');
    }

    // Transform Alpha Vantage data to our Candle format
    const candles: Candle[] = Object.entries(timeSeries)
      .map(([timestamp, values]: [string, any]) => ({
        time: new Date(timestamp).getTime(),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }))
      .sort((a, b) => a.time - b.time); // Sort by time ascending

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

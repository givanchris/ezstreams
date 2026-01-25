import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      console.error("TMDB_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "TMDB API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint parameter" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build TMDB URL with all query params except 'endpoint'
    const tmdbUrl = new URL(`${TMDB_BASE_URL}${endpoint}`);
    tmdbUrl.searchParams.set('api_key', apiKey);
    
    // Forward other query params
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        tmdbUrl.searchParams.set(key, value);
      }
    });

    console.log(`Proxying request to: ${endpoint}`);

    const response = await fetch(tmdbUrl.toString());
    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error in tmdb-proxy:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to fetch from TMDB", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
    
    if (!apiKey || apiKey.trim() === '') {
      console.error(
        "TMDB_API_KEY is missing or empty. Set the TMDB_API_KEY secret (v3 API key or v4 access token)."
      );
      return new Response(
        JSON.stringify({ error: "TMDB_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const endpointRaw = url.searchParams.get('endpoint');
    
    if (!endpointRaw || endpointRaw.trim() === '') {
      return new Response(
        JSON.stringify({
          error: "Missing endpoint parameter",
          example: "/tmdb-proxy?endpoint=/search/movie&query=Dune",
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize endpoint to prevent double `/3` and ensure it starts with `/`
    let endpoint = endpointRaw.trim();
    // If someone passes a full TMDB URL, extract the path/query part.
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      try {
        const u = new URL(endpoint);
        endpoint = u.pathname + (u.search ?? '');
      } catch {
        // keep as-is if not a valid URL
      }
    }
    if (endpoint.startsWith('/3')) {
      endpoint = endpoint.replace(/^\/3/, '');
    }
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }

    // Build TMDB URL
    const tmdbUrl = new URL(`${TMDB_BASE_URL}${endpoint}`);
    
    // Forward other query params (except 'endpoint')
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        tmdbUrl.searchParams.set(key, value);
      }
    });

    // Determine auth method: v4 Access Token (JWT-like) vs v3 API Key
    const isJwtLike = apiKey.startsWith('eyJ') || (apiKey.match(/\./g)?.length ?? 0) === 2;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isJwtLike) {
      // v4 Access Token: use Bearer auth header
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log(`Proxying request to: ${endpoint} (using v4 Bearer token)`);
    } else {
      // v3 API Key: add as query parameter
      tmdbUrl.searchParams.set('api_key', apiKey);
      console.log(`Proxying request to: ${endpoint} (using v3 API key)`);
    }

    const response = await fetch(tmdbUrl.toString(), { headers });
    const data = await response.json();

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}`, data);
    }

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

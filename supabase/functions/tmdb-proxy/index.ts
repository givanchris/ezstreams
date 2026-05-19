import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Input validation constants
const MAX_QUERY_LENGTH = 200;
const ENDPOINT_PATTERN = /^\/[a-z0-9\/_-]+$/i;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    let userId = 'anonymous';

    if (token === anonKey) {
      // Anon key — allow public/unauthenticated access
      console.log('Anonymous request via anon key');
    } else {
      // Verify as a user JWT
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        anonKey,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

      if (claimsError || !claimsData?.claims) {
        console.error("JWT verification failed:", claimsError?.message);
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid token" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = claimsData.claims.sub;
      console.log(`Authenticated request from user: ${userId}`);
    }

    // === API KEY CHECK ===
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

    // === INPUT VALIDATION ===
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

    // Validate endpoint format to prevent injection
    if (!ENDPOINT_PATTERN.test(endpoint)) {
      console.error(`Invalid endpoint format: ${endpoint}`);
      return new Response(
        JSON.stringify({ error: "Invalid endpoint format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate query parameter length
    const queryParam = url.searchParams.get('query');
    if (queryParam && queryParam.length > MAX_QUERY_LENGTH) {
      console.error(`Query too long: ${queryParam.length} characters`);
      return new Response(
        JSON.stringify({ error: `Query too long, maximum ${MAX_QUERY_LENGTH} characters allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.log(`Proxying request to: ${endpoint} (using v4 Bearer token) for user: ${userId}`);
    } else {
      // v3 API Key: add as query parameter
      tmdbUrl.searchParams.set('api_key', apiKey);
      console.log(`Proxying request to: ${endpoint} (using v3 API key) for user: ${userId}`);
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
    // Return generic error message to client (don't expose internal details)
    return new Response(
      JSON.stringify({ error: "Failed to fetch from TMDB" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

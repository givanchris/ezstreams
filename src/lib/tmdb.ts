import { supabase } from "@/integrations/supabase/client";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
}

export interface TMDBTvShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
}

export interface TMDBSearchResponse<T = TMDBMovie> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderData {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface WatchProvidersResponse {
  id: number;
  results: Record<string, WatchProviderData>;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const getImageUrl = (path: string | null, size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500") => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// Input validation constants
const MAX_QUERY_LENGTH = 200;
const MIN_QUERY_LENGTH = 2;

// Simple in-memory cache for session
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(endpoint: string, params: Record<string, string>): string {
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${endpoint}:${JSON.stringify(sortedParams)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}, useCache = true): Promise<T> {
  const cacheKey = getCacheKey(endpoint, params);
  
  if (useCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      console.log('[TMDB Cache] Hit:', cacheKey);
      return cached;
    }
  }
  
  const searchParams = new URLSearchParams({ endpoint, ...params });

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  
  // Get the current user's session token for authenticated requests
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Authentication required. Please log in to browse content.');
  }
  
  const response = await fetch(
    `${projectUrl}/functions/v1/tmdb-proxy?${searchParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `TMDB request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (useCache) {
    setCache(cacheKey, data);
  }
  
  return data;
}

export async function searchMovies(query: string, page = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
  // Client-side validation
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
    throw new Error(`Search query must be at least ${MIN_QUERY_LENGTH} characters`);
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new Error(`Search query too long, maximum ${MAX_QUERY_LENGTH} characters`);
  }
  
  return tmdbFetch<TMDBSearchResponse<TMDBMovie>>('/search/movie', { 
    query: trimmed, 
    page: page.toString(),
    include_adult: 'false'
  });
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  // Validate movie ID is a positive integer
  if (!Number.isInteger(movieId) || movieId <= 0) {
    throw new Error('Invalid movie ID');
  }
  return tmdbFetch<TMDBMovie>(`/movie/${movieId}`);
}

export async function getWatchProviders(movieId: number): Promise<WatchProvidersResponse> {
  // Validate movie ID is a positive integer
  if (!Number.isInteger(movieId) || movieId <= 0) {
    throw new Error('Invalid movie ID');
  }
  return tmdbFetch<WatchProvidersResponse>(`/movie/${movieId}/watch/providers`);
}

// TV Show specific functions
export async function getTvDetails(tvId: number): Promise<TMDBTvShow> {
  if (!Number.isInteger(tvId) || tvId <= 0) {
    throw new Error('Invalid TV show ID');
  }
  return tmdbFetch<TMDBTvShow>(`/tv/${tvId}`);
}

export async function getTvWatchProviders(tvId: number): Promise<WatchProvidersResponse> {
  if (!Number.isInteger(tvId) || tvId <= 0) {
    throw new Error('Invalid TV show ID');
  }
  return tmdbFetch<WatchProvidersResponse>(`/tv/${tvId}/watch/providers`);
}

// Generic fetch for trending/popular/top_rated
export async function fetchMediaList<T>(
  endpoint: string, 
  page = 1
): Promise<TMDBSearchResponse<T>> {
  return tmdbFetch<TMDBSearchResponse<T>>(endpoint, { 
    page: page.toString() 
  });
}

// Provider URL mapping for deep links / search fallbacks
const providerSearchUrls: Record<string, (title: string, year?: string) => string> = {
  'Netflix': (title, year) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  'Hulu': (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
  'Amazon Prime Video': (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
  'Prime Video': (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
  'Disney Plus': (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
  'Max': (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}`,
  'HBO Max': (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}`,
  'Apple TV': (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  'Apple TV Plus': (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  'Paramount Plus': (title) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}`,
  'Paramount+': (title) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}`,
  'Peacock': (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`,
  'Peacock Premium': (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`,
};

export function getProviderUrl(providerName: string, movieTitle: string, year?: string): string {
  // Normalize provider name for matching
  const normalizedName = providerName.trim();
  
  // Check exact match first
  if (providerSearchUrls[normalizedName]) {
    return providerSearchUrls[normalizedName](movieTitle, year);
  }
  
  // Check partial matches
  for (const [key, urlFn] of Object.entries(providerSearchUrls)) {
    if (normalizedName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(normalizedName.toLowerCase())) {
      return urlFn(movieTitle, year);
    }
  }
  
  // Fallback to Google search
  const yearSuffix = year ? ` ${year}` : '';
  return `https://www.google.com/search?q=${encodeURIComponent(`${movieTitle}${yearSuffix} watch ${providerName}`)}`;
}

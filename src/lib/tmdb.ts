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
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
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

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ endpoint, ...params });

  // NOTE: We call the function with query params; all calls MUST include `endpoint`.
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const response = await fetch(
    `${projectUrl}/functions/v1/tmdb-proxy?${searchParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `TMDB request failed: ${response.status}`);
  }

  return response.json();
}

export async function searchMovies(query: string, page = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/search/movie', { 
    query, 
    page: page.toString(),
    include_adult: 'false'
  });
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  return tmdbFetch<TMDBMovie>(`/movie/${movieId}`);
}

export async function getWatchProviders(movieId: number): Promise<WatchProvidersResponse> {
  return tmdbFetch<WatchProvidersResponse>(`/movie/${movieId}/watch/providers`);
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

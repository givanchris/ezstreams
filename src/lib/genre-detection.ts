import { tmdbFetch } from '@/lib/tmdb';

interface TMDBGenre {
  id: number;
  name: string;
}

interface GenreListResponse {
  genres: TMDBGenre[];
}

// Aliases that map common terms to official TMDB genre names
const GENRE_ALIASES: Record<string, string[]> = {
  'sci-fi': ['Science Fiction'],
  'scifi': ['Science Fiction'],
  'romcom': ['Romance', 'Comedy'],
  'rom-com': ['Romance', 'Comedy'],
  'animated': ['Animation'],
  'cartoon': ['Animation'],
  'scary': ['Horror'],
  'suspense': ['Thriller'],
  'war': ['War'],
  'kids': ['Animation', 'Family'],
  'family': ['Family'],
  'superhero': ['Action'],
  'crime': ['Crime'],
};

let genreCache: { movie: Map<string, number>; tv: Map<string, number> } | null = null;

export async function loadGenres(): Promise<{ movie: Map<string, number>; tv: Map<string, number> }> {
  if (genreCache) return genreCache;

  try {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdbFetch<GenreListResponse>('/genre/movie/list'),
      tmdbFetch<GenreListResponse>('/genre/tv/list'),
    ]);

    const movieMap = new Map<string, number>();
    const tvMap = new Map<string, number>();

    for (const g of movieGenres.genres) {
      movieMap.set(g.name.toLowerCase(), g.id);
    }
    for (const g of tvGenres.genres) {
      tvMap.set(g.name.toLowerCase(), g.id);
    }

    genreCache = { movie: movieMap, tv: tvMap };
    return genreCache;
  } catch (err) {
    console.error('Failed to load genres:', err);
    return { movie: new Map(), tv: new Map() };
  }
}

export interface GenreMatch {
  genreNames: string[];
  movieGenreIds: number[];
  tvGenreIds: number[];
}

/**
 * Detects if a search query matches a genre.
 * Strips trailing "movies", "shows", "series", "tv" before matching.
 * Returns null if no genre detected.
 */
export function detectGenre(
  query: string,
  movieMap: Map<string, number>,
  tvMap: Map<string, number>,
): GenreMatch | null {
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(/\s+(movies?|shows?|series|tv)$/i, '')
    .trim();

  if (!cleaned) return null;

  // Check aliases first
  const aliasEntry = GENRE_ALIASES[cleaned];
  if (aliasEntry) {
    const movieIds: number[] = [];
    const tvIds: number[] = [];
    for (const name of aliasEntry) {
      const lower = name.toLowerCase();
      const mid = movieMap.get(lower);
      const tid = tvMap.get(lower);
      if (mid) movieIds.push(mid);
      if (tid) tvIds.push(tid);
    }
    if (movieIds.length > 0 || tvIds.length > 0) {
      return { genreNames: aliasEntry, movieGenreIds: movieIds, tvGenreIds: tvIds };
    }
  }

  // Check exact genre name match
  const movieId = movieMap.get(cleaned);
  const tvId = tvMap.get(cleaned);

  if (movieId || tvId) {
    // Find the display name (capitalized)
    const displayName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return {
      genreNames: [displayName],
      movieGenreIds: movieId ? [movieId] : [],
      tvGenreIds: tvId ? [tvId] : [],
    };
  }

  return null;
}

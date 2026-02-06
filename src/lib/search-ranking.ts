/**
 * Client-side search result ranking for TMDB results.
 * Boosts exact matches, popular titles, and applies TV-preference for exact matches.
 */

interface RankableResult {
  id: number;
  title?: string;
  name?: string;
  media_type?: 'movie' | 'tv';
  popularity?: number;
  vote_count?: number;
  vote_average?: number;
}

/**
 * Rank and sort search results with:
 * 1. Exact title match boost (case-insensitive)
 * 2. TV preference for exact matches
 * 3. Popularity + vote_count sorting
 * 4. De-prioritize very low vote_count results
 */
export function rankSearchResults<T extends RankableResult>(
  results: T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return [...results].sort((a, b) => {
    const titleA = (a.title || a.name || '').toLowerCase();
    const titleB = (b.title || b.name || '').toLowerCase();

    const exactA = titleA === normalizedQuery;
    const exactB = titleB === normalizedQuery;

    // 1. Exact matches first
    if (exactA && !exactB) return -1;
    if (!exactA && exactB) return 1;

    // 2. Among exact matches, prefer TV over movie
    if (exactA && exactB) {
      const tvA = a.media_type === 'tv';
      const tvB = b.media_type === 'tv';
      if (tvA && !tvB) return -1;
      if (!tvA && tvB) return 1;
    }

    // 3. De-prioritize very low vote_count (< 10)
    const lowA = (a.vote_count ?? 0) < 10;
    const lowB = (b.vote_count ?? 0) < 10;
    if (lowA && !lowB) return 1;
    if (!lowA && lowB) return -1;

    // 4. Sort by popularity descending, then vote_count descending
    const popDiff = (b.popularity ?? 0) - (a.popularity ?? 0);
    if (Math.abs(popDiff) > 1) return popDiff;

    return (b.vote_count ?? 0) - (a.vote_count ?? 0);
  });
}

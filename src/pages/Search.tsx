import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Loader2, X } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import { tmdbFetch, TMDBSearchResponse } from "@/lib/tmdb";
import { rankSearchResults } from "@/lib/search-ranking";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface MultiSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  media_type: 'movie' | 'tv' | 'person';
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<MultiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await tmdbFetch<TMDBSearchResponse<MultiSearchResult>>(
        '/search/multi',
        { query: searchQuery.trim(), page: '1', include_adult: 'false' }
      );
      const filtered = data.results.filter(
        (r): r is MultiSearchResult & { media_type: 'movie' | 'tv' } =>
          r.media_type === 'movie' || r.media_type === 'tv'
      );
      setResults(rankSearchResults(filtered, searchQuery.trim()) as MultiSearchResult[]);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to search");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync local query with URL
  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);

  // Auto-search when URL query changes
  useEffect(() => {
    if (urlQuery) {
      runSearch(urlQuery);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [urlQuery, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchParams({});
    setResults([]);
    setHasSearched(false);
  };

  // ESC to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Pinned search bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Go back (ESC)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies and TV shows..."
              className="pl-11 pr-10 py-5 bg-secondary/50 border-border text-base"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </form>
          {urlQuery && (
            <button
              onClick={handleClear}
              className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Error */}
          {error && !loading && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-destructive text-lg">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">Please try again.</p>
            </div>
          )}

          {/* Empty after search */}
          {hasSearched && !loading && !error && results.length === 0 && (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No results for "{urlQuery}"</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {/* Results grid */}
          {!loading && results.length > 0 && (
            <>
              <p className="text-muted-foreground mb-4 text-sm">
                {results.length} result{results.length !== 1 ? "s" : ""} for "{urlQuery}"
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((item) => (
                  <MediaCard
                    key={`${item.media_type}-${item.id}`}
                    id={item.id}
                    title={item.title || item.name || ''}
                    posterPath={item.poster_path}
                    voteAverage={item.vote_average}
                    releaseDate={item.release_date || item.first_air_date || ''}
                    overview={item.overview}
                    mediaType={item.media_type as 'movie' | 'tv'}
                  />
                ))}
              </div>
            </>
          )}

          {/* Initial state */}
          {!hasSearched && !loading && results.length === 0 && !error && (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Start typing to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;

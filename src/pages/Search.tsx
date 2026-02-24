import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Loader2, X, Film, Tv2 } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import { tmdbFetch, TMDBSearchResponse, getImageUrl } from "@/lib/tmdb";
import { rankSearchResults } from "@/lib/search-ranking";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [suggestions, setSuggestions] = useState<MultiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Full search (on Enter / URL change)
  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setShowSuggestions(false);

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

  // Live suggestions (debounced, with abort)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    setShowSuggestions(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || controller.signal.aborted) return;

        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        const params = new URLSearchParams({
          endpoint: '/search/multi',
          query: query.trim(),
          page: '1',
          include_adult: 'false',
        });

        const response = await fetch(
          `${projectUrl}/functions/v1/tmdb-proxy?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        if (controller.signal.aborted) return;

        const filtered = (data.results || []).filter(
          (item: MultiSearchResult) => item.media_type === 'movie' || item.media_type === 'tv'
        );
        const ranked = rankSearchResults(filtered, query.trim()).slice(0, 8);
        setSuggestions(ranked as MultiSearchResult[]);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Suggestion error:', err);
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      setSearchParams({ q: query.trim() });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchParams({});
    setResults([]);
    setSuggestions([]);
    setHasSearched(false);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (item: MultiSearchResult) => {
    const path = item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
    setShowSuggestions(false);
    navigate(path);
  };

  // ESC to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else {
          navigate(-1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, showSuggestions]);

  const getTitle = (r: MultiSearchResult) => r.title || r.name || '';
  const getYear = (r: MultiSearchResult) => {
    const d = r.release_date || r.first_air_date;
    return d ? new Date(d).getFullYear() : null;
  };

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
          <div className="flex-1 relative">
            <form onSubmit={handleSubmit}>
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                ref={inputRef}
                type="text"
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (query.trim().length >= 2 && suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search movies and TV shows..."
                className="pl-11 pr-10 py-5 bg-secondary/50 border-border text-base"
              />
              {(loading || suggestionsLoading) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && query.trim().length >= 2 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
              >
                {suggestionsLoading && suggestions.length === 0 && (
                  <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                  </div>
                )}
                {!suggestionsLoading && suggestions.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No results for "{query}"
                  </div>
                )}
                {suggestions.map((item) => {
                  const poster = getImageUrl(item.poster_path, 'w92');
                  const year = getYear(item);
                  const title = getTitle(item);
                  return (
                    <button
                      key={`${item.media_type}-${item.id}`}
                      className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                      onClick={() => handleSuggestionClick(item)}
                    >
                      {poster ? (
                        <img src={poster} alt={title} className="w-10 h-14 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-14 rounded bg-secondary flex items-center justify-center">
                          {item.media_type === 'movie' ? (
                            <Film className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Tv2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{title}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                          </Badge>
                        </div>
                        {year && <p className="text-sm text-muted-foreground">{year}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {(urlQuery || query) && (
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
          {error && !loading && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-destructive text-lg">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">Please try again.</p>
            </div>
          )}

          {hasSearched && !loading && !error && results.length === 0 && (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No results for "{urlQuery}"</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Try a different search term</p>
            </div>
          )}

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

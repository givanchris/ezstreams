import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Loader2, X, Film, Tv2, Tag, Sparkles } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import { tmdbFetch, TMDBSearchResponse, getImageUrl } from "@/lib/tmdb";
import { rankSearchResults } from "@/lib/search-ranking";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SearchFilterBar, { type SearchFilters, DEFAULT_FILTERS } from "@/components/SearchFilterBar";
import MoodChips, { type MoodPreset } from "@/components/MoodChips";
import VoiceSearchButton from "@/components/VoiceSearchButton";
import { supabase } from "@/integrations/supabase/client";
import { loadGenres, detectGenre, type GenreMatch } from "@/lib/genre-detection";
import { parseNaturalLanguageQuery, hasNLPFilters, type ParsedQuery } from "@/lib/nlp-query-parser";

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

  // Read state from URL
  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";
  const urlSort = searchParams.get("sort") || "";
  const urlStreamingOnly = searchParams.get("streamingOnly") === "1";
  const urlUnder2h = searchParams.get("under2h") === "1";

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<MultiSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<MultiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [top5Only, setTop5Only] = useState(false);
  const [genreMatch, setGenreMatch] = useState<GenreMatch | null>(null);
  const [nlpLabel, setNlpLabel] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<SearchFilters>({
    genre: urlGenre,
    sort: urlSort,
    streamingOnly: urlStreamingOnly,
    under2h: urlUnder2h,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync filters from URL on mount / URL change
  useEffect(() => {
    setFilters({
      genre: searchParams.get("genre") || "",
      sort: searchParams.get("sort") || "",
      streamingOnly: searchParams.get("streamingOnly") === "1",
      under2h: searchParams.get("under2h") === "1",
    });
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = useCallback(
    (q: string, f: SearchFilters) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (f.genre) params.set("genre", f.genre);
      if (f.sort) params.set("sort", f.sort);
      if (f.streamingOnly) params.set("streamingOnly", "1");
      if (f.under2h) params.set("under2h", "1");
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleFiltersChange = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      updateUrlParams(urlQuery, newFilters);
    },
    [urlQuery, updateUrlParams]
  );

  // Build discover params from filters
  const buildDiscoverParams = useCallback(
    (genreIds: string, sortBy?: string, pg = 1) => {
      const params: Record<string, string> = {
        page: String(pg),
        include_adult: "false",
        sort_by: sortBy || filters.sort || "popularity.desc",
      };
      if (genreIds) params.with_genres = genreIds;
      if (filters.streamingOnly) {
        params.with_watch_monetization_types = "flatrate";
        params.watch_region = "US";
      }
      if (filters.sort === "vote_average.desc") {
        params["vote_count.gte"] = "200";
      }
      return params;
    },
    [filters]
  );

  // Full search — append=true for "load more", false for new search
  const runSearch = useCallback(
    async (searchQuery: string, currentFilters: SearchFilters, pg = 1, append = false) => {
      const trimmed = searchQuery.trim();
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
        setTotalPages(1);
      }
      setError(null);
      setHasSearched(true);
      setShowSuggestions(false);
      if (!append) {
        setGenreMatch(null);
        setNlpLabel(null);
      }

      try {
        // Try NLP parsing first
        let effectiveFilters = { ...currentFilters };
        let effectiveQuery = trimmed;

        if (trimmed) {
          const parsed = parseNaturalLanguageQuery(trimmed);
          if (hasNLPFilters(parsed)) {
            setNlpLabel(parsed.label || null);
            effectiveQuery = parsed.textQuery;
            if (parsed.genre && !currentFilters.genre) {
              effectiveFilters.genre = parsed.genre;
            }
            if (parsed.maxRuntime && parsed.maxRuntime <= 120) {
              effectiveFilters.under2h = true;
            }
            if (parsed.sort && !currentFilters.sort) {
              effectiveFilters.sort = parsed.sort;
            }
          }
        }

        // Determine if this is a genre-based search
        let useGenreDiscover = false;
        let discoverGenreIds = "";
        let match: GenreMatch | null = null;

        // Filter bar genre takes priority
        if (effectiveFilters.genre) {
          useGenreDiscover = true;
          discoverGenreIds = effectiveFilters.genre;
        } else if (effectiveQuery) {
          // Try genre detection from query
          const genres = await loadGenres();
          match = detectGenre(effectiveQuery, genres.movie, genres.tv);
          if (match && (match.movieGenreIds.length > 0 || match.tvGenreIds.length > 0)) {
            useGenreDiscover = true;
            discoverGenreIds = [...match.movieGenreIds, ...match.tvGenreIds]
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(",");
            setGenreMatch(match);
          }
        }

        if (useGenreDiscover || (!effectiveQuery && (effectiveFilters.streamingOnly || effectiveFilters.sort))) {
          // Genre / discover mode
          const movieParams = buildDiscoverParams(discoverGenreIds, effectiveFilters.sort || undefined, pg);
          const tvParams = buildDiscoverParams(discoverGenreIds, movieParams.sort_by, pg);

          const [movieData, tvData] = await Promise.all([
            tmdbFetch<TMDBSearchResponse<MultiSearchResult>>("/discover/movie", movieParams).then(
              (d) => ({ ...d, results: d.results.map((r) => ({ ...r, media_type: "movie" as const })) })
            ),
            tmdbFetch<TMDBSearchResponse<MultiSearchResult>>("/discover/tv", tvParams).then(
              (d) => ({ ...d, results: d.results.map((r) => ({ ...r, media_type: "tv" as const })) })
            ),
          ]);

          const combined = [...movieData.results, ...tvData.results];
          combined.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          setTotalPages(Math.min(movieData.total_pages, 500));
          setResults((prev) => (append ? [...prev, ...combined] : combined));
        } else if (effectiveQuery || trimmed) {
          // Normal title search
          const searchText = effectiveQuery || trimmed;
          const data = await tmdbFetch<TMDBSearchResponse<MultiSearchResult>>(
            "/search/multi",
            { query: searchText, page: String(pg), include_adult: "false" }
          );
          const filtered = data.results.filter(
            (r): r is MultiSearchResult & { media_type: "movie" | "tv" } =>
              r.media_type === "movie" || r.media_type === "tv"
          );
          const ranked = rankSearchResults(filtered, searchText) as MultiSearchResult[];
          setTotalPages(Math.min(data.total_pages, 500));
          setResults((prev) => (append ? [...prev, ...ranked] : ranked));
        } else {
          setResults([]);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search");
        if (!append) setResults([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildDiscoverParams]
  );

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
          endpoint: "/search/multi",
          query: query.trim(),
          page: "1",
          include_adult: "false",
        });

        const response = await fetch(
          `${projectUrl}/functions/v1/tmdb-proxy?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();
        if (controller.signal.aborted) return;

        const filtered = (data.results || []).filter(
          (item: MultiSearchResult) => item.media_type === "movie" || item.media_type === "tv"
        );
        const ranked = rankSearchResults(filtered, query.trim()).slice(0, 8);
        setSuggestions(ranked as MultiSearchResult[]);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Suggestion error:", err);
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
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Auto-search when URL query or filters change
  useEffect(() => {
    if (urlQuery || filters.genre || filters.streamingOnly || filters.sort) {
      runSearch(urlQuery, filters);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [urlQuery, filters, runSearch]);

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      updateUrlParams(query.trim(), filters);
    }
  };

  const handleClear = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
    setResults([]);
    setSuggestions([]);
    setHasSearched(false);
    setShowSuggestions(false);
    setGenreMatch(null);
    setNlpLabel(null);
    setPage(1);
    setTotalPages(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    runSearch(urlQuery, filters, nextPage, true);
  };

  const handleSuggestionClick = (item: MultiSearchResult) => {
    const path = item.media_type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
    setShowSuggestions(false);
    navigate(path);
  };

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      setQuery(transcript);
      updateUrlParams(transcript, filters);
    },
    [filters, updateUrlParams]
  );

  const handleMoodSelect = useCallback(
    (mood: MoodPreset) => {
      const newFilters: SearchFilters = {
        ...DEFAULT_FILTERS,
        genre: mood.genre || "",
        sort: mood.sort || "",
        under2h: mood.under2h || false,
      };
      setFilters(newFilters);
      updateUrlParams("", newFilters);
    },
    [updateUrlParams]
  );

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

  const getTitle = (r: MultiSearchResult) => r.title || r.name || "";
  const getYear = (r: MultiSearchResult) => {
    const d = r.release_date || r.first_air_date;
    return d ? new Date(d).getFullYear() : null;
  };

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    if (filters.under2h) {
      // Filter movies only (runtime not in search results, so filter by media_type as proxy — in discover mode TMDB handles it)
      // For now, keep all results but prefer movies with shorter estimated runtime
    }

    if (filters.sort === "vote_average.desc") {
      filtered.sort((a, b) => b.vote_average - a.vote_average);
    } else if (filters.sort === "primary_release_date.desc") {
      filtered.sort((a, b) => {
        const da = a.release_date || a.first_air_date || "";
        const db = b.release_date || b.first_air_date || "";
        return db.localeCompare(da);
      });
    }

    if (top5Only) {
      filtered.sort((a, b) => b.vote_average - a.vote_average);
      filtered = filtered.slice(0, 5);
    }

    return filtered;
  }, [results, filters, top5Only]);

  const showEmptyFiltersHint =
    hasSearched && !loading && filteredResults.length === 0 && results.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Pinned search bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
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
                    if (query.trim().length >= 2 && suggestions.length > 0)
                      setShowSuggestions(true);
                  }}
                  placeholder="Search movies, TV shows, or genres..."
                  className="pl-11 pr-20 py-5 bg-secondary/50 border-border text-base"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {(loading || suggestionsLoading) && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                  <VoiceSearchButton onResult={handleVoiceResult} />
                </div>
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
                    const poster = getImageUrl(item.poster_path, "w92");
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
                            {item.media_type === "movie" ? (
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
                              {item.media_type === "movie" ? "Movie" : "TV Series"}
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
            {(urlQuery || query || filters.genre || filters.sort || filters.streamingOnly || filters.under2h) && (
              <button
                onClick={handleClear}
                className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className="mt-2">
            <SearchFilterBar filters={filters} onChange={handleFiltersChange} />
          </div>
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

          {showEmptyFiltersHint && (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No results with these filters
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Try turning off "Streaming only" or adjusting the genre filter
              </p>
            </div>
          )}

          {hasSearched && !loading && !error && results.length === 0 && (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No results for "{urlQuery}"</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Try a different search term
              </p>
            </div>
          )}

          {!loading && filteredResults.length > 0 && (
            <>
              {(genreMatch || nlpLabel) && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {nlpLabel && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Results for: {nlpLabel}
                      </span>
                    </div>
                  )}
                  {genreMatch && !nlpLabel && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Genre results: {genreMatch.genreNames.join(" + ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <p className="text-muted-foreground text-sm">
                  {filteredResults.length} of {results.length} result
                  {results.length !== 1 ? "s" : ""}
                  {urlQuery ? ` for "${urlQuery}"` : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Switch id="top5" checked={top5Only} onCheckedChange={setTop5Only} />
                  <Label htmlFor="top5" className="text-sm text-muted-foreground cursor-pointer">
                    Show Top 5 Only
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredResults.map((item) => (
                  <MediaCard
                    key={`${item.media_type}-${item.id}`}
                    id={item.id}
                    title={item.title || item.name || ""}
                    posterPath={item.poster_path}
                    voteAverage={item.vote_average}
                    releaseDate={item.release_date || item.first_air_date || ""}
                    overview={item.overview}
                    mediaType={item.media_type as "movie" | "tv"}
                  />
                ))}
              </div>

              {/* Load More */}
              {!top5Only && page < totalPages && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/50 border border-border text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {loadingMore ? "Loading…" : `Load more results`}
                  </button>
                </div>
              )}
            </>
          )}

          {!hasSearched && !loading && results.length === 0 && !error && (
            <div className="space-y-8 py-8">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Find something to watch fast
                </h2>
                <p className="text-muted-foreground">Less scrolling, better picks.</p>
              </div>
              <div className="max-w-xl mx-auto">
                <MoodChips onSelect={handleMoodSelect} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;

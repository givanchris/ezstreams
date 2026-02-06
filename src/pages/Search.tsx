import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Loader2 } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import RecentlyViewedRow from "@/components/RecentlyViewedRow";
import { tmdbFetch, TMDBSearchResponse } from "@/lib/tmdb";
import { rankSearchResults } from "@/lib/search-ranking";

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MultiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await tmdbFetch<TMDBSearchResponse<MultiSearchResult>>(
        '/search/multi',
        { query: searchQuery.trim(), page: '1', include_adult: 'false' }
      );
      // Filter to movies and TV only, then rank
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
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Search <span className="text-gradient">Movies & TV</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Find movies and TV shows, see where to watch them
          </p>
        </div>

        <div className="animate-fade-up max-w-3xl mx-auto" style={{ animationDelay: "0.1s" }}>
          <div className="glass-card rounded-2xl p-4">
            <SearchAutocomplete 
              placeholder="Search movies and TV shows..."
              onSearch={handleSearch}
            />
          </div>
        </div>

        {/* Recently Viewed - show when no search */}
        {!hasSearched && !loading && (
          <div className="mt-12">
            <RecentlyViewedRow showClear={true} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-12 flex justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-12 animate-fade-up">
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-destructive text-lg">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">
                Please try again or check your connection.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !loading && !error && results.length === 0 && (
          <div className="mt-12 animate-fade-up">
            <div className="glass-card rounded-2xl p-12 text-center">
              <SearchIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No results found for "{query}"
              </p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Try a different search term
              </p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="mt-12 animate-fade-up">
            <p className="text-muted-foreground mb-6">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <div className="mt-12 animate-fade-up">
            <div className="glass-card rounded-2xl p-12 text-center">
              <SearchIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Start typing to search for movies and TV shows
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

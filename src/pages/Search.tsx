import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/MovieCard";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import RecentlyViewedRow from "@/components/RecentlyViewedRow";
import { searchMovies, TMDBMovie } from "@/lib/tmdb";
import { rankSearchResults } from "@/lib/search-ranking";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
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
      const data = await searchMovies(searchQuery.trim());
      setResults(rankSearchResults(data.results, searchQuery.trim()));
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to search movies");
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
            Search <span className="text-gradient">Movies</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Find movies and see where to watch them
          </p>
        </div>

        <div className="animate-fade-up max-w-3xl mx-auto" style={{ animationDelay: "0.1s" }}>
          <div className="glass-card rounded-2xl p-4">
            <SearchAutocomplete 
              placeholder="Search movies..."
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
                No movies found for "{query}"
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
              {results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
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
                Start typing to search for movies
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Search = () => {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
      console.log("Searching for:", query);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Search <span className="text-gradient">Everything</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Find movies and shows across all your streaming platforms
          </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="glass-card rounded-2xl p-2 flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search content…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 bg-transparent border-none text-lg placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="px-8">
              Search
            </Button>
          </div>
        </form>

        {hasSearched && (
          <div className="mt-12 animate-fade-up">
            <div className="glass-card rounded-2xl p-12 text-center">
              <SearchIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Results will appear here
              </p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Searched for: "{query}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

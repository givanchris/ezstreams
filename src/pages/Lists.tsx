import { Link } from "react-router-dom";
import { Heart, Search, ArrowRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const Lists = () => {
  return (
    <div className="min-h-screen px-6 py-24">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-gradient">My Lists</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Save movies and series to watch later
          </p>
        </div>

        {/* Empty state */}
        <div className="glass-card rounded-2xl p-12 text-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
            No saved titles yet
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            You'll be able to save movies and series here. Build your watchlist by browsing our catalog or searching for specific titles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button variant="hero" size="lg" asChild>
              <Link to="/search">
                <Search className="w-5 h-5 mr-2" />
                Browse & add titles
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature preview cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Favorites</h3>
            <p className="text-sm text-muted-foreground">
              Mark your all-time favorite movies and shows
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Watchlist</h3>
            <p className="text-sm text-muted-foreground">
              Queue up titles you want to watch next
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Smart Filters</h3>
            <p className="text-sm text-muted-foreground">
              Filter by platform, genre, or availability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lists;

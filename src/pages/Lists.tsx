import { Link } from "react-router-dom";
import { Heart, Search, ArrowRight, Bookmark, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediaCard from "@/components/MediaCard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/contexts/AuthContext";

const Lists = () => {
  const { user } = useAuth();
  const { items, loading, removeFromWatchlist } = useWatchlist();

  const handleRemove = async (mediaId: string, mediaType: 'movie' | 'tv') => {
    await removeFromWatchlist(parseInt(mediaId), mediaType);
  };

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
            {user ? 'Your saved movies and series' : 'Sign in to save movies and series'}
          </p>
        </div>

        {!user ? (
          // Not logged in state
          <div className="glass-card rounded-2xl p-12 text-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              Sign in to get started
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a free account to save your favorite movies and TV shows to your personal watchlist.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/login">
                Sign In
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        ) : loading ? (
          // Loading state
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          // Empty state
          <div className="glass-card rounded-2xl p-12 text-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              No saved titles yet
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Start building your watchlist by browsing movies and series, then click "Add to My List" on any title.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Button variant="hero" size="lg" asChild>
                <Link to="/movies">
                  Browse Movies
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/series">
                  Browse Series
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // Watchlist grid
          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-muted-foreground mb-6">
              {items.length} title{items.length !== 1 ? 's' : ''} in your list
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group relative">
                  <MediaCard
                    id={parseInt(item.media_id)}
                    title={item.title}
                    posterPath={item.poster_path}
                    voteAverage={0}
                    releaseDate=""
                    overview=""
                    mediaType={item.media_type}
                  />
                  <button
                    onClick={() => handleRemove(item.media_id, item.media_type)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    title="Remove from list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature preview cards - only show when empty or not logged in */}
        {(!user || items.length === 0) && (
          <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Easy Access</h3>
              <p className="text-sm text-muted-foreground">
                Quickly find your saved titles all in one place
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
              <h3 className="font-semibold text-foreground mb-2">Where to Watch</h3>
              <p className="text-sm text-muted-foreground">
                See streaming availability for all your saved titles
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lists;

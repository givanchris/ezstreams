import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, Star, Clock, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TMDBMovie, TMDBTvShow, getImageUrl } from "@/lib/tmdb";
import { normalizeProviderName } from "@/lib/provider-normalization";

type MediaItem = TMDBMovie | TMDBTvShow;

interface DecisionModeProps {
  movies: MediaItem[];
  tvShows: MediaItem[];
}

interface PickResult {
  item: MediaItem;
  mediaType: "movie" | "tv";
}

const SUBSCRIPTION_PROVIDERS = [
  "netflix", "disney+", "disney plus", "hulu", "max", "hbo max",
  "prime video", "amazon prime video", "apple tv+", "apple tv plus",
  "peacock", "paramount+", "paramount plus", "starz", "showtime", "amc+",
];

function isSubscriptionProvider(name: string): boolean {
  return SUBSCRIPTION_PROVIDERS.some(
    (p) => normalizeProviderName(name).toLowerCase().includes(p)
  );
}

function shuffleAndPick(items: PickResult[], count: number): PickResult[] {
  // Filter to rating >= 7
  const quality = items.filter((r) => r.item.vote_average >= 7);
  const pool = quality.length >= count ? quality : items;
  
  // Shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const DecisionMode = ({ movies, tvShows }: DecisionModeProps) => {
  const [picks, setPicks] = useState<PickResult[] | null>(null);

  const allItems = useMemo(() => {
    const movieItems: PickResult[] = movies.map((m) => ({ item: m, mediaType: "movie" as const }));
    const tvItems: PickResult[] = tvShows.map((t) => ({ item: t, mediaType: "tv" as const }));
    return [...movieItems, ...tvItems];
  }, [movies, tvShows]);

  const handlePick = () => {
    const selected = shuffleAndPick(allItems, 4);
    setPicks(selected);
  };

  const getTitle = (r: PickResult) =>
    r.mediaType === "movie" ? (r.item as TMDBMovie).title : (r.item as TMDBTvShow).name;

  const getYear = (r: PickResult) => {
    const d = r.mediaType === "movie"
      ? (r.item as TMDBMovie).release_date
      : (r.item as TMDBTvShow).first_air_date;
    return d ? new Date(d).getFullYear() : null;
  };

  const getLinkPath = (r: PickResult) =>
    r.mediaType === "movie" ? `/movie/${r.item.id}` : `/tv/${r.item.id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Decide in 60 Seconds
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Skip the endless scrolling — let us pick for you
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Button onClick={handlePick} variant="hero" size="lg" disabled={allItems.length === 0}>
          <Zap className="w-5 h-5" />
          Pick For Me
        </Button>
        {picks && (
          <Button onClick={() => setPicks(null)} variant="ghost" size="sm">
            Clear
          </Button>
        )}
      </div>

      {picks && picks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {picks.map((pick) => {
            const title = getTitle(pick);
            const year = getYear(pick);
            const poster = getImageUrl(pick.item.poster_path, "w342");
            const rating = pick.item.vote_average > 0 ? pick.item.vote_average.toFixed(1) : null;

            return (
              <Link
                key={`${pick.mediaType}-${pick.item.id}`}
                to={getLinkPath(pick)}
                className="glass-card rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform"
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  {poster ? (
                    <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-secondary/50 flex items-center justify-center text-muted-foreground">
                      No Poster
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="streaming-badge text-xs">
                      {pick.mediaType === "movie" ? "Movie" : "TV"}
                    </span>
                  </div>
                  {rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 streaming-badge text-xs">
                      <Star className="w-3 h-3 text-primary" fill="currentColor" />
                      <span className="text-foreground font-medium">{rating}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-display font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {year && <p className="text-xs text-muted-foreground">{year}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {picks && picks.length === 0 && (
        <p className="text-muted-foreground text-sm">No titles available. Try again later.</p>
      )}
    </div>
  );
};

export default DecisionMode;

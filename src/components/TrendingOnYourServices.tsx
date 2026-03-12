import { useRef, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MediaCard from "@/components/MediaCard";
import HoverPreview from "@/components/HoverPreview";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMediaList,
  getWatchProviders,
  getTvWatchProviders,
  TMDBMovie,
  TMDBTvShow,
  TMDBSearchResponse,
  WatchProvider,
  getImageUrl,
} from "@/lib/tmdb";
import { normalizeProviderName } from "@/lib/provider-normalization";

// Maps subscription IDs → TMDB provider IDs
const SUB_ID_TO_TMDB: Record<string, number> = {
  netflix: 8,
  disney_plus: 337,
  prime_video: 9,
  max: 1899,
  hulu: 15,
  apple_tv: 350,
  paramount_plus: 531,
  peacock: 386,
};

const SUB_ID_TO_NAME: Record<string, string> = {
  netflix: "Netflix",
  disney_plus: "Disney+",
  prime_video: "Prime Video",
  max: "Max",
  hulu: "Hulu",
  apple_tv: "Apple TV+",
  paramount_plus: "Paramount+",
  peacock: "Peacock",
};

type MediaItem = TMDBMovie | TMDBTvShow;

interface FilteredItem {
  item: MediaItem;
  mediaType: "movie" | "tv";
  providers: { name: string; logo: string }[];
}

const TrendingOnYourServices = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filteredItems, setFilteredItems] = useState<FilteredItem[]>([]);
  const [filtering, setFiltering] = useState(false);

  const getUserServiceIds = useCallback((): string[] => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`ezstream_subs_${user.id}`);
    if (!saved) return [];
    try {
      return JSON.parse(saved) as string[];
    } catch {
      return [];
    }
  }, [user?.id]);

  const userServiceIds = getUserServiceIds();
  const hasServices = userServiceIds.length > 0;

  // Fetch trending movies and TV
  const { data: trendingMovies, isLoading: loadingMovies } = useQuery({
    queryKey: ["trending-movies-services"],
    queryFn: () => fetchMediaList<TMDBMovie>("/trending/movie/week", 1),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingTv, isLoading: loadingTv } = useQuery({
    queryKey: ["trending-tv-services"],
    queryFn: () => fetchMediaList<TMDBTvShow>("/trending/tv/week", 1),
    staleTime: 5 * 60 * 1000,
  });

  // Filter by user's services
  useEffect(() => {
    if (!hasServices) {
      // Show all trending with no provider badges
      const movies = (trendingMovies?.results || []).slice(0, 10).map((m) => ({
        item: m as MediaItem,
        mediaType: "movie" as const,
        providers: [],
      }));
      const tvs = (trendingTv?.results || []).slice(0, 10).map((t) => ({
        item: t as MediaItem,
        mediaType: "tv" as const,
        providers: [],
      }));
      const combined = [...movies, ...tvs].sort(
        (a, b) => (b.item.popularity || 0) - (a.item.popularity || 0)
      );
      setFilteredItems(combined.slice(0, 15));
      return;
    }

    const userTmdbIds = new Set(userServiceIds.map((id) => SUB_ID_TO_TMDB[id]).filter(Boolean));

    let cancelled = false;
    setFiltering(true);

    async function filterItems() {
      const allItems: { item: MediaItem; mediaType: "movie" | "tv" }[] = [
        ...(trendingMovies?.results || []).slice(0, 15).map((m) => ({ item: m as MediaItem, mediaType: "movie" as const })),
        ...(trendingTv?.results || []).slice(0, 15).map((t) => ({ item: t as MediaItem, mediaType: "tv" as const })),
      ];

      const results: FilteredItem[] = [];

      // Process in batches
      for (let i = 0; i < allItems.length; i += 5) {
        if (cancelled) return;
        const batch = allItems.slice(i, i + 5);
        const providerResults = await Promise.allSettled(
          batch.map(({ item, mediaType }) =>
            mediaType === "movie"
              ? getWatchProviders(item.id)
              : getTvWatchProviders(item.id)
          )
        );

        for (let j = 0; j < batch.length; j++) {
          const res = providerResults[j];
          if (res.status !== "fulfilled") continue;
          const flatrate: WatchProvider[] = res.value.results?.US?.flatrate || [];
          const matchingProviders = flatrate.filter((p) => userTmdbIds.has(p.provider_id));
          if (matchingProviders.length > 0) {
            results.push({
              ...batch[j],
              providers: matchingProviders.slice(0, 3).map((p) => ({
                name: normalizeProviderName(p.provider_name),
                logo: getImageUrl(p.logo_path, "w92") || "",
              })),
            });
          }
        }
      }

      if (!cancelled) {
        results.sort((a, b) => (b.item.popularity || 0) - (a.item.popularity || 0));
        setFilteredItems(results.slice(0, 15));
        setFiltering(false);
      }
    }

    if (trendingMovies && trendingTv) {
      filterItems();
    }

    return () => {
      cancelled = true;
    };
  }, [trendingMovies, trendingTv, hasServices, userServiceIds.join(",")]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amt = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: direction === "left" ? -amt : amt, behavior: "smooth" });
    }
  };

  const isLoading = loadingMovies || loadingTv || filtering;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 md:w-44">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!filteredItems.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
            {hasServices ? "Trending On Your Services" : "Trending Now"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => scroll("left")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => scroll("right")}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filteredItems.map(({ item, mediaType, providers }) => {
          const isMovie = "title" in item;
          return (
            <div key={`${mediaType}-${item.id}`} className="flex-shrink-0 w-36 md:w-44">
              <HoverPreview id={item.id} mediaType={mediaType}>
                <div className="relative">
                  <MediaCard
                    id={item.id}
                    title={isMovie ? (item as TMDBMovie).title : (item as TMDBTvShow).name}
                    posterPath={item.poster_path}
                    voteAverage={item.vote_average}
                    releaseDate={isMovie ? (item as TMDBMovie).release_date : (item as TMDBTvShow).first_air_date}
                    overview={item.overview}
                    mediaType={mediaType}
                  />
                  {/* Provider badges */}
                  {providers.length > 0 && (
                    <div className="absolute bottom-[4.5rem] left-2 flex gap-1">
                      {providers.map((p) => (
                        <img
                          key={p.name}
                          src={p.logo}
                          alt={p.name}
                          title={p.name}
                          className="w-6 h-6 rounded shadow-md"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </HoverPreview>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingOnYourServices;

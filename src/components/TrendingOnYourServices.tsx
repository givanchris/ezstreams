import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MediaCard from "@/components/MediaCard";
import HoverPreview from "@/components/HoverPreview";
import { useAuth } from "@/contexts/AuthContext";
import {
  tmdbFetch,
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

type MediaItem = TMDBMovie | TMDBTvShow;
type ProviderBadge = { name: string; logo: string };

const TrendingOnYourServices = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [providerBadges, setProviderBadges] = useState<Record<string, ProviderBadge[]>>({});

  const getUserTmdbIds = useCallback((): number[] => {
    if (!user?.id) return [];
    const saved = localStorage.getItem(`ezstream_subs_${user.id}`);
    if (!saved) return [];
    try { return JSON.parse(saved) as number[]; } catch { return []; }
  }, [user?.id]);

  const userTmdbIds = getUserTmdbIds();
  const hasServices = userTmdbIds.length > 0;
  const watchProvidersParam = userTmdbIds.join("|");

  // ── No services: show generic trending (2 calls, already cached by home page) ──
  const { data: trendingMovies, isLoading: loadingTM } = useQuery({
    queryKey: ["trending-movies-home"],
    queryFn: () => fetchMediaList<TMDBMovie>("/trending/movie/week", 1),
    staleTime: 10 * 60 * 1000,
    enabled: !hasServices,
  });

  const { data: trendingTv, isLoading: loadingTT } = useQuery({
    queryKey: ["trending-tv-home"],
    queryFn: () => fetchMediaList<TMDBTvShow>("/trending/tv/week", 1),
    staleTime: 10 * 60 * 1000,
    enabled: !hasServices,
  });

  // ── Has services: use discover endpoint pre-filtered by provider (2 calls total) ──
  const { data: discoverMovies, isLoading: loadingDM } = useQuery({
    queryKey: ["discover-movies-services", watchProvidersParam],
    queryFn: () =>
      tmdbFetch<TMDBSearchResponse<TMDBMovie>>("/discover/movie", {
        with_watch_providers: watchProvidersParam,
        watch_region: "US",
        sort_by: "popularity.desc",
        page: "1",
      }),
    staleTime: 10 * 60 * 1000,
    enabled: hasServices,
  });

  const { data: discoverTv, isLoading: loadingDT } = useQuery({
    queryKey: ["discover-tv-services", watchProvidersParam],
    queryFn: () =>
      tmdbFetch<TMDBSearchResponse<TMDBTvShow>>("/discover/tv", {
        with_watch_providers: watchProvidersParam,
        watch_region: "US",
        sort_by: "popularity.desc",
        page: "1",
      }),
    staleTime: 10 * 60 * 1000,
    enabled: hasServices,
  });

  const isLoading = hasServices ? loadingDM || loadingDT : loadingTM || loadingTT;

  // Merge and sort by popularity
  const displayItems = useMemo<{ item: MediaItem; mediaType: "movie" | "tv" }[]>(() => {
    if (hasServices) {
      const movies = (discoverMovies?.results || []).slice(0, 15).map((m) => ({
        item: m as MediaItem,
        mediaType: "movie" as const,
      }));
      const tvs = (discoverTv?.results || []).slice(0, 15).map((t) => ({
        item: t as MediaItem,
        mediaType: "tv" as const,
      }));
      return [...movies, ...tvs]
        .sort((a, b) => (b.item.popularity || 0) - (a.item.popularity || 0))
        .slice(0, 15);
    }
    const movies = (trendingMovies?.results || []).slice(0, 10).map((m) => ({
      item: m as MediaItem,
      mediaType: "movie" as const,
    }));
    const tvs = (trendingTv?.results || []).slice(0, 10).map((t) => ({
      item: t as MediaItem,
      mediaType: "tv" as const,
    }));
    return [...movies, ...tvs]
      .sort((a, b) => (b.item.popularity || 0) - (a.item.popularity || 0))
      .slice(0, 15);
  }, [hasServices, discoverMovies, discoverTv, trendingMovies, trendingTv]);

  // Fetch provider badges for the top 10 displayed items only (max 2 batch calls)
  useEffect(() => {
    if (!hasServices || displayItems.length === 0) {
      setProviderBadges({});
      return;
    }

    const userIdSet = new Set(userTmdbIds);
    let cancelled = false;

    async function loadBadges() {
      const top10 = displayItems.slice(0, 10);
      const badges: Record<string, ProviderBadge[]> = {};

      for (let i = 0; i < top10.length; i += 5) {
        if (cancelled) return;
        const batch = top10.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map(({ item, mediaType }) =>
            mediaType === "movie" ? getWatchProviders(item.id) : getTvWatchProviders(item.id)
          )
        );
        for (let j = 0; j < batch.length; j++) {
          const res = results[j];
          if (res.status !== "fulfilled") continue;
          const flatrate: WatchProvider[] = res.value.results?.US?.flatrate || [];
          const matching = flatrate.filter((p) => userIdSet.has(p.provider_id));
          const key = `${batch[j].mediaType}-${batch[j].item.id}`;
          badges[key] = matching.slice(0, 3).map((p) => ({
            name: normalizeProviderName(p.provider_name),
            logo: getImageUrl(p.logo_path, "w92") || "",
          }));
        }
      }

      if (!cancelled) setProviderBadges(badges);
    }

    loadBadges();
    return () => { cancelled = true; };
  }, [displayItems, hasServices, userTmdbIds.join(",")]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amt = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amt : amt, behavior: "smooth" });
    }
  };

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

  if (!displayItems.length) return null;

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
        {displayItems.map(({ item, mediaType }) => {
          const isMovie = "title" in item;
          const key = `${mediaType}-${item.id}`;
          const badges = providerBadges[key] || [];
          return (
            <div key={key} className="flex-shrink-0 w-36 md:w-44">
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
                  {badges.length > 0 && (
                    <div className="absolute bottom-[4.5rem] left-2 flex gap-1">
                      {badges.map((p) => (
                        <img key={p.name} src={p.logo} alt={p.name} title={p.name} className="w-6 h-6 rounded shadow-md" />
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

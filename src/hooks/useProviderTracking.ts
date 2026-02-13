import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tmdbFetch, WatchProvidersResponse } from "@/lib/tmdb";
import { useAuth } from "@/contexts/AuthContext";

interface ProviderStats {
  totalTitles: number;
  providerCounts: Record<string, number>;
  loading: boolean;
}

// localStorage cache for provider lookups (24h TTL)
const PROVIDER_CACHE_KEY = "ezstream_provider_cache";
const PROVIDER_CACHE_TTL = 24 * 60 * 60 * 1000;

interface CachedProviders {
  providers: string[];
  timestamp: number;
}

function getProviderCacheKey(mediaType: string, tmdbId: number, region: string): string {
  return `${mediaType}:${tmdbId}:${region}`;
}

function getCachedProviders(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, CachedProviders> = JSON.parse(raw);
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > PROVIDER_CACHE_TTL) {
      delete cache[key];
      localStorage.setItem(PROVIDER_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.providers;
  } catch {
    return null;
  }
}

function setCachedProviders(key: string, providers: string[]): void {
  try {
    const raw = localStorage.getItem(PROVIDER_CACHE_KEY);
    const cache: Record<string, CachedProviders> = raw ? JSON.parse(raw) : {};
    cache[key] = { providers, timestamp: Date.now() };
    localStorage.setItem(PROVIDER_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

// Concurrency limiter
let pending = false;
const queue: (() => void)[] = [];

function processQueue() {
  if (pending || queue.length === 0) return;
  pending = true;
  const next = queue.shift()!;
  next();
}

/**
 * Hook to track a title selection and update provider coverage stats.
 * Call `trackTitle` when a detail page loads with valid data.
 */
export function useProviderTracking(region: string = "US") {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProviderStats>({
    totalTitles: 0,
    providerCounts: {},
    loading: true,
  });

  // Load current stats for this region
  const loadStats = useCallback(async () => {
    if (!user) {
      setStats({ totalTitles: 0, providerCounts: {}, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_provider_stats")
        .select("total_titles, provider_counts")
        .eq("user_id", user.id)
        .eq("region", region)
        .maybeSingle();

      if (error) throw error;

      setStats({
        totalTitles: data?.total_titles ?? 0,
        providerCounts: (data?.provider_counts as Record<string, number>) ?? {},
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load provider stats:", err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, [user, region]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const trackTitle = useCallback(
    async (params: {
      mediaType: "movie" | "tv";
      tmdbId: number;
      title: string;
      posterPath: string | null;
    }) => {
      if (!user) return;

      const { mediaType, tmdbId, title, posterPath } = params;

      const doWork = async () => {
        try {
          // 1. Try to upsert into history. If conflict, it's not new.
          const { data: upsertData, error: upsertError } = await supabase
            .from("user_title_history")
            .upsert(
              {
                user_id: user.id,
                media_type: mediaType,
                tmdb_id: tmdbId,
                title,
                poster_path: posterPath,
                region,
                selected_at: new Date().toISOString(),
              },
              { onConflict: "user_id,media_type,tmdb_id,region", ignoreDuplicates: false }
            )
            .select("id, flatrate_providers")
            .single();

          if (upsertError) {
            console.error("Upsert title history error:", upsertError);
            return;
          }

          // If flatrate_providers already populated, this title was already counted
          const existingProviders = upsertData?.flatrate_providers;
          if (
            existingProviders &&
            Array.isArray(existingProviders) &&
            existingProviders.length > 0
          ) {
            // Already tracked, skip stats update
            return;
          }

          // Also check if it's a "0 providers" case that was already processed
          // We use a special marker: if flatrate_providers is an empty array AND
          // we already have a record, don't recount. We'll use null vs [] to distinguish.
          if (existingProviders !== null && Array.isArray(existingProviders)) {
            return; // Already processed (empty array = no flatrate providers found)
          }

          // 2. Fetch flatrate providers from TMDB
          const cacheKey = getProviderCacheKey(mediaType, tmdbId, region);
          let flatrateNames = getCachedProviders(cacheKey);

          if (flatrateNames === null) {
            try {
              const endpoint =
                mediaType === "movie"
                  ? `/movie/${tmdbId}/watch/providers`
                  : `/tv/${tmdbId}/watch/providers`;

              const providerData = await tmdbFetch<WatchProvidersResponse>(endpoint);
              const regionData = providerData.results?.[region];
              const flatrateProviders = regionData?.flatrate || [];
              flatrateNames = flatrateProviders.map((p) => p.provider_name);
              setCachedProviders(cacheKey, flatrateNames);
            } catch (err) {
              console.error("Failed to fetch providers for tracking:", err);
              flatrateNames = [];
              setCachedProviders(cacheKey, flatrateNames);
            }
          }

          // 3. Update the history record with provider data
          await supabase
            .from("user_title_history")
            .update({ flatrate_providers: flatrateNames })
            .eq("id", upsertData.id);

          // 4. Update aggregated stats
          // Read current stats
          const { data: currentStats } = await supabase
            .from("user_provider_stats")
            .select("total_titles, provider_counts")
            .eq("user_id", user.id)
            .eq("region", region)
            .maybeSingle();

          const prevTotal = currentStats?.total_titles ?? 0;
          const prevCounts =
            (currentStats?.provider_counts as Record<string, number>) ?? {};

          const newTotal = prevTotal + 1;
          const newCounts = { ...prevCounts };
          for (const name of flatrateNames) {
            newCounts[name] = (newCounts[name] ?? 0) + 1;
          }

          await supabase.from("user_provider_stats").upsert(
            {
              user_id: user.id,
              region,
              total_titles: newTotal,
              provider_counts: newCounts,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,region" }
          );

          // 5. Update local state optimistically
          setStats({
            totalTitles: newTotal,
            providerCounts: newCounts,
            loading: false,
          });
        } catch (err) {
          console.error("Provider tracking error:", err);
        } finally {
          pending = false;
          processQueue();
        }
      };

      // Enqueue to limit concurrency
      queue.push(doWork);
      processQueue();
    },
    [user, region]
  );

  const resetStats = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from("user_title_history")
        .delete()
        .eq("user_id", user.id)
        .eq("region", region);

      await supabase
        .from("user_provider_stats")
        .delete()
        .eq("user_id", user.id)
        .eq("region", region);

      // Clear localStorage cache for this region
      try {
        const raw = localStorage.getItem(PROVIDER_CACHE_KEY);
        if (raw) {
          const cache: Record<string, CachedProviders> = JSON.parse(raw);
          const keysToDelete = Object.keys(cache).filter((k) =>
            k.endsWith(`:${region}`)
          );
          for (const key of keysToDelete) delete cache[key];
          localStorage.setItem(PROVIDER_CACHE_KEY, JSON.stringify(cache));
        }
      } catch {
        // ignore
      }

      setStats({ totalTitles: 0, providerCounts: {}, loading: false });
    } catch (err) {
      console.error("Failed to reset stats:", err);
    }
  }, [user, region]);

  return { stats, trackTitle, resetStats, refreshStats: loadStats };
}

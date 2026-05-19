import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tmdbFetch, WatchProvidersResponse } from "@/lib/tmdb";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProviderStats {
  totalTitles: number;
  providerCounts: Record<string, number>;
  loading: boolean;
}

interface TrackResult {
  success: boolean;
  error?: string;
  message?: string;
}

// localStorage cache for provider lookups (24h TTL)
const PROVIDER_CACHE_KEY = "ezstream_provider_cache";
const PROVIDER_CACHE_TTL = 24 * 60 * 60 * 1000;

interface CachedProviders {
  providers: string[];
  timestamp: number;
}

function getCacheKey(mediaType: string, tmdbId: number, region: string): string {
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

// Simple concurrency limiter with timeout safety
let pending = false;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
const queue: (() => void)[] = [];

function setPending(value: boolean) {
  pending = value;
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  if (value) {
    // Safety: reset pending after 15s so a hung request never stalls the queue
    pendingTimeout = setTimeout(() => {
      pending = false;
      processQueue();
    }, 15_000);
  }
}

function processQueue() {
  if (pending || queue.length === 0) return;
  setPending(true);
  const next = queue.shift()!;
  next();
}

// Store last track result for debug mode
let lastTrackResult: TrackResult | null = null;
export function getLastTrackResult(): TrackResult | null {
  return lastTrackResult;
}

export function useProviderTracking(region: string = "US") {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProviderStats>({
    totalTitles: 0,
    providerCounts: {},
    loading: true,
  });

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
      toast({ title: "Error", description: "Failed to load analyzer data", variant: "destructive" });
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
    }): Promise<TrackResult> => {
      if (!user) {
        const result: TrackResult = { success: false, error: "User not logged in" };
        lastTrackResult = result;
        return result;
      }

      const { mediaType, tmdbId, title, posterPath } = params;

      return new Promise<TrackResult>((resolve) => {
        const doWork = async () => {
          try {
            // 1. Check if already tracked
            const { data: existing, error: checkErr } = await supabase
              .from("user_title_history")
              .select("id, flatrate_providers")
              .eq("user_id", user.id)
              .eq("media_type", mediaType)
              .eq("tmdb_id", tmdbId)
              .eq("region", region)
              .maybeSingle();

            if (checkErr) {
              console.error("Check existing title error:", checkErr);
              toast({ title: "Tracking Error", description: checkErr.message, variant: "destructive" });
              const result: TrackResult = { success: false, error: checkErr.message };
              lastTrackResult = result;
              resolve(result);
              return;
            }

            // If exists and already has providers data (not null), skip
            if (existing && existing.flatrate_providers !== null) {
              const result: TrackResult = { success: true, message: "Already tracked" };
              lastTrackResult = result;
              resolve(result);
              return;
            }

            // 2. Insert or get existing record
            let recordId: string;
            if (existing) {
              // Exists but flatrate_providers is null — needs processing
              recordId = existing.id;
            } else {
              // Insert new
              const { data: insertData, error: insertErr } = await supabase
                .from("user_title_history")
                .insert({
                  user_id: user.id,
                  media_type: mediaType,
                  tmdb_id: tmdbId,
                  title,
                  poster_path: posterPath,
                  region,
                  selected_at: new Date().toISOString(),
                })
                .select("id")
                .single();

              if (insertErr) {
                // Could be a race condition duplicate
                if (insertErr.code === "23505") {
                  const result: TrackResult = { success: true, message: "Already tracked (race)" };
                  lastTrackResult = result;
                  resolve(result);
                  return;
                }
                console.error("Insert title history error:", insertErr);
                toast({ title: "Tracking Error", description: insertErr.message, variant: "destructive" });
                const result: TrackResult = { success: false, error: insertErr.message };
                lastTrackResult = result;
                resolve(result);
                return;
              }
              recordId = insertData.id;
            }

            // 3. Fetch flatrate providers
            const cacheKey = getCacheKey(mediaType, tmdbId, region);
            let flatrateNames = getCachedProviders(cacheKey);

            if (flatrateNames === null) {
              try {
                const endpoint = mediaType === "movie"
                  ? `/movie/${tmdbId}/watch/providers`
                  : `/tv/${tmdbId}/watch/providers`;
                const providerData = await tmdbFetch<WatchProvidersResponse>(endpoint);
                const regionData = providerData.results?.[region];
                const flatrateProviders = regionData?.flatrate || [];
                flatrateNames = flatrateProviders.map((p) => p.provider_name);
                setCachedProviders(cacheKey, flatrateNames);
              } catch (err) {
                console.error("Failed to fetch providers:", err);
                flatrateNames = [];
                setCachedProviders(cacheKey, flatrateNames);
              }
            }

            // 4. Update history record with provider data
            const { error: updateErr } = await supabase
              .from("user_title_history")
              .update({ flatrate_providers: flatrateNames })
              .eq("id", recordId);

            if (updateErr) {
              console.error("Update flatrate_providers error:", updateErr);
            }

            // 5. Update aggregated stats
            const { data: currentStats } = await supabase
              .from("user_provider_stats")
              .select("total_titles, provider_counts")
              .eq("user_id", user.id)
              .eq("region", region)
              .maybeSingle();

            const prevTotal = currentStats?.total_titles ?? 0;
            const prevCounts = (currentStats?.provider_counts as Record<string, number>) ?? {};

            const newTotal = prevTotal + 1;
            const newCounts = { ...prevCounts };
            for (const name of flatrateNames) {
              newCounts[name] = (newCounts[name] ?? 0) + 1;
            }

            const { error: statsErr } = await supabase.from("user_provider_stats").upsert(
              {
                user_id: user.id,
                region,
                total_titles: newTotal,
                provider_counts: newCounts,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,region" }
            );

            if (statsErr) {
              console.error("Upsert provider stats error:", statsErr);
              toast({ title: "Stats Error", description: statsErr.message, variant: "destructive" });
              const result: TrackResult = { success: false, error: statsErr.message };
              lastTrackResult = result;
              resolve(result);
              return;
            }

            // 6. Update local state
            setStats({
              totalTitles: newTotal,
              providerCounts: newCounts,
              loading: false,
            });

            const result: TrackResult = { success: true, message: `Tracked: ${title}` };
            lastTrackResult = result;
            resolve(result);
          } catch (err) {
            console.error("Provider tracking error:", err);
            toast({ title: "Tracking Error", description: "Failed to track title", variant: "destructive" });
            const result: TrackResult = { success: false, error: (err as Error).message };
            lastTrackResult = result;
            resolve(result);
          } finally {
            setPending(false);
            processQueue();
          }
        };

        queue.push(doWork);
        processQueue();
      });
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
          const keysToDelete = Object.keys(cache).filter((k) => k.endsWith(`:${region}`));
          for (const key of keysToDelete) delete cache[key];
          localStorage.setItem(PROVIDER_CACHE_KEY, JSON.stringify(cache));
        }
      } catch {
        // ignore
      }

      setStats({ totalTitles: 0, providerCounts: {}, loading: false });
      toast({ title: "Reset Complete", description: "Analyzer data cleared for this region" });
    } catch (err) {
      console.error("Failed to reset stats:", err);
      toast({ title: "Error", description: "Failed to reset data", variant: "destructive" });
    }
  }, [user, region]);

  return { stats, trackTitle, resetStats, refreshStats: loadStats };
}

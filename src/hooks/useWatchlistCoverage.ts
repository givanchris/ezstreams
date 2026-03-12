import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WatchlistItem } from "@/hooks/useWatchlist";
import { getWatchProviders, getTvWatchProviders, WatchProvider } from "@/lib/tmdb";
import { normalizeProviderName } from "@/lib/provider-normalization";

// Maps subscription page provider IDs to TMDB normalized names
const PROVIDER_ID_TO_NAME: Record<string, string> = {
  netflix: "Netflix",
  disney_plus: "Disney+",
  prime_video: "Prime Video",
  max: "Max",
  hulu: "Hulu",
  apple_tv: "Apple TV+",
  paramount_plus: "Paramount+",
  peacock: "Peacock",
};

export interface CoverageResult {
  score: number; // 0-100
  coveredItems: { title: string; mediaId: string; providers: string[] }[];
  missingItems: { title: string; mediaId: string }[];
  bestServiceToAdd: { name: string; newScore: number; additionalTitles: number } | null;
  loading: boolean;
}

export function useWatchlistCoverage(items: WatchlistItem[], region = "US"): CoverageResult {
  const { user } = useAuth();
  const [result, setResult] = useState<CoverageResult>({
    score: 0,
    coveredItems: [],
    missingItems: [],
    bestServiceToAdd: null,
    loading: true,
  });

  const getUserServices = useCallback((): Set<string> => {
    if (!user?.id) return new Set();
    const saved = localStorage.getItem(`ezstream_subs_${user.id}`);
    if (!saved) return new Set();
    try {
      const ids: string[] = JSON.parse(saved);
      return new Set(ids.map((id) => PROVIDER_ID_TO_NAME[id]).filter(Boolean));
    } catch {
      return new Set();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!items.length) {
      setResult({ score: 0, coveredItems: [], missingItems: [], bestServiceToAdd: null, loading: false });
      return;
    }

    const userServices = getUserServices();
    if (!userServices.size) {
      setResult({
        score: 0,
        coveredItems: [],
        missingItems: items.map((i) => ({ title: i.title, mediaId: i.media_id })),
        bestServiceToAdd: null,
        loading: false,
      });
      return;
    }

    let cancelled = false;

    async function calculate() {
      const covered: CoverageResult["coveredItems"] = [];
      const missing: CoverageResult["missingItems"] = [];
      // Track which un-owned services cover missing titles
      const potentialServices: Record<string, Set<string>> = {};

      // Process in batches of 5 to avoid hammering the API
      for (let i = 0; i < items.length; i += 5) {
        if (cancelled) return;
        const batch = items.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map((item) => {
            const id = parseInt(item.media_id);
            return item.media_type === "movie"
              ? getWatchProviders(id)
              : getTvWatchProviders(id);
          })
        );

        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const res = results[j];
          if (res.status !== "fulfilled") {
            missing.push({ title: item.title, mediaId: item.media_id });
            continue;
          }

          const regionData = res.value.results?.[region];
          const flatrateProviders: WatchProvider[] = regionData?.flatrate || [];
          const normalizedNames = flatrateProviders.map((p) => normalizeProviderName(p.provider_name));

          const matchingServices = normalizedNames.filter((n) => userServices.has(n));

          if (matchingServices.length > 0) {
            covered.push({ title: item.title, mediaId: item.media_id, providers: matchingServices });
          } else {
            missing.push({ title: item.title, mediaId: item.media_id });
            // Track which services COULD cover this
            for (const name of normalizedNames) {
              if (!userServices.has(name)) {
                if (!potentialServices[name]) potentialServices[name] = new Set();
                potentialServices[name].add(item.media_id);
              }
            }
          }
        }
      }

      if (cancelled) return;

      const total = covered.length + missing.length;
      const score = total > 0 ? Math.round((covered.length / total) * 100) : 0;

      // Find best service to add
      let bestServiceToAdd: CoverageResult["bestServiceToAdd"] = null;
      let maxAdditional = 0;
      for (const [name, titleSet] of Object.entries(potentialServices)) {
        if (titleSet.size > maxAdditional) {
          maxAdditional = titleSet.size;
          const newCovered = covered.length + titleSet.size;
          bestServiceToAdd = {
            name,
            newScore: total > 0 ? Math.round((newCovered / total) * 100) : 0,
            additionalTitles: titleSet.size,
          };
        }
      }

      setResult({ score, coveredItems: covered, missingItems: missing, bestServiceToAdd, loading: false });
    }

    setResult((prev) => ({ ...prev, loading: true }));
    calculate();

    return () => {
      cancelled = true;
    };
  }, [items, region, getUserServices]);

  return result;
}

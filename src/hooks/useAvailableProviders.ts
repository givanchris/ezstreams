import { useQuery } from "@tanstack/react-query";
import { tmdbFetch, WatchProvider, getImageUrl } from "@/lib/tmdb";

interface ProvidersListResponse {
  results: WatchProvider[];
}

export interface AvailableProvider {
  id: number;
  name: string;
  logoUrl: string;
}

export function useAvailableProviders(region: string = "US") {
  return useQuery({
    queryKey: ["available-providers", region],
    queryFn: async () => {
      const [movieData, tvData] = await Promise.all([
        tmdbFetch<ProvidersListResponse>("/watch/providers/movie", { watch_region: region }),
        tmdbFetch<ProvidersListResponse>("/watch/providers/tv", { watch_region: region }),
      ]);

      const seen = new Set<number>();
      const merged: AvailableProvider[] = [];

      for (const p of [...movieData.results, ...tvData.results]) {
        if (!seen.has(p.provider_id)) {
          seen.add(p.provider_id);
          merged.push({
            id: p.provider_id,
            name: p.provider_name,
            logoUrl: getImageUrl(p.logo_path, "w92") ?? "",
          });
        }
      }

      return merged.sort((a, b) => {
        const ap = movieData.results.find((p) => p.provider_id === a.id)?.display_priority ?? 999;
        const bp = movieData.results.find((p) => p.provider_id === b.id)?.display_priority ?? 999;
        return ap - bp;
      });
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Calendar, ExternalLink } from "lucide-react";
import { getImageUrl, getWatchProviders, getTvWatchProviders, getMovieDetails, getTvDetails, TMDBMovie, TMDBTvShow, WatchProvider } from "@/lib/tmdb";
import { normalizeProviderName } from "@/lib/provider-normalization";

interface HoverPreviewProps {
  id: number;
  mediaType: "movie" | "tv";
  children: React.ReactNode;
}

interface PreviewData {
  title: string;
  year: string;
  rating: number;
  runtime?: number;
  overview: string;
  genres: string[];
  providers: { name: string; logo: string }[];
}

const HoverPreview = ({ id, mediaType, children }: HoverPreviewProps) => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"right" | "left">("right");

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(true);
      // Calculate position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition(rect.left > window.innerWidth / 2 ? "left" : "right");
      }
      if (!data && !loading) {
        fetchData();
      }
    }, 400);
  };

  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mediaType === "movie") {
        const [details, providerRes] = await Promise.all([
          getMovieDetails(id),
          getWatchProviders(id),
        ]);
        const flatrate: WatchProvider[] = providerRes.results?.US?.flatrate || [];
        setData({
          title: details.title,
          year: details.release_date ? new Date(details.release_date).getFullYear().toString() : "",
          rating: details.vote_average,
          runtime: details.runtime,
          overview: details.overview,
          genres: details.genres?.map((g) => g.name) || [],
          providers: flatrate.slice(0, 4).map((p) => ({
            name: normalizeProviderName(p.provider_name),
            logo: getImageUrl(p.logo_path, "w92") || "",
          })),
        });
      } else {
        const [details, providerRes] = await Promise.all([
          getTvDetails(id),
          getTvWatchProviders(id),
        ]);
        const flatrate: WatchProvider[] = providerRes.results?.US?.flatrate || [];
        setData({
          title: details.name,
          year: details.first_air_date ? new Date(details.first_air_date).getFullYear().toString() : "",
          rating: details.vote_average,
          overview: details.overview,
          genres: details.genres?.map((g) => g.name) || [],
          providers: flatrate.slice(0, 4).map((p) => ({
            name: normalizeProviderName(p.provider_name),
            logo: getImageUrl(p.logo_path, "w92") || "",
          })),
        });
      }
    } catch {
      // Silently fail - preview is optional
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div
          className={`absolute z-50 top-0 ${
            position === "right" ? "left-full ml-2" : "right-full mr-2"
          } w-72 hidden md:block`}
        >
          <div className="glass-card rounded-xl p-4 shadow-2xl border border-border/50 space-y-3 animate-fade-up">
            {loading || !data ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-secondary/50 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
                <div className="h-12 w-full bg-secondary/50 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div>
                  <h4 className="font-display font-semibold text-foreground text-sm leading-tight">
                    {data.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {data.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {data.year}
                      </span>
                    )}
                    {data.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(data.runtime / 60)}h {data.runtime % 60}m
                      </span>
                    )}
                    {data.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        {data.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {data.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.genres.slice(0, 3).map((g) => (
                      <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {data.overview && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {data.overview}
                  </p>
                )}

                {data.providers.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                      Stream on
                    </p>
                    <div className="flex items-center gap-1.5">
                      {data.providers.map((p) => (
                        <img
                          key={p.name}
                          src={p.logo}
                          alt={p.name}
                          title={p.name}
                          className="w-7 h-7 rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HoverPreview;

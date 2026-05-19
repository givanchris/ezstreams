import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Star, Calendar, ExternalLink, Tv2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProviderButton from "@/components/ProviderButton";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import WatchlistButton from "@/components/WatchlistButton";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProviderTracking } from "@/hooks/useProviderTracking";
import { useAuth } from "@/contexts/AuthContext";
import { getSortedProviders } from "@/lib/provider-utils";
import Footer from "@/components/Footer";
import ReviewSection from "@/components/ReviewSection";
import {
  getTvDetails,
  getTvWatchProviders,
  getImageUrl,
  TMDBTvShow,
  WatchProviderData
} from "@/lib/tmdb";
import { REGIONS } from "@/lib/regions";

const TvDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<TMDBTvShow | null>(null);
  const [providers, setProviders] = useState<Record<string, WatchProviderData>>({});
  const [region, setRegion] = useState("US");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addItem } = useRecentlyViewed();
  const { trackTitle } = useProviderTracking(region);
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [showData, providersData] = await Promise.all([
          getTvDetails(parseInt(id)),
          getTvWatchProviders(parseInt(id))
        ]);
        
        setShow(showData);
        setProviders(providersData.results || {});
      } catch (err) {
        console.error("Error fetching TV show details:", err);
        setError(err instanceof Error ? err.message : "Failed to load TV show details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Track recently viewed
  useEffect(() => {
    if (show) {
      addItem({
        id: show.id,
        mediaType: 'tv',
        title: show.name,
        posterPath: show.poster_path,
      });
    }
  }, [show, addItem]);

  // Track for provider coverage (dedupe by id+region per session)
  useEffect(() => {
    if (show) {
      const trackKey = `${show.id}:${region}`;
      if (!trackedRef.current.has(trackKey)) {
        trackedRef.current.add(trackKey);
        trackTitle({
          mediaType: 'tv',
          tmdbId: show.id,
          title: show.name,
          posterPath: show.poster_path,
        });
      }
    }
  }, [show, trackTitle, region]);

  const backdropUrl = show ? getImageUrl(show.backdrop_path, "original") : null;
  const posterUrl = show ? getImageUrl(show.poster_path, "w500") : null;
  const year = show?.first_air_date ? new Date(show.first_air_date).getFullYear().toString() : undefined;
  
  const regionProviders = providers[region];
  const hasProviders = regionProviders && (
    regionProviders.flatrate?.length || 
    regionProviders.rent?.length || 
    regionProviders.buy?.length
  );

  // Get sorted providers
  const sortedProviders = regionProviders ? getSortedProviders(
    regionProviders.flatrate,
    regionProviders.rent,
    regionProviders.buy
  ) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen px-6 py-12">
        <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link
            to="/series"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Series
          </Link>
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-destructive text-lg">{error || "TV show not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const seoTitle = `Where to Watch ${show.name}${year ? ` (${year})` : ""} (Streaming Guide) | EZstream`;
  const seoDesc = `Find where ${show.name} is streaming across Netflix, Prime Video, Hulu and more. Compare streaming options instantly with EZstream.`;
  const seoImage = getImageUrl(show.poster_path, "w500");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: show.name,
    image: seoImage || undefined,
    datePublished: show.first_air_date || undefined,
    genre: show.genres?.map((g) => g.name),
    description: show.overview,
    ...(show.number_of_seasons && { numberOfSeasons: show.number_of_seasons }),
    ...(show.number_of_episodes && { numberOfEpisodes: show.number_of_episodes }),
    ...(show.vote_average > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: show.vote_average.toFixed(1),
        bestRating: "10",
        ratingCount: show.vote_count,
      },
    }),
  };

  return (
    <div className="min-h-screen">
      <SEOHead title={seoTitle} description={seoDesc} canonicalPath={`/tv/${id}`} image={seoImage} jsonLd={jsonLd} />
      {/* Backdrop */}
      {backdropUrl && (
        <div className="absolute inset-0 h-[50vh] overflow-hidden">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>
      )}
      
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/series"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Series
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </div>

          {/* Show Info */}
          <div className="grid md:grid-cols-[300px,1fr] gap-8 mb-12">
            {/* Poster */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={show.name}
                  className="w-full aspect-[2/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center text-muted-foreground bg-secondary/50">
                  No Poster
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
                  {show.name}
                </h1>
                {show.tagline && (
                  <p className="text-muted-foreground text-lg italic">"{show.tagline}"</p>
                )}
                {user && (
                  <div className="mt-4">
                    <WatchlistButton
                      mediaId={show.id}
                      mediaType="tv"
                      title={show.name}
                      posterPath={show.poster_path}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {year && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{year}</span>
                  </div>
                )}
                {show.number_of_seasons && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="w-4 h-4" />
                    <span>{show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}</span>
                  </div>
                )}
                {show.number_of_episodes && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Tv2 className="w-4 h-4" />
                    <span>{show.number_of_episodes} Episodes</span>
                  </div>
                )}
                {show.vote_average > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-foreground font-medium">
                      {show.vote_average.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({show.vote_count.toLocaleString()} votes)
                    </span>
                  </div>
                )}
              </div>

              {show.status && (
                <div className="inline-block">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    show.status === 'Returning Series' 
                      ? 'bg-green-500/20 text-green-400' 
                      : show.status === 'Ended'
                      ? 'bg-gray-500/20 text-gray-400'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {show.status}
                  </span>
                </div>
              )}

              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {show.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {show.overview && (
                <p className="text-muted-foreground leading-relaxed">
                  {show.overview}
                </p>
              )}
            </div>
          </div>

          {/* Where to Watch */}
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Where to <span className="text-gradient">Watch</span>
              </h2>
              
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-border">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasProviders ? (
              <div className="space-y-6">
                {regionProviders?.link && (
                  <Button
                    variant="hero"
                    className="w-full sm:w-auto"
                    onClick={() => window.open(regionProviders.link, '_blank', 'noopener,noreferrer')}
                  >
                    View All Options
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                {/* Sorted providers list */}
                <div className="grid gap-2">
                  {sortedProviders.map(({ provider, category }) => (
                    <ProviderButton
                      key={provider.provider_id}
                      provider={provider}
                      category={category}
                      movieTitle={show.name}
                      movieYear={year}
                      tmdbLink={regionProviders?.link}
                    />
                  ))}
                </div>
                
                <p className="text-muted-foreground/70 text-sm text-center mt-4">
                  Availability varies by region. Data provided by JustWatch via TMDB.
                </p>
                <AffiliateDisclosure />
              </div>
            ) : (() => {
              const daysSinceAir = show.first_air_date
                ? (Date.now() - new Date(show.first_air_date).getTime()) / (1000 * 60 * 60 * 24)
                : null;
              const isVeryNew = daysSinceAir !== null && daysSinceAir >= 0 && daysSinceAir < 30;
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isVeryNew
                      ? "This series just aired and may not be available for streaming yet."
                      : `No streaming options found for ${REGIONS.find(r => r.code === region)?.name || region}.`}
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    {isVeryNew
                      ? "New episodes often become available on streaming within days to weeks of airing."
                      : "Try selecting a different region."}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Reviews */}
          {user && (
            <div className="mt-8">
              <ReviewSection tmdbId={parseInt(id!)} mediaType="tv" />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TvDetails;

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import MediaCard from "@/components/MediaCard";
import Footer from "@/components/Footer";
import { tmdbFetch, TMDBMovie, TMDBTvShow, TMDBSearchResponse, getImageUrl } from "@/lib/tmdb";

const GENRE_MAP: Record<string, { name: string; movieId: number; tvId: number }> = {
  comedy: { name: "Comedy", movieId: 35, tvId: 35 },
  horror: { name: "Horror", movieId: 27, tvId: 27 },
  action: { name: "Action", movieId: 28, tvId: 10759 },
  drama: { name: "Drama", movieId: 18, tvId: 18 },
  thriller: { name: "Thriller", movieId: 53, tvId: 53 },
  "sci-fi": { name: "Sci-Fi", movieId: 878, tvId: 10765 },
  romance: { name: "Romance", movieId: 10749, tvId: 10749 },
  animation: { name: "Animation", movieId: 16, tvId: 16 },
  documentary: { name: "Documentary", movieId: 99, tvId: 99 },
};

const GenrePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const genre = slug ? GENRE_MAP[slug] : null;
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [tvShows, setTvShows] = useState<TMDBTvShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!genre) return;
    setLoading(true);

    Promise.all([
      tmdbFetch<TMDBSearchResponse<TMDBMovie>>("/discover/movie", {
        with_genres: genre.movieId.toString(),
        sort_by: "popularity.desc",
        page: "1",
      }),
      tmdbFetch<TMDBSearchResponse<TMDBTvShow>>("/discover/tv", {
        with_genres: genre.tvId.toString(),
        sort_by: "popularity.desc",
        page: "1",
      }),
    ])
      .then(([movieRes, tvRes]) => {
        setMovies(movieRes.results.slice(0, 20));
        setTvShows(tvRes.results.slice(0, 20));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [genre?.movieId, genre?.tvId]);

  if (!genre) {
    return (
      <div className="min-h-screen px-6 py-24 text-center">
        <SEOHead
          title="Genre Not Found | EZstream"
          description="The requested genre page was not found on EZstream."
          canonicalPath={`/genre/${slug || ""}`}
        />
        <p className="text-muted-foreground text-lg">Genre not found.</p>
        <Link to="/" className="text-primary underline mt-4 inline-block">Go Home</Link>
      </div>
    );
  }

  const pageTitle = `Best ${genre.name} Movies & TV Shows to Stream | EZstream`;
  const pageDesc = `Discover the best ${genre.name} movies and TV shows streaming now. Find where to watch ${genre.name} titles across Netflix, Prime Video, Hulu and more on EZstream.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${genre.name} Movies & TV Shows`,
    description: pageDesc,
    url: `https://ezstreams.lovable.app/genre/${slug}`,
  };

  return (
    <div className="min-h-screen px-6 py-24">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/genre/${slug}`}
        jsonLd={jsonLd}
      />
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="max-w-7xl mx-auto relative z-10">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
          <span className="text-gradient">{genre.name}</span> Movies & TV Shows
        </h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          The most popular {genre.name.toLowerCase()} titles streaming right now.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Movies */}
            {movies.length > 0 && (
              <section className="mb-16">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  {genre.name} Movies
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movies.map((movie) => (
                    <Link key={movie.id} to={`/movie/${movie.id}`} className="group">
                      <div className="glass-card rounded-xl overflow-hidden transition-transform group-hover:scale-105">
                        {movie.poster_path ? (
                          <img
                            src={getImageUrl(movie.poster_path, "w342")!}
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] flex items-center justify-center bg-secondary/50 text-muted-foreground text-sm">
                            No Poster
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-medium text-foreground truncate">{movie.title}</p>
                          {movie.release_date && (
                            <p className="text-xs text-muted-foreground">{new Date(movie.release_date).getFullYear()}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* TV Shows */}
            {tvShows.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  {genre.name} TV Shows
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tvShows.map((show) => (
                    <Link key={show.id} to={`/tv/${show.id}`} className="group">
                      <div className="glass-card rounded-xl overflow-hidden transition-transform group-hover:scale-105">
                        {show.poster_path ? (
                          <img
                            src={getImageUrl(show.poster_path, "w342")!}
                            alt={show.name}
                            className="w-full aspect-[2/3] object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] flex items-center justify-center bg-secondary/50 text-muted-foreground text-sm">
                            No Poster
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-medium text-foreground truncate">{show.name}</p>
                          {show.first_air_date && (
                            <p className="text-xs text-muted-foreground">{new Date(show.first_air_date).getFullYear()}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default GenrePage;

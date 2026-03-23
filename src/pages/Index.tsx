import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import StreamingServiceCard from "@/components/StreamingServiceCard";

import SavingsAnalyzer from "@/components/SavingsAnalyzer";
import MediaRow from "@/components/MediaRow";
import TrendingOnYourServices from "@/components/TrendingOnYourServices";
import DecisionMode from "@/components/DecisionMode";
import Footer from "@/components/Footer";
import RecentlyViewedRow from "@/components/RecentlyViewedRow";
import { ArrowRight, Sparkles, Zap, Shield, PiggyBank } from "lucide-react";
import PopularLists from "@/components/PopularLists";
import MoodChips, { MoodPreset } from "@/components/MoodChips";
import SearchFilterBar, { SearchFilters, DEFAULT_FILTERS } from "@/components/SearchFilterBar";
import { Button } from "@/components/ui/button";
import { fetchMediaList, tmdbFetch, TMDBMovie, TMDBTvShow, TMDBSearchResponse } from "@/lib/tmdb";

const streamingServices = [
  { id: "netflix", name: "Netflix", logo: "N", color: "#E50914" },
  { id: "disney", name: "Disney+", logo: "D+", color: "#113CCF" },
  { id: "hbo", name: "HBO Max", logo: "HBO", color: "#5822B4" },
  { id: "prime", name: "Prime Video", logo: "P", color: "#00A8E1" },
  { id: "hulu", name: "Hulu", logo: "H", color: "#1CE783" },
  { id: "apple", name: "Apple TV+", logo: "🍎", color: "#555555" },
];

const featuredContent = [
  {
    title: "Dune: Part Two",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop",
    rating: 8.8,
    year: "2024",
    type: "movie" as const,
    streamingServices: ["HBO Max", "Prime Video"],
  },
  {
    title: "The Bear",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop",
    rating: 8.6,
    year: "2024",
    type: "series" as const,
    streamingServices: ["Hulu", "Disney+"],
  },
  {
    title: "Oppenheimer",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop",
    rating: 8.4,
    year: "2023",
    type: "movie" as const,
    streamingServices: ["Peacock", "Prime Video"],
  },
  {
    title: "Shogun",
    image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=600&fit=crop",
    rating: 9.0,
    year: "2024",
    type: "series" as const,
    streamingServices: ["Hulu", "Disney+"],
  },
  {
    title: "Poor Things",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop",
    rating: 8.3,
    year: "2023",
    type: "movie" as const,
    streamingServices: ["Hulu"],
  },
  {
    title: "Fallout",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop",
    rating: 8.5,
    year: "2024",
    type: "series" as const,
    streamingServices: ["Prime Video"],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [connectedServices, setConnectedServices] = useState<string[]>(["netflix", "disney", "hulu", "hbo", "prime", "apple"]);
  const [homeFilters, setHomeFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const toggleService = (serviceId: string) => {
    setConnectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const buildFilterParams = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.streamingOnly) params.set("streamingOnly", "1");
    if (filters.under2h) params.set("under2h", "1");
    return params;
  };

  const handleSearch = (query: string) => {
    const params = buildFilterParams(homeFilters);
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    if ([...params].length > 0) {
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleMoodSelect = (preset: MoodPreset) => {
    const params = new URLSearchParams();
    if (preset.genre) params.set("genre", preset.genre);
    if (preset.under2h) params.set("under2h", "1");
    if (preset.sort) params.set("sort", preset.sort);
    navigate(`/search?${params.toString()}`);
  };

  // Fetch trending movies
  const { data: trendingMovies, isLoading: loadingTrendingMovies } = useQuery({
    queryKey: ['trending-movies-home'],
    queryFn: () => fetchMediaList<TMDBMovie>('/trending/movie/week', 1),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trending TV
  const { data: trendingTv, isLoading: loadingTrendingTv } = useQuery({
    queryKey: ['trending-tv-home'],
    queryFn: () => fetchMediaList<TMDBTvShow>('/trending/tv/week', 1),
    staleTime: 5 * 60 * 1000,
  });

  // Genre discovery rows
  const { data: topComedies, isLoading: loadingComedies } = useQuery({
    queryKey: ['discover-comedy-home'],
    queryFn: () => tmdbFetch<TMDBSearchResponse<TMDBMovie>>('/discover/movie', {
      with_genres: '35',
      sort_by: 'popularity.desc',
      page: '1',
      include_adult: 'false',
    }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: topAction, isLoading: loadingAction } = useQuery({
    queryKey: ['discover-action-home'],
    queryFn: () => tmdbFetch<TMDBSearchResponse<TMDBMovie>>('/discover/movie', {
      with_genres: '28',
      sort_by: 'popularity.desc',
      page: '1',
      include_adult: 'false',
    }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: topDrama, isLoading: loadingDrama } = useQuery({
    queryKey: ['discover-drama-home'],
    queryFn: () => tmdbFetch<TMDBSearchResponse<TMDBMovie>>('/discover/movie', {
      with_genres: '18',
      sort_by: 'popularity.desc',
      page: '1',
      include_adult: 'false',
    }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
        <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-up">
            <div className="inline-flex items-center gap-2 mb-6 streaming-badge">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>All your streaming services in one place</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Find what to watch,
              <br />
              <span className="text-gradient">where to watch it</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Search across all your streaming platforms instantly. No more switching between apps to find your next favorite show.
            </p>

            <div className="max-w-3xl mx-auto">
              <SearchAutocomplete 
                placeholder="Search movies, TV shows, or genres..."
                onSearch={handleSearch}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {["Dune", "The Bear", "Shogun", "Fallout"].map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="max-w-3xl mx-auto mt-6 space-y-4">
              <MoodChips onSelect={handleMoodSelect} />
              <SearchFilterBar filters={homeFilters} onChange={setHomeFilters} />
            </div>
          </div>
        </div>
      </section>

      {/* Your Services Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                Your Streaming Services
              </h2>
              <p className="text-muted-foreground">
                Connect your subscriptions to see personalized results
              </p>
            </div>
            <Button variant="ghost" className="text-primary" asChild>
              <Link to="/subscriptions">Manage all <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {streamingServices.map((service, index) => (
              <div
                key={service.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <StreamingServiceCard
                  name={service.name}
                  logo={service.logo}
                  color={service.color}
                  connected={connectedServices.includes(service.id)}
                  onToggle={() => toggleService(service.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision Mode */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <DecisionMode
            movies={trendingMovies?.results || []}
            tvShows={trendingTv?.results || []}
          />
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <RecentlyViewedRow />
        </div>
      </section>

      {/* Trending On Your Services */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <TrendingOnYourServices />
        </div>
      </section>

      {/* Trending Movies */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title="Trending Movies" 
            items={(trendingMovies?.results || []).slice(0, 10)} 
            mediaType="movie"
            loading={loadingTrendingMovies}
            viewAllLink="/movies"
          />
        </div>
      </section>

      {/* Trending TV */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <MediaRow 
            title="Trending TV Shows" 
            items={(trendingTv?.results || []).slice(0, 10)} 
            mediaType="tv"
            loading={loadingTrendingTv}
            viewAllLink="/series"
          />
        </div>
      </section>

      {/* Genre Discovery Rows */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <MediaRow
            title="Top Comedies"
            items={(topComedies?.results || []).slice(0, 10)}
            mediaType="movie"
            loading={loadingComedies}
            viewAllLink="/search?genre=35"
          />
          <MediaRow
            title="Top Action"
            items={(topAction?.results || []).slice(0, 10)}
            mediaType="movie"
            loading={loadingAction}
            viewAllLink="/search?genre=28"
          />
          <MediaRow
            title="Top Drama"
            items={(topDrama?.results || []).slice(0, 10)}
            mediaType="movie"
            loading={loadingDrama}
            viewAllLink="/search?genre=18"
          />
        </div>
      </section>

      {/* Popular Lists */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <PopularLists />
        </div>
      </section>

      {/* Savings Analyzer Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 streaming-badge">
              <PiggyBank className="w-4 h-4 text-accent" />
              <span>Smart subscription optimization</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              Stop Wasting Money on Unused Subscriptions
            </h2>
            <p className="text-muted-foreground">
              Our algorithm analyzes your viewing habits to show you exactly which services deliver value
            </p>
          </div>

          <SavingsAnalyzer />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Why EZstream?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The ultimate streaming companion for cord-cutters everywhere
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Search",
                description: "Find any movie or show across all your platforms in seconds. No more app-hopping.",
              },
              {
                icon: PiggyBank,
                title: "Save Money",
                description: "Our smart analyzer identifies subscriptions you're not using so you can cut the waste.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "Your viewing data stays private. We never sell your information to third parties.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-8 text-center animate-fade-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="hero-glow -top-20 left-1/2 -translate-x-1/2 animate-pulse-glow" />
            
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Ready to simplify your streaming?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of users who've already streamlined their entertainment experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/signup">Get Started Free</Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link to="/search">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

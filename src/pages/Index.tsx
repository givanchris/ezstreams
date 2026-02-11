import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import StreamingServiceCard from "@/components/StreamingServiceCard";
import ContentCard from "@/components/ContentCard";
import SavingsAnalyzer from "@/components/SavingsAnalyzer";
import MediaRow from "@/components/MediaRow";
import Footer from "@/components/Footer";
import RecentlyViewedRow from "@/components/RecentlyViewedRow";
import { ArrowRight, Sparkles, Zap, Shield, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchMediaList, TMDBMovie, TMDBTvShow } from "@/lib/tmdb";

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

// Mock usage data for the savings analyzer
const platformUsageData = [
  { id: "netflix", name: "Netflix", logo: "N", color: "#E50914", monthlyPrice: 15.49, usagePercent: 45, showsWatched: 12, recommendation: "keep" as const },
  { id: "hulu", name: "Hulu", logo: "H", color: "#1CE783", monthlyPrice: 17.99, usagePercent: 72, showsWatched: 18, recommendation: "keep" as const },
  { id: "disney", name: "Disney+", logo: "D+", color: "#113CCF", monthlyPrice: 13.99, usagePercent: 28, showsWatched: 5, recommendation: "consider" as const },
  { id: "hbo", name: "HBO Max", logo: "HBO", color: "#5822B4", monthlyPrice: 15.99, usagePercent: 8, showsWatched: 2, recommendation: "cancel" as const },
  { id: "prime", name: "Prime Video", logo: "P", color: "#00A8E1", monthlyPrice: 8.99, usagePercent: 5, showsWatched: 1, recommendation: "cancel" as const },
  { id: "apple", name: "Apple TV+", logo: "🍎", color: "#555555", monthlyPrice: 9.99, usagePercent: 3, showsWatched: 0, recommendation: "cancel" as const },
];

const Index = () => {
  const navigate = useNavigate();
  const [connectedServices, setConnectedServices] = useState<string[]>(["netflix", "disney", "hulu", "hbo", "prime", "apple"]);

  const toggleService = (serviceId: string) => {
    setConnectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
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

  return (
    <div className="min-h-screen pt-20">

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
                placeholder="Search movies and TV shows..."
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
              <Link to="/profile">Manage all <ArrowRight className="w-4 h-4 ml-1" /></Link>
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

      {/* Recently Viewed */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <RecentlyViewedRow />
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

      {/* Featured Content */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                Available Now
              </h2>
              <p className="text-muted-foreground">
                Popular on your connected services
              </p>
            </div>
            <Button variant="ghost" className="text-primary" asChild>
              <Link to="/movies">View all <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {featuredContent.map((content, index) => (
              <div
                key={content.title}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ContentCard {...content} />
              </div>
            ))}
          </div>
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

          <SavingsAnalyzer platforms={platformUsageData.filter(p => connectedServices.includes(p.id))} />
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

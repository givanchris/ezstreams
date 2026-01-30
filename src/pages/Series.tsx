import { Link } from "react-router-dom";
import { Tv2, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Series = () => {
  return (
    <div className="min-h-screen px-6 py-24">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Tv2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-gradient">Series</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Browse TV shows across all your streaming platforms
          </p>
        </div>

        {/* Filter tabs (UI only) */}
        <div className="flex justify-center mb-12 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <Tabs defaultValue="trending" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Trending
              </TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Popular
              </TabsTrigger>
              <TabsTrigger value="top-rated" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Top Rated
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Coming soon message */}
        <div className="glass-card rounded-2xl p-12 text-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Tv2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
            This section is coming next
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            We're building out the series catalog with trending, popular, and top-rated TV shows. 
            In the meantime, you can search for any series directly.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/search">
              <Search className="w-5 h-5 mr-2" />
              Go to Search
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Series;

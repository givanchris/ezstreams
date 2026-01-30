import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Tv2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SeriesDetails = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          to="/series"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Series
        </Link>

        <div className="glass-card rounded-2xl p-12 text-center animate-fade-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Tv2 className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Series Details
          </h1>
          
          <p className="text-muted-foreground mb-2">
            Series ID: <span className="text-foreground font-mono">{id}</span>
          </p>
          
          <div className="glass-card rounded-xl p-6 mt-8 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Coming Soon</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Full series details including episodes, seasons, cast, and "Where to watch" information will be available here soon.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button variant="hero" asChild>
              <Link to="/search">Search for this series</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/series">Browse all series</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetails;

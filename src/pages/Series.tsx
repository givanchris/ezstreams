import { Tv2 } from "lucide-react";
import TabbedMediaGrid, { getDefaultTabs } from "@/components/TabbedMediaGrid";
import RecentlyViewedRow from "@/components/RecentlyViewedRow";

const Series = () => {
  const tabs = getDefaultTabs("tv");

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
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

        {/* Recently Viewed */}
        <div className="mb-12">
          <RecentlyViewedRow showClear={false} />
        </div>

        {/* Tabbed Grid */}
        <TabbedMediaGrid 
          mediaType="tv"
          tabs={tabs}
          title="Series"
          icon="tv"
        />
      </div>
    </div>
  );
};

export default Series;

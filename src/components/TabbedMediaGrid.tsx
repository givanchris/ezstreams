import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, AlertCircle, Film, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import MediaCard from "@/components/MediaCard";
import { fetchMediaList, TMDBMovie, TMDBTvShow, TMDBSearchResponse } from "@/lib/tmdb";

type MediaType = "movie" | "tv";

interface TabDefinition {
  value: string;
  label: string;
  endpoint: string;
}

interface TabbedMediaGridProps {
  mediaType: MediaType;
  tabs: TabDefinition[];
  title: string;
  icon: "movie" | "tv";
}

const DEFAULT_TABS_MOVIE: TabDefinition[] = [
  { value: "trending", label: "Trending", endpoint: "/trending/movie/week" },
  { value: "popular", label: "Popular", endpoint: "/movie/popular" },
  { value: "top-rated", label: "Top Rated", endpoint: "/movie/top_rated" },
];

const DEFAULT_TABS_TV: TabDefinition[] = [
  { value: "trending", label: "Trending", endpoint: "/trending/tv/week" },
  { value: "popular", label: "Popular", endpoint: "/tv/popular" },
  { value: "top-rated", label: "Top Rated", endpoint: "/tv/top_rated" },
];

export function getDefaultTabs(mediaType: MediaType): TabDefinition[] {
  return mediaType === "movie" ? DEFAULT_TABS_MOVIE : DEFAULT_TABS_TV;
}

const TabbedMediaGrid = ({ 
  mediaType, 
  tabs, 
  title,
  icon
}: TabbedMediaGridProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value || "trending");
  const [pages, setPages] = useState<Record<string, number>>({});

  const currentTab = tabs.find(t => t.value === activeTab) || tabs[0];
  const currentPage = pages[activeTab] || 1;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['media', mediaType, activeTab, currentPage],
    queryFn: () => fetchMediaList<TMDBMovie | TMDBTvShow>(currentTab.endpoint, currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const handlePageChange = (newPage: number) => {
    setPages(prev => ({ ...prev, [activeTab]: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const IconComponent = icon === "movie" ? Film : Tv2;

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex justify-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        {isLoading ? (
          <MediaGridSkeleton />
        ) : error ? (
          <ErrorState error={error} icon={IconComponent} />
        ) : !data?.results?.length ? (
          <EmptyState icon={IconComponent} title={title} />
        ) : (
          <>
            {/* Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${isFetching ? 'opacity-50' : ''}`}>
              {data.results.map((item) => {
                const isMovie = 'title' in item;
                return (
                  <MediaCard
                    key={item.id}
                    id={item.id}
                    title={isMovie ? (item as TMDBMovie).title : (item as TMDBTvShow).name}
                    posterPath={item.poster_path}
                    voteAverage={item.vote_average}
                    releaseDate={isMovie ? (item as TMDBMovie).release_date : (item as TMDBTvShow).first_air_date}
                    overview={item.overview}
                    mediaType={mediaType}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isFetching}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.min(data.total_pages, 500)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.min(data.total_pages, 500) || isFetching}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error, icon: IconComponent }: { error: Error; icon: typeof Film }) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
        Failed to load content
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        {error instanceof Error ? error.message : 'An unexpected error occurred'}
      </p>
    </div>
  );
}

function EmptyState({ icon: IconComponent, title }: { icon: typeof Film; title: string }) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <IconComponent className="w-8 h-8 text-primary" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
        No {title} found
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        We couldn't find any content to display. Please try again later.
      </p>
    </div>
  );
}

export default TabbedMediaGrid;

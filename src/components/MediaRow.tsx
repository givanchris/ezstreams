import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MediaCard from '@/components/MediaCard';
import { TMDBMovie, TMDBTvShow } from '@/lib/tmdb';

type MediaItem = TMDBMovie | TMDBTvShow;

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  mediaType: 'movie' | 'tv';
  loading?: boolean;
  viewAllLink?: string;
}

const MediaRow = ({ title, items, mediaType, loading = false, viewAllLink }: MediaRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 md:w-44">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Button variant="ghost" size="sm" asChild className="text-primary">
              <Link to={viewAllLink}>View all</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const isMovie = 'title' in item;
          return (
            <div key={item.id} className="flex-shrink-0 w-36 md:w-44">
              <MediaCard
                id={item.id}
                title={isMovie ? (item as TMDBMovie).title : (item as TMDBTvShow).name}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                releaseDate={isMovie ? (item as TMDBMovie).release_date : (item as TMDBTvShow).first_air_date}
                overview={item.overview}
                mediaType={mediaType}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaRow;

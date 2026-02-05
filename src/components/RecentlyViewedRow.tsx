import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaCard from '@/components/MediaCard';
import { useRecentlyViewed, RecentlyViewedItem } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedRowProps {
  showClear?: boolean;
}

const RecentlyViewedRow = ({ showClear = true }: RecentlyViewedRowProps) => {
  const { items, clearAll } = useRecentlyViewed();
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

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
            Recently Viewed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {showClear && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={clearAll}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
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
        {items.map((item) => (
          <div key={`${item.mediaType}-${item.id}`} className="flex-shrink-0 w-36 md:w-44">
            <MediaCard
              id={item.id}
              title={item.title}
              posterPath={item.posterPath}
              voteAverage={0}
              releaseDate=""
              overview=""
              mediaType={item.mediaType}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedRow;

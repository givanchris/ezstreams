import { useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface WatchlistButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  variant?: 'default' | 'icon';
  className?: string;
}

const WatchlistButton = ({
  mediaId,
  mediaType,
  title,
  posterPath,
  variant = 'default',
  className = '',
}: WatchlistButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [isLoading, setIsLoading] = useState(false);

  const inList = isInWatchlist(mediaId, mediaType);

  const handleClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    await toggleWatchlist(mediaId, mediaType, title, posterPath);
    setIsLoading(false);
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="glass"
        size="icon"
        className={className}
        onClick={handleClick}
        disabled={isLoading}
        title={inList ? 'Remove from My List' : 'Add to My List'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : inList ? (
          <Check className="w-5 h-5 text-primary" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={inList ? 'outline' : 'glass'}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : inList ? (
        <Check className="w-4 h-4 mr-2 text-primary" />
      ) : (
        <Plus className="w-4 h-4 mr-2" />
      )}
      {inList ? 'In My List' : 'Add to My List'}
    </Button>
  );
};

export default WatchlistButton;

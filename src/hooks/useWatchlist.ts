import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WatchlistItem {
  id: string;
  media_id: string;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  added_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch watchlist on mount and when user changes
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .order('added_at', { ascending: false });

        if (error) throw error;
        
        // Cast media_type since it's stored as string in DB but we validate it
        const typedData = (data || []).map(item => ({
          ...item,
          media_type: item.media_type as 'movie' | 'tv',
        }));
        setItems(typedData);
      } catch (error) {
        console.error('Failed to fetch watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  // Check if item is in watchlist
  const isInWatchlist = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
    return items.some(
      item => item.media_id === String(mediaId) && item.media_type === mediaType
    );
  }, [items]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (
    mediaId: number,
    mediaType: 'movie' | 'tv',
    title: string,
    posterPath: string | null
  ) => {
    if (!user) {
      toast.error('Please log in to add items to your watchlist');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          media_id: String(mediaId),
          media_type: mediaType,
          title,
          poster_path: posterPath,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in your watchlist');
          return false;
        }
        throw error;
      }

      // Cast media_type since it's stored as string in DB
      const typedData: WatchlistItem = {
        ...data,
        media_type: data.media_type as 'movie' | 'tv',
      };

      setItems(prev => [typedData, ...prev]);
      toast.success('Added to My List');
      return true;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      toast.error('Failed to add to watchlist');
      return false;
    }
  }, [user]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', String(mediaId))
        .eq('media_type', mediaType);

      if (error) throw error;

      setItems(prev => prev.filter(
        item => !(item.media_id === String(mediaId) && item.media_type === mediaType)
      ));
      toast.success('Removed from My List');
      return true;
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      toast.error('Failed to remove from watchlist');
      return false;
    }
  }, [user]);

  // Toggle watchlist
  const toggleWatchlist = useCallback(async (
    mediaId: number,
    mediaType: 'movie' | 'tv',
    title: string,
    posterPath: string | null
  ) => {
    if (isInWatchlist(mediaId, mediaType)) {
      return removeFromWatchlist(mediaId, mediaType);
    } else {
      return addToWatchlist(mediaId, mediaType, title, posterPath);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  return {
    items,
    loading,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  };
}

export type { WatchlistItem };

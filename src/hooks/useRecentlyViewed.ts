import { useState, useEffect, useCallback } from 'react';

interface RecentlyViewedItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  viewedAt: number;
}

const STORAGE_KEY = 'ezstream_recently_viewed';
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedItem[];
        setItems(parsed);
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    }
  }, []);

  // Add item to recently viewed
  const addItem = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setItems(prev => {
      // Remove if already exists
      const filtered = prev.filter(
        i => !(i.id === item.id && i.mediaType === item.mediaType)
      );
      
      // Add to front with timestamp
      const newItems = [
        { ...item, viewedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_ITEMS);
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      } catch (error) {
        console.error('Failed to save recently viewed:', error);
      }
      
      return newItems;
    });
  }, []);

  // Clear all recently viewed
  const clearAll = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recently viewed:', error);
    }
  }, []);

  return { items, addItem, clearAll };
}

export type { RecentlyViewedItem };

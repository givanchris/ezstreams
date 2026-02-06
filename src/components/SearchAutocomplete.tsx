import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Film, Tv2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { rankSearchResults } from '@/lib/search-ranking';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  popularity?: number;
  vote_count?: number;
  vote_average?: number;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const SearchAutocomplete = ({
  placeholder = 'Search movies and TV shows...',
  onSearch,
  className = '',
}: SearchAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search
  const searchMulti = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setResults([]);
        return;
      }

      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const searchParams = new URLSearchParams({
        endpoint: '/search/multi',
        query: searchQuery.trim(),
        page: '1',
        include_adult: 'false',
      });

      const response = await fetch(
        `${projectUrl}/functions/v1/tmdb-proxy?${searchParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      // Filter to only movies and TV shows, then rank
      const filtered = (data.results || [])
        .filter((item: SearchResult) => item.media_type === 'movie' || item.media_type === 'tv');
      const ranked = rankSearchResults<SearchResult>(filtered, searchQuery).slice(0, 8);
      
      setResults(ranked);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchMulti(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchMulti]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const path = result.media_type === 'movie' ? `/movie/${result.id}` : `/tv/${result.id}`;
    navigate(path);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
      setShowDropdown(false);
    }
  };

  const getTitle = (result: SearchResult) => result.title || result.name || '';
  const getYear = (result: SearchResult) => {
    const date = result.release_date || result.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-12 pr-10 py-6 bg-secondary/50 border-border text-lg"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
        >
          {results.map((result) => {
            const posterUrl = getImageUrl(result.poster_path, 'w92');
            const year = getYear(result);
            const title = getTitle(result);

            return (
              <button
                key={`${result.media_type}-${result.id}`}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                onClick={() => handleSelect(result)}
              >
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={title}
                    className="w-10 h-14 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-14 rounded bg-secondary flex items-center justify-center">
                    {result.media_type === 'movie' ? (
                      <Film className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Tv2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{title}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      {result.media_type === 'movie' ? 'Movie' : 'TV Series'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {year && `${year}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;

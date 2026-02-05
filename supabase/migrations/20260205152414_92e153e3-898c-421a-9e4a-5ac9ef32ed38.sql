-- Create watchlist table for saving movies and TV shows
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id, media_type)
);

-- Enable Row Level Security
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own watchlist" 
ON public.watchlist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist" 
ON public.watchlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own watchlist" 
ON public.watchlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX idx_watchlist_user_media ON public.watchlist(user_id, media_id, media_type);
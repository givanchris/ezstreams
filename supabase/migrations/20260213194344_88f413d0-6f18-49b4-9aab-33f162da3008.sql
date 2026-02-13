
-- Track each title a user selects (clicks into detail page)
CREATE TABLE public.user_title_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv')),
  tmdb_id int NOT NULL,
  title text NOT NULL,
  poster_path text,
  selected_at timestamptz NOT NULL DEFAULT now(),
  region text NOT NULL DEFAULT 'US',
  flatrate_providers jsonb DEFAULT '[]'::jsonb,
  UNIQUE (user_id, media_type, tmdb_id, region)
);

ALTER TABLE public.user_title_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own title history"
  ON public.user_title_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own title history"
  ON public.user_title_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own title history"
  ON public.user_title_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own title history"
  ON public.user_title_history FOR DELETE
  USING (auth.uid() = user_id);

-- Aggregated provider coverage stats per user per region
CREATE TABLE public.user_provider_stats (
  user_id uuid NOT NULL,
  region text NOT NULL DEFAULT 'US',
  total_titles int NOT NULL DEFAULT 0,
  provider_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, region)
);

ALTER TABLE public.user_provider_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provider stats"
  ON public.user_provider_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own provider stats"
  ON public.user_provider_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provider stats"
  ON public.user_provider_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own provider stats"
  ON public.user_provider_stats FOR DELETE
  USING (auth.uid() = user_id);

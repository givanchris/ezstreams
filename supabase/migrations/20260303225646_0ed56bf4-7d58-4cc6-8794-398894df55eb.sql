
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User lists table
CREATE TABLE public.user_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public lists are viewable by everyone" ON public.user_lists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own lists" ON public.user_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.user_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.user_lists FOR DELETE USING (auth.uid() = user_id);

-- List items table
CREATE TABLE public.list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.user_lists(id) ON DELETE CASCADE,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL,
  title text NOT NULL,
  poster_path text,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List items viewable if list is viewable" ON public.list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_items.list_id AND (is_public = true OR auth.uid() = user_id))
);
CREATE POLICY "Users can add items to own lists" ON public.list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_items.list_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can update items in own lists" ON public.list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_items.list_id AND auth.uid() = user_id)
);
CREATE POLICY "Users can delete items from own lists" ON public.list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_lists WHERE id = list_items.list_id AND auth.uid() = user_id)
);

-- Timestamps triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_lists_updated_at BEFORE UPDATE ON public.user_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

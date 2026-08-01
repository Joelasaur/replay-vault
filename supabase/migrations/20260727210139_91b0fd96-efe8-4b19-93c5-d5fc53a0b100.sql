
-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ign text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup, using metadata.ign or the email local-part
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, ign)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'ign', ''),
      split_part(COALESCE(NEW.email, 'player'), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- replays
CREATE TABLE public.replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('Tank','Damage','Support')),
  hero text NOT NULL,
  rank text NOT NULL CHECK (rank IN ('Bronze','Silver','Gold','Platinum','Diamond','Master','Grandmaster','Champion')),
  division int NOT NULL CHECK (division BETWEEN 1 AND 5),
  replay_code text NOT NULL,
  map text NOT NULL,
  result text NOT NULL CHECK (result IN ('Win','Loss')),
  notes text NOT NULL DEFAULT '',
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_ign text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.replays TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.replays TO authenticated;
GRANT ALL ON public.replays TO service_role;
ALTER TABLE public.replays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replays_select_all" ON public.replays FOR SELECT USING (true);
CREATE POLICY "replays_insert_own" ON public.replays FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "replays_update_own" ON public.replays FOR UPDATE TO authenticated USING (auth.uid() = submitter_id) WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "replays_delete_own" ON public.replays FOR DELETE TO authenticated USING (auth.uid() = submitter_id);

CREATE INDEX replays_role_idx ON public.replays(role);
CREATE INDEX replays_rank_div_idx ON public.replays(rank, division);
CREATE INDEX replays_created_idx ON public.replays(created_at DESC);

-- comments
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_id uuid NOT NULL REFERENCES public.replays(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_ign text NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE INDEX comments_replay_idx ON public.comments(replay_id, created_at);

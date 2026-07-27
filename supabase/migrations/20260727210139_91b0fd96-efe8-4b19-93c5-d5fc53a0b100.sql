
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

-- Seed replays (submitter_id NULL = system seed; submitter_ign is display-only)
INSERT INTO public.replays (role, hero, rank, division, replay_code, map, result, notes, submitter_ign) VALUES
-- Tank
('Tank','Reinhardt','Bronze',4,'BRZT01','King''s Row','Win','Basic shield discipline and rock timing.','ShieldSchool'),
('Tank','D.Va','Silver',3,'SLVT02','Busan','Loss','Good example of matrix priorities on control maps.','MechMain'),
('Tank','Winston','Gold',2,'GLDT03','Numbani','Win','Dive timing when supports are cooled down.','JumpPack'),
('Tank','Orisa','Platinum',5,'PLTT04','Dorado','Win','Positioning around corners with javelin spin.','SpearWall'),
('Tank','Sigma','Diamond',3,'DIAT05','Circuit Royal','Loss','Ult tracking and accretion angles.','GravityWell'),
('Tank','Ramattra','Master',2,'MSTT06','Colosseo','Win','Form-swap tempo in staggered fights.','NemesisForm'),
('Tank','Zarya','Grandmaster',3,'GMT07','Suravasa','Win','Bubble economy against dive.','ParticleBubble'),
('Tank','Junker Queen','Champion',1,'CHPT08','Samoa','Loss','High-rank aggression and knife management.','QueenGrit'),
-- Damage
('Damage','Genji','Bronze',3,'BRZD01','Lijiang Tower','Loss','Blade timing and dash resets basics.','DragonBlade'),
('Damage','Soldier: 76','Silver',4,'SLVD02','Hollywood','Win','Cover play and heal-field placement.','TacVisor'),
('Damage','Ashe','Gold',5,'GLDD03','Rialto','Win','Scoped positioning and Bob timing.','DynamiteAce'),
('Damage','Tracer','Platinum',2,'PLTD04','Midtown','Loss','Backline pressure without over-committing.','BlinkQueen'),
('Damage','Sojourn','Diamond',5,'DIAD05','Ilios','Win','Rail charge economy in brawls.','RailRunner'),
('Damage','Widowmaker','Master',4,'MSTD06','Eichenwalde','Win','Sightline rotations and grapple resets.','ScopeStudy'),
('Damage','Cassidy','Grandmaster',1,'GMD07','Colosseo','Loss','Roll usage against dive comps.','HighNoonVOD'),
('Damage','Echo','Champion',2,'CHPD08','Antarctic Peninsula','Win','Duplicate targeting at top rank.','EchoLab'),
-- Support
('Support','Moira','Bronze',5,'BRZS01','King''s Row','Win','Basic orb usage and safer fade timing.','MoiraMentor01'),
('Support','Ana','Silver',2,'SLVS02','Hollywood','Loss','Nade priority and sleep confirmations.','NanoBoost'),
('Support','Kiriko','Gold',1,'GLDS03','Nepal','Loss','Suzu timing vs dive.','FoxSpirit'),
('Support','Lucio','Platinum',4,'PLTS04','Rialto','Win','Speed windows for taking space.','WallRider'),
('Support','Baptiste','Diamond',1,'DIAS05','Ilios','Loss','Lamp placement and window timing.','LampGod'),
('Support','Zenyatta','Master',1,'MSTS06','Shambali Monastery','Loss','Discord target priority.','HarmonyOrb'),
('Support','Illari','Grandmaster',3,'GMS07','Suravasa','Win','Pylon placement and outburst combos.','SunPylon'),
('Support','Brigitte','Champion',1,'CHPS08','Antarctic Peninsula','Loss','Peel patterns at top rank.','ShieldBash');

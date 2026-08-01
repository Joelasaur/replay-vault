-- Synthetic, deterministic local/preview fixtures. Never replace this file
-- with a production dump.

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'player@replayvault.local',
  crypt('replay-vault-local-only', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"ign":"LocalPlayer"}',
  '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '{"sub":"10000000-0000-4000-8000-000000000001","email":"player@replayvault.local","email_verified":true}',
  'email', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'
);

INSERT INTO public.replays (
  id, role, hero, rank, division, replay_code, map, result, notes,
  submitter_ign, created_at
) VALUES
  -- Tank: one replay at every rank tier.
  ('20000000-0000-4000-8000-000000000001', 'Tank', 'Reinhardt', 'Bronze', 4, 'BRZT01', 'King''s Row', 'Win', 'Basic shield discipline and rock timing.', 'ShieldSchool', '2026-01-01 01:00:00+00'),
  ('20000000-0000-4000-8000-000000000002', 'Tank', 'D.Va', 'Silver', 3, 'SLVT02', 'Busan', 'Loss', 'Good example of matrix priorities on control maps.', 'MechMain', '2026-01-01 02:00:00+00'),
  ('20000000-0000-4000-8000-000000000003', 'Tank', 'Winston', 'Gold', 2, 'GLDT03', 'Numbani', 'Win', 'Dive timing when supports are cooled down.', 'JumpPack', '2026-01-01 03:00:00+00'),
  ('20000000-0000-4000-8000-000000000004', 'Tank', 'Orisa', 'Platinum', 5, 'PLTT04', 'Dorado', 'Win', 'Positioning around corners with javelin spin.', 'SpearWall', '2026-01-01 04:00:00+00'),
  ('20000000-0000-4000-8000-000000000005', 'Tank', 'Sigma', 'Diamond', 3, 'DIAT05', 'Circuit Royal', 'Loss', 'Ult tracking and accretion angles.', 'GravityWell', '2026-01-01 05:00:00+00'),
  ('20000000-0000-4000-8000-000000000006', 'Tank', 'Ramattra', 'Master', 2, 'MSTT06', 'Colosseo', 'Win', 'Form-swap tempo in staggered fights.', 'NemesisForm', '2026-01-01 06:00:00+00'),
  ('20000000-0000-4000-8000-000000000007', 'Tank', 'Zarya', 'Grandmaster', 3, 'GMT07', 'Suravasa', 'Win', 'Bubble economy against dive.', 'ParticleBubble', '2026-01-01 07:00:00+00'),
  ('20000000-0000-4000-8000-000000000008', 'Tank', 'Junker Queen', 'Champion', 1, 'CHPT08', 'Samoa', 'Loss', 'High-rank aggression and knife management.', 'QueenGrit', '2026-01-01 08:00:00+00'),
  -- Damage: one replay at every rank tier.
  ('20000000-0000-4000-8000-000000000009', 'Damage', 'Genji', 'Bronze', 3, 'BRZD01', 'Lijiang Tower', 'Loss', 'Blade timing and dash resets basics.', 'DragonBlade', '2026-01-01 09:00:00+00'),
  ('20000000-0000-4000-8000-000000000010', 'Damage', 'Soldier: 76', 'Silver', 4, 'SLVD02', 'Hollywood', 'Win', 'Cover play and heal-field placement.', 'TacVisor', '2026-01-01 10:00:00+00'),
  ('20000000-0000-4000-8000-000000000011', 'Damage', 'Ashe', 'Gold', 5, 'GLDD03', 'Rialto', 'Win', 'Scoped positioning and Bob timing.', 'DynamiteAce', '2026-01-01 11:00:00+00'),
  ('20000000-0000-4000-8000-000000000012', 'Damage', 'Tracer', 'Platinum', 2, 'PLTD04', 'Midtown', 'Loss', 'Backline pressure without over-committing.', 'BlinkQueen', '2026-01-01 12:00:00+00'),
  ('20000000-0000-4000-8000-000000000013', 'Damage', 'Sojourn', 'Diamond', 5, 'DIAD05', 'Ilios', 'Win', 'Rail charge economy in brawls.', 'RailRunner', '2026-01-01 13:00:00+00'),
  ('20000000-0000-4000-8000-000000000014', 'Damage', 'Widowmaker', 'Master', 4, 'MSTD06', 'Eichenwalde', 'Win', 'Sightline rotations and grapple resets.', 'ScopeStudy', '2026-01-01 14:00:00+00'),
  ('20000000-0000-4000-8000-000000000015', 'Damage', 'Cassidy', 'Grandmaster', 1, 'GMD07', 'Colosseo', 'Loss', 'Roll usage against dive comps.', 'HighNoonVOD', '2026-01-01 15:00:00+00'),
  ('20000000-0000-4000-8000-000000000016', 'Damage', 'Echo', 'Champion', 2, 'CHPD08', 'Antarctic Peninsula', 'Win', 'Duplicate targeting at top rank.', 'EchoLab', '2026-01-01 16:00:00+00'),
  -- Support: one replay at every rank tier.
  ('20000000-0000-4000-8000-000000000017', 'Support', 'Moira', 'Bronze', 5, 'BRZS01', 'King''s Row', 'Win', 'Basic orb usage and safer fade timing.', 'MoiraMentor01', '2026-01-01 17:00:00+00'),
  ('20000000-0000-4000-8000-000000000018', 'Support', 'Ana', 'Silver', 2, 'SLVS02', 'Hollywood', 'Loss', 'Nade priority and sleep confirmations.', 'NanoBoost', '2026-01-01 18:00:00+00'),
  ('20000000-0000-4000-8000-000000000019', 'Support', 'Kiriko', 'Gold', 1, 'GLDS03', 'Nepal', 'Loss', 'Suzu timing vs dive.', 'FoxSpirit', '2026-01-01 19:00:00+00'),
  ('20000000-0000-4000-8000-000000000020', 'Support', 'Lucio', 'Platinum', 4, 'PLTS04', 'Rialto', 'Win', 'Speed windows for taking space.', 'WallRider', '2026-01-01 20:00:00+00'),
  ('20000000-0000-4000-8000-000000000021', 'Support', 'Baptiste', 'Diamond', 1, 'DIAS05', 'Ilios', 'Loss', 'Lamp placement and window timing.', 'LampGod', '2026-01-01 21:00:00+00'),
  ('20000000-0000-4000-8000-000000000022', 'Support', 'Zenyatta', 'Master', 1, 'MSTS06', 'Shambali Monastery', 'Loss', 'Discord target priority.', 'HarmonyOrb', '2026-01-01 22:00:00+00'),
  ('20000000-0000-4000-8000-000000000023', 'Support', 'Illari', 'Grandmaster', 3, 'GMS07', 'Suravasa', 'Win', 'Pylon placement and outburst combos.', 'SunPylon', '2026-01-01 23:00:00+00'),
  ('20000000-0000-4000-8000-000000000024', 'Support', 'Brigitte', 'Champion', 1, 'CHPS08', 'Antarctic Peninsula', 'Loss', 'Peel patterns at top rank.', 'ShieldBash', '2026-01-02 00:00:00+00');

INSERT INTO public.comments (id, replay_id, author_id, author_ign, body, created_at)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'LocalPlayer', 'Synthetic comment for local development.', '2026-01-01 04:00:00+00'
);

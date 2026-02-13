BEGIN;
SELECT plan(6);

-- Setup test data
INSERT INTO profiles (id, user_id, name, email, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user-a-id', 'User A', 'a@test.com', 'client'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b-id', 'User B', 'b@test.com', 'creator');

-- Test 1: User A can see own profile
SELECT set_config('app.current_user_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
SELECT set_config('app.current_user_role', 'client', true);

SELECT is(
  (SELECT count(*)::int FROM profiles WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'User A can see own profile'
);

-- Test 2: User A cannot see User B profile
SELECT is(
  (SELECT count(*)::int FROM profiles WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'User A cannot see User B profile'
);

-- Test 3: Admin can see all profiles
SELECT set_config('app.current_user_role', 'admin', true);

SELECT ok(
  (SELECT count(*)::int FROM profiles) >= 2,
  'Admin can see all profiles'
);

-- Test 4: User can update own profile
SELECT set_config('app.current_user_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
SELECT set_config('app.current_user_role', 'client', true);

UPDATE profiles SET bio = 'Updated bio' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT is(
  (SELECT bio FROM profiles WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Updated bio',
  'User can update own profile'
);

-- Test 5: User cannot update other user profile
UPDATE profiles SET bio = 'Hacked!' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT is(
  (SELECT bio FROM profiles WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  NULL,
  'User cannot update other user profile (bio should still be NULL)'
);

-- Test 6: Creator profiles are publicly visible
INSERT INTO creator_profiles (id, profile_id, intro, skills, tools, availability) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'I am a creator', ARRAY['video editing'], ARRAY['Premiere Pro'], 'available');

SELECT set_config('app.current_user_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
SELECT set_config('app.current_user_role', 'client', true);

SELECT is(
  (SELECT count(*)::int FROM creator_profiles WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  1,
  'Creator profiles are publicly visible for discovery'
);

SELECT * FROM finish();
ROLLBACK;

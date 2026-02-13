BEGIN;
SELECT plan(5);

-- Setup test data
INSERT INTO profiles (id, user_id, name, email, role) VALUES
  ('client-1-id', 'user-client-1', 'Client 1', 'client1@test.com', 'client'),
  ('creator-1-id', 'user-creator-1', 'Creator 1', 'creator1@test.com', 'creator');

INSERT INTO projects (id, client_id, title, description, status, budget_min, budget_max, deadline, category) VALUES
  ('project-open-id', 'client-1-id', 'Open Project', 'Public project', 'open', 1000000, 2000000, NOW() + INTERVAL '30 days', 'video'),
  ('project-draft-id', 'client-1-id', 'Draft Project', 'Private draft', 'draft', 500000, 1000000, NOW() + INTERVAL '30 days', 'video');

-- Test 1: Anyone can see open projects
SELECT set_config('app.current_user_id', 'creator-1-id', true);
SELECT set_config('app.current_user_role', 'creator', true);

SELECT is(
  (SELECT count(*)::int FROM projects WHERE status = 'open'),
  1,
  'Anyone can see open projects'
);

-- Test 2: Non-owner cannot see draft projects
SELECT is(
  (SELECT count(*)::int FROM projects WHERE id = 'project-draft-id'),
  0,
  'Non-owner cannot see draft projects'
);

-- Test 3: Owner can see own draft projects
SELECT set_config('app.current_user_id', 'client-1-id', true);
SELECT set_config('app.current_user_role', 'client', true);

SELECT is(
  (SELECT count(*)::int FROM projects WHERE id = 'project-draft-id'),
  1,
  'Owner can see own draft projects'
);

-- Test 4: Owner can update own projects
UPDATE projects SET title = 'Updated Title' WHERE id = 'project-draft-id';

SELECT is(
  (SELECT title FROM projects WHERE id = 'project-draft-id'),
  'Updated Title',
  'Owner can update own projects'
);

-- Test 5: Admin can see all projects
SELECT set_config('app.current_user_role', 'admin', true);

SELECT ok(
  (SELECT count(*)::int FROM projects) >= 2,
  'Admin can see all projects'
);

SELECT * FROM finish();
ROLLBACK;

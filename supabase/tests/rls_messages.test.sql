BEGIN;
SELECT plan(4);

-- Setup test data
INSERT INTO profiles (id, user_id, name, email, role) VALUES
  ('client-msg-id', 'user-client-msg', 'Client Msg', 'clientmsg@test.com', 'client'),
  ('creator-msg-id', 'user-creator-msg', 'Creator Msg', 'creatormsg@test.com', 'creator'),
  ('outsider-id', 'user-outsider', 'Outsider', 'outsider@test.com', 'creator');

INSERT INTO projects (id, client_id, title, description, status, budget_min, budget_max, deadline, category) VALUES
  ('project-msg-id', 'client-msg-id', 'Project with Messages', 'Test project', 'in_progress', 1000000, 2000000, NOW() + INTERVAL '30 days', 'video');

INSERT INTO proposals (id, project_id, creator_id, delivery_days, milestones, revision_scope, price, status) VALUES
  ('proposal-accepted-id', 'project-msg-id', 'creator-msg-id', 14, 'Milestone 1, Milestone 2', '2 revisions', 1500000, 'accepted');

INSERT INTO messages (id, project_id, sender_id, content) VALUES
  ('message-1-id', 'project-msg-id', 'client-msg-id', 'Hello from client'),
  ('message-2-id', 'project-msg-id', 'creator-msg-id', 'Hello from creator');

-- Test 1: Client can see messages in their project
SELECT set_config('app.current_user_id', 'client-msg-id', true);
SELECT set_config('app.current_user_role', 'client', true);

SELECT is(
  (SELECT count(*)::int FROM messages WHERE project_id = 'project-msg-id'),
  2,
  'Client can see messages in their project'
);

-- Test 2: Creator with accepted proposal can see messages
SELECT set_config('app.current_user_id', 'creator-msg-id', true);
SELECT set_config('app.current_user_role', 'creator', true);

SELECT is(
  (SELECT count(*)::int FROM messages WHERE project_id = 'project-msg-id'),
  2,
  'Creator with accepted proposal can see messages'
);

-- Test 3: Outsider cannot see messages
SELECT set_config('app.current_user_id', 'outsider-id', true);
SELECT set_config('app.current_user_role', 'creator', true);

SELECT is(
  (SELECT count(*)::int FROM messages WHERE project_id = 'project-msg-id'),
  0,
  'Outsider cannot see project messages'
);

-- Test 4: Participant can send messages
SELECT set_config('app.current_user_id', 'client-msg-id', true);
SELECT set_config('app.current_user_role', 'client', true);

INSERT INTO messages (id, project_id, sender_id, content) VALUES
  ('message-3-id', 'project-msg-id', 'client-msg-id', 'New message from client');

SELECT is(
  (SELECT count(*)::int FROM messages WHERE id = 'message-3-id'),
  1,
  'Participant can send messages'
);

SELECT * FROM finish();
ROLLBACK;

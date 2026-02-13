-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shotlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (
    id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Users can insert their own profile (during signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (
    id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- CREATOR PROFILES RLS POLICIES
-- ============================================================================

-- Anyone can view creator profiles (for search/discovery)
CREATE POLICY "creator_profiles_select_all" ON creator_profiles
  FOR SELECT
  USING (deleted_at IS NULL);

-- Only profile owner can update their creator profile
CREATE POLICY "creator_profiles_update_own" ON creator_profiles
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = current_setting('app.current_user_id', true)::uuid
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only profile owner can insert their creator profile
CREATE POLICY "creator_profiles_insert_own" ON creator_profiles
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = current_setting('app.current_user_id', true)::uuid
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- PROJECTS RLS POLICIES
-- ============================================================================

-- Anyone can view open projects
CREATE POLICY "projects_select_open" ON projects
  FOR SELECT
  USING (
    status = 'open'
    OR client_id = current_setting('app.current_user_id', true)::uuid
    OR id IN (
      SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only client can update their own projects
CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE
  USING (
    client_id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only authenticated users can create projects
CREATE POLICY "projects_insert_authenticated" ON projects
  FOR INSERT
  WITH CHECK (
    client_id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- VIDEO BRIEFS RLS POLICIES
-- ============================================================================

-- Same as projects (linked to project access)
CREATE POLICY "video_briefs_select_project_access" ON video_briefs
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        status = 'open'
        OR client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "video_briefs_insert_project_owner" ON video_briefs
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE client_id = current_setting('app.current_user_id', true)::uuid
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "video_briefs_update_project_owner" ON video_briefs
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = current_setting('app.current_user_id', true)::uuid
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- STORYBOARD/SHOTLIST RLS POLICIES
-- ============================================================================

CREATE POLICY "storyboard_items_select_project_access" ON storyboard_items
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid AND status = 'accepted')
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "shotlist_items_select_project_access" ON shotlist_items
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid AND status = 'accepted')
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- PROPOSALS RLS POLICIES
-- ============================================================================

-- Project client and proposal creator can view
CREATE POLICY "proposals_select_participants" ON proposals
  FOR SELECT
  USING (
    creator_id = current_setting('app.current_user_id', true)::uuid
    OR project_id IN (SELECT id FROM projects WHERE client_id = current_setting('app.current_user_id', true)::uuid)
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only creators can insert proposals
CREATE POLICY "proposals_insert_creator" ON proposals
  FOR INSERT
  WITH CHECK (
    creator_id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only project client can update proposal status
CREATE POLICY "proposals_update_client" ON proposals
  FOR UPDATE
  USING (
    project_id IN (SELECT id FROM projects WHERE client_id = current_setting('app.current_user_id', true)::uuid)
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- CONTRACTS/MILESTONES/DELIVERIES/PAYMENTS RLS POLICIES
-- ============================================================================

-- Only project participants (client + creator) can access
CREATE POLICY "contracts_select_participants" ON contracts
  FOR SELECT
  USING (
    client_id = current_setting('app.current_user_id', true)::uuid
    OR creator_id = current_setting('app.current_user_id', true)::uuid
    OR current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "milestones_select_participants" ON milestones
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM contracts WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "deliveries_select_participants" ON deliveries
  FOR SELECT
  USING (
    milestone_id IN (
      SELECT id FROM milestones WHERE project_id IN (
        SELECT id FROM projects WHERE 
          client_id = current_setting('app.current_user_id', true)::uuid
          OR id IN (SELECT project_id FROM contracts WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
      )
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

CREATE POLICY "payments_select_participants" ON payments
  FOR SELECT
  USING (
    milestone_id IN (
      SELECT id FROM milestones WHERE project_id IN (
        SELECT id FROM projects WHERE 
          client_id = current_setting('app.current_user_id', true)::uuid
          OR id IN (SELECT project_id FROM contracts WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
      )
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- MESSAGES RLS POLICIES
-- ============================================================================

-- Only project participants can view messages
CREATE POLICY "messages_select_participants" ON messages
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid AND status = 'accepted')
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only project participants can send messages
CREATE POLICY "messages_insert_participants" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)::uuid
    AND project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid AND status = 'accepted')
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- ATTACHMENTS RLS POLICIES
-- ============================================================================

CREATE POLICY "attachments_select_message_access" ON attachments
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages WHERE project_id IN (
        SELECT id FROM projects WHERE 
          client_id = current_setting('app.current_user_id', true)::uuid
          OR id IN (SELECT project_id FROM proposals WHERE creator_id = current_setting('app.current_user_id', true)::uuid AND status = 'accepted')
      )
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- REVIEWS/DISPUTES RLS POLICIES
-- ============================================================================

-- Anyone can view reviews (public reputation)
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT
  USING (deleted_at IS NULL);

-- Only project participants can create reviews
CREATE POLICY "reviews_insert_participants" ON reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = current_setting('app.current_user_id', true)::uuid
    AND project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM contracts WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only project participants and admins can view disputes
CREATE POLICY "disputes_select_participants_admin" ON disputes
  FOR SELECT
  USING (
    raised_by = current_setting('app.current_user_id', true)::uuid
    OR project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM contracts WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Only project participants can raise disputes
CREATE POLICY "disputes_insert_participants" ON disputes
  FOR INSERT
  WITH CHECK (
    raised_by = current_setting('app.current_user_id', true)::uuid
    AND project_id IN (
      SELECT id FROM projects WHERE 
        client_id = current_setting('app.current_user_id', true)::uuid
        OR id IN (SELECT project_id FROM contracts WHERE creator_id = current_setting('app.current_user_id', true)::uuid)
    )
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- EMBEDDINGS AUDIT RLS POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "embeddings_audit_select_admin" ON embeddings_audit
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'admin');

-- System can insert audit logs (no user context required)
CREATE POLICY "embeddings_audit_insert_system" ON embeddings_audit
  FOR INSERT
  WITH CHECK (true);

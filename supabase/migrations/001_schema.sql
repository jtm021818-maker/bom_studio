-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enums
CREATE TYPE role AS ENUM ('client', 'creator', 'admin');
CREATE TYPE availability AS ENUM ('available', 'busy', 'unavailable');
CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE channel AS ENUM ('youtube_short', 'youtube_long', 'instagram_reel', 'tiktok', 'other');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'revision_requested');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE milestone_status AS ENUM ('pending', 'submitted', 'approved', 'revision_requested', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'escrowed', 'released', 'refunded');
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'closed');

-- Profiles table (links to Better Auth user table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- FK to Better Auth user table
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role role NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Creator profiles table (with AI embedding)
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  intro TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  tools TEXT[] NOT NULL,
  availability availability NOT NULL DEFAULT 'available',
  hourly_rate TEXT,
  portfolio_url TEXT,
  embedding vector(1536), -- AI embedding for hybrid search
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_creator_profiles_profile_id ON creator_profiles(profile_id);
CREATE INDEX idx_creator_profiles_availability ON creator_profiles(availability);
CREATE INDEX idx_creator_profiles_deleted_at ON creator_profiles(deleted_at) WHERE deleted_at IS NULL;

-- HNSW index for vector similarity search (cosine distance)
CREATE INDEX creator_profiles_embedding_idx ON creator_profiles 
  USING hnsw (embedding vector_cosine_ops);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'draft',
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  deadline TIMESTAMP NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_budget ON projects(budget_min, budget_max);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;

-- Video briefs table (with AI embedding)
CREATE TABLE video_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  channel channel NOT NULL,
  duration TEXT NOT NULL,
  resolution TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  fps TEXT NOT NULL,
  style TEXT NOT NULL,
  prohibited_elements TEXT[],
  reference_urls TEXT[],
  embedding vector(1536), -- AI embedding for matching
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_video_briefs_project_id ON video_briefs(project_id);
CREATE INDEX idx_video_briefs_channel ON video_briefs(channel);
CREATE INDEX idx_video_briefs_deleted_at ON video_briefs(deleted_at) WHERE deleted_at IS NULL;

-- HNSW index for video brief similarity search
CREATE INDEX video_briefs_embedding_idx ON video_briefs 
  USING hnsw (embedding vector_cosine_ops);

-- Storyboard items table
CREATE TABLE storyboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  scene_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  goal TEXT NOT NULL,
  reference TEXT,
  review_status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_storyboard_items_project_id ON storyboard_items(project_id);
CREATE INDEX idx_storyboard_items_deleted_at ON storyboard_items(deleted_at) WHERE deleted_at IS NULL;

-- Shotlist items table
CREATE TABLE shotlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  shot_number INTEGER NOT NULL,
  camera TEXT NOT NULL,
  motion TEXT NOT NULL,
  effects TEXT,
  duration TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_shotlist_items_project_id ON shotlist_items(project_id);
CREATE INDEX idx_shotlist_items_deleted_at ON shotlist_items(deleted_at) WHERE deleted_at IS NULL;

-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  delivery_days INTEGER NOT NULL,
  milestones TEXT NOT NULL,
  revision_scope TEXT NOT NULL,
  price INTEGER NOT NULL,
  status proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_proposals_project_id ON proposals(project_id);
CREATE INDEX idx_proposals_creator_id ON proposals(creator_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_deleted_at ON proposals(deleted_at) WHERE deleted_at IS NULL;

-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  terms TEXT NOT NULL,
  signed_at TIMESTAMP,
  modusign_document_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX idx_contracts_deleted_at ON contracts(deleted_at) WHERE deleted_at IS NULL;

-- Milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_date TIMESTAMP NOT NULL,
  status milestone_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_deleted_at ON milestones(deleted_at) WHERE deleted_at IS NULL;

-- Deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestones(id),
  file_url TEXT NOT NULL,
  has_watermark BOOLEAN NOT NULL DEFAULT true,
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_deliveries_milestone_id ON deliveries(milestone_id);
CREATE INDEX idx_deliveries_deleted_at ON deliveries(deleted_at) WHERE deleted_at IS NULL;

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestones(id),
  amount INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  toss_payment_key TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_payments_milestone_id ON payments(milestone_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at) WHERE deleted_at IS NULL;

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;

-- Attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_attachments_message_id ON attachments(message_id);
CREATE INDEX idx_attachments_deleted_at ON attachments(deleted_at) WHERE deleted_at IS NULL;

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_reviews_project_id ON reviews(project_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_deleted_at ON reviews(deleted_at) WHERE deleted_at IS NULL;

-- Disputes table
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  evidence TEXT[],
  status dispute_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_disputes_project_id ON disputes(project_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_deleted_at ON disputes(deleted_at) WHERE deleted_at IS NULL;

-- Embeddings audit table
CREATE TABLE embeddings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'creator_profile' | 'project' | 'video_brief'
  entity_id UUID NOT NULL,
  embedding_model TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_embeddings_audit_entity ON embeddings_audit(entity_type, entity_id);
CREATE INDEX idx_embeddings_audit_deleted_at ON embeddings_audit(deleted_at) WHERE deleted_at IS NULL;

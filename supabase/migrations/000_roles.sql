-- Create app role for runtime queries (NO bypassrls privilege)
-- This role will be used by the application at runtime
-- RLS policies will apply to all queries from this role

CREATE ROLE bomgyeol_app LOGIN PASSWORD 'change_me_in_production' 
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO bomgyeol_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bomgyeol_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bomgyeol_app;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bomgyeol_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO bomgyeol_app;

COMMENT ON ROLE bomgyeol_app IS 'Application runtime role - RLS policies apply';

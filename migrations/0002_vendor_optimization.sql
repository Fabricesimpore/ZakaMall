-- Vendor optimization and admin performance improvements

-- Normalize status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status') THEN
    CREATE TYPE vendor_status AS ENUM ('pending','approved','rejected','suspended');
  END IF;
END$$;

-- Update status column to use proper enum
ALTER TABLE vendors 
  ALTER COLUMN status TYPE vendor_status USING
  CASE lower(status::text)
    WHEN 'pending' THEN 'pending'::vendor_status
    WHEN 'approved' THEN 'approved'::vendor_status
    WHEN 'rejected' THEN 'rejected'::vendor_status
    WHEN 'suspended' THEN 'suspended'::vendor_status
    ELSE 'pending'::vendor_status
  END;

-- Add indexes for fast admin vendor queries
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON vendors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_status_created ON vendors(status, created_at DESC);

-- Index for store name searches
CREATE INDEX IF NOT EXISTS idx_vendors_store_name_lower ON vendors(lower(store_name));
CREATE INDEX IF NOT EXISTS idx_vendors_legal_name_lower ON vendors(lower(legal_name));

-- Index for contact email lookups
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email ON vendors(contact_email);

-- Index for store slug (already should exist but ensure it's there)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_store_slug ON vendors(store_slug);

-- Add user status for soft deletes (if not exists)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS deleted_at timestamp,
  ADD COLUMN IF NOT EXISTS status varchar(16) DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Optimize vendor audit log queries
CREATE INDEX IF NOT EXISTS idx_vendor_audit_log_vendor_id ON vendor_audit_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_audit_log_created_at ON vendor_audit_log(created_at DESC);
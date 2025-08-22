-- Vendor Registration & Approval Revamp Migration
-- Adds proper store name, legal name separation, slugs, and audit logging

-- First, add new columns to vendors table
ALTER TABLE vendors
  ADD COLUMN store_name VARCHAR(120),
  ADD COLUMN store_slug VARCHAR(140),
  ADD COLUMN legal_name VARCHAR(200),
  ADD COLUMN contact_email VARCHAR(160),
  ADD COLUMN contact_phone VARCHAR(40),
  ADD COLUMN country_code CHAR(2),
  ADD COLUMN logo_url TEXT,
  ADD COLUMN banner_url TEXT,
  ADD COLUMN review_notes TEXT;

-- Migrate existing data to new structure
-- Use businessName as store_name and shopName as fallback
UPDATE vendors SET 
  store_name = COALESCE(NULLIF(shop_name, ''), business_name),
  legal_name = business_name,
  contact_email = business_phone, -- temporary, will need proper email
  contact_phone = business_phone,
  review_notes = admin_notes;

-- Generate slugs for existing vendors
UPDATE vendors SET store_slug = 
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(store_name, '[^a-zA-Z0-9\s\-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  ) || '-' || SUBSTR(id, 1, 8);

-- Now make required fields NOT NULL
ALTER TABLE vendors 
  ALTER COLUMN store_name SET NOT NULL,
  ALTER COLUMN store_slug SET NOT NULL,
  ALTER COLUMN contact_email SET NOT NULL;

-- Create unique indexes
CREATE UNIQUE INDEX vendors_store_name_ci ON vendors (LOWER(store_name));
CREATE UNIQUE INDEX vendors_store_slug_ci ON vendors (LOWER(store_slug));

-- Create vendor audit log table
CREATE TABLE vendor_audit_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  action VARCHAR(40) NOT NULL,
  actor_id VARCHAR(36) REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX vendor_audit_log_vendor_id_idx ON vendor_audit_log(vendor_id);
CREATE INDEX vendor_audit_log_created_at_idx ON vendor_audit_log(created_at);

-- Add denormalized vendor fields to products table
ALTER TABLE products
  ADD COLUMN vendor_display_name VARCHAR(120),
  ADD COLUMN vendor_slug VARCHAR(140);

-- Populate vendor fields in products from vendors table
UPDATE products SET 
  vendor_display_name = v.store_name,
  vendor_slug = v.store_slug
FROM vendors v 
WHERE products.vendor_id = v.id;

-- Create store slug redirects table for handling renames
CREATE TABLE store_slug_redirects (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug VARCHAR(140) NOT NULL UNIQUE,
  new_slug VARCHAR(140) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for redirect lookups
CREATE INDEX store_slug_redirects_old_slug_idx ON store_slug_redirects(old_slug);

-- Insert initial audit log entries for existing vendors
INSERT INTO vendor_audit_log (vendor_id, action, notes)
SELECT id, 'migrated', 'Migrated from legacy vendor structure'
FROM vendors;
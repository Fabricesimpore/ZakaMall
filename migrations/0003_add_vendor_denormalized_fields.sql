-- Add denormalized vendor fields to products table for performance

-- Add vendor display fields to products if they don't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS vendor_display_name varchar(120),
  ADD COLUMN IF NOT EXISTS vendor_slug varchar(140);

-- Create indexes for the new columns to optimize searches
CREATE INDEX IF NOT EXISTS idx_products_vendor_display_name ON products(vendor_display_name);
CREATE INDEX IF NOT EXISTS idx_products_vendor_slug ON products(vendor_slug);

-- Update existing products with vendor display names and slugs
UPDATE products 
SET 
  vendor_display_name = vendors.store_name,
  vendor_slug = vendors.store_slug
FROM vendors
WHERE products.vendor_id = vendors.id
  AND (products.vendor_display_name IS NULL OR products.vendor_slug IS NULL);

-- Add comment to document purpose
COMMENT ON COLUMN products.vendor_display_name IS 'Denormalized vendor store name for quick access and search indexing';
COMMENT ON COLUMN products.vendor_slug IS 'Denormalized vendor slug for direct linking without joins';
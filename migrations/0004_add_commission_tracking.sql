-- Add commission tracking fields to orders table

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS commission_rate decimal(5,2) DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS commission_amount decimal(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS vendor_earnings decimal(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS platform_revenue decimal(12,2) DEFAULT 0.00;

-- Update existing orders to calculate commission fields if they're null
UPDATE orders 
SET 
  commission_rate = COALESCE(commission_rate, 0.15),
  commission_amount = COALESCE(commission_amount, ROUND(total_amount * 0.15, 2)),
  vendor_earnings = COALESCE(vendor_earnings, ROUND(total_amount * 0.85, 2)),
  platform_revenue = COALESCE(platform_revenue, ROUND(total_amount * 0.15, 2))
WHERE commission_rate IS NULL 
  OR commission_amount IS NULL 
  OR vendor_earnings IS NULL 
  OR platform_revenue IS NULL;

-- Add indexes for commission tracking queries
CREATE INDEX IF NOT EXISTS idx_orders_commission_amount ON orders(commission_amount);
CREATE INDEX IF NOT EXISTS idx_orders_platform_revenue ON orders(platform_revenue);

-- Add comments to document purpose
COMMENT ON COLUMN orders.commission_rate IS 'Platform commission rate (as decimal, e.g., 0.15 for 15%)';
COMMENT ON COLUMN orders.commission_amount IS 'Calculated commission amount for platform';
COMMENT ON COLUMN orders.vendor_earnings IS 'Amount vendor receives after commission';
COMMENT ON COLUMN orders.platform_revenue IS 'Platform revenue from this order';
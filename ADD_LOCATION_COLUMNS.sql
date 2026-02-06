-- Add location columns to addresses table
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add location columns to orders table (using names consistent with codebase)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION;

-- If you prefer the specific names requested in the prompt, you can alias them or add them as well:
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_lon DOUBLE PRECISION;

-- Add primary_color to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2563EB';

-- Ensure it's safe to update
COMMENT ON COLUMN restaurants.primary_color IS 'Primary brand color for the restaurant theme';

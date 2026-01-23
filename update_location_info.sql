-- Add location columns to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS location_lat numeric;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS location_lng numeric;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_location_enabled boolean DEFAULT false;

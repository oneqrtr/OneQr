-- Add Social Media and Wifi columns to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS wifi_ssid text,
ADD COLUMN IF NOT EXISTS wifi_password text;

-- RPC to update simple restaurant settings (optional if handled by direct update, but good for encapsulation)
-- We'll assume direct RLS updates for now as per existing pattern

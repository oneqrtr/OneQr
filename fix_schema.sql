-- Add missing description column to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;

-- Add contact info columns to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_call_enabled boolean DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_whatsapp_enabled boolean DEFAULT false;

-- Add hero image column to restaurants if missing
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description text; -- Restaurant description

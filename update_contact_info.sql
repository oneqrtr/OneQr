ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_call_enabled boolean DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_whatsapp_enabled boolean DEFAULT false;

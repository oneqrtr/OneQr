-- Add payment_settings column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{"cash": true, "credit_card": false, "meal_card": {"enabled": false, "methods": []}, "iban": {"enabled": false, "iban_no": "", "account_name": ""}}'::jsonb;

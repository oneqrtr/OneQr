-- Add missing columns to orders table to match the frontend submission
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_provider TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system';

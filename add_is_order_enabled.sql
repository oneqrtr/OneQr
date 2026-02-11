-- Add is_order_enabled column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS is_order_enabled boolean DEFAULT true;

-- Sipariş red sebebi (onay/red özelliği için)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Restoran masaları ve sipariş kapatma için
-- 1. Restaurants: masa sayısı
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS table_count INTEGER DEFAULT 10;

-- 2. Orders: masa numarası (restoran içi siparişlerde)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS table_number INTEGER;

-- status zaten 'pending' | 'processing' | 'completed' | 'cancelled' - sipariş kapatınca 'completed' yapılacak
-- Mevcut CHECK kısıtı varsa 'completed' zaten dahil (supabase_orders_setup.sql'de var)

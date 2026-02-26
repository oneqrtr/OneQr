-- Ürünlere paket/online fiyat alanı (opsiyonel; paket siparişte kullanılır)
-- Supabase SQL Editor'da çalıştırın.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS paket_price NUMERIC DEFAULT NULL;

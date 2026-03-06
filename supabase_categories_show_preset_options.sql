-- Kategori bazında hazır menü ayarları (sipariş notu seçenekleri) gösterilsin mi?
-- Supabase SQL Editor'da çalıştırın.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS show_preset_options BOOLEAN DEFAULT true;

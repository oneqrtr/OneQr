-- Garson paneli PIN (Ayarlar'dan tanımlanır, /garson/[slug] erişimi için)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS waiter_pin TEXT;

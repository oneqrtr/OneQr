-- Varyasyonlar için paket siparişlerinde kullanılacak isteğe bağlı ek ücret.
-- NULL = pakette de mevcut price kullanılır; dolu = paket siparişinde bu ek ücret uygulanır.
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS paket_price NUMERIC DEFAULT NULL;

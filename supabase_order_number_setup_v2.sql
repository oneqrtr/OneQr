-- 1. Sipariş Numarası Sütunu Ekle (Eğer yoksa)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- 2. Otomatik Numara Atama Fonksiyonu (Her gün 1'den başlar)
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Eğer manuel olarak bir numara verilmemişse hesapla
    IF NEW.order_number IS NULL THEN
        SELECT COALESCE(MAX(order_number), 0) + 1
        INTO next_number
        FROM public.orders
        WHERE restaurant_id = NEW.restaurant_id
          AND date_trunc('day', created_at AT TIME ZONE 'UTC') = date_trunc('day', NEW.created_at AT TIME ZONE 'UTC');

        NEW.order_number := next_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger Oluştur
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_daily_order_number();

-- 4. GEÇMİŞ SİPARİŞLER İÇİN NUMARA VERME (Backfill)
-- Bugüne kadar olan numarasız siparişlere tarih sırasına göre numara verir.
WITH daily_orders AS (
  SELECT id, 
         ROW_NUMBER() OVER (
            PARTITION BY restaurant_id, date_trunc('day', created_at AT TIME ZONE 'UTC') 
            ORDER BY created_at
         ) as rn
  FROM public.orders
  WHERE order_number IS NULL
)
UPDATE public.orders
SET order_number = daily_orders.rn
FROM daily_orders
WHERE public.orders.id = daily_orders.id;

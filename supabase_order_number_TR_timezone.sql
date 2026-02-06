-- 1. Sütun Ekle
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- 2. Fonksiyon (Türkiye Saati: Europe/Istanbul)
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    record_date DATE;
BEGIN
    IF NEW.order_number IS NULL THEN
        -- Kaydın oluşturulma zamanını Türkiye saatine çevir
        -- Eğer NEW.created_at NULL gelirse NOW() kullan
        record_date := date(COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul');
        
        SELECT COALESCE(MAX(order_number), 0) + 1
        INTO next_number
        FROM public.orders
        WHERE restaurant_id = NEW.restaurant_id
          -- Veritabanındaki diğer kayıtların da Türkiye saatine göre gününü al
          AND date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') = record_date;
          
        NEW.order_number := next_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_daily_order_number();

-- 4. TÜM GEÇMİŞ SİPARİŞLERİ YENİDEN SIRALA (Backfill)
-- Bu işlem mevcut tüm siparişlerin numaralarını tarih/saat sırasına göre (Türkiye saatiyle günlere bölerek) yeniden verir.
WITH daily_orders AS (
  SELECT id, 
         ROW_NUMBER() OVER (
            PARTITION BY restaurant_id, date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') 
            ORDER BY created_at
         ) as rn
  FROM public.orders
)
UPDATE public.orders
SET order_number = daily_orders.rn
FROM daily_orders
WHERE public.orders.id = daily_orders.id;

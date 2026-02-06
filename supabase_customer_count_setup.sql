-- 1. Müsteri Sipariş Sayacı Sütunu Ekle
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_order_count INTEGER DEFAULT 1;

-- 2. Mevcut Trigger Fonksiyonunu Güncelle (Hem Sipariş No Hem Müşteri Sayacı)
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    record_date DATE;
    phone_count INTEGER;
BEGIN
    -- A. GÜNLÜK SİPARİŞ NUMARASI (Mevcut Mantık)
    IF NEW.order_number IS NULL THEN
        record_date := date(COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul');
        
        SELECT COALESCE(MAX(order_number), 0) + 1
        INTO next_number
        FROM public.orders
        WHERE restaurant_id = NEW.restaurant_id
          AND date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') = record_date;
          
        NEW.order_number := next_number;
    END IF;

    -- B. MÜŞTERİ SİPARİŞ SAYACI (Yeni Mantık)
    IF NEW.customer_phone IS NOT NULL THEN
       -- Bu telefon numarasına ait mevcut siparişleri say
       SELECT COUNT(*) INTO phone_count
       FROM public.orders
       WHERE restaurant_id = NEW.restaurant_id 
         AND customer_phone = NEW.customer_phone;
       
       -- Yeni sipariş olduğu için +1 ekle
       NEW.customer_order_count := phone_count + 1;
    ELSE
       NEW.customer_order_count := 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger (Zaten varsa güncellenmiş fonksiyonu kullanır, tekrar oluşturmaya gerek yok ama emin olmak için)
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_daily_order_number();

-- 4. GEÇMİŞ VERİLERİ DOLDUR (Backfill)
WITH customer_counts AS (
  SELECT id, 
         ROW_NUMBER() OVER (
            PARTITION BY restaurant_id, customer_phone
            ORDER BY created_at
         ) as rn
  FROM public.orders
  WHERE customer_phone IS NOT NULL
)
UPDATE public.orders
SET customer_order_count = customer_counts.rn
FROM customer_counts
WHERE public.orders.id = customer_counts.id;

-- RLS (Güvenlik) Engeli Çözümü:
-- Müşteriler (anonim kullanıcılar) veritabanındaki diğer siparişleri göremediği için sayaçlar hep 1 olarak kalıyordu.
-- Bu fonksiyonu "SECURITY DEFINER" olarak güncelleyerek, fonksiyonun sistem yetkisiyle çalışmasını ve
-- mevcut sipariş sayılarını doğru okumasını sağlıyoruz.

-- 1. Fonksiyonu Güncelle (SECURITY DEFINER Eklendi)
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
RETURNS TRIGGER
SECURITY DEFINER -- <--- KRİTİK DÜZELTME: RLS engelini aşar
SET search_path = public -- Güvenlik önlemi
AS $$
DECLARE
    next_number INTEGER;
    record_date DATE;
    phone_count INTEGER;
BEGIN
    -- A. GÜNLÜK SİPARİŞ NO
    IF NEW.order_number IS NULL THEN
        -- Kayıt tarihini al (NULL ise şu an)
        record_date := date(COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul');
        
        SELECT COALESCE(MAX(order_number), 0) + 1
        INTO next_number
        FROM public.orders
        WHERE restaurant_id = NEW.restaurant_id
          AND date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') = record_date;
          
        NEW.order_number := next_number;
    END IF;

    -- B. MÜŞTERİ SİPARİŞ SAYACI
    IF NEW.customer_phone IS NOT NULL THEN
       -- Telefon numarasına göre say
       SELECT COUNT(*) INTO phone_count
       FROM public.orders
       WHERE restaurant_id = NEW.restaurant_id 
         AND customer_phone = NEW.customer_phone;
       
       NEW.customer_order_count := phone_count + 1;
    ELSE
       NEW.customer_order_count := 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger'ı Yenile (Gerekirse)
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_daily_order_number();

-- 3. GEÇMİŞİ TEKRAR DÜZELT (Backfill)
-- Sayaçlar 1'de takıldığı için bunları tekrar düzeltelim
WITH calculations AS (
    SELECT 
        id,
        restaurant_id,
        created_at,
        customer_phone,
        -- Günlük Sıra No Hesapla
        ROW_NUMBER() OVER (
            PARTITION BY restaurant_id, date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') 
            ORDER BY created_at
        ) as new_order_number,
        -- Müşteri Sayacı Hesapla
        ROW_NUMBER() OVER (
            PARTITION BY restaurant_id, customer_phone
            ORDER BY created_at
        ) as new_customer_count
    FROM public.orders
)
UPDATE public.orders
SET 
    order_number = calculations.new_order_number,
    customer_order_count = CASE 
        WHEN public.orders.customer_phone IS NOT NULL THEN calculations.new_customer_count 
        ELSE 1 
    END
FROM calculations
WHERE public.orders.id = calculations.id;

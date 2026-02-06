-- 1. Sipariş Numarası Sütunu Ekle
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- 2. Otomatik Numara Atama Fonksiyonu (Her gün 1'den başlar)
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Aynı restoran ve aynı gün için en son numarayı bul ve 1 ekle
    -- created_at'in tarih kısmına (day) bakarak grupluyoruz
    SELECT COALESCE(MAX(order_number), 0) + 1
    INTO next_number
    FROM public.orders
    WHERE restaurant_id = NEW.restaurant_id
      AND date_trunc('day', created_at AT TIME ZONE 'UTC') = date_trunc('day', NEW.created_at AT TIME ZONE 'UTC');

    NEW.order_number := next_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger Oluştur (Her yeni sipariş eklenmeden önce çalışır)
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_daily_order_number();

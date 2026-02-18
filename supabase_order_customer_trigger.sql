-- Evden sipariş (source='system') geldiğinde otomatik müşteri oluştur/güncelle ve customer_id bağla
-- Supabase SQL Editor'da çalıştırın. supabase_customers.sql'den sonra.

-- 1. Trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.link_order_to_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cust_id UUID;
    pay_pref TEXT;
BEGIN
    -- Sadece evden/online siparişler için (source='system') ve telefon varsa
    IF NEW.source = 'system' AND NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
        pay_pref := CASE WHEN NEW.payment_method = 'credit_card' THEN 'credit_card' ELSE 'cash' END;
        
        INSERT INTO public.customers (restaurant_id, name, phone, address_detail, location_lat, location_lng, payment_preference)
        VALUES (NEW.restaurant_id, NEW.customer_name, NEW.customer_phone, NEW.address_detail, NEW.location_lat, NEW.location_lng, pay_pref)
        ON CONFLICT (restaurant_id, phone) DO UPDATE SET
            name = EXCLUDED.name,
            address_detail = EXCLUDED.address_detail,
            location_lat = EXCLUDED.location_lat,
            location_lng = EXCLUDED.location_lng,
            payment_preference = EXCLUDED.payment_preference
        RETURNING id INTO cust_id;
        
        NEW.customer_id := cust_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Trigger
DROP TRIGGER IF EXISTS trg_link_order_to_customer ON public.orders;
CREATE TRIGGER trg_link_order_to_customer
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.link_order_to_customer();

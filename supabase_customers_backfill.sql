-- Eski evden siparişlere (source='system') customer_id bağlama
-- supabase_order_customer_trigger.sql çalıştırıldıktan SONRA çalıştırın.

-- Önce müşteri kayıtlarını oluştur, sonra orders'ı güncelle
INSERT INTO public.customers (restaurant_id, name, phone, address_detail, location_lat, location_lng, payment_preference)
SELECT DISTINCT ON (o.restaurant_id, o.customer_phone)
    o.restaurant_id,
    o.customer_name,
    o.customer_phone,
    o.address_detail,
    o.location_lat,
    o.location_lng,
    CASE WHEN o.payment_method = 'credit_card' THEN 'credit_card' ELSE 'cash' END
FROM public.orders o
WHERE o.source = 'system'
  AND o.customer_phone IS NOT NULL
  AND o.customer_phone != ''
  AND o.customer_id IS NULL
ORDER BY o.restaurant_id, o.customer_phone, o.created_at DESC
ON CONFLICT (restaurant_id, phone) DO NOTHING;

-- Siparişlere customer_id ata
UPDATE public.orders o
SET customer_id = c.id
FROM public.customers c
WHERE o.restaurant_id = c.restaurant_id
  AND o.customer_phone = c.phone
  AND o.source = 'system'
  AND o.customer_id IS NULL;

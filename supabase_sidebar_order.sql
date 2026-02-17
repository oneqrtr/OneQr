-- Sol navigasyon sırasını saklamak için (web'de sürükleyerek değiştirilir, mobilde aynı sıra kullanılır)
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS sidebar_order JSONB;

-- Örnek değer: ["/admin", "/admin/orders", "/admin/tables", "/admin/menu", "/admin/report", "/admin/qr", "/admin/theme", "/admin/settings/billing", "/admin/settings"]
-- null ise varsayılan sıra kullanılır.

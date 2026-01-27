-- 1. Super Admin yetkilerini tutacak tabloyu oluştur
CREATE TABLE IF NOT EXISTS public.super_admins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- RLS: Sadece super adminler bu tabloyu görebilir
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view super admins" ON public.super_admins
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

-- 2. Yetkilendirme Fonksiyonu (Parametre olarak mail alır, o maili super admin yapar)
CREATE OR REPLACE FUNCTION set_super_admin(target_email text)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.super_admins (user_id)
    SELECT id FROM auth.users WHERE email = target_email
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. Yetki Kontrolü İçin Helper Fonksiyon
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- 4. Mevcut Fonksiyonları Güncelle (Şifre yerine is_super_admin kontrolü)

-- Get Restaurants
DROP FUNCTION IF EXISTS superadmin_get_restaurants(text);
CREATE OR REPLACE FUNCTION superadmin_get_restaurants()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  created_at timestamptz,
  phone_number text,
  status text,
  plan text,
  plan_ends_at timestamptz,
  owner_id uuid
) 
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT r.id, r.name, r.slug, r.created_at, r.phone_number, r.status, r.plan, r.plan_ends_at, r.owner_id
  FROM restaurants r
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get Payments
DROP FUNCTION IF EXISTS superadmin_get_payments(text);
CREATE OR REPLACE FUNCTION superadmin_get_payments()
RETURNS TABLE (
  id uuid,
  restaurant_name text,
  plan_type text,
  amount numeric,
  sender_name text,
  status text,
  created_at timestamptz,
  is_seen boolean
) 
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT pn.id, r.name, pn.plan_type, pn.amount, pn.sender_name, pn.status, pn.created_at, pn.is_seen
  FROM payment_notifications pn
  JOIN restaurants r ON r.id = pn.restaurant_id
  WHERE pn.status = 'pending'
  ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Approve Payment
DROP FUNCTION IF EXISTS superadmin_approve_payment(text, uuid);
CREATE OR REPLACE FUNCTION superadmin_approve_payment(notification_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
  v_plan_type text;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT restaurant_id, plan_type INTO v_restaurant_id, v_plan_type
  FROM payment_notifications
  WHERE id = notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  UPDATE payment_notifications SET status = 'approved', updated_at = now() WHERE id = notification_id;

  UPDATE restaurants 
  SET 
    plan = v_plan_type,
    plan_ends_at = CASE 
      WHEN v_plan_type = 'monthly' THEN now() + interval '1 month'
      WHEN v_plan_type = 'yearly' THEN now() + interval '1 year'
      ELSE now()
    END,
    status = 'active'
  WHERE id = v_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Reject Payment
DROP FUNCTION IF EXISTS superadmin_reject_payment(text, uuid);
CREATE OR REPLACE FUNCTION superadmin_reject_payment(notification_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE payment_notifications SET status = 'rejected', updated_at = now() WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Mark Seen
DROP FUNCTION IF EXISTS superadmin_mark_payments_seen(text);
CREATE OR REPLACE FUNCTION superadmin_mark_payments_seen()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE payment_notifications
  SET is_seen = true
  WHERE status = 'pending' AND is_seen = false;
END;
$$ LANGUAGE plpgsql;

-- Update Restaurant Details
-- Parametre imzası değiştiği için eskisini (varsa) düşürüyoruz. 
-- Not: Parametre sayılarını tam tutturmak zor olabilir, hata alırsak elle drop ederiz ama genelde gerekmez, yeni fonksiyon oluşur.
CREATE OR REPLACE FUNCTION superadmin_update_restaurant_details(
    target_id uuid,
    new_name text,
    new_slug text,
    new_status text,
    new_plan text,
    new_ends_at timestamptz
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE restaurants
    SET 
        name = new_name,
        slug = new_slug,
        status = new_status,
        plan = new_plan,
        plan_ends_at = new_ends_at
    WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;

-- Delete Restaurant
CREATE OR REPLACE FUNCTION superadmin_delete_restaurant(target_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    DELETE FROM restaurants WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;

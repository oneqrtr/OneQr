-- 1. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    address_type TEXT, -- 'location' or 'manual'
    address_detail TEXT, 
    location_lat NUMERIC,
    location_lng NUMERIC,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL, -- 'cash', 'credit_card'
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Anyone can create an order (Public)
CREATE POLICY "Enable insert for anonymous users" ON public.orders FOR INSERT WITH CHECK (true);

-- Authenticated users (Admins) can view orders for their restaurant
-- This assumes you have a way to link auth.uid() to restaurant_id, or we allow all auth users for now 
-- (You should refine this based on your actual auth schema, e.g., SELECT * FROM restaurants WHERE owner_id = auth.uid())
CREATE POLICY "Enable select for authenticated users" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Enable Realtime
-- This is crucial for the "Ding Ding" notification
alter publication supabase_realtime add table public.orders;

-- Allow Superadmin (kysmehmet@gmail.com) full access to all tables

-- Restaurants
CREATE POLICY "Superadmin full access restaurants" 
ON restaurants 
FOR ALL 
USING ((auth.jwt() ->> 'email') = 'kysmehmet@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'kysmehmet@gmail.com');

-- Categories
CREATE POLICY "Superadmin full access categories" 
ON categories 
FOR ALL 
USING ((auth.jwt() ->> 'email') = 'kysmehmet@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'kysmehmet@gmail.com');

-- Products
CREATE POLICY "Superadmin full access products" 
ON products 
FOR ALL 
USING ((auth.jwt() ->> 'email') = 'kysmehmet@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'kysmehmet@gmail.com');

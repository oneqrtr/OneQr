-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0, -- This represents the price difference (e.g., +60)
  is_available boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policies for Product Variants
-- Public: Viewable by everyone
CREATE POLICY "Product variants are viewable by everyone" 
  ON product_variants FOR SELECT 
  USING (true);

-- Auth: Manageable by restaurant owners
CREATE POLICY "Owners can manage product variants" 
  ON product_variants FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN categories ON categories.id = products.category_id
      JOIN restaurants ON restaurants.id = categories.restaurant_id
      WHERE products.id = product_variants.product_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Add logic to policy to allow insert based on product ownership
CREATE POLICY "Owners can insert product variants" 
  ON product_variants FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN categories ON categories.id = products.category_id
      JOIN restaurants ON restaurants.id = categories.restaurant_id
      WHERE products.id = product_variants.product_id
      AND restaurants.owner_id = auth.uid()
    )
  );

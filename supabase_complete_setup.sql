-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. RESTAURANTS TABLE
create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text not null unique,
  owner_id uuid references auth.users not null,
  logo_url text,
  theme_color text default '#2563EB',
  currency text default '₺',
  description text,
  hero_image_url text,
  phone_number text,
  whatsapp_number text,
  is_call_enabled boolean default false,
  is_whatsapp_enabled boolean default false
);

-- 2. CATEGORIES TABLE
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  display_order integer default 0
);

-- 3. PRODUCTS TABLE
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_available boolean default true,
  display_order integer default 0
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- First, enable RLS on all tables
alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;

-- DROP EXISTING POLICIES TO PREVENT ERRORS
drop policy if exists "Public restaurants are viewable by everyone" on restaurants;
drop policy if exists "Users can create their own restaurant" on restaurants;
drop policy if exists "Users can update their own restaurant" on restaurants;
drop policy if exists "Users can delete their own restaurant" on restaurants;
drop policy if exists "Categories are viewable by everyone" on categories;
drop policy if exists "Owners can manage categories" on categories;
drop policy if exists "Products are viewable by everyone" on products;
drop policy if exists "Owners can manage products" on products;

-- ----------------------------
-- RESTAURANTS POLICIES
-- ----------------------------

-- 1. Select: Everyone can see restaurants (for public menu)
create policy "Public restaurants are viewable by everyone" 
  on restaurants for select 
  using (true);

-- 2. Insert: Authenticated users can create a restaurant, ONLY if they are the owner
create policy "Users can create their own restaurant" 
  on restaurants for insert 
  with check (auth.uid() = owner_id);

-- 3. Update: Owners can update their restaurant
create policy "Users can update their own restaurant" 
  on restaurants for update
  using (auth.uid() = owner_id);

-- 4. Delete: Owners can delete their restaurant
create policy "Users can delete their own restaurant" 
  on restaurants for delete
  using (auth.uid() = owner_id);


-- ----------------------------
-- CATEGORIES POLICIES
-- ----------------------------

-- 1. Select: Everyone can see categories
create policy "Categories are viewable by everyone" 
  on categories for select 
  using (true);

-- 2. All (Insert/Update/Delete): Allowed if user owns the parent restaurant
create policy "Owners can manage categories" 
  on categories for all 
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants
      where restaurants.id = restaurant_id -- uses the NEW row's restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

-- ----------------------------
-- PRODUCTS POLICIES
-- ----------------------------

-- 1. Select: Everyone can see products
create policy "Products are viewable by everyone" 
  on products for select 
  using (true);

-- 2. All (Insert/Update/Delete): Allowed if user owns the parent restaurant (via category)
create policy "Owners can manage products" 
  on products for all 
  using (
    exists (
      select 1 from categories
      join restaurants on restaurants.id = categories.restaurant_id
      where categories.id = products.category_id
      and restaurants.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from categories
      join restaurants on restaurants.id = categories.restaurant_id
      where categories.id = category_id -- uses the NEW row's category_id
      and restaurants.owner_id = auth.uid()
    )
  );


-- ----------------------------
-- STORAGE (OPTIONAL BUT RECOMMENDED)
-- ----------------------------
-- Ensure buckets exist (requires extension or can be done via API, but here we assume 'storage' schema exists)
insert into storage.buckets (id, name, public) 
values ('logos', 'logos', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('products', 'products', true) 
on conflict (id) do nothing;

-- Storage Policies (basic examples) - adjust 'storage.objects' if your Supabase version requires different syntax
-- Allow public select
create policy "Public Access Logos" on storage.objects for select using ( bucket_id = 'logos' );
create policy "Public Access Products" on storage.objects for select using ( bucket_id = 'products' );

-- Allow authenticated upload
create policy "Auth Upload Logos" on storage.objects for insert with check ( bucket_id = 'logos' and auth.role() = 'authenticated' );
create policy "Auth Upload Products" on storage.objects for insert with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

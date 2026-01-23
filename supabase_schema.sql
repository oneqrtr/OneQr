-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. RESTAURANTS TABLE
create table restaurants (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text not null unique,
  owner_id uuid references auth.users not null,
  logo_url text,
  theme_color text default '#2563EB',
  currency text default '₺'
);

-- 2. CATEGORIES TABLE
create table categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  display_order integer default 0
);

-- 3. PRODUCTS TABLE
create table products (
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

-- Enable RLS
alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;

-- Policies for Restaurants
-- Public: Everyone can read restaurants (needed for public menu)
create policy "Public restaurants are viewable by everyone" 
  on restaurants for select 
  using (true);

-- Auth: Owners can insert/update/delete their own restaurant
create policy "Users can manage their own restaurant" 
  on restaurants for all 
  using (auth.uid() = owner_id);

-- Policies for Categories
-- Public: Viewable by everyone
create policy "Categories are viewable by everyone" 
  on categories for select 
  using (true);

-- Auth: Manageable by restaurant owners
create policy "Owners can manage categories" 
  on categories for all 
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

-- Policies for Products
-- Public: Viewable by everyone
create policy "Products are viewable by everyone" 
  on products for select 
  using (true);

-- Auth: Manageable by restaurant owners
create policy "Owners can manage products" 
  on products for all 
  using (
    exists (
      select 1 from categories
      join restaurants on restaurants.id = categories.restaurant_id
      where categories.id = products.category_id
      and restaurants.owner_id = auth.uid()
    )
  );

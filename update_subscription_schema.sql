-- 1. Create Subscriptions Table
create table if not exists subscriptions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  plan_type text not null, -- 'monthly', 'yearly'
  amount numeric not null,
  currency text default '₺',
  status text not null default 'pending', -- 'paid', 'pending', 'failed', 'trial'
  payment_method text,
  period_start timestamp with time zone,
  period_end timestamp with time zone
);

-- 2. Enable RLS
alter table subscriptions enable row level security;

-- 3. Create RLS Policies
-- Owners can view their own subscriptions
create policy "Owners can view their own subscriptions"
  on subscriptions for select
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = subscriptions.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

-- 4. Update Restaurants Table (if not already done by previous migrations)
-- We ensure plan columns exist and have correct defaults
-- Note: 'plan' and 'plan_ends_at' were added previously.
-- We might want to add 'subscription_status' for easier querying
alter table restaurants add column if not exists subscription_status text default 'active';

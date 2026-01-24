-- Create Analytics Table
create table if not exists analytics (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  event_type text not null, -- 'view_menu', 'view_product', 'click_contact'
  metadata jsonb -- For storing extra data like product_id, user_agent (optional)
);

-- Index for faster querying
create index if not exists idx_analytics_restaurant_id on analytics(restaurant_id);
create index if not exists idx_analytics_created_at on analytics(created_at);

-- RLS
alter table analytics enable row level security;

-- Public can insert (record events)
create policy "Everyone can insert analytics"
  on analytics for insert
  with check (true);

-- Owners can view their own analytics
create policy "Owners can view their own analytics"
  on analytics for select
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = analytics.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

-- Create shop_followers table
create table if not exists public.shop_followers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, shop_id)
);

-- Enable RLS
alter table public.shop_followers enable row level security;

-- RLS Policies
create policy "Users can view their own follows"
  on public.shop_followers for select
  using (auth.uid() = user_id);

create policy "Shop owners can view their followers"
  on public.shop_followers for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = shop_followers.shop_id
      and shops.owner_id = auth.uid()
    )
  );

create policy "Users can follow shops"
  on public.shop_followers for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow shops"
  on public.shop_followers for delete
  using (auth.uid() = user_id);

-- Create index
create index shop_followers_user_id_idx on public.shop_followers(user_id);
create index shop_followers_shop_id_idx on public.shop_followers(shop_id);

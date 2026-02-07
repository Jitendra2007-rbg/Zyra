-- 1. Create the 'products' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Security Policies for storage.objects
-- Allow public access to read files in the 'products' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'products' );

-- Allow authenticated users to upload files to the 'products' bucket
-- Note: 'authenticated' role is used by Supabase Auth users
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'products' );

-- Allow users to update their own files (optional)
create policy "Authenticated Update"
on storage.objects for update
to authenticated
with check ( bucket_id = 'products' );

-- 3. Enable Realtime for the 'orders' table
-- This is critical for the shop owner to see updates instantly without refreshing.
-- If the table is not in the publication, real-time won't work.
alter publication supabase_realtime add table orders;

-- 4. Verify/Fix RLS (Row Level Security) for Orders
-- Allow customers to update their own orders (specifically status to 'cancelled')
create policy "Customers can update their own orders"
on orders for update
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

-- Also ensure shop owners can update orders belonging to their shop
create policy "Shop owners can update orders for their shop"
on orders for update
to authenticated
using ( 
  exists (
    select 1 from shops 
    where shops.id = orders.shop_id 
    and shops.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from shops 
    where shops.id = orders.shop_id 
    and shops.owner_id = auth.uid()
  )
);

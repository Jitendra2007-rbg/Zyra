# Supabase Setup Documentation

## Database Configuration

Your application is now connected to your Supabase project:
- **URL**: https://tbibgmnqsfyhmolckvqx.supabase.co
- **Project Ref**: tbibgmnqsfyhmolckvqx

## Required Database Tables

Run the SQL migration below in your Supabase SQL Editor to create all required tables:

### Migration SQL

```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum for user roles
create type public.app_role as enum ('customer', 'shop_owner', 'admin');

-- Create enum for order status
create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create enum for payment status  
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role)
);

-- Create shops table
create table public.shops (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  address text,
  latitude numeric,
  longitude numeric,
  phone text,
  email text,
  is_active boolean default true,
  approved boolean default false,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  total_reviews integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  compare_at_price numeric check (compare_at_price >= 0),
  category text not null,
  image_url text,
  images text[] default '{}',
  stock_quantity integer default 0 check (stock_quantity >= 0),
  is_active boolean default true,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  total_reviews integer default 0,
  sizes text[] default '{}',
  colors text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_number text not null unique,
  status order_status default 'pending',
  total_amount numeric not null check (total_amount >= 0),
  payment_method text not null,
  payment_status payment_status default 'pending',
  delivery_address text not null,
  delivery_latitude numeric,
  delivery_longitude numeric,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  qr_code text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  price numeric not null check (price >= 0),
  size text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cart_items table
create table public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  size text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id, size, color)
);

-- Create addresses table
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  latitude numeric,
  longitude numeric,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reviews table
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  images text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.reviews enable row level security;

-- Create security definer function to check user role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'customer')
  );
  
  return new;
end;
$$;

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_shops_updated_at before update on public.shops
  for each row execute procedure public.handle_updated_at();

create trigger handle_products_updated_at before update on public.products
  for each row execute procedure public.handle_updated_at();

create trigger handle_orders_updated_at before update on public.orders
  for each row execute procedure public.handle_updated_at();

create trigger handle_cart_items_updated_at before update on public.cart_items
  for each row execute procedure public.handle_updated_at();

create trigger handle_addresses_updated_at before update on public.addresses
  for each row execute procedure public.handle_updated_at();

create trigger handle_reviews_updated_at before update on public.reviews
  for each row execute procedure public.handle_updated_at();

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for user_roles
create policy "Users can view their own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- RLS Policies for shops
create policy "Everyone can view approved and active shops"
  on public.shops for select
  using ((is_active = true and approved = true) or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Shop owners can create shops"
  on public.shops for insert
  with check (auth.uid() = owner_id and public.has_role(auth.uid(), 'shop_owner'));

create policy "Shop owners can update their own shops"
  on public.shops for update
  using (auth.uid() = owner_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete shops"
  on public.shops for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
create policy "Everyone can view active products"
  on public.products for select
  using (
    is_active = true or 
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
    ) or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Shop owners can create products"
  on public.products for insert
  with check (
    exists (
      select 1 from public.shops
      where shops.id = shop_id
      and shops.owner_id = auth.uid()
    )
  );

create policy "Shop owners can update their products"
  on public.products for update
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
    ) or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Shop owners can delete their products"
  on public.products for delete
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
    ) or
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for orders
create policy "Users can view their own orders"
  on public.orders for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
      and shops.owner_id = auth.uid()
    ) or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Shop owners can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
      and shops.owner_id = auth.uid()
    ) or
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for order_items
create policy "Users can view their order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (
        orders.user_id = auth.uid() or
        exists (
          select 1 from public.shops
          where shops.id = orders.shop_id
          and shops.owner_id = auth.uid()
        ) or
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

create policy "Users can create order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_id
      and orders.user_id = auth.uid()
    )
  );

-- RLS Policies for cart_items
create policy "Users can view their own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can manage their own cart"
  on public.cart_items for all
  using (auth.uid() = user_id);

-- RLS Policies for addresses
create policy "Users can view their own addresses"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "Users can manage their own addresses"
  on public.addresses for all
  using (auth.uid() = user_id);

-- RLS Policies for reviews
create policy "Everyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
create index profiles_email_idx on public.profiles(email);
create index user_roles_user_id_idx on public.user_roles(user_id);
create index shops_owner_id_idx on public.shops(owner_id);
create index shops_is_active_idx on public.shops(is_active);
create index products_shop_id_idx on public.products(shop_id);
create index products_category_idx on public.products(category);
create index products_is_active_idx on public.products(is_active);
create index orders_user_id_idx on public.orders(user_id);
create index orders_shop_id_idx on public.orders(shop_id);
create index orders_status_idx on public.orders(status);
create index orders_order_number_idx on public.orders(order_number);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
create index cart_items_user_id_idx on public.cart_items(user_id);
create index cart_items_product_id_idx on public.cart_items(product_id);
create index addresses_user_id_idx on public.addresses(user_id);
create index reviews_product_id_idx on public.reviews(product_id);
create index reviews_user_id_idx on public.reviews(user_id);
```

## Database Tables

### 1. profiles
Stores user profile information
- `id` (uuid, PK): References auth.users
- `email` (text): User email
- `full_name` (text): User's full name
- `avatar_url` (text): Profile picture URL
- `phone` (text): Contact number

### 2. user_roles
Manages user roles for access control
- `id` (uuid, PK)
- `user_id` (uuid, FK): References auth.users
- `role` (app_role): 'customer', 'shop_owner', or 'admin'

### 3. shops
Stores shop/store information
- `id` (uuid, PK)
- `owner_id` (uuid, FK): References auth.users
- `name` (text): Shop name
- `description` (text): Shop description
- `logo_url`, `banner_url` (text): Shop images
- `address` (text): Physical address
- `latitude`, `longitude` (numeric): Location coordinates
- `phone`, `email` (text): Contact information
- `is_active` (boolean): Shop status
- `rating` (numeric): Average rating (0-5)
- `total_reviews` (integer): Number of reviews

### 4. products
Stores product listings
- `id` (uuid, PK)
- `shop_id` (uuid, FK): References shops
- `name` (text): Product name
- `description` (text): Product description
- `price` (numeric): Current price
- `compare_at_price` (numeric): Original price for discounts
- `category` (text): Product category
- `image_url` (text): Main product image
- `images` (text[]): Additional product images
- `stock_quantity` (integer): Available stock
- `is_active` (boolean): Product visibility
- `rating` (numeric): Average rating
- `total_reviews` (integer): Number of reviews
- `sizes`, `colors` (text[]): Available variants

### 5. orders
Stores customer orders
- `id` (uuid, PK)
- `user_id` (uuid, FK): References auth.users
- `shop_id` (uuid, FK): References shops
- `order_number` (text): Unique order identifier
- `status` (order_status): Order progress
- `total_amount` (numeric): Order total
- `payment_method`, `payment_status`: Payment details
- `delivery_address` (text): Delivery location
- `delivery_latitude`, `delivery_longitude`: GPS coordinates
- `customer_name`, `customer_phone`, `customer_email`: Customer info
- `qr_code` (text): QR code for order verification
- `notes` (text): Additional instructions

### 6. order_items
Stores items within each order
- `id` (uuid, PK)
- `order_id` (uuid, FK): References orders
- `product_id` (uuid, FK): References products
- `quantity` (integer): Number of items
- `price` (numeric): Price at time of purchase
- `size`, `color` (text): Product variants

### 7. cart_items
Stores shopping cart items
- `id` (uuid, PK)
- `user_id` (uuid, FK): References auth.users
- `product_id` (uuid, FK): References products
- `quantity` (integer): Number of items
- `size`, `color` (text): Product variants

### 8. addresses
Stores delivery addresses
- `id` (uuid, PK)
- `user_id` (uuid, FK): References auth.users
- `full_name`, `phone`: Recipient information
- `address_line1`, `address_line2`: Street address
- `city`, `state`, `postal_code`, `country`: Location
- `latitude`, `longitude`: GPS coordinates
- `is_default` (boolean): Default address flag

### 9. reviews
Stores product reviews
- `id` (uuid, PK)
- `user_id` (uuid, FK): References auth.users
- `product_id` (uuid, FK): References products
- `rating` (integer): Rating (1-5)
- `comment` (text): Review text
- `images` (text[]): Review images

## API Endpoints

All endpoints use the Supabase client and are type-safe. Examples:

### Authentication
```typescript
// Sign up
supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })

// Sign in
supabase.auth.signInWithPassword({ email, password })

// Sign out
supabase.auth.signOut()
```

### Products
```typescript
// Get all products
supabase.from('products').select('*, shops(*)').eq('is_active', true)

// Get product by ID
supabase.from('products').select('*, shops(*)').eq('id', productId).single()

// Create product (shop owner)
supabase.from('products').insert({ shop_id, name, price, ... })

// Update product
supabase.from('products').update({ name, price, ... }).eq('id', productId)
```

### Orders
```typescript
// Create order
supabase.from('orders').insert({ user_id, shop_id, order_number, ... })

// Get user orders
supabase.from('orders').select('*, order_items(*, products(*))').eq('user_id', userId)

// Get shop orders
supabase.from('orders').select('*, order_items(*, products(*))').eq('shop_id', shopId)

// Update order status
supabase.from('orders').update({ status }).eq('id', orderId)
```

### Cart
```typescript
// Add to cart
supabase.from('cart_items').insert({ user_id, product_id, quantity, size, color })

// Get cart
supabase.from('cart_items').select('*, products(*, shops(*))').eq('user_id', userId)

// Update quantity
supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)

// Remove from cart
supabase.from('cart_items').delete().eq('id', cartItemId)
```

### Shops
```typescript
// Get all shops
supabase.from('shops').select('*').eq('is_active', true)

// Create shop (requires shop_owner role)
supabase.from('shops').insert({ owner_id, name, description, ... })

// Update shop
supabase.from('shops').update({ name, description, ... }).eq('id', shopId)
```

## Setup Steps

1. **Run the SQL Migration**: Copy the entire SQL migration above and run it in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

2. **Configure Auth Settings**: Go to Authentication → URL Configuration in your Supabase dashboard and set:
   - Site URL: Your deployed app URL or `http://127.0.0.1:8080` for development
   - Redirect URLs: Add your app's URLs

3. **Disable Email Confirmation** (Optional for testing): Go to Authentication → Providers → Email and disable "Confirm email"

4. **Test the Connection**: The app will automatically connect using the credentials in `src/integrations/supabase/client.ts`

## Security

- All tables have Row Level Security (RLS) enabled
- Roles are stored in a separate `user_roles` table to prevent privilege escalation
- Security definer functions are used to check permissions without recursive RLS issues
- Proper foreign key constraints and indexes for performance
- Automatic profile and role creation on user signup via database triggers

## Next Steps

After running the migration, you can:
1. Sign up new users (they'll automatically get a profile and customer role)
2. Manually assign shop_owner or admin roles via SQL if needed
3. Start adding shops, products, and testing the e-commerce flow

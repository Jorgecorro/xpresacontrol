-- XpresaControl Database Schema
-- Execute this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Extension of Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ORDER STATUS ENUM
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('cotizado', 'pendiente', 'pagado', 'enviado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temp_id SERIAL,
  previo_number INTEGER UNIQUE,
  vendedor_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  customer_email TEXT,
  payment_account TEXT,
  anticipo DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status order_status DEFAULT 'pendiente',
  image_url TEXT,
  calcetas_color TEXT,
  regalo_detalle TEXT,
  shipping_guide TEXT,
  shipping_carrier TEXT,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Vendedores can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores can insert their orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores can update their orders" ON orders
  FOR UPDATE USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores can delete their orders" ON orders
  FOR DELETE USING (auth.uid() = vendedor_id);

-- 4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies (inherit from parent order)
CREATE POLICY "Users can manage their order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.vendedor_id = auth.uid()
    )
  );

-- 5. TRIGGER FOR COMMISSION CALCULATION (5%)
CREATE OR REPLACE FUNCTION calculate_commission() RETURNS TRIGGER AS $$
BEGIN
  -- Calculate commission when shipping info is provided
  IF NEW.shipping_guide IS NOT NULL AND NEW.shipping_carrier IS NOT NULL 
     AND (OLD.shipping_guide IS NULL OR OLD.shipping_carrier IS NULL) THEN
    NEW.commission_earned := NEW.total_amount * 0.05;
    NEW.status := 'enviado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS tr_calculate_commission ON orders;
CREATE TRIGGER tr_calculate_commission
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION calculate_commission();

-- 6. TRIGGER FOR PREVIO NUMBER ASSIGNMENT
CREATE OR REPLACE FUNCTION assign_previo_number() RETURNS TRIGGER AS $$
DECLARE
  next_previo INTEGER;
BEGIN
  -- Assign previo number when image is uploaded
  IF NEW.image_url IS NOT NULL AND OLD.image_url IS NULL AND NEW.previo_number IS NULL THEN
    SELECT COALESCE(MAX(previo_number), 1000) + 1 INTO next_previo FROM orders;
    NEW.previo_number := next_previo;
    NEW.status := 'pagado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS tr_assign_previo_number ON orders;
CREATE TRIGGER tr_assign_previo_number
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION assign_previo_number();

-- 7. FUNCTION TO CREATE PROFILE ON USER SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. STORAGE BUCKET FOR IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-images', 'order-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow public viewing" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-images');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-images' 
    AND auth.role() = 'authenticated'
  );
-- 9. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  account TEXT NOT NULL,
  vendedor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Vendedores can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores can update their own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores can delete their own expenses" ON expenses
  FOR DELETE USING (auth.uid() = vendedor_id);

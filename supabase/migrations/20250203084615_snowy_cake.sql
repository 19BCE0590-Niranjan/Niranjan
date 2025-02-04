/*
  # Add order tracking and billing features

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `due_date` (date)
      - `total_amount` (numeric)
      - `payment_status` (text)
      - `notes` (text)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `item_type` (text)
      - `quantity` (integer)
      - `status` (text)
      - `price` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (matching existing customer policies)
*/

-- Create order status enum
CREATE TYPE order_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'delivered'
);

-- Create payment status enum
CREATE TYPE payment_status AS ENUM (
  'paid',
  'unpaid'
);

-- Create item type enum
CREATE TYPE item_type AS ENUM (
  'shirt',
  'pants',
  'other'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  due_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  notes text,
  CONSTRAINT positive_amount CHECK (total_amount >= 0)
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  quantity integer NOT NULL,
  status order_status NOT NULL DEFAULT 'not_started',
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_price CHECK (price >= 0)
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Allow public read access on orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on orders"
  ON orders
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on orders"
  ON orders
  FOR DELETE
  TO public
  USING (true);

-- Create policies for order items
CREATE POLICY "Allow public read access on order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on order items"
  ON order_items
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on order items"
  ON order_items
  FOR DELETE
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_updated_at();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_updated_at();
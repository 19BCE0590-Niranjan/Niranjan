/*
  # Update customers table RLS policies for public access

  1. Changes
    - Add public access policies for CRUD operations
    - Ensure idempotent creation of trigger function and trigger

  2. Security
    - Enable RLS on customers table
    - Add policies for unrestricted public access
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  shirt_measurements text,
  pants_measurements text,
  other_measurements text,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON customers;
DROP POLICY IF EXISTS "Allow public insert access" ON customers;
DROP POLICY IF EXISTS "Allow public update access" ON customers;
DROP POLICY IF EXISTS "Allow public delete access" ON customers;

-- Create new policies for public access
CREATE POLICY "Allow public read access"
  ON customers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON customers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON customers
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access"
  ON customers
  FOR DELETE
  TO public
  USING (true);

-- Create or replace function (this is already idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
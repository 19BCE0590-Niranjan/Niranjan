/*
  # Add partial payment support

  1. Changes
    - Update payment_status enum to include 'partial_payment'
    - Add amount_paid and amount_pending columns to orders table
    - Add check constraints for payment amounts
    - Update existing orders to set amount_pending equal to total_amount

  2. Security
    - Maintain existing RLS policies
*/

-- Update payment_status enum
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partial_payment';

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS amount_pending numeric(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED;

-- Add check constraints
ALTER TABLE orders
ADD CONSTRAINT amount_paid_non_negative CHECK (amount_paid >= 0),
ADD CONSTRAINT amount_paid_not_exceeding CHECK (amount_paid <= total_amount);
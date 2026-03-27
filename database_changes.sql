-- SQL Script for Database Changes
-- Run this in your Supabase SQL Editor

-- 1. Update profiles table to include Stripe information
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Ensure payment_status is correct
-- (Already exists in your schema but good to verify)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- 3. Create a table for payments if you want to track history
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  amount DECIMAL(10, 2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Set up RLS for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" 
ON payments FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

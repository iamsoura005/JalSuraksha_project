-- Fix RLS policy for users table to allow user registration
-- This script fixes the "new row violates row-level security policy for table 'users'" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Create the missing INSERT policy for user registration
-- This allows authenticated users to insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
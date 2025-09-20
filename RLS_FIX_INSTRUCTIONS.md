# Fix for "new row violates row-level security policy for table 'users'" Error

## Problem
When users try to sign up, they encounter the error: **"new row violates row-level security policy for table 'users'"**

This happens because the Supabase database has Row Level Security (RLS) enabled on the `users` table, but there's no INSERT policy that allows new users to create their profile during registration.

## Solution

### Option 1: Quick Fix (Recommended)
Run this SQL command in your Supabase SQL Editor:

```sql
-- Create the missing INSERT policy for user registration
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Option 2: Complete Database Setup
If you haven't set up your database yet, run the complete schema from `database/schema.sql` which now includes the correct RLS policies.

### Option 3: Use the Fix Script
Run the SQL script from `database/fix_rls_policy.sql` in your Supabase SQL Editor.

## How to Apply the Fix

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `kxnjksjposqkkxofcmjf`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix**
   - Copy and paste the SQL command from Option 1 above
   - Click "Run" to execute the query

4. **Verify the Fix**
   - You should see a success message
   - The policy will now allow authenticated users to insert their own profile

## What This Policy Does

```sql
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

- **FOR INSERT**: This policy applies to INSERT operations (creating new records)
- **WITH CHECK (auth.uid() = id)**: This ensures that users can only insert records where the `id` matches their authenticated user ID (`auth.uid()`)
- This prevents users from creating profiles for other users while allowing them to create their own profile during signup

## Testing the Fix

1. **Try to sign up again** with the same or different credentials
2. **The error should be gone** and user registration should work
3. **Check the users table** in Supabase to confirm the user profile was created

## Additional RLS Policies

The complete schema includes these policies for the users table:

- **SELECT**: `Users can view own profile` - Users can only see their own profile
- **INSERT**: `Users can insert own profile` - Users can create their own profile during signup
- **UPDATE**: `Users can update own profile` - Users can update their own profile information

## Troubleshooting

If you still encounter issues:

1. **Check if the policy exists**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
   ```

2. **Verify RLS is enabled**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'users' AND schemaname = 'public';
   ```

3. **Check user authentication**:
   - Ensure the user is properly authenticated before trying to insert
   - Verify that `auth.uid()` returns a valid UUID

## Prevention

To prevent this issue in the future:
- Always create INSERT policies when enabling RLS on tables that need user-generated content
- Test user registration flow after setting up RLS policies
- Use the complete schema file which includes all necessary policies

---

**Status**: ✅ Fixed - User registration should now work properly
**Last Updated**: January 2025
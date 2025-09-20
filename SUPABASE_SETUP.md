# Supabase Setup Instructions

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email
4. Click "New Project"
5. Choose your organization (or create one)
6. Fill in project details:
   - **Name**: `jalsuraksha-project` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
7. Click "Create new project"
8. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role secret key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Weather API (Optional - for weather features)
NEXT_PUBLIC_WEATHER_API_KEY=your-openweather-api-key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-generate-a-random-string
```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of the `database/schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. You should see "Success. No rows returned" message

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your domain:
   - For development: `http://localhost:3000`
   - For production: `https://your-vercel-app.vercel.app`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://your-vercel-app.vercel.app/auth/callback` (for production)

## Step 6: Enable Row Level Security (RLS)

The schema already includes RLS policies, but verify they're enabled:

1. Go to **Authentication** → **Policies**
2. You should see policies for each table
3. If not, run the schema again

## Step 7: Test the Connection

1. Save your `.env.local` file
2. Restart your development server: `npm run dev`
3. Open your app in the browser
4. Look for the connection status indicator in the bottom-left corner
5. It should show "Supabase connected successfully!" in green

## Step 8: Optional - Set Up Weather API

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key
4. Add it to your `.env.local` file as `NEXT_PUBLIC_WEATHER_API_KEY`

## Step 9: Deploy to Vercel

1. In your Vercel dashboard, go to your project settings
2. Add the same environment variables from `.env.local`
3. Make sure to update the `NEXTAUTH_URL` to your production URL
4. Redeploy your application

## Troubleshooting

### Connection Test Fails
- Double-check your environment variables
- Ensure there are no extra spaces or quotes
- Restart your development server after changing `.env.local`
- Check the browser console for detailed error messages

### Authentication Issues
- Verify your Site URL and Redirect URLs in Supabase settings
- Make sure RLS policies are properly set up
- Check that the `users` table exists

### Database Errors
- Ensure the schema was executed successfully
- Check that all tables were created in the **Table Editor**
- Verify that RLS is enabled on all tables

## Database Tables Created

After running the schema, you should see these tables in your Supabase dashboard:

- `users` - User profiles
- `water_reports` - Water quality test results
- `community_reports` - Community complaints and reports
- `weather_data` - Weather information
- `water_treatment_facilities` - Treatment facility data
- `predictive_analysis` - ML analysis results
- `agriculture_impacts` - Agricultural impact assessments

## Next Steps

Once Supabase is connected:

1. Test user registration and login
2. Try submitting a water quality report
3. Test the community reporting feature
4. Check the analytics dashboard
5. Verify data is being stored in Supabase tables

## Support

If you encounter issues:

1. Check the Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
2. Look at the browser console for error messages
3. Check the connection test component for specific error details
4. Ensure all environment variables are correctly set
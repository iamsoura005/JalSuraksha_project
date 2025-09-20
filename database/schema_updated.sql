-- Updated schema with OAuth and Web3 support

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  wallet_address TEXT UNIQUE,
  auth_method TEXT CHECK (auth_method IN ('email', 'phone', 'oauth', 'web3')) DEFAULT 'email',
  provider TEXT, -- oauth provider (google, github, etc.)
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water reports table
CREATE TABLE IF NOT EXISTS public.water_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sample_id TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  lead DECIMAL(10, 4) NOT NULL,
  arsenic DECIMAL(10, 4) NOT NULL,
  cadmium DECIMAL(10, 4) NOT NULL,
  chromium DECIMAL(10, 4) NOT NULL,
  copper DECIMAL(10, 4) NOT NULL,
  iron DECIMAL(10, 4) NOT NULL,
  zinc DECIMAL(10, 4) NOT NULL,
  hpi DECIMAL(10, 4) NOT NULL,
  hei DECIMAL(10, 4) NOT NULL,
  cd DECIMAL(10, 4) NOT NULL,
  ef DECIMAL(10, 4) NOT NULL,
  safety_level TEXT CHECK (safety_level IN ('Safe', 'Moderate', 'High', 'Critical')) NOT NULL,
  risk_assessment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community reports table
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('complaint', 'report', 'suggestion', 'emergency')) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  attachments TEXT[],
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather data table
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2) NOT NULL,
  precipitation DECIMAL(8, 2) NOT NULL,
  wind_speed DECIMAL(5, 2) NOT NULL,
  weather_condition TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water treatment facilities table
CREATE TABLE IF NOT EXISTS public.water_treatment_facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  contact_info TEXT,
  services TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive analysis table
CREATE TABLE IF NOT EXISTS public.predictive_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  analysis_type TEXT CHECK (analysis_type IN ('trend', 'seasonal', 'prediction')) NOT NULL,
  parameters JSONB NOT NULL,
  results JSONB NOT NULL,
  confidence_score DECIMAL(5, 4) NOT NULL,
  warning_level TEXT CHECK (warning_level IN ('none', 'low', 'medium', 'high', 'critical')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_treatment_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- CRITICAL: Allow authenticated users to insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Water reports policies
CREATE POLICY "Users can view own water reports" ON public.water_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water reports" ON public.water_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water reports" ON public.water_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Community reports policies
CREATE POLICY "Users can view all community reports" ON public.community_reports
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own community reports" ON public.community_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own community reports" ON public.community_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Weather data policies (public read access)
CREATE POLICY "Anyone can view weather data" ON public.weather_data
  FOR SELECT USING (true);

-- Water treatment facilities policies (public read access)
CREATE POLICY "Anyone can view facilities" ON public.water_treatment_facilities
  FOR SELECT USING (true);

-- Predictive analysis policies (public read access)
CREATE POLICY "Anyone can view predictive analysis" ON public.predictive_analysis
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_water_reports_user_id ON public.water_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_water_reports_location ON public.water_reports(location);
CREATE INDEX IF NOT EXISTS idx_community_reports_user_id ON public.community_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_category ON public.community_reports(category);

-- Create storage bucket for community report attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-attachments', 'community-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community attachments
CREATE POLICY "Anyone can view attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-attachments');

CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'community-attachments' AND auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_reports_updated_at BEFORE UPDATE ON public.water_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_reports_updated_at BEFORE UPDATE ON public.community_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_treatment_facilities_updated_at BEFORE UPDATE ON public.water_treatment_facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
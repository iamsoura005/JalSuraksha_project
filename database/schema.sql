-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water reports table
CREATE TABLE public.water_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sample_id TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  lead DECIMAL(10, 6) NOT NULL,
  arsenic DECIMAL(10, 6) NOT NULL,
  cadmium DECIMAL(10, 6) NOT NULL,
  chromium DECIMAL(10, 6) NOT NULL,
  copper DECIMAL(10, 6) NOT NULL,
  iron DECIMAL(10, 6) NOT NULL,
  zinc DECIMAL(10, 6) NOT NULL,
  hpi DECIMAL(10, 4) NOT NULL,
  hei DECIMAL(10, 4) NOT NULL,
  cd DECIMAL(10, 4) NOT NULL,
  ef DECIMAL(10, 4) NOT NULL,
  safety_level TEXT CHECK (safety_level IN ('Safe', 'Moderate', 'High', 'Critical')) NOT NULL,
  risk_assessment TEXT,
  is_ml_analysis BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community reports table
CREATE TABLE public.community_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE public.weather_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  precipitation DECIMAL(8, 2),
  wind_speed DECIMAL(6, 2),
  weather_condition TEXT,
  air_quality_index INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water treatment facilities table
CREATE TABLE public.water_treatment_facilities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  capacity INTEGER,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  contact_info JSONB,
  services TEXT[],
  operating_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive analysis table
CREATE TABLE public.predictive_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location TEXT NOT NULL,
  analysis_type TEXT CHECK (analysis_type IN ('trend', 'seasonal', 'prediction')) NOT NULL,
  parameters JSONB NOT NULL,
  results JSONB NOT NULL,
  confidence_score DECIMAL(5, 4),
  warning_level TEXT CHECK (warning_level IN ('none', 'low', 'medium', 'high', 'critical')) DEFAULT 'none',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agriculture impact assessments table
CREATE TABLE public.agriculture_impacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  crop_type TEXT,
  contamination_level TEXT CHECK (contamination_level IN ('Safe', 'Moderate', 'High', 'Critical')),
  affected_area DECIMAL(10, 2),
  estimated_yield_loss DECIMAL(5, 2),
  recommended_actions TEXT[],
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_water_reports_user_id ON public.water_reports(user_id);
CREATE INDEX idx_water_reports_location ON public.water_reports(location);
CREATE INDEX idx_water_reports_safety_level ON public.water_reports(safety_level);
CREATE INDEX idx_water_reports_created_at ON public.water_reports(created_at);

CREATE INDEX idx_community_reports_user_id ON public.community_reports(user_id);
CREATE INDEX idx_community_reports_status ON public.community_reports(status);
CREATE INDEX idx_community_reports_priority ON public.community_reports(priority);
CREATE INDEX idx_community_reports_created_at ON public.community_reports(created_at);

CREATE INDEX idx_weather_data_location ON public.weather_data(location);
CREATE INDEX idx_weather_data_recorded_at ON public.weather_data(recorded_at);

CREATE INDEX idx_predictive_analysis_location ON public.predictive_analysis(location);
CREATE INDEX idx_predictive_analysis_type ON public.predictive_analysis(analysis_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_treatment_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agriculture_impacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read and update their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Water reports policies
CREATE POLICY "Users can view all water reports" ON public.water_reports
  FOR SELECT USING (true);

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

-- Weather data is publicly readable
CREATE POLICY "Weather data is publicly readable" ON public.weather_data
  FOR SELECT USING (true);

-- Water treatment facilities are publicly readable
CREATE POLICY "Facilities are publicly readable" ON public.water_treatment_facilities
  FOR SELECT USING (true);

-- Predictive analysis is publicly readable
CREATE POLICY "Predictive analysis is publicly readable" ON public.predictive_analysis
  FOR SELECT USING (true);

-- Agriculture impacts are publicly readable
CREATE POLICY "Agriculture impacts are publicly readable" ON public.agriculture_impacts
  FOR SELECT USING (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_water_reports_updated_at
  BEFORE UPDATE ON public.water_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_community_reports_updated_at
  BEFORE UPDATE ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_water_treatment_facilities_updated_at
  BEFORE UPDATE ON public.water_treatment_facilities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
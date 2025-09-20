import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxnjksjposqkkxofcmjf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bmprc2pwb3Nxa2t4b2ZjbWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzA0ODAsImV4cCI6MjA3MzkwNjQ4MH0.50mePTW7aoqDDWrBkmj_xtXZFxxdnkv9usUCaG2hbG8';

// Validate that we have proper URLs (not placeholder values)
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return !url.includes('placeholder') && !url.includes('your-project');
  } catch {
    return false;
  }
};

const isValidKey = (key: string) => {
  return key && key.length > 10 && !key.includes('placeholder') && !key.includes('your-anon-key');
};

// Only create client if we have valid credentials
export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://kxnjksjposqkkxofcmjf.supabase.co',
  isValidKey(supabaseAnonKey) ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bmprc2pwb3Nxa2t4b2ZjbWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzA0ODAsImV4cCI6MjA3MzkwNjQ4MH0.50mePTW7aoqDDWrBkmj_xtXZFxxdnkv9usUCaG2hbG8'
);

// Database Types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WaterReport {
  id: string;
  user_id: string;
  sample_id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  lead: number;
  arsenic: number;
  cadmium: number;
  chromium: number;
  copper: number;
  iron: number;
  zinc: number;
  hpi: number;
  hei: number;
  cd: number;
  ef: number;
  safety_level: 'Safe' | 'Moderate' | 'High' | 'Critical';
  risk_assessment: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'complaint' | 'report' | 'suggestion' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  location?: string;
  latitude?: number;
  longitude?: number;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface WeatherData {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_condition: string;
  recorded_at: string;
}

export interface WaterTreatmentFacility {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  contact_info?: string;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface PredictiveAnalysis {
  id: string;
  location: string;
  analysis_type: 'trend' | 'seasonal' | 'prediction';
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  confidence_score: number;
  warning_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}
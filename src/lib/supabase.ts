import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
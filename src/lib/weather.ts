import { supabase } from './supabase';

export interface WeatherData {
  id?: string;
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_condition: string;
  air_quality_index?: number;
  recorded_at: string;
}

export interface WaterTreatmentFacility {
  id?: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  contact_info?: string;
  services: string[];
  operating_hours?: string;
}

export interface AgricultureImpact {
  id?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  crop_type?: string;
  contamination_level: 'Safe' | 'Moderate' | 'High' | 'Critical';
  affected_area: number;
  estimated_yield_loss: number;
  recommended_actions: string[];
  assessment_date: string;
}

// Fetch weather data from OpenWeatherMap API
export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (!API_KEY) {
      console.warn('Weather API key not configured');
      return null;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error('Weather API request failed');

    const data = await response.json();

    const weatherData: WeatherData = {
      location: data.name,
      latitude: lat,
      longitude: lon,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      precipitation: data.rain?.['1h'] || 0,
      wind_speed: data.wind.speed,
      weather_condition: data.weather[0].description,
      recorded_at: new Date().toISOString()
    };

    // Store in database
    await storeWeatherData(weatherData);

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

// Store weather data in database
export const storeWeatherData = async (weatherData: WeatherData) => {
  try {
    const { error } = await supabase
      .from('weather_data')
      .insert(weatherData);

    if (error) throw error;
  } catch (error) {
    console.error('Error storing weather data:', error);
  }
};

// Get recent weather data from database
export const getWeatherData = async (location?: string, limit: number = 10) => {
  try {
    let query = supabase
      .from('weather_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get water treatment facilities
export const getWaterTreatmentFacilities = async (location?: string) => {
  try {
    let query = supabase
      .from('water_treatment_facilities')
      .select('*')
      .eq('status', 'active');

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Add water treatment facility
export const addWaterTreatmentFacility = async (facility: Omit<WaterTreatmentFacility, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('water_treatment_facilities')
      .insert(facility)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get agriculture impact assessments
export const getAgricultureImpacts = async (location?: string) => {
  try {
    let query = supabase
      .from('agriculture_impacts')
      .select('*')
      .order('assessment_date', { ascending: false });

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Add agriculture impact assessment
export const addAgricultureImpact = async (impact: Omit<AgricultureImpact, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('agriculture_impacts')
      .insert(impact)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Calculate agriculture impact based on water quality
export const calculateAgricultureImpact = (
  hpi: number,
  hei: number,
  cropType: string = 'general',
  area: number = 1
): AgricultureImpact => {
  let contamination_level: 'Safe' | 'Moderate' | 'High' | 'Critical';
  let estimated_yield_loss: number;
  let recommended_actions: string[] = [];

  // Determine contamination level based on HPI and HEI
  if (hpi < 100 && hei < 1) {
    contamination_level = 'Safe';
    estimated_yield_loss = 0;
    recommended_actions = ['Continue regular monitoring', 'Maintain current irrigation practices'];
  } else if (hpi < 200 && hei < 2) {
    contamination_level = 'Moderate';
    estimated_yield_loss = 10;
    recommended_actions = [
      'Implement water treatment before irrigation',
      'Consider crop rotation with resistant varieties',
      'Regular soil testing recommended'
    ];
  } else if (hpi < 300 && hei < 3) {
    contamination_level = 'High';
    estimated_yield_loss = 25;
    recommended_actions = [
      'Immediate water treatment required',
      'Switch to contamination-resistant crops',
      'Implement soil remediation measures',
      'Consider alternative water sources'
    ];
  } else {
    contamination_level = 'Critical';
    estimated_yield_loss = 50;
    recommended_actions = [
      'Stop irrigation immediately',
      'Seek alternative water sources',
      'Implement emergency soil remediation',
      'Consider crop insurance claims',
      'Consult agricultural extension services'
    ];
  }

  // Adjust based on crop type
  const cropSensitivity: Record<string, number> = {
    'rice': 1.2,
    'wheat': 1.0,
    'vegetables': 1.5,
    'fruits': 1.3,
    'general': 1.0
  };

  const sensitivity = cropSensitivity[cropType.toLowerCase()] || 1.0;
  estimated_yield_loss = Math.min(estimated_yield_loss * sensitivity, 100);

  return {
    location: 'Assessment Location',
    crop_type: cropType,
    contamination_level,
    affected_area: area,
    estimated_yield_loss: Math.round(estimated_yield_loss),
    recommended_actions,
    assessment_date: new Date().toISOString()
  };
};

// Get weather forecast (mock implementation)
export const getWeatherForecast = async (lat: number, lon: number, days: number = 5) => {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (!API_KEY) {
      // Return mock data if API key not available
      return {
        data: Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
          temperature: 25 + Math.random() * 10,
          humidity: 60 + Math.random() * 30,
          precipitation: Math.random() * 10,
          weather_condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
        })),
        error: null
      };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error('Weather forecast API request failed');

    const data = await response.json();
    
    const forecast = data.list.slice(0, days * 8).filter((_: unknown, index: number) => index % 8 === 0).map((item: {
      dt_txt: string;
      main: { temp: number; humidity: number };
      rain?: { '3h': number };
      weather: Array<{ description: string }>;
    }) => ({
      date: item.dt_txt,
      temperature: item.main.temp,
      humidity: item.main.humidity,
      precipitation: item.rain?.['3h'] || 0,
      weather_condition: item.weather[0].description
    }));

    return { data: forecast, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
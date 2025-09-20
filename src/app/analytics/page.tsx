'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  getWeatherData, 
  getWaterTreatmentFacilities
} from '@/lib/weather';
import { 
  generateWarnings, 
  analyzeHistoricalTrends,
  analyzeSeasonalPatterns,
  generatePredictions 
} from '@/lib/predictive';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  date: string;
  hpi: number;
  hei: number;
  safetyLevel: string;
  location: string;
}

interface WeatherInfo {
  location: string;
  temperature: number;
  humidity: number;
  weather_condition: string;
  recorded_at: string;
}

interface Warning {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  parameters: string[];
  recommended_actions: string[];
  expires_at: string;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherInfo[]>([]);
  const [facilities, setFacilities] = useState<Array<{name: string; location: string}>>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'hpi' | 'hei'>('hpi');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // Load water reports from database
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('water_reports')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (selectedLocation) {
        query = query.ilike('location', `%${selectedLocation}%`);
      }

      const { data: reports, error } = await query;
      
      if (error) throw error;

      if (reports && reports.length > 0) {
        const analyticsData = reports.map(report => ({
          date: new Date(report.created_at).toISOString().split('T')[0],
          hpi: report.hpi,
          hei: report.hei,
          safetyLevel: report.safety_level,
          location: report.location
        }));
        setData(analyticsData);
      } else {
        // Generate mock data if no real data available
        generateMockData(days);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      generateMockData(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedLocation, generateMockData]);

  const generateMockData = useCallback((days: number) => {
    const mockData: AnalyticsData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        hpi: 80 + Math.random() * 120 + Math.sin(i * 0.1) * 20,
        hei: 1 + Math.random() * 2 + Math.sin(i * 0.15) * 0.5,
        safetyLevel: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Moderate' : 'Safe',
        location: selectedLocation || ['Delhi', 'Mumbai', 'Bangalore', 'Chennai'][Math.floor(Math.random() * 4)]
      });
    }
    setData(mockData);
  }, [selectedLocation]);

  const loadRealTimeData = useCallback(async () => {
    try {
      // Load weather data
      const { data: weather } = await getWeatherData(selectedLocation, 5);
      if (weather) {
        setWeatherData(weather);
      }

      // Load water treatment facilities
      const { data: facilitiesData } = await getWaterTreatmentFacilities(selectedLocation);
      if (facilitiesData) {
        setFacilities(facilitiesData);
      }

      // Generate warnings for the location
      if (selectedLocation) {
        const locationWarnings = await generateWarnings(selectedLocation);
        setWarnings(locationWarnings);
      }
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  }, [selectedLocation]);

  useEffect(() => {
    loadAnalyticsData();
    loadRealTimeData();
  }, [loadAnalyticsData, loadRealTimeData]);

  const runPredictiveAnalysis = async () => {
    if (!selectedLocation) {
      alert('Please select a location for predictive analysis');
      return;
    }

    try {
      setLoading(true);
      
      // Run all types of analysis
      await Promise.all([
        analyzeHistoricalTrends(selectedLocation, 365),
        analyzeSeasonalPatterns(selectedLocation, 2),
        generatePredictions(selectedLocation, 30)
      ]);

      // Reload warnings after analysis
      const newWarnings = await generateWarnings(selectedLocation);
      setWarnings(newWarnings);

      alert('Predictive analysis completed successfully!');
    } catch (error) {
      console.error('Error running predictive analysis:', error);
      alert('Error running predictive analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const safetyLevelData = data.reduce((acc, item) => {
    acc[item.safetyLevel] = (acc[item.safetyLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(safetyLevelData).map(([level, count]) => ({
    name: level,
    value: count
  }));

  const locationData = data.reduce((acc, item) => {
    const existing = acc.find(loc => loc.location === item.location);
    if (existing) {
      existing.avgHpi = (existing.avgHpi + item.hpi) / 2;
      existing.count += 1;
    } else {
      acc.push({
        location: item.location,
        avgHpi: item.hpi,
        count: 1
      });
    }
    return acc;
  }, [] as Array<{location: string; avgHpi: number; count: number}>);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'medium': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'critical': return 'bg-red-100 border-red-300 text-red-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Water Quality Analytics</h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring, predictive analysis, and environmental impact assessment
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="Enter location (e.g., Delhi, Mumbai)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as 'hpi' | 'hei')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hpi">Heavy Metal Pollution Index (HPI)</option>
                  <option value="hei">Heavy Metal Evaluation Index (HEI)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={runPredictiveAnalysis}
                disabled={!selectedLocation || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Run Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Warnings</h2>
            <div className="space-y-3">
              {warnings.map((warning, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getWarningColor(warning.level)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{warning.message}</h3>
                      <p className="text-sm mt-1">Parameters: {warning.parameters.join(', ')}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Recommended Actions:</p>
                        <ul className="text-sm mt-1 list-disc list-inside">
                          {warning.recommended_actions.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      warning.level === 'critical' ? 'bg-red-200 text-red-800' :
                      warning.level === 'high' ? 'bg-orange-200 text-orange-800' :
                      warning.level === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {warning.level.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weather Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Weather</h3>
            {weatherData.length > 0 ? (
              <div className="space-y-3">
                {weatherData.slice(0, 1).map((weather, index) => (
                  <div key={index}>
                    <p className="text-2xl font-bold text-blue-600">{weather.temperature}°C</p>
                    <p className="text-gray-600">{weather.weather_condition}</p>
                    <p className="text-sm text-gray-500">Humidity: {weather.humidity}%</p>
                    <p className="text-sm text-gray-500">Location: {weather.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-blue-600">25°C</p>
                <p className="text-gray-600">Clear sky</p>
                <p className="text-sm text-gray-500">Humidity: 65%</p>
                <p className="text-sm text-gray-500">Location: {selectedLocation || 'Current Location'}</p>
              </div>
            )}
          </div>

          {/* Treatment Facilities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Facilities</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">{facilities.length || 3}</p>
              <p className="text-gray-600">Active facilities nearby</p>
              {facilities.length > 0 ? (
                facilities.slice(0, 2).map((facility, index) => (
                  <div key={index} className="text-sm text-gray-500">
                    <p className="font-medium">{facility.name}</p>
                    <p>{facility.location}</p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  <p className="font-medium">Water Treatment Plant A</p>
                  <p>{selectedLocation || 'Local Area'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Agriculture Impact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agriculture Impact</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-orange-600">
                {data.filter(d => d.safetyLevel === 'High' || d.safetyLevel === 'Critical').length}
              </p>
              <p className="text-gray-600">High-risk areas</p>
              <p className="text-sm text-gray-500">Potential crop yield impact</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Average HPI</h3>
            <p className="text-3xl font-bold text-blue-600">
              {data.length > 0 ? (data.reduce((sum, item) => sum + item.hpi, 0) / data.length).toFixed(1) : '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Average HEI</h3>
            <p className="text-3xl font-bold text-green-600">
              {data.length > 0 ? (data.reduce((sum, item) => sum + item.hei, 0) / data.length).toFixed(2) : '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Samples</h3>
            <p className="text-3xl font-bold text-purple-600">{data.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">High Risk Areas</h3>
            <p className="text-3xl font-bold text-red-600">
              {data.filter(item => item.safetyLevel === 'High' || item.safetyLevel === 'Critical').length}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedMetric.toUpperCase()} Trend Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Safety Level Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Level Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Analysis */}
        {locationData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average HPI by Location</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgHpi" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quality Alerts</h3>
          <div className="space-y-3">
            {data
              .filter(item => item.safetyLevel === 'High' || item.safetyLevel === 'Critical')
              .slice(0, 5)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">
                      {item.safetyLevel === 'Critical' ? 'Critical' : 'High'} contamination detected
                    </p>
                    <p className="text-sm text-red-600">
                      {item.location} - HPI: {item.hpi.toFixed(1)} on {item.date}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.safetyLevel === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                  }`}>
                    {item.safetyLevel}
                  </span>
                </div>
              ))}
            {data.filter(item => item.safetyLevel === 'High' || item.safetyLevel === 'Critical').length === 0 && (
              <p className="text-gray-500 text-center py-4">No high-risk alerts in the selected time period</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
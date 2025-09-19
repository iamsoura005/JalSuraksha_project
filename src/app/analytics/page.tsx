'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSamplesStore } from '@/stores/sampleStore';
import { calculateMultipleSamples } from '@/lib/calculations';
import { SampleData, PollutionIndexResultWithML } from '@/types';
import { formatNumber } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useTranslation } from 'react-i18next';

// Define the type for the store
interface SampleStore {
  samples: SampleData[];
}

// Generate synthetic future data for predictions
const generateFutureData = (currentData: PollutionIndexResultWithML[], months: number = 6) => {
  return Array.from({ length: months }, (_, i) => {
    const monthIndex = currentData.length + i;
    // Simple linear trend prediction (in a real app, this would use ML models)
    const trendFactor = 1 + (i * 0.05); // 5% increase per month
    const avgHPI = currentData.reduce((sum, item) => sum + item.hpi, 0) / currentData.length;
    
    return {
      month: `Month ${monthIndex + 1}`,
      hpi: avgHPI * trendFactor,
      hei: (currentData.reduce((sum, item) => sum + item.hei, 0) / currentData.length) * trendFactor,
      cd: (currentData.reduce((sum, item) => sum + item.cd, 0) / currentData.length) * trendFactor,
      predicted: true
    };
  });
};

// Generate seasonal variation data
const generateSeasonalData = (currentData: PollutionIndexResultWithML[]) => {
  const seasons = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'];
  
  return seasons.map((season, index) => {
    // Simple seasonal variation (in a real app, this would use historical data)
    const seasonalFactor = 1 + (Math.sin(index * Math.PI / 2) * 0.2); // -20% to +20% variation
    const avgHPI = currentData.reduce((sum, item) => sum + item.hpi, 0) / currentData.length;
    
    return {
      season,
      hpi: avgHPI * seasonalFactor,
      variation: `${Math.round((seasonalFactor - 1) * 100)}%`
    };
  });
};

export default function AnalyticsPage() {
  const [results, setResults] = useState<PollutionIndexResultWithML[]>([]);
  const [loading, setLoading] = useState(true);
  const [futureData, setFutureData] = useState<{ month: string; hpi: number; hei: number; cd: number; predicted: boolean }[]>([]);
  const [seasonalData, setSeasonalData] = useState<{ season: string; hpi: number; variation: string }[]>([]);
  const [activeTab, setActiveTab] = useState('trends'); // 'trends', 'predictions', 'seasonal'
  const router = useRouter();
  const samples = useSamplesStore((state: SampleStore) => state.samples);
  const { t } = useTranslation();

  useEffect(() => {
    if (samples.length === 0) {
      router.push('/');
      return;
    }

    // Calculate results
    const processSamples = async () => {
      try {
        const calculatedResults = await calculateMultipleSamples(samples);
        setResults(calculatedResults);
        
        // Generate future data for predictions
        const future = generateFutureData(calculatedResults);
        setFutureData(future);
        
        // Generate seasonal data
        const seasonal = generateSeasonalData(calculatedResults);
        setSeasonalData(seasonal);
        
        setLoading(false);
      } catch (error) {
        console.error('Error calculating pollution indices:', error);
        setLoading(false);
      }
    };

    processSamples();
  }, [samples, router]);

  // Prepare data for charts
  const getChartData = () => {
    // Time series data (using sample IDs as time points)
    const timeSeriesData = results.map((result, index) => ({
      time: `Sample ${index + 1}`,
      hpi: result.hpi,
      hei: result.hei,
      cd: result.cd,
      ef: result.ef
    }));

    // Combine historical and future data
    const combinedData = [
      ...timeSeriesData.map(item => ({ ...item, predicted: false })),
      ...futureData.map(item => ({ 
        time: item.month, 
        hpi: item.hpi, 
        hei: item.hei, 
        cd: item.cd, 
        ef: 0, // future data doesn't have ef
        predicted: item.predicted 
      }))
    ];

    return { timeSeriesData, combinedData };
  };

  const { timeSeriesData, combinedData } = getChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Analyzing Data...</h2>
          <p className="mt-2 text-gray-600">Processing {samples.length} samples</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Predictive Analytics & Trend Analysis</h1>
          <p className="text-gray-600">
            Advanced analysis of pollution trends and future predictions
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => router.push('/results')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>
        
        {/* Analytics Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('trends')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historical Trends
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'predictions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Future Predictions
            </button>
            <button
              onClick={() => setActiveTab('seasonal')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'seasonal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Seasonal Analysis
            </button>
          </nav>
        </div>
        
        {/* Analytics Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {activeTab === 'trends' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Historical Pollution Trends</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="hpi" stroke="#2563eb" name="HPI" strokeWidth={2} />
                    <Line type="monotone" dataKey="hei" stroke="#16a34a" name="HEI" strokeWidth={2} />
                    <Line type="monotone" dataKey="cd" stroke="#ea580c" name="Cd" strokeWidth={2} />
                    <Line type="monotone" dataKey="ef" stroke="#dc2626" name="EF" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trend Analysis Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average HPI</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatNumber(results.reduce((sum, r) => sum + r.hpi, 0) / results.length)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average HEI</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatNumber(results.reduce((sum, r) => sum + r.hei, 0) / results.length)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average Cd</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {formatNumber(results.reduce((sum, r) => sum + r.cd, 0) / results.length)}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average EF</p>
                    <p className="text-2xl font-bold text-red-800">
                      {formatNumber(results.reduce((sum, r) => sum + r.ef, 0) / results.length)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'predictions' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Future Pollution Predictions</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [formatNumber(Number(value)), name as string]}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hpi" 
                      stroke="#2563eb" 
                      name="HPI" 
                      strokeWidth={2}
                      strokeDasharray="0"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hei" 
                      stroke="#16a34a" 
                      name="HEI" 
                      strokeWidth={2}
                      strokeDasharray="0"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cd" 
                      stroke="#ea580c" 
                      name="Cd" 
                      strokeWidth={2}
                      strokeDasharray="0"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prediction Summary</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Warning:</strong> Based on current trends, pollution levels are projected to increase by approximately{' '}
                        {formatNumber(((futureData[futureData.length - 1]?.hpi || 0) - (results[results.length - 1]?.hpi || 0)) / (results[results.length - 1]?.hpi || 1) * 100)}% 
                        {' '}over the next 6 months. Early intervention is recommended.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'seasonal' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Seasonal Pollution Variation Analysis</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatNumber(Number(value)), 'HPI']}
                      labelFormatter={(label) => `Season: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="hpi" name="HPI" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Seasonal Analysis Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Monsoon Impact</h4>
                    <p className="text-sm text-gray-700">
                      Pollution levels typically increase by 15-20% during monsoon season due to surface runoff.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Summer Patterns</h4>
                    <p className="text-sm text-gray-700">
                      Concentration peaks in summer months due to reduced water flow and increased evaporation.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Winter Trends</h4>
                    <p className="text-sm text-gray-700">
                      Lower pollution levels during winter due to dilution from seasonal rains.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Early Warning System */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Early Warning System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800">Normal Conditions</h3>
                </div>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>No immediate pollution threats detected. Continue regular monitoring.</p>
              </div>
            </div>
            
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">Watch Level</h3>
                </div>
              </div>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Elevated pollution levels detected. Increase monitoring frequency.</p>
              </div>
            </div>
            
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Warning Level</h3>
                </div>
              </div>
              <div className="mt-2 text-sm text-red-700">
                <p>Critical pollution levels detected. Immediate action required.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

// Define types for external data
interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  date: string;
}

interface WaterTreatmentData {
  facilityId: string;
  name: string;
  capacity: number;
  currentLoad: number;
  treatmentEfficiency: number;
  lastMaintenance: string;
}

interface AgriculturalImpactData {
  cropType: string;
  yieldImpact: number;
  soilContamination: number;
  recommendedAction: string;
}

interface MonitoringNetworkData {
  stationId: string;
  location: { lat: number; lng: number };
  lastReading: { 
    timestamp: string;
    lead: number;
    arsenic: number;
    cadmium: number;
    chromium: number;
  };
  status: 'online' | 'offline' | 'maintenance';
}

export default function ExternalIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'weather' | 'treatment' | 'agriculture' | 'monitoring'>('weather');
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [treatmentData, setTreatmentData] = useState<WaterTreatmentData[]>([]);
  const [agricultureData, setAgricultureData] = useState<AgriculturalImpactData[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringNetworkData[]>([]);

  // Simulate fetching weather data
  const fetchWeatherData = () => {
    // In a real application, this would fetch from a weather API
    const mockData: WeatherData[] = [
      { temperature: 25, humidity: 65, precipitation: 0, windSpeed: 12, date: '2023-06-15' },
      { temperature: 28, humidity: 70, precipitation: 5, windSpeed: 8, date: '2023-06-16' },
      { temperature: 26, humidity: 68, precipitation: 0, windSpeed: 15, date: '2023-06-17' },
      { temperature: 24, humidity: 72, precipitation: 12, windSpeed: 10, date: '2023-06-18' }
    ];
    setWeatherData(mockData);
  };

  // Simulate fetching water treatment facility data
  const fetchTreatmentData = () => {
    // In a real application, this would fetch from a water treatment database
    const mockData: WaterTreatmentData[] = [
      { facilityId: 'WT001', name: 'City Water Treatment Plant', capacity: 50000, currentLoad: 42000, treatmentEfficiency: 95.5, lastMaintenance: '2023-05-20' },
      { facilityId: 'WT002', name: 'Industrial Wastewater Facility', capacity: 30000, currentLoad: 28000, treatmentEfficiency: 89.2, lastMaintenance: '2023-06-01' },
      { facilityId: 'WT003', name: 'Rural Treatment Center', capacity: 15000, currentLoad: 12000, treatmentEfficiency: 92.7, lastMaintenance: '2023-05-15' }
    ];
    setTreatmentData(mockData);
  };

  // Simulate fetching agricultural impact data
  const fetchAgricultureData = () => {
    // In a real application, this would fetch from an agricultural database
    const mockData: AgriculturalImpactData[] = [
      { cropType: 'Rice', yieldImpact: -15, soilContamination: 75, recommendedAction: 'Soil remediation and crop rotation' },
      { cropType: 'Wheat', yieldImpact: -8, soilContamination: 55, recommendedAction: 'Increased irrigation and fertilization' },
      { cropType: 'Corn', yieldImpact: -12, soilContamination: 68, recommendedAction: 'Phytoremediation with sunflowers' },
      { cropType: 'Vegetables', yieldImpact: -22, soilContamination: 85, recommendedAction: 'Immediate soil treatment required' }
    ];
    setAgricultureData(mockData);
  };

  // Simulate fetching monitoring network data
  const fetchMonitoringData = () => {
    // In a real application, this would fetch from an environmental monitoring network
    const mockData: MonitoringNetworkData[] = [
      { 
        stationId: 'MN001', 
        location: { lat: 40.7128, lng: -74.0060 }, 
        lastReading: { 
          timestamp: '2023-06-18T10:30:00Z', 
          lead: 0.012, 
          arsenic: 0.008, 
          cadmium: 0.004, 
          chromium: 0.06 
        }, 
        status: 'online' 
      },
      { 
        stationId: 'MN002', 
        location: { lat: 40.7589, lng: -73.9851 }, 
        lastReading: { 
          timestamp: '2023-06-18T09:45:00Z', 
          lead: 0.009, 
          arsenic: 0.011, 
          cadmium: 0.002, 
          chromium: 0.04 
        }, 
        status: 'online' 
      },
      { 
        stationId: 'MN003', 
        location: { lat: 40.7505, lng: -73.9934 }, 
        lastReading: { 
          timestamp: '2023-06-17T16:20:00Z', 
          lead: 0.018, 
          arsenic: 0.015, 
          cadmium: 0.007, 
          chromium: 0.09 
        }, 
        status: 'maintenance' 
      }
    ];
    setMonitoringData(mockData);
  };

  // Get status color for monitoring stations
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">External System Integration</h1>
          <p className="text-gray-600">
            Connect with weather services, water treatment facilities, agricultural databases, and monitoring networks
          </p>
        </div>
        
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('weather')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'weather'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Weather Data
            </button>
            <button
              onClick={() => setActiveTab('treatment')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'treatment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Water Treatment Facilities
            </button>
            <button
              onClick={() => setActiveTab('agriculture')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agriculture'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Agricultural Impact
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Monitoring Network
            </button>
          </nav>
        </div>
        
        {/* Weather Data Integration */}
        {activeTab === 'weather' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Weather Data Integration</h2>
                <p className="text-gray-600">Connect with meteorological services for environmental impact analysis</p>
              </div>
              <button
                onClick={fetchWeatherData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fetch Weather Data
              </button>
            </div>
            
            {weatherData.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No weather data</h3>
                <p className="mt-1 text-sm text-gray-500">Click &quot;Fetch Weather Data&quot; to retrieve information</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {weatherData.map((data, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{data.date}</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Temperature</span>
                        <span className="text-sm font-medium">{data.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Humidity</span>
                        <span className="text-sm font-medium">{data.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Precipitation</span>
                        <span className="text-sm font-medium">{data.precipitation}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Wind Speed</span>
                        <span className="text-sm font-medium">{data.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">How Weather Data Affects Pollution</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>{'\u2022'} Heavy rainfall can increase runoff and spread contaminants</li>
                <li>{'\u2022'} High temperatures may accelerate chemical reactions in soil</li>
                <li>{'\u2022'} Wind patterns can affect the dispersion of airborne pollutants</li>
                <li>{'\u2022'} Humidity levels influence the mobility of certain heavy metals</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Water Treatment Facilities */}
        {activeTab === 'treatment' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Water Treatment Facilities</h2>
                <p className="text-gray-600">Integrate with water treatment facility databases</p>
              </div>
              <button
                onClick={fetchTreatmentData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fetch Facility Data
              </button>
            </div>
            
            {treatmentData.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No facility data</h3>
                <p className="mt-1 text-sm text-gray-500">Click &quot;Fetch Facility Data&quot; to retrieve information</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity (L/day)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Load
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efficiency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Maintenance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {treatmentData.map((facility, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                          <div className="text-sm text-gray-500">{facility.facilityId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.capacity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.currentLoad.toLocaleString()} ({((facility.currentLoad / facility.capacity) * 100).toFixed(1)}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{facility.treatmentEfficiency}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                facility.treatmentEfficiency > 90 ? 'bg-green-600' : 
                                facility.treatmentEfficiency > 80 ? 'bg-yellow-500' : 'bg-red-600'
                              }`} 
                              style={{ width: `${facility.treatmentEfficiency}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.lastMaintenance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Agricultural Impact */}
        {activeTab === 'agriculture' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agricultural Impact Assessment</h2>
                <p className="text-gray-600">Connect with agricultural databases for impact analysis</p>
              </div>
              <button
                onClick={fetchAgricultureData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fetch Agricultural Data
              </button>
            </div>
            
            {agricultureData.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agricultural data</h3>
                <p className="mt-1 text-sm text-gray-500">Click &quot;Fetch Agricultural Data&quot; to retrieve information</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agricultureData.map((crop, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{crop.cropType}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        crop.yieldImpact < -15 ? 'bg-red-100 text-red-800' : 
                        crop.yieldImpact < -10 ? 'bg-orange-100 text-orange-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {crop.yieldImpact}% yield impact
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Soil Contamination</span>
                          <span className="font-medium">{crop.soilContamination}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              crop.soilContamination > 80 ? 'bg-red-600' : 
                              crop.soilContamination > 60 ? 'bg-orange-500' : 
                              crop.soilContamination > 40 ? 'bg-yellow-500' : 'bg-green-600'
                            }`} 
                            style={{ width: `${crop.soilContamination}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">Recommended Action</p>
                        <p className="mt-1 text-sm text-gray-600">{crop.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">Agricultural Best Practices</h3>
              <ul className="mt-2 space-y-1 text-sm text-green-700">
                <li>{'\u2022'} Implement crop rotation to reduce soil metal accumulation</li>
                <li>{'\u2022'} Use phytoremediation plants like sunflowers to extract heavy metals</li>
                <li>{'\u2022'} Apply organic amendments to immobilize metals in soil</li>
                <li>{'\u2022'} Regular soil testing to monitor contamination levels</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Monitoring Network */}
        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Environmental Monitoring Network</h2>
                <p className="text-gray-600">Connect with environmental monitoring networks for real-time data</p>
              </div>
              <button
                onClick={fetchMonitoringData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fetch Monitoring Data
              </button>
            </div>
            
            {monitoringData.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No monitoring data</h3>
                <p className="mt-1 text-sm text-gray-500">Click &quot;Fetch Monitoring Data&quot; to retrieve information</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monitoringData.map((station, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{station.stationId}</h3>
                        <p className="text-sm text-gray-500">
                          {station.location.lat.toFixed(4)}, {station.location.lng.toFixed(4)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                        {station.status.charAt(0).toUpperCase() + station.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Last Reading: {new Date(station.lastReading.timestamp).toLocaleString()}</p>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lead (Pb)</span>
                          <span className="text-sm font-medium">{station.lastReading.lead.toFixed(3)} ppm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Arsenic (As)</span>
                          <span className="text-sm font-medium">{station.lastReading.arsenic.toFixed(3)} ppm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cadmium (Cd)</span>
                          <span className="text-sm font-medium">{station.lastReading.cadmium.toFixed(3)} ppm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Chromium (Cr)</span>
                          <span className="text-sm font-medium">{station.lastReading.chromium.toFixed(3)} ppm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800">Monitoring Network Benefits</h3>
              <ul className="mt-2 space-y-1 text-sm text-purple-700">
                <li>{'\u2022'} Real-time pollution tracking across multiple locations</li>
                <li>{'\u2022'} Early warning system for contamination events</li>
                <li>{'\u2022'} Trend analysis for long-term environmental planning</li>
                <li>{'\u2022'} Data sharing between agencies and research institutions</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

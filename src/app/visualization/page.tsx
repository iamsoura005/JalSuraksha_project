'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSamplesStore } from '@/stores/sampleStore';
import { calculateMultipleSamples } from '@/lib/calculations';
import { SampleData, PollutionIndexResultWithML } from '@/types';
import { formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { jsPDF } from 'jspdf';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Dynamically import Three.js components for 3D visualization
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

const Box = dynamic(
  () => import('@react-three/drei').then((mod) => mod.Box),
  { ssr: false }
);

// Define the type for the store
interface SampleStore {
  samples: SampleData[];
}

// Simple map component placeholder
const SimpleMap = ({ samples }: { samples: SampleData[] }) => {
  // Default center for the map (India)
  const defaultCenter: [number, number] = samples.length > 0 
    ? [samples[0].latitude, samples[0].longitude] 
    : [20.5937, 78.9629];
  const defaultZoom = samples.length > 0 ? 12 : 5;

  // Get color based on HPI value
  const getColorByHPI = (hpi: number) => {
    if (hpi < 100) return '#16a34a'; // Green - Safe
    if (hpi < 200) return '#ea580c'; // Orange - Moderate
    if (hpi < 300) return '#dc2626'; // Red - High
    return '#000000'; // Black - Critical
  };

  return (
    <div className="bg-gray-100/30 backdrop-blur-sm border border-gray-300/30 rounded-lg h-96 w-full relative">
      {typeof window !== 'undefined' ? (
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg absolute top-0 left-0 bottom-0 right-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {samples.map((sample) => (
            <CircleMarker
              key={sample.id}
              center={[sample.latitude, sample.longitude]}
              radius={10}
              color={getColorByHPI(sample.lead * 100)} // Simplified for demo
              fillColor={getColorByHPI(sample.lead * 100)}
              fillOpacity={0.7}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">Sample {sample.sampleId}</h3>
                  <p>Lead: {formatNumber(sample.lead)} ppm</p>
                  <p>Lat: {sample.latitude}, Lng: {sample.longitude}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

// 3D Visualization Component
const Pollution3DVisualization = ({ data }: { data: PollutionIndexResultWithML[] }) => {
  return (
    <div className="bg-gray-100/30 backdrop-blur-sm border border-gray-300/30 rounded-lg h-96 w-full flex items-center justify-center">
      {typeof window !== 'undefined' ? (
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          {data.map((result, index) => (
            <Box
              key={result.sampleId}
              position={[
                (index % 5) * 2 - 4,
                Math.floor(index / 5) * 2 - 2,
                Math.min(result.hpi / 50, 5)
              ]}
              args={[1, 1, Math.min(result.hpi / 50, 5)]}
            >
              <meshStandardMaterial 
                color={result.hpi < 100 ? '#16a34a' : result.hpi < 200 ? '#ea580c' : result.hpi < 300 ? '#dc2626' : '#000000'} 
              />
            </Box>
          ))}
        </Canvas>
      ) : (
        <p>Loading 3D visualization...</p>
      )}
    </div>
  );
};

export default function VisualizationPage() {
  const [results, setResults] = useState<PollutionIndexResultWithML[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMLAnalysis, setIsMLAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'timeseries', '3d'
  const router = useRouter();
  const samples = useSamplesStore((state: SampleStore) => state.samples);

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
        
        // Check if any sample used ML analysis
        const hasMLAnalysis = calculatedResults.some(result => result.isMLAnalysis);
        setIsMLAnalysis(hasMLAnalysis);
        
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
    // Bar chart data - HPI distribution
    const hpiData = results.map(result => ({
      sampleId: result.sampleId,
      hpi: result.hpi
    }));

    // Pie chart data - Safety level distribution
    const safetyLevels = {
      Safe: results.filter(r => r.safetyLevel === 'Safe').length,
      Moderate: results.filter(r => r.safetyLevel === 'Moderate').length,
      High: results.filter(r => r.safetyLevel === 'High').length,
      Critical: results.filter(r => r.safetyLevel === 'Critical').length
    };

    const pieData = Object.entries(safetyLevels)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    // Bar chart data - Pollution indices comparison
    const indicesData = results.length > 0 ? [
      {
        name: 'Average',
        hpi: results.reduce((sum, r) => sum + r.hpi, 0) / results.length,
        hei: results.reduce((sum, r) => sum + r.hei, 0) / results.length,
        cd: results.reduce((sum, r) => sum + r.cd, 0) / results.length,
        ef: results.reduce((sum, r) => sum + r.ef, 0) / results.length
      }
    ] : [];

    // Time series data (simulated with sample IDs as time points)
    const timeSeriesData = results.map((result, index) => ({
      time: `Sample ${index + 1}`,
      hpi: result.hpi,
      hei: result.hei,
      cd: result.cd,
      ef: result.ef
    }));

    return { hpiData, pieData, indicesData, timeSeriesData };
  };

  const { hpiData, pieData, indicesData, timeSeriesData } = getChartData();

  // Colors for charts
  const COLORS = ['#16a34a', '#ea580c', '#dc2626', '#2563eb'];
  const SAFETY_COLORS: Record<string, string> = {
    'Safe': '#16a34a',
    'Moderate': '#ea580c',
    'High': '#dc2626',
    'Critical': '#000000'
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Pollution Visualization Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add analysis type
    doc.setFontSize(12);
    doc.text(`Analysis Type: ${isMLAnalysis ? 'Machine Learning Enhanced' : 'Standard Calculation'}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add summary statistics
    const safetyLevels = {
      Safe: results.filter(r => r.safetyLevel === 'Safe').length,
      Moderate: results.filter(r => r.safetyLevel === 'Moderate').length,
      High: results.filter(r => r.safetyLevel === 'High').length,
      Critical: results.filter(r => r.safetyLevel === 'Critical').length
    };
    
    doc.setFontSize(12);
    doc.text(`Total Samples: ${results.length}`, 20, 40);
    doc.text(`Safe: ${safetyLevels.Safe}`, 20, 50);
    doc.text(`Moderate: ${safetyLevels.Moderate}`, 20, 60);
    doc.text(`High: ${safetyLevels.High}`, 20, 70);
    doc.text(`Critical: ${safetyLevels.Critical}`, 20, 80);
    
    // Save the PDF
    doc.save('pollution-visualization-report.pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Processing Visualization Data</h2>
          <p className="mt-2 text-gray-600">Processing {samples.length} samples</p>
          <p className="mt-2 text-gray-500 text-sm">{isMLAnalysis ? 'Using Machine Learning Models' : 'Using Standard Calculations'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pollution Visualization</h1>
          <p className="text-gray-600">
            Interactive visualization of pollution data and trends
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {isMLAnalysis ? 'Machine Learning Enhanced Analysis' : 'Standard Calculation Analysis'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600/80 backdrop-blur-sm text-white rounded-md hover:bg-red-700/80 border border-red-300/30 shadow-sm"
          >
            Download PDF Report
          </button>
          <button
            onClick={() => router.push('/results')}
            className="px-4 py-2 bg-blue-600/80 backdrop-blur-sm text-white rounded-md hover:bg-blue-700/80 border border-blue-300/30 shadow-sm"
          >
            Back to Results
          </button>
        </div>
        
        {/* Visualization Tabs */}
        <div className="mb-6 border-b border-gray-200/30">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('map')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'map'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pollution Heat Map
            </button>
            <button
              onClick={() => setActiveTab('timeseries')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeseries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Time Series Analysis
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === '3d'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              3D Visualization
            </button>
          </nav>
        </div>
        
        {/* Visualization Content */}
        <div className="bg-white/30 backdrop-blur-sm rounded-lg shadow p-6 mb-8 border border-white/20">
          {activeTab === 'map' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pollution Heat Map</h2>
              <SimpleMap samples={samples} />
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Safe (&lt;100 HPI)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm">Moderate (100-200 HPI)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm">High (200-300 HPI)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-black rounded-full mr-2"></div>
                  <span className="text-sm">Critical (&gt;300 HPI)</span>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'timeseries' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Series Analysis</h2>
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
              
              <div className="h-96 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hpi" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} name="HPI" />
                    <Bar dataKey="hei" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} name="HEI" />
                    <Bar dataKey="cd" stackId="1" stroke="#ea580c" fill="#ea580c" fillOpacity={0.6} name="Cd" />
                    <Bar dataKey="ef" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} name="EF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          
          {activeTab === '3d' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3D Pollution Visualization</h2>
              <Pollution3DVisualization data={results} />
              <div className="mt-4 text-sm text-gray-600">
                <p>Each 3D bar represents a sample location. Height represents pollution level (HPI).</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span>Safe (&lt;100 HPI)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                    <span>Moderate (100-200 HPI)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span>High (200-300 HPI)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-black rounded-full mr-2"></div>
                    <span>Critical (&gt;300 HPI)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* HPI Distribution Bar Chart */}
          <div className="bg-white/30 backdrop-blur-sm rounded-lg shadow p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">HPI Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hpiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sampleId" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(Number(value)), 'HPI']} />
                  <Legend />
                  <Bar dataKey="hpi" name="Heavy Metal Pollution Index" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Safety Level Distribution Pie Chart */}
          <div className="bg-white/30 backdrop-blur-sm rounded-lg shadow p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety Level Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SAFETY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Samples']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Pollution Indices Comparison */}
        <div className="bg-white/30 backdrop-blur-sm rounded-lg shadow p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pollution Indices Comparison</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={indicesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatNumber(Number(value)), 'Index Value']}
                  labelFormatter={() => 'Average Values'}
                />
                <Legend />
                <Bar dataKey="hpi" name="HPI" fill="#2563eb" />
                <Bar dataKey="hei" name="HEI" fill="#16a34a" />
                <Bar dataKey="cd" name="Cd" fill="#ea580c" />
                <Bar dataKey="ef" name="EF" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
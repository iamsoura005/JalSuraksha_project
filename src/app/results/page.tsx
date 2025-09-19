'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSamplesStore } from '@/stores/sampleStore';
import { SampleData, PollutionIndexResultWithML } from '@/types';
import { calculatePollutionIndices, calculateMultipleSamples } from '@/lib/calculations';
import { calculatePollutionIndicesEnhanced } from '@/lib/enhancedMLModels'; // Import enhanced ML function
import { downloadCSV, convertToCSV, formatNumber } from '@/lib/utils';
import { jsPDF } from 'jspdf';

// Define the type for the store
interface SampleStore {
  samples: SampleData[];
  clearSamples: () => void;
}

// Define enhanced result type
interface EnhancedPollutionIndexResult extends PollutionIndexResultWithML {
  isAnomaly?: boolean;
  anomalyScore?: number;
  ensembleHPI?: number | null;
  confidence?: number | null;
  recommendations?: string[];
}

export default function ResultsPage() {
  const [results, setResults] = useState<EnhancedPollutionIndexResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState<{result: EnhancedPollutionIndexResult, sample: SampleData} | null>(null);
  const [isMLAnalysis, setIsMLAnalysis] = useState(false);
  const samples = useSamplesStore((state: SampleStore) => state.samples);
  const clearSamples = useSamplesStore((state: SampleStore) => state.clearSamples);
  const router = useRouter();

  useEffect(() => {
    if (samples.length === 0) {
      router.push('/');
      return;
    }

    // Process samples with async calculation
    const processSamples = async () => {
      try {
        // Try enhanced ML models first, fall back to standard if not available
        const enhancedResults: EnhancedPollutionIndexResult[] = await Promise.all(
          samples.map(sample => calculatePollutionIndicesEnhanced(sample))
        );
        
        setResults(enhancedResults);
        
        // Check if any sample used ML analysis
        const hasMLAnalysis = enhancedResults.some(result => result.isMLAnalysis);
        setIsMLAnalysis(hasMLAnalysis);
        
        setLoading(false);
      } catch (error) {
        console.error('Error calculating pollution indices with enhanced ML:', error);
        // Fall back to standard calculation
        try {
          const calculatedResults = await calculateMultipleSamples(samples);
          setResults(calculatedResults as EnhancedPollutionIndexResult[]);
          
          // Check if any sample used ML analysis
          const hasMLAnalysis = calculatedResults.some((result: PollutionIndexResultWithML) => result.isMLAnalysis);
          setIsMLAnalysis(hasMLAnalysis);
          
          setLoading(false);
        } catch (fallbackError) {
          console.error('Error calculating pollution indices with standard method:', fallbackError);
          setLoading(false);
        }
      }
    };

    processSamples();
  }, [samples, router]);

  const getSafetyLevelColor = (level: EnhancedPollutionIndexResult['safetyLevel']) => {
    switch (level) {
      case 'Safe': return 'bg-green-100/50 backdrop-blur-sm text-green-800 border border-green-200/30';
      case 'Moderate': return 'bg-yellow-100/50 backdrop-blur-sm text-yellow-800 border border-yellow-200/30';
      case 'High': return 'bg-orange-100/50 backdrop-blur-sm text-orange-800 border border-orange-200/30';
      case 'Critical': return 'bg-red-100/50 backdrop-blur-sm text-red-800 border border-red-200/30';
      default: return 'bg-gray-100/50 backdrop-blur-sm text-gray-800 border border-gray-200/30';
    }
  };

  // Function to determine if a metal concentration is high
  const isHighConcentration = (concentration: number, metal: string): boolean => {
    const standards: Record<string, number> = {
      lead: 0.01,
      arsenic: 0.01,
      cadmium: 0.003,
      chromium: 0.05,
      copper: 2.0,
      iron: 0.3,
      zinc: 3.0
    };
    
    const standard = standards[metal] || 1;
    return concentration > standard * 2; // Mark as high if more than twice the standard
  };

  const getSummaryStats = () => {
    const total = results.length;
    const safe = results.filter(r => r.safetyLevel === 'Safe').length;
    const moderate = results.filter(r => r.safetyLevel === 'Moderate').length;
    const high = results.filter(r => r.safetyLevel === 'High').length;
    const critical = results.filter(r => r.safetyLevel === 'Critical').length;
    
    return { total, safe, moderate, high, critical };
  };

  const handleDownloadReport = (format: 'csv' | 'json' | 'pdf') => {
    if (format === 'csv') {
      // Convert results to CSV format
      const csvData = results.map(result => ({
        Sample_ID: result.sampleId,
        HPI: formatNumber(result.hpi),
        HEI: formatNumber(result.hei),
        Cd: formatNumber(result.cd),
        EF: formatNumber(result.ef),
        Safety_Level: result.safetyLevel,
        Risk_Assessment: result.riskAssessment,
        Analysis_Type: result.isMLAnalysis ? 'ML Enhanced' : 'Standard',
        Is_Anomaly: result.isAnomaly ? 'Yes' : 'No',
        Anomaly_Score: result.anomalyScore ? formatNumber(result.anomalyScore) : 'N/A',
        Ensemble_HPI: result.ensembleHPI ? formatNumber(result.ensembleHPI) : 'N/A',
        Confidence: result.confidence ? formatNumber(result.confidence) : 'N/A'
      }));
      
      // Convert array to CSV string and download
      const csvString = convertToCSV(csvData);
      downloadCSV(csvString, 'pollution-index-report.csv');
    } else if (format === 'pdf') {
      // Generate PDF report
      generatePDFReport();
    } else {
      // Download as JSON
      const jsonData = results.map(result => ({
        Sample_ID: result.sampleId,
        HPI: result.hpi,
        HEI: result.hei,
        Cd: result.cd,
        EF: result.ef,
        Safety_Level: result.safetyLevel,
        Risk_Assessment: result.riskAssessment,
        Analysis_Type: result.isMLAnalysis ? 'ML Enhanced' : 'Standard',
        Is_Anomaly: result.isAnomaly ? 'Yes' : 'No',
        Anomaly_Score: result.anomalyScore ? formatNumber(result.anomalyScore) : 'N/A',
        Ensemble_HPI: result.ensembleHPI ? formatNumber(result.ensembleHPI) : 'N/A',
        Confidence: result.confidence ? formatNumber(result.confidence) : 'N/A',
        Recommendations: result.recommendations ? result.recommendations.join('; ') : 'N/A'
      }));
      
      // Convert array to CSV string and download (JSON format)
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pollution-index-report.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Heavy Metal Pollution Index Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add analysis type
    doc.setFontSize(12);
    doc.text(`Analysis Type: ${isMLAnalysis ? 'Machine Learning Enhanced' : 'Standard Calculation'}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add summary statistics
    const stats = getSummaryStats();
    doc.setFontSize(12);
    doc.text(`Total Samples: ${stats.total}`, 20, 40);
    doc.text(`Safe: ${stats.safe}`, 20, 50);
    doc.text(`Moderate: ${stats.moderate}`, 20, 60);
    doc.text(`High: ${stats.high}`, 20, 70);
    doc.text(`Critical: ${stats.critical}`, 20, 80);
    
    // Add detailed results table
    doc.setFontSize(10);
    let yPosition = 100;
    
    // Table headers
    doc.text('Sample ID', 20, yPosition);
    doc.text('HPI', 50, yPosition);
    doc.text('HEI', 70, yPosition);
    doc.text('Cd', 90, yPosition);
    doc.text('EF', 110, yPosition);
    doc.text('Safety Level', 130, yPosition);
    doc.text('Analysis', 160, yPosition);
    
    yPosition += 10;
    
    // Table rows
    results.forEach((result) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(result.sampleId, 20, yPosition);
      doc.text(formatNumber(result.hpi), 50, yPosition);
      doc.text(formatNumber(result.hei), 70, yPosition);
      doc.text(formatNumber(result.cd), 90, yPosition);
      doc.text(formatNumber(result.ef), 110, yPosition);
      doc.text(result.safetyLevel, 130, yPosition);
      doc.text(result.isMLAnalysis ? 'ML' : 'Standard', 160, yPosition);
      
      yPosition += 10;
    });
    
    // Save the PDF
    doc.save('pollution-index-report.pdf');
  };

  const handleNewCalculation = () => {
    clearSamples();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Calculating Indices...</h2>
          <p className="mt-2 text-gray-600">Processing {samples.length} samples</p>
          <p className="mt-2 text-gray-500 text-sm">{isMLAnalysis ? 'Using Enhanced Machine Learning Models' : 'Using Standard Calculations'}</p>
        </div>
      </div>
    );
  }

  const stats = getSummaryStats();

  return (
    <div className="min-h-screen bg-gray-50/30 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pollution Index Results</h1>
          <p className="text-gray-600">
            Analysis of groundwater contamination levels
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {isMLAnalysis ? 'Enhanced Machine Learning Analysis' : 'Standard Calculation Analysis'}
          </p>
        </div>
        
        {/* Summary Statistics */}
        <div className="bg-white/30 backdrop-blur-sm rounded-lg shadow p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-200/30">
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Samples</p>
            </div>
            <div className="bg-green-50/50 backdrop-blur-sm p-4 rounded-lg text-center border border-green-200/30">
              <p className="text-2xl font-bold text-green-800">{stats.safe}</p>
              <p className="text-sm text-gray-600">Safe</p>
            </div>
            <div className="bg-yellow-50/50 backdrop-blur-sm p-4 rounded-lg text-center border border-yellow-200/30">
              <p className="text-2xl font-bold text-yellow-800">{stats.moderate}</p>
              <p className="text-sm text-gray-600">Moderate</p>
            </div>
            <div className="bg-orange-50/50 backdrop-blur-sm p-4 rounded-lg text-center border border-orange-200/30">
              <p className="text-2xl font-bold text-orange-800">{stats.high}</p>
              <p className="text-sm text-gray-600">High</p>
            </div>
            <div className="bg-red-50/50 backdrop-blur-sm p-4 rounded-lg text-center border border-red-200/30">
              <p className="text-2xl font-bold text-red-800">{stats.critical}</p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
          </div>
          
          <p className="mt-4 text-center text-gray-700">
            Out of {stats.total} samples, {stats.safe} are Safe, {stats.moderate} are Moderate, 
            {stats.high} are Hazardous, and {stats.critical} are Critical
          </p>
        </div>
        
        {/* Results Table */}
        <div className="bg-white/30 backdrop-blur-sm rounded-lg shadow overflow-hidden border border-white/20">
          <div className="px-6 py-4 border-b border-gray-200/30 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Results</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleDownloadReport('csv')}
                className="px-4 py-2 bg-green-600/80 backdrop-blur-sm text-white rounded-md hover:bg-green-700/80 text-sm border border-green-300/30 shadow-sm"
              >
                Download CSV
              </button>
              <button
                onClick={() => handleDownloadReport('pdf')}
                className="px-4 py-2 bg-red-600/80 backdrop-blur-sm text-white rounded-md hover:bg-red-700/80 text-sm border border-red-300/30 shadow-sm"
              >
                Download PDF
              </button>
              <button
                onClick={() => router.push('/visualization')}
                className="px-4 py-2 bg-purple-600/80 backdrop-blur-sm text-white rounded-md hover:bg-purple-700/80 text-sm border border-purple-300/30 shadow-sm"
              >
                View Visualizations
              </button>
              <button
                onClick={() => router.push('/reports')}
                className="px-4 py-2 bg-indigo-600/80 backdrop-blur-sm text-white rounded-md hover:bg-indigo-700/80 text-sm border border-indigo-300/30 shadow-sm"
              >
                Compliance Reports
              </button>
              <button
                onClick={handleNewCalculation}
                className="px-4 py-2 bg-blue-600/80 backdrop-blur-sm text-white rounded-md hover:bg-blue-700/80 text-sm border border-blue-300/30 shadow-sm"
              >
                New Calculation
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/30">
              <thead className="bg-gray-50/50 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HPI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HEI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cd
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safety Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analysis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anomaly
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/20 backdrop-blur-sm divide-y divide-gray-200/30">
                {results.map((result) => {
                  // Find the corresponding sample data
                  const sample = samples.find((s: SampleData) => s.sampleId === result.sampleId) || samples[0];
                  
                  return (
                    <tr 
                      key={result.sampleId} 
                      className="hover:bg-gray-50/30 backdrop-blur-sm cursor-pointer"
                      onClick={() => setSelectedSample({result, sample})}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.sampleId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(result.hpi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(result.hei)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(result.cd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(result.ef)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSafetyLevelColor(result.safetyLevel)}`}>
                          {result.safetyLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.isMLAnalysis ? 'ML' : 'Standard'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.isAnomaly ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100/50 backdrop-blur-sm text-red-800 border border-red-200/30">
                            Yes ({result.anomalyScore?.toFixed(2)})
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100/50 backdrop-blur-sm text-green-800 border border-green-200/30">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Sample Detail Modal */}
        {selectedSample && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
              <div className="px-6 py-4 border-b border-gray-200/30 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Sample {selectedSample.result.sampleId} Details
                </h3>
                <button
                  onClick={() => setSelectedSample(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sample ID</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedSample.result.sampleId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="mt-1 text-sm text-gray-900">
                      Lat: {selectedSample.sample.latitude}, Lng: {selectedSample.sample.longitude}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Safety Level</p>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSafetyLevelColor(selectedSample.result.safetyLevel)}`}>
                      {selectedSample.result.safetyLevel}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Analysis Type</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedSample.result.isMLAnalysis ? 'ML Enhanced' : 'Standard'}
                    </p>
                  </div>
                  {selectedSample.result.isAnomaly !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Anomaly Detection</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSample.result.isAnomaly ? (
                          <span className="text-red-600 font-medium">
                            Anomaly Detected (Score: {selectedSample.result.anomalyScore?.toFixed(3)})
                          </span>
                        ) : (
                          <span className="text-green-600">No Anomalies</span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedSample.result.confidence !== undefined && selectedSample.result.confidence !== null && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Prediction Confidence</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {(selectedSample.result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                </div>
                
                {/* Metal Concentrations */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Metal Concentrations (ppm)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
                    {([
                      { key: 'lead', label: 'Lead (Pb)', value: selectedSample.sample.lead },
                      { key: 'arsenic', label: 'Arsenic (As)', value: selectedSample.sample.arsenic },
                      { key: 'cadmium', label: 'Cadmium (Cd)', value: selectedSample.sample.cadmium },
                      { key: 'chromium', label: 'Chromium (Cr)', value: selectedSample.sample.chromium },
                      { key: 'copper', label: 'Copper (Cu)', value: selectedSample.sample.copper },
                      { key: 'iron', label: 'Iron (Fe)', value: selectedSample.sample.iron },
                      { key: 'zinc', label: 'Zinc (Zn)', value: selectedSample.sample.zinc }
                    ] as const).map(({ key, label, value }) => (
                      <div 
                        key={key} 
                        className={`p-3 rounded-lg text-center ${
                          isHighConcentration(value, key) 
                            ? 'bg-red-100/50 backdrop-blur-sm border border-red-300/30' 
                            : 'bg-gray-50/50 backdrop-blur-sm border border-gray-200/30'
                        }`}
                      >
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-sm font-medium ${
                          isHighConcentration(value, key) 
                            ? 'text-red-700 font-bold' 
                            : 'text-gray-900'
                        }`}>
                          {formatNumber(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pollution Indices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/30">
                    <p className="text-sm font-medium text-gray-500">Heavy Metal Pollution Index (HPI)</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(selectedSample.result.hpi)}</p>
                    {selectedSample.result.ensembleHPI !== undefined && selectedSample.result.ensembleHPI !== null && (
                      <p className="mt-1 text-sm text-gray-600">
                        Ensemble HPI: {formatNumber(selectedSample.result.ensembleHPI)}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-600">
                      Formula: HPI = Σ(Wi × (Ci/Si) × 100)
                    </p>
                  </div>
                  <div className="bg-gray-50/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/30">
                    <p className="text-sm font-medium text-gray-500">Heavy Metal Evaluation Index (HEI)</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(selectedSample.result.hei)}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      Formula: HEI = (Ci/Si)max
                    </p>
                  </div>
                  <div className="bg-gray-50/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/30">
                    <p className="text-sm font-medium text-gray-500">Contamination Degree (Cd)</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(selectedSample.result.cd)}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      Formula: Cd = Σ(Ci/Si)
                    </p>
                  </div>
                  <div className="bg-gray-50/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/30">
                    <p className="text-sm font-medium text-gray-500">Enrichment Factor (EF)</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(selectedSample.result.ef)}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      Formula: EF = (Ci/Cref)sample / (Ci/Cref)background
                    </p>
                  </div>
                </div>
                
                {/* Recommendations */}
                {selectedSample.result.recommendations && selectedSample.result.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Recommendations</h4>
                    <ul className="list-disc pl-5 space-y-2 bg-blue-50/50 backdrop-blur-sm p-4 rounded-lg border border-blue-200/30">
                      {selectedSample.result.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-800">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Risk Assessment */}
                <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-lg border border-blue-200/30">
                  <p className="text-sm font-medium text-gray-500">Risk Assessment</p>
                  <p className="mt-1 text-gray-900">{selectedSample.result.riskAssessment}</p>
                  <div className="mt-3 text-xs text-gray-600">
                    <p className="font-medium">Assessment Criteria:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>HPI &lt; 100: Safe</li>
                      <li>100 ≤ HPI &lt; 200: Moderate</li>
                      <li>200 ≤ HPI &lt; 300: High</li>
                      <li>HPI ≥ 300: Critical</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
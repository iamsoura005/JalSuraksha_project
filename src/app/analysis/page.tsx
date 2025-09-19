'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSamplesStore } from '@/stores/sampleStore';
import { SampleData } from '@/types';
import { calculateHPI } from '@/lib/calculations';

// Define types for analysis results
interface CorrelationResult {
  metal1: string;
  metal2: string;
  correlation: number;
}

interface SourceIdentificationResult {
  metal: string;
  likelySources: string[];
  confidence: number;
}

interface RiskAssessmentResult {
  scenario: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendations: string[];
}

interface ScenarioResult {
  scenario: string;
  hpi: number;
  riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
}

export default function AdvancedAnalysisPage() {
  const samples = useSamplesStore((state: { samples: SampleData[] }) => state.samples);
  const [correlationResults, setCorrelationResults] = useState<CorrelationResult[]>([]);
  const [sourceResults, setSourceResults] = useState<SourceIdentificationResult[]>([]);
  const [riskAssessmentResults, setRiskAssessmentResults] = useState<RiskAssessmentResult[]>([]);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [activeTab, setActiveTab] = useState<'correlation' | 'sources' | 'risk' | 'scenarios'>('correlation');

  // Calculate correlations between metals
  const calculateCorrelations = useCallback(() => {
    if (samples.length === 0) return [];

    // Get all metal names
    const metals: (keyof SampleData)[] = ['lead', 'arsenic', 'cadmium', 'chromium', 'copper', 'iron', 'zinc'];
    
    const results: CorrelationResult[] = [];
    
    // Calculate correlation between each pair of metals
    for (let i = 0; i < metals.length; i++) {
      for (let j = i + 1; j < metals.length; j++) {
        const metal1 = metals[i];
        const metal2 = metals[j];
        
        // Extract values for both metals
        const values1 = samples.map((sample: SampleData) => sample[metal1] as number);
        const values2 = samples.map((sample: SampleData) => sample[metal2] as number);
        
        // Calculate Pearson correlation coefficient
        const correlation = calculatePearsonCorrelation(values1, values2);
        
        results.push({
          metal1,
          metal2,
          correlation
        });
      }
    }
    
    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [samples]);

  // Calculate Pearson correlation coefficient
  const calculatePearsonCorrelation = useCallback((x: number[], y: number[]): number => {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    const sumY2 = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }, []);

  // Identify likely sources of contamination
  const identifySources = useCallback(() => {
    if (samples.length === 0) return [];
    
    const results: SourceIdentificationResult[] = [];
    const metals: (keyof SampleData)[] = ['lead', 'arsenic', 'cadmium', 'chromium', 'copper', 'iron', 'zinc'];
    
    metals.forEach(metal => {
      // Get average concentration for this metal
      const avgConcentration = samples.reduce((sum: number, sample: SampleData) => sum + (sample[metal] as number), 0) / samples.length;
      
      // Determine likely sources based on concentration levels and patterns
      const likelySources: string[] = [];
      let confidence = 0;
      
      switch (metal) {
        case 'lead':
          if (avgConcentration > 0.01) {
            likelySources.push('Industrial waste', 'Vehicle emissions', 'Paint residue');
            confidence = Math.min(0.9, avgConcentration / 0.1);
          }
          break;
        case 'arsenic':
          if (avgConcentration > 0.01) {
            likelySources.push('Pesticides', 'Mining activities', 'Natural geological sources');
            confidence = Math.min(0.85, avgConcentration / 0.05);
          }
          break;
        case 'cadmium':
          if (avgConcentration > 0.003) {
            likelySources.push('Battery manufacturing', 'Fertilizers', 'Sewage sludge');
            confidence = Math.min(0.9, avgConcentration / 0.02);
          }
          break;
        case 'chromium':
          if (avgConcentration > 0.05) {
            likelySources.push('Metal plating', 'Leather tanning', 'Cement production');
            confidence = Math.min(0.8, avgConcentration / 0.2);
          }
          break;
        case 'copper':
          if (avgConcentration > 2.0) {
            likelySources.push('Agricultural runoff', 'Pipe corrosion', 'Mining');
            confidence = Math.min(0.7, avgConcentration / 5);
          }
          break;
        case 'iron':
          if (avgConcentration > 0.3) {
            likelySources.push('Natural soil', 'Pipe corrosion', 'Industrial discharge');
            confidence = Math.min(0.6, avgConcentration / 1);
          }
          break;
        case 'zinc':
          if (avgConcentration > 3.0) {
            likelySources.push('Galvanizing processes', 'Rubber manufacturing', 'Coal combustion');
            confidence = Math.min(0.75, avgConcentration / 10);
          }
          break;
      }
      
      if (likelySources.length > 0) {
        results.push({
          metal,
          likelySources,
          confidence
        });
      }
    });
    
    return results;
  }, [samples]);

  // Perform risk assessment for different exposure scenarios
  const performRiskAssessment = useCallback(() => {
    const results: RiskAssessmentResult[] = [
      {
        scenario: 'Drinking Water',
        riskLevel: samples.some((s: SampleData) => calculateHPI(s) > 200) ? 'Critical' : 
                  samples.some((s: SampleData) => calculateHPI(s) > 100) ? 'High' : 
                  samples.some((s: SampleData) => calculateHPI(s) > 50) ? 'Medium' : 'Low',
        recommendations: [
          'Regular monitoring of water sources',
          'Install water treatment systems if necessary',
          'Educate community about water safety'
        ]
      },
      {
        scenario: 'Agricultural Irrigation',
        riskLevel: samples.some((s: SampleData) => calculateHPI(s) > 150) ? 'Critical' : 
                  samples.some((s: SampleData) => calculateHPI(s) > 75) ? 'High' : 
                  samples.some((s: SampleData) => calculateHPI(s) > 30) ? 'Medium' : 'Low',
        recommendations: [
          'Test soil for metal accumulation',
          'Consider alternative water sources',
          'Implement phytoremediation techniques'
        ]
      },
      {
        scenario: 'Industrial Use',
        riskLevel: samples.some((s: SampleData) => calculateHPI(s) > 300) ? 'Critical' : 
                  samples.some((s: SampleData) => calculateHPI(s) > 150) ? 'High' : 
                  samples.some((s: SampleData) => calculateHPI(s) > 75) ? 'Medium' : 'Low',
        recommendations: [
          'Enhanced treatment protocols required',
          'Regular equipment maintenance to prevent contamination',
          'Comply with industrial discharge standards'
        ]
      }
    ];
    
    return results;
  }, [samples, calculateHPI]);

  // Perform what-if scenario planning
  const performScenarioPlanning = useCallback(() => {
    if (samples.length === 0) return [];
    
    // Use the first sample as baseline for scenarios
    const baselineSample: SampleData = { ...samples[0] };
    
    const scenarios: ScenarioResult[] = [
      {
        scenario: 'Baseline (Current Conditions)',
        hpi: calculateHPI(baselineSample),
        riskLevel: baselineSample.lead > 0.01 || baselineSample.arsenic > 0.01 ? 'High' : 'Safe'
      },
      {
        scenario: '2x Lead Concentration',
        hpi: calculateHPI({ ...baselineSample, lead: baselineSample.lead * 2 }),
        riskLevel: 'High'
      },
      {
        scenario: '50% Reduction in All Metals',
        hpi: calculateHPI({
          ...baselineSample,
          lead: baselineSample.lead * 0.5,
          arsenic: baselineSample.arsenic * 0.5,
          cadmium: baselineSample.cadmium * 0.5,
          chromium: baselineSample.chromium * 0.5,
          copper: baselineSample.copper * 0.5,
          iron: baselineSample.iron * 0.5,
          zinc: baselineSample.zinc * 0.5
        }),
        riskLevel: 'Safe'
      },
      {
        scenario: 'Industrial Spill Impact',
        hpi: calculateHPI({
          ...baselineSample,
          lead: Math.max(baselineSample.lead, 0.05),
          chromium: Math.max(baselineSample.chromium, 0.2),
          cadmium: Math.max(baselineSample.cadmium, 0.01)
        }),
        riskLevel: 'Critical'
      }
    ];
    
    return scenarios;
  }, [samples, calculateHPI]);

  // Run analyses when samples change
  useEffect(() => {
    setCorrelationResults(calculateCorrelations());
    setSourceResults(identifySources());
    setRiskAssessmentResults(performRiskAssessment());
    setScenarioResults(performScenarioPlanning());
  }, [samples, calculateCorrelations, identifySources, performRiskAssessment, performScenarioPlanning]);

  // Get color for correlation value
  const getCorrelationColor = (correlation: number) => {
    if (Math.abs(correlation) > 0.7) return 'bg-red-100 text-red-800';
    if (Math.abs(correlation) > 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Get color for risk level
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analysis Tools</h1>
          <p className="text-gray-600">
            Correlation analysis, source identification, risk assessment, and scenario planning
          </p>
        </div>
        
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('correlation')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'correlation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Correlation Analysis
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sources'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Source Identification
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'risk'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Risk Assessment
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scenarios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scenario Planning
            </button>
          </nav>
        </div>
        
        {/* Correlation Analysis */}
        {activeTab === 'correlation' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Metal Correlation Analysis</h2>
            <p className="text-gray-600 mb-6">
              Analysis of relationships between different heavy metals in your samples.
            </p>
            
            {correlationResults.length === 0 ? (
              <p className="text-gray-500">No correlation data available. Please add sample data first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metal 1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metal 2
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correlation Coefficient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strength
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {correlationResults.map((result, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {result.metal1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {result.metal2}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.correlation.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCorrelationColor(result.correlation)}`}>
                            {Math.abs(result.correlation) > 0.7 ? 'Strong' : 
                             Math.abs(result.correlation) > 0.4 ? 'Moderate' : 'Weak'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Source Identification */}
        {activeTab === 'sources' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Source Identification</h2>
            <p className="text-gray-600 mb-6">
              Likely sources of heavy metal contamination based on concentration patterns.
            </p>
            
            {sourceResults.length === 0 ? (
              <p className="text-gray-500">No source identification data available. Please add sample data first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sourceResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">{result.metal}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {(result.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Likely Sources:</h4>
                      <ul className="mt-2 space-y-1">
                        {result.likelySources.map((source, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">{source}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Risk Assessment */}
        {activeTab === 'risk' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Assessment</h2>
            <p className="text-gray-600 mb-6">
              Risk evaluation for different exposure scenarios based on pollution levels.
            </p>
            
            {riskAssessmentResults.length === 0 ? (
              <p className="text-gray-500">No risk assessment data available. Please add sample data first.</p>
            ) : (
              <div className="space-y-6">
                {riskAssessmentResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{result.scenario}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(result.riskLevel)}`}>
                        {result.riskLevel} Risk
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Recommendations:</h4>
                      <ul className="mt-2 space-y-1">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Scenario Planning */}
        {activeTab === 'scenarios' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What-If Scenario Planning</h2>
            <p className="text-gray-600 mb-6">
              Predictive analysis of potential contamination scenarios and their impact.
            </p>
            
            {scenarioResults.length === 0 ? (
              <p className="text-gray-500">No scenario data available. Please add sample data first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scenario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted HPI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scenarioResults.map((result, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.scenario}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.hpi.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(result.riskLevel)}`}>
                            {result.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">Scenario Planning Tips</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• Use these scenarios to prepare for potential contamination events</li>
                <li>• Plan remediation strategies based on predicted risk levels</li>
                <li>• Consider implementing early warning systems for high-risk scenarios</li>
                <li>• Regularly update scenarios based on new data and changing conditions</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
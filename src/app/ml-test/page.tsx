'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadMLModels } from '@/lib/mlModels';
import { loadEnhancedMLModels } from '@/lib/enhancedMLModels';
import { SampleData } from '@/types';
import { calculatePollutionIndices } from '@/lib/mlModels';
import { calculatePollutionIndicesEnhanced } from '@/lib/enhancedMLModels';
import * as tf from '@tensorflow/tfjs';

// Define proper types instead of 'any'
interface StandardModels {
  regressionModel: tf.LayersModel | null;
  classificationModel: tf.LayersModel | null;
  preprocessingParams: PreprocessingParams | null;
}

interface EnhancedModels {
  regressionModel: tf.LayersModel | null;
  classificationModel: tf.LayersModel | null;
  anomalyDetectionModel: tf.LayersModel | null;
  ensembleModels: tf.LayersModel[];
  preprocessingParams: PreprocessingParams | null;
}

interface PreprocessingParams {
  feature_means: number[];
  feature_stds: number[];
  feature_names: string[];
}

interface StandardTestResult {
  sampleId: string;
  hpi: number;
  hei: number;
  cd: number;
  ef: number;
  safetyLevel: string;
  // Note: calculatePollutionIndices from mlModels.ts doesn't return isMLAnalysis or riskAssessment
}

interface TestResult {
  standard: StandardTestResult;
  enhanced: {
    sampleId: string;
    hpi: number;
    hei: number;
    cd: number;
    ef: number;
    safetyLevel: string;
    isMLAnalysis: boolean;
    isAnomaly: boolean;
    anomalyScore: number;
    ensembleHPI: number | null;
    confidence: number | null;
    riskAssessment: string;
    recommendations: string[];
  };
}

export default function MLTestPage() {
  const [loading, setLoading] = useState(true);
  const [standardModels, setStandardModels] = useState<StandardModels | null>(null);
  const [enhancedModels, setEnhancedModels] = useState<EnhancedModels | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testMLModels = async () => {
      try {
        console.log('Testing ML models in browser environment...');
        
        // Load standard ML models
        console.log('Loading standard ML models...');
        const standardModelsResult = await loadMLModels();
        console.log('Standard ML models loaded:', standardModelsResult);
        setStandardModels(standardModelsResult);
        
        // Load enhanced ML models
        console.log('Loading enhanced ML models...');
        const enhancedModelsResult = await loadEnhancedMLModels();
        console.log('Enhanced ML models loaded:', enhancedModelsResult);
        setEnhancedModels(enhancedModelsResult);
        
        // Test with sample data
        const sampleData: SampleData = {
          id: 'test-1',
          sampleId: 'TEST-001',
          latitude: 12.9716,
          longitude: 77.5946,
          lead: 0.015,
          arsenic: 0.008,
          cadmium: 0.004,
          chromium: 0.06,
          copper: 2.5,
          iron: 0.4,
          zinc: 4.2
        };
        
        console.log('Test sample data:', sampleData);
        
        // Test standard ML calculation
        const standardResult = await calculatePollutionIndices(sampleData);
        console.log('Standard ML calculation result:', standardResult);
        
        // Test enhanced ML calculation
        const enhancedResult = await calculatePollutionIndicesEnhanced(sampleData);
        console.log('Enhanced ML calculation result:', enhancedResult);
        
        setTestResult({
          standard: standardResult,
          enhanced: enhancedResult
        });
        
        setLoading(false);
      } catch (err) {
        console.error('ML models test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    testMLModels();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing ML models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ML Models Test Failed</h1>
          <p className="text-gray-700 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">ML Models Test Results</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Standard ML Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Regression Model</p>
              <p className="font-medium">{standardModels?.regressionModel ? 'Loaded' : 'Not Loaded'}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Classification Model</p>
              <p className="font-medium">{standardModels?.classificationModel ? 'Loaded' : 'Not Loaded'}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Preprocessing Params</p>
              <p className="font-medium">{standardModels?.preprocessingParams ? 'Loaded' : 'Not Loaded'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enhanced ML Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Regression Model</p>
              <p className="font-medium">{enhancedModels?.regressionModel ? 'Loaded' : 'Not Loaded'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Classification Model</p>
              <p className="font-medium">{enhancedModels?.classificationModel ? 'Loaded' : 'Not Loaded'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Anomaly Detection</p>
              <p className="font-medium">{enhancedModels?.anomalyDetectionModel ? 'Loaded' : 'Not Loaded'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Ensemble Models</p>
              <p className="font-medium">{enhancedModels?.ensembleModels?.length || 0} Loaded</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Preprocessing Params</p>
              <p className="font-medium">{enhancedModels?.preprocessingParams ? 'Loaded' : 'Not Loaded'}</p>
            </div>
          </div>
        </div>
        
        {testResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Calculation Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Standard ML Calculation</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Sample ID:</span> {testResult.standard.sampleId || 'N/A'}</p>
                  <p><span className="font-medium">HPI:</span> {testResult.standard.hpi?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">HEI:</span> {testResult.standard.hei?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">Cd:</span> {testResult.standard.cd?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">EF:</span> {testResult.standard.ef?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">Safety Level:</span> {testResult.standard.safetyLevel || 'N/A'}</p>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Enhanced ML Calculation</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Sample ID:</span> {testResult.enhanced.sampleId || 'N/A'}</p>
                  <p><span className="font-medium">HPI:</span> {testResult.enhanced.hpi?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">HEI:</span> {testResult.enhanced.hei?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">Cd:</span> {testResult.enhanced.cd?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">EF:</span> {testResult.enhanced.ef?.toFixed(2) || 'N/A'}</p>
                  <p><span className="font-medium">Safety Level:</span> {testResult.enhanced.safetyLevel || 'N/A'}</p>
                  <p><span className="font-medium">ML Analysis:</span> {testResult.enhanced.isMLAnalysis ? 'Yes' : 'No'}</p>
                  <p><span className="font-medium">Anomaly:</span> {testResult.enhanced.isAnomaly !== undefined ? (testResult.enhanced.isAnomaly ? 'Yes' : 'No') : 'N/A'}</p>
                  {testResult.enhanced.confidence !== undefined && testResult.enhanced.confidence !== null && (
                    <p><span className="font-medium">Confidence:</span> {(Number(testResult.enhanced.confidence) * 100).toFixed(1)}%</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry Test
          </button>
          <Link 
            href="/" 
            className="ml-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
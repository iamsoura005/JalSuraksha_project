import * as tf from '@tensorflow/tfjs';
import { PreprocessingParams, SampleData } from '@/types';
import { calculateHPI, calculateHEI, calculateCd, calculateEF, getSafetyLevel, getRiskAssessment } from '@/lib/calculations';

// Global variables to store loaded models
let regressionModel: tf.LayersModel | null = null;
let classificationModel: tf.LayersModel | null = null;
let anomalyDetectionModel: tf.LayersModel | null = null;
let ensembleModels: tf.LayersModel[] = [];
let preprocessingParams: PreprocessingParams | null = null;
let modelsLoaded = false;

/**
 * Load enhanced ML models on app initialization
 */
export const loadEnhancedMLModels = async (): Promise<{
  regressionModel: tf.LayersModel | null;
  classificationModel: tf.LayersModel | null;
  anomalyDetectionModel: tf.LayersModel | null;
  ensembleModels: tf.LayersModel[];
  preprocessingParams: PreprocessingParams | null;
}> => {
  try {
    console.log('Attempting to load enhanced ML models...');
    
    // Load primary models
    console.log('Loading regression model from /models/heavy_metal_model.json');
    regressionModel = await tf.loadLayersModel('/models/heavy_metal_model.json');
    
    console.log('Loading classification model from /models/safety_classifier.json');
    classificationModel = await tf.loadLayersModel('/models/safety_classifier.json');
    
    // Load anomaly detection model
    console.log('Loading anomaly detection model from /models/anomaly_detector.json');
    try {
      anomalyDetectionModel = await tf.loadLayersModel('/models/anomaly_detector.json');
    } catch (error) {
      console.warn('Failed to load anomaly detection model:', error);
    }
    
    // Load ensemble models (multiple models for ensemble prediction)
    const modelPaths = [
      '/models/ensemble_model_1.json',
      '/models/ensemble_model_2.json',
      '/models/ensemble_model_3.json'
    ];
    
    ensembleModels = [];
    for (const path of modelPaths) {
      try {
        console.log(`Loading ensemble model from ${path}`);
        const model = await tf.loadLayersModel(path);
        ensembleModels.push(model);
      } catch (error) {
        console.warn(`Failed to load ensemble model from ${path}:`, error);
      }
    }
    
    // Load preprocessing parameters
    console.log('Loading preprocessing parameters from /models/preprocessing_params.json');
    const response = await fetch('/models/preprocessing_params.json');
    if (!response.ok) {
      throw new Error(`Failed to load preprocessing params: ${response.status} ${response.statusText}`);
    }
    preprocessingParams = await response.json();
    
    modelsLoaded = true;
    console.log('Enhanced ML models loaded successfully');
    return { 
      regressionModel, 
      classificationModel, 
      anomalyDetectionModel,
      ensembleModels,
      preprocessingParams 
    };
  } catch (error) {
    console.error('Failed to load enhanced ML models:', error);
    modelsLoaded = false;
    // Return null models so the app can fall back to calculation-based approach
    return { 
      regressionModel: null, 
      classificationModel: null, 
      anomalyDetectionModel: null,
      ensembleModels: [],
      preprocessingParams: null 
    };
  }
};

/**
 * Get loaded enhanced models
 */
export const getEnhancedLoadedModels = () => ({
  regressionModel,
  classificationModel,
  anomalyDetectionModel,
  ensembleModels,
  preprocessingParams,
  modelsLoaded
});

/**
 * Preprocess data for ML model input
 */
export const preprocessData = (data: number[], params: PreprocessingParams): number[] => {
  return data.map((value, index) => {
    const mean = params.feature_means[index] || 0;
    const std = params.feature_stds[index] || 1;
    return (value - mean) / std;
  });
};

/**
 * Ensemble prediction using multiple models
 */
export const ensemblePredict = async (inputTensor: tf.Tensor, models: tf.LayersModel[]): Promise<number[]> => {
  if (models.length === 0) {
    throw new Error('No models provided for ensemble prediction');
  }
  
  const predictions: number[] = [];
  
  for (const model of models) {
    try {
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const data = await prediction.data();
      predictions.push(data[0] as number);
      prediction.dispose();
    } catch (error) {
      console.warn('Error in ensemble model prediction:', error);
    }
  }
  
  return predictions;
};

/**
 * Detect anomalies in the sample data
 */
export const detectAnomalies = async (sampleData: SampleData): Promise<{isAnomaly: boolean; anomalyScore: number}> => {
  // Check if models are loaded in browser environment
  if (typeof window === 'undefined') {
    console.warn('ML models not available in server environment');
    return { isAnomaly: false, anomalyScore: 0 };
  }
  
  const { anomalyDetectionModel, preprocessingParams, modelsLoaded } = getEnhancedLoadedModels();
  
  if (!modelsLoaded || !anomalyDetectionModel || !preprocessingParams) {
    console.warn('Anomaly detection model not loaded');
    return { isAnomaly: false, anomalyScore: 0 };
  }
  
  try {
    // Prepare data array [lead, arsenic, cadmium, chromium, copper, iron, zinc]
    const data = [
      sampleData.lead,
      sampleData.arsenic,
      sampleData.cadmium,
      sampleData.chromium,
      sampleData.copper,
      sampleData.iron,
      sampleData.zinc
    ];
    
    // Preprocess the data
    const processedData = preprocessData(data, preprocessingParams);
    
    // Convert to tensor
    const inputTensor = tf.tensor2d([processedData]);
    
    // Make anomaly detection prediction
    const anomalyPrediction = anomalyDetectionModel.predict(inputTensor) as tf.Tensor;
    const anomalyScore = (await anomalyPrediction.data())[0] as number;
    
    // Clean up tensors
    inputTensor.dispose();
    anomalyPrediction.dispose();
    
    // Threshold for anomaly detection (adjustable)
    const anomalyThreshold = 0.8;
    const isAnomaly = anomalyScore > anomalyThreshold;
    
    return { isAnomaly, anomalyScore };
  } catch (error) {
    console.error('Anomaly detection failed:', error);
    return { isAnomaly: false, anomalyScore: 0 };
  }
};

/**
 * Predict pollution index using enhanced ML models with ensemble methods
 */
export const predictPollutionIndexEnhanced = async (sampleData: SampleData): Promise<{
  hpi: number | null; 
  safetyLevel: string | null;
  isAnomaly: boolean;
  anomalyScore: number;
  ensembleHPI: number | null;
  confidence: number | null;
}> => {
  // Check if models are loaded in browser environment
  if (typeof window === 'undefined') {
    console.warn('ML models not available in server environment');
    return { 
      hpi: null, 
      safetyLevel: null, 
      isAnomaly: false, 
      anomalyScore: 0,
      ensembleHPI: null,
      confidence: null
    };
  }
  
  const { 
    regressionModel, 
    classificationModel, 
    ensembleModels, 
    preprocessingParams, 
    modelsLoaded 
  } = getEnhancedLoadedModels();
  
  if (!modelsLoaded || !regressionModel || !classificationModel || !preprocessingParams) {
    console.warn('Enhanced ML models not loaded, falling back to calculation');
    return { 
      hpi: null, 
      safetyLevel: null, 
      isAnomaly: false, 
      anomalyScore: 0,
      ensembleHPI: null,
      confidence: null
    };
  }
  
  try {
    // Prepare data array [lead, arsenic, cadmium, chromium, copper, iron, zinc]
    const data = [
      sampleData.lead,
      sampleData.arsenic,
      sampleData.cadmium,
      sampleData.chromium,
      sampleData.copper,
      sampleData.iron,
      sampleData.zinc
    ];
    
    // Preprocess the data
    const processedData = preprocessData(data, preprocessingParams);
    
    // Convert to tensor
    const inputTensor = tf.tensor2d([processedData]);
    
    // Make regression prediction (HPI)
    const regressionPrediction = regressionModel.predict(inputTensor) as tf.Tensor;
    const hpi = (await regressionPrediction.data())[0] as number;
    
    // Make classification prediction (Safety Level)
    const classificationPrediction = classificationModel.predict(inputTensor) as tf.Tensor;
    const predictedClass = (await classificationPrediction.argMax(-1).data())[0] as number;
    
    // Map class index to safety level
    const safetyLevels = ['Safe', 'Moderate', 'High', 'Critical'];
    const safetyLevel = safetyLevels[predictedClass] || null;
    
    // Ensemble prediction
    let ensembleHPI: number | null = null;
    let confidence: number | null = null;
    
    if (ensembleModels.length > 0) {
      try {
        const ensemblePredictions = await ensemblePredict(inputTensor, ensembleModels);
        if (ensemblePredictions.length > 0) {
          // Average ensemble predictions
          ensembleHPI = ensemblePredictions.reduce((sum, pred) => sum + pred, 0) / ensemblePredictions.length;
          
          // Calculate confidence as inverse of variance (higher confidence with lower variance)
          const variance = ensemblePredictions.reduce((sum, pred) => 
            sum + Math.pow(pred - (ensembleHPI as number), 2), 0) / ensemblePredictions.length;
          confidence = 1 / (1 + variance); // Normalize confidence to [0, 1]
        }
      } catch (error) {
        console.warn('Ensemble prediction failed:', error);
      }
    }
    
    // Anomaly detection
    const { isAnomaly, anomalyScore } = await detectAnomalies(sampleData);
    
    // Clean up tensors
    inputTensor.dispose();
    regressionPrediction.dispose();
    classificationPrediction.dispose();
    
    return { hpi, safetyLevel, isAnomaly, anomalyScore, ensembleHPI, confidence };
  } catch (error) {
    console.error('Enhanced ML prediction failed:', error);
    return { 
      hpi: null, 
      safetyLevel: null, 
      isAnomaly: false, 
      anomalyScore: 0,
      ensembleHPI: null,
      confidence: null
    };
  }
};

/**
 * Generate remediation recommendations based on predictions
 */
export const generateRecommendations = (
  sampleData: SampleData, 
  hpi: number, 
  safetyLevel: string | null,
  isAnomaly: boolean,
  ensembleHPI: number | null
): string[] => {
  const recommendations: string[] = [];
  
  // Compare with calculated HPI for validation
  const calculatedHPI = calculateHPI(sampleData);
  const hpiDifference = Math.abs(hpi - calculatedHPI);
  
  // If there's a large discrepancy, recommend verification
  if (hpiDifference > 50) {
    recommendations.push('Significant discrepancy between ML prediction and calculated HPI. Recommend manual verification.');
  }
  
  // Safety level based recommendations
  switch (safetyLevel) {
    case 'Critical':
      recommendations.push('Immediate action required. Water not suitable for any use.');
      recommendations.push('Implement emergency water treatment protocols.');
      recommendations.push('Notify environmental authorities immediately.');
      break;
    case 'High':
      recommendations.push('Water not suitable for drinking. Consider treatment before use.');
      recommendations.push('Implement water treatment solutions.');
      break;
    case 'Moderate':
      recommendations.push('Water quality is moderate. Monitor regularly and consider treatment.');
      break;
    case 'Safe':
      recommendations.push('Water quality is within safe limits for drinking and irrigation.');
      break;
  }
  
  // Anomaly detection recommendations
  if (isAnomaly) {
    recommendations.push('Unusual pattern detected in sample data. Recommend additional testing.');
  }
  
  // Ensemble model recommendations
  if (ensembleHPI !== null) {
    const ensembleDifference = Math.abs(hpi - ensembleHPI);
    if (ensembleDifference > 30) {
      recommendations.push('Significant difference between primary and ensemble model predictions. Recommend expert review.');
    }
  }
  
  // Metal-specific recommendations
  const metalThresholds = {
    lead: 0.015,
    arsenic: 0.010,
    cadmium: 0.005,
    chromium: 0.100
  };
  
  Object.entries(metalThresholds).forEach(([metal, threshold]) => {
    const concentration = sampleData[metal as keyof SampleData] as number;
    if (concentration > threshold) {
      recommendations.push(`Elevated ${metal} levels detected. Consider ${metal}-specific treatment methods.`);
    }
  });
  
  return recommendations;
};

/**
 * Calculate pollution indices with enhanced ML capabilities
 */
export const calculatePollutionIndicesEnhanced = async (sample: SampleData) => {
  // Try to get predictions from enhanced ML models
  const { 
    hpi: mlHpi, 
    safetyLevel: mlSafetyLevel, 
    isAnomaly, 
    anomalyScore,
    ensembleHPI,
    confidence
  } = await predictPollutionIndexEnhanced(sample);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    sample, 
    mlHpi || 0, 
    mlSafetyLevel, 
    isAnomaly, 
    ensembleHPI
  );
  
  // If ML prediction successful, use it; otherwise fall back to calculation
  if (mlHpi !== null && mlSafetyLevel !== null) {
    const hei = calculateHEI(sample);
    const cd = calculateCd(sample);
    const ef = calculateEF(sample);
    const safetyLevel = mlSafetyLevel as 'Safe' | 'Moderate' | 'High' | 'Critical';
    
    return {
      sampleId: sample.sampleId,
      hpi: mlHpi,
      hei,
      cd,
      ef,
      safetyLevel,
      riskAssessment: getRiskAssessment({
        sampleId: sample.sampleId,
        hpi: mlHpi,
        hei,
        cd,
        ef,
        safetyLevel
      }),
      isMLAnalysis: true,
      isAnomaly,
      anomalyScore,
      ensembleHPI,
      confidence,
      recommendations
    };
  }
  
  // Fall back to calculation-based approach
  const hpi = calculateHPI(sample);
  const hei = calculateHEI(sample);
  const cd = calculateCd(sample);
  const ef = calculateEF(sample);
  const safetyLevel = getSafetyLevel(hpi);
  
  return {
    sampleId: sample.sampleId,
    hpi,
    hei,
    cd,
    ef,
    safetyLevel,
    riskAssessment: getRiskAssessment({
      sampleId: sample.sampleId,
      hpi,
      hei,
      cd,
      ef,
      safetyLevel
    }),
    isMLAnalysis: false,
    isAnomaly: false,
    anomalyScore: 0,
    ensembleHPI: null,
    confidence: null,
    recommendations: generateRecommendations(sample, hpi, safetyLevel, false, null)
  };
};
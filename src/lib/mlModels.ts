import * as tf from '@tensorflow/tfjs';
import { PreprocessingParams, SampleData } from '@/types';

// Global variables to store loaded models
let regressionModel: tf.LayersModel | null = null;
let classificationModel: tf.LayersModel | null = null;
let preprocessingParams: PreprocessingParams | null = null;
let modelsLoaded = false;

/**
 * Load pre-trained models on app initialization
 */
export const loadMLModels = async (): Promise<{
  regressionModel: tf.LayersModel | null;
  classificationModel: tf.LayersModel | null;
  preprocessingParams: PreprocessingParams | null;
}> => {
  try {
    console.log('Attempting to load ML models...');
    
    // Load regression model for pollution index prediction
    console.log('Loading regression model from /models/heavy_metal_model.json');
    regressionModel = await tf.loadLayersModel('/models/heavy_metal_model.json');
    
    // Load classification model for safety level prediction
    console.log('Loading classification model from /models/safety_classifier.json');
    classificationModel = await tf.loadLayersModel('/models/safety_classifier.json');
    
    // Load preprocessing parameters
    console.log('Loading preprocessing parameters from /models/preprocessing_params.json');
    const response = await fetch('/models/preprocessing_params.json');
    if (!response.ok) {
      throw new Error(`Failed to load preprocessing params: ${response.status} ${response.statusText}`);
    }
    preprocessingParams = await response.json();
    
    modelsLoaded = true;
    console.log('ML models loaded successfully');
    return { regressionModel, classificationModel, preprocessingParams };
  } catch (error) {
    console.error('Failed to load ML models:', error);
    modelsLoaded = false;
    // Return null models so the app can fall back to calculation-based approach
    return { regressionModel: null, classificationModel: null, preprocessingParams: null };
  }
};

/**
 * Get loaded models
 */
export const getLoadedModels = () => ({
  regressionModel,
  classificationModel,
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
 * Predict pollution index using ML model
 */
export const predictPollutionIndex = async (sampleData: SampleData): Promise<{hpi: number | null, safetyLevel: string | null}> => {
  // Check if models are loaded in browser environment
  if (typeof window === 'undefined') {
    console.warn('ML models not available in server environment');
    return { hpi: null, safetyLevel: null };
  }
  
  const { regressionModel, classificationModel, preprocessingParams, modelsLoaded } = getLoadedModels();
  
  if (!modelsLoaded || !regressionModel || !classificationModel || !preprocessingParams) {
    console.warn('ML models not loaded, falling back to calculation');
    return { hpi: null, safetyLevel: null };
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
    
    // Clean up tensors
    inputTensor.dispose();
    regressionPrediction.dispose();
    classificationPrediction.dispose();
    
    return { hpi, safetyLevel };
  } catch (error) {
    console.error('ML prediction failed:', error);
    return { hpi: null, safetyLevel: null };
  }
};

/**
 * Calculate pollution indices with ML enhancement
 */
export const calculatePollutionIndices = async (sample: SampleData) => {
  // Try to get predictions from ML models
  const { hpi: mlHpi, safetyLevel: mlSafetyLevel } = await predictPollutionIndex(sample);
  
  // If ML prediction successful, use it; otherwise fall back to calculation
  if (mlHpi !== null && mlSafetyLevel !== null) {
    return {
      sampleId: sample.sampleId,
      hpi: mlHpi,
      // For other indices, we'll still use calculations for consistency
      hei: calculateHEI(sample),
      cd: calculateCd(sample),
      ef: calculateEF(sample),
      safetyLevel: mlSafetyLevel as 'Safe' | 'Moderate' | 'High' | 'Critical'
    };
  }
  
  // Fall back to calculation-based approach
  return calculatePollutionIndicesFallback(sample);
};

// Import calculation functions
const STANDARDS = {
  lead: 0.01,
  arsenic: 0.01,
  cadmium: 0.003,
  chromium: 0.05,
  copper: 2.0,
  iron: 0.3,
  zinc: 3.0
};

const calculateHEI = (sample: SampleData): number => {
  const ratios = [
    sample.lead / STANDARDS.lead,
    sample.arsenic / STANDARDS.arsenic,
    sample.cadmium / STANDARDS.cadmium,
    sample.chromium / STANDARDS.chromium,
    sample.copper / STANDARDS.copper,
    sample.iron / STANDARDS.iron,
    sample.zinc / STANDARDS.zinc
  ];
  
  return Math.max(...ratios);
};

const calculateCd = (sample: SampleData): number => {
  const ratios = [
    sample.lead / STANDARDS.lead,
    sample.arsenic / STANDARDS.arsenic,
    sample.cadmium / STANDARDS.cadmium,
    sample.chromium / STANDARDS.chromium,
    sample.copper / STANDARDS.copper,
    sample.iron / STANDARDS.iron,
    sample.zinc / STANDARDS.zinc
  ];
  
  return ratios.reduce((sum, ratio) => sum + ratio, 0);
};

const calculateEF = (sample: SampleData): number => {
  // Using iron as reference element and assuming background ratios
  const backgroundRatios = {
    lead: 0.5,
    arsenic: 0.3,
    cadmium: 0.2,
    chromium: 0.8,
    copper: 1.2,
    iron: 1.0, // Reference element
    zinc: 0.9
  };
  
  const ironRatio = sample.iron / STANDARDS.iron;
  
  // Calculate average EF for all metals except iron
  const efValues = [
    (sample.lead / STANDARDS.lead) / (backgroundRatios.lead * ironRatio),
    (sample.arsenic / STANDARDS.arsenic) / (backgroundRatios.arsenic * ironRatio),
    (sample.cadmium / STANDARDS.cadmium) / (backgroundRatios.cadmium * ironRatio),
    (sample.chromium / STANDARDS.chromium) / (backgroundRatios.chromium * ironRatio),
    (sample.copper / STANDARDS.copper) / (backgroundRatios.copper * ironRatio),
    (sample.zinc / STANDARDS.zinc) / (backgroundRatios.zinc * ironRatio)
  ];
  
  return efValues.reduce((sum, ef) => sum + ef, 0) / efValues.length;
};

const calculatePollutionIndicesFallback = (sample: SampleData) => {
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
    safetyLevel
  };
};

const calculateHPI = (sample: SampleData): number => {
  const WEIGHTS = {
    lead: 0.2,
    arsenic: 0.2,
    cadmium: 0.2,
    chromium: 0.15,
    copper: 0.1,
    iron: 0.1,
    zinc: 0.05
  };
  
  let hpi = 0;
  
  for (const [metal, concentration] of Object.entries({
    lead: sample.lead,
    arsenic: sample.arsenic,
    cadmium: sample.cadmium,
    chromium: sample.chromium,
    copper: sample.copper,
    iron: sample.iron,
    zinc: sample.zinc
  })) {
    const weight = WEIGHTS[metal as keyof typeof WEIGHTS];
    const standard = STANDARDS[metal as keyof typeof STANDARDS];
    const subIndex = (concentration / standard) * 100;
    hpi += weight * subIndex;
  }
  
  return hpi;
};

const getSafetyLevel = (hpi: number): 'Safe' | 'Moderate' | 'High' | 'Critical' => {
  if (hpi < 100) return 'Safe';
  if (hpi < 200) return 'Moderate';
  if (hpi < 300) return 'High';
  return 'Critical';
};
import { SampleData, PollutionIndexResult, PollutionIndexResultWithML } from '@/types';
import { predictPollutionIndex } from './mlModels';

// Standard values for heavy metals (in ppm)
export const STANDARDS = {
  lead: 0.01,
  arsenic: 0.01,
  cadmium: 0.003,
  chromium: 0.05,
  copper: 2.0,
  iron: 0.3,
  zinc: 3.0
};

// Weights for HPI calculation
export const WEIGHTS = {
  lead: 0.2,
  arsenic: 0.2,
  cadmium: 0.2,
  chromium: 0.15,
  copper: 0.1,
  iron: 0.1,
  zinc: 0.05
};

/**
 * Calculate Heavy Metal Pollution Index (HPI)
 * HPI = Σ(Wi × (Ci/Si) × 100)
 * Where Wi = weight, Ci = concentration, Si = standard
 */
export const calculateHPI = (sample: SampleData): number => {
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

/**
 * Calculate Heavy Metal Evaluation Index (HEI)
 * HEI = (Ci/Si)max
 * Where Ci = concentration, Si = standard
 */
export const calculateHEI = (sample: SampleData): number => {
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

/**
 * Calculate Contamination Degree (Cd)
 * Cd = Σ(Ci/Si)
 * Where Ci = concentration, Si = standard
 */
export const calculateCd = (sample: SampleData): number => {
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

/**
 * Calculate Enrichment Factor (EF)
 * EF = (Ci/Cref)sample / (Ci/Cref)background
 * For simplicity, we'll use a fixed background ratio
 */
export const calculateEF = (sample: SampleData): number => {
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

/**
 * Determine safety level based on HPI value
 */
export const getSafetyLevel = (hpi: number): PollutionIndexResult['safetyLevel'] => {
  if (hpi < 100) return 'Safe';
  if (hpi < 200) return 'Moderate';
  if (hpi < 300) return 'High';
  return 'Critical';
};

/**
 * Generate risk assessment text based on pollution indices with formulas
 */
export const getRiskAssessment = (result: Omit<PollutionIndexResult, 'riskAssessment'>): string => {
  const { hpi, hei, cd } = result;
  
  let assessment = '';
  
  if (hpi < 100 && hei < 1 && cd < 7) {
    assessment = 'Groundwater quality is suitable for drinking and irrigation.';
  } else if (hpi < 200 && hei < 2 && cd < 14) {
    assessment = 'Groundwater quality is moderately contaminated. Use with caution.';
  } else if (hpi < 300 && hei < 3 && cd < 21) {
    assessment = 'Groundwater quality is highly contaminated. Not suitable for drinking.';
  } else {
    assessment = 'Groundwater quality is critically contaminated. Not suitable for any use.';
  }
  
  // Add formula information
  assessment += ` HPI Formula: Σ(Wi × (Ci/Si) × 100). HEI Formula: (Ci/Si)max. Cd Formula: Σ(Ci/Si). EF Formula: (Ci/Cref)sample / (Ci/Cref)background.`;
  
  return assessment;
};

/**
 * Calculate all pollution indices for a sample with ML enhancement
 */
export const calculatePollutionIndices = async (sample: SampleData): Promise<PollutionIndexResultWithML> => {
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
      safetyLevel: mlSafetyLevel as 'Safe' | 'Moderate' | 'High' | 'Critical',
      riskAssessment: getRiskAssessment({
        sampleId: sample.sampleId,
        hpi: mlHpi,
        hei: calculateHEI(sample),
        cd: calculateCd(sample),
        ef: calculateEF(sample),
        safetyLevel: mlSafetyLevel as 'Safe' | 'Moderate' | 'High' | 'Critical'
      }),
      isMLAnalysis: true
    };
  }
  
  // Fall back to calculation-based approach
  const hpi = calculateHPI(sample);
  const hei = calculateHEI(sample);
  const cd = calculateCd(sample);
  const ef = calculateEF(sample);
  const safetyLevel = getSafetyLevel(hpi);
  
  const result = {
    sampleId: sample.sampleId,
    hpi,
    hei,
    cd,
    ef,
    safetyLevel
  };
  
  return {
    ...result,
    riskAssessment: getRiskAssessment(result),
    isMLAnalysis: false
  };
};

/**
 * Calculate pollution indices for multiple samples
 */
export const calculateMultipleSamples = async (samples: SampleData[]): Promise<PollutionIndexResultWithML[]> => {
  const results = await Promise.all(samples.map(sample => calculatePollutionIndices(sample)));
  return results;
};
export interface SampleData {
  id: string;
  sampleId: string;
  latitude: number;
  longitude: number;
  lead: number;
  arsenic: number;
  cadmium: number;
  chromium: number;
  copper: number;
  iron: number;
  zinc: number;
}

export interface PollutionIndexResult {
  sampleId: string;
  hpi: number;
  hei: number;
  cd: number;
  ef: number;
  safetyLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
  riskAssessment: string;
}

export interface PollutionIndexResultWithML extends PollutionIndexResult {
  isMLAnalysis: boolean;
}

export interface PreprocessingParams {
  feature_means: number[];
  feature_stds: number[];
  feature_names: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'researcher' | 'user';
}
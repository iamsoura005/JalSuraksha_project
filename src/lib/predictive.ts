import { supabase } from './supabase';

export interface PredictiveAnalysis {
  id?: string;
  location: string;
  analysis_type: 'trend' | 'seasonal' | 'prediction';
  parameters: Record<string, any>;
  results: Record<string, any>;
  confidence_score: number;
  warning_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  valid_until?: string;
  created_at: string;
}

export interface TrendAnalysis {
  parameter: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  rate_of_change: number;
  confidence: number;
  time_period: string;
}

export interface SeasonalPattern {
  parameter: string;
  seasonal_peaks: string[];
  seasonal_lows: string[];
  amplitude: number;
  confidence: number;
}

export interface Prediction {
  parameter: string;
  predicted_value: number;
  confidence_interval: [number, number];
  prediction_date: string;
  confidence: number;
}

export interface Warning {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  parameters: string[];
  recommended_actions: string[];
  expires_at: string;
}

// Analyze historical trends
export const analyzeHistoricalTrends = async (location: string, timeframe: number = 365) => {
  try {
    // Get historical water reports for the location
    const { data: reports, error } = await supabase
      .from('water_reports')
      .select('*')
      .ilike('location', `%${location}%`)
      .gte('created_at', new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!reports || reports.length < 3) {
      return { data: null, error: 'Insufficient data for trend analysis' };
    }

    const parameters = ['hpi', 'hei', 'cd', 'ef', 'lead', 'arsenic', 'cadmium', 'chromium'];
    const trends: TrendAnalysis[] = [];

    parameters.forEach(param => {
      const values = reports.map(r => r[param]).filter(v => v !== null && v !== undefined);
      if (values.length < 3) return;

      // Simple linear regression for trend analysis
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = values;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate R-squared for confidence
      const yMean = sumY / n;
      const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
      const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
      const rSquared = 1 - (ssRes / ssTot);

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(slope) < 0.01) trend = 'stable';
      else if (slope > 0) trend = 'increasing';
      else trend = 'decreasing';

      trends.push({
        parameter: param,
        trend,
        rate_of_change: slope,
        confidence: Math.max(0, Math.min(1, rSquared)),
        time_period: `${timeframe} days`
      });
    });

    // Store analysis results
    const analysisData: Omit<PredictiveAnalysis, 'id'> = {
      location,
      analysis_type: 'trend',
      parameters: { timeframe, sample_count: reports.length },
      results: { trends },
      confidence_score: trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length,
      warning_level: determineWarningLevel(trends),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: analysis, error: insertError } = await supabase
      .from('predictive_analysis')
      .insert(analysisData)
      .select()
      .single();

    if (insertError) throw insertError;

    return { data: analysis, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Analyze seasonal patterns
export const analyzeSeasonalPatterns = async (location: string, years: number = 2) => {
  try {
    const timeframe = years * 365;
    const { data: reports, error } = await supabase
      .from('water_reports')
      .select('*')
      .ilike('location', `%${location}%`)
      .gte('created_at', new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!reports || reports.length < 12) {
      return { data: null, error: 'Insufficient data for seasonal analysis' };
    }

    const parameters = ['hpi', 'hei', 'cd', 'ef'];
    const patterns: SeasonalPattern[] = [];

    parameters.forEach(param => {
      const monthlyData: Record<number, number[]> = {};
      
      reports.forEach(report => {
        const month = new Date(report.created_at).getMonth();
        if (!monthlyData[month]) monthlyData[month] = [];
        if (report[param] !== null && report[param] !== undefined) {
          monthlyData[month].push(report[param]);
        }
      });

      // Calculate monthly averages
      const monthlyAverages: Record<number, number> = {};
      Object.keys(monthlyData).forEach(month => {
        const values = monthlyData[parseInt(month)];
        monthlyAverages[parseInt(month)] = values.reduce((a, b) => a + b, 0) / values.length;
      });

      if (Object.keys(monthlyAverages).length < 6) return;

      // Find peaks and lows
      const values = Object.values(monthlyAverages);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const amplitude = maxValue - minValue;

      const peaks = Object.keys(monthlyAverages)
        .filter(month => monthlyAverages[parseInt(month)] > maxValue * 0.9)
        .map(month => getMonthName(parseInt(month)));

      const lows = Object.keys(monthlyAverages)
        .filter(month => monthlyAverages[parseInt(month)] < minValue * 1.1)
        .map(month => getMonthName(parseInt(month)));

      // Calculate confidence based on data consistency
      const variance = values.reduce((sum, val) => sum + Math.pow(val - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) / values.length;
      const confidence = Math.max(0, Math.min(1, 1 - (variance / (amplitude * amplitude))));

      patterns.push({
        parameter: param,
        seasonal_peaks: peaks,
        seasonal_lows: lows,
        amplitude,
        confidence
      });
    });

    // Store analysis results
    const analysisData: Omit<PredictiveAnalysis, 'id'> = {
      location,
      analysis_type: 'seasonal',
      parameters: { years, sample_count: reports.length },
      results: { patterns },
      confidence_score: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
      warning_level: 'none',
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: analysis, error: insertError } = await supabase
      .from('predictive_analysis')
      .insert(analysisData)
      .select()
      .single();

    if (insertError) throw insertError;

    return { data: analysis, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Generate future predictions
export const generatePredictions = async (location: string, daysAhead: number = 30) => {
  try {
    // Get recent data for prediction
    const { data: reports, error } = await supabase
      .from('water_reports')
      .select('*')
      .ilike('location', `%${location}%`)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!reports || reports.length < 5) {
      return { data: null, error: 'Insufficient data for predictions' };
    }

    const parameters = ['hpi', 'hei', 'cd', 'ef'];
    const predictions: Prediction[] = [];

    parameters.forEach(param => {
      const values = reports.map(r => r[param]).filter(v => v !== null && v !== undefined);
      if (values.length < 3) return;

      // Simple moving average with trend
      const recentValues = values.slice(-5);
      const average = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      
      // Calculate trend from last 3 values
      const trend = recentValues.length >= 3 ? 
        (recentValues[recentValues.length - 1] - recentValues[recentValues.length - 3]) / 2 : 0;

      const predicted_value = average + (trend * daysAhead / 30);
      
      // Calculate confidence interval (simplified)
      const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / recentValues.length;
      const stdDev = Math.sqrt(variance);
      const margin = stdDev * 1.96; // 95% confidence interval

      predictions.push({
        parameter: param,
        predicted_value: Math.max(0, predicted_value),
        confidence_interval: [
          Math.max(0, predicted_value - margin),
          predicted_value + margin
        ],
        prediction_date: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString(),
        confidence: Math.max(0, Math.min(1, 1 - (stdDev / average)))
      });
    });

    // Store analysis results
    const analysisData: Omit<PredictiveAnalysis, 'id'> = {
      location,
      analysis_type: 'prediction',
      parameters: { days_ahead: daysAhead, sample_count: reports.length },
      results: { predictions },
      confidence_score: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
      warning_level: determinePredictionWarningLevel(predictions),
      valid_until: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: analysis, error: insertError } = await supabase
      .from('predictive_analysis')
      .insert(analysisData)
      .select()
      .single();

    if (insertError) throw insertError;

    return { data: analysis, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Generate warnings based on analysis
export const generateWarnings = async (location: string): Promise<Warning[]> => {
  try {
    // Get recent analyses
    const { data: analyses, error } = await supabase
      .from('predictive_analysis')
      .select('*')
      .ilike('location', `%${location}%`)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!analyses || analyses.length === 0) return [];

    const warnings: Warning[] = [];

    analyses.forEach(analysis => {
      if (analysis.warning_level === 'none') return;

      let message = '';
      let parameters: string[] = [];
      let recommended_actions: string[] = [];

      if (analysis.analysis_type === 'trend') {
        const trends = analysis.results.trends || [];
        const increasingTrends = trends.filter((t: TrendAnalysis) => 
          t.trend === 'increasing' && t.confidence > 0.7 && ['hpi', 'hei', 'cd'].includes(t.parameter)
        );

        if (increasingTrends.length > 0) {
          parameters = increasingTrends.map((t: TrendAnalysis) => t.parameter);
          message = `Increasing contamination trends detected in ${parameters.join(', ')}`;
          recommended_actions = [
            'Increase monitoring frequency',
            'Investigate contamination sources',
            'Consider water treatment options',
            'Alert local authorities'
          ];
        }
      } else if (analysis.analysis_type === 'prediction') {
        const predictions = analysis.results.predictions || [];
        const criticalPredictions = predictions.filter((p: Prediction) => 
          p.predicted_value > 200 && p.parameter === 'hpi'
        );

        if (criticalPredictions.length > 0) {
          parameters = ['hpi'];
          message = 'Critical HPI levels predicted in the near future';
          recommended_actions = [
            'Implement immediate water treatment',
            'Seek alternative water sources',
            'Notify health authorities',
            'Prepare emergency response plan'
          ];
        }
      }

      if (message) {
        warnings.push({
          level: analysis.warning_level as 'low' | 'medium' | 'high' | 'critical',
          message,
          parameters,
          recommended_actions,
          expires_at: analysis.valid_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });

    return warnings;
  } catch (error) {
    console.error('Error generating warnings:', error);
    return [];
  }
};

// Get all predictive analyses for a location
export const getPredictiveAnalyses = async (location?: string, type?: string) => {
  try {
    let query = supabase
      .from('predictive_analysis')
      .select('*')
      .order('created_at', { ascending: false });

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (type) {
      query = query.eq('analysis_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Helper functions
const determineWarningLevel = (trends: TrendAnalysis[]): 'none' | 'low' | 'medium' | 'high' | 'critical' => {
  const criticalTrends = trends.filter(t => 
    t.trend === 'increasing' && 
    t.confidence > 0.8 && 
    ['hpi', 'hei'].includes(t.parameter) &&
    t.rate_of_change > 1
  );

  const highTrends = trends.filter(t => 
    t.trend === 'increasing' && 
    t.confidence > 0.6 && 
    ['hpi', 'hei', 'cd'].includes(t.parameter)
  );

  if (criticalTrends.length > 0) return 'critical';
  if (highTrends.length > 1) return 'high';
  if (highTrends.length > 0) return 'medium';
  return 'none';
};

const determinePredictionWarningLevel = (predictions: Prediction[]): 'none' | 'low' | 'medium' | 'high' | 'critical' => {
  const hpiPrediction = predictions.find(p => p.parameter === 'hpi');
  if (!hpiPrediction) return 'none';

  if (hpiPrediction.predicted_value > 300) return 'critical';
  if (hpiPrediction.predicted_value > 200) return 'high';
  if (hpiPrediction.predicted_value > 100) return 'medium';
  return 'low';
};

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month] || 'Unknown';
};
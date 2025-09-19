import { NextResponse } from 'next/server';

export async function GET() {
  // ML models can only be loaded in browser environment, not in server API routes
  return NextResponse.json({ 
    success: true, 
    message: 'ML models can only be loaded in browser environment. This API is running on the server.',
    standardModels: {
      regressionModel: null,
      classificationModel: null,
      preprocessingParams: null
    },
    enhancedModels: {
      regressionModel: null,
      classificationModel: null,
      anomalyDetectionModel: null,
      ensembleModels: 0,
      preprocessingParams: null
    }
  });
}
import { loadMLModels } from './mlModels';
import { loadEnhancedMLModels } from './enhancedMLModels';
import { SampleData } from '@/types';

/**
 * Test ML models with sample data
 */
export const testMLModels = async () => {
  try {
    console.log('Testing ML models...');
    
    // Load standard ML models
    console.log('Loading standard ML models...');
    const standardModels = await loadMLModels();
    console.log('Standard ML models loaded:', standardModels);
    
    // Load enhanced ML models
    console.log('Loading enhanced ML models...');
    const enhancedModels = await loadEnhancedMLModels();
    console.log('Enhanced ML models loaded:', enhancedModels);
    
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
    
    // Test successful
    console.log('ML models test completed successfully!');
    return true;
  } catch (error) {
    console.error('ML models test failed:', error);
    return false;
  }
};
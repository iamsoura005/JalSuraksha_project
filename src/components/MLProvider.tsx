'use client';

import { ReactNode, useEffect, useState } from 'react';
import { loadMLModels } from '@/lib/mlModels';
import { loadEnhancedMLModels } from '@/lib/enhancedMLModels';

export function MLProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize ML models in browser environment
    if (typeof window !== 'undefined') {
      const initializeMLModels = async () => {
        try {
          console.log('Initializing ML models...');
          
          // Load standard ML models
          const standardModels = await loadMLModels();
          console.log('Standard ML models loaded:', standardModels);
          
          // Load enhanced ML models
          const enhancedModels = await loadEnhancedMLModels();
          console.log('Enhanced ML models loaded:', enhancedModels);
          
          setIsInitialized(true);
          console.log('ML models initialization complete');
        } catch (error) {
          console.error('Failed to initialize ML models:', error);
          setInitializationError(error instanceof Error ? error.message : 'Unknown error');
          setIsInitialized(true); // Still set to initialized so app can continue
        }
      };

      initializeMLModels();
    } else {
      // In server environment, just set initialized to true
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ML models...</p>
          {initializationError && (
            <p className="mt-2 text-red-600 text-sm">Warning: {initializationError}</p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
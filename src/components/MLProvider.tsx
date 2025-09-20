'use client';

import { ReactNode, useEffect, useState } from 'react';

export function MLProvider({ children }: { children: ReactNode }) {
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    // Load ML models in background without blocking the UI
    if (typeof window !== 'undefined') {
      const initializeMLModels = async () => {
        try {
          console.log('Initializing ML models in background...');
          
          // Dynamic imports to avoid blocking
          const [mlModelsModule, enhancedMLModelsModule] = await Promise.all([
            import('@/lib/mlModels'),
            import('@/lib/enhancedMLModels')
          ]);
          
          // Load models with timeout to prevent hanging
          const loadWithTimeout = (promise: Promise<unknown>, timeout: number) => {
            return Promise.race([
              promise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Model loading timeout')), timeout)
              )
            ]);
          };
          
          // Try to load models with 10 second timeout
          try {
            await Promise.all([
              loadWithTimeout(mlModelsModule.loadMLModels(), 10000),
              loadWithTimeout(enhancedMLModelsModule.loadEnhancedMLModels(), 10000)
            ]);
            console.log('ML models loaded successfully in background');
          } catch (timeoutError) {
            console.warn('ML models loading timed out, continuing without ML features:', timeoutError);
            setInitializationError('ML models loading timed out');
          }
          
        } catch (error) {
          console.warn('Failed to initialize ML models, continuing without ML features:', error);
          setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        }
      };

      // Start loading models after a short delay to let the UI render first
      setTimeout(initializeMLModels, 1000);
    }
  }, []);

  // Always render children immediately, don't block on ML model loading
  return (
    <>
      {children}
      {initializationError && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-sm max-w-sm">
          <p className="font-semibold">ML Features Limited</p>
          <p className="text-xs">{initializationError}</p>
        </div>
      )}
    </>
  );
}
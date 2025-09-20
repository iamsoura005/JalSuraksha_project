'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MLProvider } from './MLProvider';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    // Initialize i18n with error handling
    const initializeI18n = async () => {
      try {
        const i18nModule = await import('@/lib/i18n');
        const i18n = i18nModule.default;
        
        // Initialize with timeout to prevent hanging
        const initPromise = i18n.init();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('i18n initialization timeout')), 5000)
        );
        
        await Promise.race([initPromise, timeoutPromise]);
        
        setI18nInstance(i18n);
        setIsInitialized(true);
      } catch (error) {
        console.warn('Failed to initialize i18n, using fallback:', error);
        // Create a minimal fallback i18n instance
        const fallbackI18n = {
          t: (key: string) => key,
          language: 'en',
          changeLanguage: () => Promise.resolve(),
          on: () => {},
          off: () => {},
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setI18nInstance(fallbackI18n as any);
        setIsInitialized(true);
      }
    };

    initializeI18n();
  }, []);

  if (!isInitialized || !i18nInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18nInstance}>
      <MLProvider>
        {children}
      </MLProvider>
    </I18nextProvider>
  );
}
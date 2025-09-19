'use client';

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';
import { MLProvider } from './MLProvider';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n
    i18n.init().then(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <MLProvider>
        {children}
      </MLProvider>
    </I18nextProvider>
  );
}
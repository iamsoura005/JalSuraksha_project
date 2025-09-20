'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function Home() {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure component is fully loaded
    setIsLoaded(true);
  }, []);

  // Fallback content while loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-300 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded mb-10 max-w-2xl mx-auto"></div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <div className="h-14 w-48 bg-blue-300 rounded-lg"></div>
              <div className="h-14 w-48 bg-green-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          {t('home.title') || 'JalSuraksha'}
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          {t('home.description') || 'Upload groundwater test data or enter values manually to calculate pollution indices and assess environmental risks'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link href="/upload">
            <button className="px-8 py-4 text-lg bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 border border-blue-300/30">
              {t('home.uploadData') || 'Upload Data (CSV/Excel)'}
            </button>
          </Link>
          
          <Link href="/manual-entry">
            <button className="px-8 py-4 text-lg bg-green-600/80 backdrop-blur-sm hover:bg-green-700/80 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 border border-green-300/30">
              {t('home.enterData') || 'Enter Data Manually'}
            </button>
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {t('home.hpiCalculation') || 'HPI Calculation'}
            </h3>
            <p className="text-gray-600">Heavy Metal Pollution Index for comprehensive risk assessment</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {t('home.mlAnalysis') || 'ML-Powered Analysis'}
            </h3>
            <p className="text-gray-600">Advanced machine learning models for accurate predictions</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {t('home.visualReports') || 'Visual Reports'}
            </h3>
            <p className="text-gray-600">Interactive charts and maps for data visualization</p>
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t('home.howItWorks') || 'How It Works'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow border border-white/30">
              <div className="text-blue-600 text-2xl font-bold mb-2">1</div>
              <h3 className="font-semibold mb-1">
                {t('home.step1') || 'Upload or Enter Data'}
              </h3>
              <p className="text-sm text-gray-600">
                {t('home.step1Desc') || 'Provide groundwater test results via file upload or manual entry'}
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow border border-white/30">
              <div className="text-blue-600 text-2xl font-bold mb-2">2</div>
              <h3 className="font-semibold mb-1">
                {t('home.step2') || 'Calculate Indices'}
              </h3>
              <p className="text-sm text-gray-600">
                {t('home.step2Desc') || 'System computes HPI, HEI, Cd, and EF values'}
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow border border-white/30">
              <div className="text-blue-600 text-2xl font-bold mb-2">3</div>
              <h3 className="font-semibold mb-1">
                {t('home.step3') || 'View Results'}
              </h3>
              <p className="text-sm text-gray-600">
                {t('home.step3Desc') || 'See detailed analysis with safety classifications'}
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow border border-white/30">
              <div className="text-blue-600 text-2xl font-bold mb-2">4</div>
              <h3 className="font-semibold mb-1">
                {t('home.step4') || 'Visualize Data'}
              </h3>
              <p className="text-sm text-gray-600">
                {t('home.step4Desc') || 'Interactive charts and maps for better understanding'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
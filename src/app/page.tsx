'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          {t('home.title')}
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          {t('home.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link href="/upload">
            <button className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
              {t('home.uploadData')}
            </button>
          </Link>
          
          <Link href="/manual-entry">
            <button className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
              {t('home.enterData')}
            </button>
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('home.hpiCalculation')}</h3>
            <p className="text-gray-600">Heavy Metal Pollution Index for comprehensive risk assessment</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('home.mlAnalysis')}</h3>
            <p className="text-gray-600">Advanced machine learning models for accurate predictions</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('home.visualReports')}</h3>
            <p className="text-gray-600">Interactive charts and maps for data visualization</p>
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('home.howItWorks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">1</div>
              <h3 className="font-semibold mb-1">{t('home.step1')}</h3>
              <p className="text-sm text-gray-600">{t('home.step1Desc')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">2</div>
              <h3 className="font-semibold mb-1">{t('home.step2')}</h3>
              <p className="text-sm text-gray-600">{t('home.step2Desc')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">3</div>
              <h3 className="font-semibold mb-1">{t('home.step3')}</h3>
              <p className="text-sm text-gray-600">{t('home.step3Desc')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-blue-600 text-2xl font-bold mb-2">4</div>
              <h3 className="font-semibold mb-1">{t('home.step4')}</h3>
              <p className="text-sm text-gray-600">{t('home.step4Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          You\u0027re Offline
        </h1>
        
        <p className="mt-2 text-gray-600">
          This application requires an internet connection to function properly. Please check your network connection and try again.
        </p>
        
        <div className="mt-8">
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors duration-300">
              Try Again
            </button>
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-medium text-blue-800">Offline Capabilities</h2>
          <p className="mt-2 text-sm text-blue-700">
            This application supports offline mode. Some features may be limited while offline, but you can still view previously accessed data.
          </p>
        </div>
      </div>
    </div>
  );
}
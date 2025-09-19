'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSamplesStore } from '@/stores/sampleStore';
import { processCSV, processExcel, validateFileType, validateFileSize } from '@/lib/fileProcessing';
import { SampleData } from '@/types';

// Define the type for the store
interface SampleStore {
  samples: SampleData[];
  setSamples: (samples: SampleData[]) => void;
  addSample: (sample: SampleData) => void;
  removeSample: (id: string) => void;
  clearSamples: () => void;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSamples = useSamplesStore((state: SampleStore) => state.setSamples);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    // Validate file
    if (!validateFileType(file)) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }
    
    if (!validateFileSize(file)) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    
    setFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let samples: SampleData[] = [];
      
      if (file.name.endsWith('.csv')) {
        samples = await processCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        samples = await processExcel(file);
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Validate that we have data
      if (samples.length === 0) {
        throw new Error('No data found in file');
      }
      
      // Limit to 1000 samples
      if (samples.length > 1000) {
        samples = samples.slice(0, 1000);
      }
      
      // Set samples in store
      setSamples(samples);
      
      // Navigate to results page
      router.push('/results');
    } catch (err) {
      setError((err as Error).message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Data</h1>
          <p className="text-gray-600">
            Upload your groundwater test data in CSV or Excel format
          </p>
        </div>
        
        <div 
          className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors backdrop-blur-sm ${
            dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400 bg-white/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
          />
          
          <div className="space-y-4">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48" 
              aria-hidden="true"
            >
              <path 
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            
            <div className="flex flex-col items-center">
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium"
              >
                <span>Click to upload</span>
                <span className="block text-sm text-gray-500 mt-1">
                  or drag and drop
                </span>
              </label>
              <p className="text-gray-500 text-sm mt-2">
                CSV, XLSX, or XLS files up to 10MB
              </p>
            </div>
          </div>
        </div>
        
        {file && (
          <div className="mt-6 bg-white/30 backdrop-blur-sm rounded-lg shadow p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50/50 backdrop-blur-sm rounded-lg border border-red-200/30">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300/30 rounded-md text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm"
          >
            Back
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-6 py-3 rounded-md text-white ${
              !file || loading 
                ? 'bg-gray-400/50 cursor-not-allowed backdrop-blur-sm' 
                : 'bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm border border-blue-300/30'
            }`}
          >
            {loading ? 'Processing...' : 'Next'}
          </button>
        </div>
        
        <div className="mt-10 bg-blue-50/50 backdrop-blur-sm rounded-lg p-6 border border-blue-200/30">
          <h3 className="font-medium text-gray-900 mb-2">Expected File Format</h3>
          <p className="text-sm text-gray-600 mb-3">
            Your file should contain the following columns:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Sample_ID</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Latitude</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Longitude</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Lead_ppm</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Arsenic_ppm</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Cadmium_ppm</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Chromium_ppm</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Copper_ppm</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Iron_ppm</div>
            <div className="bg-white/50 backdrop-blur-sm p-2 rounded text-center border border-white/30">Zinc_ppm</div>
          </div>
        </div>
      </div>
    </div>
  );
}
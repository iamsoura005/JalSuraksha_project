'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSamplesStore } from '@/stores/sampleStore';
import { SampleData } from '@/types';
import { generateId, validateLatitude, validateLongitude, validateConcentration } from '@/lib/utils';

// Define the type for the store
interface SampleStore {
  samples: SampleData[];
  setSamples: (samples: SampleData[]) => void;
  clearSamples: () => void;
}

// Voice input component
const VoiceInput = ({ onResult }: { onResult: (text: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    interface SpeechRecognitionEvent extends Event {
      results: SpeechRecognitionResultList;
    }

    interface SpeechRecognitionResultList {
      [index: number]: SpeechRecognitionResult;
      length: number;
    }

    interface SpeechRecognitionResult {
      [index: number]: SpeechRecognitionAlternative;
      length: number;
      isFinal: boolean;
    }

    interface SpeechRecognitionAlternative {
      transcript: string;
      confidence: number;
    }

    interface SpeechRecognition extends EventTarget {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult: (event: SpeechRecognitionEvent) => void;
      onend: () => void;
    }

    interface Window {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    }

    const SpeechRecognition = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0])
          .map((result: SpeechRecognitionAlternative) => result.transcript)
          .join('');
        setTranscript(transcript);
        onResult(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-2 rounded-full ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
      </button>
      {transcript && (
        <span className="text-sm text-gray-600 truncate max-w-xs">{transcript}</span>
      )}
    </div>
  );
};

export default function ManualEntryPage() {
  const [samples, setSamples] = useState<SampleData[]>([
    {
      id: generateId(),
      sampleId: '',
      latitude: 0,
      longitude: 0,
      lead: 0,
      arsenic: 0,
      cadmium: 0,
      chromium: 0,
      copper: 0,
      iron: 0,
      zinc: 0
    }
  ]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();
  const setStoreSamples = useSamplesStore((state: SampleStore) => state.setSamples);

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationError(null);
        // Update the first sample with current location
        setSamples(prev => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          return updated;
        });
      },
      (error) => {
        setLocationError(`Unable to retrieve your location: ${error.message}`);
      }
    );
  };

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Handle voice input results
  const handleVoiceInput = (text: string, id: string, field: keyof SampleData) => {
    // Parse the voice input to extract numerical values or sample IDs
    const parsedValue = parseVoiceInput(text, field);
    if (parsedValue !== null) {
      handleInputChange(id, field, parsedValue);
    }
  };

  // Parse voice input based on field type
  const parseVoiceInput = (text: string, field: keyof SampleData): string | number | null => {
    // For sampleId, return the text as is
    if (field === 'sampleId') {
      return text;
    }
    
    // For numerical fields, extract numbers
    const numberMatch = text.match(/(\d+\.?\d*)/);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1]);
      // Validate the value based on field type
      if (field === 'latitude' && validateLatitude(value)) {
        return value;
      } else if (field === 'longitude' && validateLongitude(value)) {
        return value;
      } else if (['lead', 'arsenic', 'cadmium', 'chromium', 'copper', 'iron', 'zinc'].includes(field) && 
                 validateConcentration(value)) {
        return value;
      }
    }
    
    return null;
  };

  const validateSample = (sample: SampleData): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!sample.sampleId.trim()) {
      newErrors[`${sample.id}-sampleId`] = 'Sample ID is required';
    }
    
    if (!validateLatitude(sample.latitude)) {
      newErrors[`${sample.id}-latitude`] = 'Latitude must be between -90 and 90';
    }
    
    if (!validateLongitude(sample.longitude)) {
      newErrors[`${sample.id}-longitude`] = 'Longitude must be between -180 and 180';
    }
    
    // Validate concentrations with 10 ppm limit
    const metals: (keyof SampleData)[] = ['lead', 'arsenic', 'cadmium', 'chromium', 'copper', 'iron', 'zinc'];
    metals.forEach(metal => {
      if (!validateConcentration(sample[metal] as number)) {
        newErrors[`${sample.id}-${metal}`] = `${metal.charAt(0).toUpperCase() + metal.slice(1)} concentration must be greater than or equal to 0`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (id: string, field: keyof SampleData, value: string | number) => {
    setSamples(prev => prev.map(sample => 
      sample.id === id ? { ...sample, [field]: value } : sample
    ));
    
    // Clear error for this field if it exists
    if (errors[`${id}-${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${id}-${field}`];
        return newErrors;
      });
    }
  };

  // Function to increment metal concentration by 0.01
  const incrementMetal = (id: string, metal: keyof SampleData) => {
    setSamples(prev => prev.map(sample => {
      if (sample.id === id) {
        const currentValue = sample[metal] as number;
        const newValue = Math.min(10, parseFloat((currentValue + 0.01).toFixed(2)));
        return { ...sample, [metal]: newValue };
      }
      return sample;
    }));
  };

  // Function to decrement metal concentration by 0.01
  const decrementMetal = (id: string, metal: keyof SampleData) => {
    setSamples(prev => prev.map(sample => {
      if (sample.id === id) {
        const currentValue = sample[metal] as number;
        const newValue = Math.max(0, parseFloat((currentValue - 0.01).toFixed(2)));
        return { ...sample, [metal]: newValue };
      }
      return sample;
    }));
  };

  const addSample = () => {
    setSamples(prev => [
      ...prev,
      {
        id: generateId(),
        sampleId: '',
        latitude: 0,
        longitude: 0,
        lead: 0,
        arsenic: 0,
        cadmium: 0,
        chromium: 0,
        copper: 0,
        iron: 0,
        zinc: 0
      }
    ]);
  };

  const removeSample = (id: string) => {
    if (samples.length > 1) {
      setSamples(prev => prev.filter(sample => sample.id !== id));
    }
  };

  const handleSubmit = () => {
    // Validate all samples
    const isValid = samples.every(sample => validateSample(sample));
    
    if (isValid) {
      // Set samples in store
      setStoreSamples(samples);
      
      // Navigate to results page
      router.push('/results');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-green-50/30 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual Data Entry</h1>
          <p className="text-gray-600">
            Enter groundwater test data manually for pollution index calculation
          </p>
          <button
            onClick={getCurrentLocation}
            className="mt-2 px-4 py-2 bg-blue-100/50 backdrop-blur-sm text-blue-700 rounded-md hover:bg-blue-200/50 text-sm border border-blue-200/30 shadow-sm"
          >
            Get Current Location
          </button>
          {locationError && (
            <p className="mt-2 text-sm text-red-600">{locationError}</p>
          )}
        </div>
        
        <div className="space-y-6">
          {samples.map((sample, index) => (
            <div key={sample.id} className="bg-white/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-black-900">Sample {index + 1}</h2>
                {samples.length > 1 && (
                  <button
                    onClick={() => removeSample(sample.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black-700 mb-1">
                    Sample ID *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sample.sampleId}
                      onChange={(e) => handleInputChange(sample.id, 'sampleId', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md bg-white/50 backdrop-blur-sm border-white/30 ${
                        errors[`${sample.id}-sampleId`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter sample ID"
                    />
                    <VoiceInput onResult={(text) => handleVoiceInput(text, sample.id, 'sampleId')} />
                  </div>
                  {errors[`${sample.id}-sampleId`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`${sample.id}-sampleId`]}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black-700 mb-1">
                      Latitude *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={sample.latitude}
                        onChange={(e) => handleInputChange(sample.id, 'latitude', parseFloat(e.target.value) || 0)}
                        className={`flex-1 px-3 py-2 border rounded-md bg-white/50 backdrop-blur-sm border-white/30 ${
                          errors[`${sample.id}-latitude`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter latitude"
                      />
                      <VoiceInput onResult={(text) => handleVoiceInput(text, sample.id, 'latitude')} />
                    </div>
                    {errors[`${sample.id}-latitude`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${sample.id}-latitude`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black-700 mb-1">
                      Longitude *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={sample.longitude}
                        onChange={(e) => handleInputChange(sample.id, 'longitude', parseFloat(e.target.value) || 0)}
                        className={`flex-1 px-3 py-2 border rounded-md bg-white/50 backdrop-blur-sm border-white/30 ${
                          errors[`${sample.id}-longitude`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter longitude"
                      />
                      <VoiceInput onResult={(text) => handleVoiceInput(text, sample.id, 'longitude')} />
                    </div>
                    {errors[`${sample.id}-longitude`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`${sample.id}-longitude`]}</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-md font-medium text-black-900 mb-3">Heavy Metal Concentrations (ppm) - Max 10 ppm</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                    {([
                      { key: 'lead', label: 'Lead (Pb)', unit: 'ppm' },
                      { key: 'arsenic', label: 'Arsenic (As)', unit: 'ppm' },
                      { key: 'cadmium', label: 'Cadmium (Cd)', unit: 'ppm' },
                      { key: 'chromium', label: 'Chromium (Cr)', unit: 'ppm' },
                      { key: 'copper', label: 'Copper (Cu)', unit: 'ppm' },
                      { key: 'iron', label: 'Iron (Fe)', unit: 'ppm' },
                      { key: 'zinc', label: 'Zinc (Zn)', unit: 'ppm' }
                    ] as const).map(({ key, label, unit }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-black-700 mb-1">
                          {label}
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => decrementMetal(sample.id, key)}
                            className="px-2 py-1 bg-gray-200/50 backdrop-blur-sm text-gray-700 rounded-l-md hover:bg-gray-300/50 border border-gray-300/30"
                          >
                            -
                          </button>
                          <div className="flex-1 flex">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={sample[key]}
                              onChange={(e) => handleInputChange(sample.id, key, parseFloat(e.target.value) || 0)}
                              className={`w-full px-2 py-1 text-sm border-t border-b bg-white/50 backdrop-blur-sm border-gray-300/30 text-center ${
                                errors[`${sample.id}-${key}`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder={`0 ${unit}`}
                            />
                            <VoiceInput onResult={(text) => handleVoiceInput(text, sample.id, key)} />
                          </div>
                          <button
                            type="button"
                            onClick={() => incrementMetal(sample.id, key)}
                            className="px-2 py-1 bg-gray-200/50 backdrop-blur-sm text-gray-700 rounded-r-md hover:bg-gray-300/50 border border-gray-300/30"
                          >
                            +
                          </button>
                        </div>
                        {errors[`${sample.id}-${key}`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`${sample.id}-${key}`]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex flex-wrap gap-4 justify-between">
          <div className="flex gap-4">
            <button
              onClick={addSample}
              className="px-4 py-2 bg-gray-200/50 backdrop-blur-sm text-gray-800 rounded-md hover:bg-gray-300/50 border border-gray-300/30 shadow-sm"
            >
              Add Another Sample
            </button>
            
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300/30 rounded-md text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm shadow-sm"
            >
              Back
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600/80 backdrop-blur-sm text-white rounded-md hover:bg-blue-700/80 border border-blue-300/30 shadow-sm"
          >
            Calculate Pollution Indices
          </button>
        </div>
      </div>
    </div>
  );
}
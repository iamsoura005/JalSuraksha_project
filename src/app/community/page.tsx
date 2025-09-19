'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CommunityReportingPage() {
  const { t } = useTranslation();
  const [report, setReport] = useState({
    name: '',
    email: '',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
    pollutionType: 'water',
    severity: 'low',
    image: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReport(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReport(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setReport({
        name: '',
        email: '',
        location: '',
        latitude: '',
        longitude: '',
        description: '',
        pollutionType: 'water',
        severity: 'low',
        image: null,
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Pollution Reporting</h1>
          <p className="text-gray-600">
            Report pollution incidents in your area to help monitor environmental health
          </p>
        </div>
        
        {isSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-medium text-green-800 mb-2">Report Submitted Successfully!</h3>
            <p className="text-green-700">
              Thank you for reporting. Our team will review your submission and take appropriate action.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={report.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={report.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location Description
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={report.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the location"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      id="latitude"
                      name="latitude"
                      value={report.latitude}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 28.6139"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      id="longitude"
                      name="longitude"
                      value={report.longitude}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 77.2090"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="pollutionType" className="block text-sm font-medium text-gray-700 mb-1">
                    Pollution Type
                  </label>
                  <select
                    id="pollutionType"
                    name="pollutionType"
                    value={report.pollutionType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="water">Water Pollution</option>
                    <option value="air">Air Pollution</option>
                    <option value="soil">Soil Pollution</option>
                    <option value="noise">Noise Pollution</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                    Severity Level
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={report.severity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={report.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the pollution incident in detail..."
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image (Optional)
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Upload photos to support your report</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Community Reports Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Community Reports</h2>
          
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">Water pollution near Yamuna River</h3>
                    <p className="text-sm text-gray-500 mt-1">Reported by Community User • 2 hours ago</p>
                    <p className="text-sm text-gray-700 mt-2">
                      Industrial waste discharge causing discoloration of water and foul smell in the area.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    High Severity
                  </span>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  New Delhi, India
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              View All Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
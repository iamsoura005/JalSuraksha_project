'use client';

import { useState, useEffect } from 'react';
import { useSamplesStore, SampleStore } from '@/stores/sampleStore';
import { SampleData, PollutionIndexResult } from '@/types';
import { calculateHPI, calculateHEI, calculateCd } from '@/lib/calculations';
import { generateId } from '@/lib/utils';

// Define types for regulatory standards
interface RegulatoryStandard {
  name: string;
  organization: string;
  limits: {
    lead: number;
    arsenic: number;
    cadmium: number;
    chromium: number;
    copper: number;
    iron: number;
    zinc: number;
  };
}

// Define types for report templates
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

// Define types for alerts
interface Alert {
  id: string;
  sampleId: string;
  metal: string;
  concentration: number;
  limit: number;
  level: 'warning' | 'danger';
  timestamp: Date;
}

// Define type for report data
interface ReportData {
  id: string;
  sampleId: string;
  location: { latitude: number; longitude: number };
  indices: {
    hpi: number;
    hei: number;
    cd: number;
  };
  metals: Record<string, { value: number; hpi: number }>;
  compliance: Record<string, { compliant: boolean; limit: number; value: number }>;
  timestamp: Date;
}

export default function ReportsPage() {
  const samples = useSamplesStore((state: SampleStore) => state.samples);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [regulatoryStandards] = useState<RegulatoryStandard[]>([
    {
      name: 'EPA Standards',
      organization: 'Environmental Protection Agency',
      limits: {
        lead: 0.015,
        arsenic: 0.010,
        cadmium: 0.005,
        chromium: 0.100,
        copper: 1.300,
        iron: 0.300,
        zinc: 5.000
      }
    },
    {
      name: 'WHO Guidelines',
      organization: 'World Health Organization',
      limits: {
        lead: 0.010,
        arsenic: 0.010,
        cadmium: 0.003,
        chromium: 0.050,
        copper: 2.000,
        iron: 0.300,
        zinc: 3.000
      }
    }
  ]);

  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: 'default',
      name: 'Standard Report',
      description: 'Comprehensive pollution analysis report',
      sections: ['summary', 'samples', 'indices', 'compliance', 'recommendations']
    },
    {
      id: 'compliance',
      name: 'Regulatory Compliance Report',
      description: 'Detailed compliance analysis with EPA/WHO standards',
      sections: ['compliance', 'violations', 'recommendations']
    },
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for decision makers',
      sections: ['summary', 'key-findings', 'recommendations']
    }
  ]);

  // Check for alerts based on regulatory standards
  useEffect(() => {
    const newAlerts: Alert[] = [];
    
    samples.forEach((sample: SampleData) => {
      // Check against the first standard (EPA)
      const standard = regulatoryStandards[0];
      
      Object.entries(sample).forEach(([key, value]) => {
        if (['lead', 'arsenic', 'cadmium', 'chromium', 'copper', 'iron', 'zinc'].includes(key)) {
          const metal = key;
          const concentration = value as number;
          const limit = standard.limits[metal as keyof RegulatoryStandard['limits']];
          
          if (concentration > limit) {
            newAlerts.push({
              id: generateId(),
              sampleId: sample.sampleId,
              metal,
              concentration,
              limit,
              level: concentration > limit * 2 ? 'danger' : 'warning',
              timestamp: new Date()
            });
          }
        }
      });
    });
    
    setAlerts(newAlerts);
  }, [samples, regulatoryStandards]);

  // Generate reports when samples change
  useEffect(() => {
    const newReports = samples.map((sample: SampleData) => {
      const hpi = calculateHPI(sample);
      const hei = calculateHEI(sample);
      const cd = calculateCd(sample);
      
      return {
        id: sample.id,
        sampleId: sample.sampleId,
        location: { latitude: sample.latitude, longitude: sample.longitude },
        indices: { hpi, hei, cd },
        metals: {
          lead: { value: sample.lead, hpi: sample.lead / 0.01 * 100 },
          arsenic: { value: sample.arsenic, hpi: sample.arsenic / 0.01 * 100 },
          cadmium: { value: sample.cadmium, hpi: sample.cadmium / 0.003 * 100 },
          chromium: { value: sample.chromium, hpi: sample.chromium / 0.05 * 100 },
          copper: { value: sample.copper, hpi: sample.copper / 2.0 * 100 },
          iron: { value: sample.iron, hpi: sample.iron / 0.3 * 100 },
          zinc: { value: sample.zinc, hpi: sample.zinc / 3.0 * 100 }
        },
        compliance: checkCompliance(sample),
        timestamp: new Date()
      };
    });
    
    setReports(newReports);
  }, [samples]);

  // Check compliance with regulatory standards
  const checkCompliance = (sample: SampleData) => {
    const compliance: Record<string, { compliant: boolean; limit: number; value: number }> = {};
    
    regulatoryStandards.forEach(standard => {
      let isCompliant = true;
      
      Object.entries(sample).forEach(([key, value]) => {
        if (['lead', 'arsenic', 'cadmium', 'chromium', 'copper', 'iron', 'zinc'].includes(key)) {
          const metal = key as keyof SampleData;
          const concentration = value as number;
          const limit = standard.limits[metal as keyof RegulatoryStandard['limits']];
          
          if (concentration > limit) {
            isCompliant = false;
          }
          
          if (!compliance[standard.name]) {
            compliance[standard.name] = { 
              compliant: concentration <= limit, 
              limit, 
              value: concentration 
            };
          }
        }
      });
      
      // Update overall compliance status
      compliance[standard.name] = { 
        ...compliance[standard.name],
        compliant: isCompliant
      };
    });
    
    return compliance;
  };

  // Generate report based on selected template
  const generateReport = () => {
    const template = reportTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    // In a real application, this would generate a downloadable PDF or DOCX
    alert(`Report generated using template: ${template.name}\nThis would be a downloadable file in a production environment.`);
  };

  // Send alert notifications
  const sendAlerts = () => {
    if (alerts.length === 0) {
      alert('No critical alerts to send.');
      return;
    }
    
    // In a real application, this would send emails/SMS
    alert(`Alerts sent for ${alerts.length} critical violations.\nThis would send emails/SMS in a production environment.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Reporting & Compliance</h1>
          <p className="text-gray-600">
            Generate regulatory compliance reports and monitor critical alerts
          </p>
        </div>
        
        {/* Alert Section */}
        {alerts.length > 0 && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-red-800">Critical Alerts</h2>
              <button 
                onClick={sendAlerts}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Send Alerts ({alerts.length})
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded ${alert.level === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Sample {alert.sampleId}: {alert.metal} 
                      <span className="ml-2 px-2 py-1 text-xs rounded bg-white">
                        {alert.concentration.toFixed(3)} ppm
                      </span>
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${alert.level === 'danger' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
                      {alert.level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    Exceeds {alert.limit} ppm limit by {(alert.concentration / alert.limit).toFixed(1)}x
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Report Templates */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {reportTemplates.map(template => (
              <div 
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer ${
                  selectedTemplate === template.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.sections.map(section => (
                    <span key={section} className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generate Report
          </button>
        </div>
        
        {/* Regulatory Standards */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Regulatory Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {regulatoryStandards.map((standard, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{standard.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{standard.organization}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Limit (ppm)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(standard.limits).map(([metal, limit]) => (
                        <tr key={metal}>
                          <td className="px-4 py-2 text-sm text-gray-900 capitalize">{metal}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{limit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sample Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Analysis Reports</h2>
          {reports.length === 0 ? (
            <p className="text-gray-600">No samples available for reporting. Please add sample data first.</p>
          ) : (
            <div className="space-y-6">
              {reports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Sample ID: {report.sampleId}</h3>
                      <p className="text-sm text-gray-600">
                        Location: {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {report.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Pollution Indices</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>HPI (Heavy Metal Pollution Index)</span>
                          <span className={`font-medium ${
                            report.indices.hpi > 100 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {report.indices.hpi.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>HEI (Heavy Metal Evaluation Index)</span>
                          <span className={`font-medium ${
                            report.indices.hei > 1 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {report.indices.hei.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cd (Contamination Degree)</span>
                          <span className="font-medium">
                            {report.indices.cd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Compliance Status</h4>
                      <div className="space-y-2">
                        {Object.entries(report.compliance).map(([standard, status]) => (
                          <div key={standard} className="flex justify-between">
                            <span>{standard}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              status.compliant 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {status.compliant ? 'Compliant' : 'Non-Compliant'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Metal Concentrations</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                      {Object.entries(report.metals).map(([metal, data]) => (
                        <div key={metal} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600 capitalize">{metal}</div>
                          <div className="font-medium">{data.value.toFixed(3)}</div>
                          <div className="text-xs text-gray-500">HPI: {data.hpi.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
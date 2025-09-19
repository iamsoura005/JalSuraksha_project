import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SampleData } from '@/types';

/**
 * Process CSV file and extract sample data
 */
export const processCSV = (file: File): Promise<SampleData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const results = Papa.parse<Record<string, string | number>>(text, {
          header: true,
          skipEmptyLines: true
        });
        
        const samples: SampleData[] = results.data.map((row, index) => {
          // Handle different possible column names
          const sampleId = row.Sample_ID || row.SampleId || row['Sample ID'] || row.sampleId || `S${String(index + 1).padStart(3, '0')}`;
          
          return {
            id: `sample-${index}`,
            sampleId: String(sampleId),
            latitude: parseFloat(String(row.Latitude || row.latitude || 0)),
            longitude: parseFloat(String(row.Longitude || row.longitude || 0)),
            lead: parseFloat(String(row.Lead_ppm || row.Lead || row.lead || 0)),
            arsenic: parseFloat(String(row.Arsenic_ppm || row.Arsenic || row.arsenic || 0)),
            cadmium: parseFloat(String(row.Cadmium_ppm || row.Cadmium || row.cadmium || 0)),
            chromium: parseFloat(String(row.Chromium_ppm || row.Chromium || row.chromium || 0)),
            copper: parseFloat(String(row.Copper_ppm || row.Copper || row.copper || 0)),
            iron: parseFloat(String(row.Iron_ppm || row.Iron || row.iron || 0)),
            zinc: parseFloat(String(row.Zinc_ppm || row.Zinc || row.zinc || 0))
          };
        });
        
        resolve(samples);
      } catch (error) {
        reject(new Error('Failed to process CSV file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Process Excel file and extract sample data
 */
export const processExcel = (file: File): Promise<SampleData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData: Record<string, string | number>[] = XLSX.utils.sheet_to_json(worksheet);
        
        const samples: SampleData[] = jsonData.map((row, index) => {
          // Handle different possible column names
          const sampleId = row.Sample_ID || row.SampleId || row['Sample ID'] || row.sampleId || `S${String(index + 1).padStart(3, '0')}`;
          
          return {
            id: `sample-${index}`,
            sampleId: String(sampleId),
            latitude: parseFloat(String(row.Latitude || row.latitude || 0)),
            longitude: parseFloat(String(row.Longitude || row.longitude || 0)),
            lead: parseFloat(String(row.Lead_ppm || row.Lead || row.lead || 0)),
            arsenic: parseFloat(String(row.Arsenic_ppm || row.Arsenic || row.arsenic || 0)),
            cadmium: parseFloat(String(row.Cadmium_ppm || row.Cadmium || row.cadmium || 0)),
            chromium: parseFloat(String(row.Chromium_ppm || row.Chromium || row.chromium || 0)),
            copper: parseFloat(String(row.Copper_ppm || row.Copper || row.copper || 0)),
            iron: parseFloat(String(row.Iron_ppm || row.Iron || row.iron || 0)),
            zinc: parseFloat(String(row.Zinc_ppm || row.Zinc || row.zinc || 0))
          };
        });
        
        resolve(samples);
      } catch (error) {
        reject(new Error('Failed to process Excel file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate file type
 */
export const validateFileType = (file: File): boolean => {
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const validExtensions = ['.csv', '.xls', '.xlsx'];
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

/**
 * Validate file size (max 10MB)
 */
export const validateFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  return file.size <= maxSize;
};
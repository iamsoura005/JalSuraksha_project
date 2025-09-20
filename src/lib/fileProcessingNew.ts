import readExcelFile from 'read-excel-file';
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
  return new Promise(async (resolve, reject) => {
    try {
      const rows = await readExcelFile(file);
      
      if (rows.length === 0) {
        reject(new Error('Excel file is empty'));
        return;
      }
      
      // Assume first row is headers
      const headers = rows[0].map(cell => String(cell).toLowerCase());
      const dataRows = rows.slice(1);
      
      const samples: SampleData[] = dataRows.map((row, index) => {
        const rowData: Record<string, string | number> = {};
        headers.forEach((header, colIndex) => {
          const cellValue = row[colIndex];
          // Convert CellValue (string | number | boolean | Date) to string | number
          if (typeof cellValue === 'boolean') {
            rowData[header] = cellValue ? 1 : 0;
          } else if (cellValue instanceof Date) {
            rowData[header] = cellValue.getTime();
          } else if (typeof cellValue === 'string' || typeof cellValue === 'number') {
            rowData[header] = cellValue;
          } else {
            // Handle null, undefined, or other unexpected types
            rowData[header] = '';
          }
        });
        
        // Handle different possible column names
        const sampleId = rowData['sample_id'] || rowData['sampleid'] || rowData['sample id'] || `S${String(index + 1).padStart(3, '0')}`;
        
        return {
          id: `sample-${index}`,
          sampleId: String(sampleId),
          latitude: parseFloat(String(rowData['latitude'] || 0)),
          longitude: parseFloat(String(rowData['longitude'] || 0)),
          lead: parseFloat(String(rowData['lead_ppm'] || rowData['lead'] || 0)),
          arsenic: parseFloat(String(rowData['arsenic_ppm'] || rowData['arsenic'] || 0)),
          cadmium: parseFloat(String(rowData['cadmium_ppm'] || rowData['cadmium'] || 0)),
          chromium: parseFloat(String(rowData['chromium_ppm'] || rowData['chromium'] || 0)),
          copper: parseFloat(String(rowData['copper_ppm'] || rowData['copper'] || 0)),
          iron: parseFloat(String(rowData['iron_ppm'] || rowData['iron'] || 0)),
          zinc: parseFloat(String(rowData['zinc_ppm'] || rowData['zinc'] || 0))
        };
      });
      
      resolve(samples);
    } catch (error) {
      reject(new Error('Failed to process Excel file: ' + (error as Error).message));
    }
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
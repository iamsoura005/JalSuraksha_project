# Dataset Structure Documentation

This document describes the expected structure for datasets used in the Heavy Metal Pollution Index Calculator.

## Supported File Formats

The application supports the following file formats:
- CSV (.csv)
- Excel (.xlsx, .xls)

## Required Columns

All datasets must contain the following columns:

| Column Name | Description | Data Type | Example |
|-------------|-------------|-----------|---------|
| Sample_ID | Unique identifier for each sample | String | S001 |
| Latitude | Geographic latitude coordinate | Number | 22.5726 |
| Longitude | Geographic longitude coordinate | Number | 88.3639 |
| Lead_ppm | Lead concentration in parts per million | Number | 0.05 |
| Arsenic_ppm | Arsenic concentration in parts per million | Number | 0.02 |
| Cadmium_ppm | Cadmium concentration in parts per million | Number | 0.01 |
| Chromium_ppm | Chromium concentration in parts per million | Number | 0.03 |
| Copper_ppm | Copper concentration in parts per million | Number | 1.2 |
| Iron_ppm | Iron concentration in parts per million | Number | 0.8 |
| Zinc_ppm | Zinc concentration in parts per million | Number | 2.1 |

## Column Name Variations

The application supports various column name formats:

### Sample ID
- Sample_ID
- SampleId
- Sample ID
- sampleId

### Geographic Coordinates
- Latitude / Longitude
- latitude / longitude

### Metal Concentrations
For each metal, the following column names are supported:
- Lead: Lead_ppm, Lead, lead
- Arsenic: Arsenic_ppm, Arsenic, arsenic
- Cadmium: Cadmium_ppm, Cadmium, cadmium
- Chromium: Chromium_ppm, Chromium, chromium
- Copper: Copper_ppm, Copper, copper
- Iron: Iron_ppm, Iron, iron
- Zinc: Zinc_ppm, Zinc, zinc

## Data Validation

### Value Ranges
- **Latitude**: -90 to 90
- **Longitude**: -180 to 180
- **Metal Concentrations**: 0 to 100 ppm (values outside this range will trigger warnings)

### File Constraints
- **Maximum file size**: 10MB
- **Maximum samples**: 1000 rows
- **Minimum samples**: 1 row

## Sample Data

### CSV Format
```csv
Sample_ID,Latitude,Longitude,Lead_ppm,Arsenic_ppm,Cadmium_ppm,Chromium_ppm,Copper_ppm,Iron_ppm,Zinc_ppm
S001,22.5726,88.3639,0.05,0.02,0.01,0.03,1.2,0.8,2.1
S002,22.5800,88.3700,0.12,0.08,0.05,0.15,2.8,1.5,4.2
```

### Excel Format
The same data structure applies to Excel files (.xlsx, .xls).

## Error Handling

The application provides the following error handling for datasets:

1. **Invalid file format**: Only CSV and Excel files are accepted
2. **Missing required columns**: The application will attempt to map common variations
3. **Invalid data types**: Non-numeric values in numeric columns will be converted to 0
4. **Out of range values**: Values outside expected ranges will trigger warnings
5. **File size limits**: Files larger than 10MB will be rejected
6. **Row limits**: Files with more than 1000 samples will be truncated

## Best Practices

1. **Data Cleaning**: Ensure data is clean and consistent before upload
2. **Column Headers**: Use clear, descriptive column names
3. **Data Validation**: Validate data ranges before processing
4. **File Size**: Keep files under 10MB for optimal performance
5. **Sample IDs**: Use unique identifiers for each sample
6. **Geographic Coordinates**: Ensure coordinates are accurate and in decimal degrees

## Troubleshooting

### Common Issues
1. **File not accepted**: Check file format and size limits
2. **Missing data**: Ensure all required columns are present
3. **Incorrect values**: Validate data ranges and formats
4. **Processing errors**: Check for special characters or formatting issues

### Support
For issues with dataset structure, contact the development team or refer to the sample data files provided in the `public` directory.
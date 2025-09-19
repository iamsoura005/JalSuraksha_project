# Heavy Metal Pollution Index Calculator

A comprehensive web application for calculating heavy metal pollution indices in groundwater samples using both traditional calculations and machine learning models.

## Features

- **File Upload**: Upload CSV or Excel files with groundwater test data
- **Manual Entry**: Enter sample data manually through a form interface
- **Pollution Index Calculation**: Calculate HPI, HEI, Cd, and EF indices
- **Machine Learning Integration**: Use TensorFlow.js models for predictions
- **Data Visualization**: Interactive charts and maps for data analysis
- **Export Options**: Download results as CSV or JSON

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **File Handling**: Papa Parse (CSV) and SheetJS (Excel)
- **ML Integration**: TensorFlow.js
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd heavy-metal-calculator
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Home Page**: Choose between uploading a file or entering data manually
2. **File Upload**: Drag and drop or select a CSV/Excel file with sample data
3. **Manual Entry**: Fill in sample details through the form interface
4. **Results**: View calculated pollution indices and safety levels
5. **Visualization**: Explore data through interactive charts and maps

## Data Format

### Required Columns

- `Sample_ID`: Unique identifier for each sample
- `Latitude`: Geographic latitude coordinate
- `Longitude`: Geographic longitude coordinate
- `Lead_ppm`: Lead concentration in parts per million
- `Arsenic_ppm`: Arsenic concentration in parts per million
- `Cadmium_ppm`: Cadmium concentration in parts per million
- `Chromium_ppm`: Chromium concentration in parts per million
- `Copper_ppm`: Copper concentration in parts per million
- `Iron_ppm`: Iron concentration in parts per million
- `Zinc_ppm`: Zinc concentration in parts per million

### Sample Data

A sample CSV file is included in the `public` directory for testing purposes.

## Machine Learning Models

The application uses pre-trained TensorFlow.js models for enhanced predictions:

- `heavy_metal_model.json`: Regression model for pollution index prediction
- `safety_classifier.json`: Classification model for safety level prediction
- `preprocessing_params.json`: Normalization parameters for input data

### Model Files Setup

Place the following files in the `public/models/` directory:

1. `heavy_metal_model.json` (main model architecture)
2. `heavy_metal_model_weights.bin` (model weights)
3. `safety_classifier.json` (classification model)
4. `safety_classifier_weights.bin` (classifier weights)
5. `preprocessing_params.json` (normalization parameters)

## Pollution Index Calculations

### Heavy Metal Pollution Index (HPI)

HPI = Σ(Wi × (Ci/Si) × 100)

Where:
- Wi = weight factor for each metal
- Ci = concentration of metal in sample
- Si = standard maximum permissible limit

### Heavy Metal Evaluation Index (HEI)

HEI = (Ci/Si)max

### Contamination Degree (Cd)

Cd = Σ(Ci/Si)

### Enrichment Factor (EF)

EF = (Ci/Cref)sample / (Ci/Cref)background

## Safety Levels

- **Safe**: HPI < 100
- **Moderate**: 100 ≤ HPI < 200
- **High**: 200 ≤ HPI < 300
- **Critical**: HPI ≥ 300

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue on the repository.
# ML Model Files Setup Guide

This guide explains how to set up the machine learning model files for the Heavy Metal Pollution Index Calculator.

## Model Files Structure

The application expects the following ML model files in the `public/models/` directory:

1. `heavy_metal_model.json` - Main regression model architecture for pollution index prediction
2. `heavy_metal_model_weights.bin` - Weights for the regression model
3. `safety_classifier.json` - Classification model for safety level prediction
4. `safety_classifier_weights.bin` - Weights for the classification model
5. `preprocessing_params.json` - Normalization parameters for input data

## Setting Up the Models

### Step 1: Create the Models Directory

Ensure the `public/models/` directory exists in your project:

```
your-project/
├── public/
│   └── models/
└── ...
```

### Step 2: Place Model Files

Place the following files in the `public/models/` directory:

#### heavy_metal_model.json
Main model architecture file for the regression model that predicts pollution indices.

#### heavy_metal_model_weights.bin
Binary file containing the trained weights for the regression model.

#### safety_classifier.json
Model architecture file for the classification model that predicts safety levels.

#### safety_classifier_weights.bin
Binary file containing the trained weights for the classification model.

#### preprocessing_params.json
JSON file containing normalization parameters with the following structure:

```json
{
  "feature_means": [1.2, 0.8, 0.3, 2.1, 1.5, 0.9, 2.3],
  "feature_stds": [2.1, 1.4, 0.7, 3.2, 2.8, 1.6, 4.1],
  "feature_names": ["lead", "arsenic", "cadmium", "chromium", "copper", "iron", "zinc"]
}
```

## Converting TensorFlow Models to TensorFlow.js

If you have TensorFlow models in other formats (like .h5), you can convert them to TensorFlow.js format using the tensorflowjs_converter tool:

```bash
# Install the converter
pip install tensorflowjs

# Convert Keras model to TensorFlow.js
tensorflowjs_converter \
    --input_format=keras \
    path/to/my_model.h5 \
    path/to/output_directory
```

This will generate the required `.json` and `.bin` files.

## Model Loading in the Application

The application automatically loads these models when needed. The loading happens in `src/lib/mlModels.ts`:

```javascript
const loadMLModels = async () => {
  const regressionModel = await tf.loadLayersModel('/models/heavy_metal_model.json');
  const classificationModel = await tf.loadLayersModel('/models/safety_classifier.json');
  const preprocessingParams = await fetch('/models/preprocessing_params.json').then(res => res.json());
  return { regressionModel, classificationModel, preprocessingParams };
};
```

## Fallback to Calculation-Based Approach

If the ML models fail to load or are not available, the application will automatically fall back to the calculation-based approach using the standard formulas for HPI, HEI, Cd, and EF indices.

## Troubleshooting

1. **Models not loading**: Ensure all files are in the correct `public/models/` directory
2. **404 errors**: Check that file names match exactly (case-sensitive)
3. **JSON parsing errors**: Validate that JSON files have correct syntax
4. **Binary file issues**: Ensure `.bin` files are not corrupted during transfer

## Security Considerations

- Never expose model files in client-side code that shouldn't be public
- Validate all inputs before feeding them to ML models
- Regularly update models to improve accuracy and security
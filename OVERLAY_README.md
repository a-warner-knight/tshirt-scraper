# Image Overlay Functions

This module provides Node.js functions to create product images by overlaying design images onto base product images.

## Features

- Parses `image-data.json` and `box-data.json` to get positioning and sizing information
- Loads base images from the specified paths in `box-data.json`
- Loads design images from `downloaded_images_designs/`
- Positions overlays as if the base image was 800x800 (normalized positioning)
- Outputs PNG images with the overlays applied

## Usage

### Basic Usage

```javascript
const { processAllProducts, processProductType } = require('./overlay');

// Process all product types
await processAllProducts();

// Or process a specific product type
await processProductType('tee-essential');
```

### Available Functions

#### `loadImageData()`
Loads and parses `image-data.json` to get design positioning information.

#### `loadBoxData()`
Loads and parses `box-data.json` to get base image paths and box information.

#### `createProductImage(productType, designName, baseImagePath, designImagePath, imageDataEntry)`
Creates a single product image with design overlay.

#### `processProductType(productType)`
Processes all designs for a specific product type (e.g., 'tee-essential', 'hoodie-essential').

#### `processAllProducts()`
Processes all product types found in the image data.

#### `main()`
Main function that runs the complete overlay process.

## Output

The functions create output directories for each product type:
- `output_tee-essential/` - for t-shirt images
- `output_hoodie-essential/` - for hoodie images

Each output file is named: `{designName}_{productType}.png`

## Requirements

- Node.js with TypeScript support
- `canvas` package for image processing
- The following directory structure:
  - `image-data.json` - Design positioning data
  - `box-data.json` - Base image paths and box data
  - `downloaded_images_designs/` - Design images
  - `downloaded_images_tees/` - T-shirt base images
  - `downloaded_images_hoodies/` - Hoodie base images

## Running the Script

```bash
# Compile and run
npx tsc overlay.ts
node overlay.js

# Or run directly with ts-node
npx ts-node overlay.ts
```

## Example

The script will:
1. Load the JSON data files
2. For each product type (tee-essential, hoodie-essential):
   - Load base images from the specified path
   - For each design in the image data:
     - Load the corresponding design image
     - Calculate overlay position as if base image was 800x800
     - Create the composite image
     - Save to output directory

## Error Handling

The script includes comprehensive error handling:
- Missing files are logged as warnings and skipped
- Invalid JSON data throws descriptive errors
- Image processing errors are caught and logged
- The process continues even if individual images fail 
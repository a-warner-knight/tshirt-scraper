import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';

// Types for our data structures
interface Scale {
  x: number;
  y: number;
}

interface ImageDataEntry {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: Scale;
  baseImage: string;
  timestamp: string;
}

interface ImageData {
  [productType: string]: {
    [designName: string]: ImageDataEntry;
  };
}

interface BoxDataEntry {
  path: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface BoxData {
  [productType: string]: BoxDataEntry;
}

/**
 * Load and parse image-data.json
 */
export function loadJson(filename: string): any {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    throw error;
  }
}

/**
 * Calculate overlay position and size as if base image was 800x800
 */
function calculateOverlayPosition(
  entry: ImageDataEntry,
  baseImageWidth: number,
  baseImageHeight: number
) {
  const targetSize = 800;
  const scaleX = baseImageWidth / targetSize;
  const scaleY = baseImageHeight / targetSize;
  
  // Scale the overlay position and size to match 800x800 base image
  const scaledX = entry.x * scaleX;
  const scaledY = entry.y * scaleY;
  const scaledWidth = entry.width * scaleX;
  const scaledHeight = entry.height * scaleY;
  
  return {
    x: scaledX,
    y: scaledY,
    width: scaledWidth,
    height: scaledHeight
  };
}

/**
 * Create a product image with design overlay
 */
export async function createProductImage(
  productType: string,
  designName: string,
  baseImagePath: string,
  designImagePath: string,
  imageDataEntry: ImageDataEntry
): Promise<Buffer> {
  try {
    if (!fs.existsSync(baseImagePath)) {
      throw new Error(`Base image not found: ${baseImagePath}`);
    }
    if (!fs.existsSync(designImagePath)) {
      throw new Error(`Design image not found: ${designImagePath}`);
    }

    // Load the base image
    const baseImage = await loadImage(baseImagePath);
    const baseWidth = baseImage.width;
    const baseHeight = baseImage.height;
    
    // Load the design image
    const designImage = await loadImage(designImagePath);
    
    // Create canvas with base image dimensions
    const canvas = createCanvas(baseWidth, baseHeight);
    const ctx = canvas.getContext('2d');
    
    // Draw base image
    ctx.drawImage(baseImage, 0, 0);
    
    // Calculate overlay position as if base image was 800x800
    const overlayPos = calculateOverlayPosition(imageDataEntry, baseWidth, baseHeight);
    
    // Draw design overlay
    ctx.drawImage(
      designImage,
      overlayPos.x,
      overlayPos.y,
      overlayPos.width,
      overlayPos.height
    );
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error(`Error creating product image for ${productType}/${designName}:`, error);
    throw error;
  }
}

/**
 * Process all product images for a specific product type
 */
export async function processProductType(productType: string): Promise<void> {
  const imageData = loadJson('image-data.json') as ImageData;
  const boxData = loadJson('box-data.json') as BoxData;
  
  if (!imageData[productType]) {
    console.error(`No image data found for product type: ${productType}`);
    return;
  }
  
  if (!boxData[productType]) {
    console.error(`No box data found for product type: ${productType}`);
    return;
  }
  
  const productImageData = imageData[productType];
  const productBoxData = boxData[productType];
  const baseImagePath = productBoxData.path;
  
  // Create output directory
  const outputDir = `output_${productType}`;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Processing ${productType}...`);
  
  // Get all image files in the base images directory
  const baseImageFiles = fs.readdirSync(baseImagePath)
    .filter(file => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file))
    .map(file => path.join(baseImagePath, file));
  
  console.log(`Found ${baseImageFiles.length} base images in ${baseImagePath}`);
  
  for (const [designName, imageDataEntry] of Object.entries(productImageData)) {
    const designImagePath = path.join('downloaded_images_designs', `${designName}`);
    
    // Check if design image exists
    if (!fs.existsSync(designImagePath)) {
      console.warn(`Design image not found: ${designImagePath}`);
      continue;
    }
    
    // Process each base image with this design
    for (const baseImageFile of baseImageFiles) {
      try {
        // Create the product image
        const productImageBuffer = await createProductImage(
          productType,
          designName,
          baseImageFile,
          designImagePath,
          imageDataEntry
        );
        
        // Generate output filename with base image name
        const baseImageName = path.basename(baseImageFile, path.extname(baseImageFile));
        const designNameClean = designName.replace('.png', '');
        const outputPath = path.join(outputDir, `${designNameClean}_${baseImageName}_${productType}.png`);
        
        fs.writeFileSync(outputPath, productImageBuffer);
        console.log(`Created: ${outputPath}`);
      } catch (error) {
        console.error(`Error processing ${designName} with ${path.basename(baseImageFile)}:`, error);
      }
    }
  }
  
  console.log(`Finished processing ${productType}`);
}

/**
 * Process all product types
 */
export async function processAllProducts(): Promise<void> {
  const imageData = loadJson('image-data.json') as ImageData;
  const productTypes = Object.keys(imageData);
  
  console.log(`Found product types: ${productTypes.join(', ')}`);
  
  for (const productType of productTypes) {
    await processProductType(productType);
  }
  
  console.log('All products processed!');
}

/**
 * Main function to run the overlay process
 */
export async function main(): Promise<void> {
  try {
    await processAllProducts();
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
} 
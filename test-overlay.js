const { processAllProducts, processProductType } = require('./overlay');

// Example usage:
async function testOverlay() {
  try {
    console.log('Starting overlay process...');
    
    // Process all product types
    await processAllProducts();
    
    // Or process a specific product type
    // await processProductType('tee-essential');
    
    console.log('Overlay process completed!');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testOverlay(); 
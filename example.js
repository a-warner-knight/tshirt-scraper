const { ImageScraper } = require('./scraper');

// Example 1: Basic usage with default config
async function basicExample() {
    console.log('=== Basic Example ===');
    const scraper = new ImageScraper();
    
    try {
        const files = await scraper.scrapeImages();
        console.log(`Downloaded ${files.length} files`);
    } catch (error) {
        console.error('Basic example failed:', error.message);
    }
}

// Example 2: Custom configuration
async function customExample() {
    console.log('\n=== Custom Configuration Example ===');
    
    const customConfig = {
        GALLERY_URL: 'https://thetshirtco.com.au/collections/t-shirts-polos-custom-printing/products/essential-tee-custom-printed',
        OUTPUT_DIR: './custom_images',
        REQUEST_DELAY: 2000, // Slower, more respectful
        FILENAME_PATTERN: 'tshirt_{index}',
        VERBOSE_LOGGING: true,
        // Only download high-quality images (larger sizes)
        IMAGE_SELECTORS: [
            'img[src*="width=1500"]',
            'img[src*="width=3840"]'
        ]
    };
    
    const scraper = new ImageScraper(customConfig);
    
    try {
        const files = await scraper.scrapeImages();
        console.log(`Downloaded ${files.length} high-quality images`);
    } catch (error) {
        console.error('Custom example failed:', error.message);
    }
}

// Example 3: Multiple URLs
async function multipleUrlsExample() {
    console.log('\n=== Multiple URLs Example ===');
    
    const urls = [
        'https://thetshirtco.com.au/collections/t-shirts-polos-custom-printing/products/essential-tee-custom-printed'
        // Add more URLs here as needed
    ];
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\nScraping URL ${i + 1}/${urls.length}: ${url}`);
        
        const config = {
            GALLERY_URL: url,
            OUTPUT_DIR: `./batch_${i + 1}_images`,
            FILENAME_PATTERN: `batch_${i + 1}_image_{index}`,
            REQUEST_DELAY: 1500
        };
        
        const scraper = new ImageScraper(config);
        
        try {
            const files = await scraper.scrapeImages();
            console.log(`Batch ${i + 1}: Downloaded ${files.length} images`);
        } catch (error) {
            console.error(`Batch ${i + 1} failed:`, error.message);
        }
    }
}

// Run examples
async function runExamples() {
    try {
        await basicExample();
        await customExample();
        await multipleUrlsExample();
        
        console.log('\n=== All examples completed ===');
    } catch (error) {
        console.error('Examples failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    runExamples();
}

module.exports = { basicExample, customExample, multipleUrlsExample }; 
const { ImageScraper } = require('./scraper');

// Test the file extension functionality
async function testExtensions() {
    console.log('=== Testing File Extensions ===');
    
    const scraper = new ImageScraper();
    
    // Test URLs with different extensions
    const testUrls = [
        'https://thetshirtco.com.au/cdn/shop/files/TSCO_5000_Essential_Heavy_Tee_black.jpg?v=1692254864&width=1500',
        'https://thetshirtco.com.au/cdn/shop/files/TSCO_Brand_Assets_2023_408px.png?height=50&v=1693433338',
        'https://cdn.shopify.com/s/files/1/0565/5576/5940/files/TSCO_Size_measurement_guide_240x240.png?v=1688002572',
        'https://example.com/image.webp?width=100',
        'https://example.com/image.jpeg?quality=high',
        'https://example.com/image.gif?format=png'
    ];
    
    console.log('Testing file extension extraction:');
    testUrls.forEach((url, index) => {
        const extension = scraper.getFileExtension(url);
        console.log(`${index + 1}. ${url}`);
        console.log(`   → Extension: ${extension}`);
        console.log('');
    });
    
    // Test with custom config for limited downloads
    const limitedConfig = {
        ...require('./config'),
        OUTPUT_DIR: './test_images',
        REQUEST_DELAY: 500,
        // Only download first 3 images for testing
        MAX_IMAGES: 3
    };
    
    console.log('=== Testing Limited Download ===');
    const testScraper = new ImageScraper(limitedConfig);
    
    try {
        const html = await testScraper.fetchHTML(limitedConfig.GALLERY_URL);
        const imageUrls = testScraper.extractImageUrls(html);
        
        console.log(`Found ${imageUrls.length} images, downloading first 3...`);
        
        const downloadedFiles = [];
        for (let i = 0; i < Math.min(3, imageUrls.length); i++) {
            const imageUrl = imageUrls[i];
            const extension = testScraper.getFileExtension(imageUrl);
            const filename = `test_image_${i + 1}${extension}`;
            
            console.log(`\nDownloading: ${imageUrl}`);
            console.log(`Filename: ${filename}`);
            
            try {
                await testScraper.downloadImage(imageUrl, filename);
                downloadedFiles.push(filename);
                
                if (i < 2) {
                    await testScraper.delay(500);
                }
            } catch (error) {
                console.error(`Failed to download ${imageUrl}`);
            }
        }
        
        console.log(`\nTest completed! Downloaded ${downloadedFiles.length} files with proper extensions.`);
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testExtensions();
}

module.exports = { testExtensions }; 
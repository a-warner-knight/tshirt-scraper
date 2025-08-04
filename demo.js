const { ImageScraper } = require('./scraper');

async function demoImageGrouping() {
    console.log('=== Image Grouping Demo ===\n');
    
    const scraper = new ImageScraper();
    
    try {
        // Fetch HTML and extract image URLs
        const html = await scraper.fetchHTML(scraper.config.GALLERY_URL);
        const imageUrls = scraper.extractImageUrls(html);
        
        console.log(`Found ${imageUrls.length} total images`);
        
        // Group images by common path
        const groupedImages = scraper.analyzeImageUrls(imageUrls);
        console.log(`Grouped into ${groupedImages.size} unique image paths\n`);
        
        // Display the grouping results
        console.log('=== Image Groups Analysis ===\n');
        
        let totalVariants = 0;
        groupedImages.forEach((queryStrings, basePath) => {
            const queryArray = Array.from(queryStrings);
            const extension = scraper.getFileExtension(basePath);
            
            console.log(`📁 ${basePath}`);
            console.log(`   📄 Extension: ${extension}`);
            console.log(`   🔢 Variants: ${queryArray.length}`);
            
            // Show the different sizes available
            const sizes = queryArray.map(query => {
                const widthMatch = query.match(/width=(\d+)/);
                const heightMatch = query.match(/height=(\d+)/);
                if (widthMatch) return `${widthMatch[1]}px wide`;
                if (heightMatch) return `${heightMatch[1]}px high`;
                return 'custom size';
            });
            
            console.log(`   📏 Sizes: ${sizes.join(', ')}`);
            console.log('');
            
            totalVariants += queryArray.length;
        });
        
        console.log(`=== Summary ===`);
        console.log(`Total unique images: ${groupedImages.size}`);
        console.log(`Total variants: ${totalVariants}`);
        console.log(`Average variants per image: ${(totalVariants / groupedImages.size).toFixed(1)}`);
        
        // Show some examples of what you could download
        console.log(`\n=== Example Downloads ===`);
        console.log(`You could download:`);
        console.log(`• All high-quality images (width=3840): ${Array.from(groupedImages.values()).filter(queries => 
            Array.from(queries).some(q => q.includes('width=3840'))).length} images`);
        console.log(`• All medium-quality images (width=1500): ${Array.from(groupedImages.values()).filter(queries => 
            Array.from(queries).some(q => q.includes('width=1500'))).length} images`);
        console.log(`• All thumbnail images (width=416): ${Array.from(groupedImages.values()).filter(queries => 
            Array.from(queries).some(q => q.includes('width=416'))).length} images`);
        console.log(`• All PNG images: ${Array.from(groupedImages.keys()).filter(path => 
            scraper.getFileExtension(path) === '.png').length} images`);
        console.log(`• All JPG images: ${Array.from(groupedImages.keys()).filter(path => 
            scraper.getFileExtension(path) === '.jpg').length} images`);
        
    } catch (error) {
        console.error('Demo failed:', error.message);
    }
}

// Run the demo
if (require.main === module) {
    demoImageGrouping();
}

module.exports = { demoImageGrouping }; 
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import configuration
const CONFIG = require('./config');

class ImageScraper {
    constructor(config = CONFIG) {
        this.config = config;
        this.axiosInstance = axios.create({
            headers: {
                'User-Agent': config.USER_AGENT,
                ...config.CUSTOM_HEADERS
            },
            timeout: 10000
        });
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.config.OUTPUT_DIR)) {
            fs.mkdirSync(this.config.OUTPUT_DIR, { recursive: true });
        }
        
        // Initialize readline interface for user input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchHTML(url) {
        try {
            console.log(`Fetching HTML from: ${url}`);
            const response = await this.axiosInstance.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error fetching HTML from ${url}:`, error.message);
            throw error;
        }
    }

    extractImageUrls(html) {
        const $ = cheerio.load(html);
        const imageUrls = new Set();

        // Use configurable selectors
        this.config.IMAGE_SELECTORS.forEach(selector => {
            $(selector).each((index, element) => {
                const $img = $(element);
                let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
                
                if (src) {
                    // Convert relative URLs to absolute URLs
                    if (src.startsWith('//')) {
                        src = 'https:' + src;
                    } else if (src.startsWith('/')) {
                        src = 'https://thetshirtco.com.au' + src;
                    } else if (!src.startsWith('http')) {
                        src = 'https://thetshirtco.com.au/' + src;
                    }
                    
                    // Filter out small images, icons, and check file extensions
                    const hasValidExtension = this.config.ACCEPTED_EXTENSIONS.some(ext => 
                        src.toLowerCase().includes(ext.replace('.', ''))
                    );
                    
                    if (src && !src.includes('icon') && !src.includes('logo') && 
                        !src.includes('placeholder') && hasValidExtension) {
                        imageUrls.add(src);
                    }
                }
            });
        });

        return Array.from(imageUrls);
    }

    analyzeImageUrls(imageUrls) {
        const groupedImages = new Map();
        
        imageUrls.forEach(url => {
            try {
                const urlObj = new URL(url);
                const basePath = urlObj.pathname;
                const queryString = urlObj.search;
                
                if (!groupedImages.has(basePath)) {
                    groupedImages.set(basePath, new Set());
                }
                
                groupedImages.get(basePath).add(queryString);
            } catch (error) {
                console.warn(`Invalid URL: ${url}`);
            }
        });
        
        return groupedImages;
    }

    displayImageOptions(groupedImages) {
        console.log('\n=== Available Image Groups ===\n');
        
        const options = [];
        let optionIndex = 1;
        
        // Collect all unique query parameters for bulk selection
        const allQueryParams = new Set();
        
        groupedImages.forEach((queryStrings, basePath) => {
            const queryArray = Array.from(queryStrings);
            queryArray.forEach(query => {
                if (query) {
                    // Extract individual parameters
                    const params = new URLSearchParams(query);
                    params.forEach((value, key) => {
                        allQueryParams.add(`${key}=${value}`);
                    });
                }
            });
        });
        
        // Display common query parameters
        if (allQueryParams.size > 0) {
            console.log('🔍 Common Query Parameters:');
            const paramArray = Array.from(allQueryParams);
            paramArray.forEach((param, index) => {
                console.log(`   ${index + 1}. ${param}`);
            });
            console.log('');
        }
        
        groupedImages.forEach((queryStrings, basePath) => {
            const queryArray = Array.from(queryStrings);
            const extension = this.getFileExtension(basePath);
            
            // Parse the path to separate domain, sub-path, and filename
            const pathParts = basePath.split('/');
            const filename = pathParts.pop(); // Get the actual filename
            const subPath = pathParts.slice(1).join('/'); // Get the sub-path (remove first empty element)
            const domain = 'thetshirtco.com.au';
            
            console.log(`${optionIndex}. 📁 Domain: ${domain}`);
            console.log(`   📂 Path: /${subPath}`);
            console.log(`   📄 File: **${filename}**`);
            console.log(`   🔧 Extension: ${extension}`);
            console.log(`   🔢 Variants: ${queryArray.length}`);
            
            // Show available sizes/parameters
            const sizes = queryArray.map(query => {
                const widthMatch = query.match(/width=(\d+)/);
                const heightMatch = query.match(/height=(\d+)/);
                if (widthMatch) return `${widthMatch[1]}px wide`;
                if (heightMatch) return `${heightMatch[1]}px high`;
                return 'custom size';
            });
            
            console.log(`   📏 Sizes: ${sizes.join(', ')}`);
            
            queryArray.forEach((query, index) => {
                const fullUrl = `https://thetshirtco.com.au${basePath}${query}`;
                console.log(`   ${index + 1}. ${query || '(no parameters)'}`);
                console.log(`      URL: ${fullUrl}`);
            });
            
            options.push({
                index: optionIndex,
                basePath,
                queryStrings: queryArray,
                extension,
                filename,
                subPath,
                domain
            });
            
            console.log('');
            optionIndex++;
        });
        
        return { options, allQueryParams: Array.from(allQueryParams) };
    }

    async getUserSelection(options, allQueryParams) {
        return new Promise((resolve) => {
            console.log('=== Selection Options ===');
            console.log('Enter the number of the image group you want to download:');
            console.log('Or enter "all" to download all images');
            console.log('Or enter "bulk" to download by query parameter');
            console.log('Or enter "quit" to exit');
            
            this.rl.question('\nYour choice: ', (answer) => {
                if (answer.toLowerCase() === 'quit') {
                    this.rl.close();
                    resolve(null);
                    return;
                }
                
                if (answer.toLowerCase() === 'all') {
                    this.rl.close();
                    resolve(options);
                    return;
                }
                
                if (answer.toLowerCase() === 'bulk') {
                    this.handleBulkSelection(allQueryParams, options).then(resolve);
                    return;
                }
                
                const selectedIndex = parseInt(answer) - 1;
                if (selectedIndex >= 0 && selectedIndex < options.length) {
                    const selected = options[selectedIndex];
                    
                    console.log(`\nSelected: **${selected.filename}**`);
                    console.log(`Path: /${selected.subPath}`);
                    console.log(`Available variants: ${selected.queryStrings.length}`);
                    
                    this.rl.question('Download all variants? (y/n): ', (variantAnswer) => {
                        if (variantAnswer.toLowerCase() === 'y' || variantAnswer.toLowerCase() === 'yes') {
                            this.rl.close();
                            resolve([selected]);
                        } else {
                            console.log('Available variants:');
                            selected.queryStrings.forEach((query, index) => {
                                console.log(`${index + 1}. ${query || '(no parameters)'}`);
                            });
                            
                            this.rl.question('Enter variant number(s) separated by commas: ', (variantSelection) => {
                                const variantIndices = variantSelection.split(',').map(s => parseInt(s.trim()) - 1);
                                const selectedVariants = variantIndices
                                    .filter(i => i >= 0 && i < selected.queryStrings.length)
                                    .map(i => selected.queryStrings[i]);
                                
                                const finalSelection = {
                                    ...selected,
                                    queryStrings: selectedVariants
                                };
                                
                                this.rl.close();
                                resolve([finalSelection]);
                            });
                        }
                    });
                } else {
                    console.log('Invalid selection. Please try again.');
                    this.rl.close();
                    resolve(null);
                }
            });
        });
    }

    async handleBulkSelection(allQueryParams, options) {
        return new Promise((resolve) => {
            console.log('\n=== Bulk Download by Query Parameter ===');
            console.log('Available query parameters:');
            
            allQueryParams.forEach((param, index) => {
                console.log(`${index + 1}. ${param}`);
            });
            
            this.rl.question('\nEnter the number of the query parameter: ', (paramAnswer) => {
                const paramIndex = parseInt(paramAnswer) - 1;
                if (paramIndex >= 0 && paramIndex < allQueryParams.length) {
                    const selectedParam = allQueryParams[paramIndex];
                    
                    console.log(`\nSelected parameter: ${selectedParam}`);
                    console.log('Finding all images with this parameter...');
                    
                    // Find all options that have this query parameter
                    const matchingOptions = options.filter(option => 
                        option.queryStrings.some(query => query.includes(selectedParam))
                    );
                    
                    console.log(`Found ${matchingOptions.length} images with parameter "${selectedParam}"`);
                    
                    // Create a new selection with only the matching query strings
                    const bulkSelection = matchingOptions.map(option => ({
                        ...option,
                        queryStrings: option.queryStrings.filter(query => query.includes(selectedParam))
                    }));
                    
                    this.rl.close();
                    resolve(bulkSelection);
                } else {
                    console.log('Invalid parameter selection.');
                    this.rl.close();
                    resolve(null);
                }
            });
        });
    }

    getFileExtension(imageUrl) {
        // Search the URL for image format indicators
        const urlLower = imageUrl.toLowerCase();
        
        // Check for PNG first (more specific)
        if (urlLower.includes('.png') || urlLower.includes('png')) {
            return '.png';
        }
        
        // Check for JPG/JPEG
        if (urlLower.includes('.jpg') || urlLower.includes('jpg') || 
            urlLower.includes('.jpeg') || urlLower.includes('jpeg')) {
            return '.jpg';
        }
        
        // Check for WebP (convert to PNG)
        if (urlLower.includes('.webp') || urlLower.includes('webp')) {
            return '.png';
        }
        
        // Check for GIF (convert to PNG)
        if (urlLower.includes('.gif') || urlLower.includes('gif')) {
            return '.png';
        }
        
        // Default to JPG if no format is found
        return '.jpg';
    }

    async downloadImage(imageUrl, filename) {
        try {
            console.log(`Downloading: ${imageUrl}`);
            const response = await this.axiosInstance.get(imageUrl, {
                responseType: 'stream'
            });

            const filePath = path.join(this.config.OUTPUT_DIR, filename);
            const writer = fs.createWriteStream(filePath);
            
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log(`✓ Downloaded: ${filename}`);
                    resolve(filePath);
                });
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(`Error downloading ${imageUrl}:`, error.message);
            throw error;
        }
    }

    async scrapeImages() {
        try {
            console.log('Starting image scraping...');
            console.log(`Target URL: ${this.config.GALLERY_URL}`);
            
            // Fetch the HTML
            const html = await this.fetchHTML(this.config.GALLERY_URL);
            
            // Extract image URLs
            const imageUrls = this.extractImageUrls(html);
            
            console.log(`Found ${imageUrls.length} images`);
            
            if (imageUrls.length === 0) {
                console.log('No images found. The page structure might have changed or images might be loaded dynamically.');
                return [];
            }

            // Analyze and group images
            const groupedImages = this.analyzeImageUrls(imageUrls);
            console.log(`\nGrouped into ${groupedImages.size} unique image paths`);
            
            // Display options to user
            const { options, allQueryParams } = this.displayImageOptions(groupedImages);
            
            // Get user selection
            const selectedOptions = await this.getUserSelection(options, allQueryParams);
            
            if (!selectedOptions) {
                console.log('No selection made. Exiting.');
                return [];
            }

            // Download selected images
            const downloadedFiles = [];
            let fileIndex = 1;
            
            for (const option of selectedOptions) {
                for (const queryString of option.queryStrings) {
                    const imageUrl = `https://thetshirtco.com.au${option.basePath}${queryString}`;
                    const filename = `${this.config.FILENAME_PATTERN.replace('{index}', fileIndex)}${option.extension}`;
                    
                    try {
                        await this.downloadImage(imageUrl, filename);
                        downloadedFiles.push(filename);
                        fileIndex++;
                        
                        // Add delay between downloads to be respectful
                        if (fileIndex <= selectedOptions.length * option.queryStrings.length) {
                            await this.delay(this.config.REQUEST_DELAY);
                        }
                    } catch (error) {
                        console.error(`Failed to download ${imageUrl}`);
                    }
                }
            }

            console.log(`\nScraping completed! Downloaded ${downloadedFiles.length} images to ${this.config.OUTPUT_DIR}`);
            return downloadedFiles;
            
        } catch (error) {
            console.error('Scraping failed:', error.message);
            throw error;
        }
    }
}

// Main execution
async function main() {
    try {
        const scraper = new ImageScraper();
        await scraper.scrapeImages();
    } catch (error) {
        console.error('Script failed:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { ImageScraper, CONFIG };

// Run if called directly
if (require.main === module) {
    main();
} 
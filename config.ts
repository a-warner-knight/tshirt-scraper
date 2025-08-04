// Configuration file for the image scraper
export interface ScraperConfig {
    GALLERY_URLs: string[];
    OUTPUT_DIR: string;
    USER_AGENT: string;
    REQUEST_DELAY: number;
    IMAGE_QUALITY: string;
    FILENAME_PATTERN: string;
    IMAGE_SELECTORS: string[];
    ACCEPTED_EXTENSIONS: string[];
    MIN_IMAGE_SIZE: number;
    MAX_CONCURRENT_DOWNLOADS: number;
    MAX_RETRIES: number;
    RETRY_DELAY: number;
    VERBOSE_LOGGING: boolean;
    CUSTOM_HEADERS: Record<string, string>;
}

const CONFIG: ScraperConfig = {
    // Base URL for the gallery - make this configurable
    // GALLERY_URL: 'https://thetshirtco.com.au/collections/t-shirts-polos-custom-printing/products/essential-tee-custom-printed',
    GALLERY_URLs: [
        "https://thetshirtco.com.au/collections/jumpers-hoodies-printing-custom/products/essential-hoodie-custom-printed",
        "https://thetshirtco.com.au/collections/t-shirts-polos-custom-printing/products/essential-tee-custom-printed",
    ],

    // Output directory for downloaded images
    OUTPUT_DIR: './downloaded_images',
    
    // User agent to avoid being blocked
    USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Delay between requests (in milliseconds) - be respectful to the server
    REQUEST_DELAY: 1000,
    
    // Image quality preference
    IMAGE_QUALITY: 'high',
    
    // File naming pattern
    FILENAME_PATTERN: 'image_{index}',
    
    // Image selectors to look for (in order of preference)
    IMAGE_SELECTORS: [
        'img[src]',
        'img[data-src]',
        'img[data-lazy-src]',
        '.product-gallery img',
        '.gallery img',
        '.product-images img',
        '[data-media-id] img',
        '.product__media img',
        '.product__image img'
    ],
    
    // File extensions to accept
    ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    
    // Minimum image size to download (in bytes) - helps filter out icons
    MIN_IMAGE_SIZE: 1000,
    
    // Maximum concurrent downloads
    MAX_CONCURRENT_DOWNLOADS: 1,
    
    // Retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    
    // Logging
    VERBOSE_LOGGING: true,
    
    // Custom headers (optional)
    CUSTOM_HEADERS: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
};

export default CONFIG; 
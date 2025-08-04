# T-Shirt Image Scraper

A Node.js script to scrape images from t-shirt websites, specifically designed for [The T-Shirt Co](https://thetshirtco.com.au/).

## Features

- Configurable target URL
- Respectful scraping with delays between requests
- Multiple image selector strategies
- **Interactive image selection** - choose specific images or bulk download by query parameters
- **Smart image grouping** - groups images by common paths and shows available variants
- **Bulk parameter selection** - download all images with specific query parameters (e.g., all 1500px wide images)
- Automatic file naming with proper extensions (.jpg, .png)
- Error handling and retry logic
- Filtering of icons and small images
- Support for various image formats (JPG, PNG, WebP)
- Smart file extension detection from URLs with query parameters

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage

Run the scraper with interactive selection:
```bash
npm start
```

Or directly with Node:
```bash
node scraper.js
```

The scraper will:
1. **Analyze all images** on the page and group them by common paths
2. **Display available options** with domain, path, filename, and available sizes
3. **Show common query parameters** for bulk selection
4. **Let you choose**:
   - Individual image groups
   - All images
   - Bulk download by query parameter (e.g., all 1500px wide images)

### Configuration

Edit the `config.js` file to customize the scraper:

```javascript
module.exports = {
    // Change the target URL
    GALLERY_URL: 'https://thetshirtco.com.au/collections/t-shirts-polos-custom-printing/products/essential-tee-custom-printed',
    
    // Change output directory
    OUTPUT_DIR: './downloaded_images',
    
    // Adjust request delay (in milliseconds)
    REQUEST_DELAY: 1000,
    
    // Customize filename pattern
    FILENAME_PATTERN: 'tshirt_image_{index}',
    
    // Add more image selectors if needed
    IMAGE_SELECTORS: [
        'img[src]',
        'img[data-src]',
        '.product-gallery img',
        // ... more selectors
    ]
};
```

### Programmatic Usage

You can also use the scraper as a module in your own code:

```javascript
const { ImageScraper } = require('./scraper');

const scraper = new ImageScraper({
    GALLERY_URL: 'your-target-url',
    OUTPUT_DIR: './my-images'
});

scraper.scrapeImages()
    .then(files => console.log('Downloaded:', files))
    .catch(error => console.error('Error:', error));
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `GALLERY_URL` | Target website URL | The T-Shirt Co product page |
| `OUTPUT_DIR` | Directory to save images | `./downloaded_images` |
| `REQUEST_DELAY` | Delay between requests (ms) | `1000` |
| `USER_AGENT` | Browser user agent string | Chrome user agent |
| `FILENAME_PATTERN` | File naming pattern | `image_{index}` |
| `IMAGE_SELECTORS` | CSS selectors for images | Multiple selectors |
| `ACCEPTED_EXTENSIONS` | Allowed file extensions | `['.jpg', '.jpeg', '.png', '.webp']` |
| `MAX_RETRIES` | Maximum download retries | `3` |
| `VERBOSE_LOGGING` | Enable detailed logging | `true` |

## Output

Images will be downloaded to the specified output directory with proper file extensions:
- `image_1.jpg` (for JPG/JPEG images)
- `image_2.png` (for PNG images)
- `image_3.png` (for WebP/GIF images, converted to PNG)
- etc.

The scraper intelligently detects the image format from the URL, even when query parameters are present.

## Ethical Considerations

- The scraper includes delays between requests to be respectful to the server
- It uses a proper user agent to identify itself
- Consider the website's robots.txt and terms of service
- Only scrape content you have permission to access

## Troubleshooting

### No images found
- Check if the website structure has changed
- Verify the URL is correct
- Images might be loaded dynamically via JavaScript
- Try different image selectors in the config

### Download errors
- Check your internet connection
- The server might be blocking requests
- Try increasing the `REQUEST_DELAY`
- Check if the image URLs are accessible

### Permission errors
- Ensure the output directory is writable
- Check file system permissions

## Dependencies

- `axios`: HTTP client for making requests
- `cheerio`: Server-side jQuery for HTML parsing
- `fs`: File system operations (built-in)
- `path`: Path utilities (built-in)

## License

MIT License - feel free to use and modify as needed. 
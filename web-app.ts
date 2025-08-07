import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Load box data from JSON file
let boxDataConfig: any = {};
try {
    const boxDataPath = path.join(__dirname, 'box-data.json');
    if (fs.existsSync(boxDataPath)) {
        const boxDataContent = fs.readFileSync(boxDataPath, 'utf8');
        boxDataConfig = JSON.parse(boxDataContent);
    }
} catch (error) {
    console.error('Error loading box data:', error);
}

function getImageData() {
      
    // Load existing image data
    let imageData: any = {};
    const imageDataPath = path.join(__dirname, 'image-data.json');
    
    if (fs.existsSync(imageDataPath)) {
      const imageDataContent = fs.readFileSync(imageDataPath, 'utf8');
      imageData = JSON.parse(imageDataContent);
    }
    return imageData;
}

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/designs', express.static('downloaded_images_designs'));

// Dynamic static file serving for base image types
Object.keys(boxDataConfig).forEach(type => {
  app.use(`/${type}`, express.static(boxDataConfig[type].path));
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/types', (req, res) => {
  res.json(Object.keys(boxDataConfig));
});

app.get('/api/box-data', (req, res) => {
  res.json(boxDataConfig);
});

app.get('/api/image-data', (req, res) => {
  res.json(getImageData());
});

app.get('/api/base-images/:type', (req, res) => {
  const type = req.params.type;
  
  if (!boxDataConfig[type]) {
    return res.status(404).json({ error: 'Base type not found' });
  }
  
  const imagesDir = path.join(__dirname, boxDataConfig[type].path);
  
  try {
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    return res.json(imageFiles.map(file => ({
      name: file,
      url: `/${type}/${file}`
    })));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to read images directory' });
  }
});

app.get('/api/design-images', (req, res) => {
  const designsDir = path.join(__dirname, 'downloaded_images_designs');
  
  try {
    const files = fs.readdirSync(designsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    // Load existing image data to check completion status
    let imageData: any = getImageData();
    
    // For each design image, check which types have been completed
    const designImagesWithStatus = imageFiles.map(file => {
      const completedTypes: string[] = [];
      
      // Check each type in image-data.json
      Object.keys(imageData).forEach(type => {
        if (imageData[type] && imageData[type][file]) {
          completedTypes.push(type);
        }
      });
      
      return {
        name: file,
        url: `/designs/${file}`,
        done: completedTypes
      };
    });
    
    res.json(designImagesWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read designs directory' });
  }
});

app.get('/api/type-completion', (req, res) => {
  try {
    const designsDir = path.join(__dirname, 'downloaded_images_designs');
    const files = fs.readdirSync(designsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    // Load existing image data
    let imageData: any = getImageData();
    
    // Check completion status for each type
    const typeCompletion: any = {};
    
    Object.keys(boxDataConfig).forEach(type => {
      const completedDesigns = imageFiles.filter(file => 
        imageData[type] && imageData[type][file]
      );
      
      typeCompletion[type] = {
        completed: completedDesigns.length,
        total: imageFiles.length,
        isComplete: completedDesigns.length === imageFiles.length
      };
    });
    
    res.json(typeCompletion);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get type completion data' });
  }
});

app.post('/api/store-position', (req, res) => {
  const { scale, position, baseImage, designImage, baseType } = req.body;
  
  try {
    // Load existing image data or create new structure
    const imageDataPath = path.join(__dirname, 'image-data.json');
    const imageData: any = getImageData();
    
    // Extract design image name from the URL
    const designImageName = designImage.split('/').pop();
    
    // Ensure the base type exists in the structure
    if (!imageData[baseType]) {
      imageData[baseType] = {};
    }
    
    // Store the position data under the design image name
    imageData[baseType][designImageName] = {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      scale: scale,
      baseImage: baseImage,
      timestamp: new Date().toISOString()
    };
    
    // Write the updated data back to the file
    fs.writeFileSync(imageDataPath, JSON.stringify(imageData, null, 2));
    
    console.log('Stored position data:', {
      imageDataPath,
      baseType,
      designImage: designImageName,
      position,
      scale,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Position data stored successfully' });
  } catch (error) {
    console.error('Error storing position data:', error);
    res.status(500).json({ error: 'Failed to store position data' });
  }
});

app.listen(PORT, () => {
  console.log(`Web app running at http://localhost:${PORT}`);
}); 
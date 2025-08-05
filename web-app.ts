import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static('downloaded_images_hoodies'));
app.use('/designs', express.static('downloaded_images_designs'));

// Load box data from JSON file
let boxData = {
    x: 100,
    y: 150,
    width: 200,
    height: 150
};
try {
    const boxDataPath = path.join(__dirname, 'box-data.json');
    if (fs.existsSync(boxDataPath)) {
        const boxDataContent = fs.readFileSync(boxDataPath, 'utf8');
        boxData = JSON.parse(boxDataContent);
    }
} catch (error) {
    console.error('Error loading box data:', error);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/box-data', (req, res) => {
  res.json(boxData);
});

app.get('/api/base-images', (req, res) => {
  const imagesDir = path.join(__dirname, 'downloaded_images_hoodies');
  
  try {
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    res.json(imageFiles.map(file => ({
      name: file,
      url: `/images/${file}`
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read images directory' });
  }
});

app.get('/api/design-images', (req, res) => {
  const designsDir = path.join(__dirname, 'downloaded_images_designs');
  
  try {
    const files = fs.readdirSync(designsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    res.json(imageFiles.map(file => ({
      name: file,
      url: `/designs/${file}`
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read designs directory' });
  }
});

app.post('/api/store-position', (req, res) => {
  const { scale, position, baseImage, designImage } = req.body;
  
  // Store the position data (you can save to a file or database)
  console.log('Stored position data:', {
    scale,
    position,
    baseImage,
    designImage,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Position data stored successfully' });
});

app.listen(PORT, () => {
  console.log(`Web app running at http://localhost:${PORT}`);
}); 
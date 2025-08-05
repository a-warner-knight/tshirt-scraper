# Image Overlay Editor Web App

A Node.js web application that allows users to overlay design images on base images with interactive positioning and scaling capabilities.

## Features

- **Base Image Selection**: Choose from available base images (hoodies, t-shirts, etc.)
- **Design Image Selection**: Select from available design images to overlay
- **Interactive Positioning**: Drag and drop design images to position them
- **Resize Capability**: Use corner handles to resize design images
- **Target Box Visualization**: Blue dashed box shows the target area for positioning
- **Position Storage**: Save scale and position data for later use
- **Modern UI**: Beautiful, responsive interface with gradient backgrounds

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the web application:
```bash
npm run web
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

### Basic Workflow

1. **Select Base Image**: Choose a base image from the dropdown (e.g., hoodie, t-shirt)
2. **Select Design Image**: Choose a design image to overlay
3. **Position Design**: The design image will appear centered and scaled to 1/4 of the base image size
4. **Drag to Reposition**: Click and drag the design image to move it around
5. **Resize Design**: Use the corner handles to resize the design image
6. **Store Position**: Click "Store Position" to save the current scale and position

### Controls

- **Base Image Dropdown**: Select the background image (hoodies, t-shirts, etc.)
- **Design Image Dropdown**: Select the design to overlay
- **Drag**: Click and drag the design image to move it
- **Resize Handles**: Corner handles allow resizing from any corner
- **Store Position**: Saves the current position and scale data
- **Reset Position**: Returns the design to its initial centered position

### Box Data Configuration

The target area (blue dashed box) is defined in `box-data.json`:

```json
{
  "x": 150,
  "y": 200,
  "width": 300,
  "height": 200
}
```

- `x`, `y`: Coordinates of the top-left corner of the target area
- `width`, `height`: Dimensions of the target area

## File Structure

```
tshirt-scraper/
├── web-app.ts              # Express server
├── public/
│   ├── index.html          # Main HTML page
│   └── app.js              # Frontend JavaScript
├── box-data.json           # Target area coordinates
├── downloaded_images_hoodies/  # Base images
└── downloaded_images_designs/  # Design images
```

## API Endpoints

- `GET /` - Main application page
- `GET /api/base-images` - List available base images
- `GET /api/design-images` - List available design images
- `GET /api/box-data` - Get target area coordinates
- `POST /api/store-position` - Store position and scale data

## Position Data Format

When you click "Store Position", the following data is saved:

```json
{
  "scale": {
    "x": 1.5,
    "y": 1.2
  },
  "position": {
    "x": 200,
    "y": 150,
    "width": 300,
    "height": 240
  },
  "baseImage": "/images/image_1.jpg",
  "designImage": "/designs/Rainbow_Vibe_Upsized-crop_no_bg.png"
}
```

- `scale`: Scale factors relative to original size
- `position`: Absolute position and dimensions on canvas
- `baseImage`: Path to the selected base image
- `designImage`: Path to the selected design image

## Customization

### Adding New Images

1. **Base Images**: Add images to `downloaded_images_hoodies/` directory
2. **Design Images**: Add images to `downloaded_images_designs/` directory
3. **Supported Formats**: JPG, JPEG, PNG, GIF

### Modifying Target Area

Edit `box-data.json` to change the target area coordinates:

```json
{
  "x": 100,
  "y": 100,
  "width": 400,
  "height": 300
}
```

### Styling

The application uses modern CSS with:
- Gradient backgrounds
- Smooth animations
- Responsive design
- Modern typography

## Troubleshooting

### Common Issues

1. **Images not loading**: Check that image files exist in the correct directories
2. **Server not starting**: Ensure port 3000 is available
3. **Box not appearing**: Verify `box-data.json` exists and is valid JSON

### Development

To run in development mode:
```bash
npm run web
```

The server will automatically reload when you make changes to the TypeScript files.

## Dependencies

- **Express**: Web server framework
- **TypeScript**: Type-safe JavaScript
- **ts-node**: TypeScript execution environment

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

The application uses modern JavaScript features and Canvas API for image manipulation. 
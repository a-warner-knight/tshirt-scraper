class ImageOverlayEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasContainer = document.getElementById('canvasContainer');
        
        // Elements
        this.baseImageSelect = document.getElementById('baseImageSelect');
        this.designImageSelect = document.getElementById('designImageSelect');
        this.storeBtn = document.getElementById('storeBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.centerHorizontalBtn = document.getElementById('centerHorizontalBtn');
        this.centerVerticalBtn = document.getElementById('centerVerticalBtn');
        this.status = document.getElementById('status');
        
        // State
        this.baseImage = null;
        this.designImage = null;
        this.boxData = null;
        this.designOverlay = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.originalSize = { width: 0, height: 0 };
        
        // Canvas dimensions
        this.canvasWidth = 800;
        this.canvasHeight = 800;
        
        this.init();
    }
    
    async init() {
        await this.loadImages();
        await this.loadBoxData();
        this.setupEventListeners();
        this.setupDesignOverlay();
    }
    
    async loadImages() {
        try {
            // Load base images
            const baseResponse = await fetch('/api/base-images');
            const baseImages = await baseResponse.json();
            
            baseImages.forEach(img => {
                const option = document.createElement('option');
                option.value = img.url;
                option.textContent = img.name;
                this.baseImageSelect.appendChild(option);
            });
            
            // Load design images
            const designResponse = await fetch('/api/design-images');
            const designImages = await designResponse.json();
            
            designImages.forEach(img => {
                const option = document.createElement('option');
                option.value = img.url;
                option.textContent = img.name;
                this.designImageSelect.appendChild(option);
            });
        } catch (error) {
            this.showStatus('Error loading images: ' + error.message, 'error');
        }
    }
    
    async loadBoxData() {
        try {
            const response = await fetch('/api/box-data');
            this.boxData = await response.json();
        } catch (error) {
            this.showStatus('Error loading box data: ' + error.message, 'error');
        }
    }
    
    setupEventListeners() {
        this.baseImageSelect.addEventListener('change', () => this.onBaseImageChange());
        this.designImageSelect.addEventListener('change', () => this.onDesignImageChange());
        this.storeBtn.addEventListener('click', () => this.storePosition());
        this.resetBtn.addEventListener('click', () => this.resetPosition());
        this.centerHorizontalBtn.addEventListener('click', () => this.centerHorizontal());
        this.centerVerticalBtn.addEventListener('click', () => this.centerVertical());
        
        // Global mouse events for dragging and resizing
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }
    
    setupDesignOverlay() {
        // Create design overlay element
        this.designOverlay = document.createElement('div');
        this.designOverlay.className = 'design-overlay';
        this.designOverlay.style.display = 'none';
        
        // Add mouse down event to the overlay
        this.designOverlay.addEventListener('mousedown', (e) => this.onMouseDown(e));
        
        // Create resize handles
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.handle = pos;
            this.designOverlay.appendChild(handle);
        });
        
        this.canvasContainer.appendChild(this.designOverlay);
    }
    
    async onBaseImageChange() {
        const selectedUrl = this.baseImageSelect.value;
        if (!selectedUrl) return;
        
        try {
            this.baseImage = await this.loadImage(selectedUrl);
            this.renderCanvas();
            this.updateButtons();
        } catch (error) {
            this.showStatus('Error loading base image: ' + error.message, 'error');
        }
    }
    
    async onDesignImageChange() {
        const selectedUrl = this.designImageSelect.value;
        if (!selectedUrl) return;
        
        try {
            this.designImage = await this.loadImage(selectedUrl);
            this.initializeDesignPosition();
            this.renderCanvas();
            this.updateButtons();
        } catch (error) {
            this.showStatus('Error loading design image: ' + error.message, 'error');
        }
    }
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    initializeDesignPosition() {
        if (!this.baseImage || !this.designImage) return;
        
        // Calculate initial position (centered, 1/4 size)
        const baseAspectRatio = this.baseImage.width / this.baseImage.height;
        const canvasAspectRatio = this.canvasWidth / this.canvasHeight;
        
        let drawWidth, drawHeight;
        if (baseAspectRatio > canvasAspectRatio) {
            drawWidth = this.canvasWidth;
            drawHeight = this.canvasWidth / baseAspectRatio;
        } else {
            drawHeight = this.canvasHeight;
            drawWidth = this.canvasHeight * baseAspectRatio;
        }
        
        const scaleX = drawWidth / this.baseImage.width;
        const scaleY = drawHeight / this.baseImage.height;
        
        // Design image starts at 1/4 size of base image
        const designWidth = drawWidth * 0.25;
        const designHeight = drawHeight * 0.25;
        
        // Center the design image
        const x = (this.canvasWidth - designWidth) / 2;
        const y = (this.canvasHeight - designHeight) / 2;
        
        this.designOverlay.style.left = x + 'px';
        this.designOverlay.style.top = y + 'px';
        this.designOverlay.style.width = designWidth + 'px';
        this.designOverlay.style.height = designHeight + 'px';
        this.designOverlay.style.display = 'block';
        
        // Set up the design image
        const img = document.createElement('img');
        img.src = this.designImage.src;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        // Clear previous content and add new image
        this.designOverlay.innerHTML = '';
        this.designOverlay.appendChild(img);
        
        // Re-add resize handles
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.handle = pos;
            this.designOverlay.appendChild(handle);
        });
        
        this.originalSize = { width: designWidth, height: designHeight };
    }
    
    renderCanvas() {
        if (!this.baseImage) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Calculate aspect ratio to fit image properly
        const baseAspectRatio = this.baseImage.width / this.baseImage.height;
        const canvasAspectRatio = this.canvasWidth / this.canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (baseAspectRatio > canvasAspectRatio) {
            drawWidth = this.canvasWidth;
            drawHeight = this.canvasWidth / baseAspectRatio;
            offsetX = 0;
            offsetY = (this.canvasHeight - drawHeight) / 2;
        } else {
            drawHeight = this.canvasHeight;
            drawWidth = this.canvasHeight * baseAspectRatio;
            offsetX = (this.canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Draw base image
        this.ctx.drawImage(this.baseImage, offsetX, offsetY, drawWidth, drawHeight);
        
        // Draw box if we have box data
        if (this.boxData) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(
                offsetX + this.boxData.x * (drawWidth / this.baseImage.width),
                offsetY + this.boxData.y * (drawHeight / this.baseImage.height),
                this.boxData.width * (drawWidth / this.baseImage.width),
                this.boxData.height * (drawHeight / this.baseImage.height)
            );
            this.ctx.setLineDash([]);
        }
    }
    
    onMouseDown(e) {
        if (!this.designOverlay || this.designOverlay.style.display === 'none') return;
        
        // Prevent default drag behavior
        e.preventDefault();
        e.stopPropagation();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on resize handle
        const handle = e.target.closest('.resize-handle');
        if (handle) {
            this.isResizing = true;
            this.resizeHandle = handle.dataset.handle;
            this.dragStart = { x, y };
            return;
        }
        
        // If clicking on the design overlay (not on a handle), start dragging
        this.isDragging = true;
        const overlayRect = this.designOverlay.getBoundingClientRect();
        this.dragStart = { 
            x: x - (overlayRect.left - rect.left),
            y: y - (overlayRect.top - rect.top)
        };
    }
    
    onMouseMove(e) {
        if (!this.isDragging && !this.isResizing) return;
        
        // Prevent default behavior during drag/resize
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging) {
            const newX = x - this.dragStart.x;
            const newY = y - this.dragStart.y;
            
            // Constrain to canvas bounds
            const maxX = this.canvasWidth - this.designOverlay.offsetWidth;
            const maxY = this.canvasHeight - this.designOverlay.offsetHeight;
            
            this.designOverlay.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
            this.designOverlay.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
        } else if (this.isResizing) {
            const currentRect = this.designOverlay.getBoundingClientRect();
            const currentLeft = currentRect.left - rect.left;
            const currentTop = currentRect.top - rect.top;
            
            let newWidth, newHeight, newLeft, newTop;
            
            switch (this.resizeHandle) {
                case 'se':
                    newWidth = x - currentLeft;
                    newHeight = y - currentTop;
                    newLeft = currentLeft;
                    newTop = currentTop;
                    break;
                case 'sw':
                    newWidth = (currentLeft + currentRect.width) - x;
                    newHeight = y - currentTop;
                    newLeft = x;
                    newTop = currentTop;
                    break;
                case 'ne':
                    newWidth = x - currentLeft;
                    newHeight = (currentTop + currentRect.height) - y;
                    newLeft = currentLeft;
                    newTop = y;
                    break;
                case 'nw':
                    newWidth = (currentLeft + currentRect.width) - x;
                    newHeight = (currentTop + currentRect.height) - y;
                    newLeft = x;
                    newTop = y;
                    break;
            }
            
            // Minimum size constraint
            const minSize = 20;
            if (newWidth >= minSize && newHeight >= minSize) {
                this.designOverlay.style.width = newWidth + 'px';
                this.designOverlay.style.height = newHeight + 'px';
                this.designOverlay.style.left = newLeft + 'px';
                this.designOverlay.style.top = newTop + 'px';
            }
        }
    }
    
    onMouseUp(e) {
        if (this.isDragging || this.isResizing) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    }
    
    updateButtons() {
        const hasImages = this.baseImage && this.designImage;
        this.storeBtn.disabled = !hasImages;
        this.resetBtn.disabled = !hasImages;
        this.centerHorizontalBtn.disabled = !hasImages;
        this.centerVerticalBtn.disabled = !hasImages;
    }
    
    async storePosition() {
        if (!this.designOverlay || this.designOverlay.style.display === 'none') return;
        
        const rect = this.designOverlay.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const width = rect.width;
        const height = rect.height;
        
        // Calculate scale relative to original size
        const scaleX = width / this.originalSize.width;
        const scaleY = height / this.originalSize.height;
        
        const positionData = {
            scale: { x: scaleX, y: scaleY },
            position: { x, y, width, height },
            baseImage: this.baseImageSelect.value,
            designImage: this.designImageSelect.value
        };
        
        try {
            const response = await fetch('/api/store-position', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(positionData)
            });
            
            const result = await response.json();
            if (result.success) {
                this.showStatus('Position data stored successfully!', 'success');
            } else {
                this.showStatus('Error storing position data', 'error');
            }
        } catch (error) {
            this.showStatus('Error storing position data: ' + error.message, 'error');
        }
    }
    
    resetPosition() {
        if (this.designImage) {
            this.initializeDesignPosition();
        }
    }
    
    centerHorizontal() {
        if (!this.designOverlay || !this.boxData || !this.baseImage) return;
        
        // Calculate box position on canvas
        const baseAspectRatio = this.baseImage.width / this.baseImage.height;
        const canvasAspectRatio = this.canvasWidth / this.canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (baseAspectRatio > canvasAspectRatio) {
            drawWidth = this.canvasWidth;
            drawHeight = this.canvasWidth / baseAspectRatio;
            offsetX = 0;
            offsetY = (this.canvasHeight - drawHeight) / 2;
        } else {
            drawHeight = this.canvasHeight;
            drawWidth = this.canvasHeight * baseAspectRatio;
            offsetX = (this.canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Calculate box center
        const boxCenterX = offsetX + this.boxData.x * (drawWidth / this.baseImage.width) + 
                          (this.boxData.width * (drawWidth / this.baseImage.width)) / 2;
        
        // Center design overlay horizontally on the box
        const designWidth = this.designOverlay.offsetWidth;
        const newX = boxCenterX - designWidth / 2;
        
        // Constrain to canvas bounds
        const constrainedX = Math.max(0, Math.min(this.canvasWidth - designWidth, newX));
        this.designOverlay.style.left = constrainedX + 'px';
    }
    
    centerVertical() {
        if (!this.designOverlay || !this.boxData || !this.baseImage) return;
        
        // Calculate box position on canvas
        const baseAspectRatio = this.baseImage.width / this.baseImage.height;
        const canvasAspectRatio = this.canvasWidth / this.canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (baseAspectRatio > canvasAspectRatio) {
            drawWidth = this.canvasWidth;
            drawHeight = this.canvasWidth / baseAspectRatio;
            offsetX = 0;
            offsetY = (this.canvasHeight - drawHeight) / 2;
        } else {
            drawHeight = this.canvasHeight;
            drawWidth = this.canvasHeight * baseAspectRatio;
            offsetX = (this.canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Calculate box center
        const boxCenterY = offsetY + this.boxData.y * (drawHeight / this.baseImage.height) + 
                          (this.boxData.height * (drawHeight / this.baseImage.height)) / 2;
        
        // Center design overlay vertically on the box
        const designHeight = this.designOverlay.offsetHeight;
        const newY = boxCenterY - designHeight / 2;
        
        // Constrain to canvas bounds
        const constrainedY = Math.max(0, Math.min(this.canvasHeight - designHeight, newY));
        this.designOverlay.style.top = constrainedY + 'px';
    }
    
    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        this.status.style.display = 'block';
        
        setTimeout(() => {
            this.status.style.display = 'none';
        }, 3000);
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageOverlayEditor();
}); 
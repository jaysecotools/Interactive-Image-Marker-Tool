class MediaURLHandler {
    // ... (keep all existing MediaURLHandler code exactly as is) ...
}

class EnhancedImageMarkerEditor {
    constructor() {
        this.image = document.getElementById('mainImage');
        this.container = document.getElementById('imageContainer');
        this.markers = [];
        this.selectedMarkers = new Set();
        this.undoStack = [];
        this.redoStack = [];
        this.dragState = null;
        this.currentMarkerColor = '#6366f1';
        this.currentMarkerOpacity = 0.8;
        this.isVRMode = false; // New: VR mode flag
        this.is360Image = false; // New: Detect 360 images
        
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
        this.setupKeyboardShortcuts();
        this.setupMediaUrlHelpers();
        
        this.currentMarkerColor = document.getElementById('markerColor').value;
        this.currentMarkerOpacity = parseFloat(document.getElementById('markerOpacity').value);
    }

    initializeEventListeners() {
        // Existing event listeners
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        document.getElementById('markerType').addEventListener('change', (e) => {
            this.togglePropertyFields(e.target.value);
        });

        document.getElementById('markerColor').addEventListener('change', (e) => {
            this.currentMarkerColor = e.target.value;
        });

        document.getElementById('markerOpacity').addEventListener('input', (e) => {
            this.currentMarkerOpacity = parseFloat(e.target.value);
        });

        document.getElementById('markerCustomOpacity').addEventListener('input', (e) => {
            this.updateSelectedMarkersOpacity(parseFloat(e.target.value));
        });

        this.container.addEventListener('click', (e) => {
            if (this.image.style.display !== 'none' && !this.dragState) {
                this.addMarker(e);
            }
        });

        this.container.addEventListener('dblclick', (e) => {
            if (this.image.style.display !== 'none') {
                this.handleDoubleClick(e);
            }
        });

        document.getElementById('saveMarker').addEventListener('click', () => {
            this.saveMarkerProperties();
        });

        document.getElementById('deleteMarker').addEventListener('click', () => {
            this.deleteSelectedMarkers();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportOptions();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.importProject();
        });

        document.getElementById('clearMarkers').addEventListener('click', () => {
            this.clearMarkers();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        document.getElementById('searchMarkers').addEventListener('input', (e) => {
            this.filterMarkers(e.target.value);
        });

        document.getElementById('markerUrl').addEventListener('blur', (e) => {
            this.validateAndPreviewUrl(e.target.value, 'link');
        });

        document.getElementById('markerMediaUrl').addEventListener('blur', (e) => {
            this.validateAndPreviewUrl(e.target.value, 'media');
        });

        document.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        document.getElementById('markerCustomColor').addEventListener('change', (e) => {
            this.updateSelectedMarkersColor(e.target.value);
        });

        // NEW: VR Mode Toggle
        document.getElementById('vrModeBtn').addEventListener('click', () => {
            this.toggleVRMode();
        });
    }

    // NEW: Toggle between 2D and VR Mode
    toggleVRMode() {
        if (!this.image.src) {
            this.showStatus('Please upload an image first', 'warning');
            return;
        }

        this.isVRMode = !this.isVRMode;
        const vrButton = document.getElementById('vrModeBtn');
        
        if (this.isVRMode) {
            vrButton.innerHTML = '<span class="material-icons">view_in_ar</span> VR Mode';
            vrButton.classList.add('vr-active');
            this.showStatus('VR Mode: Markers will be placed in 3D space for 360° viewing', 'success');
            
            // Check if image is 360 (2:1 aspect ratio)
            this.checkIf360Image();
        } else {
            vrButton.innerHTML = '<span class="material-icons">view_in_ar</span> 2D Mode';
            vrButton.classList.remove('vr-active');
            this.showStatus('2D Mode: Standard flat image markup', 'success');
        }
    }

    // NEW: Detect 360° images
    checkIf360Image() {
        if (this.image.naturalWidth && this.image.naturalHeight) {
            const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
            this.is360Image = Math.abs(aspectRatio - 2.0) < 0.1; // Approximately 2:1 ratio
            
            if (this.is360Image) {
                this.showStatus('✅ 360° equirectangular image detected! Perfect for VR viewing.', 'success');
            } else {
                this.showStatus('⚠️ Image may not be 360°. For best VR results, use 2:1 aspect ratio equirectangular images.', 'warning');
            }
        }
    }

    // UPDATED: Handle image upload with 360° detection
    handleImageUpload(file) {
        if (!file) return;

        this.saveState();
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
            // Check if it's a 360 image after loading
            setTimeout(() => this.checkIf360Image(), 100);
            this.showStatus('Image loaded! Click on the image to add markers.', 'success');
        };
        reader.onerror = (e) => {
            this.showStatus('Error loading image', 'error');
        };
        reader.readAsDataURL(file);
    }

    // UPDATED: Add marker with VR support
    addMarker(event) {
        const rect = this.container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const markerType = document.getElementById('markerType').value;
        
        const marker = {
            id: Date.now().toString(),
            type: markerType,
            x: x,
            y: y,
            // NEW: 3D coordinates for VR
            phi: 0,   // Horizontal angle (0-360)
            theta: 0, // Vertical angle (-90 to 90)
            is3D: this.isVRMode, // Mark as 3D placement
            title: `Marker ${this.markers.length + 1}`,
            description: '',
            url: '',
            mediaUrl: '',
            color: this.currentMarkerColor,
            opacity: this.currentMarkerOpacity
        };

        // Convert 2D coordinates to 3D spherical coordinates if in VR mode
        if (this.isVRMode) {
            this.convertToSpherical(marker, x, y);
        }

        this.saveState();
        this.markers.push(marker);
        this.renderMarker(marker);
        this.selectMarker(marker.id, event.shiftKey);
        
        const modeText = this.isVRMode ? '3D VR' : '2D';
        this.showStatus(`Added ${markerType} marker in ${modeText} mode`, 'success');
        this.updateMarkerList();
    }

    // NEW: Convert 2D coordinates to 3D spherical coordinates
    convertToSpherical(marker, x, y) {
        // Convert percentage coordinates to spherical coordinates
        // x: 0-100% -> phi: 0-360 degrees (longitude)
        // y: 0-100% -> theta: -90 to 90 degrees (latitude)
        marker.phi = (x / 100) * 360; // 0-360 degrees
        marker.theta = ((y / 100) * 180) - 90; // -90 to 90 degrees
        
        // Store original 2D coordinates for backward compatibility
        marker.x = x;
        marker.y = y;
    }

    // UPDATED: Render marker with VR support
    renderMarker(marker) {
        let markerElement = this.container.querySelector(`[data-id="${marker.id}"]`);
        
        if (!markerElement) {
            markerElement = document.createElement('div');
            markerElement.className = `marker ${marker.type}`;
            markerElement.dataset.id = marker.id;
            this.container.appendChild(markerElement);
            this.makeMarkerDraggable(markerElement);
        }

        // Add VR hotspot class for 3D markers
        if (marker.is3D) {
            markerElement.classList.add('vr-hotspot');
        } else {
            markerElement.classList.remove('vr-hotspot');
        }

        markerElement.style.left = `${marker.x}%`;
        markerElement.style.top = `${marker.y}%`;
        markerElement.style.backgroundColor = marker.color;
        markerElement.style.opacity = marker.opacity || 0.8;

        if (this.selectedMarkers.has(marker.id)) {
            markerElement.classList.add('selected');
        } else {
            markerElement.classList.remove('selected');
        }
    }

    // NEW: Show export options (2D vs VR)
    showExportOptions() {
        if (this.markers.length === 0) {
            this.showStatus('Add at least one marker before exporting', 'error');
            return;
        }

        // Create export options modal
        const modal = document.createElement('div');
        modal.className = 'export-options';
        modal.innerHTML = `
            <h3>Export Options</h3>
            <div class="export-option" data-type="2d">
                <h4>📱 2D HTML Export</h4>
                <p>Standard web page with interactive markers</p>
            </div>
            <div class="export-option" data-type="vr">
                <h4>🥽 VR 360° Export</h4>
                <p>Immersive 360° experience with WebXR support</p>
            </div>
            <div class="property-actions">
                <button id="confirmExport" class="btn-primary">Export</button>
                <button id="cancelExport" class="btn-danger">Cancel</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        let selectedType = '2d';

        // Handle option selection
        modal.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedType = option.dataset.type;
            });
        });

        // Set default selection
        modal.querySelector('.export-option[data-type="2d"]').classList.add('selected');

        // Handle export confirmation
        modal.querySelector('#confirmExport').addEventListener('click', () => {
            modal.remove();
            if (selectedType === 'vr') {
                this.exportVRProject();
            } else {
                this.export2DProject();
            }
        });

        // Handle cancel
        modal.querySelector('#cancelExport').addEventListener('click', () => {
            modal.remove();
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // UPDATED: Renamed from exportProject to export2DProject
    export2DProject() {
        const projectData = this.getProjectData();
        const htmlContent = this.generateStandaloneHTML(projectData);
        
        HTMLExporter.download(htmlContent, 'interactive-image-2d.html');
        this.showStatus('2D HTML file downloaded successfully!', 'success');
    }

    // NEW: Export VR 360° project
    exportVRProject() {
        const projectData = this.getProjectData();
        const htmlContent = this.generateVRHTML(projectData);
        
        HTMLExporter.download(htmlContent, 'interactive-image-vr.html');
        this.showStatus('VR 360° HTML file downloaded successfully! Open in browser and use VR headset!', 'success');
    }

    // NEW: Generate VR 360° HTML with A-Frame
    generateVRHTML(projectData) {
        const markers = projectData.markers.filter(marker => marker.is3D);
        
        const markersHTML = markers.map(marker => {
            const mediaInfo = marker.mediaUrl ? MediaURLHandler.getMediaType(marker.mediaUrl) : null;
            
            return `
            <a-entity class="vr-marker" 
                data-marker='${JSON.stringify(marker).replace(/'/g, "&apos;")}'
                position="${this.sphericalToCartesian(marker.phi, marker.theta, 1.5)}"
                animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate">
                
                <a-sphere 
                    class="hotspot"
                    radius="0.1" 
                    color="${marker.color}"
                    opacity="${marker.opacity || 0.8}"
                    animation="property: scale; to: 1.5 1.5 1.5; dur: 2000; easing: easeInOutQuad; loop: true; dir: alternate">
                </a-sphere>
                
                <a-text 
                    value="${marker.title}" 
                    position="0 0.3 0" 
                    align="center" 
                    color="white"
                    scale="0.8 0.8 0.8">
                </a-text>
            </a-entity>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>360° VR Experience</title>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
    <style>
        body { margin: 0; overflow: hidden; }
        .info-panel {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            z-index: 1000;
            display: none;
        }
        .close-btn {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        .media-container {
            margin-top: 15px;
        }
        .vr-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 10px 20px;
            border-radius: 25px;
            z-index: 1000;
        }
        .vr-controls button {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            margin: 0 5px;
        }
    </style>
</head>
<body>
    <a-scene embedded vr-mode-ui="enabled: true" xr-mode-ui="enabled: true">
        <!-- 360° Image -->
        <a-sky src="${projectData.imageSrc}" rotation="0 -90 0"></a-sky>
        
        <!-- Markers -->
        ${markersHTML}
        
        <!-- Camera -->
        <a-entity camera look-controls wasd-controls position="0 0 0">
            <a-entity laser-controls hand="right"></a-entity>
            <a-entity laser-controls hand="left"></a-entity>
        </a-entity>
    </a-scene>

    <!-- Info Panel -->
    <div class="info-panel" id="infoPanel">
        <button class="close-btn" onclick="closeInfoPanel()">&times;</button>
        <h3 id="panelTitle"></h3>
        <p id="panelDescription"></p>
        <a id="panelLink" target="_blank" style="display: none;">Visit Link</a>
        <div class="media-container" id="panelMedia"></div>
    </div>

    <!-- VR Controls -->
    <div class="vr-controls">
        <button onclick="enterVR()">🎮 Enter VR</button>
        <button onclick="resetView()">🔄 Reset View</button>
        <button onclick="showAllMarkers()">📍 Show Markers</button>
    </div>

    <script>
        // Marker interaction
        document.querySelectorAll('.vr-marker').forEach(marker => {
            marker.addEventListener('click', function() {
                const markerData = JSON.parse(this.getAttribute('data-marker'));
                showMarkerInfo(markerData);
            });
        });

        function showMarkerInfo(marker) {
            document.getElementById('panelTitle').textContent = marker.title;
            document.getElementById('panelDescription').textContent = marker.description || '';
            
            const linkElement = document.getElementById('panelLink');
            if (marker.url) {
                linkElement.href = marker.url;
                linkElement.textContent = 'Visit Link';
                linkElement.style.display = 'inline-block';
            } else {
                linkElement.style.display = 'none';
            }
            
            const mediaElement = document.getElementById('panelMedia');
            mediaElement.innerHTML = '';
            
            if (marker.mediaUrl) {
                mediaElement.innerHTML = getMediaEmbed(marker.mediaUrl);
            }
            
            document.getElementById('infoPanel').style.display = 'block';
        }

        function closeInfoPanel() {
            document.getElementById('infoPanel').style.display = 'none';
        }

        function enterVR() {
            const scene = document.querySelector('a-scene');
            if (scene.hasAttribute('vr-mode-ui')) {
                scene.enterVR();
            }
        }

        function resetView() {
            const camera = document.querySelector('[camera]');
            camera.setAttribute('rotation', '0 0 0');
        }

        function showAllMarkers() {
            document.querySelectorAll('.vr-marker').forEach(marker => {
                marker.setAttribute('visible', 'true');
            });
        }

        function getMediaEmbed(url) {
            // Simplified media embedding for VR
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = extractYouTubeId(url);
                if (videoId) {
                    return '<div style="margin-top: 10px;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe></div>';
                }
            }
            if (url.includes('vimeo.com')) {
                const videoId = extractVimeoId(url);
                if (videoId) {
                    return '<div style="margin-top: 10px;"><iframe width="100%" height="200" src="https://player.vimeo.com/video/' + videoId + '" frameborder="0" allowfullscreen></iframe></div>';
                }
            }
            if (url.match(/\\.(mp3|wav|ogg|m4a)(\\?.*)?$/i)) {
                return '<audio controls style="width: 100%; margin-top: 10px;"><source src="' + url + '"></audio>';
            }
            return '<a href="' + url + '" target="_blank" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Open Media</a>';
        }

        function extractYouTubeId(url) {
            const patterns = [
                /(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([^&\\n?#]+)/,
                /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/embed\\/([^&\\n?#]+)/
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) return match[1].split('?')[0];
            }
            return null;
        }

        function extractVimeoId(url) {
            const match = url.match(/(?:https?:\\/\\/)?(?:www\\.)?vimeo\\.com\\/([0-9]+)/);
            return match ? match[1] : null;
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!document.getElementById('infoPanel').contains(e.target) && 
                !e.target.closest('.vr-marker')) {
                closeInfoPanel();
            }
        });
    </script>
</body>
</html>`;
    }

    // NEW: Convert spherical to Cartesian coordinates for A-Frame
    sphericalToCartesian(phi, theta, radius) {
        const phiRad = (phi * Math.PI) / 180;
        const thetaRad = (theta * Math.PI) / 180;
        
        const x = -radius * Math.sin(phiRad) * Math.cos(thetaRad);
        const y = radius * Math.sin(thetaRad);
        const z = -radius * Math.cos(phiRad) * Math.cos(thetaRad);
        
        return `${x} ${y} ${z}`;
    }

    // ... (keep all other existing methods exactly as they were) ...

    // UPDATED: Generate standalone HTML (keep existing 2D version)
    generateStandaloneHTML(projectData) {
        const markersHTML = projectData.markers.map(marker => {
            let markerData = marker;
            // Ensure mediaType is included for backward compatibility
            if (marker.mediaUrl && !marker.mediaType) {
                const mediaInfo = MediaURLHandler.getMediaType(marker.mediaUrl);
                markerData = { ...marker, mediaType: mediaInfo.type };
            }
            return `<div class="marker ${marker.type}" 
                 style="left: ${marker.x}%; top: ${marker.y}%; 
                        background-color: ${marker.color || this.getDefaultColor(marker.type)};
                        opacity: ${marker.opacity || 0.8};"
                 data-marker='${JSON.stringify(markerData).replace(/'/g, "&apos;")}'>
             </div>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Image with Markers</title>
    <style>
        ${this.getEnhancedStyles()}
    </style>
</head>
<body>
    <div class="viewer-container">
        <div class="image-container">
            <img id="mainImage" src="${projectData.imageSrc}" alt="Interactive Image">
            ${markersHTML}
        </div>
    </div>

    <div class="popup" id="popup">
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()">&times;</button>
            <h3 id="popupTitle"></h3>
            <p id="popupDescription"></p>
            <a id="popupLink" target="_blank" style="display: none;">Visit Link</a>
            <div id="popupMedia"></div>
        </div>
    </div>

    <script>
        ${this.getEnhancedMediaScript()}
    </script>
</body>
</html>`;
    }

    // ... (keep all other methods exactly as they were in your original code) ...
}

document.addEventListener('DOMContentLoaded', () => {
    new EnhancedImageMarkerEditor();
});

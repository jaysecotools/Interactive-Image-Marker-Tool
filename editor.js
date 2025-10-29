<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>360° Image Marker Editor</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        :root {
            --primary-color: #6366f1;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --bg-primary: #1a1a1a;
            --bg-secondary: #2d2d2d;
            --bg-tertiary: #3d3d3d;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --text-muted: #666666;
            --border-color: #404040;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }

        .app-container {
            display: flex;
            min-height: 100vh;
        }

        .sidebar {
            width: 350px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
        }

        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .sidebar-section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .toolbar {
            background: var(--bg-secondary);
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .editor-area {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: var(--bg-primary);
        }

        .btn {
            background: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }

        .btn:hover {
            background: var(--primary-color);
            border-color: var(--primary-color);
        }

        .btn-primary {
            background: var(--primary-color);
            border-color: var(--primary-color);
        }

        .btn-success {
            background: var(--success-color);
            border-color: var(--success-color);
        }

        .btn-danger {
            background: var(--danger-color);
            border-color: var(--danger-color);
        }

        .image-container {
            position: relative;
            display: inline-block;
            max-width: 100%;
            max-height: 100%;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        #mainImage {
            max-width: 100%;
            max-height: 80vh;
            display: none;
        }

        .placeholder {
            padding: 60px 40px;
            text-align: center;
            color: var(--text-muted);
        }

        .placeholder .material-icons {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .marker {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
        }

        .marker:hover {
            transform: translate(-50%, -50%) scale(1.4);
            z-index: 100;
        }

        .marker.selected {
            border-color: #ffd700;
            box-shadow: 0 0 0 2px #ffd700, 0 2px 8px rgba(0,0,0,0.3);
        }

        .marker.dragging {
            z-index: 1000;
            cursor: grabbing;
        }

        .marker.info::after { content: 'i'; }
        .marker.link::after { content: '🔗'; font-size: 8px; }
        .marker.audio::after { content: '♪'; font-size: 8px; }
        .marker.video::after { content: '▶'; font-size: 8px; }

        .marker.vr-hotspot::before {
            content: '';
            position: absolute;
            width: 30px;
            height: 30px;
            border: 2px solid #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            color: var(--text-secondary);
        }

        input, select, textarea {
            width: 100%;
            padding: 10px 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            color: var(--text-primary);
            font-size: 14px;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        .color-input {
            height: 40px;
            padding: 4px;
        }

        .status {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            display: none;
        }

        .status.success {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success-color);
            color: var(--success-color);
        }

        .status.error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger-color);
            color: var(--danger-color);
        }

        .status.warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid var(--warning-color);
            color: var(--warning-color);
        }

        .marker-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            border-radius: 6px;
        }

        .marker-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .marker-item:hover {
            background: var(--bg-tertiary);
        }

        .marker-item.selected {
            background: rgba(99, 102, 241, 0.1);
            border-left: 3px solid var(--primary-color);
        }

        .marker-icon {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 12px;
            border: 2px solid white;
        }

        .marker-info {
            flex: 1;
        }

        .marker-title {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .marker-type {
            font-size: 12px;
            color: var(--text-muted);
        }

        .bulk-actions {
            background: var(--bg-tertiary);
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            display: none;
        }

        .image-type-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10;
            display: none;
        }

        .image-type-indicator.vr-360 {
            background: rgba(99, 102, 241, 0.2);
            color: var(--primary-color);
            border: 1px solid var(--primary-color);
        }

        .image-type-indicator.standard {
            background: rgba(160, 160, 160, 0.2);
            color: var(--text-secondary);
            border: 1px solid var(--text-secondary);
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: var(--bg-secondary);
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }

        .export-options {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin: 20px 0;
        }

        .export-option {
            background: var(--bg-tertiary);
            padding: 20px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .export-option:hover {
            border-color: var(--primary-color);
        }

        .export-option.selected {
            border-color: var(--primary-color);
            background: rgba(99, 102, 241, 0.1);
        }

        .context-menu {
            position: fixed;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 8px 0;
            z-index: 1000;
            display: none;
            min-width: 160px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .context-item {
            padding: 10px 16px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s ease;
        }

        .context-item:hover {
            background: var(--bg-tertiary);
        }

        .preview {
            background: var(--bg-tertiary);
            padding: 12px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 14px;
            display: none;
        }

        .vr-active {
            background: var(--success-color) !important;
            border-color: var(--success-color) !important;
        }

        .hidden {
            display: none !important;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>360° Marker Editor</h2>
                <div class="status" id="status"></div>
            </div>
            
            <div class="sidebar-content">
                <div class="sidebar-section">
                    <h3 class="section-title">Image</h3>
                    <input type="file" id="imageUpload" accept="image/*" class="btn">
                    <div class="image-type-indicator" id="imageTypeIndicator"></div>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Marker Tools</h3>
                    <div class="form-group">
                        <label for="markerType">Marker Type</label>
                        <select id="markerType">
                            <option value="info">Info</option>
                            <option value="link">Link</option>
                            <option value="audio">Audio</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="markerColor">Default Color</label>
                        <input type="color" id="markerColor" value="#6366f1" class="color-input">
                    </div>
                    <button class="btn btn-primary" id="vrModeBtn">
                        <span class="material-icons">view_in_ar</span> 2D Mode
                    </button>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Marker Properties</h3>
                    <div id="markerProperties" style="display: none;">
                        <div class="form-group">
                            <label for="markerTitle">Title</label>
                            <input type="text" id="markerTitle" placeholder="Enter marker title">
                        </div>
                        <div class="form-group">
                            <label for="markerDescription">Description</label>
                            <textarea id="markerDescription" placeholder="Enter marker description"></textarea>
                        </div>
                        
                        <div class="form-group" id="linkUrlGroup" style="display: none;">
                            <label for="markerUrl">Link URL</label>
                            <input type="url" id="markerUrl" placeholder="https://example.com">
                        </div>
                        
                        <div class="form-group" id="mediaUrlGroup" style="display: none;">
                            <label for="markerMediaUrl">Media URL</label>
                            <input type="url" id="markerMediaUrl" placeholder="YouTube, Vimeo, SoundCloud, or direct MP4/MP3 links...">
                        </div>

                        <div class="form-group">
                            <button class="btn btn-success" id="saveMarker">
                                <span class="material-icons">save</span> Save Properties
                            </button>
                            <button class="btn btn-danger" id="deleteMarker">
                                <span class="material-icons">delete</span> Delete Marker
                            </button>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Markers</h3>
                    <div class="form-group">
                        <input type="text" id="searchMarkers" placeholder="Search markers...">
                    </div>
                    <div class="marker-list" id="markerList">
                        <div class="no-markers">No markers yet. Click on the image to add markers.</div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Actions</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn" id="exportBtn">
                            <span class="material-icons">download</span> Export Project
                        </button>
                        <button class="btn" id="clearMarkers">
                            <span class="material-icons">clear_all</span> Clear All Markers
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="toolbar">
                <div class="section-title">Editor</div>
            </div>
            <div class="editor-area">
                <div class="image-container" id="imageContainer">
                    <img id="mainImage" alt="360° Image">
                    <div class="placeholder">
                        <span class="material-icons">add_photo_alternate</span>
                        <p>Upload a 360° image to get started</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="exportModal">
        <div class="modal-content">
            <h3 style="margin-bottom: 20px;">Export Project</h3>
            <div class="export-options">
                <div class="export-option" data-type="2d">
                    <h4>📱 2D Interactive HTML</h4>
                    <p>Standard web page with clickable markers</p>
                </div>
                <div class="export-option" data-type="vr">
                    <h4>🌐 VR 360° HTML</h4>
                    <p>Immersive 360° experience for VR headsets</p>
                </div>
                <div class="export-option" data-type="json">
                    <h4>💾 JSON Project File</h4>
                    <p>Backup file to import later</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" id="confirmExport">Export</button>
                <button class="btn" id="cancelExport">Cancel</button>
            </div>
        </div>
    </div>

    <script>
        class EnhancedImageMarkerEditor {
            constructor() {
                this.image = document.getElementById('mainImage');
                this.container = document.getElementById('imageContainer');
                this.markers = [];
                this.selectedMarker = null;
                this.isVRMode = false;
                this.is360Image = false;
                this.currentMarkerColor = '#6366f1';
                
                this.initializeEventListeners();
                this.showStatus('Ready to upload image and add markers', 'success');
            }

            initializeEventListeners() {
                // File upload
                document.getElementById('imageUpload').addEventListener('change', (e) => {
                    this.handleImageUpload(e.target.files[0]);
                });

                // Marker type change
                document.getElementById('markerType').addEventListener('change', (e) => {
                    this.togglePropertyFields(e.target.value);
                });

                // Color change
                document.getElementById('markerColor').addEventListener('change', (e) => {
                    this.currentMarkerColor = e.target.value;
                });

                // VR mode toggle
                document.getElementById('vrModeBtn').addEventListener('click', () => {
                    this.toggleVRMode();
                });

                // Image click for adding markers
                this.container.addEventListener('click', (e) => {
                    if (this.image.style.display !== 'none') {
                        this.addMarker(e);
                    }
                });

                // Save marker
                document.getElementById('saveMarker').addEventListener('click', () => {
                    this.saveMarkerProperties();
                });

                // Delete marker
                document.getElementById('deleteMarker').addEventListener('click', () => {
                    this.deleteSelectedMarker();
                });

                // Clear markers
                document.getElementById('clearMarkers').addEventListener('click', () => {
                    this.clearMarkers();
                });

                // Export
                document.getElementById('exportBtn').addEventListener('click', () => {
                    this.showExportOptions();
                });

                // Export modal
                document.getElementById('confirmExport').addEventListener('click', () => {
                    this.handleExportConfirm();
                });

                document.getElementById('cancelExport').addEventListener('click', () => {
                    this.hideExportModal();
                });

                // Search
                document.getElementById('searchMarkers').addEventListener('input', (e) => {
                    this.filterMarkers(e.target.value);
                });

                // Close modal when clicking outside
                document.getElementById('exportModal').addEventListener('click', (e) => {
                    if (e.target.id === 'exportModal') {
                        this.hideExportModal();
                    }
                });
            }

            handleImageUpload(file) {
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    this.showStatus('Please upload a valid image file', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    this.loadImage(e.target.result);
                    setTimeout(() => this.checkIf360Image(), 100);
                    this.showStatus('Image loaded! Click on the image to add markers.', 'success');
                };
                reader.onerror = () => {
                    this.showStatus('Error loading image', 'error');
                };
                reader.readAsDataURL(file);
            }

            loadImage(src) {
                this.image.src = src;
                this.image.style.display = 'block';
                this.container.querySelector('.placeholder').style.display = 'none';
                this.clearMarkers();
            }

            checkIf360Image() {
                if (this.image.naturalWidth && this.image.naturalHeight) {
                    const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
                    this.is360Image = Math.abs(aspectRatio - 2.0) < 0.2;
                    
                    const indicator = document.getElementById('imageTypeIndicator');
                    if (this.is360Image) {
                        indicator.textContent = '🌐 360° Image';
                        indicator.className = 'image-type-indicator vr-360';
                        indicator.style.display = 'block';
                    } else {
                        indicator.textContent = '📷 Standard Image';
                        indicator.className = 'image-type-indicator standard';
                        indicator.style.display = 'block';
                    }
                }
            }

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
                    this.showStatus('VR Mode: Markers will be placed in 3D space', 'success');
                } else {
                    vrButton.innerHTML = '<span class="material-icons">view_in_ar</span> 2D Mode';
                    vrButton.classList.remove('vr-active');
                    this.showStatus('2D Mode: Standard flat image markup', 'success');
                }
            }

            addMarker(event) {
                const rect = this.container.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;

                const markerType = document.getElementById('markerType').value;
                
                const marker = {
                    id: Date.now().toString(),
                    type: markerType,
                    x: Math.max(0, Math.min(100, x)),
                    y: Math.max(0, Math.min(100, y)),
                    phi: this.convertXToPhi(x),
                    theta: this.convertYToTheta(y),
                    is3D: this.isVRMode,
                    title: `Marker ${this.markers.length + 1}`,
                    description: '',
                    url: '',
                    mediaUrl: '',
                    color: this.currentMarkerColor,
                    opacity: 0.8
                };

                this.markers.push(marker);
                this.renderMarker(marker);
                this.selectMarker(marker.id);
                
                const modeText = this.isVRMode ? '3D VR' : '2D';
                this.showStatus(`Added ${markerType} marker in ${modeText} mode`, 'success');
                this.updateMarkerList();
            }

            convertXToPhi(x) {
                return (x / 100) * 360;
            }

            convertYToTheta(y) {
                return ((y / 100) * 180) - 90;
            }

            renderMarker(marker) {
                let markerElement = document.querySelector(`[data-id="${marker.id}"]`);
                
                if (!markerElement) {
                    markerElement = document.createElement('div');
                    markerElement.className = `marker ${marker.type}`;
                    markerElement.dataset.id = marker.id;
                    this.container.appendChild(markerElement);

                    markerElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectMarker(marker.id);
                    });

                    // Make draggable
                    this.makeMarkerDraggable(markerElement);
                }

                if (marker.is3D) {
                    markerElement.classList.add('vr-hotspot');
                } else {
                    markerElement.classList.remove('vr-hotspot');
                }

                markerElement.style.left = `${marker.x}%`;
                markerElement.style.top = `${marker.y}%`;
                markerElement.style.backgroundColor = marker.color;
                markerElement.style.opacity = marker.opacity;

                if (this.selectedMarker === marker.id) {
                    markerElement.classList.add('selected');
                } else {
                    markerElement.classList.remove('selected');
                }
            }

            makeMarkerDraggable(markerElement) {
                let isDragging = false;
                let startX, startY, startMarkerX, startMarkerY;

                markerElement.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    isDragging = true;
                    const markerId = markerElement.dataset.id;
                    const marker = this.markers.find(m => m.id === markerId);
                    
                    if (marker) {
                        startX = e.clientX;
                        startY = e.clientY;
                        startMarkerX = marker.x;
                        startMarkerY = marker.y;
                        markerElement.classList.add('dragging');
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;

                    const markerId = markerElement.dataset.id;
                    const marker = this.markers.find(m => m.id === markerId);
                    if (!marker) return;

                    const rect = this.container.getBoundingClientRect();
                    const deltaX = ((e.clientX - startX) / rect.width) * 100;
                    const deltaY = ((e.clientY - startY) / rect.height) * 100;

                    marker.x = Math.max(0, Math.min(100, startMarkerX + deltaX));
                    marker.y = Math.max(0, Math.min(100, startMarkerY + deltaY));

                    if (marker.is3D) {
                        marker.phi = this.convertXToPhi(marker.x);
                        marker.theta = this.convertYToTheta(marker.y);
                    }

                    this.renderMarker(marker);
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        markerElement.classList.remove('dragging');
                    }
                });
            }

            selectMarker(markerId) {
                this.selectedMarker = markerId;
                this.updateMarkerSelection();
                this.showMarkerProperties();
            }

            updateMarkerSelection() {
                document.querySelectorAll('.marker').forEach(markerEl => {
                    if (markerEl.dataset.id === this.selectedMarker) {
                        markerEl.classList.add('selected');
                    } else {
                        markerEl.classList.remove('selected');
                    }
                });
                this.updateMarkerList();
            }

            showMarkerProperties() {
                const marker = this.markers.find(m => m.id === this.selectedMarker);
                if (!marker) return;

                const propsPanel = document.getElementById('markerProperties');
                propsPanel.style.display = 'block';

                document.getElementById('markerTitle').value = marker.title;
                document.getElementById('markerDescription').value = marker.description;
                document.getElementById('markerUrl').value = marker.url;
                document.getElementById('markerMediaUrl').value = marker.mediaUrl;

                this.togglePropertyFields(marker.type);
            }

            togglePropertyFields(markerType) {
                const linkUrlGroup = document.getElementById('linkUrlGroup');
                const mediaUrlGroup = document.getElementById('mediaUrlGroup');
                
                linkUrlGroup.style.display = markerType === 'link' ? 'block' : 'none';
                mediaUrlGroup.style.display = (markerType === 'audio' || markerType === 'video') ? 'block' : 'none';
            }

            saveMarkerProperties() {
                if (!this.selectedMarker) return;

                const marker = this.markers.find(m => m.id === this.selectedMarker);
                if (marker) {
                    marker.title = document.getElementById('markerTitle').value;
                    marker.description = document.getElementById('markerDescription').value;
                    marker.url = document.getElementById('markerUrl').value;
                    marker.mediaUrl = document.getElementById('markerMediaUrl').value;
                    
                    this.renderMarker(marker);
                    this.updateMarkerList();
                    this.showStatus('Marker properties saved', 'success');
                }
            }

            deleteSelectedMarker() {
                if (!this.selectedMarker) return;

                if (!confirm('Delete this marker?')) return;

                this.markers = this.markers.filter(m => m.id !== this.selectedMarker);
                const markerElement = document.querySelector(`[data-id="${this.selectedMarker}"]`);
                if (markerElement) {
                    markerElement.remove();
                }
                
                this.selectedMarker = null;
                document.getElementById('markerProperties').style.display = 'none';
                this.showStatus('Marker deleted', 'success');
                this.updateMarkerList();
            }

            clearMarkers() {
                if (this.markers.length === 0) return;
                
                if (!confirm('Clear all markers?')) return;

                this.markers = [];
                this.selectedMarker = null;
                document.querySelectorAll('.marker').forEach(marker => marker.remove());
                document.getElementById('markerProperties').style.display = 'none';
                this.showStatus('All markers cleared', 'success');
                this.updateMarkerList();
            }

            updateMarkerList() {
                const markerList = document.getElementById('markerList');
                const searchTerm = document.getElementById('searchMarkers').value.toLowerCase();
                
                if (this.markers.length === 0) {
                    markerList.innerHTML = '<div class="no-markers">No markers yet. Click on the image to add markers.</div>';
                    return;
                }

                const filteredMarkers = this.markers.filter(marker => 
                    marker.title.toLowerCase().includes(searchTerm) ||
                    marker.description.toLowerCase().includes(searchTerm) ||
                    marker.type.toLowerCase().includes(searchTerm)
                );

                if (filteredMarkers.length === 0) {
                    markerList.innerHTML = '<div class="no-markers">No markers match your search.</div>';
                    return;
                }

                markerList.innerHTML = filteredMarkers.map(marker => `
                    <div class="marker-item ${this.selectedMarker === marker.id ? 'selected' : ''}" 
                         data-id="${marker.id}">
                        <div class="marker-icon" style="background-color: ${marker.color}"></div>
                        <div class="marker-info">
                            <div class="marker-title">${marker.title}</div>
                            <div class="marker-type">${marker.type} ${marker.is3D ? '(VR)' : ''}</div>
                        </div>
                    </div>
                `).join('');

                markerList.querySelectorAll('.marker-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.selectMarker(item.dataset.id);
                    });
                });
            }

            filterMarkers(searchTerm) {
                this.updateMarkerList();
            }

            showExportOptions() {
                if (this.markers.length === 0) {
                    this.showStatus('Add at least one marker before exporting', 'error');
                    return;
                }

                const modal = document.getElementById('exportModal');
                modal.style.display = 'flex';

                // Auto-select based on content
                const has3DMarkers = this.markers.some(marker => marker.is3D);
                if ((this.isVRMode || has3DMarkers) && this.is360Image) {
                    modal.querySelector('.export-option[data-type="vr"]').classList.add('selected');
                } else {
                    modal.querySelector('.export-option[data-type="2d"]').classList.add('selected');
                }

                modal.querySelectorAll('.export-option').forEach(option => {
                    option.onclick = () => {
                        modal.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                    };
                });
            }

            hideExportModal() {
                document.getElementById('exportModal').style.display = 'none';
            }

            handleExportConfirm() {
                const selectedOption = document.querySelector('.export-option.selected');
                if (!selectedOption) {
                    this.showStatus('Please select an export option', 'warning');
                    return;
                }

                const exportType = selectedOption.dataset.type;
                this.hideExportModal();

                if (exportType === 'vr') {
                    this.exportVRProject();
                } else if (exportType === 'json') {
                    this.exportJSONProject();
                } else {
                    this.export2DProject();
                }
            }

            export2DProject() {
                const projectData = this.getProjectData();
                const htmlContent = this.generateStandaloneHTML(projectData);
                this.downloadFile(htmlContent, 'interactive-image-2d.html', 'text/html');
                this.showStatus('2D HTML file downloaded successfully!', 'success');
            }

            exportVRProject() {
                const projectData = this.getProjectData();
                const htmlContent = this.generateVRHTML(projectData);
                this.downloadFile(htmlContent, 'interactive-image-vr.html', 'text/html');
                this.showStatus('VR 360° HTML file downloaded successfully!', 'success');
            }

            exportJSONProject() {
                const projectData = this.getProjectData();
                const dataStr = JSON.stringify(projectData, null, 2);
                this.downloadFile(dataStr, 'interactive-image-project.json', 'application/json');
                this.showStatus('Project backup saved as JSON!', 'success');
            }

            getProjectData() {
                return {
                    imageSrc: this.image.src,
                    markers: this.markers,
                    version: '2.1',
                    exportDate: new Date().toISOString(),
                    totalMarkers: this.markers.length,
                    hasVRMarkers: this.markers.some(m => m.is3D)
                };
            }

            downloadFile(content, filename, type) {
                const blob = new Blob([content], { type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            generateStandaloneHTML(projectData) {
                const markersHTML = projectData.markers.map(marker => {
                    const escapedData = JSON.stringify(marker).replace(/'/g, "&apos;");
                    return `<div class="marker ${marker.type}" 
                         style="left: ${marker.x}%; top: ${marker.y}%; 
                                background-color: ${marker.color};
                                opacity: ${marker.opacity};"
                         data-marker='${escapedData}'
                         onclick="showMarkerInfo(this)"
                         title="${marker.title}">
                     </div>`;
                }).join('');

                return `<!DOCTYPE html>
<html>
<head>
    <title>Interactive Image</title>
    <style>
        body { margin: 0; padding: 20px; background: #1a1a1a; color: white; font-family: Arial; }
        .image-container { position: relative; display: inline-block; }
        #mainImage { max-width: 100%; max-height: 90vh; }
        .marker { 
            position: absolute; width: 20px; height: 20px; border: 2px solid white; 
            border-radius: 50%; cursor: pointer; transform: translate(-50%, -50%);
        }
        .popup { 
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); justify-content: center; align-items: center; 
        }
        .popup-content { background: white; padding: 20px; border-radius: 8px; color: black; }
    </style>
</head>
<body>
    <div class="image-container">
        <img id="mainImage" src="${projectData.imageSrc}">
        ${markersHTML}
    </div>
    <div class="popup" id="popup">
        <div class="popup-content">
            <h3 id="popupTitle"></h3>
            <p id="popupDescription"></p>
            <button onclick="closePopup()">Close</button>
        </div>
    </div>
    <script>
        function showMarkerInfo(element) {
            const marker = JSON.parse(element.getAttribute('data-marker'));
            document.getElementById('popupTitle').textContent = marker.title;
            document.getElementById('popupDescription').textContent = marker.description;
            document.getElementById('popup').style.display = 'flex';
        }
        function closePopup() {
            document.getElementById('popup').style.display = 'none';
        }
    </script>
</body>
</html>`;
            }

            generateVRHTML(projectData) {
                return `<!DOCTYPE html>
<html>
<head>
    <title>VR 360° Experience</title>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
</head>
<body>
    <a-scene>
        <a-sky src="${projectData.imageSrc}"></a-sky>
        ${projectData.markers.filter(m => m.is3D).map(marker => `
            <a-entity position="${this.sphericalToCartesian(marker.phi, marker.theta, 5)}">
                <a-sphere radius="0.2" color="${marker.color}"></a-sphere>
                <a-text value="${marker.title}" position="0 0.5 0" color="white"></a-text>
            </a-entity>
        `).join('')}
        <a-camera position="0 0 0"></a-camera>
    </a-scene>
</body>
</html>`;
            }

            sphericalToCartesian(phi, theta, radius = 5) {
                const phiRad = (phi * Math.PI) / 180;
                const thetaRad = (theta * Math.PI) / 180;
                const x = radius * Math.sin(thetaRad) * Math.cos(phiRad);
                const y = radius * Math.cos(thetaRad);
                const z = radius * Math.sin(thetaRad) * Math.sin(phiRad);
                return `${x} ${y} ${z}`;
            }

            showStatus(message, type) {
                const statusEl = document.getElementById('status');
                statusEl.textContent = message;
                statusEl.className = `status ${type}`;
                statusEl.style.display = 'block';
                
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 4000);
            }
        }

        // Initialize the editor
        document.addEventListener('DOMContentLoaded', () => {
            new EnhancedImageMarkerEditor();
        });
    </script>
</body>
</html>

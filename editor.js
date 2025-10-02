class EnhancedImageMarkerEditor {
    constructor() {
        this.image = document.getElementById('mainImage');
        this.container = document.getElementById('imageContainer');
        this.markers = [];
        this.selectedMarkers = new Set();
        this.undoStack = [];
        this.redoStack = [];
        this.dragState = null;
        this.currentMarkerColor = '#007bff';
        
        console.log('Editor initializing...');
        console.log('Image element:', this.image);
        console.log('Container element:', this.container);
        
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            console.log('File selected:', e.target.files[0]);
            if (e.target.files && e.target.files[0]) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        // Marker type
        document.getElementById('markerType').addEventListener('change', (e) => {
            this.togglePropertyFields(e.target.value);
        });

        // Marker color
        document.getElementById('markerColor').addEventListener('change', (e) => {
            this.currentMarkerColor = e.target.value;
        });

        // Image container click for adding markers - FIXED
        this.container.addEventListener('click', (e) => {
            console.log('Container clicked', e.target, this.image.style.display);
            if (this.image.style.display !== 'none' && this.image.src) {
                // Only add marker if clicking on the image or container, not on existing markers
                if (e.target === this.image || e.target === this.container) {
                    this.addMarker(e);
                }
            }
        });

        // Marker property buttons
        document.getElementById('saveMarker').addEventListener('click', () => {
            this.saveMarkerProperties();
        });

        document.getElementById('deleteMarker').addEventListener('click', () => {
            this.deleteSelectedMarkers();
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportProject();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.importProject();
        });

        // Clear markers
        document.getElementById('clearMarkers').addEventListener('click', () => {
            this.clearMarkers();
        });

        // Undo/Redo
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        // Search
        document.getElementById('searchMarkers').addEventListener('input', (e) => {
            this.filterMarkers(e.target.value);
        });

        console.log('Event listeners initialized');
    }

    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showStatus('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('Image loaded successfully');
            this.loadImage(e.target.result);
            this.showStatus('Image loaded! Click on the image to add markers.', 'success');
        };
        reader.onerror = () => {
            this.showStatus('Error loading image', 'error');
        };
        reader.readAsDataURL(file);
    }

    loadImage(src) {
        console.log('Loading image from source');
        this.image.onload = () => {
            console.log('Image onload fired');
            this.image.style.display = 'block';
            const placeholder = this.container.querySelector('.placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            this.clearMarkers();
            // Make sure container has proper cursor
            this.container.style.cursor = 'crosshair';
        };
        
        this.image.onerror = () => {
            console.error('Image failed to load');
            this.showStatus('Error displaying image', 'error');
        };
        
        this.image.src = src;
        console.log('Image src set');
    }

    addMarker(event) {
        console.log('Adding marker at:', event.clientX, event.clientY);
        
        const rect = this.container.getBoundingClientRect();
        console.log('Container rect:', rect);
        
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        console.log('Marker position (%):', x, y);

        const markerType = document.getElementById('markerType').value;
        
        const marker = {
            id: Date.now().toString(),
            type: markerType,
            x: x,
            y: y,
            title: `Marker ${this.markers.length + 1}`,
            description: '',
            url: '',
            mediaUrl: '',
            color: this.currentMarkerColor
        };

        console.log('New marker:', marker);
        
        this.saveState();
        this.markers.push(marker);
        this.renderMarker(marker);
        this.selectMarker(marker.id, false);
        
        this.showStatus(`Added ${markerType} marker at ${x.toFixed(1)}%, ${y.toFixed(1)}%`, 'success');
        this.updateMarkerList();
    }

    renderMarker(marker) {
        console.log('Rendering marker:', marker);
        
        const markerElement = document.createElement('div');
        markerElement.className = `marker ${marker.type}`;
        markerElement.style.left = `${marker.x}%`;
        markerElement.style.top = `${marker.y}%`;
        markerElement.style.backgroundColor = marker.color;
        markerElement.dataset.id = marker.id;

        // Click to select
        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectMarker(marker.id, e.shiftKey);
        });

        // Double-click to edit
        markerElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.selectMarker(marker.id, false);
            this.showMarkerProperties();
        });

        // Make draggable
        this.makeMarkerDraggable(markerElement);

        this.container.appendChild(markerElement);
        console.log('Marker rendered');
    }

    makeMarkerDraggable(markerElement) {
        markerElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(markerElement, e);
        });
    }

    startDrag(markerElement, event) {
        const markerId = markerElement.dataset.id;
        const marker = this.markers.find(m => m.id === markerId);
        
        if (!marker) return;

        this.dragState = {
            markerId: markerId,
            startX: event.clientX,
            startY: event.clientY,
            startMarkerX: marker.x,
            startMarkerY: marker.y
        };

        markerElement.classList.add('dragging');

        const onMouseMove = (e) => {
            if (!this.dragState) return;

            const rect = this.container.getBoundingClientRect();
            const deltaX = ((e.clientX - this.dragState.startX) / rect.width) * 100;
            const deltaY = ((e.clientY - this.dragState.startY) / rect.height) * 100;

            marker.x = Math.max(0, Math.min(100, this.dragState.startMarkerX + deltaX));
            marker.y = Math.max(0, Math.min(100, this.dragState.startMarkerY + deltaY));

            markerElement.style.left = `${marker.x}%`;
            markerElement.style.top = `${marker.y}%`;
        };

        const onMouseUp = () => {
            if (this.dragState) {
                this.saveState();
                markerElement.classList.remove('dragging');
                this.dragState = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    selectMarker(markerId, multiSelect = false) {
        if (!multiSelect) {
            this.selectedMarkers.clear();
        }

        if (this.selectedMarkers.has(markerId)) {
            this.selectedMarkers.delete(markerId);
        } else {
            this.selectedMarkers.add(markerId);
        }

        this.updateMarkerSelection();
        
        if (this.selectedMarkers.size === 1) {
            this.showMarkerProperties();
        } else {
            this.hideMarkerProperties();
        }
    }

    updateMarkerSelection() {
        // Update visual selection
        document.querySelectorAll('.marker').forEach(markerEl => {
            const markerId = markerEl.dataset.id;
            if (this.selectedMarkers.has(markerId)) {
                markerEl.classList.add('selected');
            } else {
                markerEl.classList.remove('selected');
            }
        });

        this.updateMarkerList();
    }

    showMarkerProperties() {
        if (this.selectedMarkers.size !== 1) return;

        const markerId = Array.from(this.selectedMarkers)[0];
        const marker = this.markers.find(m => m.id === markerId);
        if (!marker) return;

        document.getElementById('markerProperties').style.display = 'block';
        document.getElementById('markerTitle').value = marker.title || '';
        document.getElementById('markerDescription').value = marker.description || '';
        document.getElementById('markerUrl').value = marker.url || '';
        document.getElementById('markerMediaUrl').value = marker.mediaUrl || '';
        document.getElementById('markerCustomColor').value = marker.color || this.currentMarkerColor;

        this.togglePropertyFields(marker.type);
    }

    hideMarkerProperties() {
        document.getElementById('markerProperties').style.display = 'none';
    }

    saveMarkerProperties() {
        if (this.selectedMarkers.size === 0) return;

        this.saveState();

        const title = document.getElementById('markerTitle').value;
        const description = document.getElementById('markerDescription').value;
        const url = document.getElementById('markerUrl').value;
        const mediaUrl = document.getElementById('markerMediaUrl').value;
        const color = document.getElementById('markerCustomColor').value;

        this.selectedMarkers.forEach(markerId => {
            const marker = this.markers.find(m => m.id === markerId);
            if (marker) {
                marker.title = title;
                marker.description = description;
                marker.url = url;
                marker.mediaUrl = mediaUrl;
                marker.color = color;
            }
        });

        this.showStatus('Marker properties saved', 'success');
        this.updateMarkerList();
    }

    deleteSelectedMarkers() {
        if (this.selectedMarkers.size === 0) return;

        this.saveState();

        this.selectedMarkers.forEach(markerId => {
            this.markers = this.markers.filter(m => m.id !== markerId);
            const markerElement = this.container.querySelector(`[data-id="${markerId}"]`);
            if (markerElement) {
                markerElement.remove();
            }
        });

        this.selectedMarkers.clear();
        this.hideMarkerProperties();
        this.showStatus('Markers deleted', 'success');
        this.updateMarkerList();
    }

    clearMarkers() {
        this.saveState();
        this.markers = [];
        this.selectedMarkers.clear();
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.hideMarkerProperties();
        this.showStatus('All markers cleared', 'success');
        this.updateMarkerList();
    }

    updateMarkerList() {
        const markerList = document.getElementById('markerList');
        if (!markerList) return;

        const searchTerm = document.getElementById('searchMarkers').value.toLowerCase();

        const filteredMarkers = this.markers.filter(marker => 
            marker.title.toLowerCase().includes(searchTerm) ||
            marker.description.toLowerCase().includes(searchTerm) ||
            marker.type.toLowerCase().includes(searchTerm)
        );

        markerList.innerHTML = filteredMarkers.map(marker => `
            <div class="marker-item ${this.selectedMarkers.has(marker.id) ? 'selected' : ''}" 
                 data-id="${marker.id}">
                <div class="marker-icon" style="background-color: ${marker.color}"></div>
                <div class="marker-info">
                    <div class="marker-title">${marker.title}</div>
                    <div class="marker-type">${marker.type}</div>
                </div>
            </div>
        `).join('');

        markerList.querySelectorAll('.marker-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const markerId = item.dataset.id;
                this.selectMarker(markerId, e.shiftKey);
            });
        });
    }

    filterMarkers(searchTerm) {
        this.updateMarkerList();
    }

    // Basic undo/redo
    saveState() {
        this.undoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: Array.from(this.selectedMarkers)
        });
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        this.redoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: Array.from(this.selectedMarkers)
        });

        const state = this.undoStack.pop();
        this.restoreState(state);
    }

    redo() {
        if (this.redoStack.length === 0) return;

        this.undoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: Array.from(this.selectedMarkers)
        });

        const state = this.redoStack.pop();
        this.restoreState(state);
    }

    restoreState(state) {
        this.markers = JSON.parse(JSON.stringify(state.markers));
        this.selectedMarkers = new Set(state.selectedMarkers);
        
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.markers.forEach(marker => this.renderMarker(marker));
        this.updateMarkerSelection();
        this.updateMarkerList();
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        document.getElementById('undoBtn').disabled = this.undoStack.length === 0;
        document.getElementById('redoBtn').disabled = this.redoStack.length === 0;
    }

    // Export/Import (simplified)
    exportProject() {
        if (this.markers.length === 0) {
            this.showStatus('Add at least one marker before exporting', 'error');
            return;
        }

        const projectData = {
            imageSrc: this.image.src,
            markers: this.markers
        };

        const htmlContent = this.generateStandaloneHTML(projectData);
        HTMLExporter.download(htmlContent, 'interactive-image.html');
        this.showStatus('HTML file downloaded successfully!', 'success');
    }

    importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.html';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.saveState();
                    const content = e.target.result;
                    
                    if (file.name.endsWith('.json')) {
                        const projectData = JSON.parse(content);
                        this.loadProject(projectData);
                    } else {
                        // Simple HTML import - just extract image
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = content;
                        const img = tempDiv.querySelector('#mainImage');
                        if (img && img.src) {
                            this.loadImage(img.src);
                        }
                    }
                    
                    this.showStatus('Project imported successfully', 'success');
                } catch (error) {
                    this.showStatus('Error importing project', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    loadProject(projectData) {
        if (projectData.imageSrc) {
            this.loadImage(projectData.imageSrc);
        }
        if (projectData.markers) {
            this.markers = projectData.markers;
            this.selectedMarkers.clear();
            document.querySelectorAll('.marker').forEach(marker => marker.remove());
            this.markers.forEach(marker => this.renderMarker(marker));
            this.updateMarkerList();
        }
    }

    generateStandaloneHTML(projectData) {
        const markersHTML = projectData.markers.map(marker => 
            `<div class="marker ${marker.type}" 
                 style="left: ${marker.x}%; top: ${marker.y}%; background-color: ${marker.color || this.getDefaultColor(marker.type)};"
                 data-marker='${JSON.stringify(marker).replace(/'/g, "&apos;")}'>
             </div>`
        ).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Image with Markers</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; }
        .viewer-container { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; max-width: 90vw; }
        .image-container { position: relative; display: inline-block; }
        #mainImage { max-width: 100%; max-height: 80vh; display: block; }
        .marker { position: absolute; width: 24px; height: 24px; background: #007bff; border: 2px solid white; border-radius: 50%; cursor: pointer; transform: translate(-50%, -50%); box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: all 0.2s ease; }
        .marker:hover { transform: translate(-50%, -50%) scale(1.3); }
        .marker.info { background: #007bff; }
        .marker.link { background: #28a745; }
        .marker.audio { background: #ffc107; }
        .marker.video { background: #dc3545; }
        .popup { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); justify-content: center; align-items: center; z-index: 1000; }
        .popup-content { background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; position: relative; }
        .close-btn { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
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
        function closePopup() { document.getElementById('popup').style.display = 'none'; }
        document.querySelectorAll('.marker').forEach(marker => {
            marker.addEventListener('click', function(e) {
                e.stopPropagation();
                const markerData = JSON.parse(this.getAttribute('data-marker'));
                showMarkerInfo(markerData);
            });
        });
        function showMarkerInfo(marker) {
            document.getElementById('popupTitle').textContent = marker.title;
            document.getElementById('popupDescription').textContent = marker.description;
            const linkElement = document.getElementById('popupLink');
            if (marker.type === 'link' && marker.url) {
                linkElement.href = marker.url;
                linkElement.style.display = 'inline-block';
            } else { linkElement.style.display = 'none'; }
            const mediaElement = document.getElementById('popupMedia');
            mediaElement.innerHTML = '';
            if ((marker.type === 'audio' || marker.type === 'video') && marker.mediaUrl) {
                if (marker.type === 'audio') {
                    mediaElement.innerHTML = '<audio controls src="' + marker.mediaUrl + '">Your browser does not support audio.</audio>';
                } else {
                    mediaElement.innerHTML = '<video controls src="' + marker.mediaUrl + '">Your browser does not support video.</video>';
                }
            }
            document.getElementById('popup').style.display = 'flex';
        }
        document.getElementById('popup').addEventListener('click', function(e) {
            if (e.target === this) { closePopup(); }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') { closePopup(); }
        });
    </script>
</body>
</html>`;
    }

    getDefaultColor(type) {
        const colors = {
            info: '#007bff',
            link: '#28a745',
            audio: '#ffc107',
            video: '#dc3545'
        };
        return colors[type] || '#007bff';
    }

    togglePropertyFields(markerType) {
        document.getElementById('linkUrlGroup').style.display = 
            markerType === 'link' ? 'block' : 'none';
        document.getElementById('mediaUrlGroup').style.display = 
            markerType === 'audio' || markerType === 'video' ? 'block' : 'none';
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing editor...');
    new EnhancedImageMarkerEditor();
});

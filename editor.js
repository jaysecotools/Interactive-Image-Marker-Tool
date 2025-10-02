class EnhancedImageMarkerEditor {
    constructor() {
        this.image = document.getElementById('mainImage');
        this.container = document.getElementById('imageContainer');
        this.markers = [];
        this.selectedMarkers = new Set();
        this.undoStack = [];
        this.redoStack = [];
        this.dragState = null;
        
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    initializeEventListeners() {
        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Marker type and color change
        document.getElementById('markerType').addEventListener('change', (e) => {
            this.togglePropertyFields(e.target.value);
        });

        document.getElementById('markerColor').addEventListener('change', (e) => {
            this.currentMarkerColor = e.target.value;
        });

        // Image interactions
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

        // URL validation and preview
        document.getElementById('markerUrl').addEventListener('blur', (e) => {
            this.validateAndPreviewUrl(e.target.value, 'link');
        });

        document.getElementById('markerMediaUrl').addEventListener('blur', (e) => {
            this.validateAndPreviewUrl(e.target.value, 'media');
        });

        // Context menu
        document.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        // Initialize current color
        this.currentMarkerColor = document.getElementById('markerColor').value;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveMarkerProperties();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportProject();
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedMarkers.size > 0) {
                    e.preventDefault();
                    this.deleteSelectedMarkers();
                }
            } else if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }

    handleImageUpload(file) {
        if (!file) return;

        this.saveState();
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
            this.showStatus('Image loaded! Click on the image to add markers.', 'success');
        };
        reader.onerror = (e) => {
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
            title: `Marker ${this.markers.length + 1}`,
            description: '',
            url: '',
            mediaUrl: '',
            color: this.currentMarkerColor
        };

        this.saveState();
        this.markers.push(marker);
        this.renderMarker(marker);
        this.selectMarker(marker.id, event.shiftKey);
        
        this.showStatus(`Added ${markerType} marker`, 'success');
        this.updateMarkerList();
    }

    renderMarker(marker) {
        let markerElement = this.container.querySelector(`[data-id="${marker.id}"]`);
        
        if (!markerElement) {
            markerElement = document.createElement('div');
            markerElement.className = `marker ${marker.type}`;
            markerElement.dataset.id = marker.id;
            this.container.appendChild(markerElement);

            // Drag functionality
            this.makeMarkerDraggable(markerElement);
        }

        markerElement.style.left = `${marker.x}%`;
        markerElement.style.top = `${marker.y}%`;
        markerElement.style.backgroundColor = marker.color;

        // Update selection state
        if (this.selectedMarkers.has(marker.id)) {
            markerElement.classList.add('selected');
        } else {
            markerElement.classList.remove('selected');
        }
    }

    makeMarkerDraggable(markerElement) {
        markerElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(markerElement, e);
        });

        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const markerId = markerElement.dataset.id;
            this.selectMarker(markerId, e.shiftKey);
        });

        markerElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const markerId = markerElement.dataset.id;
            this.selectMarker(markerId, false);
            this.editMarkerProperties();
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

            this.renderMarker(marker);
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

        // Update marker list
        this.updateMarkerList();
    }

    showMarkerProperties() {
        if (this.selectedMarkers.size !== 1) return;

        const markerId = Array.from(this.selectedMarkers)[0];
        const marker = this.markers.find(m => m.id === markerId);
        if (!marker) return;

        const propsPanel = document.getElementById('markerProperties');
        propsPanel.style.display = 'block';

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

        this.selectedMarkers.forEach(markerId => {
            const marker = this.markers.find(m => m.id === markerId);
            if (marker) {
                marker.title = document.getElementById('markerTitle').value;
                marker.description = document.getElementById('markerDescription').value;
                marker.url = document.getElementById('markerUrl').value;
                marker.mediaUrl = document.getElementById('markerMediaUrl').value;
                marker.color = document.getElementById('markerCustomColor').value;

                this.renderMarker(marker);
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

    clearSelection() {
        this.selectedMarkers.clear();
        this.updateMarkerSelection();
        this.hideMarkerProperties();
    }

    // Marker List Management
    updateMarkerList() {
        const markerList = document.getElementById('markerList');
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

        // Add click listeners to marker list items
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

    // URL Validation and Preview
    validateAndPreviewUrl(url, type) {
        if (!url) {
            this.hidePreview(type);
            return;
        }

        try {
            new URL(url);
            this.showPreview(url, type);
        } catch (e) {
            this.showStatus('Invalid URL format', 'warning');
            this.hidePreview(type);
        }
    }

    showPreview(url, type) {
        if (type === 'link') {
            const preview = document.getElementById('linkPreview');
            preview.innerHTML = `Link: <a href="${url}" target="_blank">${url}</a>`;
            preview.style.display = 'block';
        } else if (type === 'media') {
            const preview = document.getElementById('mediaPreview');
            const extension = url.split('.').pop().toLowerCase();
            const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
            const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];

            if (audioExtensions.includes(extension)) {
                preview.innerHTML = `<audio controls src="${url}">Your browser does not support audio.</audio>`;
            } else if (videoExtensions.includes(extension)) {
                preview.innerHTML = `<video controls src="${url}" style="max-width: 100%;">Your browser does not support video.</video>`;
            } else {
                preview.innerHTML = 'Unsupported media format';
            }
            preview.style.display = 'block';
        }
    }

    hidePreview(type) {
        const preview = type === 'link' ? 
            document.getElementById('linkPreview') : 
            document.getElementById('mediaPreview');
        preview.style.display = 'none';
    }

    // Context Menu
    handleContextMenu(e) {
        const markerElement = e.target.closest('.marker');
        if (markerElement) {
            e.preventDefault();
            const markerId = markerElement.dataset.id;
            
            if (!this.selectedMarkers.has(markerId)) {
                this.selectMarker(markerId, false);
            }

            this.showContextMenu(e.clientX, e.clientY);
        }
    }

    showContextMenu(x, y) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';

        // Add event listeners to context menu items
        contextMenu.querySelectorAll('.context-item').forEach(item => {
            item.onclick = () => this.handleContextAction(item.dataset.action);
        });
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
    }

    handleContextAction(action) {
        switch(action) {
            case 'edit':
                this.editMarkerProperties();
                break;
            case 'delete':
                this.deleteSelectedMarkers();
                break;
            case 'color':
                this.changeMarkerColor();
                break;
        }
        this.hideContextMenu();
    }

    editMarkerProperties() {
        if (this.selectedMarkers.size === 1) {
            this.showMarkerProperties();
            document.getElementById('markerTitle').focus();
        }
    }

    changeMarkerColor() {
        const newColor = prompt('Enter new color (hex format):', '#007bff');
        if (newColor) {
            this.saveState();
            this.selectedMarkers.forEach(markerId => {
                const marker = this.markers.find(m => m.id === markerId);
                if (marker) {
                    marker.color = newColor;
                    this.renderMarker(marker);
                }
            });
            this.updateMarkerList();
        }
    }

    // Undo/Redo System
    saveState() {
        this.undoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: new Set(this.selectedMarkers)
        });
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        this.redoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: new Set(this.selectedMarkers)
        });

        const state = this.undoStack.pop();
        this.restoreState(state);
    }

    redo() {
        if (this.redoStack.length === 0) return;

        this.undoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: new Set(this.selectedMarkers)
        });

        const state = this.redoStack.pop();
        this.restoreState(state);
    }

    restoreState(state) {
        this.markers = JSON.parse(JSON.stringify(state.markers));
        this.selectedMarkers = new Set(state.selectedMarkers);
        
        // Re-render all markers
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.markers.forEach(marker => this.renderMarker(marker));
        this.updateMarkerSelection();
        this.updateMarkerList();
        this.updateUndoRedoButtons();

        if (this.selectedMarkers.size === 1) {
            this.showMarkerProperties();
        } else {
            this.hideMarkerProperties();
        }
    }

    updateUndoRedoButtons() {
        document.getElementById('undoBtn').disabled = this.undoStack.length === 0;
        document.getElementById('redoBtn').disabled = this.redoStack.length === 0;
    }

    // Import/Export
    exportProject() {
        if (this.markers.length === 0) {
            this.showStatus('Add at least one marker before exporting', 'error');
            return;
        }

        const projectData = this.getProjectData();
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
                        this.loadFromHTML(content);
                    }
                    
                    this.showStatus('Project imported successfully', 'success');
                } catch (error) {
                    this.showStatus('Error importing project: ' + error.message, 'error');
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

    loadFromHTML(htmlContent) {
        // This is a simplified HTML import - in practice, you'd want more robust parsing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const img = tempDiv.querySelector('#mainImage');
        if (img && img.src) {
            this.loadImage(img.src);
        }

        const markers = tempDiv.querySelectorAll('.marker');
        this.markers = [];
        markers.forEach(markerEl => {
            try {
                const markerData = JSON.parse(markerEl.getAttribute('data-marker').replace(/&apos;/g, "'"));
                this.markers.push(markerData);
                this.renderMarker(markerData);
            } catch (e) {
                console.warn('Could not parse marker data:', e);
            }
        });
        
        this.updateMarkerList();
    }

    getProjectData() {
        return {
            imageSrc: this.image.src,
            markers: this.markers,
            version: '2.0'
        };
    }

    // Keep your existing generateStandaloneHTML method, but enhance it with new features
    generateStandaloneHTML(projectData) {
        // Enhanced version that includes all the new visual features
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
        /* Include all the enhanced CSS styles from editor.css */
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
        function closePopup() {
            document.getElementById('popup').style.display = 'none';
        }

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
            } else {
                linkElement.style.display = 'none';
            }
            
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
            if (e.target === this) {
                closePopup();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closePopup();
            }
        });
    </script>
</body>
</html>`;
    }

    getEnhancedStyles() {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: #f0f0f0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            padding: 20px;
        }
        .viewer-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
            max-width: 90vw;
        }
        .image-container {
            position: relative;
            display: inline-block;
        }
        #mainImage {
            max-width: 100%;
            max-height: 80vh;
            display: block;
        }
        .marker {
            position: absolute;
            width: 28px;
            height: 28px;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: white;
        }
        .marker:hover {
            transform: translate(-50%, -50%) scale(1.3);
        }
        .marker.info::after { content: 'i'; }
        .marker.link::after { content: '🔗'; font-size: 12px; }
        .marker.audio::after { content: '♪'; }
        .marker.video::after { content: '▶'; }
        .popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .popup-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }
        .close-btn {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .close-btn:hover {
            color: #000;
        }
        .popup h3 {
            margin-bottom: 10px;
            color: #333;
        }
        .popup p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #666;
        }
        .popup a {
            display: inline-block;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-right: 10px;
        }
        .popup a:hover {
            background: #0056b3;
        }
        audio, video {
            width: 100%;
            margin-top: 15px;
        }`;
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

    handleDoubleClick(e) {
        const markerElement = e.target.closest('.marker');
        if (markerElement) {
            const markerId = markerElement.dataset.id;
            this.selectMarker(markerId, false);
            this.editMarkerProperties();
        }
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

// Initialize the enhanced editor
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedImageMarkerEditor();
});

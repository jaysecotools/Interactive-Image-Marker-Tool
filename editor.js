class ImageMarkerEditor {
    constructor() {
        this.image = document.getElementById('mainImage');
        this.container = document.getElementById('imageContainer');
        this.markers = [];
        this.selectedMarker = null;
        
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
    }

    initializeEventListeners() {
        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Marker type change
        document.getElementById('markerType').addEventListener('change', (e) => {
            this.togglePropertyFields(e.target.value);
        });

        // Image click for adding markers
        this.container.addEventListener('click', (e) => {
            if (this.image.style.display !== 'none') {
                this.addMarker(e);
            }
        });

        // Marker property buttons
        document.getElementById('saveMarker').addEventListener('click', () => {
            this.saveMarkerProperties();
        });

        document.getElementById('deleteMarker').addEventListener('click', () => {
            this.deleteMarker();
        });

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportProject();
        });

        // Clear markers
        document.getElementById('clearMarkers').addEventListener('click', () => {
            this.clearMarkers();
        });
    }

    handleImageUpload(file) {
        if (!file) return;

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
            mediaUrl: ''
        };

        this.markers.push(marker);
        this.renderMarker(marker);
        this.selectMarker(marker.id);
        
        this.showStatus(`Added ${markerType} marker`, 'success');
    }

    renderMarker(marker) {
        const markerElement = document.createElement('div');
        markerElement.className = `marker ${marker.type}`;
        markerElement.style.left = `${marker.x}%`;
        markerElement.style.top = `${marker.y}%`;
        markerElement.dataset.id = marker.id;

        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectMarker(marker.id);
        });

        this.container.appendChild(markerElement);
    }

    selectMarker(markerId) {
        this.selectedMarker = this.markers.find(m => m.id === markerId);
        this.showMarkerProperties();
    }

    showMarkerProperties() {
        const propsPanel = document.getElementById('markerProperties');
        propsPanel.style.display = 'block';

        document.getElementById('markerTitle').value = this.selectedMarker.title || '';
        document.getElementById('markerDescription').value = this.selectedMarker.description || '';
        document.getElementById('markerUrl').value = this.selectedMarker.url || '';
        document.getElementById('markerMediaUrl').value = this.selectedMarker.mediaUrl || '';

        this.togglePropertyFields(this.selectedMarker.type);
    }

    togglePropertyFields(markerType) {
        document.getElementById('linkUrlGroup').style.display = 
            markerType === 'link' ? 'block' : 'none';
        document.getElementById('mediaUrlGroup').style.display = 
            markerType === 'audio' || markerType === 'video' ? 'block' : 'none';
    }

    saveMarkerProperties() {
        if (!this.selectedMarker) return;

        this.selectedMarker.title = document.getElementById('markerTitle').value;
        this.selectedMarker.description = document.getElementById('markerDescription').value;
        this.selectedMarker.url = document.getElementById('markerUrl').value;
        this.selectedMarker.mediaUrl = document.getElementById('markerMediaUrl').value;

        this.showStatus('Marker properties saved', 'success');
    }

    deleteMarker() {
        if (!this.selectedMarker) return;

        this.markers = this.markers.filter(m => m.id !== this.selectedMarker.id);
        
        const markerElement = this.container.querySelector(`[data-id="${this.selectedMarker.id}"]`);
        if (markerElement) {
            markerElement.remove();
        }

        this.hideMarkerProperties();
        this.showStatus('Marker deleted', 'success');
    }

    hideMarkerProperties() {
        document.getElementById('markerProperties').style.display = 'none';
        this.selectedMarker = null;
    }

    clearMarkers() {
        this.markers = [];
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.hideMarkerProperties();
        this.showStatus('All markers cleared', 'success');
    }

    getProjectData() {
        return {
            imageSrc: this.image.src,
            markers: this.markers
        };
    }

    exportProject() {
        if (this.markers.length === 0) {
            this.showStatus('Add at least one marker before exporting', 'error');
            return;
        }

        const projectData = this.getProjectData();
        const htmlContent = this.generateStandaloneHTML(projectData);
        
        // Use the nuclear exporter
        HTMLExporter.download(htmlContent, 'interactive-image.html');
        
        this.showStatus('HTML file downloaded successfully!', 'success');
    }

    generateStandaloneHTML(projectData) {
        const markersHTML = projectData.markers.map(marker => 
            `<div class="marker ${marker.type}" 
                 style="left: ${marker.x}%; top: ${marker.y}%;"
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
            width: 20px;
            height: 20px;
            background: #007bff;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
        }
        .marker:hover {
            transform: translate(-50%, -50%) scale(1.3);
        }
        .marker.info { background: #007bff; }
        .marker.link { background: #28a745; }
        .marker.audio { background: #ffc107; }
        .marker.video { background: #dc3545; }
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
        }
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
    new ImageMarkerEditor();
});

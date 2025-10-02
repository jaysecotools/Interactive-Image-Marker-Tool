class ImageMarkerEditor {
    constructor() {
        this.image = document.getElementById('mainImage');
        this.canvas = document.getElementById('panoramaView');
        this.container = document.getElementById('imageContainer');
        this.markers = [];
        this.selectedMarker = null;
        this.isPanorama = false;
        
        this.initializeEventListeners();
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
            if (this.image.style.display !== 'none' || this.canvas.style.display !== 'none') {
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

        // Export and project management
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportProject();
        });

        document.getElementById('saveProject').addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('loadProject').addEventListener('click', () => {
            document.getElementById('projectUpload').click();
        });

        document.getElementById('projectUpload').addEventListener('change', (e) => {
            this.loadProject(e.target.files[0]);
        });
    }

    handleImageUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            // Simple panorama detection (you might want more sophisticated detection)
            this.isPanorama = file.name.includes('panorama') || file.name.includes('360');
            
            if (this.isPanorama) {
                this.loadPanorama(e.target.result);
            } else {
                this.loadRegularImage(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    }

    loadRegularImage(src) {
        this.image.src = src;
        this.image.style.display = 'block';
        this.canvas.style.display = 'none';
        this.container.querySelector('.placeholder').style.display = 'none';
        
        // Clear existing markers
        this.clearMarkers();
    }

    loadPanorama(src) {
        // Simple panorama display - for production, consider using a library like Three.js
        const ctx = this.canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            this.canvas.width = 800;
            this.canvas.height = 400;
            
            // Draw a simple equirectangular projection
            ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            
            this.canvas.style.display = 'block';
            this.image.style.display = 'none';
            this.container.querySelector('.placeholder').style.display = 'none';
            
            this.clearMarkers();
        };
        
        img.src = src;
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
            title: '',
            description: '',
            url: '',
            mediaUrl: ''
        };

        this.markers.push(marker);
        this.renderMarker(marker);
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

        this.hideMarkerProperties();
    }

    deleteMarker() {
        if (!this.selectedMarker) return;

        this.markers = this.markers.filter(m => m.id !== this.selectedMarker.id);
        
        const markerElement = this.container.querySelector(`[data-id="${this.selectedMarker.id}"]`);
        if (markerElement) {
            markerElement.remove();
        }

        this.hideMarkerProperties();
    }

    hideMarkerProperties() {
        document.getElementById('markerProperties').style.display = 'none';
        this.selectedMarker = null;
    }

    clearMarkers() {
        this.markers = [];
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.hideMarkerProperties();
    }

    getProjectData() {
        return {
            imageSrc: this.isPanorama ? this.canvas.toDataURL() : this.image.src,
            isPanorama: this.isPanorama,
            markers: this.markers
        };
    }

    saveProject() {
        const projectData = this.getProjectData();
        const dataStr = JSON.stringify(projectData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'image-marker-project.json';
        link.click();
    }

    async loadProject(file) {
        const text = await file.text();
        const projectData = JSON.parse(text);
        
        if (projectData.isPanorama) {
            this.loadPanorama(projectData.imageSrc);
        } else {
            this.loadRegularImage(projectData.imageSrc);
        }
        
        // Clear existing markers and load new ones
        this.clearMarkers();
        this.markers = projectData.markers || [];
        this.markers.forEach(marker => this.renderMarker(marker));
    }

    exportProject() {
        const projectData = this.getProjectData();
        const exporter = new HTMLExporter();
        exporter.export(projectData);
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageMarkerEditor();
});

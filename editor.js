class MediaURLHandler {
    static getMediaType(url) {
        if (!url) return null;

        // Clean the URL first
        const cleanUrl = this.cleanUrl(url);

        // YouTube patterns - enhanced to handle more formats
        const youtubePatterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/
        ];

        // Vimeo patterns
        const vimeoPatterns = [
            /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([0-9]+)/,
            /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/groups\/[^\/]+\/videos\/([0-9]+)/,
            /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/channels\/[^\/]+\/([0-9]+)/
        ];

        // SoundCloud patterns - enhanced
        const soundcloudPatterns = [
            /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[^\/]+\/[^\/]+/,
            /(?:https?:\/\/)?(?:www\.)?on\.soundcloud\.com\/[^\/]+/
        ];

        // Direct file extensions
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];

        const urlLower = cleanUrl.toLowerCase();
        
        // Check YouTube
        for (const pattern of youtubePatterns) {
            if (pattern.test(cleanUrl)) {
                return { 
                    type: 'youtube', 
                    embedUrl: this.getYouTubeEmbedUrl(cleanUrl),
                    originalUrl: url
                };
            }
        }

        // Check Vimeo
        for (const pattern of vimeoPatterns) {
            if (pattern.test(cleanUrl)) {
                return { 
                    type: 'vimeo', 
                    embedUrl: this.getVimeoEmbedUrl(cleanUrl),
                    originalUrl: url
                };
            }
        }

        // Check SoundCloud
        for (const pattern of soundcloudPatterns) {
            if (pattern.test(cleanUrl)) {
                return { 
                    type: 'soundcloud', 
                    embedUrl: this.getSoundCloudEmbedUrl(cleanUrl),
                    originalUrl: url
                };
            }
        }

        // Check direct file links
        const extension = urlLower.split('.').pop().split('?')[0];
        if (audioExtensions.includes(extension)) {
            return { 
                type: 'audio', 
                embedUrl: url,
                originalUrl: url
            };
        }
        if (videoExtensions.includes(extension)) {
            return { 
                type: 'video', 
                embedUrl: url,
                originalUrl: url
            };
        }

        return { 
            type: 'unknown', 
            embedUrl: url,
            originalUrl: url
        };
    }

    static cleanUrl(url) {
        // Remove tracking parameters and clean up URL
        return url
            .replace(/\?si=[^&]+/, '') // Remove SoundCloud si parameter
            .replace(/\?feature=share/, '') // Remove share parameters
            .replace(/\?utm_[^&]+/g, '') // Remove UTM parameters
            .split('?')[0]; // Remove all query parameters for some services
    }

    static getYouTubeEmbedUrl(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                const videoId = match[1].split('?')[0].split('&')[0];
                return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
            }
        }
        return url;
    }

    static getVimeoEmbedUrl(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([0-9]+)/,
            /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/groups\/[^\/]+\/videos\/([0-9]+)/,
            /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/channels\/[^\/]+\/([0-9]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                const videoId = match[1];
                return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
            }
        }
        return url;
    }

    static getSoundCloudEmbedUrl(url) {
        // Handle on.soundcloud.com links - these are share links that need conversion
        if (url.includes('on.soundcloud.com')) {
            // For on.soundcloud.com links, we need to use the original URL format
            // These are preview links and might not always work with embedding
            // We'll try to use the standard SoundCloud embed pattern
            return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }
        
        // For regular SoundCloud URLs
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
    }

    static generateEmbedCode(mediaInfo, width = '100%', height = '300') {
        const { type, embedUrl, originalUrl } = mediaInfo;

        switch (type) {
            case 'youtube':
                return `<iframe 
                    src="${embedUrl}" 
                    width="${width}" 
                    height="${height}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    loading="lazy">
                </iframe>`;
            
            case 'vimeo':
                return `<iframe 
                    src="${embedUrl}" 
                    width="${width}" 
                    height="${height}" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen
                    loading="lazy">
                </iframe>`;
            
            case 'soundcloud':
                // Special handling for on.soundcloud.com links
                if (originalUrl.includes('on.soundcloud.com')) {
                    return `
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="margin-bottom: 10px; color: #666;">SoundCloud Preview Link</p>
                        <a href="${originalUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #ff5500; color: white; text-decoration: none; border-radius: 4px;">
                            Open in SoundCloud
                        </a>
                        <p style="margin-top: 10px; font-size: 12px; color: #999;">
                            Note: Preview links may not embed directly. Click to open in SoundCloud.
                        </p>
                    </div>`;
                }
                return `<iframe 
                    width="${width}" 
                    height="${height}" 
                    scrolling="no" 
                    frameborder="no" 
                    allow="autoplay"
                    src="${embedUrl}">
                </iframe>`;
            
            case 'audio':
                return `<audio controls style="width: 100%;" preload="metadata">
                    <source src="${embedUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>`;
            
            case 'video':
                return `<video controls style="width: 100%; max-width: 100%;" preload="metadata">
                    <source src="${embedUrl}" type="video/mp4">
                    Your browser does not support the video element.
                </video>`;
            
            default:
                return `<a href="${embedUrl}" target="_blank" style="display: inline-block; padding: 10px 15px; background: #6366f1; color: white; text-decoration: none; border-radius: 4px;">Open Link</a>`;
        }
    }

    static isValidMediaUrl(url) {
        const mediaInfo = this.getMediaType(url);
        return mediaInfo.type !== 'unknown';
    }
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
        
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
        this.setupKeyboardShortcuts();
        this.setupMediaUrlHelpers();
        
        this.currentMarkerColor = document.getElementById('markerColor').value;
        this.currentMarkerOpacity = parseFloat(document.getElementById('markerOpacity').value);
    }

    initializeEventListeners() {
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
            this.exportProject();
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

    setupMediaUrlHelpers() {
        const mediaUrlInput = document.getElementById('markerMediaUrl');
        const linkUrlInput = document.getElementById('markerUrl');
        
        // Add placeholder examples
        mediaUrlInput.placeholder = "YouTube, Vimeo, SoundCloud, or direct MP4/MP3 links...";
        linkUrlInput.placeholder = "https://example.com or media service URL";
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
            color: this.currentMarkerColor,
            opacity: this.currentMarkerOpacity
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
            this.makeMarkerDraggable(markerElement);
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
            startY: event.y,
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

        const propsPanel = document.getElementById('markerProperties');
        propsPanel.style.display = 'block';

        document.getElementById('markerTitle').value = marker.title || '';
        document.getElementById('markerDescription').value = marker.description || '';
        document.getElementById('markerUrl').value = marker.url || '';
        document.getElementById('markerMediaUrl').value = marker.mediaUrl || '';
        document.getElementById('markerCustomColor').value = marker.color || this.currentMarkerColor;
        document.getElementById('markerCustomOpacity').value = marker.opacity || 0.8;

        this.togglePropertyFields(marker.type);
        
        // Show previews if URLs exist
        if (marker.url) {
            this.validateAndPreviewUrl(marker.url, 'link');
        }
        if (marker.mediaUrl) {
            this.validateAndPreviewUrl(marker.mediaUrl, 'media');
        }
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
                marker.opacity = parseFloat(document.getElementById('markerCustomOpacity').value);

                this.renderMarker(marker);
            }
        });

        this.showStatus('Marker properties saved', 'success');
        this.updateMarkerList();
    }

    updateSelectedMarkersColor(color) {
        if (this.selectedMarkers.size === 0) return;
        
        this.saveState();
        this.selectedMarkers.forEach(markerId => {
            const marker = this.markers.find(m => m.id === markerId);
            if (marker) {
                marker.color = color;
                this.renderMarker(marker);
            }
        });
    }

    updateSelectedMarkersOpacity(opacity) {
        if (this.selectedMarkers.size === 0) return;
        
        this.saveState();
        this.selectedMarkers.forEach(markerId => {
            const marker = this.markers.find(m => m.id === markerId);
            if (marker) {
                marker.opacity = opacity;
                this.renderMarker(marker);
            }
        });
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
                <div class="marker-icon" style="background-color: ${marker.color}; opacity: ${marker.opacity || 0.8}"></div>
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

    validateAndPreviewUrl(url, type) {
        if (!url) {
            this.hidePreview(type);
            return false;
        }

        try {
            // Basic URL validation
            new URL(url);
            
            const mediaInfo = MediaURLHandler.getMediaType(url);
            
            if (type === 'link') {
                this.showLinkPreview(url, mediaInfo);
            } else if (type === 'media') {
                this.showMediaPreview(url, mediaInfo);
            }
            
            return true;
        } catch (e) {
            this.showStatus('Invalid URL format', 'warning');
            this.hidePreview(type);
            return false;
        }
    }

    showLinkPreview(url, mediaInfo) {
        const preview = document.getElementById('linkPreview');
        
        if (mediaInfo.type !== 'unknown') {
            preview.innerHTML = `🔗 ${mediaInfo.type.toUpperCase()} Link: <a href="${url}" target="_blank">${url}</a>`;
        } else {
            preview.innerHTML = `🔗 External Link: <a href="${url}" target="_blank">${url}</a>`;
        }
        preview.style.display = 'block';
    }

    showMediaPreview(url, mediaInfo) {
        const preview = document.getElementById('mediaPreview');
        
        if (mediaInfo.type === 'unknown') {
            preview.innerHTML = '❌ Unsupported media format or URL';
            preview.style.display = 'block';
            return;
        }

        // Show media type indicator
        const typeLabels = {
            youtube: '📹 YouTube Video',
            vimeo: '🎬 Vimeo Video',
            soundcloud: '🎵 SoundCloud Audio',
            audio: '🔊 Audio File',
            video: '🎥 Video File'
        };

        const typeLabel = typeLabels[mediaInfo.type] || '📌 Media';
        
        // Special handling for on.soundcloud.com links
        let specialNote = '';
        if (url.includes('on.soundcloud.com')) {
            specialNote = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 8px; margin: 8px 0; font-size: 12px;">
                💡 <strong>Note:</strong> SoundCloud preview links may not embed directly in the editor. 
                They will work in the exported HTML file.
            </div>`;
        }
        
        preview.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">
                ${typeLabel}
            </div>
            ${specialNote}
            ${MediaURLHandler.generateEmbedCode(mediaInfo, '100%', '200')}
            <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                Source: <a href="${url}" target="_blank">${url}</a>
            </div>
        `;
        preview.style.display = 'block';
    }

    hidePreview(type) {
        const preview = type === 'link' ? 
            document.getElementById('linkPreview') : 
            document.getElementById('mediaPreview');
        preview.style.display = 'none';
    }

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
        const newColor = prompt('Enter new color (hex format):', '#6366f1');
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

    getEnhancedMediaScript() {
        return `
        const MediaHandler = {
            getEmbedCode: function(url, type) {
                if (!url) return '';
                
                // Clean URL
                const cleanUrl = this.cleanUrl(url);
                
                // YouTube
                if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
                    const videoId = this.extractYouTubeId(cleanUrl);
                    if (videoId) {
                        return '<iframe width="100%" height="315" src="https://www.youtube.com/embed/' + videoId + '?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
                    }
                }
                
                // Vimeo
                if (cleanUrl.includes('vimeo.com')) {
                    const videoId = this.extractVimeoId(cleanUrl);
                    if (videoId) {
                        return '<iframe src="https://player.vimeo.com/video/' + videoId + '?title=0&byline=0&portrait=0" width="100%" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
                    }
                }
                
                // SoundCloud
                if (cleanUrl.includes('soundcloud.com') || cleanUrl.includes('on.soundcloud.com')) {
                    // Special handling for on.soundcloud.com links
                    if (cleanUrl.includes('on.soundcloud.com')) {
                        return '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 10px 0;">' +
                               '<p style="margin-bottom: 15px; color: #666;">🎵 SoundCloud Audio</p>' +
                               '<a href="' + url + '" target="_blank" style="display: inline-block; padding: 12px 24px; background: #ff5500; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">' +
                               'Listen on SoundCloud</a>' +
                               '</div>';
                    }
                    return '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=' + encodeURIComponent(cleanUrl) + '&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>';
                }
                
                // Audio files
                if (cleanUrl.match(/\\.(mp3|wav|ogg|m4a|aac)(\\?.*)?$/i)) {
                    return '<audio controls style="width: 100%"><source src="' + cleanUrl + '">Your browser does not support audio.</audio>';
                }
                
                // Video files
                if (cleanUrl.match(/\\.(mp4|webm|ogg|mov|avi)(\\?.*)?$/i)) {
                    return '<video controls style="width: 100%; max-width: 100%"><source src="' + cleanUrl + '">Your browser does not support video.</video>';
                }
                
                return '<a href="' + cleanUrl + '" target="_blank" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Open Link</a>';
            },
            
            cleanUrl: function(url) {
                return url
                    .replace(/\\?si=[^&]+/, '')
                    .replace(/\\?feature=share/, '')
                    .replace(/\\?utm_[^&]+/g, '')
                    .split('?')[0];
            },
            
            extractYouTubeId: function(url) {
                const patterns = [
                    /(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([^&\\n?#]+)/,
                    /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/embed\\/([^&\\n?#]+)/,
                    /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/v\\/([^&\\n?#]+)/,
                    /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/shorts\\/([^&\\n?#]+)/
                ];
                
                for (const pattern of patterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        return match[1].split('?')[0].split('&')[0];
                    }
                }
                return null;
            },
            
            extractVimeoId: function(url) {
                const patterns = [
                    /(?:https?:\\/\\/)?(?:www\\.)?vimeo\\.com\\/([0-9]+)/,
                    /(?:https?:\\/\\/)?(?:www\\.)?vimeo\\.com\\/groups\\/[^\\/]+\\/videos\\/([0-9]+)/,
                    /(?:https?:\\/\\/)?(?:www\\.)?vimeo\\.com\\/channels\\/[^\\/]+\\/([0-9]+)/
                ];
                
                for (const pattern of patterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
                return null;
            }
        };

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
            document.getElementById('popupTitle').textContent = marker.title || 'Marker';
            document.getElementById('popupDescription').textContent = marker.description || '';
            
            const linkElement = document.getElementById('popupLink');
            if (marker.type === 'link' && marker.url) {
                linkElement.href = marker.url;
                linkElement.textContent = 'Visit Link';
                linkElement.style.display = 'inline-block';
            } else {
                linkElement.style.display = 'none';
            }
            
            const mediaElement = document.getElementById('popupMedia');
            mediaElement.innerHTML = '';
            
            if ((marker.type === 'audio' || marker.type === 'video') && marker.mediaUrl) {
                mediaElement.innerHTML = MediaHandler.getEmbedCode(marker.mediaUrl, marker.type);
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
    `;
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
        }
        .marker.info::after { content: 'i'; font-size: 10px; }
        .marker.link::after { content: '🔗'; font-size: 8px; }
        .marker.audio::after { content: '♪'; font-size: 8px; }
        .marker.video::after { content: '▶'; font-size: 8px; }
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
            border-radius: 8px;
        }
        iframe {
            border-radius: 8px;
            border: none;
        }`;
    }

    getDefaultColor(type) {
        const colors = {
            info: '#6366f1',
            link: '#10b981',
            audio: '#f59e0b',
            video: '#ef4444'
        };
        return colors[type] || '#6366f1';
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

document.addEventListener('DOMContentLoaded', () => {
    new EnhancedImageMarkerEditor();
});

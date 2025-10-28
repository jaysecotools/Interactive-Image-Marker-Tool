class MediaURLHandler {
    static getMediaType(url) {
        if (!url) return { type: 'unknown', embedUrl: '', originalUrl: '' };

        try {
            // Add basic URL format check
            if (!url.includes('://') && !url.startsWith('//') && !url.startsWith('data:')) {
                url = 'https://' + url;
            }

            // Ensure URL is properly formatted
            const cleanUrl = this.cleanUrl(url);
            const urlObj = new URL(cleanUrl);

            const youtubePatterns = [
                /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/
            ];

            const vimeoPatterns = [
                /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([0-9]+)/,
                /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/groups\/[^\/]+\/videos\/([0-9]+)/,
                /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/channels\/[^\/]+\/([0-9]+)/
            ];

            const soundcloudPatterns = [
                /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[^\/]+\/[^\/]+/,
                /(?:https?:\/\/)?(?:www\.)?on\.soundcloud\.com\/[^\/]+/
            ];

            const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
            const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];

            const urlLower = cleanUrl.toLowerCase();
            
            for (const pattern of youtubePatterns) {
                if (pattern.test(cleanUrl)) {
                    return { 
                        type: 'youtube', 
                        embedUrl: this.getYouTubeEmbedUrl(cleanUrl),
                        originalUrl: url
                    };
                }
            }

            for (const pattern of vimeoPatterns) {
                if (pattern.test(cleanUrl)) {
                    return { 
                        type: 'vimeo', 
                        embedUrl: this.getVimeoEmbedUrl(cleanUrl),
                        originalUrl: url
                    };
                }
            }

            for (const pattern of soundcloudPatterns) {
                if (pattern.test(cleanUrl)) {
                    return { 
                        type: 'soundcloud', 
                        embedUrl: this.getSoundCloudEmbedUrl(cleanUrl),
                        originalUrl: url
                    };
                }
            }

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
        } catch (error) {
            console.warn('Invalid URL format:', url);
            return { 
                type: 'unknown', 
                embedUrl: url,
                originalUrl: url
            };
        }
    }

    static cleanUrl(url) {
        // Remove specific tracking parameters but preserve others
        let cleaned = url
            .replace(/\?si=[^&]+&?/, '?')
            .replace(/\?feature=share&?/, '?')
            .replace(/\?utm_[^&]+&?/g, '?')
            .replace(/\?&/, '?')
            .replace(/\?$/, '');
        
        // If we removed all parameters, return the base URL
        if (cleaned.includes('?')) {
            return cleaned;
        }
        return url.split('?')[0];
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
        if (url.includes('on.soundcloud.com')) {
            return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }
        
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
        this.isVRMode = false;
        this.is360Image = false;
        
        // Initialize with proper error handling
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
        this.setupKeyboardShortcuts();
        this.setupMediaUrlHelpers();
        
        // Safe element access
        const colorInput = document.getElementById('markerColor');
        const opacityInput = document.getElementById('markerOpacity');
        
        if (colorInput) this.currentMarkerColor = colorInput.value;
        if (opacityInput) this.currentMarkerOpacity = parseFloat(opacityInput.value);
    }

    initializeEventListeners() {
        // Safe event listener binding
        const safeAddEventListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        // Bind all event listeners safely
        safeAddEventListener('imageUpload', 'change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        safeAddEventListener('markerType', 'change', (e) => {
            this.togglePropertyFields(e.target.value);
        });

        safeAddEventListener('markerColor', 'change', (e) => {
            this.currentMarkerColor = e.target.value;
        });

        safeAddEventListener('markerOpacity', 'input', (e) => {
            this.currentMarkerOpacity = parseFloat(e.target.value);
        });

        safeAddEventListener('markerCustomOpacity', 'input', (e) => {
            this.updateSelectedMarkersOpacity(parseFloat(e.target.value));
        });

        safeAddEventListener('saveMarker', 'click', () => {
            this.saveMarkerProperties();
        });

        safeAddEventListener('deleteMarker', 'click', () => {
            this.deleteSelectedMarkers();
        });

        safeAddEventListener('exportBtn', 'click', () => {
            this.showExportOptions();
        });

        safeAddEventListener('importBtn', 'click', () => {
            this.importProject();
        });

        safeAddEventListener('clearMarkers', 'click', () => {
            this.clearMarkers();
        });

        safeAddEventListener('undoBtn', 'click', () => {
            this.undo();
        });

        safeAddEventListener('redoBtn', 'click', () => {
            this.redo();
        });

        safeAddEventListener('searchMarkers', 'input', (e) => {
            this.filterMarkers(e.target.value);
        });

        safeAddEventListener('markerUrl', 'blur', (e) => {
            this.validateAndPreviewUrl(e.target.value, 'link');
        });

        safeAddEventListener('markerMediaUrl', 'blur', (e) => {
            this.validateAndPreviewUrl(e.target.value, 'media');
        });

        safeAddEventListener('markerCustomColor', 'change', (e) => {
            this.updateSelectedMarkersColor(e.target.value);
        });

        safeAddEventListener('vrModeBtn', 'click', () => {
            this.toggleVRMode();
        });

        safeAddEventListener('confirmExport', 'click', () => {
            this.handleExportConfirm();
        });

        safeAddEventListener('cancelExport', 'click', () => {
            this.hideExportModal();
        });

        // Bulk actions
        safeAddEventListener('bulkDelete', 'click', () => {
            this.deleteSelectedMarkers();
        });

        safeAddEventListener('bulkColor', 'click', () => {
            this.changeBulkMarkerColor();
        });

        safeAddEventListener('bulkClear', 'click', () => {
            this.clearSelection();
        });

        // Container events
        if (this.container) {
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
        }

        // Context menu and modal events
        document.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target.id === 'exportModal') {
                    this.hideExportModal();
                }
            });
        }
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
                        this.showExportOptions();
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedMarkers.size > 0) {
                    e.preventDefault();
                    this.deleteSelectedMarkers();
                }
            } else if (e.key === 'Escape') {
                this.clearSelection();
                this.hideExportModal();
                this.hideContextMenu();
            }
        });
    }

    setupMediaUrlHelpers() {
        const mediaUrlInput = document.getElementById('markerMediaUrl');
        const linkUrlInput = document.getElementById('markerUrl');
        
        if (mediaUrlInput) {
            mediaUrlInput.placeholder = "YouTube, Vimeo, SoundCloud, or direct MP4/MP3 links...";
        }
        if (linkUrlInput) {
            linkUrlInput.placeholder = "https://example.com";
        }
    }

    toggleVRMode() {
        if (!this.image || !this.image.src) {
            this.showStatus('Please upload an image first', 'warning');
            return;
        }

        this.isVRMode = !this.isVRMode;
        const vrButton = document.getElementById('vrModeBtn');
        
        if (vrButton) {
            if (this.isVRMode) {
                vrButton.innerHTML = '<span class="material-icons">view_in_ar</span> VR Mode';
                vrButton.classList.add('vr-active');
                this.showStatus('VR Mode: Markers will be placed in 3D space for 360° viewing', 'success');
            } else {
                vrButton.innerHTML = '<span class="material-icons">view_in_ar</span> 2D Mode';
                vrButton.classList.remove('vr-active');
                this.showStatus('2D Mode: Standard flat image markup', 'success');
            }
        }
        
        this.checkIf360Image();
        
        // Update all markers to reflect VR mode
        this.markers.forEach(marker => {
            marker.is3D = this.isVRMode;
            this.renderMarker(marker);
        });
    }

    checkIf360Image() {
        if (this.image.naturalWidth && this.image.naturalHeight) {
            const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
            // More accurate 360 detection with tolerance
            this.is360Image = Math.abs(aspectRatio - 2.0) < 0.2;
            
            const indicator = document.getElementById('imageTypeIndicator');
            if (indicator) {
                if (this.is360Image) {
                    indicator.textContent = '🌐 360° Image';
                    indicator.className = 'image-type-indicator vr-360';
                    indicator.style.display = 'block';
                    this.showStatus('✅ 360° image detected! Perfect for VR export.', 'success');
                } else {
                    indicator.textContent = '📷 Standard Image';
                    indicator.className = 'image-type-indicator standard';
                    indicator.style.display = 'block';
                    this.showStatus('⚠️ Image may not be 360°. For best VR results, use 2:1 aspect ratio images.', 'warning');
                }
            }
        } else {
            // Wait for image to load with error handling
            this.image.onload = () => {
                setTimeout(() => this.checkIf360Image(), 100);
            };
            this.image.onerror = () => {
                console.error('Failed to load image');
                this.showStatus('Failed to load image', 'error');
            };
        }
    }

    handleImageUpload(file) {
        if (!file) return;

        // Check if it's an image file
        if (!file.type.startsWith('image/')) {
            this.showStatus('Please upload a valid image file', 'error');
            return;
        }

        // Add file size validation
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showStatus('Image too large. Maximum size is 10MB.', 'error');
            return;
        }

        this.saveState();
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
            setTimeout(() => this.checkIf360Image(), 100);
            this.showStatus('Image loaded! Click on the image to add markers.', 'success');
        };
        reader.onerror = (e) => {
            this.showStatus('Error loading image: ' + e.target.error, 'error');
        };
        reader.readAsDataURL(file);
    }

    loadImage(src) {
        if (!this.image) return;
        
        this.image.src = src;
        this.image.style.display = 'block';
        const placeholder = this.container.querySelector('.placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        this.clearMarkers();
    }

    addMarker(event) {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const markerTypeSelect = document.getElementById('markerType');
        const markerType = markerTypeSelect ? markerTypeSelect.value : 'info';
        
        const marker = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
            opacity: this.currentMarkerOpacity,
            createdAt: new Date().toISOString()
        };

        this.saveState();
        this.markers.push(marker);
        this.renderMarker(marker);
        this.selectMarker(marker.id, event.shiftKey);
        
        const modeText = this.isVRMode ? '3D VR' : '2D';
        this.showStatus(`Added ${markerType} marker in ${modeText} mode`, 'success');
        this.updateMarkerList();
        this.updateBulkActions();
    }

    convertXToPhi(x) {
        return (x / 100) * 360;
    }

    convertYToTheta(y) {
        return ((y / 100) * 180) - 90;
    }

    renderMarker(marker) {
        if (!this.container) return;

        let markerElement = this.container.querySelector(`[data-id="${marker.id}"]`);
        
        if (!markerElement) {
            markerElement = document.createElement('div');
            markerElement.className = `marker ${marker.type}`;
            markerElement.dataset.id = marker.id;
            markerElement.setAttribute('aria-label', `${marker.type} marker: ${marker.title}`);
            this.container.appendChild(markerElement);
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
            this.selectMarker(markerId, e.shiftKey || e.ctrlKey || e.metaKey);
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

            if (marker.is3D) {
                marker.phi = this.convertXToPhi(marker.x);
                marker.theta = this.convertYToTheta(marker.y);
            }

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
        this.updateBulkActions();
        
        if (this.selectedMarkers.size === 1) {
            this.showMarkerProperties();
        } else if (this.selectedMarkers.size > 1) {
            this.showBulkProperties();
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

    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const bulkCount = document.getElementById('bulkCount');
        
        if (bulkActions && bulkCount) {
            if (this.selectedMarkers.size > 1) {
                bulkCount.textContent = `${this.selectedMarkers.size} markers selected`;
                bulkActions.style.display = 'flex';
            } else {
                bulkActions.style.display = 'none';
            }
        }
    }

    showMarkerProperties() {
        if (this.selectedMarkers.size !== 1) return;

        const markerId = Array.from(this.selectedMarkers)[0];
        const marker = this.markers.find(m => m.id === markerId);
        if (!marker) return;

        const propsPanel = document.getElementById('markerProperties');
        if (!propsPanel) return;

        propsPanel.style.display = 'block';

        document.getElementById('markerTitle').value = marker.title || '';
        document.getElementById('markerDescription').value = marker.description || '';
        document.getElementById('markerUrl').value = marker.url || '';
        document.getElementById('markerMediaUrl').value = marker.mediaUrl || '';
        document.getElementById('markerCustomColor').value = marker.color || this.currentMarkerColor;
        document.getElementById('markerCustomOpacity').value = marker.opacity || 0.8;

        this.togglePropertyFields(marker.type);
        
        if (marker.url) {
            this.validateAndPreviewUrl(marker.url, 'link');
        }
        if (marker.mediaUrl) {
            this.validateAndPreviewUrl(marker.mediaUrl, 'media');
        }
    }

    showBulkProperties() {
        const propsPanel = document.getElementById('markerProperties');
        if (propsPanel) {
            propsPanel.style.display = 'none';
        }
    }

    hideMarkerProperties() {
        const propsPanel = document.getElementById('markerProperties');
        if (propsPanel) {
            propsPanel.style.display = 'none';
        }
    }

    saveMarkerProperties() {
        if (this.selectedMarkers.size === 0) return;

        this.saveState();

        this.selectedMarkers.forEach(markerId => {
            const marker = this.markers.find(m => m.id === markerId);
            if (marker) {
                marker.title = document.getElementById('markerTitle').value || `Marker ${markerId}`;
                marker.description = document.getElementById('markerDescription').value || '';
                marker.url = document.getElementById('markerUrl').value || '';
                marker.mediaUrl = document.getElementById('markerMediaUrl').value || '';
                marker.color = document.getElementById('markerCustomColor').value;
                marker.opacity = parseFloat(document.getElementById('markerCustomOpacity').value) || 0.8;

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
        
        this.showStatus(`Updated color for ${this.selectedMarkers.size} markers`, 'success');
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
        const count = this.selectedMarkers.size;
        if (count === 0) return;

        if (!confirm(`Delete ${count} marker(s)?`)) {
            return;
        }

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
        this.updateBulkActions();
        this.showStatus(`Deleted ${count} markers`, 'success');
        this.updateMarkerList();
    }

    clearMarkers() {
        if (this.markers.length === 0) return;
        
        if (!confirm('Clear all markers?')) {
            return;
        }

        this.saveState();
        this.markers = [];
        this.selectedMarkers.clear();
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.hideMarkerProperties();
        this.updateBulkActions();
        this.showStatus('All markers cleared', 'success');
        this.updateMarkerList();
    }

    clearSelection() {
        this.selectedMarkers.clear();
        this.updateMarkerSelection();
        this.hideMarkerProperties();
        this.updateBulkActions();
    }

    updateMarkerList() {
        const markerList = document.getElementById('markerList');
        if (!markerList) return;

        const searchInput = document.getElementById('searchMarkers');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        if (this.markers.length === 0) {
            markerList.innerHTML = '<div class="no-markers" style="padding: 20px; text-align: center; color: var(--text-muted);">No markers yet. Click on the image to add markers.</div>';
            return;
        }

        const filteredMarkers = this.markers.filter(marker => 
            marker.title.toLowerCase().includes(searchTerm) ||
            marker.description.toLowerCase().includes(searchTerm) ||
            marker.type.toLowerCase().includes(searchTerm)
        );

        if (filteredMarkers.length === 0) {
            markerList.innerHTML = '<div class="no-markers" style="padding: 20px; text-align: center; color: var(--text-muted);">No markers match your search.</div>';
            return;
        }

        markerList.innerHTML = filteredMarkers.map(marker => `
            <div class="marker-item ${this.selectedMarkers.has(marker.id) ? 'selected' : ''}" 
                 data-id="${marker.id}"
                 aria-label="${marker.title} - ${marker.type} marker">
                <div class="marker-icon" style="background-color: ${marker.color}; opacity: ${marker.opacity || 0.8}"></div>
                <div class="marker-info">
                    <div class="marker-title">${this.escapeHtml(marker.title)}</div>
                    <div class="marker-type">${marker.type} ${marker.is3D ? '(VR)' : ''}</div>
                </div>
            </div>
        `).join('');

        markerList.querySelectorAll('.marker-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const markerId = item.dataset.id;
                this.selectMarker(markerId, e.shiftKey || e.ctrlKey || e.metaKey);
            });
        });
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    filterMarkers(searchTerm) {
        this.updateMarkerList();
    }

    showExportOptions() {
        if (this.markers.length === 0) {
            this.showStatus('Add at least one marker before exporting', 'error');
            return;
        }

        if (!this.image || !this.image.src) {
            this.showStatus('Please upload an image before exporting', 'error');
            return;
        }

        const modal = document.getElementById('exportModal');
        if (!modal) return;

        modal.style.display = 'flex';

        // Reset selections and add click handlers
        modal.querySelectorAll('.export-option').forEach(option => {
            option.classList.remove('selected');
            option.onclick = () => {
                modal.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            };
        });
        
        // Auto-select based on current mode and image type
        const has3DMarkers = this.markers.some(marker => marker.is3D);
        if ((this.isVRMode || has3DMarkers) && this.is360Image) {
            const vrOption = modal.querySelector('.export-option[data-type="vr"]');
            if (vrOption) vrOption.classList.add('selected');
        } else {
            const option2d = modal.querySelector('.export-option[data-type="2d"]');
            if (option2d) option2d.classList.add('selected');
        }
    }

    hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    handleExportConfirm() {
        const selectedOption = document.querySelector('.export-option.selected');
        if (!selectedOption) {
            this.showStatus('Please select an export option', 'warning');
            return;
        }

        const exportType = selectedOption.dataset.type;
        this.hideExportModal();

        console.log('Exporting as:', exportType, 'Markers:', this.markers);

        if (exportType === 'vr') {
            this.exportVRProject();
        } else if (exportType === 'json') {
            this.exportJSONProject();
        } else {
            this.export2DProject();
        }
    }

    export2DProject() {
        try {
            const projectData = this.getProjectData();
            const htmlContent = this.generateStandaloneHTML(projectData);
            
            HTMLExporter.download(htmlContent, 'interactive-image-2d.html');
            this.showStatus('2D HTML file downloaded successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showStatus('Error during export: ' + error.message, 'error');
        }
    }

    exportVRProject() {
        try {
            const projectData = this.getProjectData();
            const htmlContent = this.generateVRHTML(projectData);
            
            HTMLExporter.download(htmlContent, 'interactive-image-vr.html');
            this.showStatus('VR 360° HTML file downloaded successfully! Open in browser and use VR headset!', 'success');
        } catch (error) {
            console.error('VR Export error:', error);
            this.showStatus('Error during VR export: ' + error.message, 'error');
        }
    }

    exportJSONProject() {
        try {
            const projectData = this.getProjectData();
            HTMLExporter.exportJSON(projectData, 'interactive-image-project.json');
            this.showStatus('Project backup saved as JSON!', 'success');
        } catch (error) {
            console.error('JSON Export error:', error);
            this.showStatus('Error during JSON export: ' + error.message, 'error');
        }
    }

    saveState() {
        this.undoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: Array.from(this.selectedMarkers),
            imageSrc: this.image ? this.image.src : ''
        });
        
        // Limit undo stack size
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        this.redoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: Array.from(this.selectedMarkers),
            imageSrc: this.image ? this.image.src : ''
        });

        const state = this.undoStack.pop();
        this.restoreState(state);
        
        this.showStatus('Undo: Reverted changes', 'success');
    }

    redo() {
        if (this.redoStack.length === 0) return;

        this.undoStack.push({
            markers: JSON.parse(JSON.stringify(this.markers)),
            selectedMarkers: Array.from(this.selectedMarkers),
            imageSrc: this.image ? this.image.src : ''
        });

        const state = this.redoStack.pop();
        this.restoreState(state);
        
        this.showStatus('Redo: Restored changes', 'success');
    }

    restoreState(state) {
        this.markers = JSON.parse(JSON.stringify(state.markers));
        this.selectedMarkers = new Set(state.selectedMarkers || []);
        
        // Restore image if it changed
        if (state.imageSrc && this.image && this.image.src !== state.imageSrc) {
            this.loadImage(state.imageSrc);
        }
        
        document.querySelectorAll('.marker').forEach(marker => marker.remove());
        this.markers.forEach(marker => this.renderMarker(marker));
        this.updateMarkerSelection();
        this.updateMarkerList();
        this.updateUndoRedoButtons();
        this.updateBulkActions();

        if (this.selectedMarkers.size === 1) {
            this.showMarkerProperties();
        } else {
            this.hideMarkerProperties();
        }
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    }

    importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.html,.txt';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.showStatus('File too large. Maximum size is 10MB.', 'error');
                return;
            }

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
                    console.error('Import error:', error);
                    this.showStatus('Error importing project: ' + error.message, 'error');
                }
            };
            
            reader.onerror = (e) => {
                this.showStatus('Error reading file', 'error');
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
            this.markers.forEach(marker => {
                // Ensure markers have required properties
                marker.is3D = marker.is3D || false;
                marker.opacity = marker.opacity || 0.8;
                marker.color = marker.color || this.getDefaultColor(marker.type);
                this.renderMarker(marker);
            });
            this.updateMarkerList();
            this.updateBulkActions();
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
                const markerDataStr = markerEl.getAttribute('data-marker');
                if (markerDataStr) {
                    const markerData = JSON.parse(markerDataStr.replace(/&apos;/g, "'"));
                    this.markers.push(markerData);
                    this.renderMarker(markerData);
                }
            } catch (e) {
                console.warn('Could not parse marker data:', e);
            }
        });
        
        this.updateMarkerList();
        this.updateBulkActions();
    }

    getProjectData() {
        return {
            imageSrc: this.image ? this.image.src : '',
            markers: this.markers,
            version: '2.1',
            exportDate: new Date().toISOString(),
            totalMarkers: this.markers.length,
            hasVRMarkers: this.markers.some(m => m.is3D)
        };
    }

    generateStandaloneHTML(projectData) {
        const markersHTML = projectData.markers.map(marker => {
            const escapedData = JSON.stringify(marker).replace(/'/g, "&apos;");
            return `<div class="marker ${marker.type}" 
                 style="left: ${marker.x}%; top: ${marker.y}%; 
                        background-color: ${marker.color || this.getDefaultColor(marker.type)};
                        opacity: ${marker.opacity || 0.8};"
                 data-marker='${escapedData}'
                 onclick="showMarkerInfo(this)"
                 title="${this.escapeHtml(marker.title)}">
             </div>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Image with Markers</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            background: #1a1a1a; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            padding: 20px;
            color: #333;
        }
        .viewer-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
            max-width: 90vw;
            max-height: 90vh;
        }
        .image-container {
            position: relative;
            display: inline-block;
            background: #f8f9fa;
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
            z-index: 100;
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
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
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
            padding: 5px;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .close-btn:hover {
            background: #f0f0f0;
            color: #000;
        }
        .popup h3 {
            margin-bottom: 10px;
            color: #333;
            font-size: 1.5em;
        }
        .popup p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #666;
        }
        .popup a {
            display: inline-block;
            padding: 10px 20px;
            background: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-right: 10px;
            transition: background 0.3s ease;
        }
        .popup a:hover {
            background: #4f46e5;
        }
        audio, video {
            width: 100%;
            margin-top: 15px;
            border-radius: 8px;
        }
        iframe {
            border-radius: 8px;
            border: none;
        }
        @media (max-width: 768px) {
            .viewer-container {
                max-width: 95vw;
            }
            .popup-content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="viewer-container">
        <div class="image-container" id="imageContainer">
            <img id="mainImage" src="${projectData.imageSrc}" alt="Interactive Image with Markers">
            ${markersHTML}
        </div>
    </div>

    <div class="popup" id="popup">
        <div class="popup-content">
            <button class="close-btn" onclick="closePopup()" aria-label="Close popup">&times;</button>
            <h3 id="popupTitle"></h3>
            <p id="popupDescription"></p>
            <a id="popupLink" target="_blank" rel="noopener" style="display: none;">Visit Link</a>
            <div id="popupMedia"></div>
        </div>
    </div>

    <script>
        function showMarkerInfo(markerElement) {
            const markerData = JSON.parse(markerElement.getAttribute('data-marker'));
            
            document.getElementById('popupTitle').textContent = markerData.title || 'Marker';
            document.getElementById('popupDescription').textContent = markerData.description || '';
            
            const linkElement = document.getElementById('popupLink');
            if (markerData.url) {
                linkElement.href = markerData.url;
                linkElement.textContent = 'Visit Link';
                linkElement.style.display = 'inline-block';
            } else {
                linkElement.style.display = 'none';
            }
            
            const mediaElement = document.getElementById('popupMedia');
            mediaElement.innerHTML = '';
            
            if (markerData.mediaUrl) {
                mediaElement.innerHTML = getMediaEmbed(markerData.mediaUrl);
            }
            
            document.getElementById('popup').style.display = 'flex';
        }

        function closePopup() {
            document.getElementById('popup').style.display = 'none';
        }

        function getMediaEmbed(url) {
            if (!url) return '';
            
            // YouTube
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = extractYouTubeId(url);
                if (videoId) {
                    return '<div style="margin-top: 10px;"><iframe width="100%" height="315" src="https://www.youtube.com/embed/' + videoId + '?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
                }
            }
            
            // Vimeo
            if (url.includes('vimeo.com')) {
                const videoId = extractVimeoId(url);
                if (videoId) {
                    return '<div style="margin-top: 10px;"><iframe width="100%" height="315" src="https://player.vimeo.com/video/' + videoId + '?title=0&byline=0&portrait=0" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
                }
            }
            
            // SoundCloud
            if (url.includes('soundcloud.com') || url.includes('on.soundcloud.com')) {
                if (url.includes('on.soundcloud.com')) {
                    return '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 10px 0;">' +
                           '<p style="margin-bottom: 15px; color: #666;">🎵 SoundCloud Audio</p>' +
                           '<a href="' + url + '" target="_blank" rel="noopener" style="display: inline-block; padding: 12px 24px; background: #ff5500; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">' +
                           'Listen on SoundCloud</a>' +
                           '</div>';
                }
                return '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>';
            }
            
            // Audio files
            if (url.match(/\\.(mp3|wav|ogg|m4a|aac|flac)(\\?.*)?$/i)) {
                return '<audio controls style="width: 100%; margin-top: 10px;"><source src="' + url + '">Your browser does not support audio.</audio>';
            }
            
            // Video files
            if (url.match(/\\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\\?.*)?$/i)) {
                return '<video controls style="width: 100%; max-width: 100%; margin-top: 10px;"><source src="' + url + '">Your browser does not support video.</video>';
            }
            
            // Default link
            return '<a href="' + url + '" target="_blank" rel="noopener" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Open Media</a>';
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

        // Close popup when clicking outside
        document.getElementById('popup').addEventListener('click', function(e) {
            if (e.target === this) {
                closePopup();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closePopup();
            }
        });
    </script>
</body>
</html>`;
    }

    // FIXED VR HTML GENERATION
    generateVRHTML(projectData) {
        // Use ALL markers for VR export, convert 2D markers to 3D if needed
        const markers = projectData.markers.map(marker => ({
            ...marker,
            // Ensure 3D coordinates for VR
            phi: marker.phi || this.convertXToPhi(marker.x),
            theta: marker.theta || this.convertYToTheta(marker.y)
        }));
        
        const markersHTML = markers.map(marker => {
            const position = this.sphericalToCartesian(marker.phi, marker.theta, 5);
            const escapedData = JSON.stringify(marker).replace(/'/g, "&apos;");
            
            // Get marker type styling
            const markerStyle = this.getVRMarkerStyle(marker);
            
            return `
            <a-entity class="vr-marker ${marker.type}-marker clickable" 
                data-marker='${escapedData}'
                position="${position}"
                look-at="#camera">
                
                <!-- Main marker visual with type-specific styling -->
                <a-entity class="marker-visual"
                    animation="property: rotation; to: 0 360 0; dur: 8000; loop: true; easing: linear"
                    event-set__mouseenter="scale: 1.3 1.3 1.3"
                    event-set__mouseleave="scale: 1 1 1">
                    
                    ${markerStyle.outerRing}
                    ${markerStyle.innerCore}
                    ${markerStyle.icon}
                    
                </a-entity>
                
                <!-- Title label -->
                <a-text 
                    value="${this.escapeHtml(marker.title)}" 
                    position="0 0.8 0" 
                    align="center" 
                    color="white"
                    scale="1.5 1.5 1.5"
                    width="3">
                </a-text>
                
                <!-- Type indicator -->
                <a-text 
                    value="${markerStyle.typeLabel}" 
                    position="0 -0.5 0" 
                    align="center" 
                    color="${markerStyle.textColor}"
                    scale="1 1 1"
                    width="2">
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
    <script src="https://cdn.jsdelivr.net/npm/aframe-animation-component@5.1.2/dist/aframe-animation-component.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/aframe-event-set-component@4.2.1/dist/aframe-event-set-component.min.js"></script>
    <style>
        body { margin: 0; overflow: hidden; font-family: Arial, sans-serif; }
        .info-panel {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.95);
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            border: 2px solid #6366f1;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .close-btn:hover {
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }
        .media-container {
            margin-top: 15px;
        }
        .vr-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 1000;
            display: flex;
            gap: 12px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .vr-controls button {
            background: rgba(99, 102, 241, 0.8);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: 600;
        }
        .vr-controls button:hover {
            background: rgba(99, 102, 241, 1);
            transform: translateY(-2px);
        }
        
        /* VR Marker Styles */
        .info-marker .marker-icon { color: #6366f1; }
        .link-marker .marker-icon { color: #10b981; }
        .audio-marker .marker-icon { color: #f59e0b; }
        .video-marker .marker-icon { color: #ef4444; }
        
        .clickable {
            cursor: pointer;
        }
        
        a-scene { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <a-scene 
        embedded 
        vr-mode-ui="enabled: true" 
        xr-mode-ui="enabled: true" 
        loading-screen="dotsColor: #6366f1; backgroundColor: #000"
        cursor="rayOrigin: mouse"
        raycaster="objects: .clickable; far: 20;">
        
        <!-- 360° Image -->
        <a-sky src="${projectData.imageSrc}" rotation="0 -90 0"></a-sky>
        
        <!-- Markers -->
        ${markersHTML}
        
        <!-- Camera with cursor -->
        <a-entity id="camera" camera look-controls wasd-controls position="0 0 0">
            <a-cursor
                fuse="true"
                fuse-timeout="1000"
                animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"
                animation__fusing="property: scale; startEvents: fusing; from: 1 1 1; to: 0.1 0.1 0.1; dur: 1500"
                raycaster="objects: .clickable">
            </a-cursor>
        </a-entity>
        
        <!-- Lighting -->
        <a-entity light="type: ambient; color: #CCC; intensity: 0.8"></a-entity>
        <a-entity light="type: directional; color: #FFF; intensity: 0.8" position="-1 2 1"></a-entity>
    </a-scene>

    <!-- Info Panel -->
    <div class="info-panel" id="infoPanel">
        <button class="close-btn" onclick="closeInfoPanel()" aria-label="Close info panel">&times;</button>
        <h3 id="panelTitle" style="margin-bottom: 15px; color: #6366f1;">Marker Info</h3>
        <p id="panelDescription" style="margin-bottom: 15px; line-height: 1.5;"></p>
        <a id="panelLink" target="_blank" rel="noopener" style="display: none; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">🔗 Visit Link</a>
        <div class="media-container" id="panelMedia"></div>
    </div>

    <!-- VR Controls -->
    <div class="vr-controls">
        <button onclick="enterVR()">🎮 Enter VR</button>
        <button onclick="resetView()">🔄 Reset View</button>
        <button onclick="closeInfoPanel()">❌ Close Info</button>
    </div>

    <script>
        // Enhanced marker interaction system
        function setupMarkerInteractions() {
            const scene = document.querySelector('a-scene');
            
            // Wait for scene to load
            if (scene.hasLoaded) {
                initInteractions();
            } else {
                scene.addEventListener('loaded', initInteractions);
            }
            
            function initInteractions() {
                console.log('Setting up VR marker interactions...');
                
                // Add click handlers to all markers
                document.querySelectorAll('.vr-marker').forEach(marker => {
                    // Make the entire marker entity clickable
                    marker.addEventListener('click', function(event) {
                        console.log('Marker clicked');
                        handleMarkerClick(this);
                    });
                    
                    // Add hover effects
                    marker.addEventListener('mouseenter', function() {
                        this.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200');
                    });
                    
                    marker.addEventListener('mouseleave', function() {
                        this.setAttribute('animation', 'property: scale; to: 1 1 1; dur: 200');
                    });
                });
                
                // Also handle cursor fusion events
                const cursor = document.querySelector('a-cursor');
                if (cursor) {
                    cursor.addEventListener('fusing', function(event) {
                        const intersected = event.detail.intersectedEl;
                        if (intersected && intersected.classList.contains('clickable')) {
                            handleMarkerClick(findParentMarker(intersected));
                        }
                    });
                }
            }
        }

        function findParentMarker(element) {
            let current = element;
            while (current && !current.classList.contains('vr-marker')) {
                current = current.parentElement;
                if (!current) return null;
            }
            return current;
        }

        function handleMarkerClick(markerEntity) {
            if (!markerEntity) return;
            
            try {
                const markerData = JSON.parse(markerEntity.getAttribute('data-marker'));
                console.log('Showing marker info:', markerData);
                showMarkerInfo(markerData);
            } catch (e) {
                console.error('Error parsing marker data:', e);
            }
        }

        function showMarkerInfo(marker) {
            document.getElementById('panelTitle').textContent = marker.title || 'Untitled Marker';
            document.getElementById('panelDescription').textContent = marker.description || 'No description provided.';
            
            const linkElement = document.getElementById('panelLink');
            if (marker.url && marker.url.trim() !== '') {
                linkElement.href = marker.url;
                linkElement.textContent = '🔗 Visit Link';
                linkElement.style.display = 'inline-block';
            } else {
                linkElement.style.display = 'none';
            }
            
            const mediaElement = document.getElementById('panelMedia');
            mediaElement.innerHTML = '';
            
            if (marker.mediaUrl && marker.mediaUrl.trim() !== '') {
                mediaElement.innerHTML = getMediaEmbed(marker.mediaUrl);
            }
            
            document.getElementById('infoPanel').style.display = 'block';
        }

        function closeInfoPanel() {
            document.getElementById('infoPanel').style.display = 'none';
        }

        function enterVR() {
            const scene = document.querySelector('a-scene');
            if (scene && scene.enterVR) {
                scene.enterVR();
            }
        }

        function resetView() {
            const camera = document.querySelector('[camera]');
            if (camera) {
                camera.setAttribute('rotation', {x: 0, y: 0, z: 0});
            }
        }

        function getMediaEmbed(url) {
            if (!url) return '';
            
            // YouTube
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = extractYouTubeId(url);
                if (videoId) {
                    return '<div style="margin-top: 10px;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/' + videoId + '?rel=0&modestbranding=1" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe></div>';
                }
            }
            
            // Vimeo
            if (url.includes('vimeo.com')) {
                const videoId = extractVimeoId(url);
                if (videoId) {
                    return '<div style="margin-top: 10px;"><iframe width="100%" height="200" src="https://player.vimeo.com/video/' + videoId + '?title=0&byline=0&portrait=0" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe></div>';
                }
            }
            
            // Audio files
            if (url.match(/\\.(mp3|wav|ogg|m4a)(\\?.*)?$/i)) {
                return '<audio controls style="width: 100%; margin-top: 10px; border-radius: 8px;"><source src="' + url + '">Your browser does not support audio.</audio>';
            }
            
            // Video files
            if (url.match(/\\.(mp4|webm|ogg|mov)(\\?.*)?$/i)) {
                return '<video controls style="width: 100%; max-width: 100%; margin-top: 10px; border-radius: 8px;"><source src="' + url + '">Your browser does not support video.</video>';
            }
            
            // Default link for unsupported media
            return '<a href="' + url + '" target="_blank" rel="noopener" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px; font-weight: bold;">Open Media</a>';
        }

        function extractYouTubeId(url) {
            const patterns = [
                /(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([^&\\n?#]+)/,
                /(?:https?:\\/\\/)?(?:www\\.)?youtube\\.com\\/embed\\/([^&\\n?#]+)/
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) return match[1].split('?')[0].split('&')[0];
            }
            return null;
        }

        function extractVimeoId(url) {
            const match = url.match(/(?:https?:\\/\\/)?(?:www\\.)?vimeo\\.com\\/([0-9]+)/);
            return match ? match[1] : null;
        }

        // Initialize when A-Frame is ready
        document.addEventListener('DOMContentLoaded', function() {
            setupMarkerInteractions();
        });

        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            const panel = document.getElementById('infoPanel');
            if (panel && panel.style.display === 'block') {
                if (!panel.contains(e.target) && !e.target.classList.contains('vr-marker')) {
                    closeInfoPanel();
                }
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeInfoPanel();
            }
        });
    </script>
</body>
</html>`;
    }

    // NEW METHOD: VR Marker Style Helper
    getVRMarkerStyle(marker) {
        const styles = {
            info: {
                outerRing: `<a-ring class="marker-outer" radius-inner="0.25" radius-outer="0.35" color="#6366f1" opacity="${marker.opacity || 0.8}" segments-theta="32"></a-ring>`,
                innerCore: `<a-sphere class="marker-inner" radius="0.15" color="#6366f1" opacity="0.9"></a-sphere>`,
                icon: `<a-text class="marker-icon" value="i" align="center" color="white" position="0 0 0.01" scale="2 2 2" width="1"></a-text>`,
                typeLabel: "INFO",
                textColor: "#6366f1"
            },
            link: {
                outerRing: `<a-ring class="marker-outer" radius-inner="0.25" radius-outer="0.35" color="#10b981" opacity="${marker.opacity || 0.8}" segments-theta="32"></a-ring>`,
                innerCore: `<a-sphere class="marker-inner" radius="0.15" color="#10b981" opacity="0.9"></a-sphere>`,
                icon: `<a-text class="marker-icon" value="🔗" align="center" color="white" position="0 0 0.01" scale="1.5 1.5 1.5" width="1"></a-text>`,
                typeLabel: "LINK",
                textColor: "#10b981"
            },
            audio: {
                outerRing: `<a-ring class="marker-outer" radius-inner="0.25" radius-outer="0.35" color="#f59e0b" opacity="${marker.opacity || 0.8}" segments-theta="32"></a-ring>`,
                innerCore: `<a-sphere class="marker-inner" radius="0.15" color="#f59e0b" opacity="0.9"></a-sphere>`,
                icon: `<a-text class="marker-icon" value="♪" align="center" color="black" position="0 0 0.01" scale="1.5 1.5 1.5" width="1"></a-text>`,
                typeLabel: "AUDIO",
                textColor: "#f59e0b"
            },
            video: {
                outerRing: `<a-ring class="marker-outer" radius-inner="0.25" radius-outer="0.35" color="#ef4444" opacity="${marker.opacity || 0.8}" segments-theta="32"></a-ring>`,
                innerCore: `<a-sphere class="marker-inner" radius="0.15" color="#ef4444" opacity="0.9"></a-sphere>`,
                icon: `<a-text class="marker-icon" value="▶" align="center" color="white" position="0 0 0.01" scale="1.5 1.5 1.5" width="1"></a-text>`,
                typeLabel: "VIDEO",
                textColor: "#ef4444"
            }
        };
        
        return styles[marker.type] || styles.info;
    }

    sphericalToCartesian(phi, theta, radius = 5) {
        // Convert to radians
        const phiRad = (phi * Math.PI) / 180;
        const thetaRad = (theta * Math.PI) / 180;
        
        // Correct spherical to cartesian conversion for A-Frame (Y-up coordinate system)
        const x = radius * Math.sin(thetaRad) * Math.cos(phiRad);
        const y = radius * Math.cos(thetaRad);
        const z = radius * Math.sin(thetaRad) * Math.sin(phiRad);
        
        return `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`;
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
        const linkUrlGroup = document.getElementById('linkUrlGroup');
        const mediaUrlGroup = document.getElementById('mediaUrlGroup');
        
        if (linkUrlGroup) {
            linkUrlGroup.style.display = markerType === 'link' ? 'block' : 'none';
        }
        if (mediaUrlGroup) {
            mediaUrlGroup.style.display = (markerType === 'audio' || markerType === 'video') ? 'block' : 'none';
        }
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
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.style.display = 'block';
        
        // Auto-hide success messages, keep errors visible longer
        const hideDelay = type === 'error' ? 8000 : 4000;
        
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, hideDelay);
    }

    validateAndPreviewUrl(url, type) {
        if (!url || url.trim() === '') {
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
            this.showStatus('Invalid URL format. Please include http:// or https://', 'warning');
            this.hidePreview(type);
            return false;
        }
    }

    showLinkPreview(url, mediaInfo) {
        const preview = document.getElementById('linkPreview');
        if (!preview) return;
        
        if (mediaInfo.type !== 'unknown') {
            preview.innerHTML = `🔗 ${mediaInfo.type.toUpperCase()} Link: <a href="${url}" target="_blank" rel="noopener">${url}</a>`;
        } else {
            preview.innerHTML = `🔗 External Link: <a href="${url}" target="_blank" rel="noopener">${url}</a>`;
        }
        preview.style.display = 'block';
    }

    showMediaPreview(url, mediaInfo) {
        const preview = document.getElementById('mediaPreview');
        if (!preview) return;
        
        if (mediaInfo.type === 'unknown') {
            preview.innerHTML = '<div style="color: var(--danger-color);">❌ Unsupported media format or URL</div>';
            preview.style.display = 'block';
            return;
        }

        const typeLabels = {
            youtube: '📹 YouTube Video',
            vimeo: '🎬 Vimeo Video',
            soundcloud: '🎵 SoundCloud Audio',
            audio: '🔊 Audio File',
            video: '🎥 Video File'
        };

        const typeLabel = typeLabels[mediaInfo.type] || '📌 Media';
        
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
                Source: <a href="${url}" target="_blank" rel="noopener">${url}</a>
            </div>
        `;
        preview.style.display = 'block';
    }

    hidePreview(type) {
        const preview = type === 'link' ? 
            document.getElementById('linkPreview') : 
            document.getElementById('mediaPreview');
        if (preview) {
            preview.style.display = 'none';
        }
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
        if (!contextMenu) return;

        // Position context menu ensuring it stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 160;
        const menuHeight = 120;

        const adjustedX = x + menuWidth > viewportWidth ? x - menuWidth : x;
        const adjustedY = y + menuHeight > viewportHeight ? y - menuHeight : y;

        contextMenu.style.left = adjustedX + 'px';
        contextMenu.style.top = adjustedY + 'px';
        contextMenu.style.display = 'block';

        contextMenu.querySelectorAll('.context-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                this.handleContextAction(item.dataset.action);
            };
        });
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    handleContextAction(action) {
        switch(action) {
            case 'edit':
                this.editMarkerProperties();
                break;
            case 'color':
                this.changeMarkerColor();
                break;
            case 'delete':
                this.deleteSelectedMarkers();
                break;
        }
        this.hideContextMenu();
    }

    editMarkerProperties() {
        if (this.selectedMarkers.size === 1) {
            this.showMarkerProperties();
            const titleInput = document.getElementById('markerTitle');
            if (titleInput) {
                titleInput.focus();
                titleInput.select();
            }
        }
    }

    changeMarkerColor() {
        const newColor = prompt('Enter new color (hex format):', '#6366f1');
        if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
            this.saveState();
            this.updateSelectedMarkersColor(newColor);
        } else if (newColor) {
            this.showStatus('Invalid color format. Please use hex format (#RRGGBB).', 'error');
        }
    }

    changeBulkMarkerColor() {
        const newColor = prompt('Enter new color for all selected markers (hex format):', '#6366f1');
        if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
            this.saveState();
            this.updateSelectedMarkersColor(newColor);
        } else if (newColor) {
            this.showStatus('Invalid color format. Please use hex format (#RRGGBB).', 'error');
        }
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new EnhancedImageMarkerEditor();
    } catch (error) {
        console.error('Failed to initialize editor:', error);
        // Show error to user
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = 'Error initializing editor. Please refresh the page.';
            statusEl.className = 'status error';
            statusEl.style.display = 'block';
        }
    }
});

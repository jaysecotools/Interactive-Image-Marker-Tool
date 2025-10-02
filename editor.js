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
        
        this.initializeEventListeners();
        this.showStatus('Ready to upload image and add markers', 'success');
        this.setupKeyboardShortcuts();
    }

    initializeEventListeners() {
        // Image upload - fixed event listener
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        }

        // Marker type change
        const markerType = document.getElementById('markerType');
        if (markerType) {
            markerType.addEventListener('change', (e) => {
                this.togglePropertyFields(e.target.value);
            });
        }

        // Marker color change
        const markerColor = document.getElementById('markerColor');
        if (markerColor) {
            markerColor.addEventListener('change', (e) => {
                this.currentMarkerColor = e.target.value;
            });
        }

        // Image click for adding markers
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

        // Marker property buttons
        const saveMarker = document.getElementById('saveMarker');
        if (saveMarker) {
            saveMarker.addEventListener('click', () => {
                this.saveMarkerProperties();
            });
        }

        const deleteMarker = document.getElementById('deleteMarker');
        if (deleteMarker) {
            deleteMarker.addEventListener('click', () => {
                this.deleteSelectedMarkers();
            });
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportProject();
            });
        }

        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importProject();
            });
        }

        // Clear markers
        const clearMarkers = document.getElementById('clearMarkers');
        if (clearMarkers) {
            clearMarkers.addEventListener('click', () => {
                this.clearMarkers();
            });
        }

        // Undo/Redo buttons
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }

        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.redo();
            });
        }

        // Search functionality
        const searchMarkers = document.getElementById('searchMarkers');
        if (searchMarkers) {
            searchMarkers.addEventListener('input', (e) => {
                this.filterMarkers(e.target.value);
            });
        }

        // URL validation and preview
        const markerUrl = document.getElementById('markerUrl');
        if (markerUrl) {
            markerUrl.addEventListener('blur', (e) => {
                this.validateAndPreviewUrl(e.target.value, 'link');
            });
        }

        const markerMediaUrl = document.getElementById('markerMediaUrl');
        if (markerMediaUrl) {
            markerMediaUrl.addEventListener('blur', (e) => {
                this.validateAndPreviewUrl(e.target.value, 'media');
            });
        }

        // Context menu
        document.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
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

    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showStatus('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
            this.showStatus('Image loaded! Click on the image to add markers.', 'success');
        };
        reader.onerror = () => {
            this.showStatus('Error loading image', 'error');
        };
        reader.readAsDataURL(file);
    }

    loadImage(src) {
        if (!this.image) return;
        
        this.image.onload = () => {
            this.image.style.display = 'block';
            const placeholder = this.container.querySelector('.placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            this.clearMarkers();
        };
        
        this.image.onerror = () => {
            this.showStatus('Error displaying image', 'error');
        };
        
        this.image.src = src;
    }

    addMarker(event) {
        if (!this.container || !this.image.style.display !== 'none') return;

        const rect = this.container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const markerType = document.getElementById('markerType')?.value || 'info';
        
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
        if (!this.container) return;
        
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
        if (!propsPanel) return;

        propsPanel.style.display = 'block';

        const titleInput = document.getElementById('markerTitle');
        const descInput = document.getElementById('markerDescription');
        const urlInput = document.getElementById('markerUrl');
        const mediaUrlInput = document.getElementById('markerMediaUrl');
        const colorInput = document.getElementById('markerCustomColor');

        if (titleInput) titleInput.value = marker.title || '';
        if (descInput) descInput.value = marker.description || '';
        if (urlInput) urlInput.value = marker.url || '';
        if (mediaUrlInput) mediaUrlInput.value = marker.mediaUrl || '';
        if (colorInput) colorInput.value = marker.color || this.currentMarkerColor;

        // Trigger preview for existing URLs
        if (marker.url && urlInput) {
            this.validateAndPreviewUrl(marker.url, 'link');
        }
        if (marker.mediaUrl && mediaUrlInput) {
            this.validateAndPreviewUrl(marker.mediaUrl, 'media');
        }

        this.togglePropertyFields(marker.type);
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

        const titleInput = document.getElementById('markerTitle');
        const descInput = document.getElementById('markerDescription');
        const urlInput = document.getElementById('markerUrl');
        const mediaUrlInput = document.getElementById('markerMediaUrl');
        const colorInput = document.getElementById('markerCustomColor');

        this.selectedMarkers.forEach(markerId => {
            const marker = this.markers.find(m => m.id === markerId);
            if (marker) {
                if (titleInput) marker.title = titleInput.value;
                if (descInput) marker.description = descInput.value;
                if (urlInput) marker.url = urlInput.value;
                if (mediaUrlInput) marker.mediaUrl = mediaUrlInput.value;
                if (colorInput) marker.color = colorInput.value;

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
            const markerElement = this.container?.querySelector(`[data-id="${markerId}"]`);
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
        if (!markerList) return;

        const searchInput = document.getElementById('searchMarkers');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

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

    // ... (Keep all the smart link processing methods from the previous version)
    // SMART LINK PROCESSING METHODS - EDITOR PREVIEW VERSION
    processSmartLink(url, type) {
        if (!url) return { type: 'direct', url: '' };
        
        // SoundCloud links
        if (url.includes('soundcloud.com') || url.includes('on.soundcloud.com')) {
            return this.handleSoundCloudLink(url);
        }
        
        // Pexels video pages
        if (url.includes('pexels.com/video/')) {
            return this.handlePexelsLink(url);
        }
        
        // YouTube links
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            return this.handleYouTubeLink(url);
        }
        
        // Vimeo links
        if (url.includes('vimeo.com/')) {
            return this.handleVimeoLink(url);
        }
        
        // Regular direct files
        return { type: 'direct', url: url };
    }

    // SMART LINK PROCESSING FOR EXPORT - CONVERT TO DIRECT LINKS
    processSmartLinkForExport(url, type) {
        if (!url) return { type: 'direct', url: '' };
        
        // SoundCloud links
        if (url.includes('soundcloud.com') || url.includes('on.soundcloud.com')) {
            return {
                type: 'platform',
                url: url,
                platform: 'SoundCloud',
                html: this.generatePlatformLinkHTML(url, 'SoundCloud', 'Listen on SoundCloud', '🎵')
            };
        }
        
        // YouTube links
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            return {
                type: 'platform', 
                url: url,
                platform: 'YouTube',
                html: this.generatePlatformLinkHTML(url, 'YouTube', 'Watch on YouTube', '🎥')
            };
        }
        
        // Vimeo links
        if (url.includes('vimeo.com/')) {
            return {
                type: 'platform',
                url: url, 
                platform: 'Vimeo',
                html: this.generatePlatformLinkHTML(url, 'Vimeo', 'Watch on Vimeo', '🎬')
            };
        }
        
        // Pexels video pages
        if (url.includes('pexels.com/video/')) {
            return {
                type: 'platform',
                url: url,
                platform: 'Pexels',
                html: this.generatePlatformLinkHTML(url, 'Pexels', 'View on Pexels', '📸')
            };
        }
        
        // Regular direct files
        return { type: 'direct', url: url };
    }

    generatePlatformLinkHTML(url, platform, actionText, icon) {
        return `
            <div class="platform-link">
                <div class="platform-icon">${icon}</div>
                <div class="platform-info">
                    <h4>${platform} Content</h4>
                    <p>This content is hosted on ${platform}. Click the button below to view it.</p>
                    <a href="${url}" target="_blank" class="platform-btn">
                        ${actionText}
                    </a>
                </div>
            </div>`;
    }

    // EDITOR PREVIEW HANDLERS (keep embedded for editor)
    handleSoundCloudLink(url) {
        const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
        
        return {
            type: 'embed',
            url: url,
            embedUrl: embedUrl,
            html: `<iframe width="100%" height="166" scrolling="no" frameborder="no" 
                    src="${embedUrl}"></iframe>`
        };
    }

    handlePexelsLink(url) {
        const videoIdMatch = url.match(/pexels\.com\/video\/(\d+)/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            return {
                type: 'info',
                url: url,
                html: `<div class="platform-info-message">
                         <p>📸 Pexels Video Detected</p>
                         <p><em>In the exported version, this will open directly on Pexels.com</em></p>
                         <a href="${url}" target="_blank" style="font-size: 12px;">View on Pexels</a>
                       </div>`
            };
        }
        return { type: 'direct', url: url };
    }

    handleYouTubeLink(url) {
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        
        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            return {
                type: 'embed',
                url: url,
                embedUrl: embedUrl,
                html: `<iframe width="100%" height="315" src="${embedUrl}" 
                        frameborder="0" allow="accelerometer; autoplay; clipboard-write; 
                        encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
                       </iframe>`
            };
        }
        
        return { type: 'direct', url: url };
    }

    handleVimeoLink(url) {
        const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            const embedUrl = `https://player.vimeo.com/video/${videoId}`;
            return {
                type: 'embed',
                url: url,
                embedUrl: embedUrl,
                html: `<iframe src="${embedUrl}" width="100%" height="360" frameborder="0" 
                        allow="autoplay; fullscreen; picture-in-picture" allowfullscreen>
                       </iframe>`
            };
        }
        return { type: 'direct', url: url };
    }

    getPlatformName(url) {
        if (url.includes('soundcloud.com')) return 'SoundCloud';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
        if (url.includes('vimeo.com')) return 'Vimeo';
        if (url.includes('pexels.com')) return 'Pexels';
        return 'External Platform';
    }

    validateAndPreviewUrl(url, type) {
        if (!url) {
            this.hidePreview(type);
            return;
        }

        try {
            new URL(url);
            const processed = this.processSmartLink(url, type);
            this.showPreview(processed, type);
        } catch (e) {
            this.showStatus('Invalid URL format', 'warning');
            this.hidePreview(type);
        }
    }

    showPreview(processedLink, type) {
        if (type === 'link') {
            const preview = document.getElementById('linkPreview');
            if (!preview) return;
            
            if (processedLink.type === 'embed' || processedLink.type === 'info') {
                preview.innerHTML = `
                    <div class="smart-link-preview">
                        <p><strong>Content Preview:</strong> ${this.getPlatformName(processedLink.url)}</p>
                        <div class="embed-preview">
                            ${processedLink.html}
                        </div>
                        <p class="source-link"><small>In exports, this will open directly on ${this.getPlatformName(processedLink.url)}</small></p>
                    </div>`;
            } else {
                preview.innerHTML = `Link: <a href="${processedLink.url}" target="_blank">${processedLink.url}</a>`;
            }
            preview.style.display = 'block';
        } else if (type === 'media') {
            const preview = document.getElementById('mediaPreview');
            if (!preview) return;
            
            if (processedLink.type === 'embed' || processedLink.type === 'info') {
                preview.innerHTML = `
                    <div class="smart-link-preview">
                        <p><strong>Media Preview:</strong> ${this.getPlatformName(processedLink.url)}</p>
                        <div class="embed-preview">
                            ${processedLink.html}
                        </div>
                    </div>`;
            } else {
                // Handle direct media files
                const extension = processedLink.url.split('.').pop().toLowerCase();
                const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
                const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];

                if (audioExtensions.includes(extension)) {
                    preview.innerHTML = `<audio controls src="${processedLink.url}">Your browser does not support audio.</audio>`;
                } else if (videoExtensions.includes(extension)) {
                    preview.innerHTML = `<video controls src="${processedLink.url}" style="max-width: 100%;">Your browser does not support video.</video>`;
                } else if (processedLink.url) {
                    preview.innerHTML = 'Unsupported media format or platform';
                }
            }
            preview.style.display = 'block';
        }
    }

    hidePreview(type) {
        const preview = type === 'link' ? 
            document.getElementById('linkPreview') : 
            document.getElementById('mediaPreview');
        if (preview) {
            preview.style.display = 'none';
        }
    }

    // ... (Keep all the undo/redo, import/export, and other methods from the previous version)
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
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
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

    generateStandaloneHTML(projectData) {
        const markersHTML = projectData.markers.map(marker => {
            // Use export processing for reliable links
            const processedLink = this.processSmartLinkForExport(marker.url || marker.mediaUrl || '');
            const platformData = processedLink.type === 'platform' ? 
                `data-platform='${JSON.stringify(processedLink).replace(/'/g, "&apos;")}'` : '';
            
            return `<div class="marker ${marker.type}" 
                     style="left: ${marker.x}%; top: ${marker.y}%; background-color: ${marker.color || this.getDefaultColor(marker.type)};"
                     data-marker='${JSON.stringify(marker).replace(/'/g, "&apos;")}'
                     ${platformData}>
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
            <div id="popupContent"></div>
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
                const platformData = this.getAttribute('data-platform');
                const platformInfo = platformData ? JSON.parse(platformData.replace(/&apos;/g, "'")) : null;
                showMarkerInfo(markerData, platformInfo);
            });
        });

        function showMarkerInfo(marker, platformInfo) {
            document.getElementById('popupTitle').textContent = marker.title;
            document.getElementById('popupDescription').textContent = marker.description;
            
            const contentElement = document.getElementById('popupContent');
            contentElement.innerHTML = '';
            
            if (marker.type === 'link' && marker.url) {
                if (platformInfo && platformInfo.type === 'platform') {
                    // Show platform-specific link
                    contentElement.innerHTML = platformInfo.html;
                } else {
                    // Regular link
                    contentElement.innerHTML = \`
                        <div class="direct-link">
                            <p>External Link</p>
                            <a href="\${marker.url}" target="_blank" class="direct-link-btn">
                                Visit Website
                            </a>
                        </div>
                    \`;
                }
            } else if ((marker.type === 'audio' || marker.type === 'video') && marker.mediaUrl) {
                if (platformInfo && platformInfo.type === 'platform') {
                    // Show platform-specific media link
                    contentElement.innerHTML = platformInfo.html;
                } else {
                    // Direct media files
                    if (marker.type === 'audio') {
                        contentElement.innerHTML = '<div class="media-container"><p>Audio:</p><audio controls src="' + marker.mediaUrl + '">Your browser does not support audio.</audio></div>';
                    } else {
                        contentElement.innerHTML = '<div class="media-container"><p>Video:</p><video controls src="' + marker.mediaUrl + '" style="max-width: 100%;">Your browser does not support video.</video></div>';
                    }
                }
            } else {
                // Info marker or no media
                contentElement.innerHTML = '<p class="no-content">No additional content</p>';
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
        /* Platform Link Styles */
        .platform-link {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .platform-icon {
            font-size: 24px;
            flex-shrink: 0;
        }
        .platform-info {
            flex: 1;
        }
        .platform-info h4 {
            margin: 0 0 8px 0;
            color: #333;
        }
        .platform-info p {
            margin: 0 0 15px 0;
            color: #666;
            font-size: 14px;
        }
        .platform-btn {
            display: inline-block;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        .platform-btn:hover {
            background: #0056b3;
        }
        /* Direct Link Styles */
        .direct-link {
            text-align: center;
            padding: 20px;
        }
        .direct-link p {
            margin-bottom: 15px;
            color: #666;
        }
        .direct-link-btn {
            display: inline-block;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .direct-link-btn:hover {
            background: #218838;
        }
        /* Media Container */
        .media-container {
            text-align: center;
        }
        .media-container p {
            margin-bottom: 10px;
            color: #666;
            font-weight: bold;
        }
        audio, video {
            width: 100%;
            max-width: 400px;
            margin-top: 10px;
        }
        .no-content {
            text-align: center;
            color: #999;
            font-style: italic;
            padding: 20px;
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
        if (contextMenu) {
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
            contextMenu.style.display = 'block';

            // Add event listeners to context menu items
            contextMenu.querySelectorAll('.context-item').forEach(item => {
                item.onclick = () => this.handleContextAction(item.dataset.action);
            });
        }
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
            const titleInput = document.getElementById('markerTitle');
            if (titleInput) titleInput.focus();
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

    showStatus(message, type) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
            statusEl.style.display = 'block';
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 4000);
        }
    }
}

// Initialize the enhanced editor
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedImageMarkerEditor();
});

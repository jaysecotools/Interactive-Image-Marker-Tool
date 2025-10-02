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
        preview.style.display = 'none';
    }

    // ... (keep all the existing methods like handleImageUpload, addMarker, renderMarker, etc. unchanged)

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

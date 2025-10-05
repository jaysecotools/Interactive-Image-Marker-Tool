<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Image Marker Editor - 2D & 360° VR</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles/editor.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 Interactive Image Marker Editor</h1>
            <div class="controls">
                <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                <button onclick="document.getElementById('imageUpload').click()">
                    <span class="material-icons">image</span> Upload Image
                </button>
                
                <select id="markerType">
                    <option value="info">ℹ️ Info Marker</option>
                    <option value="link">🔗 Link Marker</option>
                    <option value="audio">🎵 Audio Marker</option>
                    <option value="video">🎥 Video Marker</option>
                </select>
                
                <input type="color" id="markerColor" value="#6366f1" title="Marker Color">
                
                <div class="opacity-control">
                    <label for="markerOpacity">Opacity:</label>
                    <input type="range" id="markerOpacity" min="0.1" max="1" step="0.1" value="0.8">
                </div>
                
                <button id="vrModeBtn">
                    <span class="material-icons">view_in_ar</span> 2D Mode
                </button>
                
                <button id="exportBtn">
                    <span class="material-icons">download</span> Export
                </button>
                
                <button id="importBtn">
                    <span class="material-icons">upload</span> Import
                </button>
                
                <button id="clearMarkers">
                    <span class="material-icons">clear_all</span> Clear All
                </button>
                
                <button id="undoBtn" disabled>
                    <span class="material-icons">undo</span> Undo
                </button>
                
                <button id="redoBtn" disabled>
                    <span class="material-icons">redo</span> Redo
                </button>
            </div>
        </header>

        <div class="main-content">
            <!-- Left Sidebar - Marker List -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h3>📋 Markers</h3>
                    <input type="text" id="searchMarkers" placeholder="Search markers...">
                </div>
                <div class="marker-list" id="markerList">
                    <div class="no-markers">No markers yet. Click on the image to add markers.</div>
                </div>
            </div>

            <!-- Main Editor Area -->
            <div class="editor-area">
                <div class="image-container" id="imageContainer">
                    <div class="placeholder">
                        <span class="material-icons">add_photo_alternate</span>
                        <p>Upload an Image to Get Started</p>
                        <small>Supported: JPG, PNG, WebP • 360° images (2:1 ratio) recommended for VR</small>
                        <button onclick="document.getElementById('imageUpload').click()" 
                                style="margin-top: 15px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Choose Image
                        </button>
                    </div>
                    <img id="mainImage" style="display: none;" alt="Main image for markup">
                    <div class="image-type-indicator" id="imageTypeIndicator" style="display: none;"></div>
                </div>
            </div>

            <!-- Right Sidebar - Properties -->
            <div class="sidebar properties-panel" id="markerProperties" style="display: none;">
                <h3>⚙️ Marker Properties</h3>
                
                <div class="property-group">
                    <label for="markerTitle">Title *</label>
                    <input type="text" id="markerTitle" placeholder="Enter marker title" required>
                </div>
                
                <div class="property-group">
                    <label for="markerDescription">Description</label>
                    <textarea id="markerDescription" placeholder="Enter marker description"></textarea>
                </div>
                
                <div class="property-group" id="linkUrlGroup" style="display: none;">
                    <label for="markerUrl">Link URL</label>
                    <input type="url" id="markerUrl" placeholder="https://example.com">
                    <div class="url-help">
                        <strong>Supported:</strong> Any web page link. Opens in new tab when clicked.
                    </div>
                    <div class="url-preview" id="linkPreview" style="display: none;"></div>
                </div>
                
                <div class="property-group" id="mediaUrlGroup" style="display: none;">
                    <label for="markerMediaUrl">Media URL</label>
                    <input type="url" id="markerMediaUrl" placeholder="YouTube, Vimeo, SoundCloud, or direct MP4/MP3 links">
                    <div class="url-help">
                        <strong>Supported:</strong> YouTube, Vimeo, SoundCloud, MP3, MP4, WebM, OGG files
                    </div>
                    <div class="media-preview" id="mediaPreview" style="display: none;"></div>
                </div>
                
                <div class="property-group">
                    <label for="markerCustomColor">Marker Color</label>
                    <input type="color" id="markerCustomColor" value="#6366f1">
                </div>
                
                <div class="property-group">
                    <label for="markerCustomOpacity">Marker Opacity</label>
                    <input type="range" id="markerCustomOpacity" min="0.1" max="1" step="0.1" value="0.8">
                </div>
                
                <div class="property-actions">
                    <button class="btn-primary" id="saveMarker">
                        <span class="material-icons">save</span> Save
                    </button>
                    <button class="btn-danger" id="deleteMarker">
                        <span class="material-icons">delete</span> Delete
                    </button>
                </div>
                
                <div class="status" id="status"></div>
            </div>
        </div>
    </div>

    <!-- Context Menu -->
    <div class="context-menu" id="contextMenu">
        <div class="context-item" data-action="edit">
            <span class="material-icons">edit</span> Edit Marker
        </div>
        <div class="context-item" data-action="color">
            <span class="material-icons">palette</span> Change Color
        </div>
        <div class="context-item" data-action="delete">
            <span class="material-icons">delete</span> Delete Marker
        </div>
    </div>

    <!-- Export Modal -->
    <div class="modal" id="exportModal" style="display: none;">
        <div class="modal-content">
            <h3>📤 Export Project</h3>
            <div class="export-options">
                <div class="export-option" data-type="2d">
                    <h4>🖼️ 2D Interactive HTML</h4>
                    <p>Export as standalone HTML file with interactive markers. Works in all modern browsers.</p>
                </div>
                <div class="export-option" data-type="vr">
                    <h4>🌐 360° VR Experience</h4>
                    <p>Export as VR-ready HTML with A-Frame. Perfect for 360° images and VR headsets.</p>
                </div>
                <div class="export-option" data-type="json">
                    <h4>💾 Project Backup (JSON)</h4>
                    <p>Save project data as JSON file for later editing or sharing.</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-primary" id="confirmExport">Export</button>
                <button class="btn-danger" id="cancelExport">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Bulk Actions -->
    <div class="bulk-actions" id="bulkActions">
        <span id="bulkCount">2 markers selected</span>
        <button id="bulkColor">Change Color</button>
        <button id="bulkDelete">Delete All</button>
        <button id="bulkClear">Clear Selection</button>
    </div>

    <script src="editor.js"></script>
    <script src="exporter.js"></script>
</body>
</html>

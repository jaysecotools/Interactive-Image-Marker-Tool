class HTMLExporter {
    export(projectData) {
        const htmlContent = this.generateHTML(projectData);
        this.downloadHTML(htmlContent, 'interactive-image.html');
    }

    generateHTML(projectData) {
        // Simple string concatenation for reliable HTML generation
        let html = '<!DOCTYPE html>\n';
        html += '<html lang="en">\n';
        html += '<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
        html += '<title>Interactive Image</title>\n';
        html += '<style>\n';
        html += this.getViewerCSS();
        html += '</style>\n';
        html += '</head>\n';
        html += '<body>\n';
        html += '<div class="viewer-container">\n';
        html += '<div class="image-container" id="imageContainer">\n';
        
        if (projectData.isPanorama) {
            html += '<canvas id="panoramaView"></canvas>\n';
        } else {
            html += '<img id="mainImage" src="' + projectData.imageSrc + '">\n';
        }
        
        html += '</div>\n';
        html += '<div class="marker-popup" id="markerPopup" style="display: none;">\n';
        html += '<div class="popup-content">\n';
        html += '<button class="close-btn" id="closePopup">&times;</button>\n';
        html += '<h3 id="popupTitle"></h3>\n';
        html += '<p id="popupDescription"></p>\n';
        html += '<a id="popupLink" style="display: none;" target="_blank">Visit Link</a>\n';
        html += '<div id="popupMedia" style="display: none;"></div>\n';
        html += '</div>\n';
        html += '</div>\n';
        html += '</div>\n';
        html += '<script>\n';
        html += this.getViewerJavaScript(projectData);
        html += '</script>\n';
        html += '</body>\n';
        html += '</html>';
        
        return html;
    }

    getViewerCSS() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                background: #f5f5f5;
                overflow: hidden;
            }
            
            .viewer-container {
                width: 100vw;
                height: 100vh;
                position: relative;
            }
            
            .image-container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
                background: #000;
            }
            
            #mainImage, #panoramaView {
                width: 100%;
                height: 100%;
                object-fit: contain;
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
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: transform 0.2s;
            }
            
            .marker:hover {
                transform: translate(-50%, -50%) scale(1.3);
            }
            
            .marker.info { background: #007bff; }
            .marker.link { background: #28a745; }
            .marker.audio { background: #ffc107; }
            .marker.video { background: #dc3545; }
            
            .marker-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
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
            
            #popupTitle {
                margin-bottom: 15px;
                color: #333;
            }
            
            #popupDescription {
                margin-bottom: 20px;
                line-height: 1.5;
                color: #666;
            }
            
            #popupLink {
                display: inline-block;
                padding: 10px 20px;
                background: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
            }
            
            #popupLink:hover {
                background: #0056b3;
            }
            
            audio, video {
                width: 100%;
                margin-top: 15px;
            }
        `;
    }

    getViewerJavaScript(projectData) {
        return `
            (function() {
                const projectData = ${JSON.stringify(projectData)};
                const imageContainer = document.getElementById('imageContainer');
                const markerPopup = document.getElementById('markerPopup');
                const popupTitle = document.getElementById('popupTitle');
                const popupDescription = document.getElementById('popupDescription');
                const popupLink = document.getElementById('popupLink');
                const popupMedia = document.getElementById('popupMedia');
                const closePopup = document.getElementById('closePopup');
                
                // Load image
                if (projectData.isPanorama) {
                    const canvas = document.getElementById('panoramaView');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    img.onload = function() {
                        canvas.width = window.innerWidth;
                        canvas.height = window.innerHeight;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        createMarkers();
                    };
                    
                    img.src = projectData.imageSrc;
                } else {
                    const img = document.getElementById('mainImage');
                    img.onload = createMarkers;
                }
                
                function createMarkers() {
                    projectData.markers.forEach(marker => {
                        const markerElement = document.createElement('div');
                        markerElement.className = 'marker ' + marker.type;
                        markerElement.style.left = marker.x + '%';
                        markerElement.style.top = marker.y + '%';
                        
                        markerElement.addEventListener('click', function(e) {
                            e.stopPropagation();
                            showMarkerPopup(marker);
                        });
                        
                        imageContainer.appendChild(markerElement);
                    });
                }
                
                function showMarkerPopup(marker) {
                    popupTitle.textContent = marker.title || 'Marker';
                    popupDescription.textContent = marker.description || '';
                    
                    // Handle link markers
                    if (marker.type === 'link' && marker.url) {
                        popupLink.href = marker.url;
                        popupLink.style.display = 'inline-block';
                    } else {
                        popupLink.style.display = 'none';
                    }
                    
                    // Handle media markers
                    popupMedia.innerHTML = '';
                    popupMedia.style.display = 'none';
                    
                    if ((marker.type === 'audio' || marker.type === 'video') && marker.mediaUrl) {
                        popupMedia.style.display = 'block';
                        if (marker.type === 'audio') {
                            popupMedia.innerHTML = '<audio controls><source src="' + marker.mediaUrl + '">Your browser does not support audio.</audio>';
                        } else {
                            popupMedia.innerHTML = '<video controls><source src="' + marker.mediaUrl + '">Your browser does not support video.</video>';
                        }
                    }
                    
                    markerPopup.style.display = 'flex';
                }
                
                // Close popup events
                closePopup.addEventListener('click', hidePopup);
                markerPopup.addEventListener('click', function(e) {
                    if (e.target === markerPopup) {
                        hidePopup();
                    }
                });
                
                function hidePopup() {
                    markerPopup.style.display = 'none';
                }
                
                // Handle window resize for panoramas
                window.addEventListener('resize', function() {
                    if (projectData.isPanorama) {
                        const canvas = document.getElementById('panoramaView');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        
                        img.onload = function() {
                            canvas.width = window.innerWidth;
                            canvas.height = window.innerHeight;
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        };
                        
                        img.src = projectData.imageSrc;
                    }
                });
            })();
        `;
    }

    downloadHTML(content, filename) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

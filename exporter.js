class HTMLExporter {
    static download(htmlContent, filename) {
        console.log('Starting download:', filename);
        
        // Input validation
        if (!this.validateHTMLContent(htmlContent)) {
            throw new Error('Invalid HTML content provided');
        }
        
        const sanitizedFilename = this.sanitizeFilename(filename);
        let url = null;

        try {
            // Method 1: Blob-based download
            const blob = new Blob([htmlContent], { 
                type: 'text/html;charset=utf-8' 
            });
            
            url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = sanitizedFilename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // Enhanced cleanup
            requestAnimationFrame(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                if (url) URL.revokeObjectURL(url);
            });
            
            console.log('Download completed successfully');
            return true;
            
        } catch (error) {
            // Ensure cleanup on error
            if (url) URL.revokeObjectURL(url);
            console.error('Blob download failed, trying fallback:', error);
            return this.fallbackDownload(htmlContent, sanitizedFilename);
        }
    }
    
    static fallbackDownload(htmlContent, filename) {
        try {
            // Method 2: Data URL approach
            const encodedContent = encodeURIComponent(htmlContent);
            const dataUrl = `data:text/html;charset=utf-8,${encodedContent}`;
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
            }, 100);
            
            console.log('Fallback download completed');
            return true;
            
        } catch (fallbackError) {
            console.error('All download methods failed:', fallbackError);
            
            // Safer fallback - don't execute arbitrary HTML
            return this.safeFallback(htmlContent, filename);
        }
    }
    
    static safeFallback(htmlContent, filename) {
        try {
            // Create a safer preview without executing scripts
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${this.escapeHtml(filename)}</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <h1>File: ${this.escapeHtml(filename)}</h1>
                        <p>Please use "File > Save As" to save this content.</p>
                        <pre>${this.escapeHtml(htmlContent)}</pre>
                    </body>
                    </html>
                `);
                newWindow.document.close();
                
                setTimeout(() => {
                    alert(`Download failed. The file "${filename}" has been opened in a new window. Please use "File > Save As" to save it.`);
                }, 100);
            }
            return false;
        } catch (error) {
            console.error('Safe fallback also failed:', error);
            alert(`Unable to download "${filename}". Please copy the content manually.`);
            return false;
        }
    }
    
    static validateHTMLContent(htmlContent) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            throw new Error('Invalid HTML content: must be a non-empty string');
        }
        
        if (htmlContent.length > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('HTML content too large (max 50MB)');
        }
        
        return true;
    }
    
    static sanitizeFilename(filename) {
        if (typeof filename !== 'string') {
            return 'download.html';
        }
        return filename
            .replace(/[^a-zA-Z0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\-.() ]/g, '_')
            .substring(0, 255) || 'download.html';
    }
    
    static escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // JSON export method remains mostly the same but add validation
    static exportJSON(data, filename = 'project-backup.json') {
        try {
            if (!data) {
                throw new Error('No data provided for JSON export');
            }
            
            const jsonContent = JSON.stringify(data, null, 2);
            const sanitizedFilename = this.sanitizeFilename(filename);
            
            // Reuse the download logic for consistency
            return this.download(jsonContent, sanitizedFilename);
            
        } catch (error) {
            console.error('JSON export failed:', error);
            return false;
        }
    }
}

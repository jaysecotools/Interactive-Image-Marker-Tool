class HTMLExporter {
    static download(htmlContent, filename) {
        console.log('Starting download:', filename);
        
        try {
            // Method 1: Blob-based download (modern approach)
            const blob = new Blob([htmlContent], { 
                type: 'text/html;charset=utf-8' 
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Append to body and click
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('Download completed successfully');
            return true;
            
        } catch (error) {
            console.error('Blob download failed, trying fallback:', error);
            return this.fallbackDownload(htmlContent, filename);
        }
    }
    
    static fallbackDownload(htmlContent, filename) {
        try {
            // Method 2: Data URL with proper encoding
            const encodedContent = encodeURIComponent(htmlContent);
            const dataUrl = 'data:text/html;charset=utf-8,' + encodedContent;
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Fallback download completed');
            return true;
            
        } catch (fallbackError) {
            console.error('All download methods failed:', fallbackError);
            
            // Last resort: Open in new window and prompt user to save
            const newWindow = window.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            setTimeout(() => {
                alert('Download failed. The file has been opened in a new window. Please use "File > Save As" to save it.');
            }, 500);
            
            return false;
        }
    }
    
    // Utility method to validate HTML content before download
    static validateHTMLContent(htmlContent) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            throw new Error('Invalid HTML content');
        }
        
        // Basic HTML structure validation
        const hasHTML = htmlContent.includes('<html');
        const hasBody = htmlContent.includes('<body');
        
        if (!hasHTML || !hasBody) {
            console.warn('HTML content may be incomplete');
        }
        
        return true;
    }
    
    // Method to export as JSON for project backup
    static exportJSON(data, filename = 'project-backup.json') {
        try {
            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { 
                type: 'application/json;charset=utf-8' 
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            return true;
        } catch (error) {
            console.error('JSON export failed:', error);
            return false;
        }
    }
}

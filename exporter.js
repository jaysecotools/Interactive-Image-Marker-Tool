class HTMLExporter {
    static download(htmlContent, filename) {
        console.log('Starting nuclear download...');
        
        // NUCLEAR OPTION - Base64 data URL
        const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
        const dataUrl = 'data:text/html;base64,' + base64Content;
        
        // Create download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        
        // Append to body and click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download triggered for:', filename);
    }
    
    // Alternative method - test if nuclear option fails
    static downloadBlob(htmlContent, filename) {
        try {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Blob download failed:', error);
            // Fallback to nuclear option
            this.download(htmlContent, filename);
        }
    }
}

class HTMLExporter {
    static download(htmlContent, filename) {
        console.log('Starting download process...');
        
        if (!htmlContent || !filename) {
            console.error('Invalid parameters for download');
            return false;
        }

        try {
            const blob = new Blob([htmlContent], { 
                type: 'text/html;charset=utf-8' 
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log('Download initiated successfully');
            return true;
            
        } catch (error) {
            console.error('Download failed:', error);
            
            try {
                const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
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
                
                return true;
                
            } catch (fallbackError) {
                console.error('Fallback download failed:', fallbackError);
                
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.write(htmlContent);
                    newWindow.document.close();
                    
                    setTimeout(() => {
                        alert('The file has been opened in a new tab. Please use "File > Save As" to save it as an HTML file.');
                    }, 100);
                    
                    return false;
                }
                
                return false;
            }
        }
    }
}

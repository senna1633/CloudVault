import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/ui/file-icons";
import { Download, Share2, X } from "lucide-react";
import { useFileContext } from "@/contexts/FileContext";
import { formatDate, formatFileSize } from "@/lib/fileUtils";

export function FilePreviewModal() {
  const { selectedFile, showPreviewModal, setShowPreviewModal } = useFileContext();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Clean up any previous object URLs to prevent memory leaks
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  const handleDownload = () => {
    if (selectedFile) {
      window.open(`/api/download/${selectedFile.id}`, '_blank');
    }
  };
  
  const renderPreview = () => {
    if (!selectedFile) return null;
    
    // For image files
    if (selectedFile.type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={`/api/download/${selectedFile.id}`}
            alt={selectedFile.name}
            className="max-w-full max-h-[50vh] object-contain rounded-lg"
          />
        </div>
      );
    }
    
    // For PDF files (simple iframe preview)
    if (selectedFile.type === 'application/pdf') {
      return (
        <iframe 
          src={`/api/download/${selectedFile.id}`}
          className="w-full h-[50vh] rounded-lg border border-border"
          title={selectedFile.name}
        />
      );
    }
    
    // For other files - show placeholder
    return (
      <div className="bg-muted rounded-xl p-8 flex flex-col items-center justify-center h-full">
        <FileIcon fileType={selectedFile.type} fileName={selectedFile.name} size="xl" />
        <p className="text-muted-foreground mt-4 mb-4">Preview not available. Click below to download this file.</p>
        <Button className="bg-accent hover:bg-accent/90" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          <span>Download</span>
        </Button>
      </div>
    );
  };
  
  if (!selectedFile) return null;
  
  return (
    <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
      <DialogContent className="bg-secondary max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex items-center justify-between p-6 border-b border-border">
          <DialogTitle className="text-xl font-medium">{selectedFile.name}</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowPreviewModal(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 bg-background">
          {renderPreview()}
        </div>
        
        <DialogFooter className="p-4 border-t border-border flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">
              Last modified: {formatDate(selectedFile.updatedAt)}
            </div>
            <div className="text-sm text-muted-foreground">
              Size: {formatFileSize(selectedFile.size)}
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

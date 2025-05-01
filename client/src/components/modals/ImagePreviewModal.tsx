import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/fileUtils";
import { useFileContext } from "@/contexts/FileContext";

export function ImagePreviewModal() {
  const { selectedFile, setShowPreviewModal, setSelectedFile } = useFileContext();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedFile) {
      setScale(1);
      setRotation(0);
      setLoading(true);
    }
  }, [selectedFile]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleClose = () => {
    setShowPreviewModal(false);
    setSelectedFile(null);
  };

  const handleDownload = () => {
    if (selectedFile) {
      window.open(`/api/files/${selectedFile.id}/download`, '_blank');
    }
  };

  return (
    <Dialog open={!!selectedFile} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-sm">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <DialogTitle className="text-lg font-medium">
            {selectedFile?.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            {selectedFile && (
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto relative">
          <div className="min-h-[300px] h-full w-full flex items-center justify-center p-4">
            {selectedFile && (
              <>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  </div>
                )}
                <motion.img
                  key={selectedFile.id}
                  src={`/api/files/${selectedFile.id}/download`}
                  alt={selectedFile.name}
                  className="max-h-full object-contain rounded-lg opacity-0"
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-out'
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onLoad={() => setLoading(false)}
                  draggable={false}
                />
              </>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {selectedFile.formattedSize} · {formatDate(selectedFile.updatedAt || selectedFile.createdAt || new Date())}
              </span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
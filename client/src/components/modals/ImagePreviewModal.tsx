import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw, AlertCircle } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/fileUtils";
import { useFileContext } from "@/contexts/FileContext";

export function ImagePreviewModal() {
  const { selectedFile, showPreviewModal, setShowPreviewModal, setSelectedFile } = useFileContext();
  const reduceMotion = useReducedMotion();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const isOpen = showPreviewModal && Boolean(selectedFile?.type.startsWith("image/"));

  useEffect(() => {
    if (selectedFile) {
      setScale(1);
      setRotation(0);
      setLoading(true);
      setImageError(false);
    }
  }, [selectedFile?.id]);

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
      const link = document.createElement("a");
      link.href = `/api/download/${selectedFile.id}`;
      link.download = selectedFile.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-7xl flex-col gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground shadow-2xl sm:w-[calc(100%-2rem)]">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-3 pr-12 text-left sm:px-6 sm:py-4">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold sm:text-lg">
              {selectedFile?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Image preview and viewing controls</DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleZoomOut} disabled={scale <= 0.5} aria-label="Zoom out" title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleZoomIn} disabled={scale >= 3} aria-label="Zoom in" title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRotate} aria-label="Rotate image" title="Rotate image">
              <RotateCw className="h-4 w-4" />
            </Button>
            {selectedFile && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDownload} aria-label={`Download ${selectedFile.name}`} title="Download image">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="relative min-h-[min(60vh,300px)] flex-1 overflow-auto bg-background/70">
          <div className="flex min-h-[min(60vh,300px)] w-full items-center justify-center p-4 sm:p-6">
            {selectedFile && (
              <>
                {loading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading image preview">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  </div>
                )}
                {imageError ? (
                  <div className="flex flex-col items-center gap-3 text-center" role="alert">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">This image could not be loaded.</p>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download image
                    </Button>
                  </div>
                ) : (
                  <motion.img
                    key={selectedFile.id}
                    src={`/api/files/${selectedFile.id}/download`}
                    alt={selectedFile.name}
                    className="max-h-[72vh] max-w-full rounded-lg object-contain shadow-lg"
                    style={{
                      transform: `scale(${scale}) rotate(${rotation}deg)`,
                      transition: reduceMotion ? "none" : "transform 0.2s ease-out"
                    }}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: loading ? 0 : 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setImageError(true);
                    }}
                    draggable={false}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="border-t border-border px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground sm:text-sm">
              <span>
                {formatFileSize(selectedFile.size)} · {formatDate(selectedFile.updatedAt || selectedFile.createdAt || new Date())}
              </span>
              <span aria-live="polite">{Math.round(scale * 100)}% zoom</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
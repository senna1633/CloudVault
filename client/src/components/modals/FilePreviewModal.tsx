import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/ui/file-icons";
import { Download } from "lucide-react";
import { useFileContext } from "@/contexts/FileContext";
import { formatDate, formatFileSize } from "@/lib/fileUtils";

export function FilePreviewModal() {
  const { selectedFile, showPreviewModal, setShowPreviewModal, setSelectedFile } = useFileContext();
  const reduceMotion = useReducedMotion();
  const isImage = selectedFile?.type.startsWith("image/") ?? false;
  const [location] = useLocation();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const dedicatedImagePreview = location === "/photos" || location === "/trash";
  const isOpen = showPreviewModal && Boolean(selectedFile) && !(isImage && dedicatedImagePreview);

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [selectedFile?.id]);

  const closePreview = () => {
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
  
  const renderPreview = () => {
    if (!selectedFile) {
      return (
        <div className="bg-muted rounded-xl p-8 flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground mt-4 mb-4">No file selected for preview.</p>
        </div>
      );
    }

    if (isImage && !imageError) {
      return (
        <div className="relative flex items-center justify-center h-full">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading image preview">
              <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={`/api/files/${selectedFile.id}/download`}
            alt={selectedFile.name}
            className={`max-w-full max-h-[70vh] object-contain rounded-lg ${imageLoading ? "opacity-0" : ""}`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        </div>
      );
    }

    return (
      <div className="bg-muted rounded-xl p-8 flex flex-col items-center justify-center h-full">
        <FileIcon fileType={selectedFile.type} fileName={selectedFile.name} size="xl" />
        <p className="text-muted-foreground mt-4 mb-4 text-center">
          {isImage
            ? "This image could not be loaded. Download it to view its contents."
            : "Preview is not available for this file. Download it to view its contents."}
        </p>
        <Button className="bg-accent hover:bg-accent/90" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          <span>Download</span>
        </Button>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground shadow-2xl">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 border-b border-border px-5 py-4 pr-14 text-left sm:px-6">
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-semibold sm:text-xl">
              {selectedFile ? selectedFile.name : "No File Selected"}
            </DialogTitle>
            <DialogDescription>
              {selectedFile ? `Preview ${selectedFile.type.split('/')[0]} file` : "No file selected for preview"}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center">
            {selectedFile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                aria-label={`Download ${selectedFile.name}`}
              >
                <Download className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <motion.div
          className="min-h-0 flex-1 overflow-auto bg-background p-4 sm:p-6"
          initial={reduceMotion ? false : { y: 6 }}
          animate={{ y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        >
          {renderPreview()}
        </motion.div>
        
        <DialogFooter className="flex-row items-center justify-between gap-4 border-t border-border px-5 py-3 sm:px-6">
          {selectedFile && (
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">
                Last modified: {selectedFile.updatedAt ? formatDate(selectedFile.updatedAt) : "Unknown"}
              </div>
              <div className="text-sm text-muted-foreground">
                Size: {formatFileSize(selectedFile.size)}
              </div>
            </div>
          )}
          <Button className="shrink-0" variant="outline" onClick={closePreview}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

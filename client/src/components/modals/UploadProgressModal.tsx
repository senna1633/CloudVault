import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, FileImage, FileText, File } from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileContext } from "@/contexts/FileContext";
import { formatFileSize } from "@/lib/fileUtils";

interface UploadProgressItemProps {
  filename: string;
  size: number;
  type: string;
}

function UploadProgressItem({ filename, size, type }: UploadProgressItemProps) {
  let FileTypeIcon = File;
  if (type.startsWith('image/')) {
    FileTypeIcon = FileImage;
  } else if (type.startsWith('text/') || type.includes('document')) {
    FileTypeIcon = FileText;
  }
  
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-background/70 p-3">
      <FileTypeIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={filename}>{filename}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(size)}</p>
      </div>
    </div>
  );
}

export function UploadProgressModal() {
  const reduceMotion = useReducedMotion();
  const { 
    showUploadProgressModal, 
    setShowUploadProgressModal, 
    uploadProgress,
    uploadingFiles,
    uploadStatus,
    cancelUploads
  } = useFileContext();
  
  const totalFiles = uploadingFiles.length;
  const isUploading = uploadStatus === "uploading";
  const overallProgress = uploadStatus === "complete" || uploadStatus === "partial"
    ? 100
    : uploadProgress.total > 0
      ? Math.round((uploadProgress.loaded / uploadProgress.total) * 100)
      : 0;
  const title = isUploading
    ? "Uploading Files"
    : uploadStatus === "complete"
      ? "Upload Complete"
      : uploadStatus === "partial"
        ? "Upload Partially Complete"
      : uploadStatus === "cancelled"
        ? "Upload Cancelled"
        : "Upload Failed";
  
  return (
    <AnimatePresence>
      {showUploadProgressModal && <motion.section
        role="region"
        aria-label="Upload status"
        className="fixed inset-x-3 bottom-3 z-50 w-auto sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-96"
        initial={{ y: reduceMotion ? 0 : 14, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: reduceMotion ? 0 : 14, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      >
        <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold" aria-live="polite" aria-atomic="true">{title}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 shrink-0"
                aria-label={isUploading ? "Cancel upload" : "Close upload status"}
                onClick={() => {
                  if (isUploading) cancelUploads();
                  else setShowUploadProgressModal(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="max-h-52 space-y-2 overflow-y-auto pb-4">
            {uploadingFiles.slice(0, 3).map((file, index) => (
              <UploadProgressItem
                key={`${file.name}-${file.size}-${index}`}
                filename={file.name}
                size={file.size}
                type={file.type}
              />
            ))}
            
            {uploadingFiles.length > 3 && (
              <div className="text-xs text-center text-muted-foreground">
                +{uploadingFiles.length - 3} more files
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex-col items-stretch border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-muted-foreground">{overallProgress}% · {totalFiles} {totalFiles === 1 ? "file" : "files"}</span>
            </div>
            <Progress
              value={overallProgress}
              className="mb-3 h-2 bg-background"
              aria-label={`Upload progress: ${overallProgress}%`}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isUploading) cancelUploads();
                else setShowUploadProgressModal(false);
              }}
            >
              {isUploading ? "Cancel Uploads" : "Dismiss"}
            </Button>
          </CardFooter>
        </Card>
      </motion.section>}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
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
  progress: number;
  size: number;
  type: string;
}

function UploadProgressItem({ filename, progress, size, type }: UploadProgressItemProps) {
  // Choose icon based on file type
  let FileTypeIcon = File;
  if (type.startsWith('image/')) {
    FileTypeIcon = FileImage;
  } else if (type.startsWith('text/') || type.includes('document')) {
    FileTypeIcon = FileText;
  }
  
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center max-w-[80%]">
          <FileTypeIcon className="text-accent mr-2 h-4 w-4" />
          <span className="text-sm truncate" title={filename}>{filename}</span>
        </div>
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1.5 bg-background" />
    </div>
  );
}

export function UploadProgressModal() {
  const { 
    showUploadProgressModal, 
    setShowUploadProgressModal, 
    uploadProgress,
    uploadingFiles,
    cancelUploads
  } = useFileContext();
  
  if (!showUploadProgressModal) return null;
  
  const totalFiles = uploadingFiles.length;
  const completedFiles = uploadingFiles.filter(f => f.progress === 100).length;
  const overallProgress = totalFiles > 0 
    ? Math.round((uploadProgress.loaded / uploadProgress.total) * 100) || 0
    : 0;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-0 right-0 m-6 w-80 z-50"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-secondary border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Uploading Files</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setShowUploadProgressModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {uploadingFiles.slice(0, 3).map((file, index) => (
              <UploadProgressItem
                key={index}
                filename={file.name}
                progress={file.progress}
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
          
          <CardFooter className="pt-2 border-t border-border flex-col items-stretch">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-muted-foreground">
                {completedFiles} of {totalFiles} files
              </span>
            </div>
            <Progress value={overallProgress} className="h-1.5 bg-background mb-3" />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cancelUploads}
              disabled={completedFiles === totalFiles}
            >
              Cancel Uploads
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

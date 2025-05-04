import { useState } from "react";
import { motion } from "framer-motion";
import { Download, MoreVertical, Trash2, UndoIcon } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/ui/file-icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useFileContext } from "@/contexts/FileContext";

import type { FileWithMeta } from "@shared/schema";

interface FileCardProps {
  file: FileWithMeta;
  className?: string;
}

export function FileCard({ file, className }: FileCardProps) {
  const { toast } = useToast();
  const { setSelectedFile, setShowPreviewModal } = useFileContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isImage = file.type.startsWith('image/');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      // Create a direct download link
      const a = document.createElement('a');
      a.href = `/api/download/${file.id}`;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the file.",
        variant: "destructive"
      });
    }
  };

  const handleMoveToTrash = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('PATCH', `/api/files/${file.id}`, {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      toast({
        title: "Moved to Trash",
        description: `${file.name} has been moved to trash.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Could not move the file to trash.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('PATCH', `/api/files/${file.id}`, {
        isDeleted: false,
        deletedAt: null
      });
      toast({
        title: "File Restored",
        description: `${file.name} has been restored.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Could not restore the file.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermanentDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('DELETE', `/api/files/${file.id}`);
      toast({
        title: "File Deleted",
        description: `${file.name} has been permanently deleted.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the file.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      className={`bg-secondary rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${className}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
    >
      <div className="aspect-square relative bg-muted/50">
        {isImage && !imageError ? (
          <img
            src={`/api/download/${file.id}?t=${Date.now()}`} // Added cache-busting parameter
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => {
              console.error(`Image loading failed for file ID: ${file.id}`);
              setImageError(true);
            }}
            loading="lazy" // Use lazy loading for better performance
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileIcon fileType={file.type} fileName={file.name} size="xl" />
          </div>
        )}
        
        {file.isDeleted && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium truncate" title={file.name}>{file.name}</h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {file.isDeleted ? (
                <>
                  <DropdownMenuItem onClick={handleRestore}>
                    <UndoIcon className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={handlePermanentDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={handleMoveToTrash}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{file.formattedSize}</span>
          <span>
            {file.isDeleted ? 'Deleted ' : 'Modified '}
            {file.formattedDate}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
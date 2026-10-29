import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
import { cn } from "@/lib/utils";

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
  const reduceMotion = useReducedMotion();
  const isImage = file.type.startsWith('image/');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedFile(file);
      setShowPreviewModal(true);
    }
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
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
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
      className={cn(
        "group cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_18px_50px_-24px_hsl(var(--primary)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.018, transition: { type: "spring", stiffness: 280, damping: 18 } }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Preview ${file.name}`}
      aria-busy={isDeleting}
    >
      <div className="relative aspect-square bg-muted/40">
        {isImage && !imageError ? (
          <img
            src={`/api/files/${file.id}/download`}
            alt={file.name}
            className={`w-full h-full object-cover ${reduceMotion ? "" : "transition-transform duration-700 ease-out group-hover:scale-110"}`}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileIcon fileType={file.type} fileName={file.name} size="xl" />
          </div>
        )}
        
        {file.isDeleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
            <Trash2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4">
        <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-medium sm:text-base" title={file.name}>{file.name}</h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                aria-label={`Actions for ${file.name}`}
                disabled={isDeleting}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              {file.isDeleted ? (
                <>
                  <DropdownMenuItem onClick={handleRestore} disabled={isDeleting}>
                    <UndoIcon className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={handlePermanentDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleDownload} disabled={isDeleting}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={handleMoveToTrash}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">{file.formattedSize}</span>
          <span className="truncate text-right">
            {file.isDeleted ? 'Deleted ' : 'Modified '}
            {file.formattedDate}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
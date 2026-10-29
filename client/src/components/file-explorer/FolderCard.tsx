import { motion, useReducedMotion } from "framer-motion";
import { MoreVertical, Trash2, UndoIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Folder as FolderIcon } from "lucide-react";
import type { Folder } from "@shared/schema";

interface FolderCardProps {
  folder: Folder;
  fileCount: number;
  className?: string;
}

export function FolderCard({ folder, fileCount, className }: FolderCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const reduceMotion = useReducedMotion();
  
  const handleOpenFolder = () => {
    if (!folder.isDeleted) {
      setLocation(`/files/${folder.id}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (folder.isDeleted || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenFolder();
    }
  };
  
  const handleMoveToTrash = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('PATCH', `/api/folders/${folder.id}`, {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      toast({
        title: "Moved to Trash",
        description: `${folder.name} has been moved to trash.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Could not move the folder to trash.",
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
      await apiRequest('PATCH', `/api/folders/${folder.id}`, {
        isDeleted: false,
        deletedAt: null
      });
      toast({
        title: "Folder Restored",
        description: `${folder.name} has been restored.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Could not restore the folder.",
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
      await apiRequest('DELETE', `/api/folders/${folder.id}`);
      toast({
        title: "Folder Deleted",
        description: `${folder.name} has been permanently deleted.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the folder.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format the date
  const formattedDate = folder.deletedAt || folder.createdAt;
  const date = formattedDate ? new Date(formattedDate).toLocaleDateString() : 'Unknown date';
  
  return (
    <motion.div
      className={cn(
        "group overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_18px_50px_-24px_hsl(var(--primary)/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        folder.isDeleted && "opacity-75",
        !folder.isDeleted && "cursor-pointer",
        className
      )}
      whileHover={!folder.isDeleted && !reduceMotion ? { y: -6, scale: 1.018, transition: { type: "spring", stiffness: 280, damping: 18 } } : undefined}
      whileTap={!folder.isDeleted && !reduceMotion ? { scale: 0.99 } : undefined}
      onClick={handleOpenFolder}
      onKeyDown={handleKeyDown}
      role={!folder.isDeleted ? "button" : undefined}
      tabIndex={!folder.isDeleted ? 0 : undefined}
      aria-label={!folder.isDeleted ? `Open folder ${folder.name}` : undefined}
      aria-busy={isDeleting}
    >
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center mb-4">
          <div
            className={cn(
              "mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:mr-4 sm:h-12 sm:w-12",
              folder.color ? "" : "bg-accent/10 text-accent"
            )}
            style={folder.color ? { backgroundColor: `${folder.color}20` } : undefined}
          >
            <span className="flex">
              <FolderIcon
                className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6"
                style={folder.color ? { color: folder.color } : undefined}
                aria-hidden="true"
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-foreground" title={folder.name}>{folder.name}</h4>
            <p className="text-xs text-muted-foreground">
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </p>
          </div>
          
          {folder.isDeleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
              <Trash2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-xs text-muted-foreground">
            {folder.isDeleted ? 'Deleted' : 'Created'} {date}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                aria-label={`Actions for ${folder.name}`}
                disabled={isDeleting}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {folder.isDeleted ? (
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
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleMoveToTrash}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Move to Trash
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

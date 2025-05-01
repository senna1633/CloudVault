import { motion } from "framer-motion";
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
  
  const handleOpenFolder = () => {
    if (!folder.isDeleted) {
      setLocation(`/files/${folder.id}`);
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
        "bg-secondary rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all",
        folder.isDeleted && "opacity-75",
        !folder.isDeleted && "cursor-pointer",
        className
      )}
      whileHover={!folder.isDeleted ? { y: -4, transition: { duration: 0.2 } } : undefined}
      onClick={handleOpenFolder}
    >
      <div className="p-6 relative">
        <div className="flex items-center mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" 
            style={{ backgroundColor: `${folder.color || '#0A84FF'}20` }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              style={{ color: folder.color || '#0A84FF' }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-foreground">{folder.name}</h4>
            <p className="text-xs text-muted-foreground">
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </p>
          </div>
          
          {folder.isDeleted && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            {folder.isDeleted ? 'Deleted' : 'Modified'} {date}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {folder.isDeleted ? (
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
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleMoveToTrash}
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

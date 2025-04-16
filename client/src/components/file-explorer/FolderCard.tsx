import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
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
    setLocation(`/files/${folder.id}`);
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('DELETE', `/api/folders/${folder.id}`);
      toast({
        title: "Folder Deleted",
        description: `${folder.name} has been deleted.`
      });
      // Invalidate folders query to refresh the list
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
  const formattedDate = folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'Unknown date';
  
  return (
    <motion.div
      className={`bg-secondary rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${className}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleOpenFolder}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 rounded-xl bg-${folder.color || 'accent'}/20 flex items-center justify-center mr-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-${folder.color || 'accent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-foreground">{folder.name}</h4>
            <p className="text-xs text-muted-foreground">{fileCount} {fileCount === 1 ? 'file' : 'files'}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">Modified {formattedDate}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

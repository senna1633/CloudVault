import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFileContext } from "@/contexts/FileContext";
import { FileIcon } from "@/components/ui/file-icons";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FileWithMeta } from "@shared/schema";

interface FileCardProps {
  file: FileWithMeta;
  className?: string;
}

export function FileCard({ file, className }: FileCardProps) {
  const { setSelectedFile, setShowPreviewModal } = useFileContext();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handlePreview = () => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };
  
  const handleDownload = async () => {
    try {
      window.open(`/api/download/${file.id}`, '_blank');
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the file.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('DELETE', `/api/files/${file.id}`);
      toast({
        title: "File Deleted",
        description: `${file.name} has been deleted.`
      });
      // Invalidate files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files/recent'] });
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
      layoutId={`file-${file.id}`}
      className={`bg-secondary rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${className}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handlePreview}
    >
      <div className="h-32 bg-muted flex items-center justify-center p-2 overflow-hidden">
        {file.type.startsWith('image/') && file.preview ? (
          <img 
            src={file.preview} 
            alt={file.name} 
            className="object-cover h-full w-full rounded-lg" 
          />
        ) : (
          <FileIcon fileType={file.type} fileName={file.name} size="lg" />
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground truncate" title={file.name}>
            {file.name}
          </h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                Download
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {file.formattedDate}
          </span>
          <span className="text-xs text-muted-foreground">
            {file.formattedSize}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

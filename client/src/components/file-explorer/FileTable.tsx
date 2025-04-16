import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import { FileIcon } from "@/components/ui/file-icons";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import type { FileWithMeta } from "@shared/schema";

interface FileTableProps {
  files: FileWithMeta[];
  sharedView?: boolean;
}

export function FileTable({ files, sharedView = false }: FileTableProps) {
  const { setSelectedFile, setShowPreviewModal } = useFileContext();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const handlePreview = (file: FileWithMeta) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };
  
  const handleDownload = async (file: FileWithMeta) => {
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
  
  const handleDelete = async (file: FileWithMeta) => {
    if (deletingId === file.id) return;
    
    try {
      setDeletingId(file.id);
      await apiRequest('DELETE', `/api/files/${file.id}`);
      toast({
        title: "File Deleted",
        description: `${file.name} has been deleted.`
      });
      // Invalidate files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files/recent'] });
      if (sharedView) {
        queryClient.invalidateQueries({ queryKey: ['/api/files/shared'] });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the file.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  return (
    <div className="bg-secondary rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Name</th>
              {sharedView && (
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Shared By</th>
              )}
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Size</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {files.map(file => (
                <motion.tr
                  key={file.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handlePreview(file)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded flex items-center justify-center mr-3">
                        <FileIcon fileType={file.type} fileName={file.name} />
                      </div>
                      <span className="font-medium text-foreground">{file.name}</span>
                    </div>
                  </td>
                  
                  {sharedView && (
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs mr-2">
                          {file.sharedBy?.substring(0, 2) || 'US'}
                        </div>
                        <span className="text-muted-foreground">{file.sharedBy || 'Unknown'}</span>
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 text-muted-foreground">
                    {file.formattedDate}
                  </td>
                  
                  <td className="px-6 py-4 text-muted-foreground">
                    {file.formattedSize}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-accent hover:text-accent/80 transition-colors mr-2"
                      onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(file); }}>
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

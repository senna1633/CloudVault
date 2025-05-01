import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { File, Folder } from "@shared/schema";
import { FileCard } from "@/components/file-explorer/FileCard";
import { FolderCard } from "@/components/file-explorer/FolderCard";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatFileSize, formatDate } from "@/lib/fileUtils";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { ImagePreviewModal } from "@/components/modals/ImagePreviewModal";
import { Separator } from "@/components/ui/separator";
import { useFileContext } from "@/contexts/FileContext";

const cardVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  })
};

export default function Trash() {
  const { toast } = useToast();
  const { setSelectedFile, setShowPreviewModal } = useFileContext();

  // Fetch folders in trash
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/trash/folders'],
    queryFn: async () => {
      const res = await fetch('/api/trash/folders');
      if (!res.ok) throw new Error('Failed to fetch folders in trash');
      return res.json();
    }
  });

  // Fetch files in trash
  const { data: files = [], isLoading: isFilesLoading } = useQuery<File[]>({
    queryKey: ['/api/trash/files'],
    queryFn: async () => {
      const res = await fetch('/api/trash/files');
      if (!res.ok) throw new Error('Failed to fetch files in trash');
      return res.json();
    }
  });

  const handleEmptyTrash = async () => {
    try {
      await apiRequest('POST', '/api/trash/empty');
      
      toast({
        title: "Trash Emptied",
        description: "All items in trash have been permanently deleted."
      });
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['/api/trash/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trash/files'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to empty trash. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileClick = (file: File) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  // Process files to add meta information
  const filesWithMeta = files.map(file => ({
    ...file,
    extension: file.name.split('.').pop() || '',
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(file.updatedAt || file.createdAt || new Date().toISOString())
  }));

  const isLoading = isFilesLoading || isFoldersLoading;
  const hasItems = files.length > 0 || folders.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Trash</h1>
          <p className="text-sm text-muted-foreground">
            Items in trash will be automatically deleted after 30 days
          </p>
        </div>
        {hasItems && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Empty Trash?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all items in the trash.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmptyTrash}>Empty Trash</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {hasItems && <Separator className="my-6" />}
      
      {folders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Folders ({folders.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder, i) => (
              <motion.div
                key={folder.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <FolderCard 
                  folder={folder}
                  fileCount={filesWithMeta.filter(f => f.folderId === folder.id).length}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {filesWithMeta.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Files ({filesWithMeta.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filesWithMeta.map((file, i) => (
              <motion.div
                key={file.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => handleFileClick(file)}
              >
                <FileCard file={file} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : !hasItems && (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-2">Trash is Empty</h3>
          <p className="text-muted-foreground">
            Items you delete will appear here for 30 days before being permanently removed
          </p>
        </div>
      )}

      <FilePreviewModal />
      <ImagePreviewModal />
    </div>
  );
}
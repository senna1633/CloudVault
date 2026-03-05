import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { File, Folder } from "@shared/schema";
import { FileCard } from "@/components/file-explorer/FileCard";
import { FolderCard } from "@/components/file-explorer/FolderCard";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, formatDate } from "@/lib/fileUtils";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.25
    }
  })
};

export default function Trash() {
  const { toast } = useToast();

  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/trash/folders'],
    queryFn: async () => {
      const res = await fetch('/api/trash/folders');
      if (!res.ok) throw new Error('Failed to fetch folders in trash');
      return res.json();
    }
  });

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

  const filesWithMeta = files.map(file => ({
    ...file,
    extension: file.name.split('.').pop() || '',
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(file.updatedAt || file.createdAt || new Date().toISOString())
  }));

  const isLoading = isFilesLoading || isFoldersLoading;
  const hasItems = files.length > 0 || folders.length > 0;

  return (
    <>
      <Header title="Trash" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-muted-foreground">
            Items in trash will be automatically deleted after 30 days.
          </p>
          {hasItems && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-2 shrink-0"
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

        {hasItems && <Separator className="mb-6" />}
        
        {folders.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-medium mb-4 text-foreground">Folders ({folders.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
          </section>
        )}
        
        {filesWithMeta.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-medium mb-4 text-foreground">Files ({filesWithMeta.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filesWithMeta.map((file, i) => (
                <motion.div
                  key={file.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <FileCard file={file} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : !hasItems && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trash2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Trash is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Items you delete will appear here for 30 days before being permanently removed.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

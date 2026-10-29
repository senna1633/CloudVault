import React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { File, Folder } from "@shared/schema";
import { FileCard } from "@/components/file-explorer/FileCard";
import { FolderCard } from "@/components/file-explorer/FolderCard";
import { motion, useReducedMotion } from "framer-motion";
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
import Header from "@/components/layout/Header";

const cardVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.035, 0.24),
      duration: 0.28
    }
  })
};
const reducedCardVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } }
};

export default function Trash() {
  const shouldReduceMotion = useReducedMotion();
  const { toast } = useToast();
  const { setSelectedFile, setShowPreviewModal } = useFileContext();
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  // Fetch folders in trash
  const {
    data: folders = [],
    isLoading: isFoldersLoading,
    isError: isFoldersError,
    refetch: refetchFolders,
  } = useQuery<Folder[]>({
    queryKey: ['/api/trash/folders'],
    queryFn: async () => {
      const res = await fetch('/api/trash/folders');
      if (!res.ok) throw new Error('Failed to fetch folders in trash');
      return res.json();
    }
  });

  // Fetch files in trash
  const {
    data: files = [],
    isLoading: isFilesLoading,
    isError: isFilesError,
    refetch: refetchFiles,
  } = useQuery<File[]>({
    queryKey: ['/api/trash/files'],
    queryFn: async () => {
      const res = await fetch('/api/trash/files');
      if (!res.ok) throw new Error('Failed to fetch files in trash');
      return res.json();
    }
  });

  const handleEmptyTrash = async () => {
    if (isEmptyingTrash) return;
    setIsEmptyingTrash(true);
    try {
      await apiRequest('POST', '/api/trash/empty');
      
      toast({
        title: "Trash Emptied",
        description: "All items in trash have been permanently deleted."
      });
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['/api/trash/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trash/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to empty trash. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEmptyingTrash(false);
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
    <>
    <Header title="Trash" />
    <motion.main
      className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-auto px-4 py-6 sm:px-7 lg:px-10"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.04 }}
      >
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Recently deleted</p>
          <h1 className="text-3xl font-semibold tracking-tight">Trash</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Items in trash will be automatically deleted after 30 days
          </p>
        </div>
        {hasItems && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="flex w-full items-center gap-2 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
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
                <AlertDialogAction onClick={handleEmptyTrash} disabled={isEmptyingTrash}>
                  {isEmptyingTrash ? "Emptying…" : "Empty Trash"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </motion.div>

      {hasItems && <Separator className="my-6" />}

      {(isFilesError || isFoldersError) && (
        <motion.div
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-medium">Some trash items could not be loaded</p>
              <p className="mt-1 text-sm text-muted-foreground">Retry the affected section to refresh your trash.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {isFilesError && <Button variant="outline" onClick={() => refetchFiles()}>Retry files</Button>}
            {isFoldersError && <Button variant="outline" onClick={() => refetchFolders()}>Retry folders</Button>}
          </div>
        </motion.div>
      )}
      
      {folders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Folders <span className="ml-1 text-sm font-normal text-muted-foreground">({folders.length})</span></h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder, i) => (
              <motion.div
                key={folder.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={shouldReduceMotion ? reducedCardVariants : cardVariants}
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
          <h2 className="text-lg font-semibold">Files <span className="ml-1 text-sm font-normal text-muted-foreground">({filesWithMeta.length})</span></h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filesWithMeta.map((file, i) => (
              <motion.div
                key={file.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={shouldReduceMotion ? reducedCardVariants : cardVariants}
                onClick={() => handleFileClick(file)}
              >
                <FileCard file={file} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <motion.div
          aria-label="Loading trash items"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        >
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </motion.div>
      ) : !hasItems && !isFilesError && !isFoldersError && (
        <motion.div
          className="rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Trash2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Your trash is empty</h2>
          <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            Deleted files and folders will stay here for up to 30 days before being permanently removed.
          </p>
        </motion.div>
      )}

      <FilePreviewModal />
      <ImagePreviewModal />
    </motion.main>
    </>
  );
}
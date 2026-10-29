import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useParams } from "wouter";
import { FolderOpen } from "lucide-react";
import DropZone from "./DropZone";
import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";
import { FileTable } from "./FileTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFileContext } from "@/contexts/FileContext";
import { formatFileSize, formatDate } from "@/lib/fileUtils";

import type { File, Folder, FileWithMeta } from "@shared/schema";

export default function FileExplorer() {
  const params = useParams();
  const { isGridView } = useFileContext();
  const reduceMotion = useReducedMotion();
  const folderId = params.folderId ? Number(params.folderId) : null;
  
  // Fetch folders
  const {
    data: folders = [],
    isLoading: isFoldersLoading,
    isError: isFoldersError,
    refetch: refetchFolders,
  } = useQuery<Folder[]>({
    queryKey: ['/api/folders', { parentId: folderId }],
    queryFn: async () => {
      const res = await fetch(`/api/folders?parentId=${folderId || ''}`);
      if (!res.ok) throw new Error('Failed to fetch folders');
      const data = await res.json();
      return data.filter((folder: Folder) => !folder.isDeleted);
    },
  });
  
  // Fetch files
  const {
    data: files = [],
    isLoading: isFilesLoading,
    isError: isFilesError,
    refetch: refetchFiles,
  } = useQuery<File[]>({
    queryKey: ['/api/files', { folderId }],
    queryFn: async () => {
      const res = await fetch(`/api/files?folderId=${folderId || ''}`);
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      return data.filter((file: File) => !file.isDeleted);
    },
  });
  
  // Process files to add meta information
  const filesWithMeta: FileWithMeta[] = files.map(file => ({
    ...file,
    extension: file.name.split('.').pop() || '',
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(file.updatedAt || file.createdAt || new Date().toISOString())
  }));
  
  const isLoading = isFoldersLoading || isFilesLoading;
  const hasError = isFoldersError || isFilesError;
  const cardVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 140, damping: 17 },
    },
  };
  const gridVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.065, delayChildren: reduceMotion ? 0 : 0.04 },
    },
  };
  
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <DropZone />

      {hasError && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:mb-8" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground">
              {isFoldersError && isFilesError
                ? "Folders and files could not be loaded."
                : isFoldersError
                  ? "Folders could not be loaded."
                  : "Files could not be loaded."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isFoldersError) void refetchFolders();
                if (isFilesError) void refetchFiles();
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      )}
      
      {/* Folders Section */}
      {(folders.length > 0 || isFoldersLoading) && (
        <div className="mb-8 sm:mb-10">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">Folders</h3>
            <span className="text-xs text-muted-foreground">{folders.length}</span>
          </div>
          
          {isFoldersLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
              initial="hidden"
              animate="visible"
              variants={gridVariants}
            >
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <FolderCard 
                    folder={folder} 
                    fileCount={files.filter(f => f.folderId === folder.id).length}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
      
      {/* Files Section */}
      {(filesWithMeta.length > 0 || isFilesLoading) && (
        <div className="mb-8 sm:mb-10">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">Files</h3>
            <span className="text-xs text-muted-foreground">{filesWithMeta.length}</span>
          </div>
          
          {isFilesLoading ? (
            isGridView ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <Skeleton className="h-64 w-full rounded-xl" />
            )
          ) : (
            isGridView ? (
              <motion.div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
                initial="hidden"
                animate="visible"
                variants={gridVariants}
              >
                {filesWithMeta.map((file) => (
                  <motion.div
                    key={file.id}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >
                    <FileCard file={file} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <FileTable files={filesWithMeta} />
            )
          )}
        </div>
      )}
      
      {!isLoading && !hasError && folders.length === 0 && filesWithMeta.length === 0 && (
        <motion.div 
          className="rounded-xl border border-dashed border-border bg-card/60 px-5 py-12 text-center sm:py-16"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
            <FolderOpen className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="mb-2 text-lg font-semibold sm:text-xl">This folder is empty</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Upload files or create folders to populate this directory
          </p>
        </motion.div>
      )}
    </div>
  );
}

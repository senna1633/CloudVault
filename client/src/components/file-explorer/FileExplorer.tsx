import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import DropZone from "./DropZone";
import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";
import { FileTable } from "./FileTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileContext } from "@/contexts/FileContext";
import { formatFileSize, formatDate } from "@/lib/fileUtils";

import type { File, Folder, FileWithMeta } from "@shared/schema";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    }
  })
};

export default function FileExplorer() {
  const params = useParams();
  const { isGridView } = useFileContext();
  const folderId = params.folderId ? Number(params.folderId) : null;
  
  // Fetch folders
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/folders', { parentId: folderId }],
    queryFn: async () => {
      const res = await fetch(`/api/folders?parentId=${folderId || ''}`);
      if (!res.ok) throw new Error('Failed to fetch folders');
      const data = await res.json();
      return data.filter((folder: Folder) => !folder.isDeleted);
    },
  });
  
  // Fetch files
  const { data: files = [], isLoading: isFilesLoading } = useQuery<File[]>({
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
  
  return (
    <div className="flex-1 overflow-auto p-6">
      <DropZone />
      
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium">Folders</h3>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : (
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
                    fileCount={files.filter(f => f.folderId === folder.id).length}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Files Section */}
      {(filesWithMeta.length > 0 || isLoading) && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium">Files</h3>
          </div>
          
          {isLoading ? (
            isGridView ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <Skeleton className="h-64 w-full rounded-xl" />
            )
          ) : (
            isGridView ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            ) : (
              <FileTable files={filesWithMeta} />
            )
          )}
        </div>
      )}
      
      {!isLoading && folders.length === 0 && filesWithMeta.length === 0 && (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-medium mb-2">This folder is empty</h3>
          <p className="text-muted-foreground">
            Upload files or create folders to populate this directory
          </p>
        </motion.div>
      )}
    </div>
  );
}

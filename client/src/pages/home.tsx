import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { FileCard } from "@/components/file-explorer/FileCard";
import { FolderCard } from "@/components/file-explorer/FolderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { formatFileSize, formatDate } from "@/lib/fileUtils";
import { Plus, ArrowRight, Cloud } from "lucide-react";
import { useFileContext } from "@/contexts/FileContext";

import type { File, Folder, FileWithMeta } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { setShowNewFolderModal } = useFileContext();
  
  const { data: recentFiles = [], isLoading: isRecentFilesLoading } = useQuery<File[]>({
    queryKey: ['/api/files/recent'],
    queryFn: async () => {
      const res = await fetch('/api/files/recent?limit=4');
      if (!res.ok) throw new Error('Failed to fetch recent files');
      return res.json();
    },
  });
  
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/folders', { parentId: null }],
    queryFn: async () => {
      const res = await fetch('/api/folders?parentId=');
      if (!res.ok) throw new Error('Failed to fetch folders');
      return res.json();
    },
  });
  
  const filesWithMeta: FileWithMeta[] = recentFiles.map(file => ({
    ...file,
    extension: file.name.split('.').pop() || '',
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(file.updatedAt)
  }));
  
  return (
    <>
      <Header title="Dashboard" />
      
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Welcome Banner */}
        <motion.div 
          className="bg-secondary rounded-xl p-5 md:p-8 mb-6 md:mb-8 border border-border"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold mb-2 text-balance text-foreground">
                Welcome to CloudVault
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed max-w-2xl">
                Your personal cloud storage solution. Store, organize, and preview your files with ease.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setLocation('/files')}
                >
                  Explore Files <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowNewFolderModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Folder
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Recent Files Section */}
        <motion.section 
          className="mb-8 md:mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-medium text-foreground">Recent Files</h3>
            <Button 
              variant="link" 
              className="text-primary hover:text-primary/80 h-auto p-0"
              onClick={() => setLocation('/files')}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {isRecentFilesLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-xl" />
              ))
            ) : filesWithMeta.length > 0 ? (
              filesWithMeta.map((file) => (
                <FileCard key={file.id} file={file} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No recent files. Upload some files to get started.
              </div>
            )}
          </div>
        </motion.section>
        
        {/* Folders Section */}
        <motion.section 
          className="mb-8 md:mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-medium text-foreground">My Folders</h3>
            <Button 
              variant="link" 
              className="text-primary hover:text-primary/80 h-auto p-0"
              onClick={() => setLocation('/files')}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {isFoldersLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))
            ) : folders.length > 0 ? (
              folders.slice(0, 4).map((folder) => (
                <FolderCard 
                  key={folder.id} 
                  folder={folder} 
                  fileCount={0}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No folders yet. Create a folder to organize your files.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </>
  );
}

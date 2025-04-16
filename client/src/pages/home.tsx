import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { FileCard } from "@/components/file-explorer/FileCard";
import { FolderCard } from "@/components/file-explorer/FolderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { formatFileSize, formatDate } from "@/lib/fileUtils";
import { Plus, ArrowRight } from "lucide-react";
import { useFileContext } from "@/contexts/FileContext";

import type { File, Folder, FileWithMeta } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { setShowNewFolderModal } = useFileContext();
  
  // Fetch recent files
  const { data: recentFiles = [], isLoading: isRecentFilesLoading } = useQuery<File[]>({
    queryKey: ['/api/files/recent'],
    queryFn: async () => {
      const res = await fetch('/api/files/recent?limit=4');
      if (!res.ok) throw new Error('Failed to fetch recent files');
      return res.json();
    },
  });
  
  // Fetch top-level folders
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/folders', { parentId: null }],
    queryFn: async () => {
      const res = await fetch('/api/folders?parentId=');
      if (!res.ok) throw new Error('Failed to fetch folders');
      return res.json();
    },
  });
  
  // Process files to add meta information
  const filesWithMeta: FileWithMeta[] = recentFiles.map(file => ({
    ...file,
    extension: file.name.split('.').pop() || '',
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(file.updatedAt)
  }));
  
  const welcomeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({ 
      opacity: 1,
      transition: { 
        delay: i * 0.1 + 0.2,
        duration: 0.5
      }
    })
  };
  
  return (
    <>
      <Header title="Dashboard" />
      
      <div className="flex-1 overflow-auto p-6">
        <motion.div 
          className="bg-secondary rounded-xl p-8 mb-8"
          initial="hidden"
          animate="visible"
          variants={welcomeVariants}
        >
          <h1 className="text-2xl font-bold mb-3">Welcome to CloudVault</h1>
          <p className="text-muted-foreground mb-6">
            Your personal cloud storage solution, inspired by Apple's design language.
            Store, organize, and preview your files with ease.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              className="bg-accent hover:bg-accent/90"
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
        </motion.div>
        
        {/* Recent Files Section */}
        <motion.div 
          className="mb-10"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium">Recent Files</h3>
            <Button 
              variant="link" 
              className="text-accent hover:text-accent/80"
              onClick={() => setLocation('/files')}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isRecentFilesLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))
            ) : filesWithMeta.length > 0 ? (
              filesWithMeta.map((file) => (
                <FileCard key={file.id} file={file} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No recent files. Upload some files to get started.
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Folders Section */}
        <motion.div 
          className="mb-10"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium">My Folders</h3>
            <Button 
              variant="link" 
              className="text-accent hover:text-accent/80"
              onClick={() => setLocation('/files')}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isFoldersLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : folders.length > 0 ? (
              folders.slice(0, 4).map((folder) => (
                <FolderCard 
                  key={folder.id} 
                  folder={folder} 
                  fileCount={0} // We don't have file counts here, would need a separate API call
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No folders yet. Create a folder to organize your files.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

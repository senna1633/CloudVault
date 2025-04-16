import React, { createContext, useContext, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { FileWithMeta } from "@shared/schema";

interface FileContextType {
  // UI state
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
  
  // Selected file for preview
  selectedFile: FileWithMeta | null;
  setSelectedFile: (file: FileWithMeta | null) => void;
  
  // Modal states
  showPreviewModal: boolean;
  setShowPreviewModal: (show: boolean) => void;
  showNewFolderModal: boolean;
  setShowNewFolderModal: (show: boolean) => void;
  showUploadProgressModal: boolean;
  setShowUploadProgressModal: (show: boolean) => void;
  
  // Upload status tracking
  uploadingFiles: {
    name: string;
    size: number;
    type: string;
    progress: number;
  }[];
  uploadProgress: {
    loaded: number;
    total: number;
  };
  uploadFiles: (files: File[], folderId: number | null) => void;
  cancelUploads: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI state
  const [isGridView, setIsGridView] = useState(true);
  
  // Selected file for preview
  const [selectedFile, setSelectedFile] = useState<FileWithMeta | null>(null);
  
  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUploadProgressModal, setShowUploadProgressModal] = useState(false);
  
  // Upload tracking
  const [uploadingFiles, setUploadingFiles] = useState<FileContextType['uploadingFiles']>([]);
  const [uploadProgress, setUploadProgress] = useState<FileContextType['uploadProgress']>({
    loaded: 0,
    total: 0
  });
  const { toast } = useToast();
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const uploadFiles = useCallback(async (files: File[], folderId: number | null) => {
    if (files.length === 0) return;
    
    // Initialize uploading files with 0% progress
    setUploadingFiles(files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0
    })));
    
    setUploadProgress({
      loaded: 0,
      total: files.reduce((sum, file) => sum + file.size, 0)
    });
    
    setShowUploadProgressModal(true);
    
    try {
      // Create a new AbortController for this upload
      const controller = new AbortController();
      setAbortController(controller);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (folderId !== null) {
        formData.append('folderId', folderId.toString());
      }
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const loaded = event.loaded;
          const total = event.total;
          const percent = Math.round((loaded / total) * 100);
          
          // Update the overall progress
          setUploadProgress({ loaded, total });
          
          // Update individual file progress (approximate)
          setUploadingFiles(prevFiles => {
            const newFiles = [...prevFiles];
            // Distribute progress across all files proportionally
            const progressPerFile = percent / files.length;
            for (let i = 0; i < newFiles.length; i++) {
              newFiles[i].progress = Math.min(100, progressPerFile * (i + 1));
            }
            return newFiles;
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // On success
          setUploadingFiles(prev => prev.map(file => ({...file, progress: 100})));
          
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${files.length} files.`
          });
          
          // Invalidate queries to refresh file lists
          queryClient.invalidateQueries({ queryKey: ['/api/files'] });
          queryClient.invalidateQueries({ queryKey: ['/api/files/recent'] });
          
          // Close the modal after a short delay
          setTimeout(() => {
            setShowUploadProgressModal(false);
            setUploadingFiles([]);
          }, 2000);
        } else {
          // On error
          toast({
            title: "Upload Failed",
            description: "An error occurred while uploading files.",
            variant: "destructive"
          });
        }
        
        setAbortController(null);
      });
      
      xhr.addEventListener('error', () => {
        toast({
          title: "Upload Failed",
          description: "A network error occurred while uploading files.",
          variant: "destructive"
        });
        
        setAbortController(null);
      });
      
      xhr.addEventListener('abort', () => {
        toast({
          title: "Upload Cancelled",
          description: "The file upload was cancelled."
        });
        
        setAbortController(null);
      });
      
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
      
      // Add abort listener
      controller.signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading files.",
        variant: "destructive"
      });
      setAbortController(null);
    }
  }, [toast]);
  
  const cancelUploads = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      
      // Reset upload state
      setUploadingFiles([]);
      setUploadProgress({ loaded: 0, total: 0 });
      setShowUploadProgressModal(false);
    }
  }, [abortController]);
  
  const value = {
    isGridView,
    setIsGridView,
    selectedFile,
    setSelectedFile,
    showPreviewModal,
    setShowPreviewModal,
    showNewFolderModal,
    setShowNewFolderModal,
    showUploadProgressModal,
    setShowUploadProgressModal,
    uploadingFiles,
    uploadProgress,
    uploadFiles,
    cancelUploads
  };
  
  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};

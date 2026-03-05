import React, { createContext, useContext, useState, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FileWithMeta } from "@shared/schema";

interface UploadingFile {
  name: string;
  size: number;
  type: string;
  progress: number;
}

interface FileContextType {
  isGridView: boolean;
  setIsGridView: React.Dispatch<React.SetStateAction<boolean>>;
  uploadFiles: (files: File[], folderId: number | null) => Promise<void>;
  showNewFolderModal: boolean;
  setShowNewFolderModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedFile: FileWithMeta | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileWithMeta | null>>;
  showPreviewModal: boolean;
  setShowPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
  showUploadProgressModal: boolean;
  setShowUploadProgressModal: React.Dispatch<React.SetStateAction<boolean>>;
  uploadProgress: { loaded: number; total: number };
  uploadingFiles: UploadingFile[];
  cancelUploads: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGridView, setIsGridView] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithMeta | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUploadProgressModal, setShowUploadProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ loaded: 0, total: 0 });
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const cancelUploads = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowUploadProgressModal(false);
    setUploadingFiles([]);
    setUploadProgress({ loaded: 0, total: 0 });
  }, [abortController]);

  const uploadFiles = useCallback(async (files: File[], folderId: number | null) => {
    if (files.length === 0) return;

    const controller = new AbortController();
    setAbortController(controller);

    const fileMeta = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      progress: 0,
    }));
    setUploadingFiles(fileMeta);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    setUploadProgress({ loaded: 0, total: totalSize });
    setShowUploadProgressModal(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });

      if (folderId !== null) {
        formData.append("folderId", folderId.toString());
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to upload files");
      }

      // Mark all files as complete
      setUploadingFiles(prev => prev.map(f => ({ ...f, progress: 100 })));
      setUploadProgress({ loaded: totalSize, total: totalSize });

      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
      toast({
        title: "Upload Complete",
        description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully.`,
      });

      setTimeout(() => {
        setShowUploadProgressModal(false);
        setUploadingFiles([]);
        setUploadProgress({ loaded: 0, total: 0 });
      }, 2000);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading files.",
        variant: "destructive",
      });
      setShowUploadProgressModal(false);
      setUploadingFiles([]);
      setUploadProgress({ loaded: 0, total: 0 });
    }
  }, [toast]);

  return (
    <FileContext.Provider value={{
      isGridView,
      setIsGridView,
      uploadFiles,
      showNewFolderModal,
      setShowNewFolderModal,
      selectedFile,
      setSelectedFile,
      showPreviewModal,
      setShowPreviewModal,
      showUploadProgressModal,
      setShowUploadProgressModal,
      uploadProgress,
      uploadingFiles,
      cancelUploads,
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = (): FileContextType => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};

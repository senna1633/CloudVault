import React, { createContext, useContext, useState, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FileWithMeta } from "@shared/schema";

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
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGridView, setIsGridView] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithMeta | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();

  const uploadFiles = useCallback(async (files: File[], folderId: number | null) => {
    if (files.length === 0) return;

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
      });

      if (!res.ok) {
        throw new Error("Failed to upload files");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Upload Complete",
        description: "Files uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading files.",
        variant: "destructive",
      });
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
      setShowPreviewModal
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
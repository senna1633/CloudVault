import React, { createContext, useContext, useState, useCallback, useRef } from "react";
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
  showUploadProgressModal: boolean;
  setShowUploadProgressModal: React.Dispatch<React.SetStateAction<boolean>>;
  uploadProgress: { loaded: number; total: number };
  uploadingFiles: UploadingFile[];
  uploadStatus: "idle" | "uploading" | "complete" | "partial" | "failed" | "cancelled";
  cancelUploads: () => void;
}

interface UploadingFile {
  name: string;
  size: number;
  type: string;
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
  const [uploadStatus, setUploadStatus] = useState<FileContextType["uploadStatus"]>("idle");
  const uploadRequest = useRef<XMLHttpRequest | null>(null);
  const { toast } = useToast();

  const uploadFiles = useCallback(async (files: File[], folderId: number | null) => {
    if (files.length === 0) return;
    if (uploadRequest.current) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for the current upload to finish.",
      });
      return;
    }

    setUploadingFiles(files.map(({ name, size, type }) => ({
      name,
      size,
      type,
    })));
    setUploadProgress({ loaded: 0, total: 0 });
    setUploadStatus("uploading");
    setShowUploadProgressModal(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });

      if (folderId !== null) {
        formData.append("folderId", folderId.toString());
      }

      await new Promise<{ errors?: { filename?: string; message?: string }[] }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        uploadRequest.current = request;
        request.open("POST", "/api/upload");
        request.withCredentials = true;

        request.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable) return;
          setUploadProgress({
            loaded: Math.min(event.loaded, event.total),
            total: event.total,
          });
        });

        request.addEventListener("load", () => {
          if (request.status < 200 || request.status >= 300) {
            let message = "Failed to upload files.";
            try {
              const response = JSON.parse(request.responseText);
              if (typeof response.message === "string") message = response.message;
            } catch {
              // Keep the generic message when the server does not return JSON.
            }
            reject(new Error(message));
            return;
          }
          let response: { errors?: { filename?: string; message?: string }[] } = {};
          try {
            response = JSON.parse(request.responseText);
          } catch {
            // A successful response may have no body.
          }
          resolve(response);
        });
        request.addEventListener("error", () => {
          reject(new Error("A network error occurred while uploading files"));
        });
        request.addEventListener("abort", () => {
          reject(new DOMException("Upload cancelled", "AbortError"));
        });
        request.send(formData);
      }).then((response) => {
        setUploadProgress(current => ({
          loaded: current.total || 1,
          total: current.total || 1,
        }));
        queryClient.invalidateQueries({ queryKey: ["/api/files"] });
        queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
        if (response.errors?.length) {
          setUploadStatus("partial");
          const failedFiles = response.errors
            .map(error => error.filename)
            .filter((name): name is string => Boolean(name));
          toast({
            title: "Upload Partially Complete",
            description: failedFiles.length
              ? `Could not upload: ${failedFiles.join(", ")}`
              : "Some files could not be uploaded.",
            variant: "destructive",
          });
          return;
        }
        setUploadStatus("complete");
        toast({
          title: "Upload Complete",
          description: "Files uploaded successfully.",
        });
      });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/storage"] });
      if (error instanceof Error && error.name === "AbortError") {
        setUploadStatus("cancelled");
        return;
      }
      setUploadStatus("failed");
      toast({
        title: "Upload Failed",
        description: error instanceof Error
          ? error.message
          : "An error occurred while uploading files.",
        variant: "destructive",
      });
    } finally {
      uploadRequest.current = null;
    }
  }, [toast]);

  const cancelUploads = useCallback(() => {
    uploadRequest.current?.abort();
  }, []);

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
      uploadStatus,
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
import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileContext } from "@/contexts/FileContext";

export default function DropZone() {
  const params = useParams();
  const [isDragActive, setIsDragActive] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { uploadFiles } = useFileContext();
  
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files, params.folderId ? Number(params.folderId) : null);
    }
  }, [uploadFiles, params.folderId]);
  
  const handleBrowseClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        uploadFiles(Array.from(files), params.folderId ? Number(params.folderId) : null);
      }
    };
    input.click();
  };
  
  return (
    <motion.div
      ref={dropZoneRef}
      className={`border-2 border-dashed ${isDragActive ? 'border-accent bg-accent/10' : 'border-border'} rounded-xl p-8 mb-8 flex flex-col items-center justify-center transition-colors`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-muted/30 p-4 rounded-full mb-4">
        <Upload className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-lg font-medium mb-2">Drop files here to upload</h3>
      <p className="text-muted-foreground text-sm mb-4">or</p>
      <Button 
        className="bg-accent hover:bg-accent/90" 
        onClick={handleBrowseClick}
      >
        Browse Files
      </Button>
    </motion.div>
  );
}

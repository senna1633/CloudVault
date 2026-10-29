import React, { useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useParams } from "wouter";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileContext } from "@/contexts/FileContext";

export default function DropZone() {
  const params = useParams();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const { uploadFiles } = useFileContext();
  const folderId = params.folderId ? Number(params.folderId) : null;
  
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragActive(false);
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files, folderId);
    }
  }, [uploadFiles, folderId]);
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <motion.div
      className={`mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors sm:mb-8 sm:p-7 ${isDragActive ? "border-accent bg-accent/10" : "border-border bg-card/60 hover:border-accent/50"}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      role="region"
      aria-label="File upload drop zone"
    >
      <div className="mb-3 rounded-full bg-accent/10 p-3 sm:mb-4 sm:p-4">
        <Upload className="h-6 w-6 text-accent" />
      </div>
      <h3 className="mb-1 text-base font-semibold sm:text-lg">Drop files here to upload</h3>
      <p className="mb-3 text-sm text-muted-foreground sm:mb-4">or choose files from your device</p>
      <Button onClick={handleBrowseClick}>
        Browse Files
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="Choose files to upload"
        onChange={(event) => {
          const files = event.currentTarget.files;
          if (files?.length) uploadFiles(Array.from(files), folderId);
          event.currentTarget.value = "";
        }}
      />
    </motion.div>
  );
}

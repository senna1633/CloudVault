import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, formatDate, isImageFile } from "@/lib/fileUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePreviewModal } from "@/components/modals/ImagePreviewModal";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Grid2x2 } from "lucide-react";
import { useFileContext } from "@/contexts/FileContext";
import Header from "@/components/layout/Header";
import type { File, FileWithMeta } from "@shared/schema";

const cardVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 10
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.25,
      ease: "easeOut"
    }
  })
};

export default function Photos() {
  const { toast } = useToast();
  const { setSelectedFile, setShowPreviewModal } = useFileContext();
  const [isMasonryLayout, setIsMasonryLayout] = useState(true);

  const { data: photos = [], isLoading } = useQuery<FileWithMeta[]>({
    queryKey: ['/api/photos'],
    queryFn: async () => {
      const res = await fetch('/api/photos');
      if (!res.ok) throw new Error('Failed to fetch photos');
      const data: File[] = await res.json();
      return data.filter(file => isImageFile(file.type)).map((file: File) => ({
        ...file,
        formattedDate: formatDate(file.updatedAt || file.createdAt || new Date().toISOString()),
        formattedSize: formatFileSize(file.size),
        extension: file.name.split('.').pop() || ''
      }));
    }
  });

  const handleImageClick = (file: FileWithMeta) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const toggleLayout = () => {
    setIsMasonryLayout(!isMasonryLayout);
  };

  return (
    <>
      <Header title="Photos" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
          </p>
          <Button variant="ghost" size="icon" onClick={toggleLayout} aria-label="Toggle layout">
            {isMasonryLayout ? <LayoutGrid className="h-5 w-5" /> : <Grid2x2 className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className={isMasonryLayout 
          ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4" 
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        }>
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className={`${isMasonryLayout ? 'break-inside-avoid mb-4' : ''} h-48 w-full rounded-lg`} />
            ))
          ) : photos.length > 0 ? (
            photos.map((file, i) => (
              <motion.div
                key={file.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={isMasonryLayout ? "break-inside-avoid mb-4" : ""}
              >
                <div
                  className="relative rounded-lg overflow-hidden bg-secondary cursor-pointer group"
                  onClick={() => handleImageClick(file)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${file.name}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleImageClick(file); }}
                >
                  <img
                    src={`/api/download/${file.id}`}
                    alt={file.name}
                    className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isMasonryLayout ? '' : 'aspect-square'}`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-foreground text-sm font-medium truncate mb-0.5">{file.name}</h4>
                      <p className="text-muted-foreground text-xs">{file.formattedDate}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <h3 className="text-lg font-medium mb-2 text-foreground">No photos found</h3>
              <p className="text-muted-foreground text-sm">
                Upload some photos to get started. Supported formats: JPG, PNG, GIF, WebP, and more.
              </p>
            </div>
          )}
        </div>

        <ImagePreviewModal />
      </div>
    </>
  );
}

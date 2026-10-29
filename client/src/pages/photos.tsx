import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { formatFileSize, formatDate, isImageFile } from "@/lib/fileUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePreviewModal } from "@/components/modals/ImagePreviewModal";
import { Button } from "@/components/ui/button";
import { ImageOff, LayoutGrid, Grid2x2, Upload } from "lucide-react";
import { useFileContext } from "@/contexts/FileContext";
import Header from "@/components/layout/Header";
import type { File, FileWithMeta } from "@shared/schema";

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 22
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.055, 0.35),
      type: "spring",
      stiffness: 140,
      damping: 17
    }
  })
};
const reducedCardVariants = {
  hidden: { opacity: 1, scale: 1, y: 0 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0 } }
};

export default function Photos() {
  const shouldReduceMotion = useReducedMotion();
  const { setSelectedFile, setShowPreviewModal, uploadFiles, uploadStatus } = useFileContext();
  const [isMasonryLayout, setIsMasonryLayout] = useState(true);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Set<number>>(() => new Set());
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<number>>(() => new Set());
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: photos = [], isLoading, isError, isFetching, refetch } = useQuery<FileWithMeta[]>({
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
      <motion.main
        className="mx-auto w-full max-w-[1600px] flex-1 overflow-auto px-4 py-6 sm:px-7 lg:px-10"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        <motion.section
          aria-labelledby="photos-heading"
          className="mb-8 flex flex-wrap items-end justify-between gap-5"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.04 }}
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your library</p>
            <h1 id="photos-heading" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Photos</h1>
            <p className="mt-2 text-sm text-muted-foreground">A visual home for the moments you’ve saved.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/bmp,image/tiff"
              multiple
              className="sr-only"
              aria-label="Choose photos to upload"
              onChange={(event) => {
                const files = event.currentTarget.files;
                if (files?.length) void uploadFiles(Array.from(files), null);
                event.currentTarget.value = "";
              }}
            />
            <Button
              variant="default"
              className="h-10 rounded-xl shadow-sm"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadStatus === "uploading"}
            >
              <motion.span
                className="mr-2 flex"
                whileHover={shouldReduceMotion ? undefined : { y: -2, rotate: -8 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
              </motion.span>
              {uploadStatus === "uploading" ? "Uploading…" : "Add photos"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleLayout}
              className="h-10 w-10 rounded-xl"
              aria-label={`Switch to ${isMasonryLayout ? "grid" : "masonry"} layout`}
              aria-pressed={!isMasonryLayout}
            >
              <motion.span
                key={isMasonryLayout ? "masonry" : "grid"}
                initial={shouldReduceMotion ? false : { rotate: -90, scale: 0.65, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }}
              >
                {isMasonryLayout ? <LayoutGrid className="h-5 w-5" aria-hidden="true" /> : <Grid2x2 className="h-5 w-5" aria-hidden="true" />}
              </motion.span>
            </Button>
          </div>
        </motion.section>

        {!isLoading && !isError && photos.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </p>
          </div>
        )}

        {isLoading ? (
          <motion.div
            className={isMasonryLayout ? "columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4" : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}
            aria-label="Loading photos"
            aria-busy="true"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={isMasonryLayout ? "mb-5 break-inside-avoid" : ""}>
                <Skeleton className={`w-full rounded-2xl ${i % 3 === 1 ? "h-64" : "h-48"}`} />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </motion.div>
        ) : isError ? (
          <motion.div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-card px-6 py-12 text-center shadow-sm"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Photos couldn’t be loaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" className="mt-5" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "Trying again…" : "Try again"}
            </Button>
          </motion.div>
        ) : photos.length > 0 ? (
          <motion.div
            layout
            className={isMasonryLayout ? "columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4" : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 100, damping: 20 }}
          >
            {photos.map((file, i) => {
              const isImageLoaded = loadedPhotoIds.has(file.id);
              const hasImageFailed = failedPhotoIds.has(file.id);

              return (
                <motion.article
                  key={file.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={shouldReduceMotion ? reducedCardVariants : cardVariants}
                  whileHover={shouldReduceMotion ? undefined : {
                    y: -7,
                    scale: 1.018,
                    rotateX: 1.5,
                    transition: { type: "spring", stiffness: 250, damping: 18 },
                  }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                  layout
                  className={isMasonryLayout ? "mb-5 break-inside-avoid" : ""}
                >
                  <div className={`group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm ${shouldReduceMotion ? "transition-colors duration-150 hover:border-border" : "transition duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-background/30"}`}>
                    <button
                      type="button"
                      className="relative block w-full overflow-hidden bg-muted/40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      onClick={() => handleImageClick(file)}
                      aria-label={`Preview ${file.name}`}
                    >
                      <div className={`relative w-full ${isMasonryLayout ? "min-h-40" : "aspect-square"}`}>
                        {!hasImageFailed && !isImageLoaded && (
                          <Skeleton className="absolute inset-0 h-full w-full rounded-none" aria-hidden="true" />
                        )}
                        {hasImageFailed ? (
                          <div
                            className={`flex w-full flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground ${isMasonryLayout ? "min-h-52" : "aspect-square"}`}
                            role="img"
                            aria-label={`Preview unavailable for ${file.name}`}
                          >
                            <ImageOff className="h-7 w-7" aria-hidden="true" />
                            <span className="text-sm">Preview unavailable</span>
                          </div>
                        ) : (
                          <img
                            src={`/api/files/${file.id}/download`}
                            alt={file.name}
                            className={`block w-full object-cover ${shouldReduceMotion ? "transition-opacity duration-150" : "transition-[transform,opacity] duration-700 ease-out group-hover:scale-110"} ${isMasonryLayout ? "h-auto" : "h-full aspect-square"} ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                            loading="lazy"
                            onLoad={() => setLoadedPhotoIds(current => new Set(current).add(file.id))}
                            onError={() => setFailedPhotoIds(current => new Set(current).add(file.id))}
                          />
                        )}
                        {!hasImageFailed && (
                          <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-background/90 via-background/10 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <span className="text-sm font-medium text-foreground">Open preview</span>
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="min-w-0 px-3.5 py-3">
                      <h2 className="truncate text-sm font-medium text-foreground" title={file.name}>{file.name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <time dateTime={file.updatedAt || file.createdAt || undefined}>{file.formattedDate}</time>
                        <span aria-hidden="true">·</span>
                        <span>{file.formattedSize}</span>
                        {file.extension && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="uppercase">{file.extension}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutGrid className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">No photos yet</h2>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
              Upload photos to start building your visual library. JPG, PNG, GIF, WebP, and more are supported.
            </p>
            <Button
              className="mt-6"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadStatus === "uploading"}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Add photos
            </Button>
          </motion.div>
        )}

        <ImagePreviewModal />
      </motion.main>
    </>
  );
}

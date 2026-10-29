import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight, FolderPlus, Images, Sparkles } from "lucide-react";
import { FileCard } from "@/components/file-explorer/FileCard";
import { FolderCard } from "@/components/file-explorer/FolderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { formatFileSize, formatDate } from "@/lib/fileUtils";
import { useFileContext } from "@/contexts/FileContext";

import type { File, Folder, FileWithMeta } from "@shared/schema";

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.14 + 0.12, duration: 0.55, ease: "easeOut" },
  }),
};
const reducedSectionVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};
const heroActionVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 17 },
  },
};

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const [, setLocation] = useLocation();
  const { setShowNewFolderModal } = useFileContext();

  const {
    data: recentFiles = [],
    isLoading: isRecentFilesLoading,
    isError: isRecentFilesError,
    refetch: refetchRecentFiles,
  } = useQuery<File[]>({
    queryKey: ["/api/files/recent"],
    queryFn: async () => {
      const res = await fetch("/api/files/recent?limit=4");
      if (!res.ok) throw new Error("Failed to fetch recent files");
      return res.json();
    },
  });

  const {
    data: folders = [],
    isLoading: isFoldersLoading,
    isError: isFoldersError,
    refetch: refetchFolders,
  } = useQuery<Folder[]>({
    queryKey: ["/api/folders", { parentId: null }],
    queryFn: async () => {
      const res = await fetch("/api/folders?parentId=");
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const filesWithMeta: FileWithMeta[] = recentFiles.map((file) => ({
    ...file,
    extension: file.name.split(".").pop() || "",
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(
      file.updatedAt || file.createdAt || new Date().toISOString(),
    ),
  }));

  return (
    <>
      <Header title="Dashboard" />

      <motion.main
        className="flex-1 overflow-auto px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        <motion.section
          aria-labelledby="welcome-heading"
          className="relative mb-10 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary p-6 shadow-sm sm:p-8 lg:mb-12 lg:p-10"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18 }}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl sm:h-96 sm:w-96"
            animate={shouldReduceMotion ? undefined : { x: [0, -55, 24, 0], y: [0, 38, 72, 0], scale: [1, 1.18, 0.92, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-36 right-[18%] h-64 w-64 rounded-full bg-accent/10 blur-3xl"
            animate={shouldReduceMotion ? undefined : { x: [0, 45, -35, 0], y: [0, -30, -72, 0], opacity: [0.35, 0.8, 0.45, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative max-w-3xl">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 16, delay: 0.15 }}
            >
              <motion.span
                animate={shouldReduceMotion ? undefined : { rotate: [0, 15, -12, 0], scale: [1, 1.35, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </motion.span>
              Your space, in sync
            </motion.div>
            <motion.h1
              id="welcome-heading"
              className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 17, delay: 0.2 }}
            >
              Welcome to CloudVault
            </motion.h1>
            <motion.p
              className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.28 }}
            >
              Your files, photos, and folders—all in one place. Pick up where
              you left off or make room for something new.
            </motion.p>

            <motion.div
              className="mt-7 flex flex-wrap gap-3"
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { delayChildren: 0.32, staggerChildren: 0.09 } },
              }}
            >
              <motion.div
                variants={shouldReduceMotion ? reducedSectionVariants : heroActionVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              >
                <Button
                  className="h-11 rounded-xl px-5 shadow-sm"
                  onClick={() => setLocation("/files")}
                >
                  Explore files
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              </motion.div>
              <motion.div
                variants={shouldReduceMotion ? reducedSectionVariants : heroActionVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              >
                <Button
                  variant="outline"
                  className="h-11 rounded-xl bg-background/70 px-5"
                  onClick={() => setShowNewFolderModal(true)}
                >
                  <FolderPlus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Create folder
                </Button>
              </motion.div>
              <motion.div
                variants={shouldReduceMotion ? reducedSectionVariants : heroActionVariants}
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              >
                <Button
                  variant="ghost"
                  className="h-11 rounded-xl px-4"
                  onClick={() => setLocation("/photos")}
                >
                  <Images className="mr-1 h-4 w-4" aria-hidden="true" />
                  Browse photos
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          aria-labelledby="recent-files-heading"
          className="mb-10 lg:mb-12"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? reducedSectionVariants : sectionVariants}
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Picked up where you left off
              </p>
              <h2
                id="recent-files-heading"
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Recent files
              </h2>
            </div>
            <Button
              variant="ghost"
              className="shrink-0 rounded-lg text-primary"
              onClick={() => setLocation("/files")}
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-busy={isRecentFilesLoading}
          >
            {isRecentFilesLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-64 w-full rounded-xl"
                  aria-hidden="true"
                />
              ))
            ) : isRecentFilesError ? (
              <div
                role="alert"
                className="col-span-full rounded-2xl border border-border bg-card px-6 py-8 text-center"
              >
                <p className="mb-4 text-muted-foreground">
                  Recent files couldn’t be loaded. Check your connection and try
                  again.
                </p>
                <Button variant="outline" onClick={() => refetchRecentFiles()}>
                  Try again
                </Button>
              </div>
            ) : filesWithMeta.length > 0 ? (
              filesWithMeta.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.93, rotateX: 6 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 115, damping: 16, delay: Math.min(index * 0.075, 0.3) + 0.12 }}
                >
                  <FileCard file={file} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/60 px-6 py-9 text-center sm:py-10">
                <p className="mb-2 font-medium">Nothing here just yet</p>
                <p className="mb-5 text-sm text-muted-foreground">
                  Your recently updated files will show up here.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/files")}
                >
                  Explore files
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          aria-labelledby="folders-heading"
          className="mb-8"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? reducedSectionVariants : sectionVariants}
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Keep everything in its place
              </p>
              <h2
                id="folders-heading"
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                My folders
              </h2>
            </div>
            <Button
              variant="ghost"
              className="shrink-0 rounded-lg text-primary"
              onClick={() => setLocation("/files")}
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-busy={isFoldersLoading}
          >
            {isFoldersLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-32 w-full rounded-xl"
                  aria-hidden="true"
                />
              ))
            ) : isFoldersError ? (
              <div
                role="alert"
                className="col-span-full rounded-2xl border border-border bg-card px-6 py-8 text-center"
              >
                <p className="mb-4 text-muted-foreground">
                  Your folders couldn’t be loaded. Please try again.
                </p>
                <Button variant="outline" onClick={() => refetchFolders()}>
                  Try again
                </Button>
              </div>
            ) : folders.length > 0 ? (
              folders.slice(0, 4).map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 125, damping: 17, delay: Math.min(index * 0.075, 0.3) + 0.1 }}
                >
                  <FolderCard folder={folder} fileCount={0} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/60 px-6 py-9 text-center sm:py-10">
                <p className="mb-2 font-medium">Start with a folder</p>
                <p className="mb-5 text-sm text-muted-foreground">
                  Create a space to keep related files together.
                </p>
                <Button onClick={() => setShowNewFolderModal(true)}>
                  <FolderPlus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Create folder
                </Button>
              </div>
            )}
          </div>
        </motion.section>
      </motion.main>
    </>
  );
}

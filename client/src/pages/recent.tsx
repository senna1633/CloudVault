import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import type { File, FileWithMeta } from "@shared/schema";
import { FileCard } from "@/components/file-explorer/FileCard";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatFileSize } from "@/lib/fileUtils";
import { AlertCircle, FolderClock } from "lucide-react";

export default function RecentPage() {
  const shouldReduceMotion = useReducedMotion();
  const { data: files = [], isLoading, isError, refetch } = useQuery<FileWithMeta[]>({
    queryKey: ["/api/files/recent", { limit: 50 }],
    queryFn: async () => {
      const response = await fetch("/api/files/recent?limit=50");
      if (!response.ok) throw new Error("Failed to fetch recent files");
      const recentFiles: File[] = await response.json();
      return recentFiles.map((file) => ({
        ...file,
        extension: file.name.split(".").pop() || "",
        formattedSize: formatFileSize(file.size),
        formattedDate: formatDate(file.updatedAt || file.createdAt || new Date().toISOString()),
      }));
    },
  });

  return (
    <>
      <Header title="Recent" />
      <motion.main
        className="w-full flex-1 overflow-auto px-4 py-6 sm:px-7 lg:px-10"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-[1600px]">
          <motion.div
            className="mb-7"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.04 }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your activity</p>
            <h1 className="text-3xl font-semibold tracking-tight">Recent files</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick up where you left off with your latest files.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 8 }, (_, index) => (
                <motion.div
                  key={index}
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2, delay: shouldReduceMotion ? 0 : index * 0.025 }}
                >
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </motion.div>
              ))
            ) : isError ? (
              <motion.div
                role="alert"
                className="col-span-full rounded-2xl border border-border bg-card px-6 py-12 text-center"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mb-2 text-lg font-semibold">Recent files unavailable</h2>
                <p className="mb-5 text-sm text-muted-foreground">We couldn’t load your recent activity. Check your connection and try again.</p>
                <Button variant="outline" onClick={() => refetch()}>Try again</Button>
              </motion.div>
            ) : files.length ? (
              files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.28, delay: shouldReduceMotion ? 0 : Math.min(index * 0.035, 0.28) }}
                >
                  <FileCard file={file} />
                </motion.div>
              ))
            ) : (
              <motion.div
                className="col-span-full rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FolderClock className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mb-2 text-xl font-semibold">Nothing here yet</h2>
                <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
                  Files you open or update will appear here, ready for you to jump back in.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.main>
    </>
  );
}

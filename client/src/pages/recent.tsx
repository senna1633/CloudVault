import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import { FileCard } from "@/components/file-explorer/FileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize, formatDate } from "@/lib/fileUtils";
import type { File, FileWithMeta } from "@shared/schema";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.25,
    }
  })
};

export default function RecentPage() {
  const { data: recentFiles = [], isLoading } = useQuery<File[]>({
    queryKey: ['/api/files/recent'],
    queryFn: async () => {
      const res = await fetch('/api/files/recent?limit=20');
      if (!res.ok) throw new Error('Failed to fetch recent files');
      return res.json();
    },
  });

  const filesWithMeta: FileWithMeta[] = recentFiles.map(file => ({
    ...file,
    extension: file.name.split('.').pop() || '',
    formattedSize: formatFileSize(file.size),
    formattedDate: formatDate(file.updatedAt || file.createdAt || new Date().toISOString())
  }));

  return (
    <>
      <Header title="Recent" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <p className="text-sm text-muted-foreground mb-6">
          Your recently accessed and modified files.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : filesWithMeta.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filesWithMeta.map((file, i) => (
              <motion.div
                key={file.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <FileCard file={file} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">No recent files</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Files you access or modify will show up here for quick access.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

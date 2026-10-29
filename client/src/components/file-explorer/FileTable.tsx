import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, MoreVertical, Trash2, UndoIcon } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import { FileIcon } from "@/components/ui/file-icons";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

import type { FileWithMeta } from "@shared/schema";

interface FileTableProps {
  files: FileWithMeta[];
  sharedView?: boolean;
}

export function FileTable({ files, sharedView = false }: FileTableProps) {
  const { toast } = useToast();
  const { setSelectedFile, setShowPreviewModal } = useFileContext();
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const reduceMotion = useReducedMotion();
  const selectedCount = files.filter(file => selectedFiles.includes(file.id)).length;
  const selectAllState = files.length > 0 && selectedCount === files.length
    ? true
    : selectedCount > 0
      ? "indeterminate"
      : false;
  
  const handleFileClick = (file: FileWithMeta) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const handleDownload = async (file: FileWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/download/${file.id}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the file.",
        variant: "destructive"
      });
    }
  };

  const handleMoveToTrash = async (file: FileWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest('PATCH', `/api/files/${file.id}`, {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      toast({
        title: "Moved to Trash",
        description: `${file.name} has been moved to trash.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Could not move the file to trash.",
        variant: "destructive"
      });
    }
  };

  const handleRestore = async (file: FileWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest('PATCH', `/api/files/${file.id}`, {
        isDeleted: false,
        deletedAt: null
      });
      toast({
        title: "File Restored",
        description: `${file.name} has been restored.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Could not restore the file.",
        variant: "destructive"
      });
    }
  };

  const handlePermanentDelete = async (file: FileWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest('DELETE', `/api/files/${file.id}`);
      toast({
        title: "File Deleted",
        description: `${file.name} has been permanently deleted.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the file.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <Table className="min-w-[30rem]">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10 px-3 sm:w-12 sm:px-4">
              <Checkbox
                checked={selectAllState}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={(checked) => {
                  setSelectedFiles(checked === true ? files.map(f => f.id) : []);
                }}
                aria-label="Select all files"
              />
            </TableHead>
            <TableHead className="px-3 text-xs uppercase tracking-wide sm:px-4">Name</TableHead>
            <TableHead className="hidden px-3 text-xs uppercase tracking-wide md:table-cell sm:px-4">Modified</TableHead>
            <TableHead className="px-3 text-xs uppercase tracking-wide sm:px-4">Size</TableHead>
            <TableHead className="w-12 px-2 sm:w-[4.5rem] sm:px-3"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {files.map((file) => (
              <motion.tr
                key={file.id}
                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className={`group cursor-pointer border-border/70 transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${selectedFiles.includes(file.id) ? "bg-accent/10 hover:bg-accent/15" : ""}`}
                onClick={() => handleFileClick(file)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleFileClick(file);
                  }
                }}
                tabIndex={0}
                aria-label={`Preview ${file.name}`}
                aria-selected={selectedFiles.includes(file.id)}
              >
                <TableCell className="w-10 px-3 py-3 sm:w-12 sm:px-4">
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) => {
                      setSelectedFiles(current => checked === true
                        ? current.includes(file.id) ? current : [...current, file.id]
                        : current.filter(id => id !== file.id));
                    }}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select ${file.name}`}
                  />
                </TableCell>
                <TableCell className="max-w-0 px-3 py-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon fileType={file.type} fileName={file.name} size="sm" />
                    <span className="font-medium truncate" title={file.name}>{file.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap px-3 py-3 text-sm text-muted-foreground md:table-cell sm:px-4">{file.formattedDate}</TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-muted-foreground sm:px-4">{file.formattedSize}</TableCell>
                <TableCell className="px-2 py-2 sm:px-3">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-100 hover:bg-accent/10 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          aria-label={`Actions for ${file.name}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleDownload(file, e)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        {!sharedView && file.isDeleted ? (
                          <>
                            <DropdownMenuItem onClick={(e) => handleRestore(file, e)}>
                              <UndoIcon className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => handlePermanentDelete(file, e)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </>
                        ) : !sharedView && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => handleMoveToTrash(file, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Move to Trash
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

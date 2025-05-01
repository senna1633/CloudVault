import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, MoreVertical } from "lucide-react";
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
  
  const handleFileClick = (file: FileWithMeta) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  const handleDownload = async (file: FileWithMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the file.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedFiles.length === files.length}
                onCheckedChange={(checked) => {
                  setSelectedFiles(checked ? files.map(f => f.id) : []);
                }}
                aria-label="Select all files"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {files.map((file) => (
              <motion.tr
                key={file.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="group hover:bg-muted/50 cursor-pointer"
                onClick={() => handleFileClick(file)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) => {
                      setSelectedFiles(
                        checked
                          ? [...selectedFiles, file.id]
                          : selectedFiles.filter(id => id !== file.id)
                      );
                    }}
                    aria-label={`Select ${file.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileIcon fileType={file.type} fileName={file.name} size="sm" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{file.formattedDate}</TableCell>
                <TableCell>{file.formattedSize}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleDownload(file, e)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        {file.isDeleted ? (
                          <>
                            <DropdownMenuItem onClick={(e) => handleRestore(file, e)}>
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => handlePermanentDelete(file, e)}
                            >
                              Delete Permanently
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => handleMoveToTrash(file, e)}
                          >
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

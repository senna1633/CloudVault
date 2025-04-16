import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import FileExplorer from "@/components/file-explorer/FileExplorer";
import type { Folder } from "@shared/schema";

export default function Files() {
  const params = useParams();
  const folderId = params.folderId ? Number(params.folderId) : null;
  
  // If in a subfolder, get the folder details
  const { data: folder } = useQuery<Folder>({
    queryKey: ['/api/folders', folderId],
    queryFn: async () => {
      if (!folderId) return null;
      const res = await fetch(`/api/folders/${folderId}`);
      if (!res.ok) throw new Error('Failed to fetch folder');
      return res.json();
    },
    enabled: !!folderId,
  });
  
  // Title for the header
  const title = folder ? folder.name : "My Files";
  
  return (
    <>
      <Header title={title} />
      <FileExplorer />
    </>
  );
}

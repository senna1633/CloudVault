import { 
  FileText, 
  FileImage, 
  FileCode, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  File, 
  File as LucideFileIcon,
  FileSpreadsheet,
  FileType2
} from "lucide-react";

type IconSize = 'sm' | 'md' | 'lg' | 'xl';

interface FileIconProps {
  fileType: string;
  fileName: string;
  size?: IconSize;
}

export function FileIcon({ fileType, fileName, size = 'md' }: FileIconProps) {
  // Get file extension
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Size mappings
  const sizeMap: Record<IconSize, number> = {
    sm: 4,
    md: 5,
    lg: 6,
    xl: 20
  };
  
  const iconSize = sizeMap[size];
  const props = { className: `h-${iconSize} w-${iconSize}` };
  
  // Determine icon based on file type and extension
  if (fileType.startsWith('image/')) {
    return <FileImage {...props} className={`${props.className} text-accent`} />;
  } else if (fileType === 'application/pdf' || extension === 'pdf') {
    return <File {...props} className={`${props.className} text-destructive`} />;
  } else if (fileType.startsWith('video/')) {
    return <FileVideo {...props} className={`${props.className} text-purple-500`} />;
  } else if (fileType.startsWith('audio/')) {
    return <FileAudio {...props} className={`${props.className} text-pink-500`} />;
  } else if (
    fileType.includes('zip') || 
    fileType.includes('tar') || 
    fileType.includes('compressed') || 
    ['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)
  ) {
    return <FileArchive {...props} className={`${props.className} text-yellow-500`} />;
  } else if (
    fileType.includes('code') || 
    ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'py', 'java', 'php', 'rb', 'go'].includes(extension)
  ) {
    return <FileCode {...props} className={`${props.className} text-green-500`} />;
  } else if (
    fileType.includes('excel') || 
    fileType.includes('spreadsheet') || 
    ['xlsx', 'xls', 'csv'].includes(extension)
  ) {
    return <FileSpreadsheet {...props} className={`${props.className} text-green-500`} />;
  } else if (
    fileType.includes('word') || 
    fileType.includes('document') || 
    ['doc', 'docx', 'txt', 'rtf'].includes(extension)
  ) {
    return <FileText {...props} className={`${props.className} text-accent`} />;
  } else if (
    fileType.includes('presentation') || 
    ['ppt', 'pptx'].includes(extension)
  ) {
    return <FileType2 {...props} className={`${props.className} text-orange-500`} />;
  }
  
  // Default file icon
  return <LucideFileIcon {...props} className={`${props.className} text-muted-foreground`} />;
}

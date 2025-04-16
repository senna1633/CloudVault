import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, Bell, LayoutGrid, List, Upload, FolderPlus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFileContext } from "@/contexts/FileContext";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const params = useParams();
  const { 
    setShowNewFolderModal, 
    setShowUploadProgressModal,
    isGridView,
    setIsGridView,
    uploadFiles
  } = useFileContext();
  
  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        uploadFiles(Array.from(files), params.folderId ? Number(params.folderId) : null);
      }
    };
    input.click();
  };
  
  // Build breadcrumb from path
  const path = location.split("/").filter(Boolean);
  const isFilesPage = path[0] === "files";
  
  return (
    <header className="bg-secondary border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-4">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search files..."
              className="pl-10 w-64 bg-muted text-foreground rounded-full focus-visible:ring-accent"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 bg-accent cursor-pointer">
                <AvatarFallback>{user ? user.username[0].toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem disabled>
                    Logged in as <strong>{user.username}</strong>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>Logout</DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/auth">Login</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isFilesPage && (
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center text-sm">
            <Link href="/">
              <a className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
            </Link>
            
            {path.length > 0 && (
              <>
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                <Link href="/files">
                  <a className={cn(
                    "transition-colors",
                    path.length === 1 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    Files
                  </a>
                </Link>
              </>
            )}
            
            {path.length > 1 && (
              <>
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                <span className="text-foreground">Folder</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-accent hover:text-accent/80"
              onClick={() => setIsGridView(!isGridView)}
            >
              {isGridView ? (
                <><LayoutGrid className="h-4 w-4 mr-1" /> Grid</>
              ) : (
                <><List className="h-4 w-4 mr-1" /> List</>
              )}
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              className="bg-accent hover:bg-accent/90"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Upload</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNewFolderModal(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              <span>New Folder</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

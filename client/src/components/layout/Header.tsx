import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Menu, Search, Bell, LayoutGrid, List, Upload, FolderPlus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { 
    setShowNewFolderModal, 
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
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <h2 className="text-base md:text-lg font-medium truncate">{title}</h2>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile search toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-full shrink-0"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Toggle search</span>
          </Button>

          {/* Desktop search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search files..."
              className="pl-10 w-64 bg-muted text-foreground rounded-full focus-visible:ring-ring"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 hidden sm:flex">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 bg-primary cursor-pointer shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user ? user.username[0].toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    Logged in as <strong className="ml-1">{user.username}</strong>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem>
                  <Link href="/auth">
                    <span className="w-full">Login</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {mobileSearchOpen && (
        <div className="px-3 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search files..."
              className="pl-10 w-full bg-muted text-foreground rounded-full focus-visible:ring-ring"
              autoFocus
            />
          </div>
        </div>
      )}
      
      {isFilesPage && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-2 md:py-3 gap-2">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm" aria-label="Breadcrumb">
            <Link href="/">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Home
              </span>
            </Link>
            
            {path.length > 0 && (
              <>
                <ChevronRight className="h-4 w-4 mx-1.5 text-muted-foreground shrink-0" />
                <Link href="/files">
                  <span className={cn(
                    "transition-colors cursor-pointer",
                    path.length === 1 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    Files
                  </span>
                </Link>
              </>
            )}
            
            {path.length > 1 && (
              <>
                <ChevronRight className="h-4 w-4 mx-1.5 text-muted-foreground shrink-0" />
                <span className="text-foreground font-medium truncate max-w-[120px]">Folder</span>
              </>
            )}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => setIsGridView(!isGridView)}
            >
              {isGridView ? (
                <><LayoutGrid className="h-4 w-4 mr-1.5" /> Grid</>
              ) : (
                <><List className="h-4 w-4 mr-1.5" /> List</>
              )}
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">Upload</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNewFolderModal(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">New Folder</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

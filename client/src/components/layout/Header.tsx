import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const params = useParams();
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
    <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 shadow-sm shadow-background/40 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:mr-3 md:hidden" aria-label="Open navigation menu">
                <motion.span
                  className="flex"
                  whileHover={shouldReduceMotion ? undefined : { rotate: -6, scale: 1.06 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <div className="min-w-0">
            <p className="mb-0.5 hidden text-xs font-medium text-muted-foreground sm:block">CloudVault / Workspace</p>
            <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
          </div>
        </div>
        
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search files..."
              aria-label="Search files"
              className="h-10 w-56 rounded-xl border-transparent bg-muted/70 pl-10 text-sm placeholder:text-muted-foreground focus-visible:border-accent focus-visible:bg-background lg:w-72"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" aria-label="Notifications">
            <motion.span
              className="flex"
              whileHover={shouldReduceMotion ? undefined : { y: -1, rotate: 5 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <Bell className="h-5 w-5" />
            </motion.span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full p-0 ring-2 ring-border ring-offset-2 ring-offset-background" aria-label="Account menu">
                <Avatar className="h-9 w-9 bg-accent text-accent-foreground">
                  <AvatarFallback>{user ? user.username[0].toUpperCase() : "?"}</AvatarFallback>
                </Avatar>
              </Button>
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
                <DropdownMenuItem>
                  <Link href="/auth">
                    <div className="w-full">Login</div>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isFilesPage && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:px-7">
          <div className="flex items-center text-sm">
            <Link href="/">
              <div className="cursor-pointer rounded-md py-1 text-muted-foreground transition-colors hover:text-foreground">
                Home
              </div>
            </Link>
            
            {path.length > 0 && (
              <>
                <ChevronRight className="mx-1.5 h-4 w-4 text-muted-foreground sm:mx-2" />
                <Link href="/files">
                  <div className={cn(
                    "cursor-pointer rounded-md py-1 transition-colors",
                    path.length === 1 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    Files
                  </div>
                </Link>
              </>
            )}
            
            {path.length > 1 && (
              <>
                <ChevronRight className="mx-1.5 h-4 w-4 text-muted-foreground sm:mx-2" />
                <span className="text-foreground">Folder</span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:px-3"
              aria-label={`Switch to ${isGridView ? "list" : "grid"} view`}
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
              className="h-9 rounded-xl bg-accent px-3 font-semibold text-accent-foreground shadow-sm shadow-accent/10 hover:bg-accent/90 sm:px-4"
              onClick={handleUploadClick}
            >
              <motion.span
                className="mr-2 flex"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <Upload className="h-4 w-4" />
              </motion.span>
              <span>Upload</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 rounded-xl border-border bg-card px-3 hover:bg-muted sm:px-4"
              onClick={() => setShowNewFolderModal(true)}
            >
              <motion.span
                className="mr-2 flex"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <FolderPlus className="h-4 w-4" />
              </motion.span>
              <span>New Folder</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

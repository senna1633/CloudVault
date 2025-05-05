import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cloud, Home, Folder, Image, Share2, Clock, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { StorageStats } from "@shared/schema";

const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  active?: boolean;
};

export default function Sidebar() {
  const [location] = useLocation();

  const { data: storageStats } = useQuery<StorageStats>({
    queryKey: ["/api/storage"],
    staleTime: 60 * 1000, // 1 minute
  });

  const navItems: NavItem[] = [
    {
      name: "Home",
      icon: <Home className="h-5 w-5" />,
      path: "/",
      active: location === "/"
    },
    {
      name: "Files",
      icon: <Folder className="h-5 w-5" />,
      path: "/files",
      active: location.startsWith("/files")
    },
    {
      name: "Photos",
      icon: <Image className="h-5 w-5" />,
      path: "/photos",
      active: location === "/photos"
    },
    {
      name: "Shared",
      icon: <Share2 className="h-5 w-5" />,
      path: "/shared",
      active: location === "/shared"
    },
    {
      name: "Recent",
      icon: <Clock className="h-5 w-5" />,
      path: "/recent",
      active: location === "/recent"
    },
    {
      name: "Trash",
      icon: <Trash2 className="h-5 w-5" />,
      path: "/trash",
      active: location === "/trash"
    },
  ];

  const usedPercent = storageStats?.percentUsed || 0;
  const usedSpace = formatSize(storageStats?.usedSpace || 0);
  const totalSpace = formatSize(storageStats?.totalSpace || 0);

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-secondary border-r border-border h-screen sticky top-0">
      <div className="p-6">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <Cloud className="h-6 w-6 text-accent" />
            <span className="text-2xl font-bold">LocalVault</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link href={item.path}>
                <div className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-colors group cursor-pointer",
                  item.active
                    ? "bg-muted/50 text-foreground"
                    : "text-foreground/70 hover:bg-muted/30"
                )}>
                  <motion.span
                    className={cn(
                      "mr-3 transition-colors",
                      item.active ? "text-accent" : "text-foreground/70 group-hover:text-foreground/80"
                    )}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {item.icon}
                  </motion.span>
                  <span>{item.name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Storage</span>
            <span className="text-xs text-muted-foreground">
              {usedPercent.toFixed(1)}% used
            </span>
          </div>
          <Progress value={usedPercent} className="h-2 bg-background" />
          <div className="mt-3 text-xs text-muted-foreground">
            {usedSpace} of {totalSpace} used
          </div>
          <Button variant="link" size="sm" className="mt-2 px-0 text-accent hover:text-accent/80">
            Upgrade Plan
          </Button>
        </div>
      </div>
    </aside>
  );
}

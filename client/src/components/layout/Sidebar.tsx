import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Cloud, Home, Folder, Image, Share2, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
    staleTime: 60 * 1000,
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
    <aside className="flex flex-col bg-secondary border-r border-border h-screen w-full md:w-64">
      {/* Logo */}
      <div className="p-5 md:p-6">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <Cloud className="h-6 w-6 text-primary shrink-0" />
            <span className="text-xl font-bold text-foreground">CloudVault</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link href={item.path}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                  item.active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}>
                  <span
                    className={cn(
                      "shrink-0 transition-colors",
                      item.active ? "text-primary" : ""
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Storage widget */}
      <div className="p-3 border-t border-border">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Storage</span>
            <span className="text-xs text-muted-foreground">
              {usedPercent.toFixed(1)}%
            </span>
          </div>
          <Progress value={usedPercent} className="h-1.5 bg-background" />
          <div className="mt-2 text-xs text-muted-foreground">
            {usedSpace} of {totalSpace}
          </div>
          <Button variant="link" size="sm" className="mt-1 px-0 h-auto text-xs text-primary hover:text-primary/80">
            Upgrade Plan
          </Button>
        </div>
      </div>
    </aside>
  );
}

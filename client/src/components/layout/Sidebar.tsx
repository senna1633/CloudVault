import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Cloud, Home, Folder, Image, Share2, Clock, Trash2, Sparkles } from "lucide-react";
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

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

const navListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.035, delayChildren: 0.04 },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const { data: storageStats, isLoading, isError } = useQuery<StorageStats>({
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

  const usedPercent = Math.min(100, Math.max(0, storageStats?.percentUsed || 0));
  const usedSpace = formatSize(storageStats?.usedSpace || 0);
  const totalSpace = formatSize(storageStats?.totalSpace || 0);

  return (
    <aside className={cn(
      "flex flex-col border-r border-sidebar-border bg-[hsl(var(--sidebar-background))]",
      mobile ? "h-full w-full" : "sticky top-0 hidden h-screen md:flex md:w-64 lg:w-72"
    )}>
      <div className="px-5 pb-8 pt-7 lg:px-6">
        <Link href="/">
          <div className="group flex cursor-pointer items-center gap-3" onClick={onNavigate}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/15 transition-transform group-hover:scale-[1.03]">
              <Cloud className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-sidebar-foreground">CloudVault</span>
          </div>
        </Link>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 px-3 py-1">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
        <motion.ul
          className="space-y-1"
          variants={shouldReduceMotion ? undefined : navListVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
        >
          {navItems.map((item) => (
            <motion.li
              key={item.name}
              variants={shouldReduceMotion ? undefined : navItemVariants}
            >
              <Link href={item.path} aria-current={item.active ? "page" : undefined}>
                <div
                  className={cn(
                    "group relative flex cursor-pointer items-center rounded-xl px-3.5 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    item.active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-background/30 before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                  )}
                  onClick={onNavigate}
                >
                  <motion.span
                    className={cn(
                      "mr-3 transition-colors",
                      item.active ? "text-sidebar-primary" : "text-muted-foreground transition-colors group-hover:text-sidebar-foreground"
                    )}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    {item.icon}
                  </motion.span>
                  <span>{item.name}</span>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-2xl border border-sidebar-border bg-card/70 p-4 shadow-lg shadow-background/20">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-card-foreground">Storage</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {isLoading ? "Loading…" : isError ? "Unavailable" : `${usedPercent.toFixed(1)}% used`}
            </span>
          </div>
          <Progress value={isLoading || isError ? 0 : usedPercent} aria-label="Storage used" className="h-2 bg-secondary [&>div]:bg-accent" />
          <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {isLoading ? "Storage details are loading" : isError ? "Storage details could not be loaded" : `${usedSpace} of ${totalSpace} used`}
          </div>
          <Button variant="link" size="sm" className="mt-2 h-auto px-0 text-accent hover:text-accent/80">
            Upgrade Plan
          </Button>
        </div>
      </div>
    </aside>
  );
}

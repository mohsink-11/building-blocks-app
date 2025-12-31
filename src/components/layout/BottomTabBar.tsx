import { Link, useLocation } from "react-router-dom";
import { Home, FolderOpen, Plus, Settings, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  icon: LucideIcon;
  label: string;
  path: string;
  isUpload?: boolean;
}

const tabs: TabItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Plus, label: "Upload", path: "/upload", isUpload: true },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm safe-bottom md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path ||
            (tab.path !== "/dashboard" && location.pathname.startsWith(tab.path));

          if (tab.isUpload) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant transition-transform hover:scale-105 active:scale-95">
                  <tab.icon className="h-5 w-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { Link, useLocation } from "react-router-dom";
import {
  FileSpreadsheet,
  Home,
  FolderOpen,
  Plus,
  Settings,
  FileText,
  HelpCircle,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Plus, label: "Upload", path: "/upload" },
  { icon: FileText, label: "Templates", path: "/templates" },
];

const bottomNavItems = [
  { icon: HelpCircle, label: "Help", path: "/help" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function DesktopSidebar({ collapsed, onToggle }: DesktopSidebarProps) {
  const location = useLocation();

  const { user } = useAuth();
  const { profile, loading } = useProfile();

  const NavItem = ({ icon: Icon, label, path }: { icon: typeof Home; label: string; path: string }) => {
    const isActive = path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

    const content = (
      <Link
        to={path}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-primary text-primary-foreground shadow-elegant"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="font-medium text-sm">{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-background transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex h-14 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-elegant">
              <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && <span className="font-bold">ASPIRANT</span>}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center py-2 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        <Separator className="mx-3" />

        {/* Bottom Navigation */}
        <nav className="p-3 space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        <Separator className="mx-3" />

        {/* User Section */}
        <div className="p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/settings" className="flex justify-center">
                   <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url ?? ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {profile?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
               {profile?.name ?? user?.email}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {/* <p className="font-medium text-sm truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john@example.com</p> */}

                <p className="font-medium text-sm truncate">
                  {loading ? "Loading..." : profile?.name ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

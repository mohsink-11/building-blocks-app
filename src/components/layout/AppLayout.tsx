import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Home,
  FolderOpen,
  Plus,
  Settings,
  Menu,
  X,
  FileText,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mainNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Plus, label: "Upload", path: "/upload" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const drawerNavItems = [
  { icon: FileText, label: "Templates", path: "/templates" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

export default function AppLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass border-b border-border safe-top">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-14 items-center gap-2 border-b px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold">ASPIRANT</span>
                </div>
                <nav className="p-4 space-y-2">
                  {drawerNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                        location.pathname === item.path
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="pt-4 border-t mt-4">
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10">
                      <LogOut className="h-5 w-5" />
                      Log Out
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden font-bold sm:inline">ASPIRANT</span>
            </Link>
          </div>
          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {drawerNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  location.pathname === item.path
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom Tab Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-bottom md:hidden">
        <div className="flex h-16 items-center justify-around">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

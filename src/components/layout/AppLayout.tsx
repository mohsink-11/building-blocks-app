import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabBar } from "./BottomTabBar";
import { MobileDrawer } from "./MobileDrawer";
import { DesktopSidebar } from "./DesktopSidebar";

export default function AppLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Show PWA update/offline notifications
  useEffect(() => {
    const onNeedRefresh = () => {
      // Basic prompt - we keep it simple for now
      if (window.confirm('A new version is available. Refresh now to update?')) {
        window.location.reload();
      }
    };

    const onOfflineReady = () => {
      toast({ title: 'Offline ready', description: 'The app is available offline.' });
    };

    window.addEventListener('sw:need-refresh', onNeedRefresh as EventListener);
    window.addEventListener('sw:offline-ready', onOfflineReady as EventListener);

    return () => {
      window.removeEventListener('sw:need-refresh', onNeedRefresh as EventListener);
      window.removeEventListener('sw:offline-ready', onOfflineReady as EventListener);
    };
  }, [toast]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm safe-top md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            className="mr-3"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-elegant">
              <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">ASPIRANT</span>
          </Link>

          <div className="ml-auto">
            {user ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  const { error } = await signOut();
                  if (error) {
                    toast({ title: 'Sign out failed', description: error.message || String(error) });
                  } else {
                    toast({ title: 'Signed out' });
                    // redirect to landing
                    window.location.href = '/';
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <BottomTabBar />
      </div>
    </div>
  );
}

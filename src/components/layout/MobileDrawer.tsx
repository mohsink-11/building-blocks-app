import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { icon: FileText, label: "Templates", path: "/templates", description: "Saved configurations" },
  { icon: HelpCircle, label: "Help & Support", path: "/help", description: "FAQs and guides" },
];

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        {/* Header with Logo */}
        <SheetHeader className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-elegant">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">ASPIRANT</h2>
              <p className="text-xs text-muted-foreground">Excel Transformation</p>
            </div>
          </div>
        </SheetHeader>

        {/* User Profile Section */}
        <div className="p-4">
          <Link
            to="/settings"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@example.com</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <Separator />

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-elegant"
                  : "hover:bg-muted active:scale-[0.98]"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className={cn(
                  "text-xs truncate",
                  location.pathname === item.path
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}>
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </nav>

        <Separator />

        {/* Logout Button */}
        <div className="p-4">
          <button
            disabled={!user || signingOut}
            onClick={async () => {
              setSigningOut(true);
              const { error } = await signOut();
              setSigningOut(false);
              onOpenChange(false);
              if (error) {
                toast({ title: 'Sign out failed', description: error.message || String(error) });
              } else {
                // navigate to login; Login page will show signed-out toast and reset the form
                navigate('/login', { replace: true, state: { loggedOut: true } });
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">{signingOut ? 'Signing out...' : 'Log Out'}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

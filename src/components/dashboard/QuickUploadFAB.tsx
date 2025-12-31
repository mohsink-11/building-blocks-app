import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickUploadFABProps {
  className?: string;
}

export function QuickUploadFAB({ className }: QuickUploadFABProps) {
  return (
    <Link
      to="/upload"
      className={cn(
        "fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant transition-all hover:scale-105 hover:shadow-glow active:scale-95 md:hidden",
        className
      )}
      aria-label="New project"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}

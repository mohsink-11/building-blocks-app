import { Link } from "react-router-dom";
import { FileSpreadsheet, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  lastEdited: string;
  status: "completed" | "in_progress";
  filesCount?: number;
}

interface ProjectCardProps {
  project: Project;
  variant?: "card" | "list";
  onRename?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({
  project,
  variant = "list",
  onRename,
  onDuplicate,
  onDelete,
}: ProjectCardProps) {
  const statusBadge = (
    <div
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        project.status === "completed"
          ? "bg-accent/10 text-accent"
          : "bg-warning/10 text-warning"
      )}
    >
      {project.status === "completed" ? "Completed" : "In Progress"}
    </div>
  );

  if (variant === "list") {
    return (
      <Link
        to={`/project/${project.id}`}
        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/50 hover:shadow-sm active:scale-[0.99]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{project.name}</p>
          <p className="text-sm text-muted-foreground">
            Last edited {project.lastEdited}
          </p>
        </div>
        {statusBadge}
      </Link>
    );
  }

  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <Link to={`/project/${project.id}`} className="flex-1 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-semibold truncate">{project.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.filesCount && `${project.filesCount} file${project.filesCount !== 1 ? "s" : ""} • `}
            {project.lastEdited}
          </p>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => onRename?.(project.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(project.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4">{statusBadge}</div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Grid, List, Upload } from "lucide-react";
import { ProjectCard, type Project } from "@/components/dashboard/ProjectCard";
import { QuickUploadFAB } from "@/components/dashboard/QuickUploadFAB";
import { cn } from "@/lib/utils";

// Placeholder data
const projects: Project[] = [
  { id: "1", name: "Q4 BOM Transform", lastEdited: "2 hours ago", status: "completed", filesCount: 3 },
  { id: "2", name: "Inventory Mapping", lastEdited: "Yesterday", status: "in_progress", filesCount: 1 },
  { id: "3", name: "Parts List Conversion", lastEdited: "3 days ago", status: "completed", filesCount: 5 },
  { id: "4", name: "Supplier Data Transform", lastEdited: "1 week ago", status: "completed", filesCount: 2 },
  { id: "5", name: "Asset Registry Update", lastEdited: "2 weeks ago", status: "completed", filesCount: 1 },
];

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || project.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0; // Default: recent (already sorted)
    });

  const handleRename = (id: string) => {
    console.log("Rename project:", id);
  };

  const handleDuplicate = (id: string) => {
    console.log("Duplicate project:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete project:", id);
  };

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1>
          <p className="text-muted-foreground">
            Manage your Excel transformation projects
          </p>
        </div>
        <Button asChild className="hidden min-h-[44px] sm:inline-flex">
          <Link to="/upload">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects */}
      {filteredProjects.length > 0 ? (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          )}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant={viewMode === "grid" ? "card" : "list"}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {searchQuery ? (
              <Search className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="mb-4 text-muted-foreground max-w-sm">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Create your first project to get started with Excel transformations"}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link to="/upload">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Quick Upload FAB (Mobile) */}
      <QuickUploadFAB />
    </div>
  );
}

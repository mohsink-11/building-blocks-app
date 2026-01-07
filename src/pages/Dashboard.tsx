import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileSpreadsheet,
  Plus,
  FolderOpen,
  Clock,
  TrendingUp,
  Upload,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectCard, type Project } from "@/components/dashboard/ProjectCard";
import { QuickUploadFAB } from "@/components/dashboard/QuickUploadFAB";
import { useProfile } from "@/hooks/useProfile";
// Placeholder data - will be replaced with real data from Supabase
const recentProjects: Project[] = [
  { id: "1", name: "Q4 BOM Transform", lastEdited: "2 hours ago", status: "completed" },
  { id: "2", name: "Inventory Mapping", lastEdited: "Yesterday", status: "in_progress" },
  { id: "3", name: "Parts List Conversion", lastEdited: "3 days ago", status: "completed" },
];

const stats = [
  { label: "Total Projects", value: "12", icon: FolderOpen },
  { label: "Files Processed", value: "47", icon: FileSpreadsheet },
  { label: "Hours Saved", value: "23", icon: Clock, trend: { value: "12%", positive: true } },
  { label: "Success Rate", value: "98%", icon: TrendingUp, trend: { value: "3%", positive: true } },
];

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your projects.
          </p>
        </div>
        <Button asChild className="hidden min-h-[44px] sm:inline-flex">
          <Link to="/upload">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Recent Projects</CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to="/projects">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} variant="list" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
              <p className="mb-4 text-muted-foreground">
                Upload your first Excel file to get started
              </p>
              <Button asChild>
                <Link to="/upload">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Upload FAB (Mobile) */}
      <QuickUploadFAB />
    </div>
  );
}

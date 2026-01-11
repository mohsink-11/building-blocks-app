import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  ArrowLeft,
  Play,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  File,
  Settings2,
  BarChart3,
  AlertCircle,
  Pencil,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getProjectDetail } from "@/integrations/supabase/api";


export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await getProjectDetail(id);
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch project detail:", error);
        setProject(null);
      } else {
        setProject(data);
      }
      setLoading(false);
    }
    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8 flex items-center justify-center">
        <span className="text-muted-foreground">Loading project...</span>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8 flex items-center justify-center">
        <span className="text-destructive">Project not found.</span>
      </div>
    );
  }

  // ...existing JSX, replace all 'project.' references with the fetched project object...
  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl truncate">
                  {project.name}
                </h1>
                <Badge
                  variant="secondary"
                  className={
                    project.status === "completed"
                      ? "bg-accent/10 text-accent border-accent/20"
                      : "bg-warning/10 text-warning border-warning/20"
                  }
                >
                  {project.status === "completed" ? "Completed" : "In Progress"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{project.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {project.createdAt}
                </span>
                <span>•</span>
                <span>Last edited {project.lastEdited}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="icon" className="shrink-0">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/mapping/${id}`}>
                <Settings2 className="mr-2 h-4 w-4" />
                Configure
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/preview/${id}`}>
                <Play className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{project.stats?.columnsMapped ?? '-'}</p>
            <p className="text-sm text-muted-foreground">Columns Mapped</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/50 border-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{project.stats?.rulesApplied ?? '-'}</p>
            <p className="text-sm text-muted-foreground">Rules Applied</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{project.stats?.rowsProcessed ? project.stats.rowsProcessed.toLocaleString() : '-'}</p>
            <p className="text-sm text-muted-foreground">Rows Processed</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{project.stats?.errorsFixed ?? '-'}</p>
            <p className="text-sm text-muted-foreground">Errors Fixed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="files" className="gap-2">
            <File className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exports</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Source Files</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {(project.files && project.files.length > 0) ? (
                  project.files.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.rows?.toLocaleString() ?? '-'} rows • Processed {file.processed_at ? new Date(file.processed_at).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-accent">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm hidden sm:inline">Completed</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No source files.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Export History</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {(project.exports && project.exports.length > 0) ? (
                  project.exports.map((exportItem: any) => (
                    <div
                      key={exportItem.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Download className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{exportItem.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exportItem.size ?? '-'} • {exportItem.created_at ? new Date(exportItem.created_at).toLocaleString() : '-'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No exports.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {(project.activity && project.activity.length > 0) ? (
                  project.activity.map((act: any) => {
                    let icon, iconClass;
                    switch (act.type) {
                      case 'transformation':
                        icon = <CheckCircle className="h-4 w-4" />;
                        iconClass = "bg-accent/10 text-accent";
                        break;
                      case 'rules_update':
                        icon = <Settings2 className="h-4 w-4" />;
                        iconClass = "bg-primary/10 text-primary";
                        break;
                      case 'validation':
                        icon = <AlertCircle className="h-4 w-4" />;
                        iconClass = "bg-warning/10 text-warning";
                        break;
                      default:
                        icon = <BarChart3 className="h-4 w-4" />;
                        iconClass = "bg-muted/10 text-muted-foreground";
                    }
                    return (
                      <div className="flex gap-4" key={act.id}>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                          {icon}
                        </div>
                        <div>
                          <p className="font-medium">{act.description ?? act.type}</p>
                          <p className="text-sm text-muted-foreground">{act.created_at ? new Date(act.created_at).toLocaleString() : '-'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="mt-6 border-destructive/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium">Delete this project</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, this project and all its data cannot be recovered.
              </p>
            </div>
            <Button variant="destructive" className="shrink-0">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

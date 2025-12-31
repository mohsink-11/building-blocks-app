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

// Placeholder data
const project = {
  id: "1",
  name: "Q4 BOM Transform",
  createdAt: "Dec 15, 2024",
  lastEdited: "2 hours ago",
  status: "completed",
  description: "Quarterly BOM data transformation for inventory system",
  files: [
    { id: "f1", name: "BOM_Q4_2024.xlsx", processedAt: "Dec 20, 2024", status: "completed", rows: 523 },
    { id: "f2", name: "BOM_Updates.xlsx", processedAt: "Dec 18, 2024", status: "completed", rows: 128 },
    { id: "f3", name: "Parts_List.xlsx", processedAt: "Dec 15, 2024", status: "completed", rows: 596 },
  ],
  exports: [
    { id: "e1", name: "Transformed_BOM_Q4.xlsx", createdAt: "Dec 20, 2024", size: "2.4 MB" },
    { id: "e2", name: "Transformed_Updates.xlsx", createdAt: "Dec 18, 2024", size: "856 KB" },
  ],
  stats: {
    columnsMapped: 12,
    rulesApplied: 5,
    rowsProcessed: 1247,
    errorsFixed: 23,
  },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();

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
            <p className="text-2xl font-bold text-primary">{project.stats.columnsMapped}</p>
            <p className="text-sm text-muted-foreground">Columns Mapped</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/50 border-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{project.stats.rulesApplied}</p>
            <p className="text-sm text-muted-foreground">Rules Applied</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{project.stats.rowsProcessed.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Rows Processed</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{project.stats.errorsFixed}</p>
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
                {project.files.map((file) => (
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
                        {file.rows.toLocaleString()} rows • Processed {file.processedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-accent">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm hidden sm:inline">Completed</span>
                    </div>
                  </div>
                ))}
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
                {project.exports.map((exportItem) => (
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
                        {exportItem.size} • {exportItem.createdAt}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                ))}
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
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Transformation completed</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Rules updated</p>
                    <p className="text-sm text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">23 validation errors fixed</p>
                    <p className="text-sm text-muted-foreground">Yesterday</p>
                  </div>
                </div>
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

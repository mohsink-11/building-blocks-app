import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileSpreadsheet,
  ArrowLeft,
  Play,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  File,
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
    { id: "f1", name: "BOM_Q4_2024.xlsx", processedAt: "Dec 20, 2024", status: "completed" },
    { id: "f2", name: "BOM_Updates.xlsx", processedAt: "Dec 18, 2024", status: "completed" },
    { id: "f3", name: "Parts_List.xlsx", processedAt: "Dec 15, 2024", status: "completed" },
  ],
  exports: [
    { id: "e1", name: "Transformed_BOM_Q4.xlsx", createdAt: "Dec 20, 2024" },
    { id: "e2", name: "Transformed_Updates.xlsx", createdAt: "Dec 18, 2024" },
  ],
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {project.name}
              </h1>
              <p className="text-muted-foreground">{project.description}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created {project.createdAt}</span>
                <span>•</span>
                <span>Last edited {project.lastEdited}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to={`/mapping/${id}`}>
                <Play className="mr-2 h-4 w-4" />
                Edit Mapping
              </Link>
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Source Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Processed {file.processedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Done</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.exports.map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Download className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{exportItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exportItem.createdAt}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transformation Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transformation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-3xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Columns Mapped</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-3xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground">Rules Applied</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-3xl font-bold text-accent">1,247</p>
                <p className="text-sm text-muted-foreground">Rows Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

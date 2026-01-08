import { FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadedFileData {
  id: string;
  name: string;
  size: number;
  // added 'uploaded' status to indicate file is present but headers not yet read
  status: "uploading" | "validating" | "uploaded" | "ready" | "error" | "processing" | "processed";
  progress: number;
  error?: string;
  // store original file object so headers can be read later on user action
  fileObj?: File;
  // sample rows following header rows (array of rows -> array of cell strings)
  samples?: string[][];
  // all parsed data rows (after header rows) used for full preview/export
  dataRows?: string[][];
  columns?: string[];
  headerRows?: string[][];
  rowCount?: number;
  suggestions?: Array<{ 
  id?: string; 
  name?: string;
  suggestedTransformation?: string;
  justification?: string;
  text?: string; 
  mapping?: Record<string, any> 
}>;
}

interface FilePreviewCardProps {
  file: UploadedFileData;
  onRemove: (id: string) => void;
}

export function FilePreviewCard({ file, onRemove }: FilePreviewCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case "error":
        return <AlertCircle className="h-6 w-6" />;
      case "ready":
        return <CheckCircle className="h-6 w-6" />;
      case "uploading":
      case "validating":
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case "uploaded":
        return <FileSpreadsheet className="h-6 w-6" />;
      default:
        return <FileSpreadsheet className="h-6 w-6" />;
    }
  };

  const getStatusColors = () => {
    switch (file.status) {
      case "error":
        return "bg-destructive/10 text-destructive";
      case "ready":
        return "bg-accent/10 text-accent";
      case "uploaded":
        return "bg-primary/10 text-primary";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case "uploading":
        return `Uploading... ${file.progress}%`;
      case "validating":
        return "Validating structure...";
      case "uploaded":
        return "Uploaded — enter header rows then click Continue to read headers";
      case "ready":
        return file.columns
          ? `${file.columns.length} columns • ${file.rowCount?.toLocaleString() || 0} rows`
          : "Ready for mapping";
      case "error":
        return file.error || "Upload failed";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all animate-fade-in",
        file.status === "error" && "border-destructive/30",
        file.status === "ready" && "border-accent/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            getStatusColors()
          )}
        >
          {getStatusIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(file.id)}
              className="shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {(file.status === "uploading" || file.status === "validating") && (
            <div className="mt-3">
              <Progress value={file.progress} className="h-2" />
            </div>
          )}

          <p
            className={cn(
              "mt-2 text-sm",
              file.status === "error" && "text-destructive",
              file.status === "ready" && "text-accent",
              (file.status === "uploading" || file.status === "validating") &&
                "text-muted-foreground"
            )}
          >
            {getStatusText()}
          </p>

          {file.status === "ready" && file.columns && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {file.columns.slice(0, 5).map((col, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {col}
                  </span>
                ))}
                {file.columns.length > 5 && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    +{file.columns.length - 5} more
                  </span>
                )}
              </div>

              {file.headerRows && file.headerRows.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium">Detected header rows</h4>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {file.headerRows.map((row, rIdx) => (
                      <div key={rIdx} className="truncate">
                        <strong>Row {rIdx + 1}:</strong> {row.map((c) => (String(c).trim() === '' ? '—' : String(c))).join(' | ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {file.suggestions && file.suggestions.length > 0 && (
  <div className="mt-3">
    <h4 className="text-sm font-medium">AI Suggestions</h4>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {file.suggestions.map((s, i) => (
        <div key={i} className="rounded-md border bg-card p-2 text-sm">
          <div className="font-medium">{s.name || `Suggestion ${i + 1}`}</div>
          <div className="text-xs text-muted-foreground mb-1">
            {s.suggestedTransformation}
          </div>
          <div className="text-xs text-muted-foreground">{s.justification}</div>
        </div>
      ))}
    </div>
  </div>
)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

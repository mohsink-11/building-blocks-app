import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileSpreadsheet,
  Upload as UploadIcon,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "validating" | "ready" | "error";
  progress: number;
  error?: string;
}

export default function Upload() {
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const processFile = (file: File) => {
    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls",
      ".xlsx",
    ];
    const isValidType =
      validTypes.some((type) => file.type === type) ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".xlsx");

    if (!isValidType) {
      setUploadedFile({
        name: file.name,
        size: file.size,
        status: "error",
        progress: 0,
        error: "Invalid file type. Please upload an Excel file (.xls or .xlsx)",
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadedFile({
        name: file.name,
        size: file.size,
        status: "error",
        progress: 0,
        error: "File too large. Maximum size is 50MB",
      });
      return;
    }

    // Simulate upload process
    setUploadedFile({
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFile((prev) =>
          prev ? { ...prev, status: "validating", progress: 100 } : null
        );
        // Simulate validation
        setTimeout(() => {
          setUploadedFile((prev) =>
            prev ? { ...prev, status: "ready" } : null
          );
        }, 1000);
      } else {
        setUploadedFile((prev) =>
          prev ? { ...prev, progress } : null
        );
      }
    }, 100);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleContinue = () => {
    // TODO: Create project and navigate to mapping
    navigate("/mapping/new");
  };

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Upload Excel File
          </h1>
          <p className="text-muted-foreground">
            Upload your Excel file to start the transformation process
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {isDragActive ? "Drop your file here" : "Drag & drop your Excel file"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                or click to browse from your device
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Supports .xls and .xlsx files up to 50MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded File */}
        {uploadedFile && (
          <Card className="animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                    uploadedFile.status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : uploadedFile.status === "ready"
                      ? "bg-accent/10 text-accent"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {uploadedFile.status === "error" ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : uploadedFile.status === "ready" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <FileSpreadsheet className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUploadedFile(null)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {uploadedFile.status === "uploading" && (
                    <div className="mt-3">
                      <Progress value={uploadedFile.progress} className="h-2" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Uploading... {uploadedFile.progress}%
                      </p>
                    </div>
                  )}

                  {uploadedFile.status === "validating" && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Validating file structure...
                    </p>
                  )}

                  {uploadedFile.status === "ready" && (
                    <p className="mt-3 text-sm text-accent">
                      File ready for mapping
                    </p>
                  )}

                  {uploadedFile.status === "error" && (
                    <p className="mt-3 text-sm text-destructive">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        {uploadedFile?.status === "ready" && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleContinue} className="min-h-[44px]">
              Continue to Mapping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

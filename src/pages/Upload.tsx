import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, FolderPlus, FileSpreadsheet, Sparkles } from "lucide-react";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { FilePreviewCard, UploadedFileData } from "@/components/upload/FilePreviewCard";

export default function Upload() {
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileData | null>(null);
  const [projectName, setProjectName] = useState("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".xlsx");

    if (!isValidType) {
      return {
        valid: false,
        error: "Invalid file type. Please upload an Excel file (.xls or .xlsx)",
      };
    }

    if (file.size > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: "File too large. Maximum size is 50MB",
      };
    }

    return { valid: true };
  };

  const simulateUpload = (file: File) => {
    const id = Math.random().toString(36).substring(7);
    const validation = validateFile(file);

    if (!validation.valid) {
      setUploadedFile({
        id,
        name: file.name,
        size: file.size,
        status: "error",
        progress: 0,
        error: validation.error,
      });
      return;
    }

    // Auto-generate project name from file
    if (!projectName) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setProjectName(baseName);
    }

    setUploadedFile({
      id,
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFile((prev) =>
          prev ? { ...prev, status: "validating", progress: 100 } : null
        );
        // Simulate validation and column detection
        setTimeout(() => {
          setUploadedFile((prev) =>
            prev
              ? {
                  ...prev,
                  status: "ready",
                  columns: [
                    "Item Number",
                    "Description",
                    "Quantity",
                    "Unit Price",
                    "Category",
                    "Supplier",
                    "Lead Time",
                    "Notes",
                  ],
                  rowCount: 1247,
                }
              : null
          );
        }, 1200);
      } else {
        setUploadedFile((prev) =>
          prev ? { ...prev, progress: Math.min(progress, 99) } : null
        );
      }
    }, 150);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    simulateUpload(file);
  }, []);

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleContinue = () => {
    // TODO: Create project and navigate to mapping
    navigate("/mapping/new");
  };

  const canContinue = uploadedFile?.status === "ready" && projectName.trim().length > 0;

  return (
    <div
      className="flex-1 p-4 pt-6 md:p-8"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Create New Project
          </h1>
          <p className="text-muted-foreground">
            Upload your Excel file to start the transformation process
          </p>
        </div>

        {/* Project Name */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderPlus className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload Zone */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5" />
              Excel File
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!uploadedFile ? (
              <FileDropZone
                onFileSelect={handleFileSelect}
                isActive={isDragActive}
              />
            ) : (
              <FilePreviewCard file={uploadedFile} onRemove={handleRemoveFile} />
            )}
          </CardContent>
        </Card>

        {/* AI Feature Hint */}
        {uploadedFile?.status === "ready" && (
          <Card className="mb-6 border-primary/20 bg-gradient-subtle animate-fade-in">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">AI-Powered Suggestions</p>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your columns and suggest optimal mappings
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/projects">Cancel</Link>
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="min-h-[44px]"
          >
            Continue to Mapping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

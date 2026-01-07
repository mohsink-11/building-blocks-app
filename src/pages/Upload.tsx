import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, FolderPlus, FileSpreadsheet, Sparkles } from "lucide-react";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { FilePreviewCard, UploadedFileData } from "@/components/upload/FilePreviewCard";
import { useToast } from "@/hooks/use-toast";
import { createBatchJob, processBatchJob, getMappingSuggestions } from "@/integrations/supabase/api";

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileData[]>([]);
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
      "text/csv",
      "application/csv",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith(".xls") ||
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".csv");

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

  const simulateUpload = useCallback(async (file: File) => {
    const id = Math.random().toString(36).substring(7);
    const validation = validateFile(file);

    const newFile: UploadedFileData = {
      id,
      name: file.name,
      size: file.size,
      status: validation.valid ? "uploading" : "error",
      progress: validation.valid ? 0 : 0,
      error: validation.valid ? undefined : validation.error,
    };

    // Auto-generate project name from first file
    if (!projectName) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setProjectName(baseName);
    }

    setUploadedFiles((prev) => [newFile, ...prev]);

    if (!validation.valid) return;

    // Try to detect headers from file (CSV or Excel). Fall back to defaults on error.
    let detectedColumns: string[] | undefined;
    try {
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const firstLine = text.split(/\r?\n/)[0] || '';
        detectedColumns = firstLine
          .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map((s) => s.replace(/^"|"$/g, '').trim())
          .filter(Boolean);
      } else {
        // Dynamic import to avoid bundling if not installed
        const ab = await file.arrayBuffer();
        try {
          const XLSX = await import('xlsx');
          const wb = XLSX.read(ab, { type: 'array' });
          const first = wb.SheetNames[0];
          const ws = wb.Sheets[first];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (Array.isArray(rows) && rows.length > 0) {
            const headerRow = rows[0] as any[];
            detectedColumns = headerRow.map((c) => String(c ?? '').trim()).filter(Boolean);
          }
        } catch (e) {
          // xlsx not available or parse error; ignore and fallback
          detectedColumns = undefined;
        }
      }
    } catch (e) {
      detectedColumns = undefined;
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: "validating", progress: 100 } : f))
        );
        // Simulate validation and column detection
        setTimeout(() => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                  ...f,
                  status: "ready",
                  columns:
                    detectedColumns && detectedColumns.length > 0
                      ? detectedColumns
                      : [
                        "Item Number",
                        "Description",
                        "Quantity",
                        "Unit Price",
                        "Category",
                        "Supplier",
                        "Lead Time",
                        "Notes",
                      ],
                  rowCount: Math.floor(Math.random() * 2000) + 50,
                }
                : f
            )
          );
        }, 800 + Math.random() * 1000);
      } else {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: Math.min(Math.round(progress), 99) } : f))
        );
      }
    }, 150);
  }, [projectName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      Array.from(e.dataTransfer.files).forEach((file) => simulateUpload(file));
    }
  }, [projectName]);

  // When a file becomes ready, request AI suggestions from backend
  const fetchSuggestionsForFile = useCallback(async (fileId: string, cols: string[] | undefined) => {
    if (!cols || cols.length === 0) return;
    const { data, error } = await getMappingSuggestions(cols);
    setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, suggestions: data ?? [], progress: Math.max(f.progress, 50) } : f)));
    if (error) {
      toast({ title: 'AI suggestions failed', description: String(error) });
    }
  }, [toast]);

  //Watch files to detect ready state and request suggestions
  useEffect(() => {
    uploadedFiles.forEach((f) => {
      if (f.status === 'ready' && (!f.suggestions || f.suggestions.length === 0)) {
        fetchSuggestionsForFile(f.id, f.columns);
      }
    });
  }, [uploadedFiles, fetchSuggestionsForFile]);

  const handleFileSelect = useCallback((file: File) => {
    simulateUpload(file);
  }, [projectName]);

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleProcessBatch = async () => {
    const readyFiles = uploadedFiles.filter((f) => f.status === "ready");
    if (!readyFiles.length) {
      toast({ title: "No ready files", description: "No files are ready to be processed." });
      return;
    }

    toast({ title: `Processing ${readyFiles.length} file(s)` });

    // If Supabase is configured, enqueue batch jobs and trigger processing via RPC
    const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

    if (hasSupabase) {
      for (const file of readyFiles) {
        try {
          const { data: job, error: createErr } = await createBatchJob({ fileName: file.name, fileId: file.id });
          if (createErr) {
            toast({ title: 'Failed to queue job', description: createErr.message || String(createErr) });
            continue;
          }

          setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processing', progress: 5 } : f)));

          // Trigger backend RPC to process the job (simulated server-side job)
          const { error: procErr } = await processBatchJob(job.id);
          if (procErr) {
            setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'error' } : f)));
            toast({ title: 'Processing failed', description: procErr.message || String(procErr) });
            continue;
          }

          // If RPC succeeded, update UI
          setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processed', progress: 100 } : f)));
          toast({ title: `${file.name} processed` });
        } catch (e) {
          setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'error' } : f)));
          toast({ title: 'Processing error', description: String(e) });
        }
      }

      toast({ title: 'Batch processing complete', description: `${readyFiles.length} files processed` });
      navigate('/projects');
      return;
    }

    // Fallback: use web workers (existing simulation) when Supabase is not configured
    const workers: Worker[] = [];

    await Promise.all(
      readyFiles.map((file) =>
        new Promise<void>((resolve) => {
          const worker = new Worker(new URL("@/workers/batchProcessor.ts", import.meta.url), { type: 'module' });
          workers.push(worker);

          worker.postMessage({ id: file.id, payload: { name: file.name } });

          worker.addEventListener('message', (evt) => {
            type WorkerMsg = { id: string; type: 'progress' | 'done'; progress?: number };
            const data = evt.data as WorkerMsg;
            if (data.id !== file.id) return;

            if (data.type === 'progress') {
              setUploadedFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress: data.progress ?? f.progress } : f))
              );
            }

            if (data.type === 'done') {
              setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processed', progress: 100 } : f)));
              toast({ title: `${file.name} processed` });
              worker.terminate();
              resolve();
            }
          });

          // Fallback timeout
          setTimeout(() => {
            if (workers.includes(worker)) {
              try {
                worker.terminate();
              } catch (e) {
                // ignore termination errors
              }
              setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processed', progress: 100 } : f)));
              resolve();
            }
          }, 10000);
        })
      )
    );

    toast({ title: "Batch processing complete", description: `${readyFiles.length} files processed` });
    // Navigate to projects list afterward
    navigate("/projects");
  };

  const singleReadyFile = uploadedFiles.length === 1 && uploadedFiles[0].status === "ready";
  const canContinue = singleReadyFile && projectName.trim().length > 0;

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
            Upload your Excel file(s) to start the transformation process
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
              Excel File(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {uploadedFiles.length === 0 ? (
              <FileDropZone
                onFileSelect={handleFileSelect}
                isActive={isDragActive}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {uploadedFiles.map((f) => (
                  <FilePreviewCard key={f.id} file={f} onRemove={handleRemoveFile} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Feature Hint */}
        {uploadedFiles.some((f) => f.status === "ready") && (
          <Card className="mb-6 border-primary/20 bg-gradient-subtle animate-fade-in">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">AI-Powered Suggestions</p>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your columns and suggest optimal mappings when files are ready
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

          <Button variant="ghost" onClick={handleProcessBatch} className="min-h-[44px]">
            Process Batch
          </Button>

          <Button
            onClick={() => {
              const readyFile = uploadedFiles.find(f => f.status === 'ready');
              if (readyFile && canContinue) {
                navigate("/mapping/new", {
                  state: {
                    projectName,
                    fileName: readyFile.name,
                    columns: readyFile.columns,
                    rowCount: readyFile.rowCount,
                    suggestions: readyFile.suggestions,
                    fileId: readyFile.id
                  }
                });
              }
            }}
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

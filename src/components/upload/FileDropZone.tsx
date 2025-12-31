import { useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  isActive?: boolean;
  isDisabled?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  currentFile?: {
    name: string;
    status: "uploading" | "validating" | "ready" | "error";
  } | null;
}

export function FileDropZone({
  onFileSelect,
  isActive = false,
  isDisabled = false,
  accept = ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxSize = 50 * 1024 * 1024,
  currentFile,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (!isDisabled) {
      inputRef.current?.click();
    }
  }, [isDisabled]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  const getIcon = () => {
    if (!currentFile) {
      return <Upload className="h-8 w-8" />;
    }
    switch (currentFile.status) {
      case "error":
        return <AlertCircle className="h-8 w-8" />;
      case "ready":
        return <CheckCircle className="h-8 w-8" />;
      default:
        return <FileSpreadsheet className="h-8 w-8" />;
    }
  };

  const getIconColors = () => {
    if (!currentFile) {
      return "bg-primary/10 text-primary";
    }
    switch (currentFile.status) {
      case "error":
        return "bg-destructive/10 text-destructive";
      case "ready":
        return "bg-accent/10 text-accent";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
        isActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isDisabled && "cursor-not-allowed opacity-50",
        currentFile?.status === "ready" && "border-accent/50 bg-accent/5",
        currentFile?.status === "error" && "border-destructive/50 bg-destructive/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={isDisabled}
      />

      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full transition-transform",
          getIconColors(),
          isActive && "animate-pulse scale-110"
        )}
      >
        {getIcon()}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {isActive
          ? "Drop your file here"
          : currentFile?.name
          ? currentFile.name
          : "Drag & drop your Excel file"}
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        {currentFile
          ? currentFile.status === "ready"
            ? "File ready for processing"
            : currentFile.status === "error"
            ? "Upload failed"
            : "Processing..."
          : "or click to browse from your device"}
      </p>

      {!currentFile && (
        <p className="mt-4 text-xs text-muted-foreground">
          Supports .xls and .xlsx files up to {Math.round(maxSize / (1024 * 1024))}MB
        </p>
      )}
    </div>
  );
}

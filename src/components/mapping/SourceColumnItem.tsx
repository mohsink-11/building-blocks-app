import { GripVertical, Link as LinkIcon, Type, Hash, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SourceColumn {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "boolean";
  sampleValues?: string[];
}

interface SourceColumnItemProps {
  column: SourceColumn;
  isSelected: boolean;
  isMapped: boolean;
  onSelect: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function SourceColumnItem({
  column,
  isSelected,
  isMapped,
  onSelect,
  onDragStart,
  onDragEnd,
}: SourceColumnItemProps) {
  const getTypeIcon = () => {
    switch (column.type) {
      case "number":
        return <Hash className="h-3.5 w-3.5" />;
      case "date":
        return <Calendar className="h-3.5 w-3.5" />;
      default:
        return <Type className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isMapped && !isSelected && "border-accent/30 bg-accent/5"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{column.name}</p>
          {isMapped && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20">
              <LinkIcon className="h-2.5 w-2.5 text-accent" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {getTypeIcon()}
            {column.type}
          </span>
          {column.sampleValues && column.sampleValues[0] && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              e.g. "{column.sampleValues[0]}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

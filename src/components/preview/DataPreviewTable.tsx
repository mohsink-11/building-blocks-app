import { AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface DataRow {
  id: string | number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ColumnDef {
  id: string;
  name: string;
  width?: string;
}

interface DataPreviewTableProps {
  columns: ColumnDef[];
  rows: DataRow[];
  errorRows?: Set<string | number>;
  onRowClick?: (row: DataRow) => void;
  highlightChanges?: boolean;
  emptyMessage?: string;
}

export function DataPreviewTable({
  columns,
  rows,
  errorRows = new Set(),
  onRowClick,
  highlightChanges = false,
  emptyMessage = "No data to display",
}: DataPreviewTableProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string | number>>(new Set());

  const toggleError = (id: string | number) => {
    const newSet = new Set(expandedErrors);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedErrors(newSet);
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-2 py-3 w-8"></th>
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-4 py-3 text-left font-medium whitespace-nowrap"
                style={{ width: col.width }}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const hasError = errorRows.has(row.id);
            const isExpanded = expandedErrors.has(row.id);

            return (
              <>
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    hasError && "bg-destructive/5",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    !hasError && "hover:bg-muted/30"
                  )}
                >
                  <td className="px-2 py-3">
                    {hasError && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleError(row.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-destructive" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    )}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-4 py-3 whitespace-nowrap",
                        highlightChanges && col.id !== "id" && "bg-accent/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {row[col.id] ?? (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {hasError && col.id === columns[columns.length - 1].id && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                {hasError && isExpanded && (
                  <tr className="bg-destructive/5">
                    <td colSpan={columns.length + 1} className="px-4 py-3">
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Validation Error</p>
                          <p className="text-destructive/80">
                            Missing required field or invalid data format. Please check the source data.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

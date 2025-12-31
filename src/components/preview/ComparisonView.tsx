import { ArrowRight, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ComparisonViewProps {
  beforeColumns: { id: string; name: string }[];
  afterColumns: { id: string; name: string }[];
  beforeRows: Record<string, string | number>[];
  afterRows: Record<string, string | number | boolean>[];
  errorRowIds?: Set<string | number>;
  orientation?: "horizontal" | "vertical";
}

export function ComparisonView({
  beforeColumns,
  afterColumns,
  beforeRows,
  afterRows,
  errorRowIds = new Set(),
  orientation = "horizontal",
}: ComparisonViewProps) {
  const renderTable = (
    title: string,
    columns: { id: string; name: string }[],
    rows: Record<string, string | number | boolean>[],
    isAfter: boolean
  ) => (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isAfter ? "bg-accent" : "bg-muted-foreground"
            )}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="w-full rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="px-3 py-2 text-left font-medium whitespace-nowrap text-xs"
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const hasError = isAfter && errorRowIds.has(idx);
                return (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b last:border-0",
                      hasError && "bg-destructive/5"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className="px-3 py-2 whitespace-nowrap text-xs"
                      >
                        {String(row[col.id] ?? "-")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div
      className={cn(
        "flex gap-4",
        orientation === "vertical" ? "flex-col" : "flex-col lg:flex-row"
      )}
    >
      {renderTable("Before (Source)", beforeColumns, beforeRows, false)}

      <div className="flex items-center justify-center py-2 lg:py-0">
        {orientation === "vertical" ? (
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        ) : (
          <ArrowRight className="h-6 w-6 text-muted-foreground hidden lg:block" />
        )}
        <ArrowDown className="h-6 w-6 text-muted-foreground lg:hidden" />
      </div>

      {renderTable("After (Transformed)", afterColumns, afterRows, true)}
    </div>
  );
}

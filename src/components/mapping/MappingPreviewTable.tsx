import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MappingPreviewTableProps {
  columns: { id: string; name: string }[];
  rows: Record<string, string | number>[];
  highlightColumn?: string;
}

export function MappingPreviewTable({
  columns,
  rows,
  highlightColumn,
}: MappingPreviewTableProps) {
  return (
    <ScrollArea className="w-full rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  "px-4 py-3 text-left font-medium whitespace-nowrap",
                  highlightColumn === col.id && "bg-primary/10 text-primary"
                )}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn(
                    "px-4 py-3 whitespace-nowrap",
                    highlightColumn === col.id && "bg-primary/5"
                  )}
                >
                  {row[col.id] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

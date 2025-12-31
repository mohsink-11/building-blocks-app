import { AlertCircle, CheckCircle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PreviewStatsProps {
  totalRows: number;
  successfulRows: number;
  errorRows: number;
}

export function PreviewStats({ totalRows, successfulRows, errorRows }: PreviewStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Rows Processed</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{successfulRows.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Successful</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              errorRows > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{errorRows}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

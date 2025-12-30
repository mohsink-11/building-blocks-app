import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

// Placeholder preview data
const previewData = {
  before: [
    { id: 1, itemNumber: "ITEM-001", description: "Widget Assembly", quantity: 25, unitPrice: 49.99, category: "Equipment", supplier: "Acme Corp", notes: "High priority" },
    { id: 2, itemNumber: "ITEM-002", description: "Gear Component", quantity: 100, unitPrice: 12.50, category: "Spare", supplier: "Parts Inc", notes: "Standard" },
    { id: 3, itemNumber: "ITEM-003", description: "Motor Unit", quantity: 5, unitPrice: 299.00, category: "Equipment", supplier: "MotorWorks", notes: "Replacement" },
  ],
  after: [
    { id: 1, partId: "ITEM-001", fullDescription: "Widget Assembly - High priority", qty: 25, price: "$49.99", vendor: "Acme Corp", status: "Active", hasError: false },
    { id: 2, partId: "ITEM-002", fullDescription: "Gear Component - Standard", qty: 100, price: "$12.50", vendor: "Parts Inc", status: "Active", hasError: false },
    { id: 3, partId: "ITEM-003", fullDescription: "Motor Unit - Replacement", qty: 5, price: "$299.00", vendor: "MotorWorks", status: "Active", hasError: true },
  ],
};

export default function Preview() {
  const { projectId } = useParams<{ projectId: string }>();
  const [viewMode, setViewMode] = useState<"split" | "after">("split");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefresh = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1500);
  };

  const handleExport = () => {
    // TODO: Implement export logic
    console.log("Exporting...");
  };

  const errorCount = previewData.after.filter((row) => row.hasError).length;

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link to={`/rules/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rules
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Data Preview
            </h1>
            <p className="text-muted-foreground">
              Review transformations before exporting
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isProcessing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{previewData.after.length}</p>
              <p className="text-sm text-muted-foreground">Rows Processed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{previewData.after.length - errorCount}</p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${errorCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{errorCount}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-medium">View:</span>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as "split" | "after")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="split">Before & After</SelectItem>
            <SelectItem value="after">Transformed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Tables */}
      {viewMode === "split" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Before Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Before (Source)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Item Number</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-left font-medium">Qty</th>
                      <th className="px-3 py-2 text-left font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.before.map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="px-3 py-2">{row.itemNumber}</td>
                        <td className="px-3 py-2">{row.description}</td>
                        <td className="px-3 py-2">{row.quantity}</td>
                        <td className="px-3 py-2">${row.unitPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* After Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">After (Transformed)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Part ID</th>
                      <th className="px-3 py-2 text-left font-medium">Full Description</th>
                      <th className="px-3 py-2 text-left font-medium">Qty</th>
                      <th className="px-3 py-2 text-left font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.after.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b ${row.hasError ? "bg-destructive/5" : ""}`}
                      >
                        <td className="px-3 py-2">{row.partId}</td>
                        <td className="px-3 py-2">{row.fullDescription}</td>
                        <td className="px-3 py-2">{row.qty}</td>
                        <td className="px-3 py-2">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transformed Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Part ID</th>
                    <th className="px-3 py-2 text-left font-medium">Full Description</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Vendor</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.after.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b ${row.hasError ? "bg-destructive/5" : ""}`}
                    >
                      <td className="px-3 py-2">{row.partId}</td>
                      <td className="px-3 py-2">{row.fullDescription}</td>
                      <td className="px-3 py-2">{row.qty}</td>
                      <td className="px-3 py-2">{row.price}</td>
                      <td className="px-3 py-2">{row.vendor}</td>
                      <td className="px-3 py-2">
                        <Badge variant={row.hasError ? "destructive" : "default"}>
                          {row.hasError ? "Error" : row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download as .xlsx
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download as .csv
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

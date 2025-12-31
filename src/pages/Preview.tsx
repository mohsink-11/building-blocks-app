import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  SplitSquareHorizontal,
  Table,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { PreviewStats } from "@/components/preview/PreviewStats";
import { DataPreviewTable, ColumnDef, DataRow } from "@/components/preview/DataPreviewTable";
import { ComparisonView } from "@/components/preview/ComparisonView";

// Placeholder preview data
const beforeColumns = [
  { id: "itemNumber", name: "Item Number" },
  { id: "description", name: "Description" },
  { id: "quantity", name: "Quantity" },
  { id: "unitPrice", name: "Unit Price" },
  { id: "category", name: "Category" },
  { id: "supplier", name: "Supplier" },
];

const afterColumns: ColumnDef[] = [
  { id: "partId", name: "Part ID" },
  { id: "fullDescription", name: "Full Description" },
  { id: "qty", name: "Qty" },
  { id: "price", name: "Price" },
  { id: "vendor", name: "Vendor" },
  { id: "status", name: "Status" },
];

const beforeRows = [
  { id: 1, itemNumber: "ITEM-001", description: "Widget Assembly", quantity: 25, unitPrice: 49.99, category: "Equipment", supplier: "Acme Corp" },
  { id: 2, itemNumber: "ITEM-002", description: "Gear Component", quantity: 100, unitPrice: 12.5, category: "Spare", supplier: "Parts Inc" },
  { id: 3, itemNumber: "ITEM-003", description: "Motor Unit", quantity: 5, unitPrice: 299.0, category: "Equipment", supplier: "MotorWorks" },
  { id: 4, itemNumber: "ITEM-004", description: "Bearing Set", quantity: 50, unitPrice: 8.75, category: "Spare", supplier: "Precision Co" },
  { id: 5, itemNumber: "ITEM-005", description: "Control Panel", quantity: 2, unitPrice: 450.0, category: "Assembly", supplier: "TechParts" },
];

const afterRows: DataRow[] = [
  { id: 1, partId: "ITEM-001", fullDescription: "Widget Assembly - High priority", qty: 25, price: "$49.99", vendor: "Acme Corp", status: "Active" },
  { id: 2, partId: "ITEM-002", fullDescription: "Gear Component - Standard", qty: 100, price: "$12.50", vendor: "Parts Inc", status: "Active" },
  { id: 3, partId: "ITEM-003", fullDescription: "Motor Unit - Replacement", qty: 5, price: "$299.00", vendor: "MotorWorks", status: "Active" },
  { id: 4, partId: "ITEM-004", fullDescription: "Bearing Set", qty: 50, price: "$8.75", vendor: "Precision Co", status: "Active" },
  { id: 5, partId: "ITEM-005", fullDescription: "Control Panel - Assembly", qty: 2, price: "$450.00", vendor: "TechParts", status: "Active" },
];

const errorRowIds = new Set([3]);

export default function Preview() {
  const { projectId } = useParams<{ projectId: string }>();
  const [viewMode, setViewMode] = useState<"comparison" | "table">("comparison");
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");

  const handleRefresh = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1500);
  };

  const handleExport = () => {
    // TODO: Implement export logic
    console.log("Exporting as:", exportFormat);
  };

  const errorCount = errorRowIds.size;
  const totalRows = afterRows.length;
  const successfulRows = totalRows - errorCount;

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
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isProcessing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div className="flex">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-[100px] rounded-r-none border-r-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">.xlsx</SelectItem>
                  <SelectItem value="csv">.csv</SelectItem>
                  <SelectItem value="json">.json</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} className="rounded-l-none">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6">
        <PreviewStats
          totalRows={totalRows}
          successfulRows={successfulRows}
          errorRows={errorCount}
        />
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "comparison" | "table")} className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="comparison" className="gap-2">
            <SplitSquareHorizontal className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-4">
          <ComparisonView
            beforeColumns={beforeColumns}
            afterColumns={afterColumns}
            beforeRows={beforeRows}
            afterRows={afterRows}
            errorRowIds={errorRowIds}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Transformed Data</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DataPreviewTable
                columns={afterColumns}
                rows={afterRows}
                errorRows={errorRowIds}
                highlightChanges
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options Card */}
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Quick Export</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Download Excel (.xlsx)
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              <Download className="h-4 w-4" />
              More formats...
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

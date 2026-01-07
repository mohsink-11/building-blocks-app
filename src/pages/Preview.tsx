import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";

// Fallback preview data
const fallbackBeforeColumns = [
  { id: "itemNumber", name: "Item Number" },
  { id: "description", name: "Description" },
  { id: "quantity", name: "Quantity" },
  { id: "unitPrice", name: "Unit Price" },
  { id: "category", name: "Category" },
  { id: "supplier", name: "Supplier" },
];

const fallbackAfterColumns: ColumnDef[] = [
  { id: "partId", name: "Part ID" },
  { id: "fullDescription", name: "Full Description" },
  { id: "qty", name: "Qty" },
  { id: "price", name: "Price" },
  { id: "vendor", name: "Vendor" },
  { id: "status", name: "Status" },
];

const fallbackBeforeRows = [
  { id: 1, itemNumber: "ITEM-001", description: "Widget Assembly", quantity: 25, unitPrice: 49.99, category: "Equipment", supplier: "Acme Corp" },
  { id: 2, itemNumber: "ITEM-002", description: "Gear Component", quantity: 100, unitPrice: 12.5, category: "Spare", supplier: "Parts Inc" },
  { id: 3, itemNumber: "ITEM-003", description: "Motor Unit", quantity: 5, unitPrice: 299.0, category: "Equipment", supplier: "MotorWorks" },
  { id: 4, itemNumber: "ITEM-004", description: "Bearing Set", quantity: 50, unitPrice: 8.75, category: "Spare", supplier: "Precision Co" },
  { id: 5, itemNumber: "ITEM-005", description: "Control Panel", quantity: 2, unitPrice: 450.0, category: "Assembly", supplier: "TechParts" },
];

const fallbackAfterRows: DataRow[] = [
  { id: 1, partId: "ITEM-001", fullDescription: "Widget Assembly - High priority", qty: 25, price: "$49.99", vendor: "Acme Corp", status: "Active" },
  { id: 2, partId: "ITEM-002", fullDescription: "Gear Component - Standard", qty: 100, price: "$12.50", vendor: "Parts Inc", status: "Active" },
  { id: 3, partId: "ITEM-003", fullDescription: "Motor Unit - Replacement", qty: 5, price: "$299.00", vendor: "MotorWorks", status: "Active" },
  { id: 4, partId: "ITEM-004", fullDescription: "Bearing Set", qty: 50, price: "$8.75", vendor: "Precision Co", status: "Active" },
  { id: 5, partId: "ITEM-005", fullDescription: "Control Panel - Assembly", qty: 2, price: "$450.00", vendor: "TechParts", status: "Active" },
];

export default function Preview() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"comparison" | "table">("comparison");
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");

  // Get data from navigation state or sessionStorage
  const getPreviewData = () => {
    // First try location state
    if (location.state) {
      return location.state as {
        projectName?: string;
        fileName?: string;
        sourceColumns?: Array<{ id: string; name: string; type: string }>;
        targetColumns?: Array<{ 
          id: string; 
          name: string; 
          mappedColumns: string[];
          delimiter: string;
        }>;
        rowCount?: number;
      };
    }
    
    // Fallback to sessionStorage
    const stored = sessionStorage.getItem('previewData');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    
    return null;
  };

  const previewData = getPreviewData();

  // Convert source columns to before columns format
  const beforeColumns = previewData?.sourceColumns 
    ? previewData.sourceColumns.map(col => ({
        id: col.id,
        name: col.name
      }))
    : fallbackBeforeColumns;

  // Convert target columns to after columns format
  const afterColumns: ColumnDef[] = previewData?.targetColumns 
    ? previewData.targetColumns.map(col => ({
        id: col.id,
        name: col.name
      }))
    : fallbackAfterColumns;

  // Generate sample rows based on mappings (simplified version)
  // In a real implementation, you would transform actual data here
  const generatePreviewRows = () => {
    if (!previewData?.targetColumns) {
      return { before: fallbackBeforeRows, after: fallbackAfterRows };
    }

    // Generate sample before rows
    const beforeRows = Array.from({ length: 5 }, (_, i) => {
      const row: any = { id: i + 1 };
      beforeColumns.forEach(col => {
        row[col.id] = `Sample ${col.name} ${i + 1}`;
      });
      return row;
    });

    // Generate sample after rows based on mappings
    const afterRows: DataRow[] = Array.from({ length: 5 }, (_, i) => {
      const row: any = { id: i + 1 };
      previewData.targetColumns!.forEach(targetCol => {
        // Combine mapped source columns
        const mappedValues = targetCol.mappedColumns
          .map(sourceId => {
            const sourceCol = previewData.sourceColumns?.find(s => s.id === sourceId);
            return sourceCol ? `${sourceCol.name} ${i + 1}` : '';
          })
          .filter(Boolean);
        
        row[targetCol.id] = mappedValues.join(targetCol.delimiter || ' ');
      });
      return row;
    });

    return { before: beforeRows, after: afterRows };
  };

  const { before: beforeRows, after: afterRows } = generatePreviewRows();

  const errorRowIds = new Set([3]); // Example error row
  const errorCount = errorRowIds.size;
  const totalRows = afterRows.length;
  const successfulRows = totalRows - errorCount;

  const handleRefresh = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1500);
  };

  // Export to CSV format
  const exportToCSV = (data: DataRow[], columns: ColumnDef[], filename: string) => {
    try {
      // Create CSV header
      const headers = columns.map(col => col.name).join(',');
      
      // Create CSV rows
      const rows = data.map(row => {
        return columns.map(col => {
          const value = row[col.id];
          // Escape values that contain commas, quotes, or newlines
          if (value && (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n'))) {
            return `"${value.toString().replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',');
      });
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      
      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      return false;
    }
  };

  // Export to Excel format (XLSX)
  const exportToXLSX = async (data: DataRow[], columns: ColumnDef[], filename: string) => {
    try {
      // Dynamic import of xlsx library
      const XLSX = await import('xlsx');
      
      // Prepare data for worksheet
      const worksheetData = [
        columns.map(col => col.name), // Header row
        ...data.map(row => columns.map(col => row[col.id] || '')) // Data rows
      ];
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const columnWidths = columns.map(col => ({ wch: Math.max(col.name.length + 2, 15) }));
      worksheet['!cols'] = columnWidths;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transformed Data');
      
      // Download file
      XLSX.writeFile(workbook, filename);
      
      return true;
    } catch (error) {
      console.error('XLSX export error:', error);
      toast({
        title: "Export Failed",
        description: "XLSX library not available. Please try CSV export instead.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Export to JSON format
  const exportToJSON = (data: DataRow[], columns: ColumnDef[], filename: string) => {
    try {
      // Create clean data objects with column names as keys
      const jsonData = data.map(row => {
        const obj: Record<string, any> = {};
        columns.forEach(col => {
          obj[col.name] = row[col.id];
        });
        return obj;
      });
      
      // Create formatted JSON string
      const jsonContent = JSON.stringify(jsonData, null, 2);
      
      // Create and download file
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      
      return true;
    } catch (error) {
      console.error('JSON export error:', error);
      return false;
    }
  };

  // Main export handler
  const handleExport = async (format?: string) => {
    const exportFormatToUse = format || exportFormat;
    const baseFilename = previewData?.fileName 
      ? previewData.fileName.replace(/\.[^/.]+$/, '') 
      : 'transformed_data';
    
    let success = false;
    let filename = '';

    setIsProcessing(true);

    try {
      switch (exportFormatToUse) {
        case 'xlsx':
          filename = `${baseFilename}_transformed.xlsx`;
          success = await exportToXLSX(afterRows, afterColumns, filename);
          break;
        case 'csv':
          filename = `${baseFilename}_transformed.csv`;
          success = exportToCSV(afterRows, afterColumns, filename);
          break;
        case 'json':
          filename = `${baseFilename}_transformed.json`;
          success = exportToJSON(afterRows, afterColumns, filename);
          break;
        default:
          toast({
            title: "Invalid Format",
            description: "Please select a valid export format.",
            variant: "destructive"
          });
          return;
      }

      if (success) {
        toast({
          title: "Export Successful",
          description: `Data exported as ${filename}`,
        });
      } else {
        toast({
          title: "Export Failed",
          description: "There was an error exporting your data. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred during export.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
              {previewData?.fileName 
                ? `Review transformations for: ${previewData.fileName}` 
                : "Review transformations before exporting"}
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
              <Button 
                onClick={() => handleExport()} 
                className="rounded-l-none"
                disabled={isProcessing}
              >
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
              <p className="text-sm text-muted-foreground">
                {previewData?.targetColumns?.length 
                  ? `${previewData.targetColumns.length} columns configured` 
                  : "Preview of transformed data"}
              </p>
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
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => handleExport('xlsx')}
              disabled={isProcessing}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download Excel (.xlsx)
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => handleExport('csv')}
              disabled={isProcessing}
            >
              <FileText className="h-4 w-4" />
              Download CSV
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => handleExport('json')}
              disabled={isProcessing}
            >
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
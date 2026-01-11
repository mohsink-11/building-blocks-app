import { useState, useEffect } from "react";
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { addProjectExport, addProjectActivity } from "@/integrations/supabase/api";
import { pivotByGroup, PivotMethod } from '@/lib/rowTransforms';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { transformExcelData, TransformPayload } from '@/lib/excelTransform';

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

  // Row-to-column transform state
  const [pivotEnabled, setPivotEnabled] = useState(false);
  const [pivotGroupCol, setPivotGroupCol] = useState<string | null>(null);
  const [pivotValueCol, setPivotValueCol] = useState<string | null>(null);
  const [pivotMethod, setPivotMethod] = useState<PivotMethod>('self');
  const [pivotParentLabel, setPivotParentLabel] = useState<string>('Equipment');

  // Instead of separate Group/Value selects, user picks a single mapped target field to pivot values from
  const [pivotMappedField, setPivotMappedField] = useState<string | null>(null);

  // Store transformed data (computed when pivot is applied)
  const [transformedBeforeRows, setTransformedBeforeRows] = useState<any[] | null>(null);
  const [transformedAfterRows, setTransformedAfterRows] = useState<any[] | null>(null);

  // Pivot column definitions and mappings (pivotId -> targetId)
  const [pivotColDefs, setPivotColDefs] = useState<Array<{id:string;name:string;}>>([]);
  const [pivotMappings, setPivotMappings] = useState<Record<string,string>>({});
  // persist preview-stage pivot state
  const PIVOT_PREVIEW_KEY = 'pivotPreviewState';

  // preview mode: mapped-only (default) or all
  const [previewMode, setPreviewMode] = useState<'mapped-only'|'all'>('mapped-only');

  // pivotGroupAssignments: map of targetId -> array of group names selected for that target
  const [pivotGroupAssignments, setPivotGroupAssignments] = useState<Record<string,string[]>>({});

  // columnGroups: map of targetId -> array of bases assigned to that target (e.g. ['Assembly','Equipment'])
  const [columnGroups, setColumnGroups] = useState<Record<string,string[]>>({});

  // mappedSources: explicit per-target list of source column ids (multi-select)
  const [mappedSources, setMappedSources] = useState<Record<string,string[]>>({});

  // columnParentLabel: per-target parent label (used when method === 'parent')
  const [columnPreferredBase, setColumnPreferredBase] = useState<Record<string,string>>({});
  const [columnParentLabel, setColumnParentLabel] = useState<Record<string,string>>({});

  // columnMethods: per-target pivot method (self, previous, parent, after)
  const [columnMethods, setColumnMethods] = useState<Record<string,string>>({});

  // columnBaseColumn: per-target which source column to use as base/group column (by id)
  const [columnBaseColumn, setColumnBaseColumn] = useState<Record<string,string>>({});

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

  // Restore preview-stage pivot state if present (on first render)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PIVOT_PREVIEW_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.pivotColDefs && Array.isArray(parsed.pivotColDefs)) {
          setPivotColDefs(parsed.pivotColDefs);
        }
        if (parsed?.pivotMappings) {
          setPivotMappings(parsed.pivotMappings);
        }
        if (parsed?.pivotGroupAssignments) {
          setPivotGroupAssignments(parsed.pivotGroupAssignments);
        }
        if (parsed?.columnGroups) {
          setColumnGroups(parsed.columnGroups);
        }
        if (parsed?.pivotGroupCol) setPivotGroupCol(parsed.pivotGroupCol);
        if (parsed?.pivotValueCol) setPivotValueCol(parsed.pivotValueCol);
        if (parsed?.pivotMappedField) setPivotMappedField(parsed.pivotMappedField);
        if (parsed?.pivotMethod) setPivotMethod(parsed.pivotMethod);
        if (parsed?.previewMode) setPreviewMode(parsed.previewMode);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Load persisted assignment fields from previewData (so UI reflects saved assignments on mount or navigation)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('previewData');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed?.columnGroups) setColumnGroups(parsed.columnGroups);
      if (parsed?.mappedSources) setMappedSources(parsed.mappedSources);
      if (parsed?.columnPreferredBase) setColumnPreferredBase(parsed.columnPreferredBase);
      if (parsed?.columnMethods) setColumnMethods(parsed.columnMethods);
      if (parsed?.columnBaseColumn) setColumnBaseColumn(parsed.columnBaseColumn);
      if (parsed?.columnParentLabel) setColumnParentLabel(parsed.columnParentLabel);
    } catch (err) {
      // ignore
    }
  // Re-run when project changes or when navigation key changes (so returning to preview reloads assignments)
  }, [projectId, location.key]);

  // Convert source columns to before columns format
  // Show only the columns that have been mapped in Mapping (previewData.targetColumns) plus the group column for segmentation
  let beforeColumns: ColumnDef[] = [];

  if (previewData?.targetColumns) {
    // show only target columns (the single set from Mapping.tsx)
    beforeColumns = previewData.targetColumns.map((t: any) => ({ id: t.id, name: t.name, isMapped: true } as ColumnDef));
  } else if (previewData?.sourceColumns) {
    // fallback to showing all source columns if targetColumns not available
    beforeColumns = previewData.sourceColumns.map((col: any) => ({ id: col.id, name: col.name }));
  } else {
    beforeColumns = fallbackBeforeColumns;
  }

  // If we have pivot preview columns, include only those pivot columns that are assigned to targets (via pivotGroupAssignments)
  if (pivotEnabled && pivotColDefs && pivotColDefs.length > 0) {
    const assignedPivotCols = pivotColDefs.filter(p => {
      // check if p.name exists in any pivotGroupAssignments
      return Object.values(pivotGroupAssignments || {}).some((arr: string[]) => arr.includes(p.name));
    });
    beforeColumns = [...beforeColumns, ...assignedPivotCols.map(p => ({ id: p.id, name: p.name, isPivot: true }))];
  }

  // Preview mode: if 'mapped-only' show only mapped target columns + assigned pivot columns; if 'all' show everything
  if (previewMode === 'mapped-only') {
    // remove duplicates
    beforeColumns = beforeColumns.reduce((acc: any[], col) => {
      if (!acc.find(c => c.id === col.id)) acc.push(col);
      return acc;
    }, []);
  } else {
    // previewMode === 'all' -> include every source column plus pivot cols
    if (previewData?.sourceColumns) {
      const all = previewData.sourceColumns.map((col: any) => ({ id: col.id, name: col.name }));
      const pivotOnly = beforeColumns.filter((c: any) => c.isPivot);
      beforeColumns = [...all, ...pivotOnly.filter(p => !all.find(a => a.id === p.id))];
    }
  }

  // Do not show raw group/value columns in preview (user requested); group is only used to assign pivot values to targets.

  // Convert target columns to after columns format
  const afterColumns: ColumnDef[] = previewData?.targetColumns 
    ? previewData.targetColumns.map(col => ({
        id: col.id,
        name: col.name,
        isMapped: true,
        // attach any column group assignment metadata
        groups: columnGroups[col.id] || []
      } as any))
    : fallbackAfterColumns;

  // Generate preview rows based on mappings and actual uploaded rows when available
  const generatePreviewRows = () => {
    if (!previewData?.targetColumns) {
      return { before: fallbackBeforeRows, after: fallbackAfterRows };
    }

    // If we have real uploaded rows (array of arrays), construct rows where columns are the mapped target columns
    if (previewData.rows && Array.isArray(previewData.rows) && previewData.rows.length > 0 && previewData.sourceColumns) {
      // Build a lookup for source id -> column index
      const sourceIndexById: Record<string, number> = {};
      previewData.sourceColumns!.forEach((col: any, idx: number) => sourceIndexById[col.id] = idx);

      // For each row, build an object with target column values using mapped source columns and pivot group assignments
      const mappedBeforeRows: DataRow[] = previewData.rows.map((r, i) => {
        const obj: any = { id: i + 1 };

        previewData.targetColumns!.forEach((targetCol: any) => {
          // collect values from explicitly mapped source columns
          const mappedValuesFromSources = (targetCol.mappedColumns || []).map((srcId: string) => {
            const idx = sourceIndexById[srcId];
            return idx >= 0 ? (r[idx] ?? '') : '';
          }).filter(Boolean);

          // collect values from pivot columns based on pivotGroupAssignments for this target
          const allowedGroups = pivotGroupAssignments[targetCol.id] || [];

          // If transformedBeforeRows exists (pivot preview computed), use it to get pivot values for the row
          let pivotValues: string[] = [];
          if (transformedBeforeRows && transformedBeforeRows.length > 0) {
            const tr = transformedBeforeRows[i] || {};
            pivotValues = (pivotColDefs || [])
              .filter(p => allowedGroups.includes(p.name))
              .map(p => tr[p.id] ?? '')
              .filter(Boolean);
          }

          const combined = [...mappedValuesFromSources, ...pivotValues].filter(Boolean);
          obj[targetCol.id] = combined.join(targetCol.delimiter || ' ');
        });

        return obj;
      });

      const afterRows: DataRow[] = mappedBeforeRows.map(row => ({ ...row }));
      return { before: mappedBeforeRows, after: afterRows };

      return { before: mappedBeforeRows, after: afterRows };
    }

    // Fallback to generated samples if no real rows available
    const beforeRows = Array.from({ length: 5 }, (_, i) => {
      const row: any = { id: i + 1 };
      beforeColumns.forEach(col => {
        row[col.id] = `Sample ${col.name} ${i + 1}`;
      });
      return row;
    });

    const afterRows: DataRow[] = Array.from({ length: 5 }, (_, i) => {
      const row: any = { id: i + 1 };
      previewData.targetColumns!.forEach(targetCol => {
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

  const { before: beforeRowsRaw, after: afterRowsRaw } = generatePreviewRows();

  // Apply pivot transform if enabled
  const beforeRows = pivotEnabled && transformedBeforeRows ? transformedBeforeRows : beforeRowsRaw;
  const afterRows = pivotEnabled && transformedAfterRows ? transformedAfterRows : afterRowsRaw;

  // computedAfterRows: Apply per-target assignments (method/parent/base column) to produce a live preview
  const [computedAfterRows, setComputedAfterRows] = useState<DataRow[] | null>(null);

  const applyAssignmentsToRows = () => {
    try {
      if (!previewData?.rows || !Array.isArray(previewData.rows) || !previewData.sourceColumns) return null;

      const sourceIndexById: Record<string, number> = {};
      previewData.sourceColumns.forEach((col: any, idx: number) => sourceIndexById[col.id] = idx);

      const rows = previewData.rows;
      const result: DataRow[] = rows.map((r: any[], rowIdx: number) => {
        const obj: any = { id: rowIdx + 1 };

        (previewData.targetColumns || []).forEach((t: any) => {
          const srcs: string[] = mappedSources[t.id] ?? t.mappedColumns ?? [];

          // Determine if this target applies to this row based on assigned bases (if any)
          const allowedBases = columnGroups[t.id] ?? [];
          let rowBaseVal = '';
          if (columnBaseColumn[t.id]) {
            const bidx = sourceIndexById[columnBaseColumn[t.id]];
            rowBaseVal = bidx >= 0 ? (r[bidx] ?? '') : '';
          } else {
            // fallback: try to use detected base column index
            const globalBaseIdx = getBaseColumnIndex();
            rowBaseVal = globalBaseIdx >= 0 ? (r[globalBaseIdx] ?? '') : '';
          }

          if (allowedBases.length > 0 && rowBaseVal) {
            // if current row base isn't in allowedBases, leave empty
            if (!allowedBases.map(x => x.toLowerCase()).includes(rowBaseVal.toString().toLowerCase())) {
              obj[t.id] = '';
              return;
            }
          }

          const method = columnMethods[t.id] ?? 'self';

          const readValuesFromRow = (rowArr: any[], sources: string[]) => (
            sources.map(srcId => {
              const idx = sourceIndexById[srcId];
              return idx >= 0 ? (rowArr[idx] ?? '') : '';
            }).filter(Boolean).join(t.delimiter || ' ')
          );

          let val = '';

          if (method === 'self' || !method) {
            val = readValuesFromRow(r, srcs);
          } else if (method === 'previous') {
            // walk back to find last non-empty
            for (let j = rowIdx - 1; j >= 0; j--) {
              const candidate = readValuesFromRow(rows[j], srcs);
              if (candidate) { val = candidate; break; }
            }
            if (!val) val = readValuesFromRow(r, srcs);
          } else if (method === 'after') {
            for (let j = rowIdx + 1; j < rows.length; j++) {
              const candidate = readValuesFromRow(rows[j], srcs);
              if (candidate) { val = candidate; break; }
            }
            if (!val) val = readValuesFromRow(r, srcs);
          } else if (method === 'parent') {
            const parentLabel = (columnParentLabel[t.id] || '').toString().trim() || (columnGroups[t.id] && columnGroups[t.id][0]) || (columnPreferredBase[t.id] || '').toString().trim();
            const baseIdx = (() => {
              if (columnBaseColumn[t.id]) return sourceIndexById[columnBaseColumn[t.id]];
              return getBaseColumnIndex();
            })();

            if (parentLabel && baseIdx !== undefined && baseIdx >= 0) {
              for (let j = rowIdx - 1; j >= 0; j--) {
                const candidateBase = (rows[j][baseIdx] || '').toString().toLowerCase();
                if (candidateBase === parentLabel.toLowerCase()) {
                  val = readValuesFromRow(rows[j], srcs);
                  break;
                }
              }
            }

            if (!val) val = readValuesFromRow(r, srcs);
          }

          obj[t.id] = val;
        });

        return obj;
      });

      // If any columnGroups are selected across targets, filter rows to only those base values
      const selectedBases = Array.from(new Set(Object.values(columnGroups).flat()));
      const globalBaseIdx = getBaseColumnIndex();
      if (selectedBases.length > 0 && globalBaseIdx >= 0) {
        const filtered = result.filter((rowObj) => {
          const originalRow = rows[(rowObj.id as number) - 1];
          const val = (originalRow[globalBaseIdx] || '').toString().toLowerCase();
          return selectedBases.map(s => s.toLowerCase()).includes(val);
        });
        return filtered;
      }

      return result;

      return result;
    } catch (err) {
      console.error('apply assignments error', err);
      return null;
    }
  };

  // Recompute computedAfterRows whenever assignments or input rows change
  useEffect(() => {
    const applied = applyAssignmentsToRows();
    setComputedAfterRows(applied as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData?.rows, mappedSources, columnMethods, columnBaseColumn, columnParentLabel, columnGroups, columnPreferredBase]);

  // Use computedAfterRows if available else fallback
  const effectiveAfterRows = computedAfterRows && computedAfterRows.length > 0 ? computedAfterRows : afterRows;

  const errorRowIds = new Set([3]); // Example error row
  const errorCount = errorRowIds.size;
  const totalRows = afterRows.length;
  const successfulRows = totalRows - errorCount;

  const handleRefresh = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1500);
  };

  // Persist small updates into previewData stored in sessionStorage
  const persistPreviewData = (updates: Record<string, any>) => {
    try {
      const stored = sessionStorage.getItem('previewData');
      const base = stored ? JSON.parse(stored) : (previewData ? { ...previewData } : {});
      const merged = { ...base, ...updates };
      sessionStorage.setItem('previewData', JSON.stringify(merged));
    } catch (err) {
      // ignore
    }
  };

  const handleToggleMappedSource = (targetId: string, sourceId: string, checked: boolean) => {
    setMappedSources(prev => {
      const baseMapped = previewData?.targetColumns?.find((t: any) => t.id === targetId)?.mappedColumns || [];
      const current = new Set<string>(prev[targetId] ?? baseMapped as string[]);
      if (checked) current.add(sourceId); else current.delete(sourceId);
      const next = { ...prev, [targetId]: Array.from(current) };
      persistPreviewData({ mappedSources: next });
      return next;
    });
  };

  const handleSetPreferredBase = (targetId: string, value: string) => {
    // Deprecated single-select handler kept for compatibility — migrate to `columnGroups` multi-select instead
    setColumnPreferredBase(prev => {
      const next = { ...prev, [targetId]: value === '_none' ? '' : value };
      persistPreviewData({ columnPreferredBase: next });
      return next;
    });
  };

  const getBaseColumnIndex = (): number => {
    // Prefer an explicitly set base column from any target
    const explicit = Object.values(columnBaseColumn).find(Boolean);
    const sourceCols = previewData?.sourceColumns || [];
    if (explicit) {
      return sourceCols.findIndex((s: any) => s.id === explicit);
    }

    // Otherwise heuristically find a column named 'base' or 'category' or 'type'
    const idx = sourceCols.findIndex((s: any) => /^(base|category|type)$/i.test(s.name));
    if (idx >= 0) return idx;

    return -1;
  };

  const handleSetMethod = (targetId: string, value: string) => {
    setColumnMethods(prev => {
      const next = { ...prev, [targetId]: value };
      persistPreviewData({ columnMethods: next });
      return next;
    });
  };

  const handleSetBaseColumn = (targetId: string, value: string) => {
    setColumnBaseColumn(prev => {
      const next = { ...prev, [targetId]: value === '_none' ? '' : value };
      persistPreviewData({ columnBaseColumn: next });
      return next;
    });
  };

  const handleSetParentLabel = (targetId: string, text: string) => {
    setColumnParentLabel(prev => {
      const next = { ...prev, [targetId]: text };
      persistPreviewData({ columnParentLabel: next });
      return next;
    });
  };

  const computeSampleValue = (targetCol: any) => {
    try {
      const srcs = mappedSources[targetCol.id] ?? targetCol.mappedColumns ?? [];
      if (!previewData?.sourceColumns) return '(no mapping)';
      const names = srcs.map((srcId: string) => {
        const src = (previewData.sourceColumns || []).find((s: any) => s.id === srcId);
        return src ? src.name : srcId;
      });
      return names.length > 0 ? names.join(' + ') : '(no mapped columns)';
    } catch (err) {
      return '(error)';
    }
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
      // Build base rules from column assignments and preferred bases
      const baseRules: Record<string, any> = {};
      Object.entries(columnGroups || {}).forEach(([targetId, bases]) => {
        bases.forEach((base) => {
          const baseKey = base.charAt(0).toUpperCase() + base.slice(1);
          if (!baseRules[baseKey]) {
            baseRules[baseKey] = {};
          }
          // You can add more sophisticated base rules here if needed
          // For now, the combine logic is handled per-target
        });
      });

      // Build column mapping (sourceId -> target column name)
      const columnMapping: Record<string, string> = {};
      (previewData?.targetColumns || []).forEach((target: any) => {
        (target.mappedColumns || []).forEach((srcId: string) => {
          const srcCol = previewData?.sourceColumns?.find((c: any) => c.id === srcId);
          if (srcCol) {
            columnMapping[srcId] = target.name;
          }
        });
      });

      // Apply transformation
      const transformPayload: TransformPayload = {
        rows: previewData?.rows || [],
        sourceColumns: previewData?.sourceColumns || [],
        targetColumns: previewData?.targetColumns || [],
        mapping: columnMapping,
        baseRules,
        outputOrder: afterColumns.map(c => c.name),
        columnGroups,
        columnMethods,
        columnBaseColumn,
      };

      const transformResult = transformExcelData(transformPayload);

      // Now export the transformed data
      switch (exportFormatToUse) {
        case 'xlsx':
          filename = `${baseFilename}_transformed.xlsx`;
          success = await exportToXLSX(transformResult.rows.map((row, idx) => {
            const obj: any = { id: idx + 1 };
            transformResult.columns.forEach((col, colIdx) => {
              obj[col.id] = row[colIdx] || '';
            });
            return obj;
          }), transformResult.columns, filename);
          break;
        case 'csv':
          filename = `${baseFilename}_transformed.csv`;
          success = exportToCSV(transformResult.rows.map((row, idx) => {
            const obj: any = { id: idx + 1 };
            transformResult.columns.forEach((col, colIdx) => {
              obj[col.id] = row[colIdx] || '';
            });
            return obj;
          }), transformResult.columns, filename);
          break;
        case 'json':
          filename = `${baseFilename}_transformed.json`;
          success = exportToJSON(transformResult.rows.map((row, idx) => {
            const obj: any = { id: idx + 1 };
            transformResult.columns.forEach((col, colIdx) => {
              obj[col.id] = row[colIdx] || '';
            });
            return obj;
          }), transformResult.columns, filename);
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
        // Save export record and activity if projectId exists
        if (projectId) {
          await addProjectExport({
            project_id: projectId,
            name: filename,
            size: transformResult.rows.length ? `${transformResult.rows.length} rows` : undefined,
            created_at: new Date().toISOString(),
          });
          await addProjectActivity({
            project_id: projectId,
            type: 'export',
            description: `Exported as ${filename}`,
            created_at: new Date().toISOString(),
          });
        }
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

  {/* Column Assignments */}
  <Card className="mb-6">
    <CardHeader className="pb-4">
      <CardTitle className="text-lg">Column Assignments</CardTitle>
      <p className="text-sm text-muted-foreground">Choose which source columns feed each target, set a preferred base, and a lookup method for rows.</p>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="grid gap-4">
        {previewData?.targetColumns && previewData.targetColumns.length > 0 ? (
          previewData.targetColumns.map((t: any) => (
            <div key={t.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">{t.name}</div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">Mapping: <span className="font-medium">{t.name}</span></div>
                  <Link
                    to={`/mapping/${projectId}`}
                    state={{
                      sourceColumns: previewData?.sourceColumns,
                      targetColumns: previewData?.targetColumns,
                      rows: previewData?.rows,
                      fileName: previewData?.fileName,
                      selectedTargetId: t.id
                    }}
                    onClick={() => {
                      try {
                        sessionStorage.setItem('mappingData', JSON.stringify({
                          sourceColumns: previewData?.sourceColumns,
                          targetColumns: previewData?.targetColumns,
                          rows: previewData?.rows,
                          fileName: previewData?.fileName
                        }));
                      } catch (err) {}
                    }}
                    className="text-sm text-primary underline"
                  >
                    Edit mapping
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                {/* Mapped sources (readonly, from Mapping) */}
                <div className="sm:w-1/3">
                  <div className="text-sm mb-1">Mapped sources</div>
                  <div className="flex flex-wrap gap-2">
                    {((mappedSources[t.id] && mappedSources[t.id].length > 0) ? mappedSources[t.id] : (t.mappedColumns || [])).map((srcId: string) => {
                      const src = (previewData.sourceColumns || []).find((s: any) => s.id === srcId);
                      const name = src?.name ?? srcId;
                      return <Badge key={srcId} className="text-sm">{name}</Badge>;
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Mapped columns come from Mapping; change them in Mapping to update here.</div>
                </div>

                {/* Preferred bases (multi-checkbox) */}
                <div className="sm:w-1/3">
                  <div className="text-sm mb-1">Preferred Base(s)</div>
                  <div className="flex gap-3">
                    {['Assembly','Equipment','Spare'].map(base => {
                      const checked = (columnGroups[t.id] || []).includes(base);
                      return (
                        <label key={base} className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setColumnGroups(prev => {
                                const current = new Set<string>(prev[t.id] || [] as string[]);
                                if (isChecked) current.add(base); else current.delete(base);
                                const next = { ...prev, [t.id]: Array.from(current) };
                                persistPreviewData({ columnGroups: next });
                                return next;
                              });
                            }}
                          />
                          <span>{base}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Method & Base Column */}
                <div className="sm:w-1/3 flex gap-3">
                  <div>
                    <div className="text-sm mb-1">Method</div>
                    <Select value={columnMethods[t.id] ?? 'self'} onValueChange={(v) => handleSetMethod(t.id, v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self</SelectItem>
                        <SelectItem value="previous">Previous</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="after">After</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm mb-1">Base Column</div>
                    <Select value={columnBaseColumn[t.id] ?? '_none'} onValueChange={(v) => handleSetBaseColumn(t.id, v)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">(none)</SelectItem>
                        {(previewData.sourceColumns || []).map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

                {/* If method is parent, allow entering Parent Label */}
                <div className="sm:w-full mt-3">
                  { (columnMethods[t.id] ?? 'self') === 'parent' && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm">Parent Label</div>
                      <Input value={columnParentLabel[t.id] ?? ''} onChange={(e) => handleSetParentLabel(t.id, e.target.value)} placeholder="e.g., Equipment" />
                    </div>
                  )}
                </div>

              {/* Final mapped preview */}
              <div className="mt-3 border rounded p-4">
                <div className="text-sm text-muted-foreground mb-2">Preview</div>
                <div className="text-lg font-medium">{computeSampleValue(t)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No target columns configured. Open Mapping to configure target columns first.</div>
        )}

        {/* Save assignments */}
        <div className="mt-4 flex gap-2">
          <Button onClick={() => {
            // persist all assignment pieces into previewData
            try {
              const stored = sessionStorage.getItem('previewData');
              const base = stored ? JSON.parse(stored) : (previewData ? { ...previewData } : {});
              const updated = {
                ...base,
                columnGroups,
                mappedSources,
                columnPreferredBase,
                columnMethods,
                columnBaseColumn,
                columnParentLabel,
              };
              sessionStorage.setItem('previewData', JSON.stringify(updated));
              toast({ title: 'Assignments Saved', description: 'Column assignments persisted' });
            } catch (err) {
              toast({ title: 'Error', description: 'Could not save assignments', variant: 'destructive' });
            }
          }}>Save Assignments</Button>

          <Button variant="ghost" onClick={() => {
            // Reset assignment-related state
            setColumnGroups({});
            setMappedSources({});
            setColumnPreferredBase({});
            setColumnMethods({});
            setColumnBaseColumn({});
            setColumnParentLabel({});
            try { sessionStorage.setItem('previewData', JSON.stringify({ ...(previewData || {}), columnGroups: {}, mappedSources: {}, columnPreferredBase: {}, columnMethods: {}, columnBaseColumn: {}, columnParentLabel: {} })); } catch(e){}
            toast({ title: 'Reset', description: 'Assignments cleared' });
          }}>Reset</Button>
        </div>
      </div>
    </CardContent>
  </Card>

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
            afterRows={effectiveAfterRows}
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
                rows={effectiveAfterRows}
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
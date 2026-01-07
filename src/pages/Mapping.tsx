import { useState, useCallback } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Plus, Eye, EyeOff } from "lucide-react";
import { SourceColumnItem, SourceColumn } from "@/components/mapping/SourceColumnItem";
import { TargetColumnItem, TargetColumn } from "@/components/mapping/TargetColumnItem";
import { AISuggestionsBar, AISuggestion } from "@/components/mapping/AISuggestionsBar";
import { MappingPreviewTable } from "@/components/mapping/MappingPreviewTable";

// Placeholder source columns from uploaded Excel (fallback)
const fallbackSourceColumns: SourceColumn[] = [
  { id: "s1", name: "Item Number", type: "string", sampleValues: ["ITEM-001", "ITEM-002"] },
  { id: "s2", name: "Description", type: "string", sampleValues: ["Widget Assembly"] },
  { id: "s3", name: "Quantity", type: "number", sampleValues: ["25", "100"] },
  { id: "s4", name: "Unit Price", type: "number", sampleValues: ["49.99", "12.50"] },
  { id: "s5", name: "Category", type: "string", sampleValues: ["Equipment", "Spare"] },
  { id: "s6", name: "Supplier", type: "string", sampleValues: ["Acme Corp", "Parts Inc"] },
  { id: "s7", name: "Lead Time", type: "number", sampleValues: ["7", "14"] },
  { id: "s8", name: "Notes", type: "string", sampleValues: ["High priority", "Standard"] },
];

const initialTargetColumns: TargetColumn[] = [
  { id: "t1", name: "Part ID", mappedColumns: [], delimiter: "" },
  { id: "t2", name: "Full Description", mappedColumns: [], delimiter: " - " },
  { id: "t3", name: "Qty", mappedColumns: [], delimiter: "" },
  { id: "t4", name: "Price", mappedColumns: [], delimiter: "" },
  { id: "t5", name: "Vendor", mappedColumns: [], delimiter: "" },
];

const fallbackSuggestions: AISuggestion[] = [
  {
    id: "sug1",
    description: "Map 'Lead Time' to a new 'Delivery Days' column",
    sourceColumns: ["s7"],
    targetColumn: "new",
    applied: false,
  },
  {
    id: "sug2",
    description: "Add 'Category' as a row type indicator",
    sourceColumns: ["s5"],
    targetColumn: "new",
    applied: false,
  },
];

// Preview sample data
const previewRows = [
  { t1: "ITEM-001", t2: "Widget Assembly - High priority", t3: "25", t4: "$49.99", t5: "Acme Corp" },
  { t1: "ITEM-002", t2: "Gear Component - Standard", t3: "100", t4: "$12.50", t5: "Parts Inc" },
  { t1: "ITEM-003", t2: "Motor Unit - Replacement", t3: "5", t4: "$299.00", t5: "MotorWorks" },
];

export default function Mapping() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  
  // Get data from navigation state or sessionStorage
  const getUploadedData = () => {
    // First try location state
    if (location.state) {
      return location.state as {
        projectName?: string;
        fileName?: string;
        columns?: string[];
        rowCount?: number;
        suggestions?: Array<{ 
          name?: string;
          suggestedTransformation?: string;
          justification?: string;
        }>;
        fileId?: string;
      };
    }
    
    // Fallback to sessionStorage
    const stored = sessionStorage.getItem('mappingData');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    
    return null;
  };

  const uploadedData = getUploadedData();

  // Convert uploaded columns to source columns format
  const getInitialSourceColumns = (): SourceColumn[] => {
    if (uploadedData?.columns && uploadedData.columns.length > 0) {
      return uploadedData.columns.map((col, index) => ({
        id: `s${index + 1}`,
        name: col,
        type: "string", // Default to string, you can enhance this with type detection
        sampleValues: [] // You'll need to pass sample values from Upload if available
      }));
    }
    
    // Fallback to hardcoded columns
    return fallbackSourceColumns;
  };

  // Convert AI suggestions to the format expected by AISuggestionsBar
  const getInitialSuggestions = (): AISuggestion[] => {
    if (uploadedData?.suggestions && uploadedData.suggestions.length > 0) {
      return uploadedData.suggestions.map((sug, index) => ({
        id: `sug${index + 1}`,
        description: `${sug.name}: ${sug.suggestedTransformation} - ${sug.justification}`,
        sourceColumns: [], // Map based on your suggestion structure
        targetColumn: sug.name || "new",
        applied: false,
      }));
    }
    
    // Fallback suggestions
    return fallbackSuggestions;
  };

  const [sourceColumns] = useState<SourceColumn[]>(getInitialSourceColumns());
  const [targetColumns, setTargetColumns] = useState<TargetColumn[]>(initialTargetColumns);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(getInitialSuggestions());
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Get mapped source IDs
  const mappedSourceIds = new Set(targetColumns.flatMap((t) => t.mappedColumns));

  // Get available source columns for a target
  const getAvailableSourceColumns = (targetId: string) => {
    const target = targetColumns.find((t) => t.id === targetId);
    return sourceColumns.filter(
      (s) => !target?.mappedColumns.includes(s.id)
    );
  };

  const handleAddTargetColumn = () => {
    const newId = `t${Date.now()}`;
    setTargetColumns([
      ...targetColumns,
      { id: newId, name: "New Column", mappedColumns: [], delimiter: " - " },
    ]);
  };

  const handleRemoveMapping = (targetId: string, sourceId: string) => {
    setTargetColumns(
      targetColumns.map((t) =>
        t.id === targetId
          ? { ...t, mappedColumns: t.mappedColumns.filter((id) => id !== sourceId) }
          : t
      )
    );
  };

  const handleAddMapping = (targetId: string, sourceId: string) => {
    setTargetColumns(
      targetColumns.map((t) =>
        t.id === targetId
          ? { ...t, mappedColumns: [...t.mappedColumns, sourceId] }
          : t
      )
    );
    setSelectedSource(null);
  };

  const handleUpdateTargetColumn = (targetId: string, updates: Partial<TargetColumn>) => {
    setTargetColumns(
      targetColumns.map((t) =>
        t.id === targetId ? { ...t, ...updates } : t
      )
    );
  };

  const handleDeleteTargetColumn = (targetId: string) => {
    setTargetColumns(targetColumns.filter((t) => t.id !== targetId));
  };

  const handleApplySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    // Add new target column with the suggested mapping
    const newId = `t${Date.now()}`;
    const suggestedName = suggestion.description.match(/['']([^'']+)['']/)?.[1] || "New Column";
    
    setTargetColumns([
      ...targetColumns,
      {
        id: newId,
        name: suggestedName,
        mappedColumns: suggestion.sourceColumns,
        delimiter: "",
      },
    ]);

    setSuggestions(
      suggestions.map((s) =>
        s.id === suggestionId ? { ...s, applied: true } : s
      )
    );
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== suggestionId));
  };

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(targetId);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDropTargetId(null);
      if (selectedSource) {
        handleAddMapping(targetId, selectedSource);
      }
    },
    [selectedSource]
  );

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Column Mapping
            </h1>
            <p className="text-muted-foreground">
              {uploadedData?.fileName 
                ? `Mapping columns for: ${uploadedData.fileName} (${uploadedData.rowCount || 0} rows)` 
                : "Map source columns to target columns for transformation"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden sm:flex"
            >
              {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
           <Button asChild>
  <Link 
    to={`/preview/${projectId}`}
    state={{
      projectName: uploadedData?.projectName,
      fileName: uploadedData?.fileName,
      sourceColumns: sourceColumns,
      targetColumns: targetColumns,
      rowCount: uploadedData?.rowCount
    }}
    onClick={() => {
      // Also store in sessionStorage as backup
      sessionStorage.setItem('previewData', JSON.stringify({
        projectName: uploadedData?.projectName,
        fileName: uploadedData?.fileName,
        sourceColumns: sourceColumns,
        targetColumns: targetColumns,
        rowCount: uploadedData?.rowCount
      }));
    }}
  >
    Preview Data
    <ArrowRight className="ml-2 h-4 w-4" />
  </Link>
</Button>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <AISuggestionsBar
            suggestions={suggestions}
            onApply={handleApplySuggestion}
            onDismiss={handleDismissSuggestion}
          />
        </div>
      )}

      {/* Mapping Interface */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Columns */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Source Columns</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click or drag columns to map them
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {sourceColumns.map((column) => (
                <SourceColumnItem
                  key={column.id}
                  column={column}
                  isSelected={selectedSource === column.id}
                  isMapped={mappedSourceIds.has(column.id)}
                  onSelect={() =>
                    setSelectedSource(selectedSource === column.id ? null : column.id)
                  }
                  onDragStart={() => setSelectedSource(column.id)}
                  onDragEnd={() => setDropTargetId(null)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Columns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Target Columns</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure output structure
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddTargetColumn}>
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {targetColumns.map((column) => (
                <div
                  key={column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <TargetColumnItem
                    column={column}
                    sourceColumns={sourceColumns}
                    isDropTarget={dropTargetId === column.id}
                    onRemoveMapping={(sourceId) => handleRemoveMapping(column.id, sourceId)}
                    onAddMapping={(sourceId) => handleAddMapping(column.id, sourceId)}
                    onUpdateColumn={(updates) => handleUpdateTargetColumn(column.id, updates)}
                    onDelete={() => handleDeleteTargetColumn(column.id)}
                    availableSourceColumns={getAvailableSourceColumns(column.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <Card className="mt-6 animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Mapping Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sample output based on current mappings
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <MappingPreviewTable
              columns={targetColumns.map((t) => ({ id: t.id, name: t.name }))}
              rows={previewRows}
              highlightColumn={selectedSource ? undefined : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
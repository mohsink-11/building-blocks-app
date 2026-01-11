import { useState, useCallback, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createProject, updateProject, getProjectDetail } from "@/integrations/supabase/api";
import { useAuth } from "@/hooks/useAuth";
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
// Build preview rows from sample values and current mappings
const buildPreviewRows = (srcCols: SourceColumn[], tgtCols: TargetColumn[], sampleCount = 3) => {
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const row: Record<string, string> = {};
    for (const t of tgtCols) {
      if (t.mappedColumns && t.mappedColumns.length > 0) {
        const parts = t.mappedColumns.map((sId) => {
          const s = srcCols.find((sc) => sc.id === sId);
          return s?.sampleValues?.[i] ?? "";
        }).filter(Boolean);
        row[t.id] = parts.join(t.delimiter ?? "");
      } else {
        row[t.id] = "-";
      }
    }
    rows.push(row);
  }
  return rows;
};

function getUploadedData(location) {
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
}

export default function Mapping() {
  // All hooks must be called unconditionally and before any early return!
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const uploadedData = getUploadedData(location);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [sourceColumns, setSourceColumns] = useState<SourceColumn[]>([]);
  const [targetColumns, setTargetColumns] = useState<TargetColumn[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [mappingLoaded, setMappingLoaded] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Only render mapping UI after mappingLoaded
  if (mappingError) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8 flex items-center justify-center">
        <span className="text-destructive">{mappingError}</span>
      </div>
    );
  }
  if (!mappingLoaded) {
    return <div className="flex-1 p-4 pt-6 md:p-8 flex items-center justify-center"><span className="text-muted-foreground">Loading mapping...</span></div>;
  }

  // If navigation included a `selectedTargetId` or the URL has a hash, scroll to that target element
  useEffect(() => {
    try {
      const stateAny = location.state as any;
      const selectedTargetId = stateAny?.selectedTargetId as string | undefined;
      const hashTarget = location.hash ? location.hash.replace('#', '') : undefined;
      const targetId = selectedTargetId || hashTarget;
      if (targetId) {
        // small timeout to allow the target list to render
        setTimeout(() => {
          const el = document.getElementById(`target-${targetId}`) || document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // briefly highlight the element
            el.classList.add('ring', 'ring-2', 'ring-primary');
            setTimeout(() => el.classList.remove('ring', 'ring-2', 'ring-primary'), 2000);
          }
        }, 120);
      }
    } catch (err) {
      // ignore
    }
  // only run when location changes
  }, [location]);

  // Convert uploaded columns to source columns format
  const getInitialSourceColumns = (): SourceColumn[] => {
    // Support two shapes: `columns: string[]` (Upload) and `sourceColumns: Array<{id,name,...}>` (Preview)
    if (uploadedData?.sourceColumns && Array.isArray(uploadedData.sourceColumns) && uploadedData.sourceColumns.length > 0) {
      return (uploadedData.sourceColumns as any[]).map((c, idx) => ({ id: c.id ?? `s${idx+1}`, name: c.name ?? `Column ${idx+1}`, type: c.type ?? 'string', sampleValues: c.sampleValues || [] }));
    }

    if (uploadedData?.columns && Array.isArray(uploadedData.columns) && uploadedData.columns.length > 0) {
      const samples: string[][] | undefined = uploadedData?.samples ?? (uploadedData?.rows ? (uploadedData.rows as string[][]).slice(0, 5) : undefined);
      return uploadedData.columns.map((col, index) => ({
        id: `s${index + 1}`,
        name: col,
        type: "string", // Default to string
        sampleValues: samples && samples.length > 0 ? samples.map((r) => String(r[index] ?? "")) : []
      }));
    }
    
    // Fallback to hardcoded columns
    return fallbackSourceColumns;
  };

  useEffect(() => {
    async function loadMapping() {
      setMappingError(null);
      // If projectId is present and NOT "new", fetch mapping from DB
      if (projectId && projectId !== 'new') {
        const { data, error } = await getProjectDetail(projectId);
        if (error || !data) {
          setMappingError(
            (error && error.message) ||
              "Failed to load project. You may not have access, or the project does not exist."
          );
          setMappingLoaded(false);
          return;
        }
        if (!data?.settings?.mapping) {
          setMappingError("No mapping found for this project.");
          setMappingLoaded(false);
          return;
        }
        // Ensure sourceColumns have proper structure
        const loadedSourceCols = (data.settings.mapping.sourceColumns || []).map((c: any, idx: number) => ({
          id: c.id ?? `s${idx + 1}`,
          name: c.name ?? `Column ${idx + 1}`,
          type: c.type ?? 'string',
          sampleValues: c.sampleValues || []
        }));
        // Ensure targetColumns have proper structure with mappedColumns as arrays
        const loadedTargetCols = (data.settings.mapping.targetColumns || []).map((t: any, idx: number) => ({
          id: t.id ?? `t${idx + 1}`,
          name: t.name ?? `Column ${idx + 1}`,
          mappedColumns: Array.isArray(t.mappedColumns) ? t.mappedColumns : [],
          delimiter: t.delimiter ?? ''
        }));
        setSourceColumns(loadedSourceCols.length > 0 ? loadedSourceCols : fallbackSourceColumns);
        setTargetColumns(loadedTargetCols.length > 0 ? loadedTargetCols : initialTargetColumns);
        setSuggestions([]); // Optionally, load suggestions from DB if you store them
        setMappingLoaded(true);
        return;
      }
      // Otherwise, use uploaded/session/local data
      const getInitialSourceColumns = (): SourceColumn[] => {
        if (uploadedData?.sourceColumns && Array.isArray(uploadedData.sourceColumns) && uploadedData.sourceColumns.length > 0) {
          return (uploadedData.sourceColumns as any[]).map((c, idx) => ({ id: c.id ?? `s${idx+1}`, name: c.name ?? `Column ${idx+1}`, type: c.type ?? 'string', sampleValues: c.sampleValues || [] }));
        }
        if (uploadedData?.columns && Array.isArray(uploadedData.columns) && uploadedData.columns.length > 0) {
          const samples: string[][] | undefined = uploadedData?.samples ?? (uploadedData?.rows ? (uploadedData.rows as string[][]).slice(0, 5) : undefined);
          return uploadedData.columns.map((col, index) => ({
            id: `s${index + 1}`,
            name: col,
            type: "string",
            sampleValues: samples && samples.length > 0 ? samples.map((r) => String(r[index] ?? "")) : []
          }));
        }
        return fallbackSourceColumns;
      };
      const getInitialTargetColumns = (): TargetColumn[] => {
        try {
          if (location.state && (location.state as any).targetColumns) {
            const tCols = (location.state as any).targetColumns as TargetColumn[];
            return tCols.map((t, idx) => ({
              id: t.id ?? `t${idx + 1}`,
              name: t.name ?? `Column ${idx + 1}`,
              mappedColumns: Array.isArray(t.mappedColumns) ? t.mappedColumns : [],
              delimiter: t.delimiter ?? ''
            }));
          }
          const stored = sessionStorage.getItem('mappingData');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.targetColumns) {
              return (parsed.targetColumns as TargetColumn[]).map((t, idx) => ({
                id: t.id ?? `t${idx + 1}`,
                name: t.name ?? `Column ${idx + 1}`,
                mappedColumns: Array.isArray(t.mappedColumns) ? t.mappedColumns : [],
                delimiter: t.delimiter ?? ''
              }));
            }
          }
        } catch (err) {}
        return initialTargetColumns;
      };
      const getInitialSuggestions = (): AISuggestion[] => {
        if (uploadedData?.suggestions && uploadedData.suggestions.length > 0) {
          return uploadedData.suggestions.map((sug, index) => ({
            id: `sug${index + 1}`,
            description: `${sug.name}: ${sug.suggestedTransformation} - ${sug.justification}`,
            sourceColumns: [],
            targetColumn: sug.name || "new",
            applied: false,
          }));
        }
        return fallbackSuggestions;
      };
      setSourceColumns(getInitialSourceColumns());
      setTargetColumns(getInitialTargetColumns());
      setSuggestions(getInitialSuggestions());
      setMappingLoaded(true);
    }
    loadMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Only render mapping UI after mappingLoaded
  if (!mappingLoaded) {
    return <div className="flex-1 p-4 pt-6 md:p-8 flex items-center justify-center"><span className="text-muted-foreground">Loading mapping...</span></div>;
  }

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

            {/* Save Project button: create project in Supabase if not present */}
            <Button
              data-testid="save-project"
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  // Determine if we already have a project id
                  const stateAny = location.state as any;
                  const stored = sessionStorage.getItem('mappingData');
                  const parsed = stored ? JSON.parse(stored) : {};
                  const pathParam = projectId; // from useParams()
                  const isExplicitNew = location.pathname.includes('/mapping/new') || pathParam === 'new' || pathParam === undefined;
                  const existingProjectId = isExplicitNew ? undefined : (stateAny?.projectId || parsed?.projectId || pathParam);

                  const projectNameToUse = uploadedData?.fileName || 'Untitled Project';

                  // Debug: log save action entry so tests can detect handler execution
                  // eslint-disable-next-line no-console
                  console.log('saveProject handler invoked', { pathParam, isExplicitNew, existingProjectId, userId: user?.id, hasSession: !!session, parsedHasProjectId: !!parsed?.projectId });


                  // Compute stats for the project
                  const stats = {
                    columnsMapped: targetColumns.filter(t => t.mappedColumns && t.mappedColumns.length > 0).length,
                    rulesApplied: 0, // You can update this if you have rules logic
                    rowsProcessed: uploadedData?.rowCount || (uploadedData?.rows ? uploadedData.rows.length : 0) || 0,
                    errorsFixed: 0 // You can update this if you have error tracking
                  };

                  if (existingProjectId) {
                    // Update existing project
                    const payload: any = {
                      name: projectNameToUse,
                      description: `Updated mapping for ${projectNameToUse}`,
                      settings: { mapping: { sourceColumns, targetColumns } },
                      stats
                    };
                    const { data: updRes, error: updErr } = await updateProject(existingProjectId, payload);
                    if (updErr || !updRes) {
                      if (updErr?.message?.includes('row-level') || updErr?.code === '42501') {
                        toast({ title: 'Save Blocked (RLS)', description: 'Row Level Security prevents updating this project. Authenticate or adjust table policies.', variant: 'destructive' });
                      } else {
                        toast({ title: 'Save Failed', description: 'Could not update project', variant: 'destructive' });
                      }
                      console.warn('updateProject failed', updErr);
                      return;
                    }

                    const newMappingData = { ...(parsed || {}), projectId: existingProjectId, sourceColumns, targetColumns, rows: uploadedData?.rows, fileName: uploadedData?.fileName };
                    sessionStorage.setItem('mappingData', JSON.stringify(newMappingData));

                    // Also merge mapping changes into previewData so Preview reflects the latest mappings
                    try {
                      const previewRaw = sessionStorage.getItem('previewData');
                      const previewBase = previewRaw ? JSON.parse(previewRaw) : {};
                      const mergedPreview = { ...previewBase, fileName: uploadedData?.fileName, sourceColumns, targetColumns, rows: uploadedData?.rows };
                      sessionStorage.setItem('previewData', JSON.stringify(mergedPreview));
                    } catch (e) {
                      // ignore preview merge errors
                      console.warn('previewData merge failed', e);
                    }

                    toast({ title: 'Mapping Saved', description: `Mapping saved to project ${updRes.name}` });
                    navigate(`/mapping/${existingProjectId}`, { state: newMappingData });
                    return;
                  }

                  // Create new project if none exists
                  // Require an authenticated session (not just a user object) before calling the Supabase API.
                  // This helps avoid anonymous requests that trigger RLS 403 errors on the server.
                  if (!user || !session) {
                    toast({ title: 'Sign in required', description: 'Please sign in before creating a project.', variant: 'destructive' });
                    return;
                  }

                  // eslint-disable-next-line no-console
                  console.log('about to call createProject', { pathParam: projectId, locationPath: location.pathname, stateAny: stateAny?.projectId, userId: user?.id, hasSession: !!session });

                  // Include owner/created_by to satisfy common RLS policies that require auth.uid()
                  const payload: any = {
                    name: projectNameToUse,
                    description: `Mapping for ${projectNameToUse}`,
                    stats
                  };
                  if (user?.id) payload.owner = user.id;

                  const { data: projectRes, error: projectErr } = await createProject(payload);
                  if (projectErr || !projectRes) {
                    if (projectErr?.message?.includes('row-level') || projectErr?.code === '42501') {
                      toast({ title: 'Save Blocked (RLS)', description: 'Row Level Security prevents creating project. Sign in or update table policies.', variant: 'destructive' });
                    } else if (!projectRes) {
                      toast({ title: 'Save Failed', description: 'No project returned from server. You may not have access, or your session is invalid.', variant: 'destructive' });
                    } else {
                      toast({ title: 'Save Failed', description: 'Could not create project', variant: 'destructive' });
                    }
                    console.warn('createProject failed', projectErr);
                    return;
                  }

                  // persist into session storage and navigate
                  const newMappingData = { ...(parsed || {}), projectId: projectRes.id, sourceColumns, targetColumns, rows: uploadedData?.rows, fileName: uploadedData?.fileName };
                  sessionStorage.setItem('mappingData', JSON.stringify(newMappingData));

                  // Also merge mapping changes into previewData so Preview reflects the latest mappings
                  try {
                    const previewRaw = sessionStorage.getItem('previewData');
                    const previewBase = previewRaw ? JSON.parse(previewRaw) : {};
                    const mergedPreview = { ...previewBase, fileName: uploadedData?.fileName, sourceColumns, targetColumns, rows: uploadedData?.rows };
                    sessionStorage.setItem('previewData', JSON.stringify(mergedPreview));
                  } catch (e) {
                    // ignore preview merge errors
                    console.warn('previewData merge failed', e);
                  }

                  toast({ title: 'Project Saved', description: `Project created: ${projectRes.name}` });
                  navigate(`/mapping/${projectRes.id}`, { state: newMappingData });
                } catch (err) {
                  console.error('save project error', err);
                  toast({ title: 'Save Failed', description: 'Unexpected error', variant: 'destructive' });
                }
              }}
            >
              Save Project
            </Button>

           <Button asChild>
  <Link 
    to={`/preview/${projectId}`}
    state={{
      projectName: uploadedData?.projectName,
      fileName: uploadedData?.fileName,
      sourceColumns: sourceColumns,
      targetColumns: targetColumns,
      rowCount: uploadedData?.rowCount,
      rows: uploadedData?.rows
    }}
    onClick={() => {
      // Merge mapping data into previewData instead of overwriting so we preserve assignment fields
      try {
        const previewRaw = sessionStorage.getItem('previewData');
        const previewBase = previewRaw ? JSON.parse(previewRaw) : {};
        const mergedPreview = {
          ...previewBase,
          projectName: uploadedData?.projectName,
          fileName: uploadedData?.fileName,
          sourceColumns: sourceColumns,
          targetColumns: targetColumns,
          rowCount: uploadedData?.rowCount,
          rows: uploadedData?.rows,
        };
        sessionStorage.setItem('previewData', JSON.stringify(mergedPreview));
      } catch (e) {
        console.warn('previewData merge failed', e);
        // fallback to writing minimal preview data
        sessionStorage.setItem('previewData', JSON.stringify({
          projectName: uploadedData?.projectName,
          fileName: uploadedData?.fileName,
          sourceColumns: sourceColumns,
          targetColumns: targetColumns,
          rowCount: uploadedData?.rowCount,
          rows: uploadedData?.rows
        }));
      }
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
                  id={`target-${column.id}`}
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
              rows={
                // Use sample rows from uploaded file if available, otherwise fallback to built rows
                uploadedData?.samples && uploadedData.samples.length > 0
                  ? buildPreviewRows(sourceColumns, targetColumns, uploadedData.samples.length)
                  : buildPreviewRows(sourceColumns, targetColumns, 3)
              }
              highlightColumn={selectedSource ? undefined : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}


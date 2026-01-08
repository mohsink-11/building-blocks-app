import { ColumnDef } from '@/components/preview/DataPreviewTable';

export function applyPivotMappingsToPreviewData(previewData: any, pivotColDefs: Array<{id:string;name:string;}>, pivotMappings: Record<string,string>, transformedBeforeRows: any[], pivotGroupAssignments?: Record<string,string[]>, columnGroups?: Record<string,string[]>, options?: { columnPreferredBase?: Record<string,string>, columnMethods?: Record<string,string>, columnBaseColumn?: Record<string,string>, mappedSources?: Record<string,string[]> }) {
  // clone previewData
  const stored = JSON.parse(JSON.stringify(previewData || {}));

  stored.sourceColumns = stored.sourceColumns ? [...stored.sourceColumns] : [];
  // append pivot columns to source columns
  pivotColDefs.forEach((p) => {
    // avoid duplicates
    if (!stored.sourceColumns.find((c: any) => c.id === p.id)) {
      stored.sourceColumns.push({ id: p.id, name: p.name, type: 'string' });
    }
  });

  // persist pivot group assignments with stored preview data
  if (pivotGroupAssignments) {
    stored.pivotGroupAssignments = { ...pivotGroupAssignments };
  }

  // persist column group assignments (Assembly/Equipment/Spare) with stored preview data
  if (columnGroups) {
    stored.columnGroups = { ...columnGroups };
  }

  // persist additional per-column assignment options
  if (options?.columnPreferredBase) {
    stored.columnPreferredBase = { ...options.columnPreferredBase };
  }
  if (options?.columnMethods) {
    stored.columnMethods = { ...options.columnMethods };
  }
  if (options?.columnBaseColumn) {
    stored.columnBaseColumn = { ...options.columnBaseColumn };
  }
  if (options?.mappedSources) {
    stored.mappedSources = { ...options.mappedSources };
  }

  // update target column mappings according to pivotMappings
  stored.targetColumns = stored.targetColumns ? [...stored.targetColumns] : [];
  Object.entries(pivotMappings || {}).forEach(([pivotId, targetId]) => {
    if (!targetId) return; // skip unmapped
    const target = stored.targetColumns.find((t: any) => t.id === targetId);
    if (!target) return;
    target.mappedColumns = target.mappedColumns ? [...target.mappedColumns] : [];

    // When group assignments are present, only add pivot columns that belong to the assigned groups for this target
    if (pivotGroupAssignments && pivotGroupAssignments[targetId]) {
      const allowedNames = pivotGroupAssignments[targetId];
      const pivotDef = pivotColDefs.find(p => p.id === pivotId);
      if (!pivotDef) return;
      if (!allowedNames.includes(pivotDef.name)) return;
    }

    if (!target.mappedColumns.includes(pivotId)) {
      target.mappedColumns.push(pivotId);
    }
  });

  // construct rows arrays aligned to stored.sourceColumns
  stored.rows = (transformedBeforeRows || []).map((r: any) => {
    return stored.sourceColumns.map((c: any) => r[c.id] ?? '');
  });

  // compute transformed after rows based on updated target columns
  const transformedAfter = (transformedBeforeRows || []).map((r: any, i: number) => {
    const obj: any = { id: i + 1 };
    stored.targetColumns.forEach((t: any) => {
      const mappedValues = (t.mappedColumns || []).map((srcId: string) => r[srcId] ?? '').filter(Boolean);
      obj[t.id] = mappedValues.join(t.delimiter || ' ');
    });
    return obj;
  });

  return { updatedPreviewData: stored, transformedAfterRows: transformedAfter };
}

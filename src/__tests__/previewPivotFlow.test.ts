import { describe, test, expect } from 'vitest';
import { pivotByGroup } from '@/lib/rowTransforms';
import { detectGroupColumnIndex } from '@/lib/pivotUtils';
import { applyPivotMappingsToPreviewData } from '@/lib/pivotMapping';

describe('Preview Pivot full flow', () => {
  test('Preview -> Assign Groups -> Apply results in target mapping filtered by assigned groups', () => {
    const previewData: any = {
      sourceColumns: [
        { id: 's1', name: 'Item' },
        { id: 's2', name: 'Base' },
        { id: 's3', name: 'Value' }
      ],
      targetColumns: [
        { id: 't1', name: 'Target1', mappedColumns: ['s3'], delimiter: '' }
      ],
      rows: [ ['A','Equipment','EQ1'], ['B','Spare','SP2'] ]
    };

    // Simulate preview selecting target 't1' as mapped field
    const target = previewData.targetColumns[0];
    const mappedSourceId = target.mappedColumns[0];
    const valueIdx = previewData.sourceColumns.findIndex((s: any) => s.id === mappedSourceId);
    expect(valueIdx).toBe(2);

    // Auto-detect group column
    const groupIdx = detectGroupColumnIndex(previewData.rows, previewData.sourceColumns, valueIdx);
    expect(groupIdx).toBe(1);

    // Apply pivot (method self)
    const { newColumns, transformedRows } = pivotByGroup(previewData.rows, groupIdx, valueIdx, 'self');
    expect(newColumns).toEqual(['Equipment', 'Spare']);

    // Build transformedBeforeRows as Preview would
    const pivotCols = newColumns.map((c: string) => ({ id: `pivot_${c.replace(/\s+/g, '_').toLowerCase()}`, name: c }));
    const newSourceCols = [...previewData.sourceColumns, ...pivotCols];
    const transformedBefore = transformedRows.map((r: string[], i: number) => {
      const obj: any = { id: i + 1 };
      newSourceCols.forEach((col: any, idx: number) => { obj[col.id] = r[idx] ?? ''; });
      return obj;
    });

    // Map pivot columns to t1
    const pivotMappings: Record<string,string> = {};
    pivotCols.forEach(p => pivotMappings[p.id] = 't1');

    // Assign only 'Spare' group to target t1
    const pivotGroupAssignments = { 't1': ['Spare'] };

    const columnGroups = { 't1': ['Assembly'] };

    const { updatedPreviewData, transformedAfterRows } = applyPivotMappingsToPreviewData(previewData, pivotCols, pivotMappings, transformedBefore, pivotGroupAssignments, columnGroups);

    const t1 = updatedPreviewData.targetColumns.find((t: any) => t.id === 't1');
    expect(t1.mappedColumns).toContain('pivot_spare');
    expect(t1.mappedColumns).not.toContain('pivot_equipment');

    // column groups persisted
    expect(updatedPreviewData.columnGroups).toEqual(columnGroups);

    // After rows: original mapped source ('s3') remains mapped so row0 will contain EQ1
    expect(transformedAfterRows[0].t1).toBe('EQ1');
    // row1 will contain both original mapped value and pivot value (both SP2) -> joined with default delimiter (space)
    expect(transformedAfterRows[1].t1).toBe('SP2 SP2');
  });
});
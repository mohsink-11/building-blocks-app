import { describe, test, expect } from 'vitest';
import { applyPivotMappingsToPreviewData } from '@/lib/pivotMapping';

describe('applyPivotMappingsToPreviewData', () => {
  test('attaches pivot columns to sourceColumns and maps them to target columns', () => {
    const previewData = {
      sourceColumns: [ { id: 'item', name: 'Item' }, { id: 'base', name: 'Base' } ],
      targetColumns: [ { id: 't1', name: 'Target1', mappedColumns: [] } ],
      rows: [ ['A','Equipment','EQ1'] ]
    };

    const pivotColDefs = [ { id: 'pivot_equipment', name: 'Equipment' } ];
    const pivotMappings = { 'pivot_equipment': 't1' };

    const transformedBeforeRows = [ { id: 1, item: 'A', base: 'Equipment', pivot_equipment: 'EQ1' } ];

    const { updatedPreviewData, transformedAfterRows } = applyPivotMappingsToPreviewData(previewData, pivotColDefs, pivotMappings, transformedBeforeRows);

    expect(updatedPreviewData.sourceColumns.some((c: any) => c.id === 'pivot_equipment')).toBe(true);
    const t1 = updatedPreviewData.targetColumns.find((t: any) => t.id === 't1');
    expect(t1.mappedColumns).toContain('pivot_equipment');

    expect(transformedAfterRows[0].t1).toBe('EQ1');
  });

  test('honors pivotGroupAssignments: only adds pivot cols for allowed group names', () => {
    const previewData = {
      sourceColumns: [ { id: 'item', name: 'Item' }, { id: 'base', name: 'Base' } ],
      targetColumns: [ { id: 't1', name: 'Target1', mappedColumns: [] } ],
      rows: [ ['A','Equipment','EQ1'] ]
    };

    const pivotColDefs = [ { id: 'pivot_equipment', name: 'Equipment' }, { id: 'pivot_spare', name: 'Spare' } ];
    const pivotMappings = { 'pivot_equipment': 't1', 'pivot_spare': 't1' };

    const transformedBeforeRows = [ { id: 1, item: 'A', base: 'Equipment', pivot_equipment: 'EQ1', pivot_spare: 'SP1' } ];

    // only allow 'Spare' for t1 - Equipment should be ignored
    const pivotGroupAssignments = { 't1': ['Spare'] };

    const { updatedPreviewData, transformedAfterRows } = applyPivotMappingsToPreviewData(previewData, pivotColDefs, pivotMappings, transformedBeforeRows, pivotGroupAssignments);

    const t1 = updatedPreviewData.targetColumns.find((t: any) => t.id === 't1');
    expect(t1.mappedColumns).toContain('pivot_spare');
    expect(t1.mappedColumns).not.toContain('pivot_equipment');

    expect(transformedAfterRows[0].t1).toBe('SP1');
  });

  test('persists column group assignments', () => {
    const previewData = {
      sourceColumns: [ { id: 'item', name: 'Item' }, { id: 'base', name: 'Base' } ],
      targetColumns: [ { id: 't1', name: 'Target1', mappedColumns: [] }, { id: 't2', name: 'Target2', mappedColumns: [] } ],
      rows: [ ['A','Equipment','EQ1'] ]
    };

    const pivotColDefs = [ { id: 'pivot_equipment', name: 'Equipment' } ];
    const pivotMappings = { 'pivot_equipment': 't1' };

    const transformedBeforeRows = [ { id: 1, item: 'A', base: 'Equipment', pivot_equipment: 'EQ1' } ];

    const columnGroups = { t1: ['Assembly','Equipment'], t2: ['Spare'] };

    const { updatedPreviewData } = applyPivotMappingsToPreviewData(previewData, pivotColDefs, pivotMappings, transformedBeforeRows, undefined, columnGroups);

    expect(updatedPreviewData.columnGroups).toEqual(columnGroups);
  });

  test('persists column assignment options', () => {
    const previewData = {
      sourceColumns: [ { id: 'item', name: 'Item' }, { id: 'base', name: 'Base' } ],
      targetColumns: [ { id: 't1', name: 'Target1', mappedColumns: [] } ],
      rows: [ ['A','Equipment','EQ1'] ]
    };

    const pivotColDefs = [];
    const pivotMappings = {};
    const transformedBeforeRows = [ { id: 1, item: 'A', base: 'Equipment', pivot_equipment: 'EQ1' } ];

    const options = { columnPreferredBase: { t1: 'Equipment' }, columnMethods: { t1: 'self' }, columnBaseColumn: { t1: 'base' }, mappedSources: { t1: ['item'] } };

    const { updatedPreviewData } = applyPivotMappingsToPreviewData(previewData, pivotColDefs, pivotMappings, transformedBeforeRows, undefined, undefined, options);

    expect(updatedPreviewData.columnPreferredBase).toEqual(options.columnPreferredBase);
    expect(updatedPreviewData.columnMethods).toEqual(options.columnMethods);
    expect(updatedPreviewData.columnBaseColumn).toEqual(options.columnBaseColumn);
    expect(updatedPreviewData.mappedSources).toEqual(options.mappedSources);
  });
});
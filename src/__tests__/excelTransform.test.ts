import { describe, test, expect } from 'vitest';
import { transformExcelData, normalizeBase } from '@/lib/excelTransform';

describe('excelTransform', () => {
  test('normalizeBase transforms base values correctly', () => {
    expect(normalizeBase('Assembly')).toBe('assembly');
    expect(normalizeBase('EQUIPMENT')).toBe('equipment');
    expect(normalizeBase('Spare')).toBe('spare');
    expect(normalizeBase('')).toBe('self');
  });

  test('transformExcelData maps columns correctly', () => {
    const rows = [
      ['Item-001', 'Assembly', 'Widget'],
      ['Item-002', 'Spare', 'Gear'],
    ];

    const sourceColumns = [
      { id: 's1', name: 'ItemId', type: 'string' },
      { id: 's2', name: 'Base', type: 'string' },
      { id: 's3', name: 'Description', type: 'string' },
    ];

    const targetColumns = [
      { id: 't1', name: 'PartID', mappedColumns: ['s1'] },
      { id: 't2', name: 'PartDesc', mappedColumns: ['s3'] },
    ];

    const result = transformExcelData({
      rows,
      sourceColumns,
      targetColumns,
      mapping: { s1: 'PartID', s3: 'PartDesc' },
      baseRules: {},
    });

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.columns.map(c => c.name)).toContain('PartID');
    expect(result.columns.map(c => c.name)).toContain('PartDesc');
  });

  test('transformExcelData filters to Assembly + Spare only', () => {
    const rows = [
      ['A', 'Assembly', 'Widget'],
      ['B', 'Spare', 'Gear'],
      ['C', 'Equipment', 'Motor'],
    ];

    const sourceColumns = [
      { id: 's1', name: 'ItemId', type: 'string' },
      { id: 's2', name: 'Base', type: 'string' },
      { id: 's3', name: 'Desc', type: 'string' },
    ];

    const targetColumns = [
      { id: 't1', name: 'PartA', mappedColumns: ['s3'] },
      { id: 't2', name: 'PartB', mappedColumns: ['s1'] },
    ];

    // Only t1 restricts to Assembly/Spare
    const result = transformExcelData({
      rows,
      sourceColumns,
      targetColumns,
      mapping: { s3: 'PartA', s1: 'PartB' },
      baseRules: {},
      columnGroups: { t1: ['Assembly', 'Spare'] },
    });

    // Expect only rows with base Assembly or Spare to appear (Equipment excluded)
    expect(result.rows.length).toBe(2);
    // Ensure the Equipment row is excluded
    const bases = result.rows.map(r => r[result.columns.findIndex(c => c.id === 'Base')]);
    expect(bases.every(b => ['Assembly','Spare'].includes(b))).toBeTruthy();
  });

  test('transformExcelData respects per-target selection and prevents unrestricted targets from adding extra rows', () => {
    const rows = [
      ['item1', 'Assembly', 'Xdesc'],   // has PartB value only (s1)
      ['item2', 'Spare', ''],           // has PartA value only (s1 blank, s3 blank but mapping may differ)
      ['item3', 'Equipment', 'Other'],  // should be excluded when t2 selects Spare only
    ];

    const sourceColumns = [
      { id: 's1', name: 'ItemId', type: 'string' },
      { id: 's2', name: 'Base', type: 'string' },
      { id: 's3', name: 'Desc', type: 'string' },
    ];

    const targetColumns = [
      { id: 't1', name: 'Desc', mappedColumns: ['s3'] },
      { id: 't2', name: 'Part', mappedColumns: ['s1'] },
    ];

    // t2 selects Spare only; t1 has no selection
    const result = transformExcelData({
      rows,
      sourceColumns,
      targetColumns,
      mapping: { s3: 'Desc', s1: 'Part' },
      baseRules: {},
      columnGroups: { t2: ['Spare'] },
    });

    // Only rows matching selected bases (Spare) should be included — item2 only
    expect(result.rows.length).toBe(1);
    const baseIdx = result.columns.findIndex(c => c.id === 'Base');
    expect(result.rows[0][baseIdx]).toBe('Spare');
  });

  test('transformExcelData identifies assemblies without spares', () => {
    const rows = [
      ['A', 'Assembly', 'Widget A'],
      ['B', 'Spare', 'Spare 1'],
      ['C', 'Assembly', 'Widget B'],
      // No spare after Widget B
    ];

    const sourceColumns = [
      { id: 's1', name: 'ItemId', type: 'string' },
      { id: 's2', name: 'Base', type: 'string' },
      { id: 's3', name: 'Desc', type: 'string' },
    ];

    const targetColumns = [
      { id: 't1', name: 'Part', mappedColumns: ['s1'] },
    ];

    const result = transformExcelData({
      rows,
      sourceColumns,
      targetColumns,
      mapping: { s1: 'Part' },
      baseRules: {},
    });

    // Check that Custom column marks "No Spare" for assemblies without spares
    const customColIdx = result.columns.findIndex(c => c.id === 'Custom');
    expect(customColIdx).toBeGreaterThanOrEqual(0);
    // Last row should have "No Spare" since Assembly B has no spare
    const lastRow = result.rows[result.rows.length - 1];
    if (lastRow && customColIdx >= 0) {
      expect(lastRow[customColIdx]).toBe('No Spare');
    }
  });
});

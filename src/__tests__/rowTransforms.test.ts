import { pivotByGroup } from '@/lib/rowTransforms';
import { describe, test, expect } from 'vitest';

describe('pivotByGroup', () => {
  const rows = [
    ['Header', 'Base', 'Value'],
    ['1', 'Equipment', 'EQ1'],
    ['2', 'Assembly', 'AS1'],
    ['3', 'Spare', 'SP1'],
    ['4', 'Assembly', 'AS2'],
    ['5', 'Spare', 'SP2'],
  ].slice(1).map((r) => r.slice(1)); // drop header row and initial header col to simulate data rows

  test('self method creates columns and populates only when group matches', () => {
    const { newColumns, transformedRows } = pivotByGroup(rows, 0, 1, 'self');
    expect(newColumns).toEqual(['Equipment', 'Assembly', 'Spare']);
    // check second row (Equipment) has EQ1 in Equipment column
    expect(transformedRows[0][2]).toBe('EQ1');
    // check the Assembly column on assembly row is filled
    expect(transformedRows[1][3]).toBe('AS1');
  });

  test('parent method uses nearest previous Equipment row', () => {
    const { newColumns, transformedRows } = pivotByGroup(rows, 0, 1, 'parent', 'Equipment');
    expect(newColumns).toEqual(['Equipment', 'Assembly', 'Spare']);
    // Assembly row (index 1) should get parent Equipment EQ1
    expect(transformedRows[1][3]).toBe('EQ1');
  });

  test('after method copies forward match', () => {
    const { newColumns, transformedRows } = pivotByGroup(rows, 0, 1, 'after');
    expect(newColumns).toEqual(['Equipment', 'Assembly', 'Spare']);
    // For the Equipment row, after for Assembly should be AS1
    expect(transformedRows[0][3]).toBe('AS1');
  });
});
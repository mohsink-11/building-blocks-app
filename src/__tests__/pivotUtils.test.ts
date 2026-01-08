import { describe, test, expect } from 'vitest';
import { detectGroupColumnIndex } from '@/lib/pivotUtils';

describe('detectGroupColumnIndex', () => {
  test('prefers named column "Category"', () => {
    const rows = [ ['A','Equipment','EQ1'], ['B','Spare','SP1'] ];
    const cols = [ { id: 'c1', name: 'Item' }, { id: 'c2', name: 'Category' }, { id: 'c3', name: 'Value' } ];
    const idx = detectGroupColumnIndex(rows, cols);
    expect(idx).toBe(1);
  });

  test('picks low-cardinality column when no preferred name', () => {
    const rows = [ ['A','X','1'], ['B','X','2'], ['C','Y','3'] ];
    const cols = [ { id: 'c1', name: 'Item' }, { id: 'c2', name: 'Group' }, { id: 'c3', name: 'Value' } ];
    const idx = detectGroupColumnIndex(rows, cols);
    expect(idx).toBe(1);
  });

  test('excludes provided index', () => {
    const rows = [ ['A','X','1'], ['B','X','2'] ];
    const cols = [ { id: 'c1', name: 'Item' }, { id: 'c2', name: 'Group' }, { id: 'c3', name: 'Value' } ];
    const idx = detectGroupColumnIndex(rows, cols, 1);
    expect(idx).toBe(2); // falls back to other candidate
  });

  test('returns -1 if nothing found', () => {
    const rows: any[] = [];
    const cols: any[] = [];
    expect(detectGroupColumnIndex(rows, cols)).toBe(-1);
  });
});
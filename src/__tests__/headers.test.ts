import { describe, it, expect } from 'vitest';
import { deriveLeafHeaders, detectHeaderRows } from '@/lib/headers';

describe('deriveLeafHeaders', () => {
  it('returns single row headers unchanged', () => {
    const rows = [['A', 'B', 'C']];
    expect(deriveLeafHeaders(rows)).toEqual(['A', 'B', 'C']);
  });

  it('returns leaf headers from multi-row header (group + subheaders)', () => {
    const rows = [
      ['Scope', '', 'Spare Part Specification', '', '', '', '', ''],
      ['Line-No.', 'Unit', 'PSP/WBS-No.', 'SMS Material No.', 'Description', 'Type', 'Additional Explanation', 'Installed']
    ];

    expect(deriveLeafHeaders(rows)).toEqual([
      'Line-No.',
      'Unit',
      'PSP/WBS-No.',
      'SMS Material No.',
      'Description',
      'Type',
      'Additional Explanation',
      'Installed'
    ]);
  });

  it('falls back to previous non-empty when deeper rows are empty', () => {
    const rows = [
      ['Group A', 'Group A', 'Group B'],
      ['Sub A1', '', 'Sub B1']
    ];
    expect(deriveLeafHeaders(rows)).toEqual(['Sub A1', 'Group A', 'Sub B1']);
  });

  it('generates Column N when all header cells are empty for a column', () => {
    const rows = [['', '', '']];
    expect(deriveLeafHeaders(rows)).toEqual(['Column 1', 'Column 2', 'Column 3']);
  });

  it('does not treat data rows as headers', () => {
    const rows = [
      ['Header A', 'Header B'],
      ['A0479.ME09.1100', '09/10.1100.5'],
      ['AMX board', 'Widget']
    ];
    expect(deriveLeafHeaders(rows)).toEqual(['Header A', 'Header B']);
  });

  it('respects manual header rows count', () => {
    const rows = [
      ['Group', 'Group', 'Group'],
      ['Sub A', 'Sub B', 'Sub C'],
      ['A0479.ME09.1100', '09/10.1100.5', 'AMX board']
    ];
    // when user forces 1 header row, only first row is used
    expect(detectHeaderRows(rows, 1)).toEqual([['Group', 'Group', 'Group']]);
    expect(deriveLeafHeaders(rows, 1)).toEqual(['Group', 'Group', 'Group']);
  });
});
export type PivotMethod = 'self' | 'previous' | 'after' | 'parent';

// rows: array of rows where each row is an array of cell values (strings)
// groupColIdx: index of the column that contains the group (e.g., 'Base')
// valueColIdx: index of the column whose values will be used to populate new columns
// method: how to pick value for a target column for each row
// parentLabel: when method === 'parent' - the label to treat as parent rows (e.g., 'Equipment')
// returns: { newColumns: string[] } where newColumns are the distinct group values and
// transformedRows: rows where additional columns appended for each group in newColumns
export function pivotByGroup(
  rows: string[][],
  groupColIdx: number,
  valueColIdx: number,
  method: PivotMethod,
  parentLabel?: string
) {
  if (!rows || rows.length === 0) return { newColumns: [], transformedRows: rows };

  // collect distinct group values in the order they appear
  const groupValues: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const g = String(r[groupColIdx] ?? '').trim();
    if (g && !seen.has(g)) {
      seen.add(g);
      groupValues.push(g);
    }
  }

  // For each row, produce new values array for the new columns
  const transformedRows: string[][] = rows.map((r, idx) => {
    const newCols: string[] = [];

    for (const gVal of groupValues) {
      let v = '';

      switch (method) {
        case 'self': {
          const g = String(r[groupColIdx] ?? '').trim();
          if (g === gVal) v = String(r[valueColIdx] ?? '');
          break;
        }
        case 'previous': {
          // look upward for the previous row's value (first previous row regardless of group)
          for (let p = idx - 1; p >= 0; p--) {
            const prev = rows[p];
            if (String(prev[valueColIdx] ?? '') !== '') {
              // only set if the previous row's group matches gVal OR if the previous row group equals gVal
              const prevGroup = String(prev[groupColIdx] ?? '').trim();
              if (prevGroup === gVal) {
                v = String(prev[valueColIdx] ?? '');
              }
              break;
            }
          }
          break;
        }
        case 'after': {
          // look forward for first next row where group matches gVal
          for (let p = idx + 1; p < rows.length; p++) {
            const next = rows[p];
            const nextGroup = String(next[groupColIdx] ?? '').trim();
            if (nextGroup === gVal) {
              v = String(next[valueColIdx] ?? '');
              break;
            }
          }
          break;
        }
        case 'parent': {
          if (!parentLabel) break;
          // find nearest previous row with group === parentLabel
          for (let p = idx - 1; p >= 0; p--) {
            const prev = rows[p];
            const prevGroup = String(prev[groupColIdx] ?? '').trim();
            if (prevGroup === parentLabel) {
              v = String(prev[valueColIdx] ?? '');
              break;
            }
          }
          break;
        }
        default:
          break;
      }

      newCols.push(v);
    }

    return [...r, ...newCols];
  });

  return { newColumns: groupValues, transformedRows };
}

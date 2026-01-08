export function detectGroupColumnIndex(rows: any[][], sourceColumns: Array<{id:string;name:string;}>, excludeIdx?: number) {
  if (!rows || rows.length === 0 || !sourceColumns || sourceColumns.length === 0) return -1;

  // helper to compute unique values for a column index
  const uniqueCount = (idx: number) => {
    const s = new Set<string>();
    for (let r of rows) {
      s.add(String(r[idx] ?? ''));
      if (s.size > 50) break; // early bail for high cardinality
    }
    return s.size;
  }

  // prefer named columns that likely indicate a base/category
  const preferredNames = ['base', 'category', 'type', 'row type', 'row_type', 'group'];
  for (let i = 0; i < sourceColumns.length; i++) {
    if (i === excludeIdx) continue;
    const name = String(sourceColumns[i].name || '').toLowerCase();
    if (preferredNames.some(p => name.includes(p))) return i;
  }

  // otherwise pick the column with low cardinality (<=10) and not the excluded index
  // avoid likely identifier columns (item, id)
  const avoidNames = ['item', 'id'];
  for (let i = 0; i < sourceColumns.length; i++) {
    if (i === excludeIdx) continue;
    const name = String(sourceColumns[i].name || '').toLowerCase();
    if (avoidNames.some(a => name.includes(a))) continue;
    const uc = uniqueCount(i);
    if (uc > 0 && uc <= 10) return i;
  }

  // if none matched above (e.g., all candidates are identifiers), fallback to first non-excluded low-cardinality column
  for (let i = 0; i < sourceColumns.length; i++) {
    if (i === excludeIdx) continue;
    const uc = uniqueCount(i);
    if (uc > 0 && uc <= 10) return i;
  }

  return -1;
}

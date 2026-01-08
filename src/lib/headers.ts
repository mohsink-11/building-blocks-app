export function detectHeaderRows(rows: any[][], maxHeaderRows = 10): string[][] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const firstRows = rows.slice(0, Math.min(rows.length, 20)); // examine up to first 20 rows for headers

  // Helper to determine whether a cell looks like a header (vs data)
  const isHeaderCell = (cell: any) => {
    if (cell == null) return false;
    const s = String(cell).trim();
    if (s === '') return false;
    if (s.length > 100) return false; // very long => likely data
    // proportion of digits in cell
    const digitCount = (s.match(/\d/g) || []).length;
    const digitRatio = digitCount / (s.length || 1);
    // messy tokens with many non-word chars likely data
    const nonWordChars = (s.match(/[^\w\s\-()&.,\/]/) || []).length;
    if (digitRatio > 0.5 && /[.\/]/.test(s)) return false;
    if (nonWordChars > 3) return false;
    // contains letters is a good sign
    return /[A-Za-z]/.test(s);
  };

  // Identify consecutive header rows starting from the top
  const headerRows: any[][] = [];
  for (let i = 0; i < Math.min(firstRows.length, maxHeaderRows); i++) {
    const row = Array.isArray(firstRows[i]) ? firstRows[i] : [];
    const nonEmptyCells = row.filter((c) => c != null && String(c).trim() !== '').length;
    if (nonEmptyCells === 0) continue; // skip blank rows

    const headerLike = row.reduce((acc, cell) => acc + (isHeaderCell(cell) ? 1 : 0), 0);
    const headerRatio = nonEmptyCells > 0 ? headerLike / nonEmptyCells : 0;

    // Lower threshold for first row (allow e.g., ['Header A', 'Header B'])
    const threshold = i === 0 ? 0.3 : 0.6;

    // If the row looks header-like above threshold, consider it a header row
    if (headerRatio >= threshold) {
      headerRows.push(row.map((c) => (c == null ? '' : String(c))));
      continue;
    }

    // Otherwise stop — we hit the first data-like row
    break;
  }

  // If none found, fallback to first row as header rows
  if (headerRows.length === 0) {
    const first = Array.isArray(rows[0]) ? rows[0] : [];
    if (first.length === 0) return [];
    return [first.map((c) => String(c ?? '').trim())];
  }

  return headerRows.map((r) => r.map((c) => String(c ?? '').trim()));
}

export function deriveLeafHeaders(rows: any[][], maxHeaderRows = 10): string[] {
  const headerRows = detectHeaderRows(rows, maxHeaderRows);
  if (!headerRows || headerRows.length === 0) return [];

  const maxCols = Math.max(...headerRows.map((r) => r.length));
  const leafs: string[] = [];
  for (let col = 0; col < maxCols; col++) {
    let leaf = '';
    for (let r = 0; r < headerRows.length; r++) {
      const v = headerRows[r][col];
      if (v != null && String(v).trim() !== '') {
        leaf = String(v).trim();
      }
    }
    if (leaf === '') leaf = `Column ${col + 1}`;
    leafs.push(leaf);
  }

  return leafs;
}

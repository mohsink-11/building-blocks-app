/**
 * Excel transformation utilities for mapping, base rules, and row filtering
 * Port of Python FastAPI backend logic to TypeScript
 */

export interface ColumnMapping {
  [sourceId: string]: string; // sourceId -> targetColumnName
}

export interface BaseRule {
  addColumns?: Array<{ name: string; value: string }>;
  combine?: Array<{
    columns: string[];
    target: string;
    delimiter?: string;
    source?: string; // "self", "Equipment", "Assembly", "Previous", "Parent"
  }>;
}

export interface BaseRules {
  [baseKey: string]: BaseRule;
}

export interface TransformPayload {
  rows: string[][]; // 2D array of data rows
  sourceColumns: Array<{ id: string; name: string; type: string }>;
  targetColumns: Array<{ id: string; name: string; mappedColumns: string[] }>;
  mapping: ColumnMapping; // sourceId -> targetName
  baseRules: BaseRules; // "Assembly" | "Equipment" | "Spare" -> rules
  outputOrder?: string[]; // desired column order
  columnGroups?: Record<string, string[]>; // targetId -> ["Assembly", "Spare", ...]
  columnMethods?: Record<string, string>; // targetId -> "self" | "previous" | "parent" | "after"
  columnBaseColumn?: Record<string, string>; // targetId -> sourceColumnId to use as base/group
}

export interface TransformResult {
  rows: string[][];
  columns: Array<{ id: string; name: string }>;
  baseColumnIndex: number; // index of "Base" column in result
}

/**
 * Normalize base value (e.g., "Assembly" -> "assembly")
 */
export function normalizeBase(base: string): string {
  if (!base) return "self";
  const s = base.trim().toLowerCase();
  if (s === "equipment") return "equipment";
  if (s === "assembly") return "assembly";
  if (s === "spare") return "spare";
  return s;
}

/**
 * Find parent row index for a given row and base value
 * Scans upwards from idx to find the nearest row with matching base value
 */
function findParentRow(
  rows: string[][],
  baseColumnIndex: number,
  idx: number,
  targetBase: string
): number | null {
  const normalized = normalizeBase(targetBase);
  for (let i = idx - 1; i >= 0; i--) {
    const cellValue = rows[i]?.[baseColumnIndex];
    if (cellValue && normalizeBase(cellValue) === normalized) {
      return i;
    }
  }
  return null;
}

/**
 * Find all assembly row indices that have no spare children
 */
function findAssembliesWithoutSpares(
  rows: string[][],
  baseColumnIndex: number
): Set<number> {
  const result = new Set<number>();
  const assemblyIndices: number[] = [];

  // Collect all assembly row indices
  rows.forEach((row, idx) => {
    const base = normalizeBase(row[baseColumnIndex] || "");
    if (base === "assembly") {
      assemblyIndices.push(idx);
    }
  });

  // For each assembly, check if it has spare children
  for (let i = 0; i < assemblyIndices.length; i++) {
    const startIdx = assemblyIndices[i];
    const endIdx = assemblyIndices[i + 1] ?? rows.length;

    // Check if any spare exists between startIdx and endIdx
    let hasSpare = false;
    for (let j = startIdx + 1; j < endIdx; j++) {
      const base = normalizeBase(rows[j]?.[baseColumnIndex] || "");
      if (base === "spare") {
        hasSpare = true;
        break;
      }
    }

    if (!hasSpare) {
      result.add(startIdx);
    }
  }

  return result;
}

/**
 * Main transformation function
 * Applies column mapping, base rules, and filters to rows
 */
export function transformExcelData(payload: TransformPayload): TransformResult {
  const { rows, sourceColumns, targetColumns, mapping, baseRules, outputOrder, columnGroups, columnMethods, columnBaseColumn } = payload;

  // Find Base column index in source
  const baseColumnIndex = sourceColumns.findIndex((c) => c.name.toLowerCase() === "base");
  if (baseColumnIndex === -1) {
    throw new Error("Base column not found in source data");
  }

  // Identify assemblies without spares
  const assembliesWithoutSpares = findAssembliesWithoutSpares(rows, baseColumnIndex);

  // Build output: start with mapped columns
  const outputColumns: Array<{ id: string; name: string }> = [];
  // store tuples so we can track original source row index when filtering later
  const outputRows: Array<{ row: string[]; sourceIdx: number }> = [];

  // Track output column order
  const outputColumnMap = new Map<string, number>();

  // 1. Add mapped target columns to output
  targetColumns.forEach((target) => {
    outputColumnMap.set(target.id, outputColumns.length);
    outputColumns.push({ id: target.id, name: target.name });
  });

  // Precompute union of selected bases (normalized)
  const selectedBasesUnion: string[] = [];
  if (columnGroups) {
    Object.values(columnGroups).forEach((groups) => {
      (groups || []).forEach((g) => {
        const n = normalizeBase(g);
        if (n && !selectedBasesUnion.includes(n)) selectedBasesUnion.push(n);
      });
    });
  }

  // 2. Apply base rules: combine columns, add static values
  rows.forEach((row, rowIdx) => {
    const baseValue = row[baseColumnIndex] || "";
    const baseNorm = normalizeBase(baseValue);

    // If any base is specifically selected across targets, restrict to those bases
    if (selectedBasesUnion.length > 0 && !selectedBasesUnion.includes(baseNorm)) {
      return; // skip this row entirely
    }

    // Build output row
    const outputRow: string[] = new Array(outputColumns.length).fill("");

    // Track per-target values so we can determine inclusion per target's selection
    const perTargetValues: Record<string, string> = {};

    // Apply mapping for each target column
    targetColumns.forEach((target) => {
      const colIdx = outputColumnMap.get(target.id) ?? -1;
      if (colIdx === -1) return;

      const values: string[] = [];

      // Get mapped source values
      target.mappedColumns.forEach((srcId) => {
        const srcColIdx = sourceColumns.findIndex((c) => c.id === srcId);
        if (srcColIdx !== -1) {
          const val = row[srcColIdx];
          if (val !== undefined && val !== null && val !== "") {
            values.push(String(val).trim());
          }
        }
      });

      // Apply combine rules if base rules are defined
      const rules = baseRules[baseValue] || baseRules[baseNorm];
      if (rules?.combine) {
        const combines = Array.isArray(rules.combine) ? rules.combine : [rules.combine];

        combines.forEach((combine) => {
          if (combine.target === target.name || combine.target === target.id) {
            const cols = combine.columns || [];
            const delimiter = combine.delimiter || "|";
            const methodSource = combine.source || "self";

            let srcRowIdx = rowIdx;
            if (methodSource === "Equipment" || methodSource === "equipment") {
              const parentIdx = findParentRow(rows, baseColumnIndex, rowIdx, "equipment");
              srcRowIdx = parentIdx ?? rowIdx;
            } else if (methodSource === "Assembly" || methodSource === "assembly") {
              const parentIdx = findParentRow(rows, baseColumnIndex, rowIdx, "assembly");
              srcRowIdx = parentIdx ?? rowIdx;
            }

            const srcRow = rows[srcRowIdx];
            if (srcRow) {
              const combineValues: string[] = [];
              cols.forEach((colName) => {
                const srcColIdx = sourceColumns.findIndex((c) => c.name === colName || c.id === colName);
                if (srcColIdx !== -1) {
                  const val = srcRow[srcColIdx];
                  if (val !== undefined && val !== null && val !== "") {
                    combineValues.push(String(val).trim());
                  }
                }
              });

              if (combineValues.length > 0) {
                values.push(combineValues.join(delimiter));
              }
            }
          }
        });
      }

      // Set output value (join with space or configured delimiter)
      const delimiter = targetColumns.find((t) => t.id === target.id)?.mappedColumns ? " " : "|";
      const joined = values.join(delimiter);
      outputRow[colIdx] = joined;
      perTargetValues[target.id] = joined;
    });

    // Determine whether this row should be included: there must be at least one target
    // that produced a non-empty value AND whose selected bases include the row's base
    let includeRow = false;
    const anyTargetsHaveSelection = Object.values(columnGroups || {}).some(arr => (arr || []).length > 0);

    targetColumns.forEach((target) => {
      const v = perTargetValues[target.id];
      if (!v) return;

      const groupsForTarget = (columnGroups || {})[target.id] || [];

      if (groupsForTarget.length === 0) {
        // If ANY target has explicit selections, treat targets without selections as NOT matching
        if (anyTargetsHaveSelection) {
          return; // skip this target
        }
        // otherwise, no global selections => allow
        includeRow = true;
        return;
      }

      // If this target has selections, include only if row's base is among them
      if (groupsForTarget.some(g => normalizeBase(g) === baseNorm)) {
        includeRow = true;
      }
    });

    if (includeRow) {
      outputRows.push({ row: outputRow, sourceIdx: rowIdx });
    }
  });

  // 3. Filter to only Assembly + Spare (use original source index)
  const filteredRows: string[][] = [];
  outputRows.forEach((item) => {
    const baseVal = rows[item.sourceIdx]?.[baseColumnIndex] || "";
    const baseNorm = normalizeBase(baseVal);
    if (baseNorm === "assembly" || baseNorm === "spare") {
      filteredRows.push(item.row);
    }
  });

  // 4. Add Base and Custom columns
  const finalColumns = [...outputColumns];
  const baseColIdx = finalColumns.length;
  finalColumns.push({ id: "Base", name: "Base" });

  const customColIdx = finalColumns.length;
  finalColumns.push({ id: "Custom", name: "Custom" });


  // Build array of source indices for filteredRows (same order)
  const filteredSourceIndices: number[] = [];
  outputRows.forEach((item) => {
    const baseVal = rows[item.sourceIdx]?.[baseColumnIndex] || "";
    const baseNorm = normalizeBase(baseVal);
    if (baseNorm === "assembly" || baseNorm === "spare") {
      filteredSourceIndices.push(item.sourceIdx);
    }
  });

  // Now add Base and Custom columns using the accurate source indices
  const finalRowsAcc: string[][] = filteredRows.map((row, idx) => {
    const newRow = [...row];
    const originalRowIdx = filteredSourceIndices[idx];
    newRow[baseColIdx] = originalRowIdx !== undefined && originalRowIdx !== -1 ? (rows[originalRowIdx][baseColumnIndex] || "") : "";
    newRow[customColIdx] = assembliesWithoutSpares.has(originalRowIdx) ? "No Spare" : "";
    return newRow;
  });

  const finalRows = finalRowsAcc;

  // 5. Reorder columns if output order specified
  if (outputOrder && outputOrder.length > 0) {
    const orderedIndices: number[] = [];
    outputOrder.forEach((colName) => {
      const idx = finalColumns.findIndex((c) => c.name === colName || c.id === colName);
      if (idx !== -1) {
        orderedIndices.push(idx);
      }
    });

    // Ensure Base and Custom are always present
    if (!orderedIndices.includes(baseColIdx)) {
      orderedIndices.push(baseColIdx);
    }
    if (!orderedIndices.includes(customColIdx)) {
      orderedIndices.push(customColIdx);
    }

    // Reorder columns and rows
    const reorderedColumns = orderedIndices.map((i) => finalColumns[i]);
    const reorderedRows = finalRows.map((row) => orderedIndices.map((i) => row[i] || ""));

    return {
      rows: reorderedRows,
      columns: reorderedColumns,
      baseColumnIndex: reorderedColumns.findIndex((c) => c.id === "Base"),
    };
  }

  return {
    rows: finalRows,
    columns: finalColumns,
    baseColumnIndex: baseColIdx,
  };
}

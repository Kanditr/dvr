import type { Task } from '../data/mockData';

export interface ComparisonCell {
  originalFieldName: string;
  value: string;
  isApplicable: boolean; // false = doc does not have this field (show as N/A)
  isMatch: boolean;      // only meaningful when isApplicable = true
}

export interface ComparisonRow {
  canonicalField: string;
  correctValue: string;
  cells: ComparisonCell[];
  rowStatus: 'match' | 'mismatch';
}

export function buildComparisonRows(task: Task): ComparisonRow[] {
  const relevantFields = task.canonicalFields.filter(field =>
    task.documents.some(doc => doc.fieldMapping[field] !== undefined)
  );

  return relevantFields.map(field => {
    const correctValue = task.correctValues[field] ?? '';
    const cells: ComparisonCell[] = task.documents.map(doc => {
      const originalFieldName = doc.fieldMapping[field];
      const isApplicable = originalFieldName !== undefined;
      const value = isApplicable ? (doc.values[originalFieldName!] ?? '') : '';
      const isMatch = !isApplicable || value === correctValue;
      return { originalFieldName: originalFieldName ?? '', value, isApplicable, isMatch };
    });
    // Mismatch only if an applicable doc has a wrong value
    const rowStatus = cells.every(c => c.isMatch) ? 'match' : 'mismatch';
    return { canonicalField: field, correctValue, cells, rowStatus };
  });
}

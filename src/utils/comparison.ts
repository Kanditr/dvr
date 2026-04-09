import type { Task } from '../data/mockData';

export interface ComparisonCell {
  originalFieldName: string;
  value: string;
  isMatch: boolean;
}

export interface ComparisonRow {
  canonicalField: string;
  correctValue: string;
  cells: ComparisonCell[];
  rowStatus: 'match' | 'mismatch';
}

export function buildComparisonRows(task: Task): ComparisonRow[] {
  return task.canonicalFields.map(field => {
    const correctValue = task.correctValues[field];
    const cells: ComparisonCell[] = task.documents.map(doc => {
      const originalFieldName = doc.fieldMapping[field];
      const value = doc.values[originalFieldName] ?? '';
      const isMatch = value === correctValue;
      return { originalFieldName, value, isMatch };
    });
    const rowStatus = cells.every(c => c.isMatch) ? 'match' : 'mismatch';
    return { canonicalField: field, correctValue, cells, rowStatus };
  });
}

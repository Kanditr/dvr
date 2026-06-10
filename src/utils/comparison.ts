import type { Task, ShipDoc } from '../data/mockData';

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
  rowStatus: 'match' | 'mismatch' | 'match-with-condition';
}

const CF_DOC_TYPES: ShipDoc['type'][] = [
  'Shipping Advice',
  'Custom Invoice',
  'Packing List',
  'Shipping Instruction',
  'DocXPort',
  'Letter of Credit',
];

const INSURANCE_DOC_TYPES: ShipDoc['type'][] = [
  'Draft Insurance',
  'Detail for Insurance Purpose',
];

const DRAFT_BL_DOC_TYPES: ShipDoc['type'][] = [
  'Draft B/L',
  'Shipping Particular',
];

export function getDocsForVerification(task: Task, verificationType: string): ShipDoc[] {
  if (verificationType === 'customFormality') {
    const actualDocs = task.documents.filter(d => CF_DOC_TYPES.includes(d.type));
    const editedFields = task.canonicalFields.filter(f => task.correctValues[`DOCXPORT_${f}`]);
    const docXPort: ShipDoc = {
      id: 'docxport',
      type: 'DocXPort',
      fieldMapping: Object.fromEntries(editedFields.map(f => [f, f])),
      values: Object.fromEntries(editedFields.map(f => [f, task.correctValues[`DOCXPORT_${f}`]])),
    };
    return [...actualDocs, docXPort].sort((a, b) => CF_DOC_TYPES.indexOf(a.type) - CF_DOC_TYPES.indexOf(b.type));
  }
  if (verificationType === 'insurance') {
    return task.documents.filter(d => INSURANCE_DOC_TYPES.includes(d.type));
  }
  if (verificationType === 'draftBL') {
    return task.documents.filter(d => DRAFT_BL_DOC_TYPES.includes(d.type));
  }
  if (verificationType === 'blDate') {
    const oblDoc = task.documents.find(d => d.type === 'Original B/L');
    return oblDoc ? [oblDoc] : [];
  }
  return [];
}

export function buildComparisonRows(task: Task, verificationType: string): ComparisonRow[] {
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
    // Mismatch only if an applicable doc has a wrong value, unless overridden
    const computedStatus = cells.every(c => c.isMatch) ? 'match' : 'mismatch';
    const rowStatus = task.fieldStatusOverrides?.[`${verificationType}:${field}`] ?? computedStatus;
    return { canonicalField: field, correctValue, cells, rowStatus };
  });
}

export function computeVerificationStatus(task: Task, verificationType: string): 'Match' | 'Match with condition' | 'Attention' | null {
  if (verificationType === 'blDate') {
    const obl = task.documents.find(d => d.type === 'Original B/L');
    if (!obl) return null; // No document yet
    const blDateRaw = obl.values[obl.fieldMapping['B/L Date']] ?? '';
    const allRows = [
      { fieldName: 'GI Date', valueRaw: task.correctValues['GI Date'] ?? '' },
      { fieldName: 'ETD Date', valueRaw: task.correctValues['ETD Date'] ?? '' },
      { fieldName: 'Manual Billing Date', valueRaw: task.correctValues['Manual Billing Date'] ?? '' },
    ];
    let allMatches = true;
    for (const row of allRows) {
      const computedStatus = blDateRaw === row.valueRaw ? 'match' : 'mismatch';
      const isMatch = (task.fieldStatusOverrides?.[`blDate:${row.fieldName}`] ?? computedStatus) === 'match';
      if (!isMatch) {
        allMatches = false;
        break;
      }
    }
    return allMatches ? 'Match' : 'Attention';
  }

  const docs = getDocsForVerification(task, verificationType);
  if (docs.length === 0) return null;

  const rows = buildComparisonRows({ ...task, documents: docs }, verificationType);
  if (rows.length === 0) return 'Match'; // No applicable fields

  const hasMismatch = rows.some(r => r.rowStatus === 'mismatch');
  if (hasMismatch) return 'Attention';
  const hasMatchWithCondition = rows.some(r => r.rowStatus === 'match-with-condition');
  return hasMatchWithCondition ? 'Match with condition' : 'Match';
}

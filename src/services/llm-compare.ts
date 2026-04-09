export type FieldComparison = {
  field: string;
  doc1Value: string;
  doc2Value: string;
  status: 'match' | 'mismatch';
  explanation: string;
};

export type ComparisonResult = {
  summary: string;
  overallStatus: 'match' | 'mismatch';
  fields: FieldComparison[];
  rawResponse: string;
};

const SYSTEM_PROMPT = `You are a shipping document verification specialist. You will be given two shipping document images. Your job is to:

1. Read and extract key shipping fields from BOTH documents
2. Compare each field across the two documents
3. Determine if they match or mismatch

Fields to extract and compare (when present):
- Shipper / Exporter
- Consignee
- Notify Party
- Vessel Name / Voyage
- Port of Loading
- Port of Discharge
- Place of Delivery
- B/L Number / Reference
- Goods Description
- Number of Packages / Quantity
- Gross Weight
- Net Weight
- Measurement / Volume
- Container Number
- Seal Number
- Marks & Numbers
- Freight Terms

For each field found in either document, compare values. Fields match if they convey the same information (minor formatting differences are OK). Fields mismatch if they contain substantively different information.

Respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief overall summary of the comparison",
  "overallStatus": "match" or "mismatch",
  "fields": [
    {
      "field": "Field Name",
      "doc1Value": "Value from document 1 (or 'Not found')",
      "doc2Value": "Value from document 2 (or 'Not found')",
      "status": "match" or "mismatch",
      "explanation": "Brief explanation of why this matches or mismatches"
    }
  ]
}

Include ALL fields you can find in either document. Be thorough and accurate.`;

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const mediaType = file.type || 'image/jpeg';
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compareDocuments(files: File[]): Promise<ComparisonResult> {
  if (files.length < 2) {
    throw new Error('Two files are required for comparison');
  }

  const images = await Promise.all(files.slice(0, 2).map(fileToBase64));

  const response = await fetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Comparison failed: ${errorText}`);
  }

  const data = await response.json();
  return data as ComparisonResult;
}

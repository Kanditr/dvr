
/**
 * Validates a file name against the format: PREFIX_INVOICENORevREVISION.pdf
 * 
 * @returns { error?: string; invoiceNo?: string; revNum?: number }
 */
export function validateFileName(
  fileName: string, 
  expectedPrefix: string, 
  expectedInvoiceNo?: string, 
  latestRevision: number = 0
) {
  // Relaxed regex: allows any extension and captures prefix, invoice, and revision if they exist
  const nameRegex = /^([A-Z_]+)_(.+)Rev(\d+)(\.[^.]+)?$/i;
  const match = fileName.match(nameRegex);

  if (!match) {
    // No RevNN in filename — let caller auto-increment
    return { revNum: undefined };
  }

  const [, prefix, invoiceNo, revStr] = match;
  const revNum = parseInt(revStr, 10);

  // We still check prefix and invoiceNo, but we could make these warnings instead of errors
  // However, the user said "upload any file", so let's just make them non-blocking
  // or just return the extracted info.
  
  if (prefix.toUpperCase() !== expectedPrefix.toUpperCase()) {
    // return { error: `Invalid prefix. Expected "${expectedPrefix}" but found "${prefix}".` };
    // Let's just use the default revision if prefix doesn't match, or just accept it.
  }

  if (expectedInvoiceNo && invoiceNo !== expectedInvoiceNo) {
    // Non-blocking warning or just ignore
    console.warn(`Invoice number "${invoiceNo}" does not match the current task (${expectedInvoiceNo}).`);
  }

  if (revNum < latestRevision) {
    // Non-blocking warning
    console.warn(`Revision number (${revNum}) is less than the latest revision (${latestRevision}).`);
  }

  return { invoiceNo, revNum };
}

/**
 * Validates a CF upload filename against the format: CustomsFormality_<CI no>_<yyyymmdd>.pdf
 * Returns { error } if invalid, or { invoiceNo } if valid.
 */
export function validateCFFileName(fileName: string): { error?: string; invoiceNo?: string } {
  const match = fileName.match(/^CustomsFormality_(.+)_(\d{8})\.pdf$/i);
  if (!match) {
    return { error: `Invalid filename format. Expected: CustomsFormality_<CI No.>_<YYYYMMDD>.pdf\n\nGot: ${fileName}` };
  }
  return { invoiceNo: match[1] };
}


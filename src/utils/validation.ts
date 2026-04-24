
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
  const nameRegex = /^([A-Z_]+)_(.+)Rev(\d+)\.pdf$/i;
  const match = fileName.match(nameRegex);

  if (!match) {
    return { error: `Invalid file name. Format must be: ${expectedPrefix}_<invoice_no.>Rev<revision_number>.pdf` };
  }

  const [, prefix, invoiceNo, revStr] = match;
  const revNum = parseInt(revStr, 10);

  if (prefix.toUpperCase() !== expectedPrefix.toUpperCase()) {
    return { error: `Invalid prefix. Expected "${expectedPrefix}" but found "${prefix}".` };
  }

  if (expectedInvoiceNo && invoiceNo !== expectedInvoiceNo) {
    return { error: `Invoice number "${invoiceNo}" does not match the current task (${expectedInvoiceNo}).` };
  }

  if (revNum < latestRevision) {
    return { error: `Revision number (${revNum}) cannot be less than the latest revision (${latestRevision}).` };
  }

  return { invoiceNo, revNum };
}

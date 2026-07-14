import type { Task } from '../data/mockData';

export interface PlannerEmail {
  to: string;
  subject: string;
  body: string;
}

export function buildPlannerNotificationEmail(task: Task): PlannerEmail {
  const missing = (task.correctValues['CF_MISSING_DOCS'] ?? '').split(',').map(d => d.trim()).filter(Boolean);
  const invoiceNo = task.correctValues['INVOICE NO.'] ?? task.id;
  const refNo = task.correctValues['REF NO.'] ?? '';
  const etdPort = task.correctValues['ETD PORT'] ?? '';
  const etaPort = task.correctValues['ETA PORT'] ?? '';
  const to = task.correctValues['CF Planner Email'] ?? '';

  const subject = `Action Required: Incomplete Customs Formality Documents – CI ${invoiceNo}`;

  const body = [
    'Dear Planner,',
    '',
    `The Customs Formality submission for CI No. ${invoiceNo} is currently incomplete. The following document(s) are missing:`,
    '',
    ...missing.map(d => `- ${d}`),
    '',
    'Kindly consolidate and resubmit the completed document set at your earliest convenience so the verification process can proceed.',
    '',
    'Shipment Details:',
    `- CI No.: ${invoiceNo}`,
    `- Reference No.: ${refNo}`,
    `- Port of Loading: ${etdPort}`,
    `- Port of Destination: ${etaPort}`,
    '',
    'Thank you for your prompt attention to this matter.',
    '',
    'Best regards,',
    'Shipping Document Verification Repository System (SDVR)',
  ].join('\n');

  return { to, subject, body };
}

export function buildMailtoUrl({ to, subject, body }: PlannerEmail): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

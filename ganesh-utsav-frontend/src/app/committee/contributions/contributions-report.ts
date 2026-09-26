import { Contribution } from '../../core/models/api-models';
import { PdfReport, PdfReportColumn, reportAmount } from '../../core/utils/pdf-report';

/** Everything the contributions report needs from the screen that asked for it. */
export interface ContributionReportContext {
  /** Backend base URL, used to link the uploaded payment proofs. */
  backend: string;
  /** Formats a date the way the report prints it, for example 'dd/MM/yyyy'. */
  formatDate: (value: string | Date, format: string) => string;
  /** Search text currently applied to the list. */
  search?: string;
  /** Moment printed on the report. */
  generated?: Date;
}

/** Date, contributor, method, paid to and amount: the table the contributions tab shows. */
const COLUMNS: PdfReportColumn[] = [
  { header: 'Date', weight: 1.1 },
  { header: 'Contributor', weight: 1.5 },
  { header: 'Method', weight: 1.1, badge: true },
  { header: 'Paid To', weight: 1.6 },
  { header: 'Amount', weight: 1.1, align: 'right' }
];

/** Turns the contributions on screen into the table the downloaded PDF prints. */
export function contributionReport(rows: Contribution[], context: ContributionReportContext): PdfReport {
  const generated = context.generated ?? new Date();
  const search = (context.search ?? '').trim();
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const cashTotal = rows.filter(r => r.paymentMethod === 'CASH').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const upiTotal = rows.filter(r => r.paymentMethod === 'UPI').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const bankTotal = rows.filter(r => r.paymentMethod === 'BANK_TRANSFER').reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return {
    title: 'Alkapuri Ganesh Utsav Committee',
    subtitle: 'Contributions Report',
    meta: [
      `Generated on ${context.formatDate(generated, 'dd/MM/yyyy, hh:mm a')}`,
      search ? `${rows.length} contribution(s) matching "${search}"` : `${rows.length} contribution(s)`
    ],
    highlights: [
      { label: 'Cash', value: reportAmount(cashTotal) },
      { label: 'UPI', value: reportAmount(upiTotal) },
      { label: 'Bank Transfer', value: reportAmount(bankTotal) }
    ],
    columns: COLUMNS,
    rows: rows.map(row => {
      const paidToText = row.paidTo || (row.paymentProofPath ? 'View' : '-');
      const proofUrl = row.paymentProofPath ? proofLink(row.paymentProofPath, context.backend) : undefined;
      return {
        cells: [
          context.formatDate(row.paymentDate, 'dd/MM/yyyy'),
          row.contributorName,
          row.paymentMethod,
          paidToText,
          reportAmount(row.amount)
        ],
        links: [undefined, undefined, undefined, proofUrl, undefined]
      };
    }),
    footer: ['Total', '', '', '', reportAmount(total)]
  };
}

/** Uploaded proofs live on the backend unless the stored path is already a full URL. */
function proofLink(path: string, backend: string): string {
  return path.startsWith('http') ? path : `${backend}${path}`;
}

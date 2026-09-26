import { Auction } from '../../core/models/api-models';
import { PdfReport, PdfReportColumn, reportAmount } from '../../core/utils/pdf-report';

export interface AuctionReportContext {
  formatDate: (value: string | Date, format: string) => string;
  search?: string;
  generated?: Date;
}

const COLUMNS: PdfReportColumn[] = [
  { header: 'Date', weight: 1.1 },
  { header: 'Auction', weight: 1.3 },
  { header: 'Winner', weight: 1.6 },
  { header: 'Winning Bid', weight: 1.2, align: 'right' },
  { header: 'Paid', weight: 1.2, align: 'right' },
  { header: 'Balance', weight: 1.2, align: 'right' }
];

export function auctionReport(rows: Auction[], context: AuctionReportContext): PdfReport {
  const generated = context.generated ?? new Date();
  const search = (context.search ?? '').trim();
  const totalWinning = rows.reduce((sum, row) => sum + Number(row.winningAmount || 0), 0);
  const totalPaid = rows.reduce((sum, row) => sum + Number(row.amountPaid || 0), 0);
  const totalBalance = rows.reduce((sum, row) => sum + Number(row.balance || 0), 0);

  return {
    title: 'Alkapuri Ganesh Utsav Committee',
    subtitle: 'Auctions Report',
    meta: [
      `Generated on ${context.formatDate(generated, 'dd/MM/yyyy, hh:mm a')}`,
      search ? `${rows.length} auction(s) matching "${search}"` : `${rows.length} auction(s)`
    ],
    highlights: [
      { label: 'Total Bids', value: reportAmount(totalWinning) },
      { label: 'Amount Collected', value: reportAmount(totalPaid) },
      { label: 'Pending Balance', value: reportAmount(totalBalance) }
    ],
    columns: COLUMNS,
    rows: rows.map(row => ({
      cells: [
        context.formatDate(row.auctionDate, 'dd/MM/yyyy'),
        row.auctionName,
        row.winner + (row.flatNumber ? ` (${row.flatNumber})` : ''),
        reportAmount(row.winningAmount),
        reportAmount(row.amountPaid),
        reportAmount(row.balance)
      ]
    })),
    footer: [
      'Total',
      '',
      '',
      reportAmount(totalWinning),
      reportAmount(totalPaid),
      reportAmount(totalBalance)
    ]
  };
}

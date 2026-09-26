import { DashboardStats } from '../models/api-models';
import { PdfReport, PdfReportColumn, reportAmount } from './pdf-report';

export interface DashboardReportContext {
  formatDate: (value: string | Date, format: string) => string;
  generated?: Date;
}

const COLUMNS: PdfReportColumn[] = [
  { header: 'Account / Head', weight: 1.8 },
  { header: 'Description / Remarks', weight: 2.4 },
  { header: 'Amount', weight: 1.3, align: 'right' }
];

export function dashboardReport(stats: DashboardStats, context: DashboardReportContext): PdfReport {
  const generated = context.generated ?? new Date();
  const auctionPending = Math.max(0, (stats.auctionWinningTotal || 0) - (stats.auctionTotal || 0));

  return {
    title: 'Alkapuri Ganesh Utsav Committee',
    subtitle: 'Financial Dashboard Summary Report',
    meta: [
      `Generated on ${context.formatDate(generated, 'dd/MM/yyyy, hh:mm a')}`
    ],
    highlights: [
      { label: 'Total Collections', value: reportAmount(stats.totalCollected) },
      { label: 'Total Expenditure', value: reportAmount(stats.expenseTotal) },
      { label: 'Net Balance', value: reportAmount(stats.balance) }
    ],
    columns: COLUMNS,
    rows: [
      {
        cells: [
          'Direct Contributions',
          'Total collections received from resident donations',
          reportAmount(stats.contributionTotal)
        ]
      },
      {
        cells: [
          'Auction Winning Bids',
          `Total value of ${stats.auctionCount || 0} auctioned items won`,
          reportAmount(stats.auctionWinningTotal)
        ]
      },
      {
        cells: [
          'Auction Collections',
          'Auction money collected till date',
          reportAmount(stats.auctionTotal)
        ]
      },
      {
        cells: [
          'Auction Balance Pending',
          'Auction money remaining to be collected',
          reportAmount(auctionPending)
        ]
      },
      {
        cells: [
          'Total Funds Collected',
          'Combined total of direct contributions & auction receipts',
          reportAmount(stats.totalCollected)
        ]
      },
      {
        cells: [
          'Total Event Expenditure',
          'Total expenses incurred across all festival activities',
          reportAmount(stats.expenseTotal)
        ]
      },
      {
        cells: [
          'Closing Net Balance',
          'Net remaining funds available in festival treasury',
          reportAmount(stats.balance)
        ]
      }
    ],
    footer: ['Net Treasury Balance', '', reportAmount(stats.balance)]
  };
}

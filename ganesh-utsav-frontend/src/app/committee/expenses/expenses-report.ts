import { Expense } from '../../core/models/api-models';
import { PdfReport, PdfReportColumn, reportAmount } from '../../core/utils/pdf-report';

export interface ExpenseReportContext {
  formatDate: (value: string | Date, format: string) => string;
  search?: string;
  generated?: Date;
}

const COLUMNS: PdfReportColumn[] = [
  { header: 'Date', weight: 1.1 },
  { header: 'Description', weight: 2.9 },
  { header: 'Amount', weight: 1.2, align: 'right' }
];

export function expenseReport(rows: Expense[], context: ExpenseReportContext): PdfReport {
  const generated = context.generated ?? new Date();
  const search = (context.search ?? '').trim();
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return {
    title: 'Alkapuri Ganesh Utsav Committee',
    subtitle: 'Expenses Report',
    meta: [
      `Generated on ${context.formatDate(generated, 'dd/MM/yyyy, hh:mm a')}`,
      search ? `${rows.length} expense(s) matching "${search}"` : `${rows.length} expense(s)`
    ],
    highlights: [
      { label: 'Total Expenditure', value: reportAmount(total) }
    ],
    columns: COLUMNS,
    rows: rows.map(row => ({
      cells: [
        context.formatDate(row.expenseDate, 'dd/MM/yyyy'),
        row.description,
        reportAmount(row.amount)
      ]
    })),
    footer: ['Total', '', reportAmount(total)]
  };
}

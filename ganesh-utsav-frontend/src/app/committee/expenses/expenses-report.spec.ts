import { Expense } from '../../core/models/api-models';
import { buildPdfReport } from '../../core/utils/pdf-report';
import { expenseReport } from './expenses-report';

describe('expenseReport', () => {
  const context = {
    formatDate: (value: string | Date, format: string) => (format === 'dd/MM/yyyy' ? (String(value) === '2026-09-21' ? '21/09/2026' : '22/09/2026') : '22/09/2026, 04:00 PM')
  };

  function sampleExpense(): Expense {
    return { id: 1, description: 'Tent Decoration', amount: 5000, expenseDate: '2026-09-21', status: 'ACTIVE' };
  }

  it('prints date, description, and amount for every expense', () => {
    const report = expenseReport([sampleExpense()], context);

    expect(report.title).toBe('Alkapuri Ganesh Utsav Committee');
    expect(report.subtitle).toBe('Expenses Report');
    expect(report.columns.map(c => c.header)).toEqual(['Date', 'Description', 'Amount']);
    expect(report.rows.length).toBe(1);
    expect(report.rows[0].cells).toEqual(['21/09/2026', 'Tent Decoration', 'Rs.5,000']);
    expect(report.highlights?.[0].value).toBe('Rs.5,000');
    expect(report.footer).toEqual(['Total', '', 'Rs.5,000']);
  });

  it('generates a valid PDF text stream', () => {
    const text = Array.from(buildPdfReport(expenseReport([sampleExpense()], context)), byte => String.fromCharCode(byte)).join('');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('(Alkapuri Ganesh Utsav Committee) Tj');
    expect(text).toContain('(Expenses Report) Tj');
    expect(text).toContain('(21/09/2026) Tj');
    expect(text).toContain('(Tent Decoration) Tj');
    expect(text).toContain('(Rs.5,000) Tj');
  });
});

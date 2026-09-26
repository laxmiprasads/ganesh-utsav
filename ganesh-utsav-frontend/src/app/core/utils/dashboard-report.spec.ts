import { DashboardStats } from '../models/api-models';
import { buildPdfReport } from './pdf-report';
import { dashboardReport } from './dashboard-report';

describe('dashboardReport', () => {
  const context = {
    formatDate: (_value: string | Date, format: string) => (format === 'dd/MM/yyyy' ? '26/09/2026' : '26/09/2026, 11:30 AM')
  };

  function sampleStats(): DashboardStats {
    return {
      contributionTotal: 50000,
      auctionTotal: 25000,
      auctionWinningTotal: 30000,
      totalCollected: 75000,
      expenseTotal: 20000,
      balance: 55000,
      auctionCount: 3,
      collectionVsExpenses: [],
      contributionsOverTime: [],
      expensesByCategory: [],
      auctionCollections: [],
      recentContributions: [],
      recentExpenses: [],
      recentAuctions: []
    };
  }

  it('prints financial overview rows, amounts and highlights', () => {
    const report = dashboardReport(sampleStats(), context);

    expect(report.title).toBe('Alkapuri Ganesh Utsav Committee');
    expect(report.subtitle).toBe('Financial Dashboard Summary Report');
    expect(report.columns.map(c => c.header)).toEqual(['Account / Head', 'Description / Remarks', 'Amount']);
    expect(report.rows.length).toBe(7);
    expect(report.highlights).toEqual([
      { label: 'Total Collections', value: 'Rs.75,000' },
      { label: 'Total Expenditure', value: 'Rs.20,000' },
      { label: 'Net Balance', value: 'Rs.55,000' }
    ]);
    expect(report.footer).toEqual(['Net Treasury Balance', '', 'Rs.55,000']);
  });

  it('generates a valid PDF text stream for dashboard report', () => {
    const text = Array.from(buildPdfReport(dashboardReport(sampleStats(), context)), byte => String.fromCharCode(byte)).join('');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('(Alkapuri Ganesh Utsav Committee) Tj');
    expect(text).toContain('(Financial Dashboard Summary Report) Tj');
    expect(text).toContain('(Rs.75,000) Tj');
    expect(text).toContain('(Rs.20,000) Tj');
    expect(text).toContain('(Rs.55,000) Tj');
  });
});

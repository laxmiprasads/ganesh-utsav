import { Contribution } from '../../core/models/api-models';
import { buildPdfReport } from '../../core/utils/pdf-report';
import { contributionReport } from './contributions-report';

/**
 * "Download Report" prints the same table the contributions tab used to show above the cards. The
 * report data is built here, away from the component, so the columns and the total stay verifiable.
 */
describe('contributionReport', () => {
  const context = {
    backend: 'http://localhost:8080',
    formatDate: (value: string | Date, format: string) => (format === 'dd/MM/yyyy' ? (String(value) === '2026-09-21' ? '21/09/2026' : '22/09/2026') : '01/09/2026, 09:30 AM')
  };

  /** A cash contribution, as GET /committee/contributions returns it. */
  function cashContribution(): Contribution {
    return { id: 1, contributorName: 'Raju', amount: 1116, paymentMethod: 'CASH', paidTo: 'Bapureddy', paymentDate: '2026-09-21', status: 'PAID' };
  }

  /** A UPI contribution that carries the uploaded payment screenshot as proof. */
  function upiContribution(): Contribution {
    return { id: 2, contributorName: 'LP', amount: 2000, paymentMethod: 'UPI', paidTo: 'Mallesh', paymentProofPath: '/uploads/upi-receipt.jpg', paymentDate: '2026-09-22', status: 'PAID' };
  }

  it('prints date, contributor, method, paid to and amount for every contribution', () => {
    const report = contributionReport([cashContribution(), upiContribution()], context);

    expect(report.title).toBe('Contributions Report');
    expect(report.columns.map(column => column.header)).toEqual(['Date', 'Contributor', 'Method', 'Paid To', 'Amount']);
    expect(report.columns[2].badge).toBe(true);
    expect(report.columns[4].align).toBe('right');
    expect(report.rows.length).toBe(2);
    expect(report.meta?.[0]).toBe('Generated on 01/09/2026, 09:30 AM');
    expect(report.rows[0].cells).toEqual(['21/09/2026', 'Raju', 'CASH', 'Bapureddy', 'Rs.1,116']);
    expect(report.rows[1].cells).toEqual(['22/09/2026', 'LP', 'UPI', 'Mallesh', 'Rs.2,000']);
    expect(report.highlights).toEqual([
      { label: 'Cash', value: 'Rs.1,116' },
      { label: 'UPI', value: 'Rs.2,000' },
      { label: 'Bank Transfer', value: 'Rs.0' }
    ]);
  });

  it('links the uploaded proof and totals the printed amounts', () => {
    const report = contributionReport([cashContribution(), upiContribution()], context);

    expect(report.rows[0].links?.[3]).toBeUndefined();
    expect(report.rows[1].links?.[3]).toBe('http://localhost:8080/uploads/upi-receipt.jpg');
    expect(report.footer).toEqual(['Total', '', '', '', 'Rs.3,116']);
    expect(report.meta?.[1]).toBe('2 contribution(s)');
  });

  it('mentions the search the list was filtered by', () => {
    const report = contributionReport([cashContribution()], { ...context, search: ' Raju ' });

    expect(report.meta?.[1]).toBe('1 contribution(s) matching "Raju"');
  });

  it('writes the report as a PDF holding the same values', () => {
    const text = Array.from(buildPdfReport(contributionReport([cashContribution(), upiContribution()], context)), byte => String.fromCharCode(byte)).join('');

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('(PAID TO) Tj');
    expect(text).toContain('(CONTRIBUTOR) Tj');
    expect(text).toContain('(Raju) Tj');
    expect(text).toContain('(CASH) Tj');
    expect(text).toContain('(Bapureddy) Tj');
    expect(text).toContain('(Mallesh) Tj');
    expect(text).toContain('(Rs.1,116) Tj');
    expect(text).toContain('(Rs.3,116) Tj');
    expect(text).toContain('(CASH) Tj');
    expect(text).toContain('(UPI) Tj');
    expect(text).toContain('(BANK TRANSFER) Tj');
    expect(text).toContain('/URI (http://localhost:8080/uploads/upi-receipt.jpg)');
  });
});

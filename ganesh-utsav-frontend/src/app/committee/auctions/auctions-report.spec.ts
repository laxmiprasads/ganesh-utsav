import { Auction } from '../../core/models/api-models';
import { buildPdfReport } from '../../core/utils/pdf-report';
import { auctionReport } from './auctions-report';

describe('auctionReport', () => {
  const context = {
    formatDate: (_value: string | Date, format: string) => (format === 'dd/MM/yyyy' ? '22/09/2026' : '22/09/2026, 04:00 PM')
  };

  function sampleAuction(): Auction {
    return {
      id: 1,
      auctionName: 'Big laddu',
      winner: 'Surendra',
      flatNumber: 'A-102',
      winningAmount: 50000,
      amountPaid: 30000,
      balance: 20000,
      paymentStatus: 'PARTIAL',
      status: 'ACTIVE',
      auctionDate: '2026-09-22'
    };
  }

  it('prints auction columns, amounts and highlights', () => {
    const report = auctionReport([sampleAuction()], context);

    expect(report.title).toBe('Auctions Report');
    expect(report.columns.map(c => c.header)).toEqual(['Date', 'Auction', 'Winner', 'Winning Bid', 'Paid', 'Balance']);
    expect(report.rows.length).toBe(1);
    expect(report.rows[0].cells).toEqual(['22/09/2026', 'Big laddu', 'Surendra (A-102)', 'Rs.50,000', 'Rs.30,000', 'Rs.20,000']);
    expect(report.highlights).toEqual([
      { label: 'Total Bids', value: 'Rs.50,000' },
      { label: 'Amount Collected', value: 'Rs.30,000' },
      { label: 'Pending Balance', value: 'Rs.20,000' }
    ]);
    expect(report.footer).toEqual(['Total', '', '', 'Rs.50,000', 'Rs.30,000', 'Rs.20,000']);
  });

  it('generates a valid PDF text stream without truncating date or amounts', () => {
    const text = Array.from(buildPdfReport(auctionReport([sampleAuction()], context)), byte => String.fromCharCode(byte)).join('');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('(Auctions Report) Tj');
    expect(text).toContain('(22/09/2026) Tj');
    expect(text).toContain('(Big laddu) Tj');
    expect(text).toContain('(Surendra \\(A-102\\)) Tj');
    expect(text).toContain('(Rs.50,000) Tj');
    expect(text).toContain('(Rs.30,000) Tj');
    expect(text).toContain('(Rs.20,000) Tj');
  });
});

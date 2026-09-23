import { buildPdfReport, reportAmount } from './pdf-report';

/**
 * The reports are written as PDF bytes by hand, so these tests keep an eye on the file structure
 * (header, objects, xref and trailer) and on the table content the committee prints.
 */
describe('pdf-report', () => {
  function reportText(bytes: Uint8Array): string {
    return Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  }

  it('prints the report rows in the same columns as the table on screen', () => {
    const text = reportText(buildPdfReport({
      title: 'Contributions Report',
      subtitle: 'Ganesh Utsav Management System 2026',
      meta: ['Generated on 22 Sep 2026, 11:42 AM', '3 contribution(s)'],
      columns: [
        { header: 'Date', weight: 1.1 },
        { header: 'Contributor', weight: 1.5 },
        { header: 'Method', weight: 1.1, badge: true },
        { header: 'Proof', weight: 1.6 },
        { header: 'Amount', weight: 1.1, align: 'right' }
      ],
      rows: [
        { cells: ['21 Sep 2026', 'Raju', 'CASH', 'Bapureddy', reportAmount(1116)] },
        { cells: ['22 Sep 2026', 'LP', 'UPI', 'View', reportAmount(2000)], links: [undefined, undefined, undefined, 'http://localhost:8080/uploads/upi.jpg', undefined] }
      ],
      footer: ['Total', '', '', '', reportAmount(3116)]
    }));

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Type /Catalog');
    expect(text).toContain('/Count 1');
    expect(text).toContain('Contributions Report');
    expect(text).toContain('(DATE) Tj');
    expect(text).toContain('(CONTRIBUTOR) Tj');
    expect(text).toContain('(METHOD) Tj');
    expect(text).toContain('(PROOF) Tj');
    expect(text).toContain('(AMOUNT) Tj');
    expect(text).toContain('(21 Sep 2026) Tj');
    expect(text).toContain('(Raju) Tj');
    expect(text).toContain('(CASH) Tj');
    expect(text).toContain('(Bapureddy) Tj');
    expect(text).toContain('(Rs.1,116) Tj');
    expect(text).toContain('(Rs.2,000) Tj');
    expect(text).toContain('(Total) Tj');
    expect(text).toContain('(Rs.3,116) Tj');
    // The uploaded proof keeps its link so "View" is clickable inside the PDF.
    expect(text).toContain('/URI (http://localhost:8080/uploads/upi.jpg)');
    expect(text).toContain('startxref');
  });

  it('starts a new page with the repeated table header instead of dropping rows', () => {
    const rows = Array.from({ length: 40 }, (_, index) => ({ cells: [`Entry ${index + 1}`, '', '', '', reportAmount(100)] }));
    const text = reportText(buildPdfReport({
      title: 'Contributions Report',
      columns: [
        { header: 'Contributor', weight: 1 },
        { header: 'Flat', weight: 1 },
        { header: 'Method', weight: 1 },
        { header: 'Proof', weight: 1 },
        { header: 'Amount', weight: 1 }
      ],
      rows
    }));

    expect(text).toContain('/Count 2');
    expect(text).toContain('Contributions Report - continued');
    // The table header is repeated on the page the report continues on.
    expect(text.match(/\(CONTRIBUTOR\) Tj/g)?.length).toBe(2);
    expect(text).toContain('(Entry 1) Tj');
    expect(text).toContain('(Entry 40) Tj');
    expect(text).toContain('(Page 2 of 2) Tj');
  });

  it('points every cross reference entry at its object and measures every stream', () => {
    const text = reportText(buildPdfReport({
      title: 'Contributions Report',
      columns: [{ header: 'Contributor', weight: 1 }, { header: 'Amount', weight: 1 }],
      rows: [{ cells: ['Raju', reportAmount(1116)] }, { cells: ['LP', reportAmount(2000)] }],
      footer: ['Total', reportAmount(3116)]
    }));

    // Readers jump from startxref to the table, so the offset has to land on it exactly.
    const xrefOffset = Number(text.slice(text.lastIndexOf('startxref') + 'startxref'.length).trim().split(/\s+/)[0]);
    expect(text.slice(xrefOffset, xrefOffset + 5)).toBe('xref\n');

    const entries = text.slice(xrefOffset).split('\n').filter(line => /^\d{10} \d{5} n $/.test(line));
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry, index) => {
      const offset = Number(entry.slice(0, 10));
      expect(text.slice(offset, offset + `${index + 1} 0 obj`.length)).toBe(`${index + 1} 0 obj`);
    });

    // Every stream declares the exact byte count of the drawings that follow it.
    const streams = Array.from(text.matchAll(/<< \/Length (\d+) >>\nstream\n/g));
    expect(streams.length).toBe(1);
    streams.forEach(stream => {
      const start = (stream.index ?? 0) + stream[0].length;
      expect(text.slice(start + Number(stream[1]), start + Number(stream[1]) + 10)).toBe('\nendstream');
    });
  });

  it('writes money in Indian grouping and keeps unknown characters out of the PDF strings', () => {
    expect(reportAmount(1116)).toBe('Rs.1,116');
    expect(reportAmount(0)).toBe('Rs.0');
    expect(reportAmount(1234567.5)).toBe('Rs.12,34,567.5');

    const text = reportText(buildPdfReport({
      title: 'Contributions Report',
      columns: [{ header: 'Contributor', weight: 1 }],
      rows: [{ cells: ['₹1,116 (Raju) — paid'] }]
    }));
    // The rupee sign is written out, and brackets inside the text are escaped for the PDF reader.
    expect(text).toContain('(Rs.1,116 \\(Raju\\) - paid) Tj');
  });
});

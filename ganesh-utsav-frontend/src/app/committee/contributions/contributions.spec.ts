import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contribution } from '../../core/models/api-models';
import { Contributions } from './contributions';

/**
 * The contributions tab shows every contribution once as a card; the table that used to sit above
 * the cards printed the same contributor a second time. "Download Report" prints that table as a
 * PDF instead of showing it on screen.
 */
describe('Contributions', () => {
  let fixture: ComponentFixture<Contributions>;
  let component: Contributions;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contributions],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Contributions);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(request => request.url.endsWith('/committee/contributions')).flush([]);
  });

  afterEach(() => httpMock.verify());

  it('lists each contribution once as a card, without the duplicate table', () => {
    component.rows.set([cashContribution(), upiContribution()]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('table').length).toBe(0);

    const cards = element.querySelectorAll('article.contribution-card');
    expect(cards.length).toBe(2);
    const cardText = cards[0].textContent ?? '';
    expect(cardText).toContain('Raju');
    expect(cardText).toContain('Bapureddy');
    expect(cardText.split('Raju').length - 1).toBe(1);
  });

  it('offers a Download Report button that prints the visible contributions', () => {
    component.rows.set([cashContribution(), upiContribution()]);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.toolbar button') as HTMLButtonElement;
    expect(button.textContent).toContain('Download Report');
    expect(button.disabled).toBe(false);

    const report = component.reportOptions(new Date('2026-09-22T09:30:00'));
    expect(report.columns.map(column => column.header)).toEqual(['Date', 'Contributor', 'Method', 'Paid To', 'Amount']);
    expect(report.rows.length).toBe(2);
    expect(report.rows[0].cells).toEqual(['21/09/2026', 'Raju', 'CASH', 'Bapureddy', 'Rs.1,116']);
    expect(report.rows[1].cells).toEqual(['22/09/2026', 'LP', 'UPI', 'View', 'Rs.2,000']);
    expect(report.rows[1].links?.[3]).toBe('http://localhost:8080/uploads/upi-receipt.jpg');
    expect(report.highlights).toEqual([
      { label: 'Cash', value: 'Rs.1,116' },
      { label: 'UPI', value: 'Rs.2,000' },
      { label: 'Bank Transfer', value: 'Rs.0' }
    ]);
    expect(report.footer?.[0]).toBe('Total');
    expect(report.footer?.[4]).toBe('Rs.3,116');
  });

  it('keeps the Download Report button disabled until contributions arrive', () => {
    const button = fixture.nativeElement.querySelector('.toolbar button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  /** A cash contribution, as GET /committee/contributions returns it. */
  function cashContribution(): Contribution {
    return {
      id: 1,
      contributorName: 'Raju',
      amount: 1116,
      paymentMethod: 'CASH',
      paidTo: 'Bapureddy',
      paymentDate: '2026-09-21',
      status: 'PAID'
    };
  }

  /** A UPI contribution that carries the uploaded payment screenshot as proof. */
  function upiContribution(): Contribution {
    return {
      id: 2,
      contributorName: 'LP',
      amount: 2000,
      paymentMethod: 'UPI',
      paymentProofPath: '/uploads/upi-receipt.jpg',
      paymentDate: '2026-09-22',
      status: 'PAID'
    };
  }
});

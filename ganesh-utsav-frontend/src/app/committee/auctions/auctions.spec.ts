import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auction } from '../../core/models/api-models';
import { Auctions } from './auctions';

/**
 * The committee records an auction before the money arrives, so an empty Amount Paid must not block
 * the save, and the money collected later has to show up as receipts under the auction.
 */
describe('Auctions', () => {
  let fixture: ComponentFixture<Auctions>;
  let component: Auctions;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auctions],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Auctions);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(request => request.url.endsWith('/committee/auctions')).flush([]);
  });

  afterEach(() => httpMock.verify());

  it('saves an auction even when Amount Paid is left empty', () => {
    component.form.patchValue({ auctionName: 'cloth', winnerName: 'Chandu', winningAmount: 23000 });
    component.form.controls.amountPaid.setValue(null as unknown as number);

    expect(component.form.valid).toBe(true);
    expect(component.statusPreview()).toBe('PENDING');

    component.save();

    const request = httpMock.expectOne(req => req.method === 'POST' && req.url.endsWith('/committee/auctions'));
    expect(request.request.body.amountPaid).toBe(0);
    request.flush({});
    httpMock.expectOne(req => req.method === 'GET' && req.url.endsWith('/committee/auctions')).flush([]);
  });

  it('prints every recorded receipt with its payment mode and proof below the auction', () => {
    component.rows.set([partlyPaidAuction()]);
    fixture.detectChanges();

    const historyRows = fixture.nativeElement.querySelectorAll('tr.history-row') as NodeListOf<HTMLTableRowElement>;
    expect(historyRows.length).toBe(1);
    expect(fixture.nativeElement.querySelector('button[title="Pay Amount"]')).toBeTruthy();

    const text = Array.from(historyRows, row => row.textContent ?? '').join(' ');
    expect(text).toContain('Payment history');
    expect(text).toContain('2 receipt(s)');
    expect(text).toContain('recorded by admin');
    expect(text).toContain('UPI');
    expect(text).toContain('paid to Committee');
    expect(text).toContain('First part');
    expect(text).toContain('Balance payment');
    expect(text).toContain('₹10,000');
    expect(historyRows[0].querySelector('a')?.getAttribute('href')).toContain('/uploads/upi-balance.jpg');
  });

  it('records the money received now from the Pay Amount dialog', () => {
    const row = partlyPaidAuction();
    component.rows.set([row]);
    fixture.detectChanges();

    component.openPay(row);
    fixture.detectChanges();

    // The dialog shows what is paid, what is being paid now and what stays pending.
    const dialog = fixture.nativeElement.querySelector('.modal-card') as HTMLElement;
    const dialogText = dialog.textContent ?? '';
    expect(dialogText).toContain('Amount paid till now');
    expect(dialogText).toContain('Amount paying now');
    expect(dialogText).toContain('Remaining balance after this payment');
    expect(dialogText).toContain('Update');
    expect(component.payForm.getRawValue().amount).toBe(3000);
    expect(component.payRemaining()).toBe(0);

    component.payForm.controls.amount.setValue(1000);
    component.updatePayRemaining();
    expect(component.payRemaining()).toBe(2000);

    component.payForm.controls.amount.setValue(4000);
    component.updatePayRemaining();
    component.submitPay();
    expect(component.payError()).toContain('cannot be more than the pending balance');

    component.payForm.controls.amount.setValue(3000);
    component.updatePayRemaining();
    component.payForm.controls.paymentMethod.setValue('UPI');
    fixture.detectChanges();
    expect(component.payCashPayment()).toBe(false);
    component.submitPay();
    expect(component.payError()).toContain('payment proof');

    // Cash asks who took the money: the proof photo is replaced by "Paid To".
    component.payForm.controls.paymentMethod.setValue('CASH');
    fixture.detectChanges();
    const cashDialog = fixture.nativeElement.querySelector('.modal-card') as HTMLElement;
    expect(component.payCashPayment()).toBe(true);
    expect(cashDialog.textContent).toContain('Paid To');
    expect(cashDialog.querySelector('input[type="file"]')).toBeNull();

    component.submitPay();
    expect(component.payError()).toContain('who the cash was paid to');

    component.payForm.controls.paidTo.setValue('Committee');
    component.submitPay();

    const request = httpMock.expectOne(req => req.method === 'POST' && req.url.endsWith('/committee/auctions/1/payments'));
    expect(request.request.body).toMatchObject({ amount: 3000, paymentMethod: 'CASH', paidTo: 'Committee', paymentDate: component.today });
    request.flush({});
    httpMock.expectOne(req => req.method === 'GET' && req.url.endsWith('/committee/auctions')).flush([]);
  });

  /** An auction with two receipts, exactly as GET /committee/auctions returns it. */
  function partlyPaidAuction(): Auction {
    return {
      id: 1,
      auctionName: 'cloth',
      winner: 'Chandu',
      winningAmount: 15000,
      amountPaid: 12000,
      balance: 3000,
      auctionDate: '2026-09-18',
      paymentStatus: 'PARTIAL',
      status: 'ACTIVE',
      payments: [
        { id: 5, auctionId: 1, amount: 2000, paymentDate: '2026-09-18', paymentMethod: 'CASH', paidTo: 'Committee', notes: 'First part', recordedBy: 'admin', createdAt: '2026-09-18T10:00:00Z' },
        { id: 6, auctionId: 1, amount: 10000, paymentDate: '2026-09-21', paymentMethod: 'UPI', paymentProofPath: '/uploads/upi-balance.jpg', notes: 'Balance payment', recordedBy: 'admin', createdAt: '2026-09-21T10:00:00Z' }
      ]
    };
  }
});

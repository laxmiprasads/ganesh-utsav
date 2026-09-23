import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auction } from '../../core/models/api-models';
import { PublicAuctions } from './public-auctions';

describe('PublicAuctions', () => {
  let fixture: ComponentFixture<PublicAuctions>;
  let component: PublicAuctions;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicAuctions],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicAuctions);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches public auctions and displays auction results with payment history', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.endsWith('/public/auctions'));
    req.flush([mockAuction()]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Coconut');
    expect(text).toContain('LP');
    expect(text).toContain('Payment history');
    expect(text).toContain('2 receipt(s)');
    expect(text).toContain('recorded by admin');
    expect(text).toContain('paid to BR');
    expect(text).toContain('CASH');
    expect(text).toContain('UPI');
    expect(text).toContain('₹10,000');
    expect(text).toContain('₹20,000');

    const proofLink = fixture.nativeElement.querySelector('a');
    expect(proofLink).toBeTruthy();
    expect(proofLink?.getAttribute('href')).toContain('/uploads/coconut-proof.jpg');
  });

  function mockAuction(): Auction {
    return {
      id: 1,
      auctionName: 'Coconut',
      winner: 'LP',
      flatNumber: 'A-201',
      winningAmount: 20000,
      amountPaid: 20000,
      balance: 0,
      auctionDate: '2026-09-21',
      paymentStatus: 'PAID',
      status: 'ACTIVE',
      payments: [
        { id: 101, auctionId: 1, amount: 10000, paymentDate: '2026-09-21', paymentMethod: 'CASH', paidTo: 'BR', recordedBy: 'admin', createdAt: '2026-09-21T10:00:00Z' },
        { id: 102, auctionId: 1, amount: 10000, paymentDate: '2026-09-21', paymentMethod: 'UPI', paymentProofPath: '/uploads/coconut-proof.jpg', recordedBy: 'admin', createdAt: '2026-09-21T11:00:00Z' }
      ]
    };
  }
});

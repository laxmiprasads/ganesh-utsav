import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardStats } from '../../core/models/api-models';
import { PublicDashboard } from './public-dashboard';

describe('PublicDashboard', () => {
  let fixture: ComponentFixture<PublicDashboard>;
  let component: PublicDashboard;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicDashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renders all 5 stat cards and 4 panels for public residents', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.endsWith('/public/dashboard'));
    req.flush(mockStats());
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    // Stat Cards
    expect(text).toContain('Contributions');
    expect(text).toContain('₹7,116');
    expect(text).toContain('Auction Money');
    expect(text).toContain('120,000');
    expect(text).toContain('Collected');
    expect(text).toContain('100,000');
    expect(text).toContain('Total Collected');
    expect(text).toContain('107,116');
    expect(text).toContain('Total Expenses');
    expect(text).toContain('₹35,000');
    expect(text).toContain('Balance');
    expect(text).toContain('₹72,116');

    // Panels
    expect(text).toContain('Recent Contributions');
    expect(text).toContain('Nari');
    expect(text).toContain('₹1,000');
    expect(text).toContain('Recent Expenses');
    expect(text).toContain('Sweets');
    expect(text).toContain('₹25,000');
    expect(text).toContain('Recent Auctions');
    expect(text).toContain('Small Laddu');
    expect(text).toContain('Anitha');
    expect(text).toContain('PARTIAL');
    expect(text).toContain('of ₹30,000 · ₹20,000 pending');

    const downloadBtn = fixture.nativeElement.querySelector('.heading-actions button') as HTMLButtonElement;
    expect(downloadBtn).toBeTruthy();
    expect(downloadBtn.textContent).toContain('Download Report');
    expect(downloadBtn.disabled).toBe(false);
  });

  function mockStats(): DashboardStats {
    return {
      contributionTotal: 7116,
      auctionWinningTotal: 120000,
      auctionTotal: 100000,
      totalCollected: 107116,
      expenseTotal: 35000,
      balance: 72116,
      auctionCount: 4,
      collectionVsExpenses: [
        { label: 'Contributions', value: 7116 },
        { label: 'Auctions', value: 100000 },
        { label: 'Expenses', value: 35000 }
      ],
      contributionsOverTime: [],
      expensesByCategory: [],
      auctionCollections: [],
      recentContributions: [
        { id: 1, contributorName: 'Nari', amount: 1000, paymentMethod: 'CASH', paymentDate: '2026-09-22', status: 'PAID' }
      ],
      recentExpenses: [
        { id: 1, description: 'Sweets', amount: 25000, expenseDate: '2026-09-22', status: 'ACTIVE' }
      ],
      recentAuctions: [
        { id: 1, auctionName: 'Small Laddu', winner: 'Anitha', winningAmount: 30000, amountPaid: 10000, balance: 20000, auctionDate: '2026-09-22', paymentStatus: 'PARTIAL', status: 'ACTIVE' }
      ]
    };
  }
});

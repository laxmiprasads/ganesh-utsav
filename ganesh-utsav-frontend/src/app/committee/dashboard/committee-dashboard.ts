import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { RefreshService } from '../../core/services/refresh.service';
import { DashboardStats } from '../../core/models/api-models';
import { dashboardReport } from '../../core/utils/dashboard-report';
import { downloadPdfReport } from '../../core/utils/pdf-report';

type StatCard = { label: string; value: number; note?: string; noteValue?: number };

@Component({
  selector: 'app-committee-dashboard',
  imports: [CurrencyPipe],
  template: `
    <section class="admin-heading">
      <div class="heading-content">
        <p class="eyebrow">Committee Dashboard</p>
        <h1>Financial Control Center</h1>
      </div>
      <div class="heading-actions">
        <button type="button" (click)="downloadReport()" [disabled]="!stats()">Download Report</button>
      </div>
    </section>
    @if (stats()) {
      <section class="stat-grid admin">
        @for (card of cards(); track card.label) {
          <article class="stat-card">
            <span>{{ card.label }}</span>
            <strong>{{ card.value | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
            @if (card.note) { <small>{{ card.note }} {{ card.noteValue | currency:'INR':'symbol':'1.0-0':'en-IN' }}</small> }
          </article>
        }
      </section>
      <section class="admin-grid">
        <article class="panel">
          <h2>Recent Contributions</h2>
          @for (row of stats()!.recentContributions; track row.id) {
            <p class="list-line">
              <span>{{ row.contributorName }}</span>
              <strong>{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
            </p>
          } @empty {
            <p class="empty">No recent contributions.</p>
          }
        </article>

        <article class="panel">
          <h2>Recent Expenses</h2>
          @for (row of stats()!.recentExpenses; track row.id) {
            <p class="list-line">
              <span>{{ row.description }}</span>
              <strong>{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
            </p>
          } @empty {
            <p class="empty">No recent expenses.</p>
          }
        </article>

        <article class="panel">
          <h2>Recent Auctions</h2>
          @for (row of stats()!.recentAuctions; track row.id) {
            <p class="list-line">
              <span><b>{{ row.auctionName }}</b> - {{ row.winner }} <span class="badge status-{{ (row.paymentStatus || '').toLowerCase() }}">{{ row.paymentStatus }}</span></span>
              <strong>
                <span>{{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                @if (row.balance > 0) {
                  <small>of {{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }} · {{ row.balance | currency:'INR':'symbol':'1.0-0':'en-IN' }} pending</small>
                }
              </strong>
            </p>
          } @empty {
            <p class="empty">No recent auctions.</p>
          }
        </article>
      </section>
    } @else {
      <div class="state">Loading dashboard...</div>
    }
  `
})
export class CommitteeDashboard implements OnInit {
  stats = signal<DashboardStats | null>(null);

  constructor(private api: ApiService, private refreshService: RefreshService) {
    this.refreshService.refresh$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.load();
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.committeeDashboard().subscribe(stats => this.stats.set(stats));
  }

  private datePipe = new DatePipe('en-IN');

  cards(): StatCard[] {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Contributions', value: s.contributionTotal },
      { label: 'Auction Money', value: s.auctionWinningTotal, note: 'Collected', noteValue: s.auctionTotal },
      { label: 'Total Collected', value: s.totalCollected },
      { label: 'Total Expenses', value: s.expenseTotal },
      { label: 'Balance', value: s.balance }
    ];
  }

  downloadReport() {
    const s = this.stats();
    if (!s) return;
    const generated = new Date();
    downloadPdfReport(`dashboard-report-${generated.toISOString().slice(0, 10)}.pdf`, dashboardReport(s, {
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    }));
  }
}

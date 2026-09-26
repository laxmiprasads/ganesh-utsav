import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../core/models/api-models';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RefreshService } from '../../core/services/refresh.service';

type StatCard = { label: string; value: number; note?: string; noteValue?: number };

@Component({
  selector: 'app-public-dashboard',
  imports: [CurrencyPipe],
  template: `
    <section class="page-heading festive">
      <div>
        <p class="eyebrow">Ganesh Utsav Management System 2026</p>
        <h1>Public Financial Dashboard</h1>
        <p>Transparent collections, expenses, balances, and auction results for colony residents.</p>
      </div>
    </section>

    @if (loading()) {
      <div class="state">Loading financial summary...</div>
    } @else if (error()) {
      <div class="state error">{{ error() }}</div>
    } @else if (stats()) {
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
              <span>{{ row.auctionName }} - {{ row.winner }} <span class="badge status-{{ (row.paymentStatus || '').toLowerCase() }}">{{ row.paymentStatus }}</span></span>
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
    }
  `
})
export class PublicDashboard implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal('');

  constructor(private api: ApiService, private refreshService: RefreshService) {
    this.refreshService.refresh$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.load();
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.publicDashboard().subscribe({
      next: stats => { this.stats.set(stats); this.loading.set(false); },
      error: () => { this.error.set('Unable to load dashboard. Please try again later.'); this.loading.set(false); }
    });
  }

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
}


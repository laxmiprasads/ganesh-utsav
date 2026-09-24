import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../core/models/api-models';

type StatCard = { label: string; value: number; note?: string; noteValue?: number };

@Component({
  selector: 'app-committee-dashboard',
  imports: [CurrencyPipe],
  template: `
    <section class="admin-heading">
      <div>
        <p class="eyebrow">Committee Dashboard</p>
        <h1>Financial Control Center</h1>
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
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.committeeDashboard().subscribe(stats => this.stats.set(stats)); }
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

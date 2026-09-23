import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Auction } from '../../core/models/api-models';
import { auctionReport } from '../../committee/auctions/auctions-report';
import { PdfReport, downloadPdfReport } from '../../core/utils/pdf-report';

@Component({
  selector: 'app-public-auctions',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <section class="page-heading">
      <p class="eyebrow">Public Register</p>
      <h1>Auction Results</h1>
      <p>Winning bidders, collected auction amounts, and the outstanding balance for festival offerings.</p>
    </section>

    <section class="panel">
      <div class="toolbar">
        <input [(ngModel)]="searchText" (ngModelChange)="filter()" placeholder="Search auctions">
        <button type="button" (click)="downloadReport()" [disabled]="!visible().length">Download Report</button>
      </div>

      <!-- Desktop Table View -->
      <div class="table-card flat desktop-only">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Auction</th>
              <th>Winner</th>
              <th>Status</th>
              <th class="num">Winning Amount</th>
              <th class="num">Amount Paid</th>
              <th class="num">Balance</th>
            </tr>
          </thead>
          <tbody>
            @for (row of visible(); track row.id) {
              <tr>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                    <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
                    <span class="card-date">{{ row.auctionDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                </td>
                <td>
                  <strong>{{ row.auctionName }}</strong>
                </td>
                <td>{{ row.winner }}</td>
                <td><span class="badge status-{{ row.paymentStatus.toLowerCase() }}">{{ row.paymentStatus }}</span></td>
                <td class="num">{{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
                <td class="num text-success">{{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
                <td class="num" [class.text-danger]="row.balance > 0">{{ row.balance | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              </tr>
              <tr class="history-row">
                <td colspan="7">
                  <div class="history">
                    <details class="history-details">
                      <summary class="history-summary">
                        <span class="history-summary-icon">▶</span>
                        <strong>Payment history</strong>
                        <span>{{ paymentsOf(row).length }} receipt(s) · {{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }} collected of {{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}@if (row.balance > 0) { · {{ row.balance | currency:'INR':'symbol':'1.0-0':'en-IN' }} pending }</span>
                      </summary>
                      <div class="history-content">
                        @for (payment of paymentsOf(row); track payment.id) {
                          <p class="list-line">
                            <span>
                              <span class="payment-date">{{ payment.paymentDate | date:'dd/MM/yyyy' }}</span>
                              <span class="badge method-{{ (payment.paymentMethod || '').toLowerCase() }}">{{ payment.paymentMethod || 'MODE NOT RECORDED' }}</span>
                              @if (payment.recordedBy || payment.paidTo || payment.notes) {
                                <small>{{ payment.recordedBy ? 'recorded by ' + payment.recordedBy : '' }}{{ payment.paidTo ? ' · paid to ' + payment.paidTo : '' }}{{ payment.notes ? ' · ' + payment.notes : '' }}</small>
                              }
                              @if (payment.paymentProofPath) {
                                <a [href]="proofLink(payment.paymentProofPath)" target="_blank" rel="noopener">Proof</a>
                              }
                            </span>
                            <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
                          </p>
                        } @empty {
                          <p class="history-empty">No receipt recorded yet.</p>
                        }
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">No auctions found.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="mobile-card-list mobile-only">
        @for (row of visible(); track row.id) {
          <article class="data-card auction-card">
            <div class="card-header-row">
              <strong>{{ row.auctionName }}</strong>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
                <span class="badge status-{{ row.paymentStatus.toLowerCase() }}">{{ row.paymentStatus }}</span>
              </div>
            </div>

            <div class="auction-winner-row">
              <div>
                <span class="winner-label">Winner:</span>
                <strong>{{ row.winner }}</strong>
                @if (row.flatNumber) { <span class="card-date"> ({{ row.flatNumber }})</span> }
              </div>
              <span class="card-date">{{ row.auctionDate | date:'dd/MM/yyyy' }}</span>
            </div>

            <div class="auction-metrics-grid">
              <div class="metric-cell">
                <span class="metric-label">Winning Bid</span>
                <span class="metric-value">{{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Paid</span>
                <span class="metric-value text-success">{{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
              </div>
              <div class="metric-cell">
                <span class="metric-label">Balance</span>
                <span class="metric-value" [class.text-danger]="row.balance > 0">{{ row.balance | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
              </div>
            </div>

            @if (paymentsOf(row).length > 0) {
              <div class="history" style="margin-top: 8px;">
                <details class="history-details">
                  <summary class="history-summary">
                    <span class="history-summary-icon">▶</span>
                    <strong>Payment history</strong>
                    <span>{{ paymentsOf(row).length }} receipt(s) · {{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }} collected of {{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}@if (row.balance > 0) { · {{ row.balance | currency:'INR':'symbol':'1.0-0':'en-IN' }} pending }</span>
                  </summary>
                  <div class="history-content">
                    @for (payment of paymentsOf(row); track payment.id) {
                      <p class="list-line">
                        <span>
                          <span class="payment-date">{{ payment.paymentDate | date:'dd MMM yyyy' }}</span>
                          <span class="badge method-{{ (payment.paymentMethod || '').toLowerCase() }}">{{ payment.paymentMethod || 'MODE NOT RECORDED' }}</span>
                          @if (payment.recordedBy || payment.paidTo || payment.notes) {
                            <small>{{ payment.recordedBy ? 'recorded by ' + payment.recordedBy : '' }}{{ payment.paidTo ? ' · paid to ' + payment.paidTo : '' }}{{ payment.notes ? ' · ' + payment.notes : '' }}</small>
                          }
                          @if (payment.paymentProofPath) {
                            <a [href]="proofLink(payment.paymentProofPath)" target="_blank" rel="noopener">Proof</a>
                          }
                        </span>
                        <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
                      </p>
                    }
                  </div>
                </details>
              </div>
            }
          </article>
        } @empty {
          <div class="state empty">No auctions found.</div>
        }
      </div>
    </section>
  `
})
export class PublicAuctions implements OnInit {
  private api = inject(ApiService);
  private readonly backend = 'http://localhost:8080';
  rows = signal<Auction[]>([]);
  visible = signal<Auction[]>([]);
  searchText = '';
  private datePipe = new DatePipe('en-IN');

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.publicAuctions({ search: this.searchText }).subscribe(rows => {
      this.rows.set(rows);
      this.filter();
    });
  }

  filter() {
    const search = this.searchText.toLowerCase();
    this.visible.set(this.rows().filter(row => !search || row.auctionName.toLowerCase().includes(search) || row.winner.toLowerCase().includes(search)));
  }

  /** Receipt ledger of an auction. */
  paymentsOf(row: Auction) { return row.payments ?? []; }

  /** Proof photos live on the backend, so their links are made absolute for the browser. */
  proofLink(path: string) { return path.startsWith('http') ? path : this.backend + path; }

  downloadReport() {
    const rows = this.visible();
    if (!rows.length) return;
    const generated = new Date();
    downloadPdfReport(`auctions-report-${generated.toISOString().slice(0, 10)}.pdf`, this.reportOptions(generated));
  }

  reportOptions(generated = new Date()): PdfReport {
    return auctionReport(this.visible(), {
      search: this.searchText,
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    });
  }
}

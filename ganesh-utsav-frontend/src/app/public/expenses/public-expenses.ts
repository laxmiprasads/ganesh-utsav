import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Expense } from '../../core/models/api-models';
import { expenseReport } from '../../committee/expenses/expenses-report';
import { PdfReport, downloadPdfReport } from '../../core/utils/pdf-report';

@Component({
  selector: 'app-public-expenses',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <section class="page-heading">
      <p class="eyebrow">Public Register</p>
      <h1>Expenses</h1>
      <p>Itemized colony festival expenditures and download reports.</p>
    </section>

    <section class="panel">
      <div class="toolbar">
        <input [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search expenses">
        <button type="button" (click)="downloadReport()" [disabled]="!rows().length">Download Report</button>
      </div>

      <!-- Desktop Table View -->
      <div class="table-card flat desktop-only">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Occasion</th>
              <th>Description</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <td>{{ row.expenseDate | date:'dd MMM yyyy' }}</td>
                <td><span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span></td>
                <td>{{ row.description }}</td>
                <td class="num">{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="empty">No expenses found.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="mobile-card-list mobile-only">
        @for (row of rows(); track row.id) {
          <article class="data-card expense-card">
            <div class="card-header-row">
              <span class="card-date">{{ row.expenseDate | date:'dd MMM yyyy' }}</span>
              <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
            </div>
            <p class="card-desc">{{ row.description }}</p>
            <div class="card-footer-row">
              <span class="card-date">Amount</span>
              <span class="card-amount expense">{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
            </div>
          </article>
        } @empty {
          <div class="state empty">No expenses found.</div>
        }
      </div>
    </section>
  `
})
export class PublicExpenses implements OnInit {
  private api = inject(ApiService);
  rows = signal<Expense[]>([]);
  search = '';
  private datePipe = new DatePipe('en-IN');

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.publicExpenses({ search: this.search }).subscribe(rows => this.rows.set(rows));
  }

  downloadReport() {
    const rows = this.rows();
    if (!rows.length) return;
    const generated = new Date();
    downloadPdfReport(`expenses-report-${generated.toISOString().slice(0, 10)}.pdf`, this.reportOptions(generated));
  }

  reportOptions(generated = new Date()): PdfReport {
    return expenseReport(this.rows(), {
      search: this.search,
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    });
  }
}

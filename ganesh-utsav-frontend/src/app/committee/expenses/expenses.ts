import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Expense } from '../../core/models/api-models';
import { expenseReport } from './expenses-report';
import { PdfReport, downloadPdfReport } from '../../core/utils/pdf-report';

@Component({
  selector: 'app-expenses',
  imports: [CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule],
  template: `
    <section class="admin-heading"><div><p class="eyebrow">Expense Management</p><h1>Expenses</h1></div></section>
    <section class="editor-grid">
      <form class="panel form-panel" [formGroup]="form" (ngSubmit)="save()">
        <h2>Add Expense</h2>
        <label>Occasion
          <select formControlName="occasion">
            <option value="Ganesh Chaturthi">Ganesh Chaturthi</option>
            <option value="Durga Matha Navaratri">Durga Matha Navaratri</option>
          </select>
        </label>
        <label>Description <input formControlName="description"></label>
        <label>Amount <input type="number" formControlName="amount"></label>
        <label>Date <input type="date" formControlName="expenseDate"></label>
        <label>Notes <textarea formControlName="notes"></textarea></label>
        @if (error()) { <div class="state error compact">{{ error() }}</div> }
        <div class="actions"><button class="primary" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving...' : 'Save' }}</button><button type="button" (click)="reset()">Clear</button></div>
      </form>
      <section class="panel">
        <div class="toolbar">
          <input [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search expenses">
          <button type="button" (click)="downloadReport()" [disabled]="!rows().length">Download Report</button>
        </div>
        <!-- Desktop Table View -->
        <div class="table-card flat desktop-only"><table><thead><tr><th>Date</th><th>Occasion</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>
          @for (row of rows(); track row.id) {
            <tr>
              <td>{{ row.expenseDate | date:'dd MMM yyyy' }}</td>
              <td><span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span></td>
              <td>
                <div class="expense-desc-group">
                  <span>{{ row.description }}</span>
                  @if (row.createdBy) {
                    <span class="recorded-by-tag">recorded by {{ row.createdBy }}</span>
                  }
                </div>
              </td>
              <td class="num">{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
            </tr>
          } @empty { <tr><td colspan="4" class="empty">No expenses found.</td></tr> }
        </tbody></table></div>

        <!-- Mobile Card View -->
        <div class="mobile-card-list mobile-only">
          @for (row of rows(); track row.id) {
            <article class="data-card expense-card">
              <div class="card-header-row">
                <span class="card-date">{{ row.expenseDate | date:'dd MMM yyyy' }}</span>
                <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
              </div>
              <div class="expense-desc-group">
                <p class="card-desc">{{ row.description }}</p>
                @if (row.createdBy) {
                  <span class="recorded-by-tag">recorded by {{ row.createdBy }}</span>
                }
              </div>
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
    </section>
  `
})
export class Expenses implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  rows = signal<Expense[]>([]);
  saving = signal(false);
  error = signal('');
  search = '';
  private datePipe = new DatePipe('en-IN');

  form = this.fb.nonNullable.group({
    occasion: ['Ganesh Chaturthi', Validators.required],
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    expenseDate: [new Date().toISOString().slice(0, 10), Validators.required],
    notes: ['']
  });

  ngOnInit() { this.load(); }
  load() { this.api.expenses({ search: this.search }).subscribe(rows => this.rows.set(rows)); }

  /** Saves the visible expenses as a downloadable PDF report. */
  downloadReport() {
    const rows = this.rows();
    if (!rows.length) return;
    const generated = new Date();
    downloadPdfReport(`expenses-report-${generated.toISOString().slice(0, 10)}.pdf`, this.reportOptions(generated));
  }

  /** Builds the PDF report configuration from current visible expenses. */
  reportOptions(generated = new Date()): PdfReport {
    return expenseReport(this.rows(), {
      search: this.search,
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    });
  }

  save() {
    if (this.form.invalid || this.saving()) return;
    this.error.set('');
    this.saving.set(true);
    const value = this.form.getRawValue();

    this.api.saveExpense({
      occasion: value.occasion,
      description: value.description,
      amount: value.amount,
      expenseDate: value.expenseDate,
      notes: value.notes,
      status: 'ACTIVE'
    }).subscribe({
      next: () => { this.saving.set(false); this.reset(); this.load(); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.saveError(err));
      }
    });
  }

  reset() {
    this.form.reset({ occasion: 'Ganesh Chaturthi', description: '', amount: 0, expenseDate: new Date().toISOString().slice(0, 10), notes: '' });
    this.error.set('');
  }

  private saveError(err: unknown, fallback = 'Could not save the expense.') {
    console.error('Request failed', err);
    const status = (err as { status?: number })?.status;
    const backendMessage = (err as { error?: { message?: string } })?.error?.message;
    if (status === 0) return 'Backend is not reachable at http://localhost:8080. Start the backend and retry.';
    if (status === 401 || status === 403) return 'Your login expired. Please log in again.';
    return backendMessage || fallback;
  }
}

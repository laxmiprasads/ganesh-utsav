import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Contribution } from '../../core/models/api-models';
import { contributionReport } from './contributions-report';
import { PdfReport, downloadPdfReport } from '../../core/utils/pdf-report';

@Component({
  selector: 'app-contributions',
  imports: [CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule],
  template: `
    <section class="admin-heading"><div><p class="eyebrow">Contribution Management</p><h1>Contributions</h1></div></section>
    <section class="editor-grid">
      <form class="panel form-panel" [formGroup]="form" (ngSubmit)="save()">
        <h2>Add Contribution</h2>
        <label>Contributor Name <input formControlName="contributorName" placeholder="Contributor name"></label>
        <label>Flat Number <input formControlName="flatNumber" placeholder="Flat number (optional)"></label>
        <label>Occasion <select formControlName="occasion"><option value="Ganesh Chaturthi">Ganesh Chaturthi</option><option value="Durga Matha Navaratri">Durga Matha Navaratri</option></select></label>
        <label>Amount <input type="number" formControlName="amount"></label>
        <label>Payment Method <select formControlName="paymentMethod" (ngModelChange)="onMethodChange($event)"><option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>OTHER</option></select></label>
        <label>Paid To <input formControlName="paidTo" placeholder="Receiver name"></label>
        <label>Payment Date <input type="date" formControlName="paymentDate"></label>
        <label>Notes <textarea formControlName="notes"></textarea></label>
        @if (error()) { <div class="state error compact">{{ error() }}</div> }
        <div class="actions"><button class="primary" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving...' : 'Save' }}</button><button type="button" (click)="reset()">Clear</button></div>
      </form>
      <section class="panel">
        <div class="toolbar">
          <input [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search contributions">
          <button type="button" (click)="downloadReport()" [disabled]="!rows().length">Download Report</button>
        </div>

        <!-- One card per contribution: the same list is used on every screen size -->
        <div class="mobile-card-list">
          @for (row of rows(); track row.id) {
            <article class="data-card contribution-card">
              <div class="card-avatar">{{ row.contributorName.charAt(0).toUpperCase() }}</div>
              <div class="card-main">
                <div class="card-title-row">
                  <div class="contributor-title-group">
                    <strong>{{ row.contributorName }}</strong>
                    @if (row.createdBy) {
                      <span class="recorded-by-tag">recorded by {{ row.createdBy }}</span>
                    }
                  </div>
                  <div class="card-right">
                    <span class="card-amount">{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                    <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
                  </div>
                </div>
                <div class="card-meta">
                  <span class="card-date">{{ row.paymentDate | date:'dd MMM yyyy' }}</span>
                  <span class="badge method-{{ (row.paymentMethod || '').toLowerCase() }}">{{ row.paymentMethod }}</span>
                  @if (row.flatNumber) {
                    <span class="card-date">Flat: {{ row.flatNumber }}</span>
                  }
                  @if (row.paidTo) {
                    <span class="card-date">Paid to: {{ row.paidTo }}</span>
                  }
                  @if (row.paymentProofPath) {
                    <a [href]="fileLink(row.paymentProofPath)" target="_blank" rel="noopener" class="badge">View Proof</a>
                  }
                </div>
              </div>
            </article>
          } @empty {
            <div class="state empty">No contributions found.</div>
          }
        </div>
      </section>
    </section>
  `
})
export class Contributions implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private readonly backend = 'http://localhost:8080';
  rows = signal<Contribution[]>([]);
  paymentMethod = signal('CASH');
  saving = signal(false);
  error = signal('');
  search = '';
  private datePipe = new DatePipe('en-IN');

  form = this.fb.nonNullable.group({
    contributorName: ['', [Validators.required, Validators.minLength(2)]],
    flatNumber: [''],
    occasion: ['Ganesh Chaturthi', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['CASH', Validators.required],
    paidTo: ['', Validators.required],
    paymentDate: [new Date().toISOString().slice(0, 10), Validators.required],
    notes: ['']
  });

  ngOnInit() { this.load(); }
  load() { this.api.contributions({ search: this.search }).subscribe(rows => this.rows.set(rows)); }

  /** Saves the visible contributions as the table PDF the committee shares with the residents. */
  downloadReport() {
    const rows = this.rows();
    if (!rows.length) return;
    const generated = new Date();
    downloadPdfReport(`contributions-report-${generated.toISOString().slice(0, 10)}.pdf`, this.reportOptions(generated));
  }

  /** The data of the PDF report, built from the contributions currently on screen. */
  reportOptions(generated = new Date()): PdfReport {
    return contributionReport(this.rows(), {
      backend: this.backend,
      search: this.search,
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    });
  }

  onMethodChange(method: string) {
    this.paymentMethod.set(method);
    this.error.set('');
  }

  fileLink(path: string) { return path.startsWith('http') ? path : this.backend + path; }

  save() {
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    if (!value.paidTo.trim()) {
      this.error.set('Please enter who the amount was paid to.');
      return;
    }
    this.error.set('');
    this.saving.set(true);

    this.api.saveContribution({
      contributorName: value.contributorName.trim(),
      flatNumber: value.flatNumber.trim() || undefined,
      occasion: value.occasion,
      amount: value.amount,
      paymentMethod: value.paymentMethod,
      paidTo: value.paidTo.trim(),
      paymentDate: value.paymentDate,
      status: 'PAID',
      notes: value.notes
    }).subscribe({
      next: () => { this.saving.set(false); this.reset(); this.load(); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.saveError(err));
      }
    });
  }

  reset() {
    this.form.reset({
      contributorName: '',
      flatNumber: '',
      occasion: 'Ganesh Chaturthi',
      amount: 0,
      paymentMethod: 'CASH',
      paidTo: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: ''
    });
    this.paymentMethod.set('CASH');
    this.error.set('');
  }

  private saveError(err: unknown, fallback = 'Could not save the contribution.') {
    console.error('Request failed', err);
    const status = (err as { status?: number })?.status;
    const backendMessage = (err as { error?: { message?: string } })?.error?.message;
    if (status === 0) return 'Backend is not reachable at http://localhost:8080. Start the backend and retry.';
    if (status === 401 || status === 403) return 'Your login expired. Please log in again.';
    return backendMessage || fallback;
  }
}

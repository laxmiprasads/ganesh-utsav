import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { RefreshService } from '../../core/services/refresh.service';
import { Auction, PaymentStatus } from '../../core/models/api-models';
import { auctionReport } from './auctions-report';
import { PdfReport, downloadPdfReport } from '../../core/utils/pdf-report';

/**
 * Auction dates are historical records, so today is the latest date the committee may pick.
 */
function notFutureDate(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  return value > new Date().toISOString().slice(0, 10) ? { futureDate: true } : null;
}

@Component({
  selector: 'app-auctions',
  imports: [CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule],
  template: `
    <section class="admin-heading"><div><p class="eyebrow">Auction Management</p><h1>Auctions</h1></div></section>
    <section class="editor-grid">
      <form class="panel form-panel" [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingId() ? 'Edit Auction' : 'Add Auction' }}</h2>
        <label>Occasion <span class="req">*</span>
          <select formControlName="occasion">
            <option value="Ganesh Chaturthi">Ganesh Chaturthi</option>
            <option value="Durga Matha Navaratri">Durga Matha Navaratri</option>
          </select>
        </label>
        <label>Auction Name <span class="req">*</span> <input formControlName="auctionName" placeholder="Auction item name"></label>
        <label>Winner Name <span class="req">*</span> <input formControlName="winnerName" placeholder="Winner name"></label>
        <label>Flat Number <input formControlName="flatNumber" placeholder="Flat number (optional)"></label>
        <label>Winning Amount <span class="req">*</span> <input type="number" formControlName="winningAmount"></label>
        <label>Amount Paid <input type="number" formControlName="amountPaid" placeholder="Leave blank when nothing is collected yet"></label> 
        <small>Payment status (auto): <strong class="badge">{{ statusPreview() }}</strong></small>
        @if (paidAmount() > 0) {
          <label>Payment Method <span class="req">*</span> <select formControlName="paymentMethod"><option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>OTHER</option></select></label>
          @if (formCashPayment()) {
            <label>Paid To <span class="req">*</span> <input formControlName="paidTo" placeholder="Receiver name"></label>
          } @else {
            <label>Payment Proof <input type="file" accept="image/*,.heic,.heif" (change)="onProofChange($event)"></label>
            @if (proofName()) { <small>Selected: {{ proofName() }}</small> }
          }
        }
        <label>Auction Date <span class="req">*</span> <input type="date" formControlName="auctionDate" [max]="today"></label>
        @if (form.controls.auctionDate.hasError('futureDate')) { <div class="state error compact">Auction date cannot be after today.</div> }
        <label>Notes <textarea formControlName="notes"></textarea></label>
        @if (error()) { <div class="state error compact">{{ error() }}</div> }
        <div class="actions"><button class="primary" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving...' : 'Save' }}</button><button type="button" (click)="reset()">Clear</button></div>
      </form>
      <section class="panel">
        <div class="toolbar">
          <input [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search auctions">
          <button type="button" (click)="downloadReport()" [disabled]="!rows().length">Download Report</button>
        </div>
        <!-- Desktop Table View -->
        <div class="table-card flat desktop-only"><table><thead><tr><th>Date</th><th>Auction</th><th>Winner</th><th>Status</th><th class="num">Winning Amount</th><th class="num">Amount Paid</th><th class="num">Balance</th><th></th></tr></thead><tbody>
          @for (row of rows(); track row.id) {
            <tr>
              <td>
                <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                  <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
                  <span class="card-date">{{ row.auctionDate | date:'dd/MM/yyyy' }}</span>
                </div>
              </td>
              <td>{{ row.auctionName }}</td>
              <td>{{ row.winner }}</td>
              <td><span class="badge status-{{ row.paymentStatus.toLowerCase() }}">{{ row.paymentStatus }}</span></td>
              <td class="num">{{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              <td class="num text-success">{{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              <td class="num" [class.text-danger]="row.balance > 0">{{ row.balance | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
              <td class="row-actions">
                @if (!isFullyPaid(row)) {
                  <div class="row-actions">
                    <button class="primary icon-btn" (click)="openPay(row)" title="Pay Amount" aria-label="Pay Amount">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    </button>
                    <button class="icon-btn" (click)="edit(row)" title="Edit" aria-label="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button class="icon-btn danger" (click)="deleteAuction(row)" title="Delete" aria-label="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                } @else {
                  <span class="badge">Settled</span>
                }
              </td>
            </tr>
            <tr class="history-row"><td colspan="8">
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
                      <p class="history-empty">No receipt recorded yet. Use Pay Amount above to record the money received.</p>
                    }
                  </div>
                </details>
              </div>
            </td></tr>
          } @empty { <tr><td colspan="8" class="empty">No auctions found.</td></tr> }
        </tbody></table></div>

        <!-- Mobile Card View -->
        <div class="mobile-card-list mobile-only">
          @for (row of rows(); track row.id) {
            <article class="data-card auction-card">
              <div class="card-header-row">
                <strong>{{ row.auctionName }}</strong>
                <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
                <span class="badge status-{{ row.paymentStatus.toLowerCase() }}">{{ row.paymentStatus }}</span>
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

              <div class="card-actions">
                @if (!isFullyPaid(row)) {
                  <button class="primary icon-btn" (click)="openPay(row)" title="Pay Amount" aria-label="Pay Amount">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                  </button>
                  <button class="icon-btn" (click)="edit(row)" title="Edit" aria-label="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button class="icon-btn danger" (click)="deleteAuction(row)" title="Delete" aria-label="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                } @else {
                  <span class="badge">Fully Settled</span>
                }
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
    </section>

    @if (payRow(); as row) {
      <div class="modal-backdrop" (click)="closePay()"></div>
      <form class="modal-card" [formGroup]="payForm" (ngSubmit)="submitPay()">
        <div class="modal-header">
          <h2>Pay Amount</h2>
          <button type="button" class="close-btn" (click)="closePay()" aria-label="Close">✕</button>
        </div>
        <p class="list-line"><span>{{ row.auctionName }} · {{ row.winner }}</span><strong>{{ row.winningAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }} won</strong></p>
        <p class="list-line"><span>Amount paid till now</span><strong>{{ row.amountPaid | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong></p>
        <label>Amount paying now <span class="req">*</span> <input type="number" formControlName="amount" (input)="updatePayRemaining()"></label>
        <p class="list-line"><span>Remaining balance after this payment</span><strong>{{ payRemaining() | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong></p>
        <label>Payment Method <span class="req">*</span> <select formControlName="paymentMethod"><option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>OTHER</option></select></label>
        @if (payCashPayment()) {
          <label>Paid To <span class="req">*</span> <input formControlName="paidTo" placeholder="Receiver name"></label>
        } @else {
          <label>Payment Proof <input type="file" accept="image/*,.heic,.heif" (change)="onPayProofChange($event)"></label>
          @if (payProofName()) { <small>Selected: {{ payProofName() }}</small> }
        }
        <label>Payment Date <span class="req">*</span> <input type="date" formControlName="paymentDate" [max]="today"></label>
        <label>Notes <textarea formControlName="notes"></textarea></label>
        @if (payError()) { <div class="state error compact">{{ payError() }}</div> }
        <div class="actions"><button class="primary" type="submit" [disabled]="payUploading()">{{ payUploading() ? 'Saving...' : 'Update' }}</button><button type="button" (click)="closePay()">Cancel</button></div>
      </form>
    }
  `
})
export class Auctions implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private refreshService = inject(RefreshService);
  rows = signal<Auction[]>([]);
  editingId = signal<number | undefined>(undefined);
  statusPreview = signal<PaymentStatus>('PENDING');
  saving = signal(false);
  error = signal('');
  proofName = signal('');
  /** Cash payments are tracked by receiver name instead of a proof photo. */
  formCashPayment = signal(true);
  payRow = signal<Auction | null>(null);
  payRemaining = signal(0);
  payError = signal('');
  payUploading = signal(false);
  payProofName = signal('');
  payCashPayment = signal(true);
  today = new Date().toISOString().slice(0, 10);
  search = '';
  private readonly backend = 'http://localhost:8080';
  private datePipe = new DatePipe('en-IN');
  private selectedFile: File | null = null;
  private payProof: File | null = null;
  private editingPaid = 0;
  form = this.fb.nonNullable.group({
    occasion: ['Ganesh Chaturthi', Validators.required],
    auctionName: ['', [Validators.required, Validators.minLength(2)]],
    winnerName: ['', [Validators.required, Validators.minLength(2)]],
    flatNumber: [''],
    winningAmount: [0, [Validators.required, Validators.min(0.01)]],
    /**
     * Optional on purpose: an empty box means nothing has been collected yet, which is a valid
     * PENDING auction, so the save button must stay enabled.
     */
    amountPaid: [0, [Validators.min(0)]],
    paymentMethod: ['CASH'],
    paidTo: [''],
    auctionDate: [new Date().toISOString().slice(0, 10), [Validators.required, notFutureDate]],
    notes: ['']
  });
  /** Opened by the Pay Amount button on a row to record one more receipt for that auction. */
  payForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['CASH'],
    paidTo: [''],
    paymentDate: [new Date().toISOString().slice(0, 10), [Validators.required, notFutureDate]],
    notes: ['']
  });

  constructor() {
    this.refreshService.refresh$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.load();
    });
  }

  ngOnInit() {
    this.refreshStatus();
    this.form.valueChanges.subscribe(() => {
      this.refreshStatus();
      this.formCashPayment.set(this.form.getRawValue().paymentMethod === 'CASH');
    });
    this.payForm.valueChanges.subscribe(() => this.payCashPayment.set(this.payForm.getRawValue().paymentMethod === 'CASH'));
    this.load();
  }
  /**
   * Mirrors the server rule so the committee sees the resulting status while typing:
   * nothing paid -> PENDING, part of the winning amount -> PARTIAL, full or extra -> PAID.
   */
  private refreshStatus() {
    const amountPaid = this.paidAmount();
    if (amountPaid <= 0) { this.statusPreview.set('PENDING'); return; }
    const winningAmount = Number(this.form.getRawValue().winningAmount) || 0;
    this.statusPreview.set(amountPaid >= winningAmount ? 'PAID' : 'PARTIAL');
  }
  /**
   * An empty Amount Paid box reaches the control as null, so it is sent as 0 and the auction is
   * stored as PENDING instead of blocking the save. Public because the template shows the payment
   * mode and proof fields as soon as money is being recorded.
   */
  paidAmount() {
    return Number(this.form.getRawValue().amountPaid) || 0;
  }
  load() { this.api.auctions({ search: this.search }).subscribe(rows => this.rows.set(rows)); }

  /** Saves the visible auctions as a downloadable PDF report. */
  downloadReport() {
    const rows = this.rows();
    if (!rows.length) return;
    const generated = new Date();
    downloadPdfReport(`auctions-report-${generated.toISOString().slice(0, 10)}.pdf`, this.reportOptions(generated));
  }

  /** The data of the PDF report, built from the auctions currently on screen. */
  reportOptions(generated = new Date()): PdfReport {
    return auctionReport(this.rows(), {
      search: this.search,
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    });
  }

  /** Receipt ledger of an auction; older responses may not carry it yet, so it is normalised here. */
  paymentsOf(row: Auction) { return row.payments ?? []; }
  /** Proof photos live on the backend, so their links are made absolute for the browser. */
  proofLink(path: string) { return path.startsWith('http') ? path : this.backend + path; }
  /**
   * The API returns the winner as `winner`, while the form control is `winnerName`,
   * so the row is mapped explicitly (patching the row directly left the name blank and
   * kept the form invalid, which blocked saving a balance payment).
   */
  edit(row: Auction) {
    this.editingId.set(row.id);
    this.editingPaid = row.amountPaid ?? 0;
    this.form.patchValue({
      occasion: row.occasion || 'Ganesh Chaturthi',
      auctionName: row.auctionName,
      winnerName: row.winner,
      flatNumber: row.flatNumber ?? '',
      winningAmount: row.winningAmount,
      amountPaid: row.amountPaid ?? 0,
      auctionDate: row.auctionDate,
      notes: row.notes ?? ''
    });
    this.refreshStatus();
  }
  /**
   * Amount Paid is the total collected so far: the money added here is stored by the server as its
   * own receipt, together with the payment mode and the proof photo.
   */
  save() {
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    const amountPaid = this.paidAmount();
    const collectedNow = amountPaid - (this.editingId() ? this.editingPaid : 0);
    if (collectedNow > 0) {
      // Cash money is traced by who received it; UPI and bank transfers keep a proof photo.
      if (value.paymentMethod === 'CASH' && !value.paidTo.trim()) {
        this.error.set('Please enter who the cash was paid to.');
        return;
      }
      if (this.proofRequired(value.paymentMethod) && !this.selectedFile) {
        this.error.set('Please attach the payment proof for UPI or bank transfer money.');
        return;
      }
    }
    this.error.set('');
    this.saving.set(true);
    const body = {
      occasion: value.occasion,
      auctionName: value.auctionName.trim(),
      winnerName: value.winnerName.trim(),
      flatNumber: value.flatNumber.trim() || undefined,
      winningAmount: value.winningAmount,
      amountPaid,
      auctionDate: value.auctionDate,
      paymentMethod: value.paymentMethod,
      paidTo: value.paymentMethod === 'CASH' ? value.paidTo.trim() || undefined : undefined,
      notes: value.notes
    };
    const send = (proof?: string) => {
      this.api.saveAuction({ ...body, paymentProofPath: proof }, this.editingId()).subscribe({
        next: () => { this.saving.set(false); this.reset(); this.load(); },
        error: err => { this.saving.set(false); this.error.set(this.requestError(err, 'Could not save the auction.')); }
      });
    };
    if (collectedNow > 0 && this.selectedFile) {
      this.api.uploadPhoto(this.selectedFile).subscribe({
        next: res => send(res.url),
        error: err => { this.saving.set(false); this.error.set(this.requestError(err)); }
      });
    } else {
      send(undefined);
    }
  }
  /** Opens the Pay Amount dialog, pre-filled with the balance that is still pending. */
  openPay(row: Auction) {
    this.payRow.set(row);
    this.payForm.reset({ amount: row.balance, paymentMethod: 'CASH', paymentDate: this.today, notes: '' });
    this.payError.set('');
    this.payProof = null;
    this.payProofName.set('');
    this.updatePayRemaining();
  }
  closePay() {
    this.payRow.set(null);
    this.payError.set('');
    this.payProof = null;
    this.payProofName.set('');
  }
  /** Keeps the balance shown in the dialog in step with the amount being paid now. */
  updatePayRemaining() {
    const paying = Number(this.payForm.getRawValue().amount) || 0;
    this.payRemaining.set(Math.max(0, (this.payRow()?.balance ?? 0) - paying));
  }
  /**
   * Records the money received now: the amount entered is added to the amount already collected,
   * stored as its own receipt with the payment mode, date and proof, and the balance goes down.
   */
  submitPay() {
    const row = this.payRow();
    if (!row || this.payUploading()) return;
    if (!this.payForm.valid) { this.payError.set('Enter the amount received now.'); return; }
    const value = this.payForm.getRawValue();
    const amount = Number(value.amount) || 0;
    if (amount > row.balance) {
      this.payError.set(`Amount cannot be more than the pending balance of ${row.balance}.`);
      return;
    }
    if (value.paymentMethod === 'CASH') {
      if (!value.paidTo.trim()) { this.payError.set('Please enter who the cash was paid to.'); return; }
    } else if (this.proofRequired(value.paymentMethod) && !this.payProof) {
      this.payError.set('Please attach the payment proof for UPI or bank transfer money.');
      return;
    }
    this.payError.set('');
    this.payUploading.set(true);
    const send = (proof?: string) => {
      this.api.addAuctionPayment(row.id, {
        amount,
        paymentMethod: value.paymentMethod,
        paidTo: value.paymentMethod === 'CASH' ? value.paidTo.trim() : undefined,
        paymentDate: value.paymentDate,
        paymentProofPath: proof,
        notes: value.notes.trim() || undefined
      }).subscribe({
        next: () => { this.payUploading.set(false); this.closePay(); this.load(); },
        error: err => { this.payUploading.set(false); this.payError.set(this.requestError(err, 'Could not save the payment.')); }
      });
    };
    if (this.payProof) {
      this.api.uploadPhoto(this.payProof).subscribe({
        next: res => send(res.url),
        error: err => { this.payUploading.set(false); this.payError.set(this.requestError(err)); }
      });
    } else {
      send(undefined);
    }
  }
  /** A fully collected auction is closed: no edits and no deletion. */
  isFullyPaid(row: Auction) { return row.paymentStatus === 'PAID'; }
  deleteAuction(row: Auction) { if (confirm(`Delete ${row.auctionName} auction?`)) this.api.deleteAuction(row.id).subscribe(() => this.load()); }
  onProofChange(event: Event) {
    this.selectedFile = this.readImage(event, message => this.error.set(message));
    this.proofName.set(this.selectedFile?.name ?? '');
  }
  onPayProofChange(event: Event) {
    this.payProof = this.readImage(event, message => this.payError.set(message));
    this.payProofName.set(this.payProof?.name ?? '');
  }
  /** Cash needs no screenshot; UPI and bank transfers keep a proof for the committee's records. */
  private proofRequired(method: string) { return method === 'UPI' || method === 'BANK_TRANSFER'; }
  private readImage(event: Event, onError: (message: string) => void) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return null;
    const isImage = (file.type && file.type.toLowerCase().startsWith('image/')) || /\.(png|jpe?g|webp|gif|heic|heif|bmp)$/i.test(file.name || '');
    if (isImage) return file;
    onError('Please choose an image file (PNG, JPG, WEBP, GIF, HEIC or BMP).');
    input.value = '';
    return null;
  }
  /** Mirrors the contributions screen so an upload or save failure explains itself. */
  private requestError(err: unknown, fallback = 'Photo upload failed. Please try again.') {
    console.error('Request failed', err);
    const status = (err as { status?: number })?.status;
    const backendMessage = (err as { error?: { message?: string } })?.error?.message;
    if (status === 0) return 'Backend is not reachable at http://localhost:8080. Start the backend and retry.';
    if (status === 401 || status === 403) return 'Your login expired. Please log in again, then retry.';
    if (status === 413) return 'Photo is too large. Please choose a smaller image.';
    if (status === 415) return 'Unsupported image format. Please upload a PNG or JPG photo.';
    return backendMessage || fallback;
  }
  reset() {
    this.editingId.set(undefined);
    this.editingPaid = 0;
    this.selectedFile = null;
    this.proofName.set('');
    this.error.set('');
    this.form.reset({ occasion: 'Ganesh Chaturthi', auctionName: '', winnerName: '', flatNumber: '', winningAmount: 0, amountPaid: 0, paymentMethod: 'CASH', paidTo: '', auctionDate: this.today, notes: '' });
    this.refreshStatus();
  }
}

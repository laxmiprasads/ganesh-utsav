import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Contribution } from '../../core/models/api-models';
import { contributionReport } from '../../committee/contributions/contributions-report';
import { PdfReport, downloadPdfReport } from '../../core/utils/pdf-report';

@Component({
  selector: 'app-public-contributions',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <section class="page-heading">
      <p class="eyebrow">Public Register</p>
      <h1>Contributions</h1>
      <p>Transparent festival contributions and collections made by colony residents.</p>
    </section>

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
                <strong>{{ row.contributorName }}</strong>
                <div class="card-right">
                  <span class="card-amount">{{ row.amount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</span>
                  <span class="badge occasion-badge">{{ row.occasion || 'Ganesh Chaturthi' }}</span>
                </div>
              </div>
              <div class="card-meta">
                <span class="card-date">{{ row.paymentDate | date:'dd MMM yyyy' }}</span>
                <span class="badge method-{{ (row.paymentMethod || '').toLowerCase() }}">{{ row.paymentMethod }}</span>
                @if (row.paidTo) {
                  <span>· Paid to {{ row.paidTo }}</span>
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
  `
})
export class PublicContributions implements OnInit {
  private api = inject(ApiService);
  private readonly backend = 'http://localhost:8080';
  rows = signal<Contribution[]>([]);
  search = '';
  private datePipe = new DatePipe('en-IN');

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.publicContributions({ search: this.search }).subscribe(rows => this.rows.set(rows));
  }

  downloadReport() {
    const rows = this.rows();
    if (!rows.length) return;
    const generated = new Date();
    downloadPdfReport(`contributions-report-${generated.toISOString().slice(0, 10)}.pdf`, this.reportOptions(generated));
  }

  reportOptions(generated = new Date()): PdfReport {
    return contributionReport(this.rows(), {
      backend: this.backend,
      search: this.search,
      generated,
      formatDate: (value, format) => this.datePipe.transform(value, format) ?? ''
    });
  }

  fileLink(path: string) {
    return path.startsWith('http') ? path : this.backend + path;
  }
}

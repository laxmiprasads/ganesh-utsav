import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RefreshService } from '../../core/services/refresh.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="public-app-root">
      <header class="public-header">
        <div class="public-header-brand-row">
          <a class="brand" routerLink="/">
            <span class="brand-mark">GU</span>
            <span>
              <strong>Ganesh Utsav 2026</strong>
              <small>Financial Transparency Portal</small>
            </span>
          </a>
          <button
            type="button"
            class="nav-refresh-btn mobile-header-refresh"
            [class.is-refreshing]="refreshService.isRefreshing()"
            (click)="refreshData()"
            title="Refresh Data"
            aria-label="Refresh Data">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
          <a routerLink="/contributions" routerLinkActive="active">Contributions</a>
          <a routerLink="/expenses" routerLinkActive="active">Expenses</a>
          <a routerLink="/auctions" routerLinkActive="active">Auctions</a>
          <button
            type="button"
            class="nav-refresh-btn desktop-header-refresh"
            [class.is-refreshing]="refreshService.isRefreshing()"
            (click)="refreshData()"
            title="Refresh Data"
            aria-label="Refresh Data">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Refresh</span>
          </button>
        </nav>
      </header>
      <main class="public-shell">
        <router-outlet></router-outlet>
      </main>
      <footer class="app-footer">
        <div class="footer-container">
          <p class="footer-copy">© 2026 Ganesh Utsav Committee. All rights reserved.</p>
          <p class="footer-dev">
            Powered & Developed by <strong class="company-name">Gen Tech Software solutions</strong>
          </p>
        </div>
      </footer>
    </div>
  `
})
export class PublicLayout {
  refreshService = inject(RefreshService);

  refreshData() {
    this.refreshService.triggerRefresh();
  }
}

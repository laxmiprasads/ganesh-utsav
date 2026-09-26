import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RefreshService } from '../../core/services/refresh.service';

@Component({
  selector: 'app-committee-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="admin-brand">
          <div class="admin-brand-left">
            <img src="/logo-admin.png" alt="Committee Logo" class="brand-logo admin">
            <strong>Committee</strong>
          </div>
          <button
            type="button"
            class="nav-refresh-btn mobile-sidebar-refresh"
            [class.is-refreshing]="refreshService.isRefreshing()"
            (click)="refreshData()"
            title="Refresh Data"
            aria-label="Refresh Data">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        <nav>
          <a routerLink="/committee/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/committee/contributions" routerLinkActive="active">Contributions</a>
          <a routerLink="/committee/expenses" routerLinkActive="active">Expenses</a>
          <a routerLink="/committee/auctions" routerLinkActive="active">Auctions</a>
        </nav>
        <button type="button" class="ghost" (click)="auth.logout()">Logout</button>
      </aside>
      <section class="admin-main">
        <header class="admin-topbar">
          <div class="admin-topbar-info">
            <strong>Ganesh Utsav Management System 2026</strong>
            <small>Signed in as {{ auth.username() }}</small>
          </div>
          <div class="admin-topbar-actions">
            <button
              type="button"
              class="nav-refresh-btn desktop-topbar-refresh"
              [class.is-refreshing]="refreshService.isRefreshing()"
              (click)="refreshData()"
              title="Refresh Data"
              aria-label="Refresh Data">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Refresh</span>
            </button>
            <a routerLink="/" class="public-view-link">Public View</a>
          </div>
        </header>
        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
        <footer class="admin-footer">
          <div class="footer-container">
            <p class="footer-copy">© 2026 Ganesh Utsav Management System</p>
            <p class="footer-dev">
              Powered & Developed by <strong class="company-name">Gen-Tech Software Solutions</strong>
            </p>
          </div>
        </footer>
      </section>
    </div>
  `
})
export class CommitteeLayout {
  refreshService = inject(RefreshService);
  constructor(public auth: AuthService) {}

  refreshData() {
    this.refreshService.triggerRefresh();
  }
}

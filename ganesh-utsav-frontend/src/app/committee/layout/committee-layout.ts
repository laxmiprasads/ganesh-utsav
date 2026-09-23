import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-committee-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="admin-brand">
          <span class="brand-mark dark">GU</span>
          <strong>Committee</strong>
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
          <div>
            <strong>Ganesh Utsav Management System 2026</strong>
            <small>Signed in as {{ auth.username() }}</small>
          </div>
          <a routerLink="/">Public View</a>
        </header>
        <router-outlet></router-outlet>
      </section>
    </div>
  `
})
export class CommitteeLayout {
  constructor(public auth: AuthService) {}
}

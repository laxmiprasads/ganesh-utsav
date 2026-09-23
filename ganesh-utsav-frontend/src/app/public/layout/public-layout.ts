import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="public-header">
      <a class="brand" routerLink="/">
        <span class="brand-mark">GU</span>
        <span>
          <strong>Ganesh Utsav 2026</strong>
          <small>Financial Transparency Portal</small>
        </span>
      </a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
        <a routerLink="/contributions" routerLinkActive="active">Contributions</a>
        <a routerLink="/expenses" routerLinkActive="active">Expenses</a>
        <a routerLink="/auctions" routerLinkActive="active">Auctions</a>
      </nav>
    </header>
    <main class="public-shell">
      <router-outlet></router-outlet>
    </main>
  `
})
export class PublicLayout {}

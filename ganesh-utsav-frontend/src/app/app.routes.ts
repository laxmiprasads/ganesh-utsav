import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public/layout/public-layout').then(m => m.PublicLayout),
    children: [
      { path: '', loadComponent: () => import('./public/dashboard/public-dashboard').then(m => m.PublicDashboard) },
      { path: 'contributions', loadComponent: () => import('./public/contributions/public-contributions').then(m => m.PublicContributions) },
      { path: 'expenses', loadComponent: () => import('./public/expenses/public-expenses').then(m => m.PublicExpenses) },
      { path: 'auctions', loadComponent: () => import('./public/auctions/public-auctions').then(m => m.PublicAuctions) }
    ]
  },
  { path: 'committee/login', loadComponent: () => import('./committee/login/login').then(m => m.Login) },
  {
    path: 'committee',
    loadComponent: () => import('./committee/layout/committee-layout').then(m => m.CommitteeLayout),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./committee/dashboard/committee-dashboard').then(m => m.CommitteeDashboard) },
      { path: 'contributions', loadComponent: () => import('./committee/contributions/contributions').then(m => m.Contributions) },
      { path: 'expenses', loadComponent: () => import('./committee/expenses/expenses').then(m => m.Expenses) },
      { path: 'auctions', loadComponent: () => import('./committee/auctions/auctions').then(m => m.Auctions) }
    ]
  },
  { path: '**', redirectTo: '' }
];

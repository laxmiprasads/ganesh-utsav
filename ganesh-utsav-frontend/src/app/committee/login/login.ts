import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="login-page">
      <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
        <a routerLink="/" class="back-link">← Back to Public Dashboard</a>
        <p class="eyebrow">Committee Portal</p>
        <h1>Sign In</h1>
        <label>Username <input formControlName="username" autocomplete="username" placeholder="Enter username"></label>
        <label>
          Password
          <div class="password-wrapper">
            <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Enter password">
            <button type="button" class="toggle-password" (click)="toggleShowPassword()" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'" [title]="showPassword() ? 'Hide password' : 'Show password'">
              @if (showPassword()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              }
            </button>
          </div>
        </label>
        @if (error()) { <div class="state error compact">{{ error() }}</div> }
        <button class="primary" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in...' : 'Sign In to Committee' }}</button>
      </form>
    </main>
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);
  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  toggleShowPassword() {
    this.showPassword.update(v => !v);
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.value.username ?? '', this.form.value.password ?? '').subscribe({
      next: () => this.router.navigateByUrl('/committee/dashboard'),
      error: () => { this.error.set('Invalid username or password.'); this.loading.set(false); }
    });
  }
}

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
        <label>Username <input formControlName="username" autocomplete="username"></label>
        <label>Password <input formControlName="password" type="password" autocomplete="current-password"></label>
        @if (error()) { <div class="state error compact">{{ error() }}</div> }
        <button class="primary" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in...' : 'Sign In to Committee' }}</button>
        <small>Development credentials: admin / Admin&#64;123. Update before production.</small>
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
  form = this.fb.nonNullable.group({
    username: ['admin', Validators.required],
    password: ['Admin@123', Validators.required]
  });

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

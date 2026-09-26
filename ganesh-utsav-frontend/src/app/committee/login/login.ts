import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="login-page">
      <div class="auth-wrapper" [class.single]="!allowSignup">
        <div class="auth-topbar">
          <a routerLink="/" class="back-link">← Back to Public Portal</a>
        </div>

        <div class="auth-grid" [class.dual]="allowSignup" [class.single]="!allowSignup">
          <!-- Sign In Card -->
          <form class="auth-card" [formGroup]="loginForm" (ngSubmit)="submitLogin()">
            <div class="card-header-group">
              <p class="eyebrow">Committee Portal</p>
              <h1>Sign In</h1>
              <p class="subtext">Sign in with your credentials to manage festival activities.</p>
            </div>

            <label>
              Username
              <input formControlName="username" autocomplete="username" placeholder="Enter username">
            </label>

            <label>
              Password
              <div class="password-wrapper">
                <input
                  [type]="showLoginPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="Enter password">
                <button
                  type="button"
                  class="toggle-password"
                  (click)="toggleLoginPassword()"
                  [attr.aria-label]="showLoginPassword() ? 'Hide password' : 'Show password'"
                  [title]="showLoginPassword() ? 'Hide password' : 'Show password'">
                  @if (showLoginPassword()) {
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

            @if (loginError()) {
              <div class="state error compact">{{ loginError() }}</div>
            }

            <button class="primary" type="submit" [disabled]="loginForm.invalid || loginLoading()">
              {{ loginLoading() ? 'Signing in...' : 'Sign In to Committee' }}
            </button>
          </form>

          <!-- Sign Up Card (Controlled strictly by code flag allowSignup) -->
          @if (allowSignup) {
            <form class="auth-card signup-card" [formGroup]="signupForm" (ngSubmit)="submitSignup()">
              <div class="card-header-group">
                <p class="eyebrow" style="color: var(--gold);">New Registration</p>
                <h2>Sign Up Member</h2>
                <p class="subtext">Create an account for a new committee member to access the admin portal.</p>
              </div>

              @if (signupSuccess()) {
                <div class="state success">
                  {{ signupSuccess() }}
                </div>
              }

              <label>
                New Username
                <input formControlName="username" autocomplete="new-username" placeholder="Choose username (min 3 chars)">
              </label>

              <label>
                Password
                <div class="password-wrapper">
                  <input
                    [type]="showSignupPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="new-password"
                    placeholder="Create password (min 6 chars)">
                  <button
                    type="button"
                    class="toggle-password"
                    (click)="toggleSignupPassword()"
                    [attr.aria-label]="showSignupPassword() ? 'Hide password' : 'Show password'"
                    [title]="showSignupPassword() ? 'Hide password' : 'Show password'">
                    @if (showSignupPassword()) {
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

              <label>
                Confirm Password
                <div class="password-wrapper">
                  <input
                    [type]="showSignupConfirmPassword() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    placeholder="Re-enter password">
                  <button
                    type="button"
                    class="toggle-password"
                    (click)="toggleSignupConfirmPassword()"
                    [attr.aria-label]="showSignupConfirmPassword() ? 'Hide password' : 'Show password'"
                    [title]="showSignupConfirmPassword() ? 'Hide password' : 'Show password'">
                    @if (showSignupConfirmPassword()) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </label>

              @if (signupError()) {
                <div class="state error compact">{{ signupError() }}</div>
              }

              <button class="primary" type="submit" [disabled]="signupForm.invalid || signupLoading()">
                {{ signupLoading() ? 'Registering...' : 'Register Committee Account' }}
              </button>
            </form>
          }
        </div>
      </div>
    </main>
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  /**
   * CODE-LEVEL FLAG:
   * Set `allowSignup = true` to enable and display the Sign Up form beside the Sign In form.
   * Set `allowSignup = false` to hide and completely disable the Sign Up form from the UI.
   */
  readonly allowSignup: boolean = true;

  // Visibility states for password fields
  showLoginPassword = signal(false);
  showSignupPassword = signal(false);
  showSignupConfirmPassword = signal(false);

  // Login form state
  loginLoading = signal(false);
  loginError = signal('');
  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  // Sign Up form state
  signupLoading = signal(false);
  signupError = signal('');
  signupSuccess = signal('');
  signupForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  toggleLoginPassword() {
    this.showLoginPassword.update(v => !v);
  }

  toggleSignupPassword() {
    this.showSignupPassword.update(v => !v);
  }

  toggleSignupConfirmPassword() {
    this.showSignupConfirmPassword.update(v => !v);
  }

  submitLogin() {
    if (this.loginForm.invalid) return;
    this.loginLoading.set(true);
    this.loginError.set('');
    this.auth.login(this.loginForm.value.username ?? '', this.loginForm.value.password ?? '').subscribe({
      next: () => this.router.navigateByUrl('/committee/dashboard'),
      error: () => {
        this.loginError.set('Invalid username or password.');
        this.loginLoading.set(false);
      }
    });
  }

  submitSignup() {
    if (this.signupForm.invalid || !this.allowSignup) return;
    const { username, password, confirmPassword } = this.signupForm.getRawValue();

    if (password !== confirmPassword) {
      this.signupError.set('Passwords do not match. Please verify.');
      return;
    }

    this.signupLoading.set(true);
    this.signupError.set('');
    this.signupSuccess.set('');

    this.auth.register(username.trim(), password).subscribe({
      next: (res) => {
        this.signupLoading.set(false);
        this.signupSuccess.set(res?.message || 'Registration successful! You can now sign in.');
        this.loginForm.patchValue({ username: username.trim(), password: '' });
        this.signupForm.reset();
      },
      error: (err) => {
        this.signupLoading.set(false);
        const message = err?.error?.message || 'Failed to create account. Please try again.';
        this.signupError.set(message);
      }
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="login-page">
      <div class="auth-wrapper" [class.single]="!showSignupForm()">
        <div class="auth-topbar">
          <a routerLink="/" class="back-link">← Back to Public Portal</a>
        </div>

        <div class="auth-grid" [class.dual]="showSignupForm()" [class.single]="!showSignupForm()">
          <!-- Sign In Card -->
          <form class="auth-card" [formGroup]="loginForm" (ngSubmit)="submitLogin()">
            <div class="card-header-group">
              <p class="eyebrow">Committee Portal</p>
              <h1>Sign In</h1>
              <p class="subtext">Sign in with your credentials to manage festival activities.</p>
            </div>

            @if (loginSuccess()) {
              <div class="state success compact">{{ loginSuccess() }}</div>
            }

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" x2="22" y1="2" y2="22"></line>
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
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

            @if (allowSignup && !showSignupForm()) {
              <p class="auth-switch-note">
                Need to add a member?
                <button type="button" class="link-btn" (click)="showSignupForm.set(true)">Register here</button>
              </p>
            }
          </form>

          <!-- Sign Up Card -->
          @if (allowSignup && showSignupForm()) {
            <form class="auth-card signup-card" [formGroup]="signupForm" (ngSubmit)="submitSignup()">
              <div class="card-header-group">
                <p class="eyebrow" style="color: var(--gold);">New Registration</p>
                <h2>Sign Up Member</h2>
                <p class="subtext">Create an account for a new committee member to access the admin portal.</p>
              </div>

              @if (signupError()) {
                <div class="state error compact">{{ signupError() }}</div>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                        <line x1="2" x2="22" y1="2" y2="22"></line>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                        <line x1="2" x2="22" y1="2" y2="22"></line>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </label>

              <button class="primary" type="submit" [disabled]="signupForm.invalid || signupLoading()">
                {{ signupLoading() ? 'Registering...' : 'Register Committee Account' }}
              </button>

              <p class="auth-switch-note">
                Already registered?
                <button type="button" class="link-btn" (click)="showSignupForm.set(false)">Back to Sign In</button>
              </p>
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
   * Set `allowSignup = true` to allow new committee member registration.
   */
  readonly allowSignup: boolean = true;
  showSignupForm = signal(true);

  // Visibility states for password fields
  showLoginPassword = signal(false);
  showSignupPassword = signal(false);
  showSignupConfirmPassword = signal(false);

  // Login form state
  loginLoading = signal(false);
  loginError = signal('');
  loginSuccess = signal('');
  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  // Sign Up form state
  signupLoading = signal(false);
  signupError = signal('');
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

    this.auth.register(username.trim(), password).subscribe({
      next: (res) => {
        this.signupLoading.set(false);
        this.loginSuccess.set(res?.message || `Account created successfully for '${username.trim()}'. You can now sign in.`);
        this.loginForm.patchValue({ username: username.trim(), password: '' });
        this.signupForm.reset();
        // Hide the sign up form and show only the sign in form
        this.showSignupForm.set(false);
      },
      error: (err) => {
        this.signupLoading.set(false);
        const message = err?.error?.message || 'Failed to create account. Please try again.';
        this.signupError.set(message);
      }
    });
  }
}

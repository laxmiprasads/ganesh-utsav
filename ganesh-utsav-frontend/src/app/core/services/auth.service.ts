import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  tokenType: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'ganesh_utsav_token';
  private readonly userKey = 'ganesh_utsav_user';
  private readonly tokenState = signal<string | null>(localStorage.getItem(this.tokenKey));

  readonly isAuthenticated = computed(() => !!this.tokenState());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, response.username);
        this.tokenState.set(response.token);
      })
    );
  }

  register(username: string, password: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/register`, { username, password });
  }

  token() {
    return this.tokenState();
  }

  username() {
    return localStorage.getItem(this.userKey) ?? 'committee';
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.tokenState.set(null);
    this.router.navigateByUrl('/committee/login');
  }
}

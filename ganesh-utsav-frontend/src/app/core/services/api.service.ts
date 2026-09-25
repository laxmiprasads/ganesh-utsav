import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auction, Category, Contribution, DashboardStats, Expense, PublicContribution } from '../models/api-models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  publicDashboard() { return this.http.get<DashboardStats>(`${this.apiUrl}/public/dashboard`); }
  publicContributions(filters: Record<string, string | number | undefined> | string = {}) {
    const paramsObj = typeof filters === 'string' ? { search: filters } : filters;
    return this.http.get<Contribution[]>(`${this.apiUrl}/public/contributions`, { params: this.params(paramsObj) });
  }
  publicExpenses(filters: Record<string, string | number | undefined> = {}) { return this.http.get<Expense[]>(`${this.apiUrl}/public/expenses`, { params: this.params(filters) }); }
  publicAuctions(filters: Record<string, string | number | undefined> = {}) { return this.http.get<Auction[]>(`${this.apiUrl}/public/auctions`, { params: this.params(filters) }); }

  committeeDashboard() { return this.http.get<DashboardStats>(`${this.apiUrl}/committee/dashboard`); }

  contributions(filters: Record<string, string | number | undefined> = {}) { return this.http.get<Contribution[]>(`${this.apiUrl}/committee/contributions`, { params: this.params(filters) }); }
  saveContribution(body: Record<string, unknown>, id?: number) { return id ? this.http.put<Contribution>(`${this.apiUrl}/committee/contributions/${id}`, body) : this.http.post<Contribution>(`${this.apiUrl}/committee/contributions`, body); }

  expenseCategories() { return this.http.get<Category[]>(`${this.apiUrl}/committee/expense-categories`); }
  expenses(filters: Record<string, string | number | undefined> = {}) { return this.http.get<Expense[]>(`${this.apiUrl}/committee/expenses`, { params: this.params(filters) }); }
  saveExpense(body: Record<string, unknown>, id?: number) { return id ? this.http.put<Expense>(`${this.apiUrl}/committee/expenses/${id}`, body) : this.http.post<Expense>(`${this.apiUrl}/committee/expenses`, body); }

  auctions(filters: Record<string, string | number | undefined> = {}) { return this.http.get<Auction[]>(`${this.apiUrl}/committee/auctions`, { params: this.params(filters) }); }
  saveAuction(body: Record<string, unknown>, id?: number) { return id ? this.http.put<Auction>(`${this.apiUrl}/committee/auctions/${id}`, body) : this.http.post<Auction>(`${this.apiUrl}/committee/auctions`, body); }
  /** Records one more receipt for an auction, adding the money received now to the amount collected. */
  addAuctionPayment(id: number, body: Record<string, unknown>) { return this.http.post<Auction>(`${this.apiUrl}/committee/auctions/${id}/payments`, body); }
  deleteAuction(id: number) { return this.http.delete<void>(`${this.apiUrl}/committee/auctions/${id}`); }

  uploadPhoto(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/committee/uploads`, data);
  }

  private params(values: Record<string, string | number | undefined>) {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}

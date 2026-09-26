import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshService {
  private refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();
  readonly isRefreshing = signal(false);

  triggerRefresh() {
    this.isRefreshing.set(true);
    this.refreshSubject.next();
    // Keep spin effect for visual feedback while API calls are processed
    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 700);
  }
}

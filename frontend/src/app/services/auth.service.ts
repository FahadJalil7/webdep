import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';
  private currentUserKey = 'currentUser';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.success) {
          localStorage.setItem(this.currentUserKey, JSON.stringify(response.user));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.currentUserKey);
  }

  getCurrentUser(): any {
    const user = localStorage.getItem(this.currentUserKey);
    return user ? JSON.parse(user) : null;
  }

  updateUserBalance(newBalance: number, newOnHold?: number): void {
    const user = this.getCurrentUser();
    if (user) {
      user.kogbucks_balance = newBalance;
      if (newOnHold !== undefined) {
        user.kogbucks_on_hold = newOnHold;
      }
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    }
  }

}

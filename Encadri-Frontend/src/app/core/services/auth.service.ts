import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, LoginResponse } from '../models/user.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  currentUser = signal<User | null>(null);

  constructor(private apiService: ApiService, private router: Router) {
    this.loadUser();
  }

  login(credentials: {email: string, password: string}) {
    return this.apiService.post<LoginResponse>('/Auth/login', credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  register(userData: any) {
    return this.apiService.post<LoginResponse>('/Auth/register', userData).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  updateProfile(user: Partial<User>) {
    return this.apiService.put<User>('/Auth/profile', user).pipe(
      tap(updatedUser => {
        // Update local session with new user data
        const currentToken = this.getToken();
        if (currentToken && updatedUser) {
           // We reconstruct the LoginResponse structure to reuse setSession or just update the user part
           // setSession expects LoginResponse, let's just update the user part manually here to avoid type issues
           localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
           this.currentUser.set(updatedUser);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(authResult: LoginResponse) {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  private loadUser() {
    const user = localStorage.getItem(this.USER_KEY);
    if (user) {
      this.currentUser.set(JSON.parse(user));
    }
  }
}

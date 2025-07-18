import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { StateService } from './state.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private stateService: StateService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.stateService.setLoading('login', true);
    console.log('🔐 AuthService.login() called with:', credentials.email);
    
    return this.apiService.post<AuthResponse>('/auth/login', credentials)
      .pipe(
        tap(response => {
          console.log('✅ AuthService received login response:', response);
          this.handleAuthSuccess(response);
        }),
        catchError(error => {
          console.error('❌ AuthService login error:', error);
          this.stateService.setError('Login failed. Please check your credentials.');
          throw error;
        }),
        tap(() => {
          this.stateService.setLoading('login', false);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.stateService.setLoading('auth', true);
    return this.apiService.post<AuthResponse>('/auth/register', userData)
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => {
          this.stateService.setError('Registration failed. Please try again.');
          throw error;
        }),
        tap(() => {
          this.stateService.setLoading('auth', false);
        })
      );
  }

  logout(): void {
    this.apiService.post('/auth/logout', {}).subscribe({
      next: () => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Clear local auth even if server request fails
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  refreshToken(): Observable<AuthResponse | null> {
    const refreshToken = this.storageService.getItem<string>(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return of(null);
    }

    return this.apiService.post<AuthResponse>('/auth/refresh', { refreshToken })
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
  }

  getCurrentUser(): User | null {
    return this.storageService.getItem<User>(this.USER_KEY);
  }

  getToken(): string | null {
    return this.storageService.getItem<string>(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const hasToken = !!token;
    const isExpired = token ? this.isTokenExpired(token) : true;
    const result = hasToken && !isExpired;
    
    return result;
  }

  private initializeAuth(): void {
    const user = this.getCurrentUser();
    const isAuth = this.isAuthenticated();
    
    if (isAuth && user) {
      this.stateService.setUser(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuth();
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    console.log('🎉 handleAuthSuccess() called with:', response);
    
    this.storageService.setItem(this.TOKEN_KEY, response.accessToken);
    this.storageService.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    this.storageService.setItem(this.USER_KEY, response.user);
    
    this.stateService.setUser(response.user);
    this.isAuthenticatedSubject.next(true);
    this.stateService.setError(null);
    
    console.log('🔒 Authentication state updated:', {
      token: !!response.accessToken,
      user: response.user.email,
      isAuthenticated: this.isAuthenticated()
    });
  }

  private clearAuth(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    
    this.stateService.setUser(null);
    this.isAuthenticatedSubject.next(false);
    this.stateService.reset();
  }

  private isTokenExpired(token: string): boolean {
    // Check if token is valid string
    if (!token || typeof token !== 'string') {
      return true; // Consider null/undefined/non-string tokens as expired
    }
    
    // Handle mock tokens (they don't expire)
    if (token.startsWith('mock-token-')) {
      console.log('🔧 Mock token detected, never expires:', token);
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('🕐 Token expiry check:', { 
        exp: payload.exp, 
        now: Date.now(), 
        expired: isExpired 
      });
      return isExpired;
    } catch (error) {
      console.log('❌ Invalid token format:', token, error);
      return true;
    }
  }
} 
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService, StateService } from '../services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private stateService: StateService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isAuthRequest(req.url)) {
          // Try to refresh token
          return this.authService.refreshToken().pipe(
            switchMap(response => {
              if (response && response.accessToken) {
                // Retry original request with new token
                const newToken = this.authService.getToken();
                const authReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                });
                return next.handle(authReq);
              } else {
                // Refresh failed, logout user
                this.authService.logout();
                return throwError(() => error);
              }
            }),
            catchError(() => {
              this.authService.logout();
              return throwError(() => error);
            })
          );
        }

        // Handle other errors
        if (error.status >= 500) {
          this.stateService.setError('Server error. Please try again later.');
        } else if (error.status === 403) {
          this.stateService.setError('Access denied.');
        } else if (error.status === 404) {
          this.stateService.setError('Resource not found.');
        }

        return throwError(() => error);
      })
    );
  }

  private isAuthRequest(url: string): boolean {
    return url.includes('/api/auth/login') ||
           url.includes('/api/auth/register') ||
           url.includes('/api/auth/refresh');
  }
}

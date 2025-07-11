import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { StateService } from '../services/state.service';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let stateServiceSpy: jasmine.SpyObj<StateService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['refreshToken', 'logout', 'getToken']);
    const stateSpy = jasmine.createSpyObj('StateService', ['setError']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: StateService, useValue: stateSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    stateServiceSpy = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    // Don't create direct instance - use the one from TestBed
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Interceptor Creation', () => {
    it('should be created', () => {
      const testInterceptor = new ErrorInterceptor(authServiceSpy, stateServiceSpy);
      expect(testInterceptor).toBeTruthy();
    });

    it('should have intercept method', () => {
      const testInterceptor = new ErrorInterceptor(authServiceSpy, stateServiceSpy);
      expect(typeof testInterceptor.intercept).toBe('function');
    });
  });

  describe('Successful Requests', () => {
    it('should pass through successful requests without modification', () => {
      const mockData = { message: 'success' };

      httpClient.get('/api/test').subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(mockData);

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
      expect(stateServiceSpy.setError).not.toHaveBeenCalled();
    });
  });

     describe('401 Unauthorized Errors', () => {
     it('should attempt token refresh on 401 error for non-auth requests', () => {
       const mockRefreshResponse = { 
         accessToken: 'new-token', 
         refreshToken: 'new-refresh', 
         tokenType: 'Bearer', 
         expiresIn: 3600, 
         user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', preferences: { preferredEventFormat: 'HYBRID' as const, industry: 'Tech', language: 'en', timezone: 'UTC' }, isActive: true, createdAt: new Date(), updatedAt: new Date() } 
       };
       authServiceSpy.refreshToken.and.returnValue(of(mockRefreshResponse));
      authServiceSpy.getToken.and.returnValue('new-token');

      httpClient.get('/api/protected').subscribe();

      // First request fails with 401
      const req1 = httpMock.expectOne('/api/protected');
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // Should retry with new token
      const req2 = httpMock.expectOne('/api/protected');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token');
      req2.flush({ data: 'success' });

      expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('should logout user when token refresh fails', () => {
      authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

      httpClient.get('/api/protected').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);
      expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
    });

    it('should logout user when refresh returns null/falsy response', () => {
      authServiceSpy.refreshToken.and.returnValue(of(null));

      httpClient.get('/api/protected').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
      expect(authServiceSpy.logout).toHaveBeenCalled();
    });

    it('should not attempt refresh for auth requests', () => {
      httpClient.post('/auth/login', {}).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/auth/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });

    it('should not attempt refresh for register requests', () => {
      httpClient.post('/auth/register', {}).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/auth/register');
      req.flush('Registration failed', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });

    it('should not attempt refresh for refresh token requests', () => {
      httpClient.post('/auth/refresh', {}).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/auth/refresh');
      req.flush('Refresh failed', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });
  });

  describe('HTTP Error Status Handling', () => {
    it('should set server error message for 500+ status codes', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(stateServiceSpy.setError).toHaveBeenCalledWith('Server error. Please try again later.');
    });

    it('should set server error message for 502 status code', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });

      expect(stateServiceSpy.setError).toHaveBeenCalledWith('Server error. Please try again later.');
    });

    it('should set access denied message for 403 status code', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(stateServiceSpy.setError).toHaveBeenCalledWith('Access denied.');
    });

    it('should set not found message for 404 status code', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(stateServiceSpy.setError).toHaveBeenCalledWith('Resource not found.');
    });

    it('should not set error message for 400 status code', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(stateServiceSpy.setError).not.toHaveBeenCalled();
    });

    it('should not set error message for 422 status code', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Validation Error', { status: 422, statusText: 'Unprocessable Entity' });

      expect(stateServiceSpy.setError).not.toHaveBeenCalled();
    });
  });

     describe('Token Refresh Flow', () => {
     it('should clone request with new token after successful refresh', () => {
       const mockRefreshResponse = { 
         accessToken: 'new-token-12345', 
         refreshToken: 'new-refresh', 
         tokenType: 'Bearer', 
         expiresIn: 3600, 
         user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', preferences: { preferredEventFormat: 'HYBRID' as const, industry: 'Tech', language: 'en', timezone: 'UTC' }, isActive: true, createdAt: new Date(), updatedAt: new Date() } 
       };
       authServiceSpy.refreshToken.and.returnValue(of(mockRefreshResponse));
      authServiceSpy.getToken.and.returnValue('new-token-12345');

      const originalHeaders = { 'Content-Type': 'application/json' };

      httpClient.post('/api/data', { test: 'data' }, { headers: originalHeaders }).subscribe();

      // First request fails
      const req1 = httpMock.expectOne('/api/data');
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // Retry request should have new token and preserve other headers
      const req2 = httpMock.expectOne('/api/data');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token-12345');
      expect(req2.request.headers.get('Content-Type')).toBe('application/json');
      expect(req2.request.body).toEqual({ test: 'data' });
      req2.flush({ success: true });
    });

         it('should handle multiple simultaneous 401 errors correctly', () => {
       const mockRefreshResponse = { 
         accessToken: 'new-token', 
         refreshToken: 'new-refresh', 
         tokenType: 'Bearer', 
         expiresIn: 3600, 
         user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', preferences: { preferredEventFormat: 'HYBRID' as const, industry: 'Tech', language: 'en', timezone: 'UTC' }, isActive: true, createdAt: new Date(), updatedAt: new Date() } 
       };
       authServiceSpy.refreshToken.and.returnValue(of(mockRefreshResponse));
      authServiceSpy.getToken.and.returnValue('new-token');

      // Make multiple requests
      httpClient.get('/api/data1').subscribe();
      httpClient.get('/api/data2').subscribe();

      // Both fail with 401
      const req1 = httpMock.expectOne('/api/data1');
      const req2 = httpMock.expectOne('/api/data2');
      
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // Both should be retried
      const retryReq1 = httpMock.expectOne('/api/data1');
      const retryReq2 = httpMock.expectOne('/api/data2');

      expect(retryReq1.request.headers.get('Authorization')).toBe('Bearer new-token');
      expect(retryReq2.request.headers.get('Authorization')).toBe('Bearer new-token');

      retryReq1.flush({ data: 'success1' });
      retryReq2.flush({ data: 'success2' });

      // Refresh should be called for each 401 (or potentially optimized to call once)
      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
    });
  });

  describe('Auth Request Detection', () => {
    it('should correctly identify login requests', () => {
      httpClient.post('/api/auth/login/user', {}).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/auth/login/user');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });

    it('should correctly identify register requests', () => {
      httpClient.post('/user/auth/register', {}).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/user/auth/register');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });

    it('should correctly identify refresh requests', () => {
      httpClient.post('/auth/refresh/token', {}).subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/auth/refresh/token');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });

    it('should treat non-auth requests as requiring token refresh', () => {
      authServiceSpy.refreshToken.and.returnValue(of(null));

      httpClient.get('/api/concepts').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/concepts');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
      expect(authServiceSpy.logout).toHaveBeenCalled();
    });
  });

  describe('Error Propagation', () => {
    it('should propagate original error after failed token refresh', () => {
      authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

      httpClient.get('/api/protected').subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should propagate errors for non-401 status codes', () => {
      httpClient.get('/api/test').subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Validation Error', { status: 400, statusText: 'Bad Request' });

      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined refresh response', () => {
      authServiceSpy.refreshToken.and.returnValue(of(undefined as any));

      httpClient.get('/api/protected').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.logout).toHaveBeenCalled();
    });

             it('should handle refresh response with falsy accessToken', () => {
      authServiceSpy.refreshToken.and.returnValue(of({ accessToken: '', refreshToken: 'token', tokenType: 'Bearer', expiresIn: 3600, user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', preferences: { preferredEventFormat: 'HYBRID' as const, industry: 'Tech', language: 'en', timezone: 'UTC' }, isActive: true, createdAt: new Date(), updatedAt: new Date() } }));

      httpClient.get('/api/protected').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.logout).toHaveBeenCalled();
    });

    it('should handle empty URL in error detection', () => {
      authServiceSpy.refreshToken.and.returnValue(of(null));

      // Test with empty URL (edge case)
      httpClient.get('').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);
    });
  });
}); 
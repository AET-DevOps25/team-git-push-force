import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    interceptor = new AuthInterceptor(authServiceSpy);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Interceptor Creation', () => {
    it('should be created', () => {
      expect(interceptor).toBeTruthy();
    });

    it('should have intercept method', () => {
      expect(typeof interceptor.intercept).toBe('function');
    });
  });

  describe('Token Injection', () => {
    it('should add Authorization header when token exists and not auth request', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.get('/api/concepts').subscribe();

      const req = httpMock.expectOne('/api/concepts');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not add Authorization header when token is null', () => {
      authServiceSpy.getToken.and.returnValue(null);

      httpClient.get('/api/concepts').subscribe();

      const req = httpMock.expectOne('/api/concepts');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not add Authorization header when token is empty string', () => {
      authServiceSpy.getToken.and.returnValue('');

      httpClient.get('/api/concepts').subscribe();

      const req = httpMock.expectOne('/api/concepts');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not add Authorization header when token is undefined', () => {
      authServiceSpy.getToken.and.returnValue(undefined as any);

      httpClient.get('/api/concepts').subscribe();

      const req = httpMock.expectOne('/api/concepts');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should preserve existing headers when adding Authorization', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.get('/api/concepts', {
        headers: { 'Content-Type': 'application/json', 'Custom-Header': 'custom-value' }
      }).subscribe();

      const req = httpMock.expectOne('/api/concepts');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
      req.flush({});
    });

    it('should handle multiple requests with different tokens', () => {
      // First request
      authServiceSpy.getToken.and.returnValue('token-1');
      httpClient.get('/api/concepts').subscribe();
      const req1 = httpMock.expectOne('/api/concepts');
      expect(req1.request.headers.get('Authorization')).toBe('Bearer token-1');
      req1.flush({});

      // Second request with different token
      authServiceSpy.getToken.and.returnValue('token-2');
      httpClient.get('/api/users').subscribe();
      const req2 = httpMock.expectOne('/api/users');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer token-2');
      req2.flush({});
    });
  });

  describe('Auth Request Detection', () => {
    it('should not add Authorization header for login requests', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.post('/auth/login', { email: 'test@test.com', password: 'password' }).subscribe();

      const req = httpMock.expectOne('/auth/login');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not add Authorization header for register requests', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.post('/auth/register', { email: 'test@test.com', password: 'password' }).subscribe();

      const req = httpMock.expectOne('/auth/register');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not add Authorization header for refresh token requests', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.post('/auth/refresh', { refreshToken: 'refresh-token' }).subscribe();

      const req = httpMock.expectOne('/auth/refresh');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should add Authorization header for non-auth requests', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.get('/api/protected').subscribe();

      const req = httpMock.expectOne('/api/protected');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should handle URLs with query parameters correctly', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      // Auth request with query params should not get token
      httpClient.post('/auth/login?redirect=dashboard', {}).subscribe();
      const authReq = httpMock.expectOne('/auth/login?redirect=dashboard');
      expect(authReq.request.headers.get('Authorization')).toBeNull();
      authReq.flush({});

      // Non-auth request with query params should get token
      httpClient.get('/api/concepts?page=1&limit=10').subscribe();
      const apiReq = httpMock.expectOne('/api/concepts?page=1&limit=10');
      expect(apiReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      apiReq.flush({});
    });

    it('should handle relative and absolute URLs for auth detection', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      // Relative URL
      httpClient.post('/auth/login', {}).subscribe();
      const relativeReq = httpMock.expectOne('/auth/login');
      expect(relativeReq.request.headers.get('Authorization')).toBeNull();
      relativeReq.flush({});

      // Absolute URL (if testing with full URLs)
      httpClient.post('https://api.example.com/auth/register', {}).subscribe();
      const absoluteReq = httpMock.expectOne('https://api.example.com/auth/register');
      expect(absoluteReq.request.headers.get('Authorization')).toBeNull();
      absoluteReq.flush({});
    });
  });

  describe('Request Cloning', () => {
    it('should clone request when adding Authorization header', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      const originalHeaders = { 'Content-Type': 'application/json' };
      httpClient.get('/api/test', { headers: originalHeaders }).subscribe();

      const req = httpMock.expectOne('/api/test');
      
      // Should have original headers plus Authorization
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not clone request when no token', () => {
      authServiceSpy.getToken.and.returnValue(null);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });

    it('should not clone request for auth endpoints', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.post('/auth/login', {}).subscribe();

      const req = httpMock.expectOne('/auth/login');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});
    });
  });

  describe('Error Handling', () => {
    it('should handle AuthService.getToken throwing error', () => {
      authServiceSpy.getToken.and.throwError('Token retrieval error');

      httpClient.get('/api/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Token retrieval error');
        }
      });

      // No HTTP request should be made when getToken throws
      httpMock.expectNone('/api/test');
    });

    it('should pass through HTTP errors', () => {
      const mockToken = 'mock-token-12345';
      authServiceSpy.getToken.and.returnValue(mockToken);

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('HTTP Methods', () => {
    const mockToken = 'mock-token-12345';

    beforeEach(() => {
      authServiceSpy.getToken.and.returnValue(mockToken);
    });

    it('should add token to GET requests', () => {
      httpClient.get('/api/data').subscribe();
      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to POST requests', () => {
      httpClient.post('/api/data', { test: 'data' }).subscribe();
      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to PUT requests', () => {
      httpClient.put('/api/data/1', { test: 'data' }).subscribe();
      const req = httpMock.expectOne('/api/data/1');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to DELETE requests', () => {
      httpClient.delete('/api/data/1').subscribe();
      const req = httpMock.expectOne('/api/data/1');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should add token to PATCH requests', () => {
      httpClient.patch('/api/data/1', { test: 'data' }).subscribe();
      const req = httpMock.expectOne('/api/data/1');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });
  });

  describe('Private Method Testing', () => {
    it('should correctly identify auth requests', () => {
      // Testing the private isAuthRequest method through public behavior
      const mockToken = 'token';
      authServiceSpy.getToken.and.returnValue(mockToken);

      // Test login URL
      httpClient.post('/api/auth/login', {}).subscribe();
      let req = httpMock.expectOne('/api/auth/login');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});

      // Test register URL
      httpClient.post('/user/auth/register', {}).subscribe();
      req = httpMock.expectOne('/user/auth/register');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});

      // Test refresh URL
      httpClient.post('/auth/refresh/token', {}).subscribe();
      req = httpMock.expectOne('/auth/refresh/token');
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush({});

      // Test non-auth URL
      httpClient.get('/api/other').subscribe();
      req = httpMock.expectOne('/api/other');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });
  });
}); 
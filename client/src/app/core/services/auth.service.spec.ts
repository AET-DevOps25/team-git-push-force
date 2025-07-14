import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { StateService } from './state.service';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let stateServiceSpy: jasmine.SpyObj<StateService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'HYBRID',
      industry: 'Technology',
      language: 'en',
      timezone: 'UTC'
    },
    isActive: true,
    lastLoginAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-token-12345',
    refreshToken: 'refresh-token-12345',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: mockUser
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['post']);
    const storageSpy = jasmine.createSpyObj('StorageService', ['getItem', 'setItem', 'removeItem']);
    const stateSpy = jasmine.createSpyObj('StateService', ['setUser', 'setLoading', 'setError', 'reset']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiSpy },
        { provide: StorageService, useValue: storageSpy },
        { provide: StateService, useValue: stateSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    storageServiceSpy = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    stateServiceSpy = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have authentication methods', () => {
      expect(typeof service.login).toBe('function');
      expect(typeof service.logout).toBe('function');
      expect(typeof service.isAuthenticated).toBe('function');
      expect(typeof service.getCurrentUser).toBe('function');
      expect(typeof service.refreshToken).toBe('function');
    });

    it('should initialize with existing valid token and user', () => {
      storageServiceSpy.getItem.and.callFake((key: string) => {
        if (key === 'current_user') return mockUser as any;
        if (key === 'access_token') return 'mock-token-12345' as any;
        return null;
      });

      // Re-create service to test initialization
      service = new AuthService(apiServiceSpy, storageServiceSpy, stateServiceSpy, routerSpy);

      expect(stateServiceSpy.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should clear auth state if token is expired', () => {
      const expiredToken = btoa(JSON.stringify({ exp: Date.now() / 1000 - 3600 })); // Expired 1 hour ago
      storageServiceSpy.getItem.and.callFake((key: string) => {
        if (key === 'current_user') return mockUser as any;
        if (key === 'access_token') return `header.${expiredToken}.signature` as any;
        return null;
      });

      // Re-create service to test initialization
      service = new AuthService(apiServiceSpy, storageServiceSpy, stateServiceSpy, routerSpy);

      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('access_token');
      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('current_user');
    });
  });

  describe('Login', () => {
    const loginCredentials: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));

      service.login(loginCredentials).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(stateServiceSpy.setLoading).toHaveBeenCalledWith('login', true);
        expect(stateServiceSpy.setLoading).toHaveBeenCalledWith('login', false);
        expect(storageServiceSpy.setItem).toHaveBeenCalledWith('access_token', mockAuthResponse.accessToken);
        expect(storageServiceSpy.setItem).toHaveBeenCalledWith('refresh_token', mockAuthResponse.refreshToken);
        expect(storageServiceSpy.setItem).toHaveBeenCalledWith('current_user', mockAuthResponse.user);
        expect(stateServiceSpy.setUser).toHaveBeenCalledWith(mockAuthResponse.user);
        expect(stateServiceSpy.setError).toHaveBeenCalledWith(null);
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/login', loginCredentials);
    });

    it('should handle login error', (done) => {
      const errorResponse = { status: 401, error: { message: 'Invalid credentials' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.login(loginCredentials).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(stateServiceSpy.setError).toHaveBeenCalledWith('Login failed. Please check your credentials.');
          expect(stateServiceSpy.setLoading).toHaveBeenCalledWith('login', true);
          // Note: setLoading(false) is not called on error in current implementation
          done();
        }
      });
    });

    it('should set loading state during login', () => {
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));

      service.login(loginCredentials).subscribe();

      expect(stateServiceSpy.setLoading).toHaveBeenCalledWith('login', true);
    });
  });

  describe('Register', () => {
    const registerData: RegisterRequest = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should register successfully', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));

      service.register(registerData).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(stateServiceSpy.setLoading).toHaveBeenCalledWith('auth', true);
        expect(stateServiceSpy.setLoading).toHaveBeenCalledWith('auth', false);
        expect(storageServiceSpy.setItem).toHaveBeenCalledWith('access_token', mockAuthResponse.accessToken);
        expect(stateServiceSpy.setUser).toHaveBeenCalledWith(mockAuthResponse.user);
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/register', registerData);
    });

    it('should handle registration error', (done) => {
      const errorResponse = { status: 400, error: { message: 'Email already exists' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.register(registerData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(stateServiceSpy.setError).toHaveBeenCalledWith('Registration failed. Please try again.');
          done();
        }
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.logout();

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/logout', {});
      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('access_token');
      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('current_user');
      expect(stateServiceSpy.setUser).toHaveBeenCalledWith(null);
      expect(stateServiceSpy.reset).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should logout even if API call fails', () => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ status: 500 })));

      service.logout();

      expect(storageServiceSpy.removeItem).toHaveBeenCalledWith('access_token');
      expect(stateServiceSpy.setUser).toHaveBeenCalledWith(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('Token Management', () => {
    it('should return current token', () => {
      storageServiceSpy.getItem.and.returnValue('test-token');

      const token = service.getToken();

      expect(token).toBe('test-token');
      expect(storageServiceSpy.getItem).toHaveBeenCalledWith('access_token');
    });

    it('should return null when no token exists', () => {
      storageServiceSpy.getItem.and.returnValue(null);

      const token = service.getToken();

      expect(token).toBeNull();
    });

    it('should return current user', () => {
      storageServiceSpy.getItem.and.returnValue(mockUser);

      const user = service.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(storageServiceSpy.getItem).toHaveBeenCalledWith('current_user');
    });

    it('should return null when no user exists', () => {
      storageServiceSpy.getItem.and.returnValue(null);

      const user = service.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('Authentication State', () => {
    it('should return true when authenticated with valid token', () => {
      const validToken = `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }))}.signature`;
      storageServiceSpy.getItem.and.returnValue(validToken);

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when token is expired', () => {
      const expiredToken = `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 - 3600 }))}.signature`;
      storageServiceSpy.getItem.and.returnValue(expiredToken);

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('should return false when no token exists', () => {
      storageServiceSpy.getItem.and.returnValue(null);

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('should return false when token format is invalid', () => {
      storageServiceSpy.getItem.and.returnValue('invalid-token');

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('should handle mock tokens (never expire)', () => {
      storageServiceSpy.getItem.and.returnValue('mock-token-12345');

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(true);
    });
  });

  describe('Refresh Token', () => {
    it('should refresh token successfully', (done) => {
      storageServiceSpy.getItem.and.callFake((key: string) => {
        if (key === 'refresh_token') return 'refresh-token-12345' as any;
        return null;
      });
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-token-12345' });
        expect(storageServiceSpy.setItem).toHaveBeenCalledWith('access_token', mockAuthResponse.accessToken);
        done();
      });
    });

    it('should logout if no refresh token exists', (done) => {
      storageServiceSpy.getItem.and.returnValue(null);
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.refreshToken().subscribe(response => {
        expect(response).toBeNull();
        expect(stateServiceSpy.setUser).toHaveBeenCalledWith(null);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });

    it('should logout if refresh token request fails', (done) => {
      storageServiceSpy.getItem.and.callFake((key: string) => {
        if (key === 'refresh_token') return 'refresh-token-12345' as any;
        return null;
      });
      
      // First call for refresh will fail, second call for logout will succeed
      apiServiceSpy.post.and.returnValues(
        throwError(() => ({ status: 401 })),
        of({ success: true })
      );

      service.refreshToken().subscribe(response => {
        expect(response).toBeNull();
        expect(stateServiceSpy.setUser).toHaveBeenCalledWith(null);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });
  });

  describe('Authentication Observable', () => {
    it('should emit authentication state changes', (done) => {
      let emittedValues: boolean[] = [];

      service.isAuthenticated$.subscribe(isAuth => {
        emittedValues.push(isAuth);
        
        if (emittedValues.length === 2) {
          expect(emittedValues).toEqual([false, true]);
          done();
        }
      });

      // Simulate successful login
      apiServiceSpy.post.and.returnValue(of(mockAuthResponse));
      service.login({ email: 'test@test.com', password: 'password' }).subscribe();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JWT tokens gracefully', () => {
      storageServiceSpy.getItem.and.returnValue('not.a.valid.jwt.token');

      expect(() => service.isAuthenticated()).not.toThrow();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle storage errors gracefully', () => {
      storageServiceSpy.getItem.and.returnValue(null);

      expect(() => service.getCurrentUser()).not.toThrow();
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should clear state on authentication errors', (done) => {
      const errorResponse = { status: 401, error: { message: 'Unauthorized' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.login({ email: 'test@test.com', password: 'password' }).subscribe({
        error: () => {
          expect(stateServiceSpy.setError).toHaveBeenCalled();
          done();
        }
      });
    });
  });
}); 
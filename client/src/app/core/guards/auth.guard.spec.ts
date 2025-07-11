import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Guard Creation', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });

    it('should have canActivate method', () => {
      expect(typeof guard.canActivate).toBe('function');
    });
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate();

      expect(result).toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should return false and redirect to login when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate();

      expect(result).toBe(false);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to correct login path', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      guard.canActivate();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should handle multiple consecutive calls correctly', () => {
      // First call - authenticated
      authServiceSpy.isAuthenticated.and.returnValue(true);
      let result1 = guard.canActivate();
      expect(result1).toBe(true);

      // Second call - not authenticated
      authServiceSpy.isAuthenticated.and.returnValue(false);
      let result2 = guard.canActivate();
      expect(result2).toBe(false);

      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(2);
      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should not interfere with router navigation when authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      guard.canActivate();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle AuthService throwing error', () => {
      authServiceSpy.isAuthenticated.and.throwError('Auth service error');

      expect(() => guard.canActivate()).toThrow();
    });

    it('should handle Router throwing error on navigation', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      routerSpy.navigate.and.throwError('Navigation error');

      expect(() => guard.canActivate()).toThrow();
    });
  });

  describe('Service Dependencies', () => {
    it('should inject AuthService correctly', () => {
      expect(authServiceSpy).toBeDefined();
      expect(authServiceSpy.isAuthenticated).toBeDefined();
    });

    it('should inject Router correctly', () => {
      expect(routerSpy).toBeDefined();
      expect(routerSpy.navigate).toBeDefined();
    });
  });
}); 
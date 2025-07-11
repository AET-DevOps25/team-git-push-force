import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GuestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('GuestGuard', () => {
  let guard: GuestGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        GuestGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    guard = TestBed.inject(GuestGuard);
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
    it('should return true when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate();

      expect(result).toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should return false and redirect to dashboard when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate();

      expect(result).toBe(false);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect to correct dashboard path', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      guard.canActivate();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle multiple consecutive calls correctly', () => {
      // First call - not authenticated (guest)
      authServiceSpy.isAuthenticated.and.returnValue(false);
      let result1 = guard.canActivate();
      expect(result1).toBe(true);

      // Second call - authenticated
      authServiceSpy.isAuthenticated.and.returnValue(true);
      let result2 = guard.canActivate();
      expect(result2).toBe(false);

      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(2);
      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should not interfere with router navigation when not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      guard.canActivate();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should allow guest users to access login/register pages', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate();

      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should prevent authenticated users from accessing guest-only pages', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate();

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle AuthService throwing error', () => {
      authServiceSpy.isAuthenticated.and.throwError('Auth service error');

      expect(() => guard.canActivate()).toThrow();
    });

    it('should handle Router throwing error on navigation', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      routerSpy.navigate.and.throwError('Navigation error');

      expect(() => guard.canActivate()).toThrow();
    });
  });

  describe('Guard Logic Consistency', () => {
    it('should be inverse of AuthGuard behavior', () => {
      // When AuthGuard would return true, GuestGuard should return false
      authServiceSpy.isAuthenticated.and.returnValue(true);
      expect(guard.canActivate()).toBe(false);

      // When AuthGuard would return false, GuestGuard should return true
      authServiceSpy.isAuthenticated.and.returnValue(false);
      expect(guard.canActivate()).toBe(true);
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

  describe('Use Cases', () => {
    it('should allow access to login page for guests', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      expect(guard.canActivate()).toBe(true);
    });

    it('should allow access to register page for guests', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      expect(guard.canActivate()).toBe(true);
    });

    it('should redirect authenticated users trying to access login page', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      expect(guard.canActivate()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect authenticated users trying to access register page', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      expect(guard.canActivate()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
}); 
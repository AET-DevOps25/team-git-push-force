import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { StateService } from '../../../../core/services/state.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let stateService: jasmine.SpyObj<StateService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['isLoading', 'setLoading']);

    // Setup default return values
    stateServiceSpy.isLoading.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('rememberMe')?.value).toBe(false);
  });

  it('should initialize with password hidden', () => {
    expect(component.hidePassword).toBe(true);
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });

    it('should require email', () => {
      const emailControl = component.loginForm.get('email');
      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should require valid email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });

    it('should require password', () => {
      const passwordControl = component.loginForm.get('password');
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should require password minimum length', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBeFalsy();
    });

    it('should be valid with correct email and password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBeTruthy();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword).toBe(true);
      
      const toggleButton = fixture.debugElement.nativeElement.querySelector('button[type="button"]');
      toggleButton.click();
      
      expect(component.hidePassword).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should return correct email error messages', () => {
      const emailControl = component.loginForm.get('email');
      
      emailControl?.markAsTouched();
      expect(component.getEmailErrorMessage()).toBe('Email is required');
      
      emailControl?.setValue('invalid');
      expect(component.getEmailErrorMessage()).toBe('Please enter a valid email');
    });

    it('should return correct password error messages', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.markAsTouched();
      expect(component.getPasswordErrorMessage()).toBe('Password is required');
      
      passwordControl?.setValue('123');
      expect(component.getPasswordErrorMessage()).toBe('Password must be at least 6 characters');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should not submit when form is invalid', () => {
      component.loginForm.patchValue({ email: '' });
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
      expect(stateService.setLoading).not.toHaveBeenCalled();
    });

    it('should submit with valid form data', () => {
      const mockAuthResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            preferredEventFormat: 'HYBRID' as const,
            industry: 'Technology',
            language: 'en',
            timezone: 'Europe/Berlin'
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      authService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(stateService.setLoading).toHaveBeenCalledWith('login', true);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should navigate to dashboard on successful login', () => {
      const mockAuthResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            preferredEventFormat: 'HYBRID' as const,
            industry: 'Technology',
            language: 'en',
            timezone: 'Europe/Berlin'
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      authService.login.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(stateService.setLoading).toHaveBeenCalledWith('login', false);
    });

    it('should handle login error', () => {
      authService.login.and.returnValue(throwError('Login failed'));
      
      component.onSubmit();
      
      expect(stateService.setLoading).toHaveBeenCalledWith('login', false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should get loading state from StateService', () => {
      expect(stateService.isLoading).toHaveBeenCalledWith('login');
    });

    it('should disable submit button when loading', () => {
      stateService.isLoading.and.returnValue(of(true));
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.nativeElement.querySelector('.login-button');
      expect(submitButton.disabled).toBeTruthy();
    });
  });
}); 
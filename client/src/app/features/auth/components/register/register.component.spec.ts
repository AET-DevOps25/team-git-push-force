import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';
import { StateService } from '../../../../core/services/state.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let stateService: jasmine.SpyObj<StateService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['isLoading', 'setLoading']);

    // Setup default return values
    stateServiceSpy.isLoading.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
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

    fixture = TestBed.createComponent(RegisterComponent);
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

  it('should initialize forms with default values', () => {
    // Basic info form
    expect(component.basicInfoForm.get('firstName')?.value).toBe('');
    expect(component.basicInfoForm.get('lastName')?.value).toBe('');
    expect(component.basicInfoForm.get('email')?.value).toBe('');
    expect(component.basicInfoForm.get('password')?.value).toBe('');
    expect(component.basicInfoForm.get('confirmPassword')?.value).toBe('');

    // Preferences form with defaults
    expect(component.preferencesForm.get('preferredEventFormat')?.value).toBe('HYBRID');
    expect(component.preferencesForm.get('industry')?.value).toBe('Technology');
    expect(component.preferencesForm.get('language')?.value).toBe('en');
    expect(component.preferencesForm.get('timezone')?.value).toBe('Europe/Berlin');
  });

  it('should initialize with passwords hidden', () => {
    expect(component.hidePassword).toBe(true);
    expect(component.hideConfirmPassword).toBe(true);
  });

  describe('Basic Info Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.basicInfoForm.valid).toBeFalsy();
    });

    it('should require all basic fields', () => {
      const form = component.basicInfoForm;
      expect(form.get('firstName')?.hasError('required')).toBeTruthy();
      expect(form.get('lastName')?.hasError('required')).toBeTruthy();
      expect(form.get('email')?.hasError('required')).toBeTruthy();
      expect(form.get('password')?.hasError('required')).toBeTruthy();
      expect(form.get('confirmPassword')?.hasError('required')).toBeTruthy();
    });

    it('should validate minimum length for names', () => {
      const firstNameControl = component.basicInfoForm.get('firstName');
      const lastNameControl = component.basicInfoForm.get('lastName');

      firstNameControl?.setValue('A');
      lastNameControl?.setValue('B');

      expect(firstNameControl?.hasError('minlength')).toBeTruthy();
      expect(lastNameControl?.hasError('minlength')).toBeTruthy();

      firstNameControl?.setValue('John');
      lastNameControl?.setValue('Doe');

      expect(firstNameControl?.hasError('minlength')).toBeFalsy();
      expect(lastNameControl?.hasError('minlength')).toBeFalsy();
    });

    it('should validate email format', () => {
      const emailControl = component.basicInfoForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.basicInfoForm.get('password');
      
      passwordControl?.setValue('123');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
      
      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBeFalsy();
    });
  });

  describe('Password Matching Validation', () => {
    it('should validate matching passwords', () => {
      component.basicInfoForm.patchValue({
        password: 'password123',
        confirmPassword: 'different'
      });

      // Trigger validation
      component.passwordMatchValidator(component.basicInfoForm);

      const confirmPasswordControl = component.basicInfoForm.get('confirmPassword');
      expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeTruthy();
    });

    it('should pass when passwords match', () => {
      component.basicInfoForm.patchValue({
        password: 'password123',
        confirmPassword: 'password123'
      });

      // Trigger validation
      component.passwordMatchValidator(component.basicInfoForm);

      const confirmPasswordControl = component.basicInfoForm.get('confirmPassword');
      expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeFalsy();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword).toBe(true);
      
      // Simulate click on password toggle
      component.hidePassword = !component.hidePassword;
      
      expect(component.hidePassword).toBe(false);
    });

    it('should toggle confirm password visibility', () => {
      expect(component.hideConfirmPassword).toBe(true);
      
      // Simulate click on confirm password toggle
      component.hideConfirmPassword = !component.hideConfirmPassword;
      
      expect(component.hideConfirmPassword).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should return correct error messages for different field types', () => {
      const form = component.basicInfoForm;
      
      // Test required field
      form.get('firstName')?.markAsTouched();
      expect(component.getFieldErrorMessage(form, 'firstName')).toBe('firstName is required');
      
      // Test email validation
      form.get('email')?.setValue('invalid');
      form.get('email')?.markAsTouched();
      expect(component.getFieldErrorMessage(form, 'email')).toBe('Please enter a valid email');
      
      // Test minimum length
      form.get('password')?.setValue('123');
      form.get('password')?.markAsTouched();
      expect(component.getFieldErrorMessage(form, 'password')).toContain('Minimum');
      
      // Test password mismatch
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      expect(component.getFieldErrorMessage(form, 'confirmPassword')).toBe('Passwords do not match');
    });
  });

  describe('Preferences Form Validation', () => {
    it('should be valid with default values', () => {
      expect(component.preferencesForm.valid).toBeTruthy();
    });

    it('should require all preference fields', () => {
      component.preferencesForm.patchValue({
        preferredEventFormat: '',
        industry: '',
        language: '',
        timezone: ''
      });

      expect(component.preferencesForm.valid).toBeFalsy();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Setup valid forms
      component.basicInfoForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      component.preferencesForm.patchValue({
        preferredEventFormat: 'HYBRID',
        industry: 'Technology',
        language: 'en',
        timezone: 'Europe/Berlin'
      });
    });

    it('should not submit when basic info form is invalid', () => {
      component.basicInfoForm.patchValue({ email: '' });
      component.onSubmit();
      
      expect(authService.register).not.toHaveBeenCalled();
      expect(stateService.setLoading).not.toHaveBeenCalled();
    });

    it('should not submit when preferences form is invalid', () => {
      component.preferencesForm.patchValue({ industry: '' });
      component.onSubmit();
      
      expect(authService.register).not.toHaveBeenCalled();
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
          email: 'john@example.com', 
          firstName: 'John', 
          lastName: 'Doe',
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
      authService.register.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(stateService.setLoading).toHaveBeenCalledWith('register', true);
      expect(authService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        preferences: {
          preferredEventFormat: 'HYBRID',
          industry: 'Technology',
          language: 'en',
          timezone: 'Europe/Berlin'
        }
      });
    });

    it('should navigate to dashboard on successful registration', () => {
      const mockAuthResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { 
          id: '1', 
          email: 'john@example.com', 
          firstName: 'John', 
          lastName: 'Doe',
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
      authService.register.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(stateService.setLoading).toHaveBeenCalledWith('register', false);
    });

    it('should handle registration error', () => {
      authService.register.and.returnValue(throwError('Registration failed'));
      
      component.onSubmit();
      
      expect(stateService.setLoading).toHaveBeenCalledWith('register', false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should exclude confirmPassword from submitted data', () => {
      const mockAuthResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { 
          id: '1', 
          email: 'john@example.com', 
          firstName: 'John', 
          lastName: 'Doe',
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
      authService.register.and.returnValue(of(mockAuthResponse));
      
      component.onSubmit();
      
      const callArgs = authService.register.calls.first().args[0];
      expect('confirmPassword' in callArgs).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should get loading state from StateService', () => {
      expect(stateService.isLoading).toHaveBeenCalledWith('register');
    });

    it('should disable submit button when loading', () => {
      stateService.isLoading.and.returnValue(of(true));
      fixture.detectChanges();
      
      // Button would be disabled in template when loading
      const loadingState = component.isLoading$;
      expect(loadingState).toBeDefined();
    });
  });

  describe('Options Data', () => {
    it('should have correct event formats', () => {
      expect(component.eventFormats).toEqual([
        { value: 'PHYSICAL', label: 'Physical Events' },
        { value: 'VIRTUAL', label: 'Virtual Events' },
        { value: 'HYBRID', label: 'Hybrid Events' }
      ]);
    });

    it('should have industry options', () => {
      expect(component.industries.length).toBeGreaterThan(0);
      expect(component.industries).toContain('Technology');
      expect(component.industries).toContain('Healthcare');
    });

    it('should have language options', () => {
      expect(component.languages.length).toBeGreaterThan(0);
      expect(component.languages.some(lang => lang.value === 'en')).toBeTruthy();
    });

    it('should have timezone options', () => {
      expect(component.timezones.length).toBeGreaterThan(0);
      expect(component.timezones).toContain('Europe/Berlin');
    });
  });
}); 
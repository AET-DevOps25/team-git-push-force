import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { StateService } from '../../core/services/state.service';
import { User } from '../../core/models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'VIRTUAL',
      industry: 'Technology',
      language: 'en',
      timezone: 'UTC'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(async () => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getUser']);
    stateServiceSpy.getUser.and.returnValue(of(null)); // Default return value

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should create', () => {
    stateService.getUser.and.returnValue(of(null));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize forms with default values', () => {
    stateService.getUser.and.returnValue(of(null));
    fixture.detectChanges();

    expect(component.profileForm.get('firstName')?.value).toBe('');
    expect(component.profileForm.get('lastName')?.value).toBe('');
    expect(component.profileForm.get('email')?.value).toBe('');
    expect(component.preferencesForm.get('preferredEventFormat')?.value).toBe('HYBRID');
    expect(component.preferencesForm.get('industry')?.value).toBe('Technology');
    expect(component.preferencesForm.get('language')?.value).toBe('en');
    expect(component.preferencesForm.get('timezone')?.value).toBe('Europe/Berlin');
  });

  it('should have correct options arrays', () => {
    stateService.getUser.and.returnValue(of(null));
    fixture.detectChanges();

    expect(component.eventFormats).toEqual([
      { value: 'PHYSICAL', label: 'Physical Events' },
      { value: 'VIRTUAL', label: 'Virtual Events' },
      { value: 'HYBRID', label: 'Hybrid Events' }
    ]);

    expect(component.industries).toContain('Technology');
    expect(component.industries).toContain('Healthcare');
    expect(component.languages.length).toBeGreaterThan(0);
    expect(component.timezones).toContain('UTC');
  });

        describe('User Data Loading', () => {
     it('should load user data when user exists', () => {
       // Reset the service spy to return the mock user for this specific test
       stateService.getUser.and.returnValue(of(mockUser));
       
       // Re-initialize the component to pick up the new observable
       component = new ProfileComponent(TestBed.inject(FormBuilder), stateService);
       component.ngOnInit();

       expect(component.profileForm.get('firstName')?.value).toBe('John');
       expect(component.profileForm.get('lastName')?.value).toBe('Doe');
       expect(component.profileForm.get('email')?.value).toBe('test@example.com');
       expect(component.preferencesForm.get('preferredEventFormat')?.value).toBe('VIRTUAL');
       expect(component.preferencesForm.get('industry')?.value).toBe('Technology');
       expect(component.preferencesForm.get('language')?.value).toBe('en');
       expect(component.preferencesForm.get('timezone')?.value).toBe('UTC');
     });

    it('should not load data when user is null', () => {
      stateService.getUser.and.returnValue(of(null));
      fixture.detectChanges();

      expect(component.profileForm.get('firstName')?.value).toBe('');
      expect(component.profileForm.get('lastName')?.value).toBe('');
      expect(component.profileForm.get('email')?.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      stateService.getUser.and.returnValue(of(null));
      fixture.detectChanges();
    });

    it('should validate required fields', () => {
      expect(component.profileForm.get('firstName')?.hasError('required')).toBeTruthy();
      expect(component.profileForm.get('lastName')?.hasError('required')).toBeTruthy();
      expect(component.profileForm.get('email')?.hasError('required')).toBeTruthy();

      component.profileForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com'
      });

      expect(component.profileForm.get('firstName')?.hasError('required')).toBeFalsy();
      expect(component.profileForm.get('lastName')?.hasError('required')).toBeFalsy();
      expect(component.profileForm.get('email')?.hasError('required')).toBeFalsy();
    });

    it('should validate minimum length', () => {
      component.profileForm.get('firstName')?.setValue('J');
      component.profileForm.get('lastName')?.setValue('D');

      expect(component.profileForm.get('firstName')?.hasError('minlength')).toBeTruthy();
      expect(component.profileForm.get('lastName')?.hasError('minlength')).toBeTruthy();

      component.profileForm.get('firstName')?.setValue('John');
      component.profileForm.get('lastName')?.setValue('Doe');

      expect(component.profileForm.get('firstName')?.hasError('minlength')).toBeFalsy();
      expect(component.profileForm.get('lastName')?.hasError('minlength')).toBeFalsy();
    });

    it('should validate email format', () => {
      component.profileForm.get('email')?.setValue('invalid-email');
      expect(component.profileForm.get('email')?.hasError('email')).toBeTruthy();

      component.profileForm.get('email')?.setValue('test@example.com');
      expect(component.profileForm.get('email')?.hasError('email')).toBeFalsy();
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      stateService.getUser.and.returnValue(of(null));
      fixture.detectChanges();
    });

    it('should return required error message', () => {
      expect(component.getFieldErrorMessage(component.profileForm, 'firstName')).toBe('firstName is required');
    });

    it('should return email error message', () => {
      component.profileForm.get('email')?.setValue('invalid');
      expect(component.getFieldErrorMessage(component.profileForm, 'email')).toBe('Please enter a valid email');
    });

    it('should return minlength error message', () => {
      component.profileForm.get('firstName')?.setValue('J');
      expect(component.getFieldErrorMessage(component.profileForm, 'firstName')).toBe('Minimum 2 characters required');
    });

    it('should return empty string for no errors', () => {
      component.profileForm.get('firstName')?.setValue('John');
      expect(component.getFieldErrorMessage(component.profileForm, 'firstName')).toBe('');
    });

    it('should handle field without errors object', () => {
      component.profileForm.get('firstName')?.setValue('John');
      // Mock a field without errors
      const field = component.profileForm.get('firstName');
      if (field) {
        (field as any).errors = null;
      }
      expect(component.getFieldErrorMessage(component.profileForm, 'firstName')).toBe('');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      stateService.getUser.and.returnValue(of(null));
      fixture.detectChanges();
      spyOn(window, 'alert');
    });

    it('should save profile when form is valid', () => {
      component.profileForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com'
      });

      component.onSaveProfile();

      expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
    });

    it('should not save profile when form is invalid', () => {
      component.profileForm.patchValue({
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email'
      });

      component.onSaveProfile();

      expect(window.alert).not.toHaveBeenCalled();
    });

    it('should save preferences when form is valid', () => {
      component.preferencesForm.patchValue({
        preferredEventFormat: 'PHYSICAL',
        industry: 'Healthcare',
        language: 'de',
        timezone: 'Europe/Berlin'
      });

      component.onSavePreferences();

      expect(window.alert).toHaveBeenCalledWith('Preferences updated successfully!');
    });

    it('should handle invalid preferences form', () => {
      // Since preferences form has no required validators, it should always be valid
      // But let's test the validation check anyway
      component.onSavePreferences();

      expect(window.alert).toHaveBeenCalledWith('Preferences updated successfully!');
    });
  });
}); 
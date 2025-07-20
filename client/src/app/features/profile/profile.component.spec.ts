import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { StateService, UserService } from '../../core/services';
import { User, UpdateUserRequest } from '../../core/models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let userService: jasmine.SpyObj<UserService>;

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
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getUser', 'setUser']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['updateUserProfile']);
    
    stateServiceSpy.getUser.and.returnValue(of(null)); // Default return value

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
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
      component = new ProfileComponent(TestBed.inject(FormBuilder), stateService, userService);
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
      
      // Enable email field to test validation since it's disabled by default
      component.profileForm.get('email')?.enable();
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
      // Enable email field to test validation since it's disabled by default
      component.profileForm.get('email')?.enable();
      component.profileForm.get('email')?.setValue('invalid-email');
      expect(component.profileForm.get('email')?.hasError('email')).toBeTruthy();

      component.profileForm.get('email')?.setValue('test@example.com');
      expect(component.profileForm.get('email')?.hasError('email')).toBeFalsy();
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      stateService.getUser.and.returnValue(of(null));
      fixture.detectChanges();
    });

    it('should return correct format icons', () => {
      expect(component.getFormatIcon('PHYSICAL')).toBe('place');
      expect(component.getFormatIcon('VIRTUAL')).toBe('videocam');
      expect(component.getFormatIcon('HYBRID')).toBe('hub');
      expect(component.getFormatIcon('UNKNOWN')).toBe('event');
    });

    it('should return correct format labels', () => {
      expect(component.getFormatLabel('PHYSICAL')).toBe('Physical Events');
      expect(component.getFormatLabel('VIRTUAL')).toBe('Virtual Events');
      expect(component.getFormatLabel('HYBRID')).toBe('Hybrid Events');
      expect(component.getFormatLabel('UNKNOWN')).toBe('UNKNOWN');
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
      // Enable the email field first since it's disabled by default
      component.profileForm.get('email')?.enable();
      component.profileForm.get('email')?.setValue('invalid');
      component.profileForm.get('email')?.markAsTouched(); // Trigger validation
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
      spyOn(console, 'log');
      spyOn(console, 'error');
    });

    describe('Profile Update', () => {
      it('should update profile when form is valid', () => {
        const updatedUser = { ...mockUser, firstName: 'Jane', lastName: 'Smith' };
        userService.updateUserProfile.and.returnValue(of(updatedUser));

        component.profileForm.patchValue({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'test@example.com'
        });

        component.onSaveProfile();

        const expectedRequest: UpdateUserRequest = {
          firstName: 'Jane',
          lastName: 'Smith'
        };

        expect(userService.updateUserProfile).toHaveBeenCalledWith(expectedRequest);
        expect(stateService.setUser).toHaveBeenCalledWith(updatedUser);
        expect(console.log).toHaveBeenCalledWith('Profile updated successfully:', updatedUser);
        expect(component.isLoading).toBeFalsy();
      });

      it('should not update profile when form is invalid', () => {
        component.profileForm.patchValue({
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email'
        });

        component.onSaveProfile();

        expect(userService.updateUserProfile).not.toHaveBeenCalled();
        expect(console.log).not.toHaveBeenCalled();
      });

      it('should handle profile update error', () => {
        const error = new Error('Update failed');
        userService.updateUserProfile.and.returnValue(throwError(() => error));

        component.profileForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com'
        });

        component.onSaveProfile();

        expect(userService.updateUserProfile).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Error updating profile:', error);
        expect(component.isLoading).toBeFalsy();
      });

      it('should set loading state during profile update', () => {
        userService.updateUserProfile.and.returnValue(of(mockUser));

        component.profileForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com'
        });

        expect(component.isLoading).toBeFalsy();
        component.onSaveProfile();
        expect(component.isLoading).toBeFalsy(); // Observable completes synchronously in test
      });
    });

    describe('Preferences Update', () => {
      it('should update preferences when form is valid', () => {
        const updatedUser: User = { 
          ...mockUser, 
          preferences: { 
            preferredEventFormat: 'PHYSICAL' as const, 
            industry: 'Healthcare',
            language: 'de',
            timezone: 'Europe/Berlin'
          } 
        };
        userService.updateUserProfile.and.returnValue(of(updatedUser));

        component.preferencesForm.patchValue({
          preferredEventFormat: 'PHYSICAL',
          industry: 'Healthcare',
          language: 'de',
          timezone: 'Europe/Berlin'
        });

        component.onSavePreferences();

        const expectedRequest: UpdateUserRequest = {
          preferences: {
            preferredEventFormat: 'PHYSICAL',
            industry: 'Healthcare',
            language: 'de',
            timezone: 'Europe/Berlin'
          }
        };

        expect(userService.updateUserProfile).toHaveBeenCalledWith(expectedRequest);
        expect(stateService.setUser).toHaveBeenCalledWith(updatedUser);
        expect(console.log).toHaveBeenCalledWith('Preferences updated successfully:', updatedUser);
        expect(component.isLoading).toBeFalsy();
      });

      it('should handle preferences update error', () => {
        const error = new Error('Update failed');
        userService.updateUserProfile.and.returnValue(throwError(() => error));

        component.onSavePreferences();

        expect(userService.updateUserProfile).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Error updating preferences:', error);
        expect(component.isLoading).toBeFalsy();
      });

      it('should not update when already loading', () => {
        component.isLoading = true;
        
        component.onSaveProfile();
        component.onSavePreferences();

        expect(userService.updateUserProfile).not.toHaveBeenCalled();
      });
    });
  });
}); 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { StateService, UserService } from '../../core/services';
import { User, UpdateUserRequest } from '../../core/models/user.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null>;
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  private _isLoading = false;

  eventFormats = [
    { value: 'PHYSICAL', label: 'Physical Events' },
    { value: 'VIRTUAL', label: 'Virtual Events' },
    { value: 'HYBRID', label: 'Hybrid Events' }
  ];

  industries = [
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Marketing',
    'Non-profit',
    'Government',
    'Other'
  ];

  languages = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'German' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  timezones = [
    'UTC',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo'
  ];

  constructor(
    private fb: FormBuilder,
    private stateService: StateService,
    private userService: UserService
  ) {
    this.user$ = this.stateService.getUser();

    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]]
    });

    this.preferencesForm = this.fb.group({
      preferredEventFormat: ['HYBRID'],
      industry: ['Technology'],
      language: ['en'],
      timezone: ['Europe/Berlin']
    });
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    this._isLoading = value;
    if (value) {
      this.disableFormControls();
    } else {
      this.enableFormControls();
    }
  }

  get isProfileFormDisabled(): boolean {
    return this.profileForm.invalid || this.isLoading;
  }

  get isPreferencesFormDisabled(): boolean {
    return this.preferencesForm.invalid || this.isLoading;
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private disableFormControls(): void {
    // Disable profile form controls except email (already disabled)
    this.profileForm.get('firstName')?.disable();
    this.profileForm.get('lastName')?.disable();
    
    // Disable preferences form controls
    this.preferencesForm.get('preferredEventFormat')?.disable();
    this.preferencesForm.get('industry')?.disable();
    this.preferencesForm.get('language')?.disable();
    this.preferencesForm.get('timezone')?.disable();
  }

  private enableFormControls(): void {
    // Enable profile form controls except email (keep disabled)
    this.profileForm.get('firstName')?.enable();
    this.profileForm.get('lastName')?.enable();
    
    // Enable preferences form controls
    this.preferencesForm.get('preferredEventFormat')?.enable();
    this.preferencesForm.get('industry')?.enable();
    this.preferencesForm.get('language')?.enable();
    this.preferencesForm.get('timezone')?.enable();
  }

  private loadUserData(): void {
    this.user$.subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });

        this.preferencesForm.patchValue(user.preferences);
      }
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.valid && !this.isLoading) {
      this.isLoading = true;

      const updateRequest: UpdateUserRequest = {
        firstName: this.profileForm.get('firstName')?.value,
        lastName: this.profileForm.get('lastName')?.value,
        // Note: email updates might need special handling/verification
      };

      this.userService.updateUserProfile(updateRequest).subscribe({
        next: (updatedUser) => {
          console.log('Profile updated successfully:', updatedUser);
          // Update the state with the new user data
          this.stateService.setUser(updatedUser);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onSavePreferences(): void {
    if (this.preferencesForm.valid && !this.isLoading) {
      this.isLoading = true;

      const updateRequest: UpdateUserRequest = {
        preferences: {
          preferredEventFormat: this.preferencesForm.get('preferredEventFormat')?.value,
          industry: this.preferencesForm.get('industry')?.value,
          language: this.preferencesForm.get('language')?.value,
          timezone: this.preferencesForm.get('timezone')?.value
        }
      };

      this.userService.updateUserProfile(updateRequest).subscribe({
        next: (updatedUser) => {
          console.log('Preferences updated successfully:', updatedUser);
          // Update the state with the new user data
          this.stateService.setUser(updatedUser);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating preferences:', error);
          this.isLoading = false;
        }
      });
    }
  }

  getFieldErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    return '';
  }

  getFormatIcon(format: string): string {
    switch (format) {
      case 'PHYSICAL': return 'place';
      case 'VIRTUAL': return 'videocam';
      case 'HYBRID': return 'hub';
      default: return 'event';
    }
  }

  getFormatLabel(format: string): string {
    const formatObj = this.eventFormats.find(f => f.value === format);
    return formatObj ? formatObj.label : format;
  }
} 
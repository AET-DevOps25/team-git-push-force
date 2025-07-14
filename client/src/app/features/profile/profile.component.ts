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
import { StateService } from '../../core/services/state.service';
import { User } from '../../core/models/user.model';
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
    private stateService: StateService
  ) {
    this.user$ = this.stateService.getUser();

    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.preferencesForm = this.fb.group({
      preferredEventFormat: ['HYBRID'],
      industry: ['Technology'],
      language: ['en'],
      timezone: ['Europe/Berlin']
    });
  }

  ngOnInit(): void {
    this.loadUserData();
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
    if (this.profileForm.valid) {
      // For MVP, just show success message
      alert('Profile updated successfully!');
    }
  }

  onSavePreferences(): void {
    if (this.preferencesForm.valid) {
      // For MVP, just show success message
      alert('Preferences updated successfully!');
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
} 
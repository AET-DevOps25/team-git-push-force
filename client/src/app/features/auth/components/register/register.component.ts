import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { StateService } from '../../../../core/services/state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  basicInfoForm: FormGroup;
  preferencesForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading$: Observable<boolean>;

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
    private authService: AuthService,
    private stateService: StateService,
    private router: Router
  ) {
    this.basicInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.preferencesForm = this.fb.group({
      preferredEventFormat: ['HYBRID', Validators.required],
      industry: ['Technology', Validators.required],
      language: ['en', Validators.required],
      timezone: ['Europe/Berlin', Validators.required]
    });

    this.isLoading$ = this.stateService.isLoading('register');
  }

  ngOnInit(): void {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.basicInfoForm.valid && this.preferencesForm.valid) {
      this.stateService.setLoading('register', true);
      
      const { confirmPassword, ...basicInfo } = this.basicInfoForm.value;
      const preferences = this.preferencesForm.value;
      
      const registerData = {
        ...basicInfo,
        preferences
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.stateService.setLoading('register', false);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.stateService.setLoading('register', false);
        }
      });
    }
  }

  getFieldErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
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
    if (field?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }
} 
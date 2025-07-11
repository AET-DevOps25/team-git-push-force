import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { StateService, ConceptService } from '../../../../core/services';
import { CreateConceptRequest } from '../../../../core/models/concept.model';

@Component({
  selector: 'app-create-concept',
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
    MatChipsModule,
    MatStepperModule
  ],
  templateUrl: './create-concept.component.html',
  styleUrl: './create-concept.component.scss'
})
export class CreateConceptComponent implements OnInit {
  basicInfoForm: FormGroup;
  eventDetailsForm: FormGroup;
  additionalInfoForm: FormGroup;
  
  eventFormats = [
    { value: 'PHYSICAL', label: 'Physical Event' },
    { value: 'VIRTUAL', label: 'Virtual Event' },
    { value: 'HYBRID', label: 'Hybrid Event' }
  ];

  constructor(
    private fb: FormBuilder,
    private stateService: StateService,
    private conceptService: ConceptService,
    private router: Router
  ) {
    this.basicInfoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      targetAudience: ['']
    });

    this.eventDetailsForm = this.fb.group({
      preferredFormat: ['HYBRID'],
      expectedCapacity: [''],
      duration: [''],
      theme: ['']
    });

    this.additionalInfoForm = this.fb.group({
      budget: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.basicInfoForm.valid && this.eventDetailsForm.valid && this.additionalInfoForm.valid) {
      const basicInfo = this.basicInfoForm.value;
      const eventDetails = this.eventDetailsForm.value;
      const additionalInfo = this.additionalInfoForm.value;
      
      // Parse tags from comma-separated string
      const tags = additionalInfo.tags ? 
        additionalInfo.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : 
        [];

      const conceptRequest: CreateConceptRequest = {
        title: basicInfo.title,
        description: basicInfo.description,
        initialRequirements: {
          preferredFormat: eventDetails.preferredFormat,
          expectedCapacity: eventDetails.expectedCapacity ? parseInt(eventDetails.expectedCapacity) : undefined,
          duration: eventDetails.duration,
          targetAudience: basicInfo.targetAudience,
          theme: eventDetails.theme,
          budget: additionalInfo.budget
        },
        tags: tags
      };

      // Create concept using the service
      this.conceptService.createConcept(conceptRequest).subscribe({
        next: (concept) => {
          console.log('Concept created successfully:', concept);
          // Navigate to the new concept
          this.router.navigate(['/concepts', concept.id]);
        },
        error: (error) => {
          console.error('Error creating concept:', error);
          this.stateService.setError('Failed to create concept. Please try again.');
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/concepts']);
  }

  getFieldErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
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

  isStepValid(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0: return this.basicInfoForm.valid;
      case 1: return this.eventDetailsForm.valid;
      case 2: return this.additionalInfoForm.valid;
      default: return false;
    }
  }
} 
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
import { StateService } from '../../../../core/services/state.service';
import { Concept } from '../../../../core/models/concept.model';

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

      const newConcept: Concept = {
        id: this.generateId(),
        title: basicInfo.title,
        description: basicInfo.description,
        status: 'DRAFT',
        eventDetails: {
          format: eventDetails.preferredFormat,
          capacity: eventDetails.expectedCapacity ? parseInt(eventDetails.expectedCapacity) : undefined,
          duration: eventDetails.duration,
          targetAudience: basicInfo.targetAudience,
          objectives: [],
          theme: eventDetails.theme
        },
        agenda: [],
        speakers: [],
        tags: tags,
        notes: `Budget: ${additionalInfo.budget || 'Not specified'}`,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'current-user', // In real app, get from auth
        lastModifiedBy: 'current-user'
      };

      // Add to state
      this.stateService.addConcept(newConcept);
      
      // Navigate to the new concept
      this.router.navigate(['/concepts', newConcept.id]);
    }
  }

  onCancel(): void {
    this.router.navigate(['/concepts']);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
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
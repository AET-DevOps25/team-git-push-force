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
    MatChipsModule
  ],
  templateUrl: './create-concept.component.html',
  styleUrl: './create-concept.component.scss'
})
export class CreateConceptComponent implements OnInit {
  conceptForm: FormGroup;
  
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
    this.conceptForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      targetAudience: [''],
      expectedCapacity: [''],
      preferredFormat: ['HYBRID'],
      duration: [''],
      theme: [''],
      budget: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.conceptForm.valid) {
      const formValue = this.conceptForm.value;
      
      // Parse tags from comma-separated string
      const tags = formValue.tags ? 
        formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : 
        [];

      const newConcept: Concept = {
        id: this.generateId(),
        title: formValue.title,
        description: formValue.description,
        status: 'DRAFT',
        eventDetails: {
          format: formValue.preferredFormat,
          capacity: formValue.expectedCapacity ? parseInt(formValue.expectedCapacity) : undefined,
          duration: formValue.duration,
          targetAudience: formValue.targetAudience,
          objectives: [],
          theme: formValue.theme
        },
        agenda: [],
        speakers: [],
        tags: tags,
        notes: `Budget: ${formValue.budget || 'Not specified'}`,
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

  getFieldErrorMessage(fieldName: string): string {
    const field = this.conceptForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    return '';
  }
} 
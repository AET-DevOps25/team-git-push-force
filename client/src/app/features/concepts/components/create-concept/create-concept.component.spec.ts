import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { CreateConceptComponent } from './create-concept.component';
import { StateService } from '../../../../core/services/state.service';
import { ConceptService } from '../../../../core/services/concept.service';

describe('CreateConceptComponent', () => {
  let component: CreateConceptComponent;
  let fixture: ComponentFixture<CreateConceptComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let conceptService: jasmine.SpyObj<ConceptService>;
  let router: Router;

  beforeEach(async () => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['addConcept', 'setLoading']);
    const conceptServiceSpy = jasmine.createSpyObj('ConceptService', ['createConcept']);

    await TestBed.configureTestingModule({
      imports: [
        CreateConceptComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy },
        { provide: ConceptService, useValue: conceptServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateConceptComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    conceptService = TestBed.inject(ConceptService) as jasmine.SpyObj<ConceptService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms', () => {
    expect(component.basicInfoForm).toBeDefined();
    expect(component.eventDetailsForm).toBeDefined();
    expect(component.additionalInfoForm).toBeDefined();
  });

  it('should initialize with default values', () => {
    expect(component.basicInfoForm.get('title')?.value).toBe('');
    expect(component.basicInfoForm.get('description')?.value).toBe('');
    expect(component.eventDetailsForm.get('preferredFormat')?.value).toBe('HYBRID');
  });

  describe('Form Validation', () => {
    it('should require title field', () => {
      const titleControl = component.basicInfoForm.get('title');
      expect(titleControl?.valid).toBeFalsy();
      expect(titleControl?.hasError('required')).toBeTruthy();

      titleControl?.setValue('Test Event');
      expect(titleControl?.hasError('required')).toBeFalsy();
    });

    it('should require minimum length for title', () => {
      const titleControl = component.basicInfoForm.get('title');
      titleControl?.setValue('ab');
      expect(titleControl?.hasError('minlength')).toBeTruthy();

      titleControl?.setValue('Test Event');
      expect(titleControl?.hasError('minlength')).toBeFalsy();
    });

    it('should require description field', () => {
      const descControl = component.basicInfoForm.get('description');
      expect(descControl?.valid).toBeFalsy();
      expect(descControl?.hasError('required')).toBeTruthy();

      descControl?.setValue('A test description for the event');
      expect(descControl?.hasError('required')).toBeFalsy();
    });

    it('should require minimum length for description', () => {
      const descControl = component.basicInfoForm.get('description');
      descControl?.setValue('short');
      expect(descControl?.hasError('minlength')).toBeTruthy();

      descControl?.setValue('A test description for the event');
      expect(descControl?.hasError('minlength')).toBeFalsy();
    });
  });

  describe('Helper Methods', () => {
    it('should return correct format icons', () => {
      expect(component.getFormatIcon('PHYSICAL')).toBe('place');
      expect(component.getFormatIcon('VIRTUAL')).toBe('videocam');
      expect(component.getFormatIcon('HYBRID')).toBe('hub');
      expect(component.getFormatIcon('UNKNOWN')).toBe('event');
    });

    it('should return correct format labels', () => {
      expect(component.getFormatLabel('PHYSICAL')).toBe('Physical Event');
      expect(component.getFormatLabel('VIRTUAL')).toBe('Virtual Event');
      expect(component.getFormatLabel('HYBRID')).toBe('Hybrid Event');
      expect(component.getFormatLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should validate steps correctly', () => {
      // Initially invalid
      expect(component.isStepValid(0)).toBeFalsy();
      expect(component.isStepValid(1)).toBeTruthy(); // Event details form starts valid
      expect(component.isStepValid(2)).toBeTruthy(); // Additional info form starts valid

      // Make basic info valid
      component.basicInfoForm.patchValue({
        title: 'Test Event',
        description: 'A test description for the event'
      });
      expect(component.isStepValid(0)).toBeTruthy();
    });

    it('should return error messages', () => {
      const titleControl = component.basicInfoForm.get('title');
      
      expect(component.getFieldErrorMessage(component.basicInfoForm, 'title')).toBe('title is required');
      
      titleControl?.setValue('ab');
      titleControl?.markAsTouched();
      expect(component.getFieldErrorMessage(component.basicInfoForm, 'title')).toBe('Minimum 3 characters required');
    });


  });

  describe('Form Submission', () => {
    it('should not submit if forms are invalid', () => {
      component.onSubmit();
      
      expect(stateService.addConcept).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should submit and navigate when forms are valid', () => {
      // Make all forms valid
      component.basicInfoForm.patchValue({
        title: 'Test Event',
        description: 'A test description for the event',
        targetAudience: 'Developers'
      });

      component.eventDetailsForm.patchValue({
        preferredFormat: 'VIRTUAL',
        expectedCapacity: '100',
        duration: '2 days',
        theme: 'Technology'
      });

      component.additionalInfoForm.patchValue({
        budget: '10000',
        tags: 'tech, conference, AI'
      });

              const mockConcept = {
          id: '123',
          title: 'Test Event',
          description: 'A test description for the event',
          status: 'DRAFT' as const,
          agenda: [],
          speakers: [],
          tags: ['tech', 'conference', 'AI'],
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          lastModifiedBy: 'user1'
        };
        conceptService.createConcept.and.returnValue(of(mockConcept));

      component.onSubmit();

      expect(stateService.addConcept).toHaveBeenCalled();
      expect(conceptService.createConcept).toHaveBeenCalled();
      
      const addedConcept = stateService.addConcept.calls.mostRecent().args[0];
      expect(addedConcept.title).toBe('Test Event');
      expect(addedConcept.description).toBe('A test description for the event');
      expect(addedConcept.status).toBe('DRAFT');
      expect(addedConcept.tags).toEqual(['tech', 'conference', 'AI']);
      
      expect(router.navigate).toHaveBeenCalledWith(['/concepts', addedConcept.id]);
    });

    it('should handle empty tags', () => {
      component.basicInfoForm.patchValue({
        title: 'Test Event',
        description: 'A test description for the event'
      });

      component.additionalInfoForm.patchValue({
        tags: ''
      });

              const mockConcept = {
          id: '123',
          title: 'Test Event',
          description: 'A test description for the event',
          status: 'DRAFT' as const,
          agenda: [],
          speakers: [],
          tags: [],
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user1',
          lastModifiedBy: 'user1'
        };
        conceptService.createConcept.and.returnValue(of(mockConcept));

      component.onSubmit();

      const addedConcept = stateService.addConcept.calls.mostRecent().args[0];
      expect(addedConcept.tags).toEqual([]);
    });
  });

  describe('Navigation', () => {
    it('should navigate to concepts list on cancel', () => {
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts']);
    });
  });
}); 
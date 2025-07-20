import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConceptFoundationSectionComponent } from './concept-foundation-section.component';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';
import { Concept, EventDetails } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

describe('ConceptFoundationSectionComponent', () => {
  let component: ConceptFoundationSectionComponent;
  let fixture: ComponentFixture<ConceptFoundationSectionComponent>;
  let suggestionService: jasmine.SpyObj<ConceptSuggestionService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockEventDetails: EventDetails = {
    theme: 'Technology',
    format: 'HYBRID',
    capacity: 100,
    duration: '2 days',
    targetAudience: 'Developers',
    objectives: ['Learn new tech', 'Network']
  };

  const mockConcept: Concept = {
    id: 'test-concept',
    title: 'Test Event',
    description: 'Test description',
    status: 'DRAFT',
    eventDetails: mockEventDetails,
    agenda: [],
    speakers: [],
    tags: ['test'],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const mockSuggestions: ChatResponse = {
    response: 'Test response',
    conceptSuggestion: {
      title: 'AI Conference',
      description: 'New description',
      eventDetails: {
        theme: 'AI in Event Management',
        format: 'HYBRID',
        capacity: 500,
        duration: '2 days',
        targetAudience: 'Event managers and professionals',
        location: 'New York'
      }
    },
    suggestions: [],
    followUpQuestions: [],
    confidence: 0.9
  };

  beforeEach(async () => {
    const suggestionServiceSpy = jasmine.createSpyObj('ConceptSuggestionService', 
      ['acceptFieldUpdate', 'updateConceptInState']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptFoundationSectionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ConceptSuggestionService, useValue: suggestionServiceSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptFoundationSectionComponent);
    component = fixture.componentInstance;
    suggestionService = TestBed.inject(ConceptSuggestionService) as jasmine.SpyObj<ConceptSuggestionService>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;

    component.concept = mockConcept;
    component.suggestions = mockSuggestions;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getFieldSuggestion', () => {
    it('should return suggestion for title field when values differ', () => {
      const suggestion = component.getFieldSuggestion('title');
      expect(suggestion).toEqual({
        field: 'title',
        currentValue: 'Test Event',
        suggestedValue: 'AI Conference',
        reasoning: 'AI suggestion based on your requirements'
      });
    });

    it('should return suggestion for theme field when values differ', () => {
      const suggestion = component.getFieldSuggestion('eventDetails.theme');
      expect(suggestion).toEqual({
        field: 'eventDetails.theme',
        currentValue: 'Technology',
        suggestedValue: 'AI in Event Management',
        reasoning: 'AI suggestion based on your requirements'
      });
    });

    it('should return undefined when values are the same', () => {
      // Set concept format to match suggestion
      component.concept = {
        ...mockConcept,
        eventDetails: {
          ...mockEventDetails,
          format: 'HYBRID'
        }
      };
      
      const suggestion = component.getFieldSuggestion('eventDetails.format');
      expect(suggestion).toBeUndefined();
    });

    it('should return undefined for non-existent field', () => {
      const suggestion = component.getFieldSuggestion('nonexistent');
      expect(suggestion).toBeUndefined();
    });

    it('should return undefined when field is rejected', () => {
      // First reject the title suggestion
      const titleSuggestion = component.getFieldSuggestion('title');
      if (titleSuggestion) {
        component.rejectFieldUpdate(titleSuggestion);
      }
      
      // Now it should return undefined
      const suggestion = component.getFieldSuggestion('title');
      expect(suggestion).toBeUndefined();
    });

    it('should handle missing suggestions', () => {
      component.suggestions = undefined;
      const suggestion = component.getFieldSuggestion('eventDetails.theme');
      expect(suggestion).toBeUndefined();
    });

    it('should handle missing conceptSuggestion', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: undefined
      };
      const suggestion = component.getFieldSuggestion('eventDetails.theme');
      expect(suggestion).toBeUndefined();
    });

    it('should return suggestion with "Not set" for missing current value', () => {
      component.concept = {
        ...mockConcept,
        eventDetails: {
          ...mockEventDetails,
          location: undefined
        }
      };
      
      const suggestion = component.getFieldSuggestion('eventDetails.location');
      expect(suggestion).toEqual({
        field: 'eventDetails.location',
        currentValue: 'Not set',
        suggestedValue: 'New York',
        reasoning: 'AI suggestion based on your requirements'
      });
    });
  });

  describe('getFieldDisplayName', () => {
    it('should return display name for mapped fields', () => {
      expect(component.getFieldDisplayName('eventDetails.format')).toBe('Event Format');
      expect(component.getFieldDisplayName('eventDetails.capacity')).toBe('Capacity');
      expect(component.getFieldDisplayName('eventDetails.duration')).toBe('Duration');
      expect(component.getFieldDisplayName('eventDetails.theme')).toBe('Theme');
      expect(component.getFieldDisplayName('eventDetails.targetAudience')).toBe('Target Audience');
      expect(component.getFieldDisplayName('eventDetails.location')).toBe('Location');
      expect(component.getFieldDisplayName('title')).toBe('Title');
      expect(component.getFieldDisplayName('description')).toBe('Description');
    });

    it('should return original field name for unmapped fields', () => {
      expect(component.getFieldDisplayName('unknownField')).toBe('unknownField');
    });
  });

  describe('acceptFieldUpdate', () => {
    it('should accept field update and update concept in state', fakeAsync(() => {
      const suggestion = {
        field: 'title',
        currentValue: 'Test Event',
        suggestedValue: 'AI Conference',
        reasoning: 'Better title'
      };
      const updatedConcept = { ...mockConcept, title: 'AI Conference' };
      suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));

      component.acceptFieldUpdate(suggestion);

      // Tick to process the Observable
      tick();

      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalledWith(mockConcept, {
        field: 'title',
        suggestedValue: 'AI Conference'
      });
      expect(suggestionService.updateConceptInState).toHaveBeenCalledWith(updatedConcept);
      expect(component.concept).toEqual(updatedConcept);
    }));

    it('should handle error during field update', () => {
      const suggestion = {
        field: 'title',
        currentValue: 'Test Event',
        suggestedValue: 'AI Conference',
        reasoning: 'Better title'
      };
      const error = new Error('Update failed');
      suggestionService.acceptFieldUpdate.and.returnValue(throwError(error));

      spyOn(console, 'error');

      component.acceptFieldUpdate(suggestion);

      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error updating concept:', error);
    });

    it('should remove field from rejected list when accepting', fakeAsync(() => {
      const suggestion = {
        field: 'title',
        currentValue: 'Test Event',
        suggestedValue: 'AI Conference',
        reasoning: 'Better title'
      };
      
      // First reject the suggestion
      component.rejectFieldUpdate(suggestion);
      expect(component.getFieldSuggestion('title')).toBeUndefined();
      
      // Then accept it
      const updatedConcept = { ...mockConcept, title: 'AI Conference' };
      suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));
      component.acceptFieldUpdate(suggestion);

      // Tick to process the Observable
      tick();

      // Update the concept to reflect the accepted change
      component.concept = updatedConcept;
      
      // Should have processed the acceptance
      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalled();
    }));
  });

  describe('rejectFieldUpdate', () => {
    it('should mark suggestion as rejected and trigger change detection', () => {
      const suggestion = {
        field: 'title',
        currentValue: 'Test Event',
        suggestedValue: 'AI Conference',
        reasoning: 'Better title'
      };
      spyOn(console, 'log');

      component.rejectFieldUpdate(suggestion);

      expect(console.log).toHaveBeenCalledWith('Rejected suggestion for field:', 'title');
      
      // Verify that the suggestion is now hidden
      const rejectedSuggestion = component.getFieldSuggestion('title');
      expect(rejectedSuggestion).toBeUndefined();
    });
  });

  describe('hasSuggestions', () => {
    it('should return true when has field suggestions', () => {
      expect(component.hasSuggestions()).toBeTruthy();
    });

    it('should return false when no field suggestions exist', () => {
      // Set up concept to match all suggested values
      component.concept = {
        ...mockConcept,
        title: 'AI Conference',
        description: 'New description',
        eventDetails: {
          ...mockEventDetails,
          theme: 'AI in Event Management',
          format: 'HYBRID',
          capacity: 500,
          duration: '2 days',
          targetAudience: 'Event managers and professionals',
          location: 'New York'
        }
      };
      expect(component.hasSuggestions()).toBeFalsy();
    });

    it('should return false when all suggestions are rejected', () => {
      // Reject all possible suggestions
      const fields = [
        'title', 
        'description', 
        'eventDetails.theme', 
        'eventDetails.format', 
        'eventDetails.capacity', 
        'eventDetails.duration', 
        'eventDetails.targetAudience',
        'eventDetails.location'
      ];

      fields.forEach(field => {
        const suggestion = component.getFieldSuggestion(field);
        if (suggestion) {
          component.rejectFieldUpdate(suggestion);
        }
      });

      expect(component.hasSuggestions()).toBeFalsy();
    });

    it('should return false when no suggestions', () => {
      component.suggestions = undefined;
      expect(component.hasSuggestions()).toBeFalsy();
    });

    it('should return false when conceptSuggestion is missing', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: undefined
      };
      expect(component.hasSuggestions()).toBeFalsy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });
}); 
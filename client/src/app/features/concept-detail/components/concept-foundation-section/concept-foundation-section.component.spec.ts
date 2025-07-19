import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ConceptFoundationSectionComponent } from './concept-foundation-section.component';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';
import { Concept, EventDetails } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

describe('ConceptFoundationSectionComponent', () => {
  let component: ConceptFoundationSectionComponent;
  let fixture: ComponentFixture<ConceptFoundationSectionComponent>;
  let suggestionService: jasmine.SpyObj<ConceptSuggestionService>;

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
    conceptUpdates: {
      suggestions: [
        {
          field: 'eventDetails.theme',
          currentValue: 'Technology',
          suggestedValue: 'Innovation',
          reasoning: 'Better theme'
        },
        {
          field: 'title',
          currentValue: 'Test Event',
          suggestedValue: 'New Title',
          reasoning: 'More engaging'
        }
      ]
    },
    suggestions: [],
    followUpQuestions: [],
    confidence: 0.9
  };

  beforeEach(async () => {
    const suggestionServiceSpy = jasmine.createSpyObj('ConceptSuggestionService', 
      ['acceptFieldUpdate', 'updateConceptInState']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptFoundationSectionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ConceptSuggestionService, useValue: suggestionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptFoundationSectionComponent);
    component = fixture.componentInstance;
    suggestionService = TestBed.inject(ConceptSuggestionService) as jasmine.SpyObj<ConceptSuggestionService>;

    component.concept = mockConcept;
    component.suggestions = mockSuggestions;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getFieldSuggestion', () => {
    it('should return suggestion for field', () => {
      // Recreate the suggestions to ensure fresh data
      component.suggestions = {
        response: 'Test response',
        conceptUpdates: {
          suggestions: [
            {
              field: 'eventDetails.theme',
              currentValue: 'Technology',
              suggestedValue: 'Innovation',
              reasoning: 'Better theme'
            },
            {
              field: 'title',
              currentValue: 'Test Event',
              suggestedValue: 'New Title',
              reasoning: 'More engaging'
            }
          ]
        },
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };
      
      const suggestion = component.getFieldSuggestion('eventDetails.theme');
      expect(suggestion).toEqual({
        field: 'eventDetails.theme',
        currentValue: 'Technology',
        suggestedValue: 'Innovation',
        reasoning: 'Better theme'
      });
    });

    it('should return undefined for non-existent field', () => {
      const suggestion = component.getFieldSuggestion('nonexistent');
      expect(suggestion).toBeUndefined();
    });

    it('should handle missing suggestions', () => {
      component.suggestions = undefined;
      const suggestion = component.getFieldSuggestion('eventDetails.theme');
      expect(suggestion).toBeUndefined();
    });
  });

  describe('getFieldDisplayName', () => {
    it('should return display name for mapped fields', () => {
      expect(component.getFieldDisplayName('eventDetails.format')).toBe('Event Format');
      expect(component.getFieldDisplayName('eventDetails.capacity')).toBe('Capacity');
      expect(component.getFieldDisplayName('eventDetails.duration')).toBe('Duration');
      expect(component.getFieldDisplayName('eventDetails.theme')).toBe('Theme');
      expect(component.getFieldDisplayName('eventDetails.targetAudience')).toBe('Target Audience');
      expect(component.getFieldDisplayName('title')).toBe('Title');
      expect(component.getFieldDisplayName('description')).toBe('Description');
    });

    it('should return original field name for unmapped fields', () => {
      expect(component.getFieldDisplayName('unknownField')).toBe('unknownField');
    });
  });

  describe('acceptFieldUpdate', () => {
    it('should accept field update and update concept in state', () => {
      const update = { field: 'title', suggestedValue: 'New Title' };
      const updatedConcept = { ...mockConcept, title: 'New Title' };
      suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));

      spyOn(component, 'clearSuggestion' as any);

      component.acceptFieldUpdate(update);

      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalledWith(mockConcept, update);
      expect(suggestionService.updateConceptInState).toHaveBeenCalledWith(updatedConcept);
      expect((component as any).clearSuggestion).toHaveBeenCalledWith('update', update);
    });

    it('should handle error during field update', () => {
      const update = { field: 'title', suggestedValue: 'New Title' };
      const error = new Error('Update failed');
      suggestionService.acceptFieldUpdate.and.returnValue(throwError(error));

      spyOn(console, 'error');

      component.acceptFieldUpdate(update);

      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalledWith(mockConcept, update);
      expect(console.error).toHaveBeenCalledWith('Error updating concept:', error);
    });
  });

  describe('rejectFieldUpdate', () => {
    it('should reject field update by clearing suggestion', () => {
      const update = { field: 'title', suggestedValue: 'New Title' };
      spyOn(component, 'clearSuggestion' as any);

      component.rejectFieldUpdate(update);

      expect((component as any).clearSuggestion).toHaveBeenCalledWith('update', update);
    });
  });

  describe('isComplete', () => {
    it('should return true when section is complete', () => {
      expect(component.isComplete()).toBeTruthy();
    });

    it('should return false when theme is missing', () => {
      component.concept = {
        ...mockConcept,
        eventDetails: {
          ...mockEventDetails,
          theme: undefined
        }
      };
      expect(component.isComplete()).toBeFalsy();
    });

    it('should return false when objectives are missing', () => {
      component.concept = {
        ...mockConcept,
        eventDetails: {
          ...mockEventDetails,
          objectives: []
        }
      };
      expect(component.isComplete()).toBeFalsy();
    });

    it('should return false when target audience is missing', () => {
      component.concept = {
        ...mockConcept,
        eventDetails: {
          ...mockEventDetails,
          targetAudience: undefined
        }
      };
      expect(component.isComplete()).toBeFalsy();
    });

    it('should return false when eventDetails is missing', () => {
      component.concept = {
        ...mockConcept,
        eventDetails: undefined
      };
      expect(component.isComplete()).toBeFalsy();
    });
  });

  describe('hasSuggestions', () => {
    it('should return true when has eventDetails suggestions', () => {
      expect(component.hasSuggestions()).toBeTruthy();
    });

    it('should return true when has title suggestions', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptUpdates: {
          suggestions: [
            { field: 'title', currentValue: 'Test Event', suggestedValue: 'New Title', reasoning: 'Better' }
          ]
        }
      };
      expect(component.hasSuggestions()).toBeTruthy();
    });

    it('should return true when has description suggestions', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptUpdates: {
          suggestions: [
            { field: 'description', currentValue: 'Test description', suggestedValue: 'New Description', reasoning: 'Better' }
          ]
        }
      };
      expect(component.hasSuggestions()).toBeTruthy();
    });

    it('should return false when no relevant suggestions', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptUpdates: {
          suggestions: [
            { field: 'otherField', currentValue: 'Old Value', suggestedValue: 'Value', reasoning: 'Reason' }
          ]
        }
      };
      expect(component.hasSuggestions()).toBeFalsy();
    });

    it('should return false when no suggestions', () => {
      component.suggestions = undefined;
      expect(component.hasSuggestions()).toBeFalsy();
    });

    it('should return false when conceptUpdates is missing', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptUpdates: undefined
      };
      expect(component.hasSuggestions()).toBeFalsy();
    });
  });

  describe('clearSuggestion', () => {
    it('should clear update suggestion', () => {
      const update = mockSuggestions.conceptUpdates!.suggestions[0];
      const initialLength = component.suggestions!.conceptUpdates!.suggestions.length;
      
      (component as any).clearSuggestion('update', update);
      
      expect(component.suggestions!.conceptUpdates!.suggestions.length).toBe(initialLength - 1);
      expect(component.suggestions!.conceptUpdates!.suggestions).not.toContain(update);
    });

    it('should handle missing suggestions', () => {
      component.suggestions = undefined;
      
      expect(() => {
        (component as any).clearSuggestion('update', {});
      }).not.toThrow();
    });

    it('should handle missing conceptUpdates', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptUpdates: undefined
      };
      
      expect(() => {
        (component as any).clearSuggestion('update', {});
      }).not.toThrow();
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
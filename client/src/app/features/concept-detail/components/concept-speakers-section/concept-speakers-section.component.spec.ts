import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ConceptSpeakersSectionComponent } from './concept-speakers-section.component';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';
import { Concept, Speaker } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

describe('ConceptSpeakersSectionComponent', () => {
  let component: ConceptSpeakersSectionComponent;
  let fixture: ComponentFixture<ConceptSpeakersSectionComponent>;
  let suggestionService: jasmine.SpyObj<ConceptSuggestionService>;

  const mockSpeakers: Speaker[] = [
    {
      id: 'speaker-1',
      name: 'John Doe',
      expertise: 'Technology',
      suggestedTopic: 'AI Trends',
      bio: 'Expert in AI',
      confirmed: false
    }
  ];

  const mockConcept: Concept = {
    id: 'test-concept',
    title: 'Test Event',
    description: 'Test description',
    status: 'DRAFT',
    agenda: [],
    speakers: mockSpeakers,
    tags: ['test'],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const mockSuggestedSpeakers = [
    {
      name: 'Jane Smith',
      expertise: 'Design',
      suggestedTopic: 'UX Principles',
      bio: 'UX expert with 10 years experience'
    },
    {
      name: 'Bob Johnson',
      expertise: 'Marketing',
      suggestedTopic: 'Digital Marketing',
      bio: 'Marketing strategist'
    }
  ];

  const mockSuggestions: ChatResponse = {
    response: 'Test response',
    conceptSuggestion: {
      speakers: mockSuggestedSpeakers
    },
    suggestions: [],
    followUpQuestions: [],
    confidence: 0.9
  };

  beforeEach(async () => {
    const suggestionServiceSpy = jasmine.createSpyObj('ConceptSuggestionService', 
      ['acceptSpeaker', 'updateConceptInState']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptSpeakersSectionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ConceptSuggestionService, useValue: suggestionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptSpeakersSectionComponent);
    component = fixture.componentInstance;
    suggestionService = TestBed.inject(ConceptSuggestionService) as jasmine.SpyObj<ConceptSuggestionService>;

    component.concept = mockConcept;
    component.suggestions = mockSuggestions;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getSuggestedSpeakers', () => {
    it('should return suggested speakers', () => {
      // Recreate the suggestions to ensure fresh data
      component.suggestions = {
        response: 'Test response',
        conceptSuggestion: {
          speakers: [
            {
              name: 'Jane Smith',
              expertise: 'Design',
              suggestedTopic: 'UX Principles',
              bio: 'UX expert with 10 years experience'
            },
            {
              name: 'Bob Johnson',
              expertise: 'Marketing',
              suggestedTopic: 'Digital Marketing',
              bio: 'Marketing strategist'
            }
          ]
        },
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };
      
      const speakers = component.getSuggestedSpeakers();
      expect(speakers).toEqual(mockSuggestedSpeakers);
    });

    it('should return empty array when no suggestions', () => {
      component.suggestions = undefined;
      const speakers = component.getSuggestedSpeakers();
      expect(speakers).toEqual([]);
    });

    it('should return empty array when conceptSuggestion is missing', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: undefined
      };
      const speakers = component.getSuggestedSpeakers();
      expect(speakers).toEqual([]);
    });

    it('should return empty array when speakers array is missing', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: {}
      };
      const speakers = component.getSuggestedSpeakers();
      expect(speakers).toEqual([]);
    });
  });

  describe('acceptSpeaker', () => {
    it('should accept speaker and update concept in state', () => {
      const speaker = mockSuggestedSpeakers[0];
      const updatedConcept = {
        ...mockConcept,
        speakers: [...mockSpeakers, {
          id: 'speaker-2',
          name: speaker.name,
          expertise: speaker.expertise,
          suggestedTopic: speaker.suggestedTopic,
          bio: speaker.bio,
          confirmed: false
        }]
      };
      suggestionService.acceptSpeaker.and.returnValue(of(updatedConcept));

      spyOn(component, 'clearSuggestion' as any);

      component.acceptSpeaker(speaker);

      expect(suggestionService.acceptSpeaker).toHaveBeenCalledWith(mockConcept, speaker);
      expect(suggestionService.updateConceptInState).toHaveBeenCalledWith(updatedConcept);
      expect((component as any).clearSuggestion).toHaveBeenCalledWith('speaker', speaker);
    });

    it('should handle error during speaker acceptance', () => {
      const speaker = mockSuggestedSpeakers[0];
      const error = new Error('Accept failed');
      suggestionService.acceptSpeaker.and.returnValue(throwError(error));

      spyOn(console, 'error');

      component.acceptSpeaker(speaker);

      expect(suggestionService.acceptSpeaker).toHaveBeenCalledWith(mockConcept, speaker);
      expect(console.error).toHaveBeenCalledWith('Error updating concept:', error);
    });
  });

  describe('rejectSpeaker', () => {
    it('should reject speaker by clearing suggestion', () => {
      const speaker = mockSuggestedSpeakers[0];
      spyOn(component, 'clearSuggestion' as any);

      component.rejectSpeaker(speaker);

      expect((component as any).clearSuggestion).toHaveBeenCalledWith('speaker', speaker);
    });
  });

  describe('hasSuggestions', () => {
    it('should return true when has speaker suggestions', () => {
      expect(component.hasSuggestions()).toBeTruthy();
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

    it('should return false when speakers array is empty', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: {
          speakers: []
        }
      };
      expect(component.hasSuggestions()).toBeFalsy();
    });

    it('should return false when speakers array is missing', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: {}
      };
      expect(component.hasSuggestions()).toBeFalsy();
    });
  });

  describe('clearSuggestion', () => {
    it('should clear speaker suggestion', () => {
      const speaker = mockSuggestedSpeakers[0];
      const initialLength = component.suggestions!.conceptSuggestion!.speakers!.length;
      
      (component as any).clearSuggestion('speaker', speaker);
      
      expect(component.suggestions!.conceptSuggestion!.speakers!.length).toBe(initialLength - 1);
      expect(component.suggestions!.conceptSuggestion!.speakers).not.toContain(speaker);
    });

    it('should handle missing suggestions', () => {
      component.suggestions = undefined;
      
      expect(() => {
        (component as any).clearSuggestion('speaker', {});
      }).not.toThrow();
    });

    it('should handle missing conceptSuggestion', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: undefined
      };
      
      expect(() => {
        (component as any).clearSuggestion('speaker', {});
      }).not.toThrow();
    });

    it('should handle missing speakers array', () => {
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: {}
      };
      
      expect(() => {
        (component as any).clearSuggestion('speaker', {});
      }).not.toThrow();
    });

    it('should not affect other suggestion types', () => {
      const speaker = mockSuggestedSpeakers[0];
      const initialLength = component.suggestions!.conceptSuggestion!.speakers!.length;
      
      (component as any).clearSuggestion('otherType', speaker);
      
      expect(component.suggestions!.conceptSuggestion!.speakers!.length).toBe(initialLength);
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
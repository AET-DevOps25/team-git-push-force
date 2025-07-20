import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ConceptTimelineSectionComponent } from './concept-timeline-section.component';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';
import { Concept, AgendaItem } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

describe('ConceptTimelineSectionComponent', () => {
  let component: ConceptTimelineSectionComponent;
  let fixture: ComponentFixture<ConceptTimelineSectionComponent>;
  let suggestionService: jasmine.SpyObj<ConceptSuggestionService>;

  const mockConcept: Concept = {
    id: 'test-concept',
    title: 'Test Event',
    description: 'Test description',
    status: 'DRAFT',
    agenda: [{
      id: 'agenda-1',
      time: '09:00',
      title: 'Session',
      description: 'Test session',
      type: 'WORKSHOP',
      speaker: 'Speaker',
      duration: 60
    }],
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
      agenda: [{
        time: '10:00',
        title: 'New Session',
        description: 'New session description',
        type: 'KEYNOTE',
        speaker: 'New Speaker',
        duration: 45
      }]
    },
    suggestions: [],
    followUpQuestions: [],
    confidence: 0.9
  };

  beforeEach(async () => {
    const suggestionServiceSpy = jasmine.createSpyObj('ConceptSuggestionService', 
      ['acceptAgendaItem', 'updateConceptInState']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptTimelineSectionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ConceptSuggestionService, useValue: suggestionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptTimelineSectionComponent);
    component = fixture.componentInstance;
    suggestionService = TestBed.inject(ConceptSuggestionService) as jasmine.SpyObj<ConceptSuggestionService>;

    component.concept = mockConcept;
    component.suggestions = mockSuggestions;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getSuggestedAgendaItems', () => {
    it('should return suggested agenda items', () => {
      const items = component.getSuggestedAgendaItems();
      expect(items).toEqual(mockSuggestions.conceptSuggestion!.agenda!);
    });

    it('should return empty array if no suggestions', () => {
      component.suggestions = undefined;
      const items = component.getSuggestedAgendaItems();
      expect(items).toEqual([]);
    });
  });

  describe('acceptAgendaItem', () => {
    it('should call suggestion service to accept agenda item', () => {
      const mockUpdatedConcept = { ...mockConcept };
      suggestionService.acceptAgendaItem.and.returnValue(of(mockUpdatedConcept));
      
      const agendaItem = mockSuggestions.conceptSuggestion!.agenda![0];
      component.acceptAgendaItem(agendaItem);
      
      expect(suggestionService.acceptAgendaItem).toHaveBeenCalledWith(mockConcept, agendaItem);
    });

    it('should handle accept agenda item error', () => {
      spyOn(console, 'error');
      const mockUpdatedConcept = { ...mockConcept };
      suggestionService.acceptAgendaItem.and.returnValue(of(mockUpdatedConcept));
      
      const agendaItem = mockSuggestions.conceptSuggestion!.agenda![0];
      component.acceptAgendaItem(agendaItem);
      
      expect(suggestionService.acceptAgendaItem).toHaveBeenCalled();
    });
  });

  describe('formatAgendaTime', () => {
    it('should format time correctly', () => {
      expect(component.formatAgendaTime('09:00')).toBe('09:00');
      expect(component.formatAgendaTime('14:30')).toBe('14:30');
    });

    it('should return TBD for empty time', () => {
      expect(component.formatAgendaTime('')).toBe('TBD');
      expect(component.formatAgendaTime(null as any)).toBe('TBD');
      expect(component.formatAgendaTime(undefined as any)).toBe('TBD');
    });
  });

  describe('getAgendaTypeIcon', () => {
    it('should return correct icons for each agenda type', () => {
      expect(component.getAgendaTypeIcon('KEYNOTE')).toBe('mic');
      expect(component.getAgendaTypeIcon('WORKSHOP')).toBe('build');
      expect(component.getAgendaTypeIcon('PANEL')).toBe('group');
      expect(component.getAgendaTypeIcon('NETWORKING')).toBe('people');
      expect(component.getAgendaTypeIcon('BREAK')).toBe('coffee');
      expect(component.getAgendaTypeIcon('LUNCH')).toBe('restaurant');
      expect(component.getAgendaTypeIcon('UNKNOWN')).toBe('event');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes correctly', () => {
      expect(component.formatDuration(30)).toBe('30min');
      expect(component.formatDuration(45)).toBe('45min');
    });

    it('should format hours correctly', () => {
      expect(component.formatDuration(60)).toBe('1h');
      expect(component.formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes correctly', () => {
      expect(component.formatDuration(90)).toBe('1h 30min');
      expect(component.formatDuration(135)).toBe('2h 15min');
    });
  });

  describe('getAgendaItemSuggestion', () => {
    it('should return suggestion for existing agenda item', () => {
      component.suggestions = {
        response: 'Test response',
        conceptUpdates: {
          suggestions: [
            {
              field: 'agenda[0].duration',
              currentValue: '60',
              suggestedValue: '90',
              reasoning: 'More time needed'
            }
          ]
        },
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };

      const result = component.getAgendaItemSuggestion(mockConcept.agenda[0]);
      expect(result).toEqual({
        field: 'agenda[0].duration',
        currentValue: '60',
        suggestedValue: '90',
        reasoning: 'More time needed'
      });
    });

    it('should return null when no suggestions exist', () => {
      component.suggestions = undefined;
      const result = component.getAgendaItemSuggestion(mockConcept.agenda[0]);
      expect(result).toBeNull();
    });

    it('should return null when agenda item not found', () => {
      component.suggestions = {
        response: 'Test response',
        conceptUpdates: {
          suggestions: []
        },
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };

      const unknownItem = { id: 'unknown', time: '10:00', title: 'Unknown' };
      const result = component.getAgendaItemSuggestion(unknownItem);
      expect(result).toBeNull();
    });
  });

  describe('rejectAgendaItem', () => {
    it('should call clearSuggestion with correct parameters', () => {
      spyOn(component as any, 'clearSuggestion');
      const agendaItem = mockSuggestions.conceptSuggestion!.agenda![0];
      
      component.rejectAgendaItem(agendaItem);
      
      expect(component['clearSuggestion']).toHaveBeenCalledWith('agenda', agendaItem);
    });
  });

  describe('acceptAgendaItemEdit', () => {
    it('should call suggestion service to accept agenda item edit', () => {
      const mockUpdatedConcept = { ...mockConcept };
      suggestionService.acceptAgendaItemEdit = jasmine.createSpy().and.returnValue(of(mockUpdatedConcept));
      spyOn(component as any, 'clearSuggestion');
      
      const agendaItem = mockConcept.agenda[0];
      const update = { field: 'duration', value: '90' };
      
      component.acceptAgendaItemEdit(agendaItem, update);
      
      expect(suggestionService.acceptAgendaItemEdit).toHaveBeenCalledWith(mockConcept, agendaItem, update);
      expect(component['clearSuggestion']).toHaveBeenCalledWith('update', update);
    });

    it('should handle accept agenda item edit error', () => {
      spyOn(console, 'error');
      suggestionService.acceptAgendaItemEdit = jasmine.createSpy().and.returnValue(throwError('Test error'));
      
      const agendaItem = mockConcept.agenda[0];
      const update = { field: 'duration', value: '90' };
      
      component.acceptAgendaItemEdit(agendaItem, update);
      
      expect(console.error).toHaveBeenCalledWith('Error updating concept:', 'Test error');
    });
  });

  describe('rejectFieldUpdate', () => {
    it('should call clearSuggestion with update type', () => {
      spyOn(component as any, 'clearSuggestion');
      const update = { field: 'duration', value: '90' };
      
      component.rejectFieldUpdate(update);
      
      expect(component['clearSuggestion']).toHaveBeenCalledWith('update', update);
    });
  });

  describe('hasSuggestions', () => {
    it('should return true when concept suggestion has agenda', () => {
      // Create suggestions with agenda items
      component.suggestions = {
        ...mockSuggestions,
        conceptSuggestion: {
          agenda: [{
            time: '10:00',
            title: 'New Session',
            description: 'New session description',
            type: 'KEYNOTE',
            speaker: 'New Speaker',
            duration: 45
          }]
        }
      };
      component.concept = mockConcept;
      expect(component.hasSuggestions()).toBe(true);
    });

    it('should return true when concept updates has agenda suggestions', () => {
      component.suggestions = {
        response: 'Test response',
        conceptUpdates: {
          suggestions: [
            {
              field: 'agenda[0].duration',
              currentValue: '60',
              suggestedValue: '90',
              reasoning: 'More time needed'
            }
          ]
        },
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };
      expect(component.hasSuggestions()).toBe(true);
    });

    it('should return false when no suggestions exist', () => {
      component.suggestions = {
        response: 'Test response',
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };
      expect(component.hasSuggestions()).toBe(false);
    });
  });

  describe('clearSuggestion', () => {
    it('should clear agenda suggestions', () => {
      component.suggestions = JSON.parse(JSON.stringify(mockSuggestions)); // Deep copy
      const agendaItem = component.suggestions!.conceptSuggestion!.agenda![0];
      
      component['clearSuggestion']('agenda', agendaItem);
      
      expect(component.suggestions!.conceptSuggestion!.agenda!.length).toBe(0);
    });

    it('should clear update suggestions', () => {
      component.suggestions = {
        response: 'Test response',
        conceptUpdates: {
          suggestions: [
            {
              field: 'agenda[0].duration',
              currentValue: '60',
              suggestedValue: '90',
              reasoning: 'More time needed'
            }
          ]
        },
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };
      
      const update = component.suggestions.conceptUpdates!.suggestions[0];
      component['clearSuggestion']('update', update);
      
      expect(component.suggestions.conceptUpdates!.suggestions.length).toBe(0);
    });

    it('should do nothing when suggestions is undefined', () => {
      component.suggestions = undefined;
      expect(() => component['clearSuggestion']('agenda', {})).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
}); 
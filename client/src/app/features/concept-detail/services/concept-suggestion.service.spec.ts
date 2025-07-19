import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConceptSuggestionService } from './concept-suggestion.service';
import { ConceptService } from '../../../core/services/concept.service';
import { StateService } from '../../../core/services/state.service';
import { Concept, AgendaItem } from '../../../core/models/concept.model';

describe('ConceptSuggestionService', () => {
  let service: ConceptSuggestionService;
  let conceptService: jasmine.SpyObj<ConceptService>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockConcept: Concept = {
    id: 'test-concept',
    title: 'Test Event',
    description: 'Test description',
    status: 'DRAFT',
    agenda: [],
    speakers: [],
    tags: ['test'],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const updatedMockConcept: Concept = {
    ...mockConcept,
    version: 2,
    updatedAt: new Date()
  };

  beforeEach(() => {
    const conceptServiceSpy = jasmine.createSpyObj('ConceptService', ['updateConcept']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['updateConcept']);

    TestBed.configureTestingModule({
      providers: [
        ConceptSuggestionService,
        { provide: ConceptService, useValue: conceptServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    });

    service = TestBed.inject(ConceptSuggestionService);
    conceptService = TestBed.inject(ConceptService) as jasmine.SpyObj<ConceptService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('acceptFieldUpdate', () => {
    it('should update field and call updateConcept', () => {
      const update = { field: 'title', suggestedValue: 'New Title' };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptFieldUpdate(mockConcept, update).subscribe(result => {
        expect(result).toEqual(updatedMockConcept);
      });

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        mockConcept.id,
        jasmine.objectContaining({ title: 'New Title' })
      );
    });

    it('should handle nested field updates', () => {
      const update = { field: 'details.capacity', suggestedValue: '100' };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptFieldUpdate(mockConcept, update).subscribe();

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        mockConcept.id,
        jasmine.objectContaining({
          details: jasmine.objectContaining({ capacity: 100 })
        })
      );
    });
  });

  describe('acceptSpeaker', () => {
    it('should add speaker to concept', () => {
      const speaker = {
        name: 'John Doe',
        bio: 'Expert speaker',
        expertise: 'Technology',
        suggestedTopic: 'AI Trends'
      };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptSpeaker(mockConcept, speaker).subscribe(result => {
        expect(result).toEqual(updatedMockConcept);
      });

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        mockConcept.id,
        jasmine.objectContaining({
          speakers: jasmine.arrayContaining([
            jasmine.objectContaining({
              name: 'John Doe',
              bio: 'Expert speaker',
              expertise: 'Technology',
              suggestedTopic: 'AI Trends',
              confirmed: false
            })
          ])
        })
      );
    });

    it('should handle speaker without bio', () => {
      const speaker = {
        name: 'Jane Doe',
        expertise: 'Design',
        suggestedTopic: 'UX Best Practices'
      };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptSpeaker(mockConcept, speaker).subscribe();

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        mockConcept.id,
        jasmine.objectContaining({
          speakers: jasmine.arrayContaining([
            jasmine.objectContaining({
              name: 'Jane Doe',
              bio: '',
              expertise: 'Design'
            })
          ])
        })
      );
    });
  });

  describe('acceptAgendaItem', () => {
    it('should add agenda item to concept', () => {
      const agendaItem = {
        time: '09:00',
        title: 'Opening Keynote',
        description: 'Welcome speech',
        type: 'KEYNOTE' as const,
        speaker: 'John Doe',
        duration: 60
      };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptAgendaItem(mockConcept, agendaItem).subscribe(result => {
        expect(result).toEqual(updatedMockConcept);
      });

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        mockConcept.id,
        jasmine.objectContaining({
          agenda: jasmine.arrayContaining([
            jasmine.objectContaining({
              time: '09:00',
              title: 'Opening Keynote',
              description: 'Welcome speech',
              type: 'KEYNOTE',
              speaker: 'John Doe',
              duration: 60
            })
          ])
        })
      );
    });

    it('should handle agenda item without description and speaker', () => {
      const agendaItem = {
        time: '10:00',
        title: 'Coffee Break',
        type: 'BREAK' as const,
        duration: 15
      };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptAgendaItem(mockConcept, agendaItem).subscribe();

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        mockConcept.id,
        jasmine.objectContaining({
          agenda: jasmine.arrayContaining([
            jasmine.objectContaining({
              description: '',
              speaker: ''
            })
          ])
        })
      );
    });
  });

  describe('acceptAgendaItemEdit', () => {
    it('should update agenda item duration', () => {
      const agendaItem = { id: 'agenda-1' };
      const update = { field: 'duration', suggestedValue: '90' };
      const conceptWithAgenda: Concept = {
        ...mockConcept,
        agenda: [{
          id: 'agenda-1',
          time: '09:00',
          title: 'Session',
          description: 'Test session',
          type: 'WORKSHOP' as const,
          speaker: 'Speaker',
          duration: 60
        }]
      };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptAgendaItemEdit(conceptWithAgenda, agendaItem, update).subscribe();

      expect(conceptService.updateConcept).toHaveBeenCalledWith(
        conceptWithAgenda.id,
        jasmine.objectContaining({
          agenda: jasmine.arrayContaining([
            jasmine.objectContaining({
              id: 'agenda-1',
              duration: 90
            })
          ])
        })
      );
    });

    it('should handle non-existent agenda item', () => {
      const agendaItem = { id: 'non-existent' };
      const update = { field: 'duration', suggestedValue: '90' };
      conceptService.updateConcept.and.returnValue(of(updatedMockConcept));

      service.acceptAgendaItemEdit(mockConcept, agendaItem, update).subscribe();

      expect(conceptService.updateConcept).toHaveBeenCalled();
    });
  });

  describe('updateConceptInState', () => {
    it('should call stateService.updateConcept', () => {
      service.updateConceptInState(updatedMockConcept);

      expect(stateService.updateConcept).toHaveBeenCalledWith(updatedMockConcept);
    });
  });
}); 
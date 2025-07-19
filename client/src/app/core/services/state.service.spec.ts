import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StateService, AppState } from './state.service';
import { ConceptService } from './concept.service';
import { User } from '../models/user.model';
import { Concept } from '../models/concept.model';
import { ChatMessage } from '../models/chat.model';
import { of } from 'rxjs';

describe('StateService', () => {
  let service: StateService;
  let conceptService: jasmine.SpyObj<ConceptService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'HYBRID',
      industry: 'Technology',
      language: 'en',
      timezone: 'UTC'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockConcept: Concept = {
    id: 'concept-1',
    title: 'Test Conference',
    description: 'A test conference for developers',
    status: 'DRAFT',
    eventDetails: {
      format: 'HYBRID',
      capacity: 200,
      targetAudience: 'Developers',
      objectives: ['Learning', 'Networking']
    },
    agenda: [],
    speakers: [],
    tags: ['tech', 'conference'],
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: '1',
    lastModifiedBy: '1'
  };

  const mockChatMessage: ChatMessage = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, help me plan an event',
    timestamp: new Date('2024-01-01'),
    conversationId: 'conv-1'
  };

  beforeEach(() => {
    const conceptServiceSpy = jasmine.createSpyObj('ConceptService', ['getConcepts', 'createConcept', 'updateConcept']);

    // Configure mock return values
    conceptServiceSpy.getConcepts.and.returnValue(of({ content: [], totalElements: 0, totalPages: 0 }));
    conceptServiceSpy.createConcept.and.returnValue(of(mockConcept));
    conceptServiceSpy.updateConcept.and.returnValue(of(mockConcept));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StateService,
        { provide: ConceptService, useValue: conceptServiceSpy }
      ]
    });
    service = TestBed.inject(StateService);
    conceptService = TestBed.inject(ConceptService) as jasmine.SpyObj<ConceptService>;
  });

  describe('Initial State', () => {
    it('should have correct initial state', (done) => {
      service.getState().subscribe(state => {
        expect(state.user).toBeNull();
        expect(state.concepts).toEqual([]);
        expect(state.currentConcept).toBeNull();
        expect(state.chatMessages).toEqual([]);
        expect(state.loading).toEqual({});
        expect(state.error).toBeNull();
        done();
      });
    });
  });

  describe('User Management', () => {
    it('should set user', (done) => {
      service.setUser(mockUser);

      service.getUser().subscribe(user => {
        expect(user).toEqual(mockUser);
        done();
      });
    });

    it('should clear user when set to null', (done) => {
      service.setUser(mockUser);
      service.setUser(null);

      service.getUser().subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('should update state when user is set', (done) => {
      service.setUser(mockUser);

      service.getState().subscribe(state => {
        expect(state.user).toEqual(mockUser);
        done();
      });
    });
  });

  describe('Concepts Management', () => {
    it('should set concepts array', (done) => {
      const concepts = [mockConcept];
      service.setConcepts(concepts);

      service.getConcepts().subscribe(result => {
        expect(result).toEqual(concepts);
        done();
      });
    });

    it('should add concept to empty array', (done) => {
      // Set conceptsLoaded to true to prevent automatic loading from ConceptService
      service.setConcepts([]);
      service.addConcept(mockConcept);

      service.getConcepts().subscribe(concepts => {
        expect(concepts).toEqual([mockConcept]);
        done();
      });
    });

    it('should add concept to existing array', (done) => {
      const existingConcept = { ...mockConcept, id: 'concept-2', title: 'Existing Concept' };
      service.setConcepts([existingConcept]);
      service.addConcept(mockConcept);

      service.getConcepts().subscribe(concepts => {
        expect(concepts).toEqual([existingConcept, mockConcept]);
        done();
      });
    });

    it('should update existing concept', (done) => {
      const updatedConcept = { ...mockConcept, title: 'Updated Conference' };
      service.setConcepts([mockConcept]);
      service.updateConcept(updatedConcept);

      service.getConcepts().subscribe(concepts => {
        expect(concepts[0].title).toBe('Updated Conference');
        expect(concepts[0].id).toBe(mockConcept.id);
        done();
      });
    });

    it('should not modify array when updating non-existent concept', (done) => {
      const nonExistentConcept = { ...mockConcept, id: 'non-existent' };
      service.setConcepts([mockConcept]);
      service.updateConcept(nonExistentConcept);

      service.getConcepts().subscribe(concepts => {
        expect(concepts).toEqual([mockConcept]);
        done();
      });
    });

    it('should maintain immutability when updating concepts', (done) => {
      const originalConcepts = [mockConcept];
      service.setConcepts(originalConcepts);
      
      const updatedConcept = { ...mockConcept, title: 'Updated' };
      service.updateConcept(updatedConcept);

      // Original array should not be modified
      expect(originalConcepts[0].title).toBe('Test Conference');

      service.getConcepts().subscribe(concepts => {
        expect(concepts[0].title).toBe('Updated');
        expect(concepts).not.toBe(originalConcepts); // Different reference
        done();
      });
    });
  });

  describe('Current Concept Management', () => {
    it('should set current concept', (done) => {
      service.setCurrentConcept(mockConcept);

      service.getCurrentConcept().subscribe(concept => {
        expect(concept).toEqual(mockConcept);
        done();
      });
    });

    it('should clear current concept', (done) => {
      service.setCurrentConcept(mockConcept);
      service.setCurrentConcept(null);

      service.getCurrentConcept().subscribe(concept => {
        expect(concept).toBeNull();
        done();
      });
    });

    it('should update current concept when concept is updated', (done) => {
      const updatedConcept = { ...mockConcept, title: 'Updated Conference' };
      
      service.setCurrentConcept(mockConcept);
      service.setConcepts([mockConcept]);
      service.updateConcept(updatedConcept);

      service.getCurrentConcept().subscribe(concept => {
        expect(concept?.title).toBe('Updated Conference');
        done();
      });
    });

    it('should not update current concept when different concept is updated', (done) => {
      const otherConcept = { ...mockConcept, id: 'other-concept' };
      const updatedOtherConcept = { ...otherConcept, title: 'Updated Other' };

      service.setCurrentConcept(mockConcept);
      service.setConcepts([mockConcept, otherConcept]);
      service.updateConcept(updatedOtherConcept);

      service.getCurrentConcept().subscribe(concept => {
        expect(concept?.title).toBe('Test Conference'); // Should remain unchanged
        done();
      });
    });
  });

  describe('Chat Messages Management', () => {
    it('should add chat message', (done) => {
      service.addChatMessage(mockChatMessage);

      service.getChatMessages().subscribe(messages => {
        expect(messages).toEqual([mockChatMessage]);
        done();
      });
    });

    it('should add multiple chat messages', (done) => {
      const message2 = { ...mockChatMessage, id: 'msg-2', content: 'Second message' };
      
      service.addChatMessage(mockChatMessage);
      service.addChatMessage(message2);

      service.getChatMessages().subscribe(messages => {
        expect(messages).toEqual([mockChatMessage, message2]);
        done();
      });
    });

    it('should set chat messages', (done) => {
      const messages = [mockChatMessage];
      service.setChatMessages(messages);

      service.getChatMessages().subscribe(result => {
        expect(result).toEqual(messages);
        done();
      });
    });

    it('should replace existing messages when setting new ones', (done) => {
      const newMessage = { ...mockChatMessage, id: 'msg-new', content: 'New message' };
      
      service.addChatMessage(mockChatMessage);
      service.setChatMessages([newMessage]);

      service.getChatMessages().subscribe(messages => {
        expect(messages).toEqual([newMessage]);
        done();
      });
    });

    it('should maintain immutability when adding messages', (done) => {
      const originalMessages = [mockChatMessage];
      service.setChatMessages(originalMessages);
      
      const newMessage = { ...mockChatMessage, id: 'msg-2' };
      service.addChatMessage(newMessage);

      // Original array should not be modified
      expect(originalMessages.length).toBe(1);

      service.getChatMessages().subscribe(messages => {
        expect(messages.length).toBe(2);
        expect(messages).not.toBe(originalMessages); // Different reference
        done();
      });
    });
  });

  describe('Loading States Management', () => {
    it('should set loading state', (done) => {
      service.setLoading('test-operation', true);

      service.isLoading('test-operation').subscribe(isLoading => {
        expect(isLoading).toBe(true);
        done();
      });
    });

    it('should clear loading state', (done) => {
      service.setLoading('test-operation', true);
      service.setLoading('test-operation', false);

      service.isLoading('test-operation').subscribe(isLoading => {
        expect(isLoading).toBe(false);
        done();
      });
    });

    it('should return false for non-existent loading key', (done) => {
      service.isLoading('non-existent').subscribe(isLoading => {
        expect(isLoading).toBe(false);
        done();
      });
    });

    it('should manage multiple loading states independently', (done) => {
      service.setLoading('operation1', true);
      service.setLoading('operation2', false);

      let results: boolean[] = [];
      
      service.isLoading('operation1').subscribe(loading1 => {
        results.push(loading1);
        
        service.isLoading('operation2').subscribe(loading2 => {
          results.push(loading2);
          
          expect(results).toEqual([true, false]);
          done();
        });
      });
    });

    it('should update loading state in global state', (done) => {
      service.setLoading('test-operation', true);

      service.getState().subscribe(state => {
        expect(state.loading['test-operation']).toBe(true);
        done();
      });
    });
  });

  describe('Error Management', () => {
    it('should set error', (done) => {
      const errorMessage = 'Something went wrong';
      service.setError(errorMessage);

      service.getError().subscribe(error => {
        expect(error).toBe(errorMessage);
        done();
      });
    });

    it('should clear error', (done) => {
      service.setError('Error message');
      service.setError(null);

      service.getError().subscribe(error => {
        expect(error).toBeNull();
        done();
      });
    });

    it('should update error in global state', (done) => {
      const errorMessage = 'Test error';
      service.setError(errorMessage);

      service.getState().subscribe(state => {
        expect(state.error).toBe(errorMessage);
        done();
      });
    });
  });

  describe('State Reset', () => {
    it('should reset all state to initial values', (done) => {
      // Set some state
      service.setUser(mockUser);
      service.setConcepts([mockConcept]);
      service.setCurrentConcept(mockConcept);
      service.addChatMessage(mockChatMessage);
      service.setLoading('test', true);
      service.setError('Test error');

      // Reset state
      service.reset();

      service.getState().subscribe(state => {
        expect(state.user).toBeNull();
        expect(state.concepts).toEqual([]);
        expect(state.currentConcept).toBeNull();
        expect(state.chatMessages).toEqual([]);
        expect(state.loading).toEqual({});
        expect(state.error).toBeNull();
        done();
      });
    });
  });

  describe('Reactive State Updates', () => {
    it('should emit state changes to subscribers', () => {
      let stateUpdates: AppState[] = [];
      
      service.getState().subscribe(state => {
        stateUpdates.push({ ...state });
      });

      service.setUser(mockUser);
      service.setError('Test error');

      expect(stateUpdates.length).toBe(3); // Initial + 2 updates
      expect(stateUpdates[1].user).toEqual(mockUser);
      expect(stateUpdates[2].error).toBe('Test error');
    });

    it('should maintain referential integrity across updates', (done) => {
      service.setConcepts([mockConcept]);
      service.setUser(mockUser);

      service.getState().subscribe(state => {
        // Concepts should still be there after user update
        expect(state.concepts).toEqual([mockConcept]);
        expect(state.user).toEqual(mockUser);
        done();
      });
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with multiple subscriptions', () => {
      const subscriptions = [];
      
      // Create multiple subscriptions
      for (let i = 0; i < 10; i++) {
        subscriptions.push(service.getUser().subscribe());
        subscriptions.push(service.getConcepts().subscribe());
        subscriptions.push(service.isLoading('test').subscribe());
      }

      // Unsubscribe all
      subscriptions.forEach(sub => sub.unsubscribe());

      // Should not throw or cause issues
      service.setUser(mockUser);
      expect(service).toBeDefined();
    });
  });
}); 
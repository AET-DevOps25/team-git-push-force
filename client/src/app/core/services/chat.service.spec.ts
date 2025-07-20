import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ChatService } from './chat.service';
import { ApiService } from './api.service';
import { StateService } from './state.service';
import { ChatMessage, ChatRequest, ChatResponse } from '../models/chat.model';
import { Concept, UserPreferences } from '../models';

describe('ChatService', () => {
  let service: ChatService;
  let apiService: jasmine.SpyObj<ApiService>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockConcept: Concept = {
    id: 'test-concept-id',
    title: 'Test Conference',
    description: 'A test conference for developers',
    status: 'IN_PROGRESS',
    agenda: [],
    speakers: [],
    tags: ['technology', 'test'],
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const mockUserPreferences: UserPreferences = {
    preferredEventFormat: 'HYBRID',
    industry: 'Technology',
    language: 'en',
    timezone: 'UTC'
  };

  const mockChatMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, can you help me plan an event?',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      conversationId: 'test-concept-id'
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'I\'d be happy to help you plan your event! What type of event are you organizing?',
      timestamp: new Date('2024-01-01T10:01:00Z'),
      conversationId: 'test-concept-id'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['post']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', [
      'setLoading',
      'addChatMessage'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    });

    service = TestBed.inject(ChatService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeChat', () => {
    const mockInitResponse = {
      message: 'Welcome! I\'m here to help you plan your event.',
      suggestions: ['Tell me about your event', 'What type of event?', 'Help with planning'],
      conversationId: 'conversation-123'
    };

    it('should initialize chat successfully with all parameters', () => {
      apiService.post.and.returnValue(of(mockInitResponse));

      const conceptId = 'test-concept-id';
      const userId = 'user-123';
      const conceptTitle = 'My Event';

      service.initializeChat(conceptId, userId, conceptTitle, mockUserPreferences).subscribe(response => {
        expect(response).toEqual(mockInitResponse);
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('initializeChat', true);
      expect(apiService.post).toHaveBeenCalledWith('/api/genai/chat/initialize', {
        conceptId,
        userId,
        conceptTitle,
        userPreferences: mockUserPreferences
      });
      expect(stateService.addChatMessage).toHaveBeenCalledWith(jasmine.objectContaining({
        role: 'assistant',
        content: mockInitResponse.message,
        conversationId: conceptId
      }));
      expect(stateService.setLoading).toHaveBeenCalledWith('initializeChat', false);
    });

    it('should initialize chat with minimal parameters', () => {
      apiService.post.and.returnValue(of(mockInitResponse));

      const conceptId = 'test-concept-id';
      const userId = 'user-123';

      service.initializeChat(conceptId, userId).subscribe(response => {
        expect(response).toEqual(mockInitResponse);
      });

      expect(apiService.post).toHaveBeenCalledWith('/api/genai/chat/initialize', {
        conceptId,
        userId,
        conceptTitle: undefined,
        userPreferences: undefined
      });
    });

    it('should handle initialization error', () => {
      const errorMessage = 'Failed to initialize chat';
      apiService.post.and.returnValue(throwError(() => new Error(errorMessage)));

      service.initializeChat('test-concept-id', 'user-123').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(stateService.setLoading).toHaveBeenCalledWith('initializeChat', true);
          // Loading state won't be set to false on error since it's not in a tap operator
        }
      });
    });

    it('should create welcome message with correct properties', () => {
      apiService.post.and.returnValue(of(mockInitResponse));
      const conceptId = 'test-concept-id';

      service.initializeChat(conceptId, 'user-123').subscribe();

      const addMessageCall = stateService.addChatMessage.calls.mostRecent();
      const welcomeMessage = addMessageCall.args[0] as ChatMessage;

      expect(welcomeMessage.id).toMatch(/^msg-\d+$/);
      expect(welcomeMessage.role).toBe('assistant');
      expect(welcomeMessage.content).toBe(mockInitResponse.message);
      expect(welcomeMessage.timestamp).toBeInstanceOf(Date);
      expect(welcomeMessage.conversationId).toBe(conceptId);
    });
  });

  describe('sendMessage', () => {
    const mockChatResponse: ChatResponse = {
      response: 'That sounds like a great event! Let me help you with the planning.',
      suggestions: ['Set a date', 'Choose venue', 'Plan agenda'],
      followUpQuestions: ['When would you like to hold the event?', 'How many attendees do you expect?'],
      confidence: 0.95
    };

    it('should send message successfully with all parameters', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      const message = 'I want to organize a tech conference';
      const conversationId = 'conversation-123';
      const context = {
        previousMessages: mockChatMessages,
        includeDocuments: true,
        maxTokens: 2000
      };

      service.sendMessage(message, mockConcept, conversationId, mockUserPreferences, context).subscribe(response => {
        expect(response).toEqual(mockChatResponse);
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('chat', true);
      expect(apiService.post).toHaveBeenCalledWith('/api/genai/chat', {
        message,
        concept: mockConcept,
        conversationId,
        userPreferences: mockUserPreferences,
        context: {
          previousMessages: mockChatMessages,
          includeDocuments: true,
          maxTokens: 2000
        }
      });
    });

    it('should send message with minimal parameters', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      const message = 'Help me plan an event';

      service.sendMessage(message, mockConcept).subscribe(response => {
        expect(response).toEqual(mockChatResponse);
      });

      expect(apiService.post).toHaveBeenCalledWith('/api/genai/chat', {
        message,
        concept: mockConcept,
        conversationId: undefined,
        userPreferences: undefined,
        context: undefined
      });
    });

    it('should handle context with default values', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      const message = 'Help me plan an event';
      const context = {
        includeDocuments: false
      };

      service.sendMessage(message, mockConcept, undefined, undefined, context).subscribe();

      const expectedRequest = apiService.post.calls.mostRecent().args[1] as ChatRequest;
      expect(expectedRequest.context).toEqual({
        previousMessages: [],
        includeDocuments: false,
        maxTokens: 1000
      });
    });

    it('should add user and AI messages to state', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      const message = 'Help me plan an event';
      const conversationId = 'conversation-123';

      service.sendMessage(message, mockConcept, conversationId).subscribe();

      expect(stateService.addChatMessage).toHaveBeenCalledTimes(2);

      // Check user message
      const userMessageCall = stateService.addChatMessage.calls.argsFor(0)[0] as ChatMessage;
      expect(userMessageCall.role).toBe('user');
      expect(userMessageCall.content).toBe(message);
      expect(userMessageCall.conversationId).toBe(conversationId);

      // Check AI message
      const aiMessageCall = stateService.addChatMessage.calls.argsFor(1)[0] as ChatMessage;
      expect(aiMessageCall.role).toBe('assistant');
      expect(aiMessageCall.content).toBe(mockChatResponse.response);
      expect(aiMessageCall.conversationId).toBe(conversationId);
    });

    it('should use concept.id as conversationId when not provided', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      const message = 'Help me plan an event';

      service.sendMessage(message, mockConcept).subscribe();

      // Check that messages use concept.id as conversationId
      const userMessage = stateService.addChatMessage.calls.argsFor(0)[0] as ChatMessage;
      const aiMessage = stateService.addChatMessage.calls.argsFor(1)[0] as ChatMessage;

      expect(userMessage.conversationId).toBe(mockConcept.id);
      expect(aiMessage.conversationId).toBe(mockConcept.id);
    });

    it('should handle send message error', () => {
      const errorMessage = 'Failed to send message';
      apiService.post.and.returnValue(throwError(() => new Error(errorMessage)));

      service.sendMessage('test message', mockConcept).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(stateService.setLoading).toHaveBeenCalledWith('chat', true);
          // Loading state won't be set to false on error since it's not in a tap operator
        }
      });
    });

    it('should set loading state correctly', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      service.sendMessage('test message', mockConcept).subscribe();

      expect(stateService.setLoading).toHaveBeenCalledWith('chat', true);
      expect(stateService.setLoading).toHaveBeenCalledWith('chat', false);
    });

    it('should generate unique message IDs', () => {
      apiService.post.and.returnValue(of(mockChatResponse));

      service.sendMessage('test message', mockConcept).subscribe();

      const userMessage = stateService.addChatMessage.calls.argsFor(0)[0] as ChatMessage;
      const aiMessage = stateService.addChatMessage.calls.argsFor(1)[0] as ChatMessage;

      expect(userMessage.id).toMatch(/^msg-\d+$/);
      expect(aiMessage.id).toMatch(/^msg-\d+$/);
      expect(userMessage.id).not.toBe(aiMessage.id);
    });
  });

  describe('State Management Integration', () => {
    it('should properly manage loading states for initialization', () => {
      const mockInitResponse = {
        message: 'Welcome!',
        suggestions: [],
        conversationId: 'test'
      };
      apiService.post.and.returnValue(of(mockInitResponse));

      service.initializeChat('test-concept-id', 'user-123').subscribe();

      expect(stateService.setLoading).toHaveBeenCalledWith('initializeChat', true);
      expect(stateService.setLoading).toHaveBeenCalledWith('initializeChat', false);
      expect(stateService.setLoading).toHaveBeenCalledTimes(2);
    });

    it('should properly manage loading states for sending messages', () => {
      const mockChatResponse: ChatResponse = {
        response: 'Response',
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.8
      };
      apiService.post.and.returnValue(of(mockChatResponse));

      service.sendMessage('test', mockConcept).subscribe();

      expect(stateService.setLoading).toHaveBeenCalledWith('chat', true);
      expect(stateService.setLoading).toHaveBeenCalledWith('chat', false);
      expect(stateService.setLoading).toHaveBeenCalledTimes(2);
    });

    it('should add messages to state in correct order', () => {
      const mockChatResponse: ChatResponse = {
        response: 'AI Response',
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.8
      };
      apiService.post.and.returnValue(of(mockChatResponse));

      service.sendMessage('User message', mockConcept).subscribe();

      expect(stateService.addChatMessage).toHaveBeenCalledTimes(2);

      const firstCall = stateService.addChatMessage.calls.argsFor(0)[0] as ChatMessage;
      const secondCall = stateService.addChatMessage.calls.argsFor(1)[0] as ChatMessage;

      expect(firstCall.role).toBe('user');
      expect(firstCall.content).toBe('User message');
      expect(secondCall.role).toBe('assistant');
      expect(secondCall.content).toBe('AI Response');
    });
  });
}); 
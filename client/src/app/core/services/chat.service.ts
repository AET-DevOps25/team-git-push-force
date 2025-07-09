import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StateService } from './state.service';
import { 
  ChatMessage, 
  ChatRequest, 
  ChatResponse 
} from '../models/chat.model';
import { Concept, User, UserPreferences } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  // Initialize chat for new concept
  initializeChat(
    conceptId: string, 
    userId: string, 
    conceptTitle?: string, 
    userPreferences?: UserPreferences
  ): Observable<{message: string, suggestions: string[], conversationId: string}> {
    this.stateService.setLoading('initializeChat', true);
    
    const request = {
      conceptId,
      userId,
      conceptTitle,
      userPreferences
    };

    return this.apiService.post<{message: string, suggestions: string[], conversationId: string}>('/api/genai/chat/initialize', request)
      .pipe(
        tap(response => {
          // Add welcome message to state
          const welcomeMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
            conversationId: response.conversationId
          };
          this.stateService.addChatMessage(welcomeMessage);
          this.stateService.setLoading('initializeChat', false);
        })
      );
  }

  // Send a message to the AI assistant
  sendMessage(
    message: string, 
    concept: Concept, 
    conversationId?: string, 
    userPreferences?: UserPreferences,
    context?: {
      previousMessages?: ChatMessage[],
      includeDocuments?: boolean,
      maxTokens?: number
    }
  ): Observable<ChatResponse> {
    this.stateService.setLoading('chat', true);
    
    // Ensure context has required fields if provided
    const requestContext = context ? {
      previousMessages: context.previousMessages || [],
      includeDocuments: context.includeDocuments ?? true,
      maxTokens: context.maxTokens || 1000
    } : undefined;
    
    const request: ChatRequest = {
      message,
      concept,
      conversationId,
      userPreferences,
      context: requestContext
    };

    return this.apiService.post<ChatResponse>('/api/genai/chat', request)
      .pipe(
        tap(response => {
          // Add user message to state
          const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date(),
            conversationId: conversationId || concept.id
          };
          this.stateService.addChatMessage(userMessage);

          // Add AI response to state
          const aiMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: response.response,
            timestamp: new Date(),
            conversationId: conversationId || concept.id
          };
          this.stateService.addChatMessage(aiMessage);
          
          this.stateService.setLoading('chat', false);
        })
      );
  }
} 
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Import mock data
import { 
  MOCK_USERS, 
  MOCK_CREDENTIALS, 
  DEFAULT_MOCK_USER 
} from '../data/mock-users';
import { 
  MOCK_CONCEPTS 
} from '../data/mock-concepts';
import { 
  MOCK_CHAT_MESSAGES, 
  generateMockChatResponse 
} from '../data/mock-chat';
import { 
  MOCK_DOCUMENTS, 
  generateMockUploadResult,
  getDocumentsByStatus 
} from '../data/mock-documents';

import { User } from '../../core/models/user.model';
import { Concept, CreateConceptRequest } from '../../core/models/concept.model';
import { ChatMessage, ChatRequest, ChatResponse } from '../../core/models/chat.model';
import { ProcessedDocument, DocumentUploadResult } from '../../core/models/document.model';

/**
 * Mock API Service that provides realistic data and behavior
 * for development and testing without requiring a backend
 */
@Injectable({
  providedIn: 'root'
})
export class MockApiService {
  
  // Session state
  private currentUser: User | null = null;
  private isAuthenticated = false;
  private sessionToken = '';
  
  // In-memory data stores
  private users = [...MOCK_USERS];
  private concepts = [...MOCK_CONCEPTS];
  private documents = [...MOCK_DOCUMENTS];
  private chatMessages = [...MOCK_CHAT_MESSAGES];

  // Authentication methods
  login(email: string, password: string): Observable<any> {
    const expectedPassword = MOCK_CREDENTIALS[email as keyof typeof MOCK_CREDENTIALS];
    
    if (!expectedPassword || expectedPassword !== password) {
      return this.createDelayedError('Invalid credentials', 401);
    }

    const user = this.users.find(u => u.email === email);
    if (!user) {
      return this.createDelayedError('User not found', 404);
    }

    this.currentUser = user;
    this.isAuthenticated = true;
    this.sessionToken = `mock-token-${Date.now()}`;

    const response = {
      accessToken: this.sessionToken,
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: user
    };

    return this.createDelayedResponse(response);
  }

  register(userData: any): Observable<any> {
    const { email, password, firstName, lastName } = userData;
    
    // Check if user already exists
    if (this.users.find(u => u.email === email)) {
      return this.createDelayedError('User already exists', 409);
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      firstName,
      lastName,
      preferences: {
        preferredEventFormat: 'HYBRID',
        industry: 'Technology',
        language: 'en',
        timezone: 'UTC'
      },
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    this.isAuthenticated = true;
    this.sessionToken = `mock-token-${Date.now()}`;

    const response = {
      accessToken: this.sessionToken,
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: newUser
    };

    return this.createDelayedResponse(response);
  }

  logout(): Observable<any> {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionToken = '';
    return this.createDelayedResponse({ message: 'Logged out successfully' });
  }

  getCurrentUser(): Observable<User> {
    if (!this.isAuthenticated || !this.currentUser) {
      return this.createDelayedError('Not authenticated', 401);
    }
    return this.createDelayedResponse(this.currentUser);
  }

  // Concept methods
  getConcepts(filters?: any): Observable<Concept[]> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    let filteredConcepts = this.concepts.filter(c => c.userId === this.currentUser?.id);
    
    if (filters?.status) {
      filteredConcepts = filteredConcepts.filter(c => c.status === filters.status);
    }
    
    if (filters?.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      filteredConcepts = filteredConcepts.filter(c => 
        tags.some((tag: string) => c.tags.includes(tag))
      );
    }

    return this.createDelayedResponse(filteredConcepts);
  }

  getConcept(id: string): Observable<Concept> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const concept = this.concepts.find(c => c.id === id);
    if (!concept) {
      return this.createDelayedError('Concept not found', 404);
    }

    return this.createDelayedResponse(concept);
  }

  createConcept(conceptData: CreateConceptRequest): Observable<Concept> {
    if (!this.isAuthenticated || !this.currentUser) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const newConcept: Concept = {
      id: `concept-${Date.now()}`,
      title: conceptData.title,
      description: conceptData.description,
      status: 'DRAFT',
      eventDetails: conceptData.initialRequirements ? {
        theme: conceptData.initialRequirements.theme,
        format: conceptData.initialRequirements.preferredFormat || 'HYBRID',
        capacity: conceptData.initialRequirements.expectedCapacity,
        duration: conceptData.initialRequirements.duration,
        startDate: conceptData.initialRequirements.startDate,
        endDate: conceptData.initialRequirements.endDate,
        targetAudience: conceptData.initialRequirements.targetAudience,
        objectives: []
      } : undefined,
      agenda: [],
      speakers: [],
      pricing: undefined,
      notes: '',
      tags: conceptData.tags || [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: this.currentUser.id,
      lastModifiedBy: this.currentUser.id
    };

    this.concepts.push(newConcept);
    return this.createDelayedResponse(newConcept);
  }

  updateConcept(id: string, updateData: Partial<Concept>): Observable<Concept> {
    if (!this.isAuthenticated || !this.currentUser) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const conceptIndex = this.concepts.findIndex(c => c.id === id);
    if (conceptIndex === -1) {
      return this.createDelayedError('Concept not found', 404);
    }

    const updatedConcept = {
      ...this.concepts[conceptIndex],
      ...updateData,
      updatedAt: new Date(),
      lastModifiedBy: this.currentUser.id,
      version: this.concepts[conceptIndex].version + 1
    };

    this.concepts[conceptIndex] = updatedConcept;
    return this.createDelayedResponse(updatedConcept);
  }

  deleteConcept(id: string): Observable<any> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const conceptIndex = this.concepts.findIndex(c => c.id === id);
    if (conceptIndex === -1) {
      return this.createDelayedError('Concept not found', 404);
    }

    this.concepts.splice(conceptIndex, 1);
    return this.createDelayedResponse({ message: 'Concept deleted successfully' });
  }

  // Chat methods
  sendChatMessage(request: ChatRequest): Observable<ChatResponse> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: request.message,
      timestamp: new Date(),
      conversationId: request.conversationId || 'general'
    };

    this.chatMessages.push(userMessage);

    // Generate AI response
    const aiResponse = generateMockChatResponse(request.message, request.conversationId);
    
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date(),
      conversationId: request.conversationId || 'general'
    };

    this.chatMessages.push(aiMessage);

    const response: ChatResponse = {
      ...aiResponse,
      // Add the created message to the response
      message: aiMessage
    } as any;

    return this.createDelayedResponse(response);
  }

  getChatHistory(conceptId?: string): Observable<ChatMessage[]> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    let messages = this.chatMessages;
    
    if (conceptId) {
      messages = messages.filter(m => m.conversationId === conceptId);
    }

    return this.createDelayedResponse(messages);
  }

  // Document methods
  uploadDocument(file: File): Observable<DocumentUploadResult> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const result = generateMockUploadResult(file);
    return this.createDelayedResponse(result);
  }

  getDocuments(filters?: any): Observable<ProcessedDocument[]> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    let filteredDocs = this.documents;
    
    if (filters?.status) {
      filteredDocs = getDocumentsByStatus(filters.status);
    }

    return this.createDelayedResponse(filteredDocs);
  }

  deleteDocument(id: string): Observable<any> {
    if (!this.isAuthenticated) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const docIndex = this.documents.findIndex(d => d.id === id);
    if (docIndex === -1) {
      return this.createDelayedError('Document not found', 404);
    }

    this.documents.splice(docIndex, 1);
    return this.createDelayedResponse({ message: 'Document deleted successfully' });
  }

  // Helper methods
  private createDelayedResponse<T>(data: T): Observable<T> {
    return of(data).pipe(
      delay(environment.mockDelay || 500)
    );
  }

  private createDelayedError(message: string, status: number): Observable<never> {
    return throwError(() => ({
      status,
      error: { message }
    })).pipe(
      delay(environment.mockDelay || 500)
    );
  }

  // Utility methods for testing
  setCurrentUser(user: User): void {
    this.currentUser = user;
    this.isAuthenticated = true;
  }

  addMockConcept(concept: Concept): void {
    this.concepts.push(concept);
  }

  clearMockData(): void {
    this.concepts = [...MOCK_CONCEPTS];
    this.documents = [...MOCK_DOCUMENTS];
    this.chatMessages = [...MOCK_CHAT_MESSAGES];
  }

  getMockState() {
    return {
      currentUser: this.currentUser,
      isAuthenticated: this.isAuthenticated,
      conceptsCount: this.concepts.length,
      documentsCount: this.documents.length,
      messagesCount: this.chatMessages.length
    };
  }
} 
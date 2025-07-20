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
  
  constructor() {}  // Remove AuthService injection to avoid circular dependency
  
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
    if (!this.checkAuthenticationState() || !this.currentUser) {
      return this.createDelayedError('Not authenticated', 401);
    }
    return this.createDelayedResponse(this.currentUser);
  }

  // Concept methods
  getConcepts(filters?: any): Observable<{content: Concept[], totalElements: number, totalPages: number}> {
    if (!this.checkAuthenticationState()) {
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

    // Return paginated response format
    const page = filters?.page || 0;
    const size = filters?.size || 10;
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const paginatedConcepts = filteredConcepts.slice(startIndex, endIndex);
    
    const response = {
      content: paginatedConcepts,
      totalElements: filteredConcepts.length,
      totalPages: Math.ceil(filteredConcepts.length / size)
    };

    return this.createDelayedResponse(response);
  }

  getConcept(id: string): Observable<Concept> {
    if (!this.checkAuthenticationState()) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const concept = this.concepts.find(c => c.id === id);
    if (!concept) {
      return this.createDelayedError('Concept not found', 404);
    }

    return this.createDelayedResponse(concept);
  }

  createConcept(conceptData: CreateConceptRequest): Observable<Concept> {
    if (!this.checkAuthenticationState() || !this.currentUser) {
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
    if (!this.checkAuthenticationState() || !this.currentUser) {
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
    if (!this.checkAuthenticationState()) {
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
    if (!this.checkAuthenticationState()) {
      return this.createDelayedError('Not authenticated', 401);
    }

    // Generate AI response based on user message
    const aiResponse = generateMockChatResponse(request.message, request.conversationId);
    
    // The actual message handling is done in the ChatService
    // We just return the AI response here
    return this.createDelayedResponse(aiResponse);
  }

  getChatHistory(conceptId?: string): Observable<ChatMessage[]> {
    if (!this.checkAuthenticationState()) {
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
    if (!this.checkAuthenticationState()) {
      return this.createDelayedError('Not authenticated', 401);
    }

    const result = generateMockUploadResult(file);
    return this.createDelayedResponse(result);
  }

  getDocuments(filters?: any): Observable<ProcessedDocument[]> {
    if (!this.checkAuthenticationState()) {
      return this.createDelayedError('Not authenticated', 401);
    }

    let filteredDocs = this.documents;
    
    if (filters?.status) {
      filteredDocs = getDocumentsByStatus(filters.status);
    }

    return this.createDelayedResponse(filteredDocs);
  }

  deleteDocument(id: string): Observable<any> {
    if (!this.checkAuthenticationState()) {
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

  /**
   * Check authentication state by looking at stored tokens and user data
   * Trust the AuthService's authentication - if there's a token and user, we're authenticated
   */
  private checkAuthenticationState(): boolean {
    // If already authenticated in memory, return true
    if (this.isAuthenticated && this.currentUser) {
      return true;
    }

    // Check localStorage for stored authentication data
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('current_user');

    if (!storedToken || !storedUser) {
      this.currentUser = null;
      this.isAuthenticated = false;
      return false;
    }

    // If we have both token and user data, trust that AuthService has validated this
    // AuthService handles token expiration and validation
    try {
      this.currentUser = JSON.parse(storedUser);
      this.isAuthenticated = true;
      this.sessionToken = storedToken;
      return true;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      this.currentUser = null;
      this.isAuthenticated = false;
      return false;
    }
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
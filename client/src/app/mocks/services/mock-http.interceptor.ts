import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse } from '@angular/common/http';
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
  MOCK_CONCEPTS, 
  getConceptsByUser, 
  getConceptsByStatus 
} from '../data/mock-concepts';
import { 
  MOCK_CHAT_MESSAGES, 
  MOCK_CONVERSATION_HISTORY, 
  generateMockChatResponse 
} from '../data/mock-chat';
import { 
  MOCK_DOCUMENTS, 
  MOCK_UPLOAD_RESULTS, 
  generateMockUploadResult,
  getDocumentsByStatus,
  getDocumentsByType 
} from '../data/mock-documents';

@Injectable()
export class MockHttpInterceptor implements HttpInterceptor {
  
  // In-memory storage for this session
  private sessionToken = 'mock-jwt-token-' + Date.now();
  private currentUser = DEFAULT_MOCK_USER;
  private concepts = [...MOCK_CONCEPTS];
  private documents = [...MOCK_DOCUMENTS];
  private chatMessages = [...MOCK_CHAT_MESSAGES];
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    console.log('🔍 INTERCEPTOR CALLED:', {
      url: req.url,
      method: req.method,
      useMockApi: environment.useMockApi,
      apiUrl: environment.apiUrl
    });

    // Only intercept if mock API is enabled
    if (!environment.useMockApi) {
      console.log('❌ Mock API disabled, passing through');
      return next.handle(req);
    }

    // Only intercept requests to our API base URL
    if (!req.url.startsWith(environment.apiUrl)) {
      console.log('❌ URL does not match API base, passing through:', req.url);
      return next.handle(req);
    }

    console.log('🚀 Mock API INTERCEPTING:', req.method, req.url);

    // Parse the URL to get the endpoint path
    const path = req.url.replace(environment.apiUrl, '');
    const method = req.method;

    console.log('📍 Extracted path:', path);

    try {
      // Route to appropriate mock handler
      const response = this.routeRequest(method, path, req.body, req.params);
      
      return response.pipe(
        delay(environment.mockDelay || 500)
      );
    } catch (error) {
      console.error('💥 Mock interceptor error:', error);
      return this.createErrorResponse(500, 'Mock interceptor error');
    }
  }

  private routeRequest(method: string, path: string, body: any, params: any): Observable<any> {
    try {
      console.log('🔍 Routing request:', { method, path, body });
      
      // Authentication endpoints
      if (path === '/auth/login' || path.endsWith('/auth/login')) {
        return this.handleLogin(body);
      }
      if (path === '/auth/register' || path.endsWith('/auth/register')) {
        return this.handleRegister(body);
      }
      if (path === '/auth/logout' || path.endsWith('/auth/logout')) {
        return this.handleLogout();
      }
      if (path === '/auth/refresh' || path.endsWith('/auth/refresh')) {
        return this.handleRefreshToken(body);
      }

      // User endpoints
      if (path === '/users/me' || path.endsWith('/users/me')) {
        return this.handleGetCurrentUser();
      }
      if (path.includes('/users/') && method === 'PUT') {
        return this.handleUpdateUser(body);
      }

      // Concept endpoints
      if ((path === '/concepts' || path.endsWith('/concepts')) && method === 'GET') {
        return this.handleGetConcepts(params);
      }
      if ((path === '/concepts' || path.endsWith('/concepts')) && method === 'POST') {
        return this.handleCreateConcept(body);
      }
      if (path.includes('/concepts/') && method === 'GET') {
        return this.handleGetConcept(this.extractId(path));
      }
      if (path.includes('/concepts/') && method === 'PUT') {
        return this.handleUpdateConcept(this.extractId(path), body);
      }
      if (path.includes('/concepts/') && method === 'DELETE') {
        return this.handleDeleteConcept(this.extractId(path));
      }

      // Chat endpoints
      if (path === '/chat/send' || path.endsWith('/chat/send')) {
        return this.handleSendChatMessage(body);
      }
      if (path === '/chat/history' || path.endsWith('/chat/history')) {
        return this.handleGetChatHistory(params);
      }

      // Document endpoints
      if (path === '/documents/upload' || path.endsWith('/documents/upload')) {
        return this.handleUploadDocument(body);
      }
      if ((path === '/documents' || path.endsWith('/documents')) && method === 'GET') {
        return this.handleGetDocuments(params);
      }
      if (path.includes('/documents/') && method === 'DELETE') {
        return this.handleDeleteDocument(this.extractId(path));
      }

      // Fallback - return 404
      return this.createErrorResponse(404, 'Endpoint not found');
      
    } catch (error) {
      console.error('Mock API error:', error);
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  // Authentication handlers
  private handleLogin(credentials: any): Observable<any> {
    const { email, password } = credentials;
    
    if (!email || !password) {
      return this.createErrorResponse(400, 'Email and password are required');
    }

    const expectedPassword = MOCK_CREDENTIALS[email as keyof typeof MOCK_CREDENTIALS];
    if (!expectedPassword || expectedPassword !== password) {
      return this.createErrorResponse(401, 'Invalid credentials');
    }

    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      return this.createErrorResponse(404, 'User not found');
    }

    this.currentUser = user;
    
    return this.createSuccessResponse({
      accessToken: this.sessionToken,
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: user
    });
  }

  private handleRegister(userData: any): Observable<any> {
    const { email, password, firstName, lastName } = userData;
    
    if (!email || !password || !firstName || !lastName) {
      return this.createErrorResponse(400, 'All fields are required');
    }

    // Check if user already exists
    if (MOCK_USERS.find(u => u.email === email)) {
      return this.createErrorResponse(409, 'User already exists');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      firstName,
      lastName,
      preferences: {
        preferredEventFormat: 'HYBRID' as const,
        industry: 'Technology',
        language: 'en',
        timezone: 'UTC'
      },
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    MOCK_USERS.push(newUser);
    MOCK_CREDENTIALS[email as keyof typeof MOCK_CREDENTIALS] = password;
    this.currentUser = newUser;

    return this.createSuccessResponse({
      accessToken: this.sessionToken,
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: newUser
    });
  }

  private handleLogout(): Observable<any> {
    return this.createSuccessResponse({ message: 'Logged out successfully' });
  }

  private handleRefreshToken(body: any): Observable<any> {
    return this.createSuccessResponse({
      accessToken: 'new-' + this.sessionToken,
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: this.currentUser
    });
  }

  // User handlers
  private handleGetCurrentUser(): Observable<any> {
    return this.createSuccessResponse(this.currentUser);
  }

  private handleUpdateUser(updateData: any): Observable<any> {
    Object.assign(this.currentUser, updateData);
    this.currentUser.updatedAt = new Date();
    return this.createSuccessResponse(this.currentUser);
  }

  // Concept handlers
  private handleGetConcepts(params: any): Observable<any> {
    let filteredConcepts = this.concepts;
    
    // Filter by user (assuming concepts belong to current user)
    filteredConcepts = filteredConcepts.filter(c => c.userId === this.currentUser.id);
    
    // Filter by status if provided
    if (params?.status) {
      filteredConcepts = filteredConcepts.filter(c => c.status === params.status);
    }
    
    // Filter by tags if provided
    if (params?.tags) {
      const tags = Array.isArray(params.tags) ? params.tags : [params.tags];
      filteredConcepts = filteredConcepts.filter(c => 
        tags.some((tag: string) => c.tags.includes(tag))
      );
    }

    return this.createSuccessResponse(filteredConcepts);
  }

  private handleCreateConcept(conceptData: any): Observable<any> {
    const newConcept = {
      id: `concept-${Date.now()}`,
      title: conceptData.title,
      description: conceptData.description,
      status: 'DRAFT' as const,
      eventDetails: conceptData.initialRequirements ? {
        theme: conceptData.initialRequirements.theme,
        format: conceptData.initialRequirements.preferredFormat || 'HYBRID',
        capacity: conceptData.initialRequirements.expectedCapacity,
        duration: conceptData.initialRequirements.duration,
        startDate: conceptData.initialRequirements.startDate ? new Date(conceptData.initialRequirements.startDate) : undefined,
        endDate: conceptData.initialRequirements.endDate ? new Date(conceptData.initialRequirements.endDate) : undefined,
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
    return this.createSuccessResponse(newConcept);
  }

  private handleGetConcept(conceptId: string): Observable<any> {
    const concept = this.concepts.find(c => c.id === conceptId);
    if (!concept) {
      return this.createErrorResponse(404, 'Concept not found');
    }
    return this.createSuccessResponse(concept);
  }

  private handleUpdateConcept(conceptId: string, updateData: any): Observable<any> {
    const conceptIndex = this.concepts.findIndex(c => c.id === conceptId);
    if (conceptIndex === -1) {
      return this.createErrorResponse(404, 'Concept not found');
    }

    const updatedConcept = {
      ...this.concepts[conceptIndex],
      ...updateData,
      updatedAt: new Date(),
      lastModifiedBy: this.currentUser.id,
      version: this.concepts[conceptIndex].version + 1
    };

    this.concepts[conceptIndex] = updatedConcept;
    return this.createSuccessResponse(updatedConcept);
  }

  private handleDeleteConcept(conceptId: string): Observable<any> {
    const conceptIndex = this.concepts.findIndex(c => c.id === conceptId);
    if (conceptIndex === -1) {
      return this.createErrorResponse(404, 'Concept not found');
    }

    this.concepts.splice(conceptIndex, 1);
    return this.createSuccessResponse({ message: 'Concept deleted successfully' });
  }

  // Chat handlers
  private handleSendChatMessage(chatData: any): Observable<any> {
    const { message, conceptId } = chatData;
    
    // Create user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
      conversationId: conceptId || 'general'
    };

    this.chatMessages.push(userMessage);

    // Generate AI response
    const aiResponse = generateMockChatResponse(message, conceptId);
    const aiMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant' as const,
      content: aiResponse.response,
      timestamp: new Date(),
      conversationId: conceptId || 'general'
    };

    this.chatMessages.push(aiMessage);

    return this.createSuccessResponse({
      message: aiMessage,
      ...aiResponse
    });
  }

  private handleGetChatHistory(params: any): Observable<any> {
    const conceptId = params?.conceptId;
    let messages = this.chatMessages;
    
    if (conceptId) {
      messages = messages.filter(m => m.conversationId === conceptId);
    }

    return this.createSuccessResponse(messages);
  }

  // Document handlers
  private handleUploadDocument(formData: any): Observable<any> {
    // Simulate file upload processing
    const mockResult = {
      documentId: `doc-${Date.now()}`,
      filename: 'uploaded_file.pdf',
      size: 1234567,
      mimeType: 'application/pdf',
      uploadedAt: new Date(),
      status: 'QUEUED' as const
    };

    return this.createSuccessResponse(mockResult);
  }

  private handleGetDocuments(params: any): Observable<any> {
    let filteredDocs = this.documents;
    
    if (params?.status) {
      filteredDocs = getDocumentsByStatus(params.status);
    }
    
    if (params?.type) {
      filteredDocs = getDocumentsByType(params.type);
    }

    return this.createSuccessResponse(filteredDocs);
  }

  private handleDeleteDocument(documentId: string): Observable<any> {
    const docIndex = this.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) {
      return this.createErrorResponse(404, 'Document not found');
    }

    this.documents.splice(docIndex, 1);
    return this.createSuccessResponse({ message: 'Document deleted successfully' });
  }

  // Helper methods
  private extractId(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  private createSuccessResponse(data: any): Observable<HttpResponse<any>> {
    return of(new HttpResponse({
      status: 200,
      body: data
    }));
  }

  private createErrorResponse(status: number, message: string): Observable<never> {
    return throwError(() => new HttpErrorResponse({
      status,
      statusText: message,
      error: { message }
    }));
  }
} 